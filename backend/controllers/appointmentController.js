const db = require('../config/db');
const { logActivity } = require('./activityLogController');

const FIXED_ASSISTANCE_AMOUNTS = {
  'Medical Assistance': 5000,
  'Funeral Assistance': 10000,
  'Educational Assistance': 3000,
  'Burial Assistance': 10000,
  'PWD Social Assistance': 1500,
  'PWD Pension Assistance': 1500,
  'Senior Social Assistance': 3000,
  'Senior Citizen Social Pension': 3000,
  'Senior Citizen Assistance': 3000,
  'Senior Citizen': 3000,
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
  if (lower.includes('senior') || lower.includes('osca')) return 3000;
  return 5000;
}

async function syncAndCleanAppointments() {
  try {
    // 1. Clean up erroneous AICS appointments that belong to Child Welfare or Solo Parent
    await db.query(`
      DELETE FROM appointments
      WHERE (module = 'AICS' OR module IS NULL) AND (reference_no LIKE 'CW-%' OR reference_no LIKE 'SP-%')
    `).catch(() => {});

    // 2. Auto-repair any existing appointments rows contaminated with legacy hardcoded 'JEFFERSON FERNANDO LEE' name
    await db.query(`
      UPDATE appointments a
      SET applicant_name = UPPER(TRIM(CONCAT_WS(' ', s.guardian_first_name, s.guardian_last_name)))
      FROM solo_parent_child_welfare_applications s
      WHERE a.reference_no = s.reference_number
        AND a.applicant_name ILIKE '%JEFFERSON FERNANDO LEE%'
        AND s.guardian_first_name IS NOT NULL AND s.guardian_first_name <> ''
    `).catch(() => {});

    await db.query(`
      UPDATE appointments a
      SET applicant_name = UPPER(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)))
      FROM solo_parent_child_welfare_applications s
      WHERE a.reference_no = s.reference_number
        AND a.applicant_name ILIKE '%JEFFERSON FERNANDO LEE%'
        AND s.first_name IS NOT NULL AND s.first_name <> ''
    `).catch(() => {});

    // 3. Clean up unapproved / rejected records
    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS' AND (
        reference_no IN (SELECT reference_no FROM aics_applications WHERE status IN ('rejected', 'denied', 'disapproved', 'cancelled'))
        OR reference_no IN (SELECT qc_id FROM aics_applications WHERE status IN ('rejected', 'denied', 'disapproved', 'cancelled') AND qc_id IS NOT NULL AND qc_id <> '')
      )
    `).catch(() => {});

    await db.query(`
      UPDATE aics_applications
      SET status = 'scheduled', updated_at = NOW()
      WHERE (details->>'appointmentDate' IS NOT NULL AND details->>'appointmentDate' <> '')
        AND status IN ('pending', 'submit_pending', 'waiting_approval')
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen') AND reference_no IN (
        SELECT reference_number FROM pwd_senior_applications WHERE status IN ('rejected', 'denied', 'disapproved', 'pending', 'submit_pending')
      )
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module IN ('PWD', 'Senior Citizen')
        AND NOT EXISTS (SELECT 1 FROM pwd_senior_applications p WHERE p.reference_number = appointments.reference_no)
    `).catch(() => {});

    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS'
        AND NOT EXISTS (SELECT 1 FROM aics_applications a WHERE a.reference_no = appointments.reference_no OR a.qc_id = appointments.reference_no)
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
        SELECT reference_number FROM solo_parent_child_welfare_applications WHERE module_type = 'CHILD_WELFARE' AND application_status IN ('rejected', 'disapproved')
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
         OR (module IN ('PWD', 'Senior Citizen') AND LOWER(COALESCE(concern, '')) NOT LIKE '%assist%')
         OR (module = 'Solo Parent' AND LOWER(COALESCE(concern, '')) NOT LIKE '%assist%' AND LOWER(COALESCE(concern, '')) NOT LIKE '%subsid%' AND LOWER(COALESCE(concern, '')) NOT LIKE '%payout%')
    `).catch(() => {});

    await db.query(`
      UPDATE appointments
      SET status = 'pending', scheduled_date = NULL, scheduled_time = NULL
      WHERE (scheduled_date = '2026-09-19' OR scheduled_date ILIKE '%Sep 19%' OR scheduled_date = '2026-09-15' OR scheduled_date ILIKE '%Sep 15%')
        AND status NOT IN ('approved', 'completed', 'rejected', 'referred')
    `).catch(() => {});

    // 4. Set-based Bulk Inserts for fast execution (1 statement per module)
    await db.query(`
      INSERT INTO appointments (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes, created_at, updated_at)
      SELECT 
        COALESCE(NULLIF(TRIM(a.reference_no), ''), a.qc_id) AS reference_no,
        'AICS' AS module,
        UPPER(TRIM(CONCAT_WS(' ', a.first_name, a.middle_name, a.last_name, a.suffix))) AS applicant_name,
        INITCAP(REPLACE(a.assistance_type, ' assistance', '')) || ' Assistance' AS concern,
        CASE 
          WHEN a.status IN ('approved', 'completed', 'for_release', 'released') THEN 'approved'
          WHEN a.status IN ('for_referral', 'referred') THEN 'referred'
          WHEN a.status IN ('scheduled', 'under_review') OR (a.details->>'appointmentDate' IS NOT NULL AND a.details->>'appointmentDate' <> '') THEN 'scheduled'
          ELSE 'pending'
        END AS status,
        NULLIF(a.details->>'appointmentDate', '') AS scheduled_date,
        NULLIF(a.details->>'appointmentTime', '') AS scheduled_time,
        COALESCE(NULLIF(a.details->>'appointmentVenue', ''), 'Quezon City Hall') AS office_location,
        'Awtomatikong pumasok mula sa AICS aplikasyon para sa scheduling at assessment.' AS notes,
        COALESCE(a.created_at, NOW()),
        NOW()
      FROM aics_applications a
      WHERE a.status NOT IN ('rejected', 'denied', 'disapproved', 'cancelled')
        AND COALESCE(NULLIF(TRIM(a.reference_no), ''), a.qc_id) IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(COALESCE(NULLIF(TRIM(a.reference_no), ''), a.qc_id))
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments app 
          WHERE app.reference_no = COALESCE(NULLIF(TRIM(a.reference_no), ''), a.qc_id) 
            AND app.module = 'AICS'
        );
    `).catch(() => {});

    await db.query(`
      INSERT INTO appointments (reference_no, module, applicant_name, concern, status, office_location, notes, created_at, updated_at)
      SELECT 
        l.reference_number,
        'Livelihood',
        UPPER(TRIM(CONCAT_WS(' ', l.first_name, l.last_name))),
        'Livelihood Capital Assistance',
        'pending',
        'Quezon City Hall - SSDD Livelihood Center',
        'Awtomatikong pumasok mula sa na-aprubahang Livelihood Capital allocation para sa appointment scheduling.',
        COALESCE(l.created_at, NOW()),
        NOW()
      FROM livelihood_applications l
      WHERE l.application_status = 'approved'
        AND NOT EXISTS (
          SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(l.reference_number)
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments app WHERE app.reference_no = l.reference_number AND app.module = 'Livelihood'
        );
    `).catch(() => {});

    await db.query(`
      INSERT INTO appointments (reference_no, module, applicant_name, concern, status, office_location, notes, created_at, updated_at)
      SELECT 
        p.reference_number,
        CASE WHEN p.category ILIKE '%pwd%' THEN 'PWD' ELSE 'Senior Citizen' END,
        UPPER(TRIM(CONCAT_WS(' ', p.first_name, p.middle_name, p.last_name, p.suffix))),
        CASE WHEN p.category ILIKE '%pwd%' THEN 'PWD Social Assistance' ELSE 'Senior Social Assistance' END,
        'pending',
        'Quezon City Hall - PDAO Room 102',
        'Awtomatikong pumasok mula sa PWD/Senior Social Assistance aplikasyon.',
        COALESCE(p.submitted_at, p.created_at, NOW()),
        NOW()
      FROM pwd_senior_applications p
      WHERE p.status IN ('approved', 'completed', 'for_release', 'released')
        AND (p.type ILIKE '%assist%' OR p.category ILIKE '%assist%' OR p.disability_class ILIKE '%assist%' OR p.extra_data::text ILIKE '%assist%')
        AND NOT EXISTS (
          SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(p.reference_number)
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments app WHERE app.reference_no = p.reference_number
        );
    `).catch(() => {});

    await db.query(`
      INSERT INTO appointments (reference_no, module, applicant_name, concern, status, office_location, notes, created_at, updated_at)
      SELECT 
        s.reference_number,
        'Solo Parent',
        UPPER(TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name, s.suffix))),
        CASE WHEN (s.application_type ILIKE '%edu%' OR s.reference_number ILIKE '%SP-EDU%') THEN 'Solo Parent Educational Assistance' ELSE 'Solo Parent Financial Subsidy' END,
        CASE WHEN s.application_status IN ('approved', 'completed', 'for_release', 'released') THEN 'approved' ELSE 'pending' END,
        'Quezon City Hall - SSDD Solo Parent Welfare Section',
        'Awtomatikong pumasok mula sa Solo Parent aplikasyon.',
        COALESCE(s.created_at, NOW()),
        NOW()
      FROM solo_parent_child_welfare_applications s
      WHERE (s.module_type = 'SOLO_PARENT' OR s.reference_number ILIKE 'SP-%')
        AND s.application_status NOT IN ('rejected', 'denied', 'disapproved', 'cancelled', 'draft')
        AND NOT EXISTS (
          SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(s.reference_number)
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments app WHERE app.reference_no = s.reference_number
        );
    `).catch(() => {});

    await db.query(`
      INSERT INTO appointments (reference_no, module, applicant_name, concern, status, office_location, notes, created_at, updated_at)
      SELECT 
        s.reference_number,
        'Child Welfare',
        COALESCE(NULLIF(UPPER(TRIM(CONCAT_WS(' ', s.guardian_first_name, s.guardian_last_name))), ''), UPPER(TRIM(s.child_name)), 'BENEFICIARY'),
        COALESCE(NULLIF(s.category_title, ''), 'Child Welfare Support'),
        CASE WHEN s.application_status IN ('approved', 'completed', 'for_release', 'released', 'interview_scheduled') THEN 'approved' ELSE 'pending' END,
        'SSDD Child Protection & Counseling Center (Room 205)',
        'Awtomatikong pumasok mula sa Child Welfare aplikasyon para sa scheduling.',
        COALESCE(s.created_at, NOW()),
        NOW()
      FROM solo_parent_child_welfare_applications s
      WHERE (s.module_type = 'CHILD_WELFARE' OR s.reference_number ILIKE 'CW-%')
        AND s.application_status NOT IN ('rejected', 'denied', 'disapproved', 'cancelled', 'draft')
        AND NOT EXISTS (
          SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(s.reference_number)
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointments app WHERE app.reference_no = s.reference_number
        );
    `).catch(() => {});

  } catch (err) {
    console.warn('⚠️ Background appointment sync error:', err.message);
  }
}

