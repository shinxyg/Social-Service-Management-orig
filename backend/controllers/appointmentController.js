const db = require('../config/db');
const { logActivity } = require('./activityLogController');

const FIXED_ASSISTANCE_AMOUNTS = {
  'Medical Assistance': 5000,
  'Funeral Assistance': 10000,
  'Educational Assistance': 3000,
  'Burial Assistance': 10000,
  'Food Assistance': 1500,
  'Transportation Assistance': 1000,
  'PWD Social Assistance': 1500,
  'PWD Pension Assistance': 1500,
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
  if (lower.includes('pwd') || lower.includes('disability') || lower.includes('pension')) return 1500;
  if (lower.includes('funeral') || lower.includes('burial')) return 10000;
  if (lower.includes('livelihood')) return 15000;
  if (lower.includes('nutrition') || lower.includes('child') || lower.includes('medical') || lower.includes('emergency') || lower.includes('solo')) return 5000;
  if (lower.includes('education')) return 3000;
  if (lower.includes('senior')) return 2000;
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
initAppointmentTables().then(() => {
  syncAndCleanAppointments();
});

let lastAppointmentSyncTime = 0;
let isAppointmentSyncInProgress = false;

async function syncAndCleanAppointments() {
  try {
    const deletedRes = await db.query('SELECT reference_no FROM deleted_appointments').catch(() => ({ rows: [] }));
    const deletedSet = new Set(deletedRes.rows.map((r) => String(r.reference_no).toLowerCase().trim()));

    // 0. Reset any scheduled appointments that were erroneously marked 'approved' without an admin interview
    await db.query(`
      UPDATE appointments
      SET status = 'scheduled', updated_at = NOW()
      WHERE status = 'approved'
        AND scheduled_date IS NOT NULL AND scheduled_date <> ''
        AND (notes IS NULL OR (notes NOT LIKE '%Admin interview completed%' AND notes NOT LIKE '%Approved via appointment%' AND notes NOT LIKE '%Official Decision%'))
    `).catch(() => {});

    // 1. Clean up rejected/denied AICS appointments (NEVER delete scheduled or pending applications that have active appointments)
    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS' AND (
        reference_no IN (
          SELECT reference_no FROM aics_applications 
          WHERE status IN ('rejected', 'denied', 'disapproved')
        )
        OR reference_no IN (
          SELECT qc_id FROM aics_applications 
          WHERE status IN ('rejected', 'denied', 'disapproved')
            AND qc_id IS NOT NULL AND qc_id <> ''
        )
      )
    `).catch(() => {});

    // Ensure AICS applications with existing appointment dates are marked as scheduled
    await db.query(`
      UPDATE aics_applications
      SET status = 'scheduled', updated_at = NOW()
      WHERE (details->>'appointmentDate' IS NOT NULL AND details->>'appointmentDate' <> '')
        AND status IN ('pending', 'submit_pending', 'waiting_approval')
    `).catch(() => {});

    // 2. Clean up rejected applications for other modules
    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen') AND reference_no IN (
        SELECT reference_number FROM pwd_senior_applications WHERE status IN ('rejected', 'denied', 'disapproved')
      )
    `).catch(() => {});

    // 2b. Clean up PWD/Senior appointments that are still 'pending' in pwd_senior_applications (NOT YET APPROVED in Pic 1 /pwd-senior)
    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen')
        AND reference_no IN (
          SELECT reference_number FROM pwd_senior_applications
          WHERE status = 'pending'
        )
    `).catch(() => {});

    // 3. Clean up orphaned appointments whose parent applications were deleted from the DB
    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen')
        AND reference_no NOT IN (SELECT reference_number FROM pwd_senior_applications)
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS'
        AND reference_no NOT IN (SELECT reference_no FROM aics_applications)
        AND reference_no NOT IN (SELECT qc_id FROM aics_applications WHERE qc_id IS NOT NULL AND qc_id <> '')
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
      WHERE a.id < b.id AND a.reference_no = b.reference_no AND a.module = b.module AND a.concern = b.concern
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

    // Import active AICS applications ONLY after being screened/approved for scheduling in /aics OR if already scheduled
    const activeAics = await db.query(
      `SELECT reference_no, qc_id, assistance_type, first_name, middle_name, last_name, suffix, status, details, created_at
       FROM aics_applications
       WHERE status IN ('waiting_approval', 'for_scheduling', 'scheduled', 'under_review', 'approved', 'completed', 'for_referral', 'referred')
          OR (details->>'appointmentDate' IS NOT NULL AND details->>'appointmentDate' <> '')`
    ).catch(() => ({ rows: [] }));

    for (const row of activeAics.rows) {
      const refNo = String(row.reference_no || row.qc_id || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
      const rawType = (row.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim();
      const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + ' Assistance';
      const isApproved = ['approved', 'completed', 'for_release', 'released'].includes(row.status);
      const isReferred = ['for_referral', 'referred'].includes(row.status);
      const isSched = ['scheduled', 'under_review'].includes(row.status);

      const details = (typeof row.details === 'object' && row.details !== null) ? row.details : {};
      const schedDate = details.appointmentDate || null;
      const schedTime = details.appointmentTime || null;
      const venue = details.appointmentVenue || 'Quezon City Hall';
      const initStatus = isApproved ? 'approved' : isReferred ? 'referred' : (isSched || schedDate) ? 'scheduled' : 'pending';

      const checkExists = await db.query(
        `SELECT id, status, scheduled_date FROM appointments WHERE reference_no = $1 AND module = 'AICS' AND concern = $2`,
        [refNo, cleanType]
      ).catch(() => ({ rows: [] }));

      if (checkExists.rows.length === 0) {
        await db.query(
          `INSERT INTO appointments
            (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes, created_at, updated_at)
           VALUES ($1, 'AICS', $2, $3, $4, $5, $6, $7, 'Awtomatikong pumasok mula sa AICS aplikasyon para sa scheduling at assessment.', COALESCE($8, NOW()), NOW())`,
          [refNo, fullName, cleanType, initStatus, schedDate, schedTime, venue, row.created_at || null]
        ).catch(() => {});
      } else {
        const existing = checkExists.rows[0];
        if (schedDate && !existing.scheduled_date) {
          await db.query(
            `UPDATE appointments SET status = $1, scheduled_date = $2, scheduled_time = $3, office_location = $4, updated_at = NOW() WHERE id = $5`,
            [initStatus, schedDate, schedTime, venue, existing.id]
          ).catch(() => {});
        }
      }
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
         WHERE NOT EXISTS (SELECT 1 FROM appointments WHERE reference_no = $1 AND module = 'Livelihood' AND concern = 'Livelihood Capital Assistance')`,
        [refNo, fullName]
      ).catch(() => {});
    }

    // Import ONLY approved PWD and Senior assistance applications (Must be approved in Pic 1 /pwd-senior first!)
    const approvedPwdSenior = await db.query(
      `SELECT reference_number, category, type, first_name, middle_name, last_name, suffix, status, submitted_at, created_at
       FROM pwd_senior_applications
       WHERE status IN ('approved', 'completed', 'for_release', 'released')
         AND (type ILIKE '%assist%' OR category ILIKE '%assist%' OR disability_class ILIKE '%assist%' OR extra_data::text ILIKE '%assist%')`
    ).catch(() => ({ rows: [] }));

    for (const row of approvedPwdSenior.rows) {
      const refNo = String(row.reference_number || '').trim();
      if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
      const isPwd = String(row.category || '').toUpperCase().includes('PWD');
      const mod = isPwd ? 'PWD' : 'Senior Citizen';
      const concern = isPwd ? 'PWD Social Assistance' : 'Senior Social Assistance';
      const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
      const checkExists = await db.query(
        `SELECT id, status, scheduled_date FROM appointments WHERE reference_no = $1 AND module = $2 AND concern = $3`,
        [refNo, mod, concern]
      ).catch(() => ({ rows: [] }));

      if (checkExists.rows.length === 0) {
        await db.query(
          `INSERT INTO appointments
            (reference_no, module, applicant_name, concern, status, office_location, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'pending', 'Quezon City Hall - PDAO Room 102', 'Awtomatikong pumasok mula sa PWD/Senior Social Assistance aplikasyon.', COALESCE($5, NOW()), NOW())`,
          [refNo, mod, fullName, concern, row.submitted_at || row.created_at || null]
        ).catch(() => {});
      }
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
      WHERE module = 'AICS' AND (
        reference_no IN (
          SELECT reference_no FROM aics_applications 
          WHERE status IN ('rejected', 'denied', 'disapproved')
        )
        OR reference_no IN (
          SELECT qc_id FROM aics_applications 
          WHERE status IN ('rejected', 'denied', 'disapproved')
            AND qc_id IS NOT NULL AND qc_id <> ''
        )
      )
    `).catch(() => {});

    // Ensure any active AICS application with a scheduled date is present in appointments table
    try {
      const activeSchedAics = await db.query(`
        SELECT reference_no, qc_id, assistance_type, first_name, middle_name, last_name, suffix, status, details, created_at
        FROM aics_applications
        WHERE (details->>'appointmentDate' IS NOT NULL AND details->>'appointmentDate' <> '')
           OR status IN ('waiting_approval', 'for_scheduling', 'scheduled', 'under_review')
      `);
      for (const row of activeSchedAics.rows) {
        const rNo = String(row.reference_no || row.qc_id || '').trim();
        if (!rNo) continue;
        const rawType = (row.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim();
        const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + ' Assistance';
        const details = (typeof row.details === 'object' && row.details !== null) ? row.details : {};
        const sDate = details.appointmentDate || null;
        const sTime = details.appointmentTime || null;
        const sVenue = details.appointmentVenue || 'Quezon City Hall';
        const fName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';

        const ex = await db.query(
          `SELECT id, scheduled_date FROM appointments WHERE reference_no = $1 AND module = 'AICS' AND concern = $2`,
          [rNo, cleanType]
        );
        if (ex.rows.length === 0) {
          await db.query(
            `INSERT INTO appointments
              (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes, created_at, updated_at)
             VALUES ($1, 'AICS', $2, $3, $4, $5, $6, $7, 'Awtomatikong pumasok mula sa AICS aplikasyon para sa scheduling at assessment.', COALESCE($8, NOW()), NOW())`,
            [rNo, fName, cleanType, sDate ? 'scheduled' : 'pending', sDate, sTime, sVenue, row.created_at || null]
          );
        } else if (sDate && !ex.rows[0].scheduled_date) {
          await db.query(
            `UPDATE appointments SET status = 'scheduled', scheduled_date = $1, scheduled_time = $2, office_location = $3, updated_at = NOW() WHERE id = $4`,
            [sDate, sTime, sVenue, ex.rows[0].id]
          );
        }
      }
    } catch (_) {}

    // Un-tombstone any active appointments that exist in appointments table
    await db.query(`
      DELETE FROM deleted_appointments
      WHERE reference_no IN (SELECT reference_no FROM appointments)
    `).catch(() => {});

    const [deletedRes, result] = await Promise.all([
      db.query('SELECT reference_no FROM deleted_appointments WHERE reference_no NOT IN (SELECT reference_no FROM appointments)').catch(() => ({ rows: [] })),
      db.query(`SELECT * FROM appointments ORDER BY created_at DESC`).catch(() => db.query('SELECT * FROM appointments ORDER BY id DESC LIMIT 200')),
    ]);

    const deletedSet = new Set(deletedRes.rows.map((r) => String(r.reference_no).toLowerCase().trim()));
    const rows = result.rows || [];

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

    await db.query(`DELETE FROM deleted_appointments WHERE reference_no = $1`, [referenceNo]).catch(() => {});
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
    const { scheduledDate, scheduledTime, officeLocation, notes, applicantName, concern, module: apptModule } = req.body;

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
    const cleanNoDash = cleanId.replace(/[^a-zA-Z0-9]/g, '');
    const targetModule = String(apptModule || '').trim();
    const targetConcern = String(concern || '').trim();

    const result = await db.query(
      `UPDATE appointments
       SET status = 'scheduled',
           scheduled_date = $1,
           scheduled_time = $2,
           office_location = COALESCE($3, office_location),
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE id::text = $5
          OR (
            (reference_no = $5 OR REPLACE(reference_no, '-', '') = $6)
            AND ($7 = '' OR module ILIKE $7)
            AND ($8 = '' OR concern ILIKE $8)
          )
       RETURNING *`,
      [formattedDate, scheduledTime, officeLocation || 'Quezon City Hall', notes, cleanId, cleanNoDash, targetModule, targetConcern ? `%${targetConcern}%` : '']
    );

    let appt;
    if (result.rows.length === 0) {
      const insertRes = await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes)
         VALUES ($1, $2, $3, $4, 'scheduled', $5, $6, $7, $8)
         RETURNING *`,
        [
          cleanId,
          targetModule || 'AICS',
          applicantName || 'BENEFICIARY',
          targetConcern || 'Social Assistance',
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

    // Only update aics_applications if module is AICS
    if ((appt?.module || targetModule).toUpperCase() === 'AICS' || targetConcern.toLowerCase().includes('medical')) {
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
    }

    res.json({ message: 'Appointment scheduled and synced with case review.', appointment: appt });
  } catch (err) {
    console.error('Error scheduling appointment:', err);
    res.status(500).json({ error: 'Failed to schedule appointment.', details: err.message });
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
    await db.query(`DELETE FROM pwd_senior_applications WHERE id::text = $1 OR reference_number = $1 OR id::text = $2 OR reference_number = $2`, [raw, cleanId]).catch(() => {});
    await db.query(`DELETE FROM aics_applications WHERE id::text = $1 OR reference_no = $1 OR id::text = $2 OR reference_no = $2`, [raw, cleanId]).catch(() => {});

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
    const { status, decision, applicantName, notes, module: apptModule, concern: apptConcern } = req.body;
    const rawId = String(id || '').trim();
    const cleanId = rawId.replace(/^(db-appt-|aics-appt-|pwd-senior-appt-|cw-appt-|liv-appt-|appt_)/, '').trim();
    const unhyphenated = cleanId.replace(/[^a-zA-Z0-9]/g, '');
    const newStatus = String(status || decision || 'approved').toLowerCase();
    const targetModule = String(apptModule || '').trim();
    const targetConcern = String(apptConcern || '').trim();

    // 1. Update appointments table STRICTLY for this appointment (by id or by reference_no + module/concern)
    const apptUpdate = await db.query(
      `UPDATE appointments
       SET status = $1,
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id::text = $3
          OR (
            (reference_no = $3 OR reference_no = $4 OR REPLACE(reference_no, '-', '') = $5)
            AND ($6 = '' OR module ILIKE $6)
            AND ($7 = '' OR concern ILIKE $7)
          )
       RETURNING *`,
      [newStatus, notes || null, rawId, cleanId, unhyphenated, targetModule, targetConcern ? `%${targetConcern}%` : '']
    );

    let apptRow = apptUpdate.rows[0];
    if (!apptRow) {
      const defaultConcern = targetModule === 'PWD' ? 'PWD Social Assistance' : 'Medical Assistance';
      const insertRes = await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         VALUES ($1, $2, $3, $4, $5, 'Quezon City Hall', $6)
         RETURNING *`,
        [
          cleanId,
          targetModule || 'AICS',
          applicantName || 'BENEFICIARY',
          targetConcern || defaultConcern,
          newStatus,
          notes || null
        ]
      ).catch((err) => console.warn('Could not insert appointment on status update:', err.message));
      if (insertRes && insertRes.rows.length > 0) {
        apptRow = insertRes.rows[0];
      }
    }
    const resolvedModule = (apptRow?.module || targetModule).toUpperCase();
    const resolvedConcern = String(apptRow?.concern || targetConcern || '');

    // 2. Only update corresponding module table
    if (resolvedModule === 'AICS') {
      await db.query(
        `UPDATE aics_applications
         SET status = $1, updated_at = NOW()
         WHERE (id::text = $2
            OR reference_no = $2
            OR REPLACE(reference_no, '-', '') = $3)
           AND status != $1`,
        [newStatus, cleanId, unhyphenated]
      ).catch(() => {});
    } else if (resolvedModule === 'PWD' || resolvedModule.includes('SENIOR') || resolvedConcern.toLowerCase().includes('pwd') || resolvedConcern.toLowerCase().includes('senior')) {
      await db.query(
        `UPDATE pwd_senior_applications
         SET status = $1, updated_at = NOW()
         WHERE id::text = $2
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3`,
        [newStatus, cleanId, unhyphenated]
      ).catch(() => {});
    }

    // 3. Financial aid disbursement creation ONLY for approved non-GL cash assistance
    if (newStatus === 'approved' || newStatus === 'completed' || newStatus === 'for_release') {
      const isPwdApp = resolvedModule === 'PWD' || resolvedConcern.toLowerCase().includes('pwd') || resolvedConcern.toLowerCase().includes('disability');
      const isAicsMedical = resolvedModule === 'AICS' || resolvedConcern.toLowerCase().includes('medical');

      // Note: AICS Medical uses Guarantee Letter (GL), NOT cash disbursement!
      if (!isAicsMedical) {
        const targetRef = apptRow?.reference_no || cleanId;
        const targetName = (apptRow?.applicant_name || applicantName || 'BENEFICIARY').toUpperCase();
        const fixedAmount = resolveFixedAmount(resolvedConcern);

        const existingDisb = await db.query(
          `SELECT id FROM financial_aid_disbursements
           WHERE (application_ref = $1 OR application_ref = $2 OR REPLACE(application_ref, '-', '') = $3)
             AND assistance_type = $4`,
          [rawId, targetRef, unhyphenated, resolvedConcern]
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
              resolvedConcern,
              fixedAmount,
              new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              isPwdApp ? null : (apptRow?.scheduled_date || null),
              isPwdApp ? null : (apptRow?.scheduled_time || null),
              'Quezon City Hall',
              isPwdApp ? 'PWD 3-Month Pension Hold Period started.' : 'Appointment approved aid voucher.',
            ]
          ).catch((disbErr) => console.warn('Could not insert disbursement on appointment approval:', disbErr.message));
        }
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
      appointment: apptRow || null,
    });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ success: false, error: 'Failed to update appointment status.', details: err.message });
  }
};
