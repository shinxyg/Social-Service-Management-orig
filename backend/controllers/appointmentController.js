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
  'Livelihood Capital Assistance': 15000,
  'Livelihood Assistance': 15000,
  'Livelihood Program': 15000,
};

async function initAppointmentTables() {
  try {
    await db.query(`
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

// GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    // 0. Get deleted reference numbers to exclude
    const deletedRes = await db.query('SELECT reference_no FROM deleted_appointments').catch(() => ({ rows: [] }));
    const deletedSet = new Set(deletedRes.rows.map((r) => String(r.reference_no).toLowerCase().trim()));

    // Purge any appointments belonging to pending or rejected AICS applications
    await db.query(`
      DELETE FROM appointments
      WHERE module = 'AICS' AND reference_no IN (
        SELECT reference_no FROM aics_applications WHERE status NOT IN ('approved', 'completed', 'for_release')
      )
    `);

    // Purge any appointments belonging to pending or rejected PWD / Senior applications
    try {
      await db.query(`
        DELETE FROM appointments
        WHERE module IN ('PWD', 'Senior Citizen') AND reference_no IN (
          SELECT reference_number FROM pwd_senior_applications WHERE status NOT IN ('approved', 'completed', 'for_release')
        )
      `);
    } catch (_) {}

    // Deduplicate appointments table
    try {
      await db.query(`
        DELETE FROM appointments a
        USING appointments b
        WHERE a.id < b.id AND a.reference_no = b.reference_no
      `);
    } catch (_) {}

    // Auto-populate appointments from approved livelihood applications if not yet present and not deleted
    try {
      const approvedLivelihood = await db.query(
        `SELECT reference_number, first_name, last_name FROM livelihood_applications WHERE application_status = 'approved'`
      );
      for (const row of approvedLivelihood.rows) {
        const refNo = String(row.reference_number || '').trim();
        if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;
        const checkAppt = await db.query('SELECT id FROM appointments WHERE reference_no = $1', [refNo]);
        if (checkAppt.rows.length === 0) {
          const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim().toUpperCase() || 'BENEFICIARY';
          await db.query(
            `INSERT INTO appointments
              (reference_no, module, applicant_name, concern, status, office_location, notes)
             VALUES ($1, 'Livelihood', $2, 'Livelihood Capital Assistance', 'pending', 'Quezon City Hall - SSDD Livelihood Center', 'Awtomatikong pumasok mula sa na-aprubahang Livelihood application para sa scheduling.')
             ON CONFLICT DO NOTHING`,
            [refNo, fullName]
          );
        }
      }
    } catch (_) {}
             ON CONFLICT DO NOTHING`,
            [row.reference_number, fullName]
          );
        }
      }
    } catch (_) {}

    // Auto-populate appointments from approved PWD & Senior Citizen Social Assistance applications if not yet present and not deleted
    try {
      const approvedPwdSenior = await db.query(
        `SELECT reference_number, category, type, first_name, middle_name, last_name, suffix 
         FROM pwd_senior_applications 
         WHERE status IN ('approved', 'completed', 'for_release') 
           AND (type ILIKE '%assist%' OR category ILIKE '%assist%' OR service ILIKE '%assist%' OR disability_class ILIKE '%assist%' OR extra_data ILIKE '%assist%')`
      );
      for (const row of approvedPwdSenior.rows) {
        const refNo = String(row.reference_number || '').trim();
        if (!refNo || deletedSet.has(refNo.toLowerCase())) continue;

        const isPwd = String(row.category || '').toUpperCase().includes('PWD');
        const mod = isPwd ? 'PWD' : 'Senior Citizen';
        const concern = isPwd ? 'PWD Social Assistance' : 'Senior Social Assistance';

        const checkAppt = await db.query('SELECT id FROM appointments WHERE reference_no = $1', [refNo]);
        if (checkAppt.rows.length === 0) {
          const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
          await db.query(
            `INSERT INTO appointments
              (reference_no, module, applicant_name, concern, status, office_location, notes)
             VALUES ($1, $2, $3, $4, 'pending', 'Quezon City Hall', 'Awtomatikong pumasok mula sa na-aprubahang Social Assistance aplikasyon para sa scheduling.')
             ON CONFLICT DO NOTHING`,
            [refNo, mod, fullName, concern]
          );
        }
      }
    } catch (_) {}

    const result = await db.query(
      `SELECT a.* FROM appointments a
       WHERE (
            a.reference_no LIKE 'LP-%'
         OR a.module IN ('Livelihood', 'PWD', 'Senior Citizen', 'Solo Parent', 'Child Welfare')
         OR a.reference_no IN (
           SELECT reference_no FROM aics_applications WHERE status IN ('approved', 'completed', 'for_release')
         )
         OR a.reference_no IN (
           SELECT reference_number FROM pwd_senior_applications WHERE status IN ('approved', 'completed', 'for_release')
         )
       )
       AND a.reference_no NOT IN (SELECT reference_no FROM deleted_appointments)
       ORDER BY a.created_at DESC`
    );
    res.json({ appointments: result.rows, deletedReferences: Array.from(deletedSet) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments.', details: err.message });
  }
};

