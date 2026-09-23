const db = require('../config/db');
const { logActivity } = require('./activityLogController');

const FIXED_ASSISTANCE_AMOUNTS = {
  'Medical Assistance': 5000,
  'Funeral Assistance': 10000,
  'Educational Assistance': 3000,
  'Burial Assistance': 10000,
  'Food Assistance': 1500,
  'Transportation Assistance': 1000,
  'PWD Social Assistance': 2000,
  'Senior Social Assistance': 2000,
  'Child Welfare Support': 5000,
  'Nutritional Assistance': 5000,
  'Nutritional Assistance (Child Welfare)': 5000,
  'Child Protection Assistance': 5000,
  'Emergency Assistance': 5000,
  'Child Welfare Assistance': 5000,
  'Solo Parent Welfare Assistance': 5000,
  'Solo Parent Assistance': 5000,
  'Livelihood Capital Assistance': 15000,
  'Livelihood Assistance': 15000,
  'Livelihood Program': 15000,
};

function resolveFixedAmount(concern) {
  if (!concern) return 5000;
  const c = String(concern).trim();
  if (FIXED_ASSISTANCE_AMOUNTS[c]) return FIXED_ASSISTANCE_AMOUNTS[c];
  const clean = c.replace(/\s*assistance/gi, '').trim();
  const formatted = clean.charAt(0).toUpperCase() + clean.slice(1) + ' Assistance';
  if (FIXED_ASSISTANCE_AMOUNTS[formatted]) return FIXED_ASSISTANCE_AMOUNTS[formatted];

  const lower = c.toLowerCase();
  if (lower.includes('funeral') || lower.includes('burial')) return 10000;
  if (lower.includes('livelihood')) return 15000;
  if (lower.includes('nutrition') || lower.includes('child') || lower.includes('medical') || lower.includes('emergency') || lower.includes('solo')) return 5000;
  if (lower.includes('education')) return 3000;
  if (lower.includes('pwd') || lower.includes('senior')) return 2000;
  if (lower.includes('food')) return 1500;
  if (lower.includes('transport')) return 1000;
  return 5000;
}

async function initAppointmentTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(100) NOT NULL,
        module VARCHAR(100) NOT NULL,
        applicant_name VARCHAR(255) NOT NULL,
        concern VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        scheduled_date VARCHAR(100),
        scheduled_time VARCHAR(100),
        office_location VARCHAR(255) DEFAULT 'Quezon City Hall',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_appointments_ref ON appointments(reference_no);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

      CREATE TABLE IF NOT EXISTS deleted_appointments (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(100) UNIQUE NOT NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.warn('[Appointments init tables]:', e.message);
  }
}
initAppointmentTables();

let lastAppointmentSyncTime = 0;
let isAppointmentSyncInProgress = false;

