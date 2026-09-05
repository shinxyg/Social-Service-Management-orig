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

// Helper: parse date and time string to Date object in Philippine Standard Time (UTC+8)
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

// Background auto-release check
async function autoReleaseScheduledDisbursements() {
  try {
    const result = await db.query(
      `SELECT f.*, COALESCE(a.scheduled_date, f.appointment_date) as final_appt_date, COALESCE(a.scheduled_time, f.appointment_time) as final_appt_time
       FROM financial_aid_disbursements f
       LEFT JOIN appointments a ON f.application_ref = a.reference_no
       WHERE f.status = 'PENDING' OR a.status = 'scheduled'`
    );

    const now = new Date();
    for (const d of result.rows) {
      const apptDate = d.final_appt_date || d.appointment_date;
      const apptTime = d.final_appt_time || d.appointment_time;

      if (!apptDate) continue;

      const scheduledDt = parseDateTime(apptDate, apptTime);
      if (scheduledDt && now.getTime() >= scheduledDt.getTime()) {
        const releaseTime = apptTime || now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        const releaseDate = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

        // 1. Mark Financial Aid as RELEASED
        if (d.status === 'PENDING') {
          await db.query(
            `UPDATE financial_aid_disbursements
             SET status = 'RELEASED',
                 released_date = $1,
                 released_by = 'Automated Scheduled Payout System / Disbursing Officer',
                 remarks = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [`${releaseDate} ${releaseTime}`, `Awtomatikong na-release sa takdang oras ng appointment (${apptDate} - ${releaseTime}).`, d.id]
          );

          // 2. Add Notification
          await db.query(
            `INSERT INTO user_notifications (title, description, application_ref)
             VALUES ($1, $2, $3)`,
            [
              'Na-release na ang Inyong Ayuda',
              `Your Financial Aid (${d.assistance_type} — ₱${Number(d.fixed_amount).toLocaleString()}) has been automatically released at the scheduled appointment time (${apptDate} – ${releaseTime}).`,
              d.application_ref,
            ]
          );

          // 3. Log Activity
          await logActivity({
            actor: 'System Auto-Release',
            actorRole: 'Automated Worker',
            action: 'RELEASED',
            module: 'Financial Aid',
            referenceNo: d.application_ref,
            subject: d.applicant_name,
            detail: `Automated financial aid payout released for ${d.assistance_type} (₱${Number(d.fixed_amount).toLocaleString()}).`,
          });

          // 4. If this is a Livelihood assistance disbursement, also update livelihood_assistance & auto-activate monitoring
          if (d.application_ref && (d.application_ref.startsWith('LP-') || (d.assistance_type && d.assistance_type.includes('Livelihood')))) {
            await db.query(
              `UPDATE livelihood_assistance
               SET assistance_status = 'released',
                   release_date = COALESCE(release_date, $1),
                   release_time = COALESCE(release_time, $2),
                   release_location = COALESCE(release_location, $3),
                   released_at = NOW(),
                   released_by = 'Automated Scheduled Payout System / Disbursing Officer',
                   updated_at = NOW()
               WHERE reference_number = $4`,
              [apptDate, releaseTime, d.venue || 'Quezon City Hall - SSDD Livelihood Center', d.application_ref]
            );

            const appRes = await db.query('SELECT id FROM livelihood_applications WHERE reference_number = $1', [d.application_ref]);
            if (appRes.rows.length > 0) {
              const appId = appRes.rows[0].id;
              const monCheck = await db.query('SELECT id FROM livelihood_monitoring WHERE application_id = $1', [appId]);
              if (monCheck.rows.length === 0) {
                await db.query(
                  `INSERT INTO livelihood_monitoring (
                    application_id, reference_number, monitoring_status, log_type,
                    title, notes, officer_name, inspection_date
                  ) VALUES ($1, $2, 'active', 'inspection', $3, $4, $5, $6)`,
                  [
                    appId,
                    d.application_ref,
                    'Initial Assistance Release & Monitoring Setup',
                    `Capital / Materials assistance automatically released via Financial Aid appointment payout (${apptDate} – ${releaseTime}). Active monitoring initiated.`,
                    'Automated Scheduled Payout System',
                    now.toISOString().split('T')[0],
                  ]
                );
              }
            }
          }
        }

        // 5. Mark Appointment as COMPLETED
        await db.query(
          `UPDATE appointments
           SET status = 'completed',
               updated_at = NOW()
           WHERE reference_no = $1 AND status != 'completed'`,
          [d.application_ref]
        );
      }
    }
  } catch (err) {
    console.warn('Auto-release worker check note:', err.message);
  }
}

// GET /api/financial-aid
exports.getDisbursements = async (req, res) => {
  try {
    await autoReleaseScheduledDisbursements();

    // Auto-clean any orphan disbursements that do not exist in active approved applications
    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements
        WHERE (
          application_ref NOT LIKE 'LP-%' 
          AND application_ref NOT IN (
            SELECT reference_number FROM pwd_senior_applications WHERE status IN ('approved', 'completed', 'for_release')
          )
          AND application_ref IN (
            SELECT f.application_ref FROM financial_aid_disbursements f
            LEFT JOIN aics_applications a ON f.application_ref = a.reference_no
            WHERE a.id IS NULL OR a.status NOT IN ('approved', 'completed', 'for_release')
          )
        ) OR (
          application_ref LIKE 'LP-%' AND application_ref IN (
            SELECT f.application_ref FROM financial_aid_disbursements f
            LEFT JOIN livelihood_applications l ON f.application_ref = l.reference_number
            WHERE l.id IS NULL OR l.application_status != 'approved'
          )
        )
      `);
    } catch (_) {}

    // Auto-populate disbursements from approved livelihood applications if not yet present
    try {
      const approvedLivelihood = await db.query(
        `SELECT reference_number, first_name, last_name, estimated_amount FROM livelihood_applications WHERE application_status = 'approved'`
      );
      for (const row of approvedLivelihood.rows) {
        const disbCheck = await db.query(
          'SELECT id FROM financial_aid_disbursements WHERE application_ref = $1',
          [row.reference_number]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim().toUpperCase() || 'BENEFICIARY';
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              row.reference_number,
              fullName,
              'Livelihood Capital Assistance',
              Number(row.estimated_amount) > 0 ? Number(row.estimated_amount) : 15000,
              new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall - SSDD Livelihood Center',
              'Approved Livelihood Seed Capital Assistance. Ready for Appointment scheduling and payout.',
            ]
          );
        }
      }

      // Fix any existing zero-amount livelihood disbursements
      await db.query(
        `UPDATE financial_aid_disbursements
         SET fixed_amount = 15000
         WHERE (fixed_amount::numeric = 0 OR fixed_amount IS NULL) AND assistance_type LIKE '%Livelihood%'`
      );
    } catch (_) {}

    // Auto-populate disbursements from approved PWD & Senior Citizen Social Assistance
    try {
      const approvedPwdAssistance = await db.query(
        `SELECT reference_number, category, type, first_name, middle_name, last_name, suffix, approved_date
         FROM pwd_senior_applications 
         WHERE status = 'approved' AND (type = 'assistance' OR type = 'social-assistance' OR category ILIKE '%assistance%')`
      );
      for (const row of approvedPwdAssistance.rows) {
        const disbCheck = await db.query(
          'SELECT id FROM financial_aid_disbursements WHERE application_ref = $1',
          [row.reference_number]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
          const isPwd = String(row.category || '').toUpperCase().includes('PWD');
          const assistanceType = isPwd ? 'PWD Social Assistance' : 'Senior Social Assistance';
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              row.reference_number,
              fullName,
              assistanceType,
              2000,
              row.approved_date || new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall',
              'Approved PWD/Senior Social Assistance. Ready for Appointment scheduling and payout.',
            ]
          );
        }
      }
    } catch (_) {}

    const result = await db.query(
      `SELECT
         f.id,
         f.disbursement_id,
         f.application_ref,
         f.applicant_name,
         f.assistance_type,
         CASE WHEN f.fixed_amount::numeric > 0 THEN f.fixed_amount::numeric ELSE 15000 END as fixed_amount,
         f.date_approved,
         CASE WHEN a.status = 'completed' OR f.status = 'RELEASED' THEN 'RELEASED' ELSE f.status END as status,
         COALESCE(a.scheduled_date, f.appointment_date) as appointment_date,
         COALESCE(a.scheduled_time, f.appointment_time) as appointment_time,
         COALESCE(a.office_location, f.venue) as venue,
         COALESCE(f.released_date, CASE WHEN a.status = 'completed' THEN CONCAT(COALESCE(a.scheduled_date, f.appointment_date), ' ', COALESCE(a.scheduled_time, f.appointment_time)) ELSE NULL END) as released_date,
         COALESCE(f.released_by, 'Automated Scheduled Payout System / Disbursing Officer') as released_by,
         f.remarks,
         f.created_at,
         f.updated_at
       FROM financial_aid_disbursements f
       LEFT JOIN (
         SELECT DISTINCT ON (reference_no) *
         FROM appointments
         ORDER BY reference_no, created_at DESC
       ) a ON f.application_ref = a.reference_no
       ORDER BY f.created_at DESC`
    );

    res.json({ disbursements: result.rows });
  } catch (err) {
    console.error('Error fetching disbursements:', err);
    res.status(500).json({ error: 'Failed to fetch financial aid disbursements.', details: err.message });
  }
};