// Automatically trigger sync on server startup
setTimeout(() => {
  syncAndCleanAppointments().catch(() => {});
}, 3000);

async function initAppointmentTables() {
  return syncAndCleanAppointments();
}

let isAppointmentSyncInProgress = false;
let lastAppointmentSyncTime = 0;

function triggerAppointmentSyncIfStale() {
  const now = Date.now();
  if (isAppointmentSyncInProgress || (now - lastAppointmentSyncTime < 2 * 60 * 1000)) {
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
    // Trigger background sync non-blockingly
    triggerAppointmentSyncIfStale();

    const [deletedRes, result] = await Promise.all([
      db.query('SELECT reference_no FROM deleted_appointments WHERE reference_no IS NOT NULL').catch(() => ({ rows: [] })),
      db.query(`
        SELECT a.* 
        FROM appointments a
        WHERE a.reference_no != 'DISB-2026-9929' 
          AND NOT EXISTS (
            SELECT 1 FROM deleted_appointments d WHERE LOWER(d.reference_no) = LOWER(a.reference_no)
          )
        ORDER BY a.created_at DESC 
        LIMIT 300
      `).catch(() => db.query('SELECT * FROM appointments ORDER BY id DESC LIMIT 300')),
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
    await db.query(`DELETE FROM appointments WHERE reference_no = $1 AND (module = $2 OR concern = $3)`, [referenceNo, module, concern]).catch(() => {});

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

    const rawId = String(id || '').trim();
    const cleanId = rawId.replace(/^(db-appt-|aics-appt-|pwd-senior-appt-|cw-appt-|liv-appt-|appt_)/, '').trim();
    const cleanNoDash = cleanId.replace(/[^a-zA-Z0-9]/g, '');
    const targetModule = String(apptModule || '').trim();
    const targetConcern = String(concern || '').trim();

    let formattedDate = scheduledDate || null;
    if (scheduledDate) {
      try {
        const d = new Date(scheduledDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      } catch {}
    }
    const finalTime = scheduledTime || '09:00 AM';

    const result = await db.query(
      `UPDATE appointments
       SET status = 'scheduled',
           scheduled_date = COALESCE($1, scheduled_date),
           scheduled_time = COALESCE($2, scheduled_time),
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
      [formattedDate, finalTime, officeLocation || 'Quezon City Hall', notes, cleanId, cleanNoDash, targetModule, targetConcern ? `%${targetConcern}%` : '']
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
        `UPDATE livelihood_applications
         SET assistance = jsonb_set(
               jsonb_set(
                 jsonb_set(
                   COALESCE(assistance, '{}'::jsonb),
                   '{release_date}', to_jsonb($1::text)
                 ),
                 '{release_time}', to_jsonb($2::text)
               ),
               '{release_location}', to_jsonb($3::text)
             ),
             updated_at = NOW()
         WHERE reference_number = $4
            OR reference_number LIKE $4 || '-%'`,
        [appt.scheduled_date, appt.scheduled_time, appt.office_location || 'Quezon City Hall - SSDD Livelihood Center', appt.reference_no]
      ).catch(() => {});
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

    const inferredModule = cleanId.startsWith('CW') ? 'Child Welfare'
      : cleanId.startsWith('SP') ? 'Solo Parent'
      : cleanId.startsWith('PWD') ? 'PWD'
      : cleanId.startsWith('SENIOR') ? 'Senior Citizen'
      : targetModule || 'AICS';

    // 1. Update appointments table STRICTLY for this appointment (by id or by reference_no)
    const apptUpdate = await db.query(
      `UPDATE appointments
       SET status = $1,
           module = $2,
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id::text = $4
          OR id::text = $5
          OR reference_no = $4
          OR reference_no = $5
          OR REPLACE(reference_no, '-', '') = $6
       RETURNING *`,
      [newStatus, inferredModule, notes || null, rawId, cleanId, unhyphenated]
    );

    let apptRow = apptUpdate.rows[0];
    if (!apptRow) {
      const defaultConcern = inferredModule === 'Child Welfare'
        ? 'Child Protection & Welfare Support'
        : inferredModule === 'Solo Parent'
        ? 'Solo Parent Educational Assistance'
        : inferredModule === 'PWD'
        ? 'PWD Social Assistance'
        : 'Medical Assistance';

      const insertRes = await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         VALUES ($1, $2, $3, $4, $5, 'Quezon City Hall', $6)
         RETURNING *`,
        [
          cleanId,
          inferredModule,
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
    } else if (resolvedModule.includes('CHILD') || resolvedModule.includes('SOLO') || cleanId.startsWith('CW') || cleanId.startsWith('SP') || resolvedConcern.toLowerCase().includes('child') || resolvedConcern.toLowerCase().includes('solo')) {
      const cwStatus = (newStatus === 'approved' || newStatus === 'scheduled') ? 'interview_scheduled' : newStatus;
      await db.query(
        `UPDATE solo_parent_child_welfare_applications
         SET application_status = $1, status_remarks = 'Appointment updated to ' || $1, updated_at = NOW()
         WHERE id::text = $2
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3`,
        [cwStatus, cleanId, unhyphenated]
      ).catch(() => {});
    }

    // 3. Financial aid disbursement creation ONLY for approved non-GL cash assistance
    const isChildWelfare = resolvedModule.includes('CHILD') || resolvedConcern.toLowerCase().includes('child welfare') || resolvedConcern.toLowerCase().includes('child protection') || cleanId.startsWith('CW');
    const isAicsMedical = resolvedModule === 'AICS' || resolvedConcern.toLowerCase().includes('medical');

    if (newStatus === 'approved' || newStatus === 'completed' || newStatus === 'for_release') {
      const isPwdApp = resolvedModule === 'PWD' || resolvedConcern.toLowerCase().includes('pwd') || resolvedConcern.toLowerCase().includes('disability');

      // Note: AICS Medical uses Guarantee Letter (GL), and Child Welfare is non-monetary protective service — NEITHER use cash disbursement!
      if (!isAicsMedical && !isChildWelfare) {
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