async function syncAndCleanAppointments() {
  try {
    const deletedRes = await db.query('SELECT reference_no FROM deleted_appointments').catch(() => ({ rows: [] }));
    const deletedSet = new Set(deletedRes.rows.map((r) => String(r.reference_no).toLowerCase().trim()));

    // 1. Clean up ONLY rejected/denied AICS appointments
    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS' AND reference_no IN (
        SELECT reference_no FROM aics_applications 
        WHERE status IN ('rejected', 'denied', 'disapproved')
      )
    `).catch(() => {});

    // 2. Clean up rejected applications for other modules
    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen') AND reference_no IN (
        SELECT reference_number FROM pwd_senior_applications WHERE status IN ('rejected', 'denied', 'disapproved')
      )
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module = 'Livelihood' AND reference_no IN (
        SELECT reference_number FROM livelihood_applications WHERE application_status IN ('rejected', 'disapproved')
      )
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module = 'Child Welfare' AND reference_no IN (
        SELECT reference_number FROM child_welfare_applications WHERE application_status IN ('rejected', 'disapproved')
      )
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE status IN ('rejected', 'denied', 'disapproved')
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments a
      USING appointments b
      WHERE a.id < b.id AND a.reference_no = b.reference_no AND a.concern = b.concern
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE LOWER(COALESCE(concern, '')) LIKE '%id%'
         OR LOWER(COALESCE(concern, '')) LIKE '%booklet%'
         OR (module IN ('PWD', 'Senior Citizen', 'Solo Parent') AND LOWER(COALESCE(concern, '')) NOT LIKE '%assist%')
    `).catch(() => {});

    await db.query(`
      UPDATE appointments
      SET status = 'pending', scheduled_date = NULL, scheduled_time = NULL
      WHERE (scheduled_date = '2026-09-19' OR scheduled_date ILIKE '%Sep 19%' OR scheduled_date ILIKE '%2026-09-19%'
          OR scheduled_date = '2026-09-15' OR scheduled_date ILIKE '%Sep 15%' OR scheduled_date ILIKE '%2026-09-15%'
          OR scheduled_date IS NULL OR scheduled_date = '')
        AND status NOT IN ('approved', 'completed', 'rejected', 'referred')
    `).catch(() => {});

    // Import active AICS applications (Medical, Funeral, Food, Educational, etc.)
    const activeAics = await db.query(
      `SELECT reference_no, assistance_type, first_name, middle_name, last_name, suffix, status
       FROM aics_applications
       WHERE status NOT IN ('rejected', 'denied', 'disapproved')`
    ).catch(() => ({ rows: [] }));

    for (const row of activeAics.rows) {
      const refNo = String(row.reference_no || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
      const rawType = (row.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim();
      const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + ' Assistance';
      const isApproved = ['approved', 'completed', 'for_release', 'released'].includes(row.status);
      const isReferred = ['for_referral', 'referred'].includes(row.status);
      const isSched = ['scheduled', 'under_review'].includes(row.status);
      const initStatus = isApproved ? 'approved' : isReferred ? 'referred' : isSched ? 'scheduled' : 'pending';
      await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes)
         SELECT $1, 'AICS', $2, $3, $4, NULL, NULL, 'Quezon City Hall', 'Awtomatikong pumasok mula sa AICS aplikasyon para sa scheduling at assessment.'
         WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reference_no = $1 AND concern = $3)`,
        [refNo, fullName, cleanType, initStatus]
      ).catch(() => {});
    }

    const approvedLivelihood = await db.query(
      `SELECT l.reference_number, l.first_name, l.last_name
       FROM livelihood_applications l
       INNER JOIN livelihood_assistance la ON l.reference_number = la.reference_number
       WHERE l.application_status = 'approved'
         AND (la.assistance_status = 'for_release' OR la.assistance_status = 'released' OR la.assistance_status = 'FOR RELEASE' OR la.assistance_status = 'RELEASED')`
    ).catch(() => ({ rows: [] }));

    for (const row of approvedLivelihood.rows) {
      const refNo = String(row.reference_number || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim().toUpperCase() || 'BENEFICIARY';
      await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         SELECT $1, 'Livelihood', $2, 'Livelihood Capital Assistance', 'pending', 'Quezon City Hall - SSDD Livelihood Center', 'Awtomatikong pumasok mula sa na-aprubahang Livelihood Capital allocation para sa appointment scheduling.'
         WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reference_no = $1 AND concern = 'Livelihood Capital Assistance')`,
        [refNo, fullName]
      ).catch(() => {});
    }

    const approvedPwdSenior = await db.query(
      `SELECT reference_number, category, type, first_name, middle_name, last_name, suffix
       FROM pwd_senior_applications
       WHERE status IN ('approved', 'completed', 'for_release')
         AND (type ILIKE '%assist%' OR category ILIKE '%assist%' OR disability_class ILIKE '%assist%' OR extra_data::text ILIKE '%assist%')`
    ).catch(() => ({ rows: [] }));

    for (const row of approvedPwdSenior.rows) {
      const refNo = String(row.reference_number || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const isPwd = String(row.category || '').toUpperCase().includes('PWD');
      const mod = isPwd ? 'PWD' : 'Senior Citizen';
      const concern = isPwd ? 'PWD Social Assistance' : 'Senior Social Assistance';
      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
      await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         SELECT $1, $2, $3, $4, 'pending', 'Quezon City Hall', 'Awtomatikong pumasok mula sa na-aprubahang Social Assistance aplikasyon para sa scheduling.'
         WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reference_no = $1 AND concern = $4)`,
        [refNo, mod, fullName, concern]
      ).catch(() => {});
    }

    const approvedCw = await db.query(
      `SELECT reference_number, category_title, guardian_first_name, guardian_last_name, child_name
       FROM child_welfare_applications
       WHERE application_status IN ('approved', 'completed', 'for_release', 'released')`
    ).catch(() => ({ rows: [] }));

    for (const row of approvedCw.rows) {
      const refNo = String(row.reference_number || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const fullName = [row.guardian_first_name, row.guardian_last_name].filter(Boolean).join(' ').trim().toUpperCase() || (row.child_name || '').toUpperCase() || 'BENEFICIARY';
      const concern = row.category_title ? `${row.category_title} (Child Welfare)` : 'Child Welfare Support';
      await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         SELECT $1, 'Child Welfare', $2, $3, 'pending', 'Quezon City Hall - SSDD Child Welfare Section', 'Awtomatikong pumasok mula sa na-aprubahang Child Welfare aplikasyon para sa scheduling.'
         WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reference_no = $1 AND concern = $3)`,
        [refNo, fullName, concern]
      ).catch(() => {});
    }
  } catch (err) {
    console.warn('⚠️ Background appointment sync error:', err.message);
  }
}