// GET /api/financial-aid/user/:refOrQcId
exports.getUserDisbursements = async (req, res) => {
  try {
    await autoReleaseScheduledDisbursements();
    const { refOrQcId } = req.params;

    const result = await db.query(
      `SELECT
         f.id,
         f.disbursement_id,
         f.application_ref,
         f.applicant_name,
         f.assistance_type,
         f.fixed_amount,
         f.date_approved,
         CASE WHEN a.status = 'completed' OR f.status = 'RELEASED' THEN 'RELEASED' ELSE f.status END as status,
         COALESCE(a.scheduled_date, f.appointment_date) as appointment_date,
         COALESCE(a.scheduled_time, f.appointment_time) as appointment_time,
         COALESCE(a.office_location, f.venue) as venue,
         COALESCE(f.released_date, CASE WHEN a.status = 'completed' THEN CONCAT(COALESCE(a.scheduled_date, f.appointment_date), ' ', COALESCE(a.scheduled_time, f.appointment_time)) ELSE NULL END) as released_date,
         COALESCE(f.released_by, 'Automated Scheduled Payout System / Disbursing Officer') as released_by,
         f.remarks,
         f.created_at,
         f.updated_at
       FROM financial_aid_disbursements f
       INNER JOIN aics_applications app ON f.application_ref = app.reference_no
       LEFT JOIN appointments a ON f.application_ref = a.reference_no
       WHERE (f.application_ref = $1 OR f.applicant_name ILIKE $2)
         AND app.status IN ('approved', 'completed', 'for_release')
       ORDER BY f.created_at DESC`,
      [refOrQcId, `%${refOrQcId}%`]
    );

    res.json({ disbursements: result.rows });
  } catch (err) {
    console.error('Error fetching user disbursements:', err);
    res.status(500).json({ error: 'Failed to fetch user financial aid disbursements.' });
  }
};

