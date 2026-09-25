
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'livelihood_applications.json');

function generateReference(qcid) {
  if (qcid && String(qcid).trim()) return String(qcid).trim();
  return '110000116932100';
}

async function getUniqueLivelihoodReference(baseRef) {
  let clean = String(baseRef || '').trim() || generateReference();
  let candidate = clean;
  let attempt = 0;
  try {
    while (attempt < 50) {
      const existing = await db.query(
        'SELECT id FROM livelihood_applications WHERE reference_number = $1',
        [candidate]
      );
      const inMem = memoryApplications.some((a) => a.reference_number === candidate || a.referenceNumber === candidate);
      if ((!existing || existing.rows.length === 0) && !inMem) {
        return candidate;
      }
      attempt++;
      candidate = `${clean}-${attempt}`;
    }
  } catch (e) {
    console.warn('getUniqueLivelihoodReference check warning:', e.message);
  }
  return candidate;
}

function loadPersistentApps() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading persistent livelihood applications:', err.message);
  }
  return [];
}

function savePersistentApps(apps) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving persistent livelihood applications:', err.message);
  }
}

let memoryApplications = loadPersistentApps() || [];

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    let year, month, day;

    const str = String(dateStr).trim();
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
    } else {
      const usMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (usMatch) {
        month = parseInt(usMatch[1], 10) - 1;
        day = parseInt(usMatch[2], 10);
        year = parseInt(usMatch[3], 10);
      } else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    }

    let hours = 9;
    let minutes = 0;

    if (timeStr) {
      const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }

    const targetUtcMs = Date.UTC(year, month, day, hours - 8, minutes, 0, 0);
    return new Date(targetUtcMs);
  } catch {
    return null;
  }
}

async function autoReleaseScheduledLivelihood() {
  try {
    const result = await db.query(
      `SELECT id, reference_number, assistance, monitoring FROM livelihood_applications 
       WHERE LOWER(COALESCE(assistance->>'assistance_status', '')) = 'for_release'`
    );

    const now = new Date();
    for (const app of result.rows) {
      const assist = typeof app.assistance === 'string' ? JSON.parse(app.assistance) : (app.assistance || {});
      if (!assist.release_date) continue;
      const scheduledDt = parseDateTime(assist.release_date, assist.release_time);
      if (scheduledDt && now.getTime() >= scheduledDt.getTime()) {
        assist.assistance_status = 'released';
        assist.released_at = now.toISOString();
        assist.released_by = assist.released_by || 'Automated Scheduled Release System';
        assist.updated_at = now.toISOString();

        let monitoring = Array.isArray(app.monitoring) ? app.monitoring : (typeof app.monitoring === 'string' ? JSON.parse(app.monitoring) : []);
        if (monitoring.length === 0) {
          monitoring.unshift({
            id: `MON-${Date.now()}`,
            application_id: app.id,
            reference_number: app.reference_number,
            monitoring_status: 'active',
            log_type: 'inspection',
            title: 'Initial Assistance Release & Monitoring Setup',
            notes: `Capital / Materials assistance automatically released at scheduled date and time (${assist.release_date} ${assist.release_time || ''}). Active monitoring initiated.`,
            officer_name: 'Automated Scheduled Release System',
            inspection_date: now.toISOString().split('T')[0],
            created_at: now.toISOString(),
          });
        }

        await db.query(
          `UPDATE livelihood_applications SET
            assistance = $1::jsonb,
            monitoring = $2::jsonb,
            updated_at = NOW()
          WHERE id = $3`,
          [JSON.stringify(assist), JSON.stringify(monitoring), app.id]
        );
      }
    }
  } catch (err) {}
}

setInterval(autoReleaseScheduledLivelihood, 30000);