function triggerAppointmentSyncIfStale() {
  const now = Date.now();
  if (isAppointmentSyncInProgress || (now - lastAppointmentSyncTime < 30 * 1000)) {
    return;
  }
  isAppointmentSyncInProgress = true;
  syncAndCleanAppointments()
    .then(() => {
      lastAppointmentSyncTime = Date.now();
    })
    .catch((err) => {
      console.warn('⚠️ Background appointment sync error:', err.message);
    })
    .finally(() => {
      isAppointmentSyncInProgress = false;
    });
}

exports.getAppointments = async (req, res) => {
  try {
    triggerAppointmentSyncIfStale();

    await db.query(`
      UPDATE appointments
      SET status = 'pending', scheduled_date = NULL, scheduled_time = NULL
      WHERE (scheduled_date = '2026-09-19' OR scheduled_date ILIKE '%Sep 19%' OR scheduled_date ILIKE '%2026-09-19%'
          OR scheduled_date = '2026-09-15' OR scheduled_date ILIKE '%Sep 15%' OR scheduled_date ILIKE '%2026-09-15%'
          OR scheduled_date IS NULL OR scheduled_date = '')
        AND status NOT IN ('approved', 'completed', 'rejected', 'referred')
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS' AND reference_no IN (
        SELECT reference_no FROM aics_applications 
        WHERE status IN ('pending', 'submit_pending', 'rejected', 'denied', 'disapproved')
      )
    `).catch(() => {});

    const [deletedRes, result] = await Promise.all([
      db.query('SELECT reference_no FROM deleted_appointments').catch(() => ({ rows: [] })),
      db.query(
        `SELECT a.* FROM appointments a
         WHERE a.reference_no NOT IN (SELECT reference_no FROM deleted_appointments)
         ORDER BY a.created_at DESC`
      ).catch(() => db.query('SELECT * FROM appointments ORDER BY id DESC LIMIT 200')),
    ]);

    const deletedSet = new Set(deletedRes.rows.map((r) => String(r.reference_no).toLowerCase().trim()));
    const rows = (result.rows || []).filter(r => !deletedSet.has(String(r.reference_no || '').toLowerCase().trim()));

    res.json({ appointments: rows, deletedReferences: Array.from(deletedSet) });
  } catch (err) {
    console.error('getAppointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments.', details: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const referenceNo = req.body.referenceNo || req.body.reference_no;
    const module = req.body.module || 'AICS';
    const applicantName = req.body.applicantName || req.body.applicant_name;
    const concern = req.body.concern;
    const scheduledDate = req.body.scheduledDate || req.body.scheduled_date;
    const scheduledTime = req.body.scheduledTime || req.body.scheduled_time;
    const officeLocation = req.body.officeLocation || req.body.office_location || 'Quezon City Hall';
    const notes = req.body.notes;

    if (!referenceNo || !applicantName || !concern) {
      return res.status(400).json({ error: 'Missing required fields: referenceNo, applicantName, or concern.' });
    }

    const initialStatus = scheduledDate ? 'scheduled' : 'pending';

    await db.query(`DELETE FROM appointments WHERE reference_no = $1`, [referenceNo]).catch(() => {});

    const result = await db.query(
      `INSERT INTO appointments
        (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        referenceNo,
        module,
        applicantName,
        concern,
        initialStatus,
        scheduledDate || null,
        scheduledTime || null,
        officeLocation,
        notes || null,
      ]
    );

    const appt = result.rows[0];

    if (scheduledDate) {
      await syncAppointmentWithDisbursement(appt);
    }

    res.status(201).json({ message: 'Appointment created.', appointment: appt });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment.' });
  }
};

exports.scheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, officeLocation, notes, applicantName, concern } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Date and time are required.' });
    }

    let formattedDate = scheduledDate;
    try {
      const d = new Date(scheduledDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    } catch {}

    const cleanId = String(id || '').trim();

    const result = await db.query(
      `UPDATE appointments
       SET status = 'scheduled',
           scheduled_date = $1,
           scheduled_time = $2,
           office_location = COALESCE($3, office_location),
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE reference_no = $5 OR id::text = $5
       RETURNING *`,
      [formattedDate, scheduledTime, officeLocation || 'Quezon City Hall', notes, cleanId]
    );

    let appt;
    if (result.rows.length === 0) {

      const insertRes = await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes)
         VALUES ($1, 'AICS', $2, $3, 'scheduled', $4, $5, $6, $7)
         RETURNING *`,
        [
          cleanId,
          applicantName || 'BENEFICIARY',
          concern || 'Social Assistance',
          formattedDate,
          scheduledTime,
          officeLocation || 'Quezon City Hall',
          notes || null,
        ]
      );
      appt = insertRes.rows[0];
    } else {
      appt = result.rows[0];
    }

    // Note: Do NOT sync with financial_aid_disbursements on schedule alone.
    // Financial Aid disbursement is strictly created only upon Social Worker APPROVAL.

    try {
      await db.query(
        `UPDATE aics_applications
         SET status = 'under_review',
             details = COALESCE(details, '{}'::jsonb) || jsonb_build_object(
               'appointmentDate', $1::text,
               'appointmentTime', $2::text,
               'appointmentVenue', $3::text
             ),
             updated_at = NOW()
         WHERE reference_no = $4 OR id::text = $4 OR REPLACE(REPLACE(COALESCE(reference_no, ''), '-', ''), ' ', '') = REPLACE(REPLACE($4, '-', ''), ' ', '') OR REPLACE(REPLACE(COALESCE(qc_id, ''), '-', ''), ' ', '') = REPLACE(REPLACE($4, '-', ''), ' ', '')`,
        [formattedDate, scheduledTime, officeLocation || 'Quezon City Hall', cleanId]
      );
    } catch (aicsSyncErr) {
      console.warn('Could not update aics_applications status to under_review:', aicsSyncErr.message);
    }

    res.json({ message: 'Appointment scheduled and synced with AICS case review.', appointment: appt });
  } catch (err) {
    console.error('Error scheduling appointment:', err);
    res.status(500).json({ error: 'Failed to schedule appointment.', details: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, decision, applicantName, notes } = req.body;
    const cleanId = String(id || '').trim();
    const cleanNoDash = cleanId.replace(/[^a-zA-Z0-9]/g, '');
    const finalStatus = status || decision || 'approved';

    const result = await db.query(
      `UPDATE appointments
       SET status = $1,
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE reference_no = $3
          OR id::text = $3
          OR REPLACE(REPLACE(COALESCE(reference_no, ''), '-', ''), ' ', '') = $4
          OR (applicant_name IS NOT NULL AND $5 <> '' AND LOWER(applicant_name) = LOWER($5))
       RETURNING *`,
      [finalStatus, notes || null, cleanId, cleanNoDash, applicantName || '']
    );

    // Also sync the status across individual module application tables
    if (finalStatus === 'approved') {
      await db.query(
        `UPDATE aics_applications
         SET status = 'approved', updated_at = NOW()
         WHERE reference_no = $1
            OR id::text = $1
            OR qc_id = $1
            OR REPLACE(REPLACE(COALESCE(reference_no, ''), '-', ''), ' ', '') = $2
            OR REPLACE(REPLACE(COALESCE(qc_id, ''), '-', ''), ' ', '') = $2
            OR ($3 <> '' AND LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($3))`,
        [cleanId, cleanNoDash, applicantName || '']
      ).catch(() => {});

      await db.query(
        `UPDATE pwd_senior_applications
         SET status = 'approved', updated_at = NOW()
         WHERE reference_number = $1
            OR id::text = $1
            OR REPLACE(REPLACE(COALESCE(reference_number, ''), '-', ''), ' ', '') = $2
            OR ($3 <> '' AND LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($3))`,
        [cleanId, cleanNoDash, applicantName || '']
      ).catch(() => {});
    } else if (finalStatus === 'referred') {
      await db.query(
        `UPDATE aics_applications
         SET status = 'referred', updated_at = NOW()
         WHERE reference_no = $1
            OR id::text = $1
            OR qc_id = $1
            OR REPLACE(REPLACE(COALESCE(reference_no, ''), '-', ''), ' ', '') = $2
            OR REPLACE(REPLACE(COALESCE(qc_id, ''), '-', ''), ' ', '') = $2`,
        [cleanId, cleanNoDash]
      ).catch(() => {});
    } else if (finalStatus === 'rejected') {
      await db.query(
        `UPDATE aics_applications
         SET status = 'rejected', updated_at = NOW()
         WHERE reference_no = $1
            OR id::text = $1
            OR qc_id = $1
            OR REPLACE(REPLACE(COALESCE(reference_no, ''), '-', ''), ' ', '') = $2
            OR REPLACE(REPLACE(COALESCE(qc_id, ''), '-', ''), ' ', '') = $2`,
        [cleanId, cleanNoDash]
      ).catch(() => {});
    }

    res.json({
      message: `Appointment status updated to ${finalStatus}.`,
      appointment: result.rows[0] || null,
    });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ error: 'Failed to update appointment status.', details: err.message });
  }
};