// DELETE /api/financial-aid/:id
exports.deleteDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const isNum = /^\d+$/.test(id);
    if (isNum) {
      await db.query(`DELETE FROM financial_aid_disbursements WHERE id = $1 OR disbursement_id = $2 OR application_ref = $2`, [parseInt(id, 10), id]);
    } else {
      await db.query(`DELETE FROM financial_aid_disbursements WHERE disbursement_id = $1 OR application_ref = $1`, [id]);
    }
    res.json({ message: 'Disbursement record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting disbursement:', err);
    res.status(500).json({ error: 'Failed to delete disbursement.' });
  }
};

// POST /api/financial-aid/cleanup
exports.cleanupOrphanDisbursements = async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM financial_aid_disbursements
      WHERE application_ref NOT IN (
        SELECT reference_no FROM aics_applications WHERE status IN ('approved', 'completed', 'for_release')
      )
      RETURNING *
    `);
    res.json({ message: 'Cleaned orphan records.', deletedCount: result.rowCount });
  } catch (err) {
    console.error('Error cleaning disbursements:', err);
    res.status(500).json({ error: 'Failed to clean disbursements.' });
  }
};

// POST /api/financial-aid
exports.createDisbursement = async (req, res) => {
  try {
    const {
      applicationRef,
      applicantName,
      assistanceType,
      fixedAmount,
      dateApproved,
      appointmentDate,
      appointmentTime,
      venue,
      remarks,
    } = req.body;

    if (!applicationRef || !applicantName || !assistanceType) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const cleanAssistance = assistanceType.includes('Assistance') ? assistanceType : `${assistanceType} Assistance`;
    const finalAmount = fixedAmount || FIXED_ASSISTANCE_AMOUNTS[cleanAssistance] || 1000;
    const finalDateApproved = dateApproved || new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const disbursementId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.query(
      `INSERT INTO financial_aid_disbursements
        (disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
         date_approved, status, appointment_date, appointment_time, venue, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)
       ON CONFLICT (disbursement_id) DO UPDATE
       SET updated_at = NOW()
       RETURNING *`,
      [
        disbursementId,
        applicationRef,
        applicantName.toUpperCase(),
        cleanAssistance,
        finalAmount,
        finalDateApproved,
        appointmentDate || null,
        appointmentTime || null,
        venue || 'Quezon City Hall',
        remarks || 'Automatic generated upon approval with scheduled payout appointment.',
      ]
    );

    res.status(201).json({ message: 'Disbursement created.', disbursement: result.rows[0] });
  } catch (err) {
    console.error('Error creating disbursement:', err);
    res.status(500).json({ error: 'Failed to create financial aid disbursement.' });
  }
};

// PUT /api/financial-aid/:id/release
exports.releaseDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { releasedDate, releasedBy, venue, remarks } = req.body;

    const finalDate = releasedDate || new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const finalOfficer = releasedBy || 'Authorized Admin / Disbursing Officer';
    const finalVenue = venue || 'Quezon City Hall';

    const isNum = /^\d+$/.test(id);
    let result;
    if (isNum) {
      result = await db.query(
        `UPDATE financial_aid_disbursements
         SET status = 'RELEASED',
             released_date = $1,
             released_by = $2,
             venue = $3,
             remarks = COALESCE($4, remarks),
             updated_at = NOW()
         WHERE id = $5 OR disbursement_id = $6 OR application_ref = $6
         RETURNING *`,
        [finalDate, finalOfficer, finalVenue, remarks, parseInt(id, 10), id]
      );
    } else {
      result = await db.query(
        `UPDATE financial_aid_disbursements
         SET status = 'RELEASED',
             released_date = $1,
             released_by = $2,
             venue = $3,
             remarks = COALESCE($4, remarks),
             updated_at = NOW()
         WHERE disbursement_id = $5 OR application_ref = $5
         RETURNING *`,
        [finalDate, finalOfficer, finalVenue, remarks, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Disbursement not found.' });
    }

    const d = result.rows[0];

    // Notification to citizen
    await db.query(
      `INSERT INTO user_notifications (title, description, application_ref)
       VALUES ($1, $2, $3)`,
      [
        'Na-release na ang Inyong Ayuda',
        `Your Financial Aid (${d.assistance_type} — ₱${Number(d.fixed_amount).toLocaleString()}) has been released successfully. Date: ${finalDate}.`,
        d.application_ref,
      ]
    );

    // Update appointment status to completed if matched
    await db.query(
      `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE reference_no = $1`,
      [d.application_ref]
    );

    // Log activity
    await logActivity({
      actor: finalOfficer,
      actorRole: 'Disbursing Officer',
      action: 'RELEASED',
      module: 'Financial Aid',
      referenceNo: d.application_ref,
      subject: d.applicant_name,
      detail: `Financial aid released for ${d.assistance_type} (₱${Number(d.fixed_amount).toLocaleString()}).`,
    });

    res.json({ message: 'Disbursement released.', disbursement: d });
  } catch (err) {
    console.error('Error releasing disbursement:', err);
    res.status(500).json({ error: 'Failed to release financial aid.' });
  }
};

// Periodic runner export
exports.autoReleaseScheduledDisbursements = autoReleaseScheduledDisbursements;