// POST /api/appointments
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

    const result = await db.query(
      `INSERT INTO appointments
        (reference_no, module, applicant_name, concern, status, scheduled_date, scheduled_time, office_location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING
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

    // If scheduled immediately, sync to financial aid and notify
    if (scheduledDate) {
      await syncAppointmentWithDisbursement(appt);
    }

    res.status(201).json({ message: 'Appointment created.', appointment: appt });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment.' });
  }
};

// PUT /api/appointments/:id/schedule
exports.scheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, officeLocation, notes, applicantName, concern } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Date and time are required.' });
    }

    // Format human readable date
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
      // If not yet in appointments table, insert as scheduled!
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

    // Auto-sync with Financial Aid Disbursement
    await syncAppointmentWithDisbursement(appt);

    res.json({ message: 'Appointment scheduled and synced with Financial Aid.', appointment: appt });
  } catch (err) {
    console.error('Error scheduling appointment:', err);
    res.status(500).json({ error: 'Failed to schedule appointment.', details: err.message });
  }
};

// Helper: sync appointment details directly to financial_aid_disbursements table
async function syncAppointmentWithDisbursement(appt) {
  try {
    const cleanAssistance = appt.concern.includes('Assistance') ? appt.concern : `${appt.concern} Assistance`;
    const fixedAmount = FIXED_ASSISTANCE_AMOUNTS[cleanAssistance] || FIXED_ASSISTANCE_AMOUNTS[appt.concern] || 1000;
    const disbursementId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const checkDisb = await db.query(
      `SELECT * FROM financial_aid_disbursements WHERE application_ref = $1`,
      [appt.reference_no]
    );

    if (checkDisb.rows.length > 0) {
      await db.query(
        `UPDATE financial_aid_disbursements
         SET appointment_date = $1,
             appointment_time = $2,
             venue = $3,
             updated_at = NOW()
         WHERE application_ref = $4`,
        [appt.scheduled_date, appt.scheduled_time, appt.office_location || 'Quezon City Hall', appt.reference_no]
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

    // Sync appointment date, time, and location to livelihood_assistance if LP-
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

    // User Notification
    await db.query(
      `INSERT INTO user_notifications (title, description, application_ref)
       VALUES ($1, $2, $3)`,
      [
        'Nakatakda ang Inyong Payout Appointment',
        `Your Financial Aid payout appointment has been scheduled.\nDate: ${appt.scheduled_date}\nTime: ${appt.scheduled_time}\nLocation: ${appt.office_location || 'Quezon City Hall'}\nAmount: ₱${fixedAmount.toLocaleString()}`,
        appt.reference_no,
      ]
    );

    // Activity Log
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

// PUT /api/appointments/:id/complete
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();
    const result = await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE reference_no = $1 OR id::text = $1 RETURNING *`,
      [cleanId]
    );

    // Deduplicate any duplicate appointment records with the same reference_no
    try {
      await db.query(`
        DELETE FROM appointments a
        USING appointments b
        WHERE a.id < b.id AND a.reference_no = b.reference_no
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

// DELETE /api/appointments/:id
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = String(id || '').trim();
    const cleanId = raw.replace(/^db-appt-/, '').replace(/^aics-appt-/, '').replace(/^pwd-senior-appt-/, '').replace(/^cw-appt-/, '').trim();

    // 1. Delete from appointments table
    await db.query(`DELETE FROM appointments WHERE id::text = $1 OR reference_no = $1 OR id::text = $2 OR reference_no = $2`, [raw, cleanId]);

    // 2. Track in deleted_appointments table
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

    // 3. Log Activity
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

// DELETE /api/appointments/cleanup-user/:nameOrRef
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