async function syncAppointmentWithDisbursement(appt) {
  try {
    const cleanAssistance = appt.concern.includes('Assistance') ? appt.concern : `${appt.concern} Assistance`;
    const fixedAmount = resolveFixedAmount(appt.concern);
    const disbursementId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const checkDisb = await db.query(
      `SELECT * FROM financial_aid_disbursements WHERE application_ref = $1 AND (assistance_type = $2 OR assistance_type ILIKE $3)`,
      [appt.reference_no, cleanAssistance, `%${appt.concern}%`]
    );

    if (checkDisb.rows.length > 0) {
      await db.query(
        `UPDATE financial_aid_disbursements
         SET appointment_date = $1,
             appointment_time = $2,
             venue = $3,
             updated_at = NOW()
         WHERE application_ref = $4 AND (assistance_type = $5 OR assistance_type ILIKE $6)`,
        [appt.scheduled_date, appt.scheduled_time, appt.office_location || 'Quezon City Hall', appt.reference_no, cleanAssistance, `%${appt.concern}%`]
      );
    } else {
      await db.query(
        `INSERT INTO financial_aid_disbursements
          (disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
           date_approved, status, appointment_date, appointment_time, venue, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)`,
        [
          disbursementId,
          appt.reference_no,
          appt.applicant_name.toUpperCase(),
          cleanAssistance,
          fixedAmount,
          new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
          appt.scheduled_date,
          appt.scheduled_time,
          appt.office_location || 'Quezon City Hall',
          appt.notes || 'Scheduled payout appointment via Admin Appointments module.',
        ]
      );
    }

    if (appt.reference_no && appt.reference_no.startsWith('LP-')) {
      await db.query(
        `UPDATE livelihood_assistance
         SET release_date = $1,
             release_time = $2,
             release_location = $3,
             assistance_status = 'for_release',
             updated_at = NOW()
         WHERE reference_number = $4 AND assistance_status != 'released'`,
        [appt.scheduled_date, appt.scheduled_time, appt.office_location || 'Quezon City Hall - SSDD Livelihood Center', appt.reference_no]
      );
    }

    await db.query(
      `INSERT INTO user_notifications (title, description, application_ref)
       VALUES ($1, $2, $3)`,
      [
        'Payout Appointment Scheduled',
        `Your Financial Aid payout appointment has been scheduled.\nDate: ${appt.scheduled_date}\nTime: ${appt.scheduled_time}\nLocation: ${appt.office_location || 'Quezon City Hall'}\nAmount: ₱${fixedAmount.toLocaleString()}`,
        appt.reference_no,
      ]
    );

    await logActivity({
      actor: 'Admin / Social Worker',
      actorRole: 'Appointment Officer',
      action: 'SCHEDULED',
      module: 'Appointments',
      referenceNo: appt.reference_no,
      subject: appt.applicant_name,
      detail: `Scheduled payout appointment on ${appt.scheduled_date} at ${appt.scheduled_time} for ${appt.concern}.`,
    });
  } catch (syncErr) {
    console.warn('Sync note between appointment and disbursement:', syncErr.message);
  }
}

exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();
    const result = await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE reference_no = $1 OR id::text = $1 RETURNING *`,
      [cleanId]
    );

    try {
      await db.query(
        `UPDATE aics_applications SET status = 'approved', updated_at = NOW() WHERE reference_no = $1 OR id::text = $1`,
        [cleanId]
      );
    } catch (_) {}

    try {
      await db.query(`
        DELETE FROM appointments a
        USING appointments b
        WHERE a.id < b.id AND a.reference_no = b.reference_no AND a.concern = b.concern
      `);
    } catch (_) {}

    if (result.rows.length === 0) {
      return res.json({ message: 'Appointment marked completed (synced).' });
    }
    res.json({ message: 'Appointment marked completed.', appointment: result.rows[0] });
  } catch (err) {
    console.error('Error completing appointment:', err);
    res.status(500).json({ error: 'Failed to complete appointment.' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = String(id || '').trim();
    const cleanId = raw.replace(/^db-appt-/, '').replace(/^aics-appt-/, '').replace(/^pwd-senior-appt-/, '').replace(/^cw-appt-/, '').trim();

    await db.query(`DELETE FROM appointments WHERE id::text = $1 OR reference_no = $1 OR id::text = $2 OR reference_no = $2`, [raw, cleanId]);

    if (cleanId) {
      await db.query(
        `INSERT INTO deleted_appointments (reference_no) VALUES ($1) ON CONFLICT (reference_no) DO NOTHING`,
        [cleanId]
      ).catch(() => {});
    }
    if (raw && raw !== cleanId) {
      await db.query(
        `INSERT INTO deleted_appointments (reference_no) VALUES ($1) ON CONFLICT (reference_no) DO NOTHING`,
        [raw]
      ).catch(() => {});
    }

    await logActivity({
      actor: 'Admin / Social Worker',
      actorRole: 'Appointment Officer',
      action: 'DELETED',
      module: 'Appointments',
      referenceNo: cleanId || raw,
      subject: 'Appointment Request',
      detail: `Deleted appointment record (Ref/ID: ${cleanId || raw}).`,
    }).catch(() => {});

    res.json({ success: true, message: 'Appointment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ success: false, error: 'Failed to delete appointment.' });
  }
};

exports.deleteUserAppointments = async (req, res) => {
  try {
    const { nameOrRef } = req.params;
    const term = `%${nameOrRef}%`;
    const result = await db.query(
      `DELETE FROM appointments
       WHERE applicant_name ILIKE $1
          OR reference_no ILIKE $1`,
      [term]
    );
    res.json({ message: `Deleted ${result.rowCount} appointments.` });
  } catch (err) {
    console.error('Error clearing appointments:', err);
    res.status(500).json({ error: 'Failed to clear appointments.' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, decision, applicantName, notes } = req.body;
    const rawId = String(id || '').trim();
    const cleanId = rawId.replace(/^db-appt-/, '').replace(/^aics-appt-/, '').replace(/^pwd-senior-appt-/, '').replace(/^cw-appt-/, '').replace(/^appt_/, '').trim();
    const unhyphenated = cleanId.replace(/[^a-zA-Z0-9]/g, '');
    const newStatus = String(status || decision || 'approved').toLowerCase();

    // 1. Update appointments table
    const apptUpdate = await db.query(
      `UPDATE appointments
       SET status = $1,
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id::text = $3
          OR reference_no = $3
          OR id::text = $4
          OR reference_no = $4
          OR REPLACE(reference_no, '-', '') = $5
          OR ($6 != '' AND applicant_name ILIKE $6)
       RETURNING *`,
      [newStatus, notes || null, rawId, cleanId, unhyphenated, applicantName ? `%${applicantName}%` : '']
    );

    // 2. Also update corresponding aics_applications status
    await db.query(
      `UPDATE aics_applications
       SET status = $1,
           updated_at = NOW()
       WHERE id::text = $2
          OR reference_no = $2
          OR qc_id = $2
          OR id::text = $3
          OR reference_no = $3
          OR qc_id = $3
          OR REPLACE(reference_no, '-', '') = $4
          OR REPLACE(qc_id, '-', '') = $4
          OR ($5 != '' AND LOWER(first_name || ' ' || last_name) = LOWER($5))`,
      [newStatus, rawId, cleanId, unhyphenated, applicantName || '']
    ).catch(() => {});

    // 3. If approved, make sure it is inserted into financial_aid_disbursements table
    if (newStatus === 'approved' || newStatus === 'completed' || newStatus === 'for_release') {
      const apptRow = apptUpdate.rows[0];
      const targetRef = apptRow?.reference_no || cleanId;
      const targetName = (apptRow?.applicant_name || applicantName || 'BENEFICIARY').toUpperCase();
      const targetConcern = apptRow?.concern || 'Medical Assistance';
      const fixedAmount = resolveFixedAmount(targetConcern);

      const existingDisb = await db.query(
        `SELECT id FROM financial_aid_disbursements
         WHERE application_ref = $1
            OR application_ref = $2
            OR REPLACE(application_ref, '-', '') = $3
            OR (applicant_name ILIKE $4 AND status != 'RELEASED')`,
        [rawId, targetRef, unhyphenated, `%${targetName}%`]
      );

      if (existingDisb.rows.length === 0) {
        const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.query(
          `INSERT INTO financial_aid_disbursements (
            disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
            date_approved, status, appointment_date, appointment_time, venue, remarks
          ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            disbId,
            targetRef,
            targetName,
            targetConcern,
            fixedAmount,
            new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
            apptRow?.scheduled_date || null,
            apptRow?.scheduled_time || null,
            apptRow?.office_location || 'Quezon City Hall',
            apptRow?.notes || 'Approved appointment ready for payout release.',
          ]
        ).catch(() => {});
      }
    } else if (newStatus === 'rejected') {
      await db.query(
        `DELETE FROM financial_aid_disbursements
         WHERE application_ref = $1 OR application_ref = $2 OR REPLACE(application_ref, '-', '') = $3`,
        [rawId, cleanId, unhyphenated]
      ).catch(() => {});
    }

    await logActivity({
      actor: 'Admin / Social Worker',
      actorRole: 'Appointment Officer',
      action: newStatus.toUpperCase(),
      module: 'Appointments',
      referenceNo: cleanId,
      subject: applicantName || cleanId,
      detail: `Updated appointment status to ${newStatus}.`,
    }).catch(() => {});

    res.json({
      success: true,
      message: `Status updated to ${newStatus}.`,
      appointment: apptUpdate.rows[0] || null,
    });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ success: false, error: 'Failed to update appointment status.', details: err.message });
  }
};