exports.createApplication = async (req, res) => {
  try {
    const {
      userId = '110000116932100',
      qcid = '110000116932100',
      firstName,
      middleName = '',
      lastName,
      suffix = '',
      nationality = 'Filipino',
      dateOfBirth,
      age,
      gender,
      civilStatus,
      houseBuildingNo = '',
      streetName = '',
      barangay = '',
      phoneNumber = '',
      email = '',
      livelihoodType,
      livelihoodStatus,
      businessDescription,
      businessLocation,
      sameAsRegisteredAddress = false,
      assistanceNeeded = [],
      estimatedAmount = 0,
      reasonPurpose,
      requestedMaterials = [],
      requestedEquipment = [],
      uploadedDocuments = [],
    } = req.body;

    if (!firstName || !lastName || !livelihoodType || !livelihoodStatus || !businessDescription || !businessLocation || !reasonPurpose) {
      return res.status(400).json({
        success: false,
        message: 'Kailangan punan ang lahat ng required fields bago magsumite.',
      });
    }

    const baseRef = req.body.referenceNumber || req.body.reference_number || req.body.qcidNumber || req.body.qcidNo || req.body.qcId || generateReference(req.body.qcidNumber || req.body.qcidNo || req.body.qcId);
    const referenceNumber = await getUniqueLivelihoodReference(baseRef);
    const parsedAge = age ? parseInt(age, 10) : null;
    const parsedAmount = estimatedAmount ? parseFloat(String(estimatedAmount).replace(/[^0-9.]/g, '')) || 15000 : 15000;

    let savedApp;

    try {
      await db.query(`ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_materials JSONB DEFAULT '[]'`);
      await db.query(`ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_equipment JSONB DEFAULT '[]'`);

      const result = await db.query(
        `INSERT INTO livelihood_applications (
          reference_number, user_id, application_status,
          qcid, first_name, middle_name, last_name, suffix, nationality,
          date_of_birth, age, gender, civil_status,
          house_building_no, street_name, barangay, phone_number, email,
          livelihood_type, livelihood_status, business_description, business_location, same_as_registered_address,
          assistance_needed, estimated_amount, reason_purpose, requested_materials, requested_equipment, uploaded_documents
        ) VALUES (
          $1, $2, 'under_review',
          $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28
        ) RETURNING *`,
        [
          referenceNumber, userId,
          qcid, firstName, middleName, lastName, suffix, nationality,
          dateOfBirth, parsedAge, gender, civilStatus,
          houseBuildingNo, streetName, barangay, phoneNumber, email,
          livelihoodType, livelihoodStatus, businessDescription, businessLocation, Boolean(sameAsRegisteredAddress),
          JSON.stringify(assistanceNeeded), parsedAmount, reasonPurpose,
          JSON.stringify(requestedMaterials), JSON.stringify(requestedEquipment),
          JSON.stringify(uploadedDocuments),
        ]
      );
      savedApp = result.rows[0];
    } catch (dbErr) {
      console.warn('Postgres unavailable, saving to memory:', dbErr.message);
      savedApp = {
        id: memoryApplications.length + 1,
        reference_number: referenceNumber,
        user_id: userId,
        application_status: 'under_review',
        qcid,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix,
        nationality,
        date_of_birth: dateOfBirth,
        age: parsedAge,
        gender,
        civil_status: civilStatus,
        house_building_no: houseBuildingNo,
        street_name: streetName,
        barangay,
        phone_number: phoneNumber,
        email,
        livelihood_type: livelihoodType,
        livelihood_status: livelihoodStatus,
        business_description: businessDescription,
        business_location: businessLocation,
        same_as_registered_address: Boolean(sameAsRegisteredAddress),
        assistance_needed: assistanceNeeded,
        estimated_amount: parsedAmount,
        reason_purpose: reasonPurpose,
        requested_materials: requestedMaterials,
        requested_equipment: requestedEquipment,
        uploaded_documents: uploadedDocuments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryApplications.unshift(savedApp);
      savePersistentApps(memoryApplications);
    }

    try {
      const { ensureBeneficiaryForUser } = require('./beneficiaryController');
      ensureBeneficiaryForUser({
        userId,
        qcid: qcid || referenceNumber,
        fullName: `${firstName || ''} ${lastName || ''}`.trim(),
        firstName,
        middleName,
        lastName,
        suffix,
        age: parsedAge,
        sex: gender,
        civilStatus,
        birthDate: dateOfBirth,
        address: `${houseBuildingNo || ''} ${streetName || ''} ${barangay || ''}`.trim(),
        contactNo: phoneNumber,
        email,
        idType: 'QCitizen ID',
        idNumber: qcid || referenceNumber,
        program: 'Livelihood',
        applicationRef: savedApp.reference_number,
        action: 'Application submitted',
        remarks: `Livelihood Assistance application submitted for ${livelihoodType || 'Micro-Enterprise'}.`,
        performedBy: `${firstName || ''} ${lastName || ''}`.trim(),
      }).catch(() => {});
    } catch {}

    return res.status(201).json({
      success: true,
      message: 'Matagumpay na naisumite ang iyong Livelihood Program Application.',
      application: savedApp,
    });
  } catch (err) {
    console.error('Error creating livelihood application:', err);
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    await autoReleaseScheduledLivelihood();
    const { userId, qcid, status } = req.query;
    let query = 'SELECT * FROM livelihood_applications';
    const params = [];
    const conditions = [];

    if (userId) {
      params.push(userId);
      conditions.push(`(user_id = $${params.length} OR qcid = $${params.length} OR reference_number = $${params.length} OR reference_number LIKE $${params.length} || '-%')`);
    } else if (qcid) {
      params.push(qcid);
      conditions.push(`(qcid = $${params.length} OR user_id = $${params.length} OR reference_number = $${params.length} OR reference_number LIKE $${params.length} || '-%')`);
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`application_status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY created_at DESC';

    try {
      const result = await db.query(query, params);
      const apps = result.rows;

      for (const app of apps) {
        if (app.assistance && typeof app.assistance === 'string') {
          try { app.assistance = JSON.parse(app.assistance); } catch (_) {}
        }
        if (!app.assistance || Object.keys(app.assistance).length === 0) {
          app.assistance = null;
        }

        if (app.monitoring && typeof app.monitoring === 'string') {
          try { app.monitoring = JSON.parse(app.monitoring); } catch (_) {}
        }
        if (!Array.isArray(app.monitoring)) {
          app.monitoring = [];
        }

        const disbCheck = await db.query(
          `SELECT f.*, a.scheduled_date, a.scheduled_time, a.office_location, a.status as appointment_status
           FROM financial_aid_disbursements f
           LEFT JOIN appointments a ON f.application_ref = a.reference_no
           WHERE f.application_ref = $1 LIMIT 1`,
          [app.reference_number]
        );

        if (disbCheck.rows.length > 0) {
          const disb = disbCheck.rows[0];
          app.financial_aid_disbursement = disb;

          if (app.assistance) {
            if (disb.scheduled_date) app.assistance.release_date = disb.scheduled_date;
            if (disb.scheduled_time) app.assistance.release_time = disb.scheduled_time;
            if (disb.office_location || disb.venue) app.assistance.release_location = disb.office_location || disb.venue;

            if (disb.status === 'RELEASED') {
              app.assistance.assistance_status = 'released';
              app.assistance.release_status = 'RELEASED';
            } else if (disb.scheduled_date) {
              app.assistance.assistance_status = 'for_release';
            }
          }
        }
      }

      return res.json({ success: true, applications: apps });
    } catch (dbErr) {
      console.warn('Falling back to memoryApplications:', dbErr.message);
      let filtered = [...memoryApplications];
      if (userId) filtered = filtered.filter((a) => a.user_id === userId);
      else if (qcid) filtered = filtered.filter((a) => a.qcid === qcid);
      if (status && status !== 'all') filtered = filtered.filter((a) => a.application_status === status);

      return res.json({ success: true, applications: filtered });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.getApplicationByReference = async (req, res) => {
  try {
    await autoReleaseScheduledLivelihood();
    const { referenceNumber } = req.params;

    try {
      const result = await db.query('SELECT * FROM livelihood_applications WHERE reference_number = $1', [referenceNumber]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const app = result.rows[0];
      if (app.assistance && typeof app.assistance === 'string') {
        try { app.assistance = JSON.parse(app.assistance); } catch (_) {}
      }
      if (!app.assistance || Object.keys(app.assistance).length === 0) {
        app.assistance = null;
      }

      if (app.monitoring && typeof app.monitoring === 'string') {
        try { app.monitoring = JSON.parse(app.monitoring); } catch (_) {}
      }
      if (!Array.isArray(app.monitoring)) {
        app.monitoring = [];
      }

      const disbCheck = await db.query(
        `SELECT f.*, a.scheduled_date, a.scheduled_time, a.office_location, a.status as appointment_status
         FROM financial_aid_disbursements f
         LEFT JOIN appointments a ON f.application_ref = a.reference_no
         WHERE f.application_ref = $1 LIMIT 1`,
        [app.reference_number]
      );

      if (disbCheck.rows.length > 0) {
        const disb = disbCheck.rows[0];
        app.financial_aid_disbursement = disb;

        if (app.assistance) {
          if (disb.scheduled_date) app.assistance.release_date = disb.scheduled_date;
          if (disb.scheduled_time) app.assistance.release_time = disb.scheduled_time;
          if (disb.office_location || disb.venue) app.assistance.release_location = disb.office_location || disb.venue;

          if (disb.status === 'RELEASED') {
            app.assistance.assistance_status = 'released';
            app.assistance.release_status = 'RELEASED';
          } else if (disb.scheduled_date) {
            app.assistance.assistance_status = 'for_release';
          }
        }
      }

      return res.json({ success: true, application: app });
    } catch (dbErr) {
      const found = memoryApplications.find((a) => a.reference_number === referenceNumber);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      return res.json({ success: true, application: found });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      dateOfBirth,
      age,
      gender,
      civilStatus,
      houseBuildingNo,
      streetName,
      barangay,
      phoneNumber,
      email,
      livelihoodType,
      livelihoodStatus,
      businessDescription,
      businessLocation,
      sameAsRegisteredAddress,
      assistanceNeeded,
      estimatedAmount,
      reasonPurpose,
      uploadedDocuments,
      resubmit = true,
    } = req.body;

    const newStatus = resubmit ? 'under_review' : undefined;
    const parsedAmount = estimatedAmount ? parseFloat(String(estimatedAmount).replace(/[^0-9.]/g, '')) || 0 : 0;

    try {
      const result = await db.query(
        `UPDATE livelihood_applications SET
          first_name = COALESCE($1, first_name),
          middle_name = COALESCE($2, middle_name),
          last_name = COALESCE($3, last_name),
          suffix = COALESCE($4, suffix),
          date_of_birth = COALESCE($5, date_of_birth),
          age = COALESCE($6, age),
          gender = COALESCE($7, gender),
          civil_status = COALESCE($8, civil_status),
          house_building_no = COALESCE($9, house_building_no),
          street_name = COALESCE($10, street_name),
          barangay = COALESCE($11, barangay),
          phone_number = COALESCE($12, phone_number),
          email = COALESCE($13, email),
          livelihood_type = COALESCE($14, livelihood_type),
          livelihood_status = COALESCE($15, livelihood_status),
          business_description = COALESCE($16, business_description),
          business_location = COALESCE($17, business_location),
          same_as_registered_address = COALESCE($18, same_as_registered_address),
          assistance_needed = COALESCE($19, assistance_needed),
          estimated_amount = COALESCE($20, estimated_amount),
          reason_purpose = COALESCE($21, reason_purpose),
          uploaded_documents = COALESCE($22, uploaded_documents),
          application_status = COALESCE($23, application_status),
          updated_at = NOW()
        WHERE id::text = $24::text OR reference_number = $24::text
        RETURNING *`,
        [
          firstName, middleName, lastName, suffix,
          dateOfBirth, age, gender, civilStatus,
          houseBuildingNo, streetName, barangay, phoneNumber, email,
          livelihoodType, livelihoodStatus, businessDescription, businessLocation, sameAsRegisteredAddress,
          assistanceNeeded ? JSON.stringify(assistanceNeeded) : null,
          parsedAmount,
          reasonPurpose,
          uploadedDocuments ? JSON.stringify(uploadedDocuments) : null,
          newStatus,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      return res.json({
        success: true,
        message: 'Matagumpay na nai-update at naisumite muli ang iyong application.',
        application: result.rows[0],
      });
    } catch (dbErr) {
      const idx = memoryApplications.findIndex((a) => String(a.id) === String(id) || a.reference_number === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      memoryApplications[idx] = {
        ...memoryApplications[idx],
        ...req.body,
        application_status: newStatus || memoryApplications[idx].application_status,
        updated_at: new Date().toISOString(),
      };
      savePersistentApps(memoryApplications);

      return res.json({
        success: true,
        message: 'Matagumpay na nai-update at naisumite muli ang iyong application.',
        application: memoryApplications[idx],
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      approvedBy = 'Administrator',
      rejectionReason,
      revisionNotes,
      adminNotes,
    } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const isApproved = status === 'approved';

    try {
      const checkRes = await db.query(
        'SELECT id, reference_number FROM livelihood_applications WHERE id::text = $1::text OR reference_number = $1::text',
        [id]
      );
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      const targetApp = checkRes.rows[0];

      try {
        await db.query(`
          ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
          ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS revision_notes TEXT;
          ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
          ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
          ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP WITH TIME ZONE;
        `);
      } catch (_) {}

      const result = await db.query(
        `UPDATE livelihood_applications SET
          application_status = $1::text,
          approved_by = COALESCE($2::text, approved_by),
          approved_date = COALESCE($3::timestamptz, approved_date),
          rejection_reason = $4::text,
          revision_notes = $5::text,
          admin_notes = $6::text,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
        [
          status,
          isApproved ? approvedBy : null,
          isApproved ? new Date() : null,
          rejectionReason || null,
          revisionNotes || null,
          adminNotes || null,
          targetApp.id,
        ]
      );

      const updated = result.rows[0];

      if (isApproved) {
        let currentAssistance = updated.assistance;
        if (typeof currentAssistance === 'string') {
          try { currentAssistance = JSON.parse(currentAssistance); } catch (_) {}
        }

        if (!currentAssistance || Object.keys(currentAssistance).length === 0) {
          let startMaterials = [
            { item: 'Starter Livelihood Supply Pack', quantity: '1 set', remarks: 'Standard initial allocation' },
          ];
          let startEquipment = [
            { equipment: 'Operational Kit / Tools', quantity: '1 unit', remarks: 'Standard package' },
          ];

          if (updated.requested_materials) {
            try {
              const parsedMat = typeof updated.requested_materials === 'string' ? JSON.parse(updated.requested_materials) : updated.requested_materials;
              if (Array.isArray(parsedMat) && parsedMat.length > 0 && parsedMat.some(m => m.item && m.item.trim())) {
                startMaterials = parsedMat.filter(m => m.item && m.item.trim()).map(m => ({ item: m.item, quantity: m.quantity || '1 set', remarks: 'Hinihiling ng Aplikante' }));
              }
            } catch (_) {}
          }

          if (updated.requested_equipment) {
            try {
              const parsedEq = typeof updated.requested_equipment === 'string' ? JSON.parse(updated.requested_equipment) : updated.requested_equipment;
              if (Array.isArray(parsedEq) && parsedEq.length > 0 && parsedEq.some(e => e.equipment && e.equipment.trim())) {
                startEquipment = parsedEq.filter(e => e.equipment && e.equipment.trim()).map(e => ({ equipment: e.equipment, quantity: e.quantity || '1 unit', remarks: 'Hinihiling ng Aplikante' }));
              }
            } catch (_) {}
          }

          const defaultAssistance = {
            id: `ASST-${updated.id}`,
            application_id: updated.id,
            reference_number: updated.reference_number,
            assistance_status: 'for_processing',
            approved_financial_amount: Number(updated.estimated_amount) > 0 ? Number(updated.estimated_amount) : 15000,
            approved_materials: startMaterials,
            approved_equipment: startEquipment,
            release_date: 'To be announced',
            release_time: '8:00 AM - 4:00 PM',
            release_location: 'Quezon City Hall - SSDD Livelihood Center',
            instructions: 'Magdala ng valid QCID at copy ng approved application summary.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await db.query(
            `UPDATE livelihood_applications SET assistance = $1::jsonb WHERE id = $2`,
            [JSON.stringify(defaultAssistance), updated.id]
          ).catch(() => {});
          updated.assistance = defaultAssistance;
        }

        const disbCheck = await db.query('SELECT id FROM financial_aid_disbursements WHERE application_ref = $1', [updated.reference_number]);
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)`,
            [
              disbId,
              updated.reference_number,
              `${updated.first_name || ''} ${updated.last_name || ''}`.trim().toUpperCase() || 'BENEFICIARY',
              'Livelihood Capital Assistance',
              Number(updated.estimated_amount) > 0 ? Number(updated.estimated_amount) : 15000,
              new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall - SSDD Livelihood Center',
              'Approved Livelihood Seed Capital Assistance. Ready for Appointment scheduling and payout.',
            ]
          );
        }

        const apptCheck = await db.query('SELECT id FROM appointments WHERE reference_no = $1', [updated.reference_number]);
        if (apptCheck.rows.length === 0) {
          const fullName = `${updated.first_name || ''} ${updated.last_name || ''}`.trim().toUpperCase() || 'BENEFICIARY';
          await db.query(
            `INSERT INTO appointments
              (reference_no, module, applicant_name, concern, status, office_location, notes)
             VALUES ($1, 'Livelihood', $2, 'Livelihood Capital Assistance', 'pending', 'Quezon City Hall - SSDD Livelihood Center', 'Awtomatikong pumasok mula sa na-aprubahang Livelihood application para sa scheduling.')
             ON CONFLICT DO NOTHING`,
            [updated.reference_number, fullName]
          );
        }
      }

    } catch (dbErr) {
      console.error('Database error in updateStatus:', dbErr.message);
      const idx = memoryApplications.findIndex((a) => String(a.id) === String(id) || a.reference_number === id);
      if (idx === -1) {
        return res.status(500).json({ success: false, message: 'Database error updating status', error: dbErr.message });
      }

      memoryApplications[idx].application_status = status;
      if (isApproved) {
        memoryApplications[idx].approved_by = approvedBy;
        memoryApplications[idx].approved_date = new Date().toISOString();
        if (!memoryApplications[idx].assistance) {
          memoryApplications[idx].assistance = {
            id: `ASST-${memoryApplications[idx].id}`,
            application_id: memoryApplications[idx].id,
            reference_number: memoryApplications[idx].reference_number,
            beneficiary_id: memoryApplications[idx].user_id || memoryApplications[idx].qcid || `QC-${memoryApplications[idx].id}`,
            assistance_status: 'for_processing',
            release_status: 'NOT RELEASED',
            approved_financial_amount: memoryApplications[idx].estimated_amount || 15000,
            approved_materials: [],
            approved_equipment: [],
            release_date: '',
            release_time: '',
            release_location: 'Quezon City Hall - SSDD Livelihood Center',
            instructions: 'Please bring a valid ID and your Livelihood Application Reference Number.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }
      if (rejectionReason) memoryApplications[idx].rejection_reason = rejectionReason;
      if (revisionNotes) memoryApplications[idx].revision_notes = revisionNotes;
      if (adminNotes) memoryApplications[idx].admin_notes = adminNotes;
      memoryApplications[idx].updated_at = new Date().toISOString();

      savePersistentApps(memoryApplications);

      return res.json({ success: true, message: `Status updated to ${status}`, application: memoryApplications[idx] });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.saveAssistance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      assistanceStatus = 'for_processing',
      approvedFinancialAmount = 0,
      approvedMaterials = [],
      approvedEquipment = [],
      releaseDate,
      releaseTime,
      releaseLocation = 'Quezon City Hall - SSDD Livelihood Center',
      instructions = 'Magdala ng orihinal na QCID at 1 valid government ID.',
      releasedBy,
    } = req.body;

    const parsedAmount = approvedFinancialAmount ? (parseFloat(String(approvedFinancialAmount).replace(/[^0-9.]/g, '')) || 15000) : 15000;
    const scheduledDt = parseDateTime(releaseDate, releaseTime);
    const isScheduledPast = scheduledDt && new Date().getTime() >= scheduledDt.getTime();
    const finalAssistanceStatus = (assistanceStatus === 'released' || isScheduledPast)
      ? 'released'
      : (releaseDate && releaseTime ? 'for_release' : assistanceStatus);
    const releasedAt = finalAssistanceStatus === 'released' ? new Date() : null;

    try {
      const appRes = await db.query('SELECT id, reference_number, assistance, monitoring FROM livelihood_applications WHERE id::text = $1::text OR reference_number = $1::text', [id]);
      if (appRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      const app = appRes.rows[0];

      let currentAssist = app.assistance || {};
      if (typeof currentAssist === 'string') {
        try { currentAssist = JSON.parse(currentAssist); } catch (_) {}
      }
      let currentMonitoring = Array.isArray(app.monitoring) ? app.monitoring : (typeof app.monitoring === 'string' ? JSON.parse(app.monitoring) : []);

      const savedAssist = {
        ...currentAssist,
        id: currentAssist.id || `ASST-${app.id}`,
        application_id: app.id,
        reference_number: app.reference_number,
        assistance_status: finalAssistanceStatus,
        release_status: finalAssistanceStatus === 'released' ? 'RELEASED' : 'NOT RELEASED',
        approved_financial_amount: parsedAmount,
        approved_materials: approvedMaterials || currentAssist.approved_materials || [],
        approved_equipment: approvedEquipment || currentAssist.approved_equipment || [],
        release_date: releaseDate || currentAssist.release_date || null,
        release_time: releaseTime || currentAssist.release_time || null,
        release_location: releaseLocation || currentAssist.release_location || 'Quezon City Hall - SSDD Livelihood Center',
        instructions: instructions || currentAssist.instructions || null,
        released_at: finalAssistanceStatus === 'released' ? (releasedAt ? releasedAt.toISOString() : new Date().toISOString()) : currentAssist.released_at,
        released_by: finalAssistanceStatus === 'released' ? (releasedBy || 'SSDD Admin') : currentAssist.released_by,
        updated_at: new Date().toISOString(),
      };

      if (finalAssistanceStatus === 'released' && currentMonitoring.length === 0) {
        currentMonitoring.unshift({
          id: `MON-${Date.now()}`,
          application_id: app.id,
          reference_number: app.reference_number,
          monitoring_status: 'active',
          log_type: 'inspection',
          title: 'Initial Assistance Release & Monitoring Setup',
          notes: 'Capital / Materials assistance has been officially released to beneficiary. Active livelihood monitoring is now initiated.',
          officer_name: releasedBy || 'SSDD Admin',
          inspection_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });
      }

      await db.query(
        `UPDATE livelihood_applications SET
          assistance = $1::jsonb,
          monitoring = $2::jsonb,
          updated_at = NOW()
        WHERE id = $3`,
        [JSON.stringify(savedAssist), JSON.stringify(currentMonitoring), app.id]
      );

      try {
        await db.query(
          `UPDATE financial_aid_disbursements
           SET fixed_amount = $1,
               updated_at = NOW()
           WHERE application_ref = $2`,
          [parsedAmount, app.reference_number]
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: 'Assistance details updated successfully.',
        assistance: savedAssist,
      });
    } catch (dbErr) {
      console.error('Database error in saveAssistance:', dbErr.message);
      const target = memoryApplications.find((a) => String(a.id) === String(id) || a.reference_number === id);
      if (!target) {
        return res.status(500).json({ success: false, message: 'Database error in saveAssistance', error: dbErr.message });
      }

      const isReleased = assistanceStatus === 'released';
      target.assistance = {
        ...(target.assistance || {}),
        id: target.assistance?.id || `ASST-${target.id}`,
        application_id: target.id,
        reference_number: target.reference_number,
        beneficiary_id: target.user_id || target.qcid || `QC-${target.id}`,
        assistance_status: assistanceStatus,
        release_status: isReleased ? 'RELEASED' : 'NOT RELEASED',
        approved_financial_amount: parsedAmount,
        approved_materials: approvedMaterials,
        approved_equipment: approvedEquipment,
        release_date: releaseDate,
        release_time: releaseTime,
        release_location: releaseLocation,
        instructions: instructions,
        released_at: isReleased ? (releasedAt ? releasedAt.toISOString() : new Date().toISOString()) : target.assistance?.released_at,
        released_by: releasedBy || target.assistance?.released_by,
        updated_at: new Date().toISOString(),
      };

      if (isReleased) {
        if (!target.monitoring || target.monitoring.length === 0) {
          target.monitoring = [
            {
              id: `MON-${Date.now()}`,
              application_id: target.id,
              reference_number: target.reference_number,
              capital_materials_id: target.assistance.id,
              beneficiary_id: target.user_id || target.qcid || `QC-${target.id}`,
              monitoring_status: 'ACTIVE',
              log_type: 'inspection',
              title: 'Initial Assistance Release & Monitoring Setup',
              notes: 'Capital / Materials assistance has been officially released to beneficiary. Active livelihood monitoring is now initiated.',
              progress_update: 'Assistance officially released to beneficiary. Active livelihood monitoring initiated.',
              remarks: 'Initial monitoring record created upon assistance release.',
              officer_name: releasedBy || 'SSDD Admin',
              inspection_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
            },
          ];
        }
      }

      savePersistentApps(memoryApplications);

      return res.json({
        success: true,
        message: 'Assistance details updated successfully.',
        assistance: target.assistance,
        application: target,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.addMonitoringLog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monitoringStatus = 'active',
      status,
      logType = 'inspection',
      title,
      progressUpdate,
      notes,
      remarks,
      nextFollowUpDate,
      monthlySalesRange,
      challengesNeeds,
      officerName,
      inspectionDate,
      monitoringDate,
      photos = [],
    } = req.body;

    const finalStatus = (status || monitoringStatus || 'active').toLowerCase().replace(/[\s-]/g, '_');
    const finalDate = monitoringDate || inspectionDate || new Date().toISOString().split('T')[0];
    const finalTitle = progressUpdate || title || 'Monitoring Progress Update';
    const finalNotes = remarks
      ? `${progressUpdate ? 'Progress: ' + progressUpdate + '\n' : ''}${remarks}${nextFollowUpDate ? '\nNext Follow-up Date: ' + nextFollowUpDate : ''}`
      : (notes || '');

    try {
      const appRes = await db.query('SELECT id, reference_number, user_id, qcid, monitoring FROM livelihood_applications WHERE id::text = $1::text OR reference_number = $1::text', [id]);
      if (appRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      const app = appRes.rows[0];

      let currentMonitoring = Array.isArray(app.monitoring) ? app.monitoring : (typeof app.monitoring === 'string' ? JSON.parse(app.monitoring) : []);

      const newLog = {
        id: `MON-${Date.now()}`,
        application_id: app.id,
        reference_number: app.reference_number,
        monitoring_status: finalStatus,
        status: finalStatus,
        log_type: logType,
        title: finalTitle,
        notes: finalNotes,
        progress_update: progressUpdate || finalTitle,
        remarks: remarks || finalNotes,
        next_follow_up_date: nextFollowUpDate,
        monthly_sales_range: monthlySalesRange || '',
        challenges_needs: challengesNeeds || '',
        officer_name: officerName || 'SSDD Monitoring Officer',
        photos: photos || [],
        inspection_date: finalDate,
        created_at: new Date().toISOString(),
      };

      currentMonitoring.unshift(newLog);

      await db.query(
        `UPDATE livelihood_applications
         SET monitoring = $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(currentMonitoring), app.id]
      );

      return res.status(201).json({
        success: true,
        message: 'Monitoring progress update recorded successfully.',
        monitoringLog: newLog,
      });
    } catch (dbErr) {
      const target = memoryApplications.find(
        (a) =>
          String(a.id) === String(id) ||
          a.reference_number === id ||
          (id === 'LP-2026-2518' && (a.reference_number === 'LP-2026-2518' || a.reference_number === 'LP-2026-1042')) ||
          (id === 'LP-2026-1042' && (a.reference_number === 'LP-2026-2518' || a.reference_number === 'LP-2026-1042'))
      );
      if (!target) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const upperStatus = (status || monitoringStatus || 'ACTIVE').toUpperCase();

      const newLog = {
        id: `MON-${Date.now()}`,
        application_id: target.id,
        reference_number: target.reference_number,
        capital_materials_id: target.assistance ? target.assistance.id : null,
        beneficiary_id: target.user_id || target.qcid || `QC-${target.id}`,
        monitoring_status: upperStatus,
        status: upperStatus,
        log_type: logType,
        title: finalTitle,
        notes: finalNotes,
        progress_update: progressUpdate || finalTitle,
        remarks: remarks || finalNotes,
        next_follow_up_date: nextFollowUpDate,
        monthly_sales_range: monthlySalesRange || '',
        challenges_needs: challengesNeeds || '',
        officer_name: officerName || 'SSDD Monitoring Officer',
        photos: photos,
        inspection_date: finalDate,
        monitoring_date: finalDate,
        created_at: new Date().toISOString(),
      };

      if (!target.monitoring) target.monitoring = [];
      target.monitoring.unshift(newLog);
      target.monitoring_status = upperStatus;

      savePersistentApps(memoryApplications);

      return res.status(201).json({
        success: true,
        message: 'Monitoring progress update recorded successfully.',
        monitoringLog: newLog,
        application: target,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const files = req.files || [];
    const docType = req.body.docType || 'supportingDocs';

    const uploaded = files.map((file) => ({
      id: `${docType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: docType,
      label: file.originalname,
      original_filename: file.originalname,
      file_path: `/uploads/livelihood/${file.filename}`,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      message: `${files.length} document(s) uploaded successfully.`,
      documents: uploaded,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload error', details: err.message });
  }
};

exports.resetApplications = async (req, res) => {
  try {
    try {
      await db.query('DELETE FROM livelihood_applications');
      await db.query(`DELETE FROM appointments WHERE reference_no LIKE 'LP-%' OR module = 'Livelihood'`);
      await db.query(`DELETE FROM financial_aid_disbursements WHERE application_ref LIKE 'LP-%' OR assistance_type LIKE '%Livelihood%'`);
    } catch (dbErr) {
      console.warn('DB warning during resetApplications:', dbErr.message);
    }
    memoryApplications = [];
    savePersistentApps([]);
    return res.json({
      success: true,
      message: 'Matagumpay na nabura ang lahat ng livelihood applications at monitoring records.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Reset error', details: err.message });
  }
};

exports.runLivelihoodConsolidationMigration = async (req, res) => {
  try {
    await db.query(`
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_materials JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_equipment JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS assistance JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS monitoring JSONB DEFAULT '[]'::jsonb;

      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'livelihood_assistance') THEN
          UPDATE livelihood_applications la
          SET assistance = jsonb_build_object(
            'id', COALESCE(las.id::text, 'ASST-' || la.id::text),
            'application_id', la.id,
            'reference_number', la.reference_number,
            'assistance_status', COALESCE(las.assistance_status, 'for_processing'),
            'approved_financial_amount', COALESCE(las.approved_financial_amount, 0),
            'approved_materials', CASE WHEN las.approved_materials IS NOT NULL THEN las.approved_materials ELSE '[]'::jsonb END,
            'approved_equipment', CASE WHEN las.approved_equipment IS NOT NULL THEN las.approved_equipment ELSE '[]'::jsonb END,
            'release_date', las.release_date,
            'release_time', las.release_time,
            'release_location', COALESCE(las.release_location, 'Quezon City Hall - SSDD Livelihood Center'),
            'instructions', las.instructions,
            'released_at', las.released_at,
            'released_by', las.released_by,
            'created_at', las.created_at,
            'updated_at', las.updated_at
          )
          FROM livelihood_assistance las
          WHERE las.application_id = la.id OR las.reference_number = la.reference_number;

          DROP TABLE IF EXISTS livelihood_assistance CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'livelihood_monitoring') THEN
          UPDATE livelihood_applications la
          SET monitoring = COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', lm.id,
                'application_id', la.id,
                'reference_number', la.reference_number,
                'monitoring_status', COALESCE(lm.monitoring_status, 'active'),
                'log_type', COALESCE(lm.log_type, 'inspection'),
                'title', lm.title,
                'notes', lm.notes,
                'monthly_sales_range', lm.monthly_sales_range,
                'challenges_needs', lm.challenges_needs,
                'officer_name', lm.officer_name,
                'photos', CASE WHEN lm.photos IS NOT NULL THEN lm.photos ELSE '[]'::jsonb END,
                'inspection_date', lm.inspection_date,
                'created_at', lm.created_at
              ) ORDER BY lm.created_at DESC
            )
            FROM livelihood_monitoring lm
            WHERE lm.application_id = la.id OR lm.reference_number = la.reference_number
          ), '[]'::jsonb);

          DROP TABLE IF EXISTS livelihood_monitoring CASCADE;
        END IF;
      END $$;
    `);

    return res.json({
      success: true,
      message: 'Livelihood assistance and monitoring consolidated into livelihood_applications, and legacy tables dropped successfully!'
    });
  } catch (err) {
    console.error('Livelihood consolidation migration error:', err);
    return res.status(500).json({ error: 'Migration failed', details: err.message });
  }
};
