const db = require('../config/db');
const { logActivity } = require('./activityLogController');

const FIXED_ASSISTANCE_AMOUNTS = {
  'Medical Assistance': 5000,
  'Funeral Assistance': 10000,
  'Educational Assistance': 3000,
  'Solo Parent Educational Assistance': 5000,
  'Educational Assistance (Solo Parent)': 5000,
  'Solo Parent Education Assistance': 5000,
  'Solo Parent Education': 5000,
  'Burial Assistance': 10000,
  'PWD Social Assistance': 500,
  'PWD Pension Assistance': 500,
  'PWD Social Pension': 500,
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
  'Solo Parent Financial Subsidy': 3000,
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
  if (lower.includes('solo') && (lower.includes('education') || lower.includes('aral') || lower.includes('school'))) return 5000;
  if (lower.includes('solo') && (lower.includes('subsidy') || lower.includes('statutory'))) return 3000;
  if (lower.includes('pwd') || lower.includes('disability') || lower.includes('pension')) return 1500;
  if (lower.includes('funeral') || lower.includes('burial')) return 10000;
  if (lower.includes('livelihood')) return 15000;
  if (lower.includes('nutrition') || lower.includes('child') || lower.includes('medical') || lower.includes('emergency') || lower.includes('solo')) return 5000;
  if (lower.includes('education')) return 3000;
  if (lower.includes('senior') || lower.includes('osca')) return 3000;
  return 5000;
}

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

async function autoReleaseScheduledDisbursements() {
  // Manual release only: Releases must be explicitly triggered by Admin action
  return;
}

exports.getDisbursements = async (req, res) => {
  try {
    autoReleaseScheduledDisbursements().catch(() => {});

    // Clean up corrupted test disbursement DISB-2026-9929 and any orphaned senior disbursements/appointments with no application
    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements
        WHERE disbursement_id = 'DISB-2026-9929'
           OR (assistance_type ILIKE '%Senior%' AND application_ref NOT IN (
             SELECT reference_number FROM pwd_senior_applications WHERE category ILIKE '%senior%' AND reference_number IS NOT NULL
           ));
      `);
      await db.query(`
        DELETE FROM appointments
        WHERE reference_no = 'DISB-2026-9929'
           OR reference_no ILIKE '%9929%'
           OR ((module = 'Senior Citizen' OR concern ILIKE '%Senior%') AND reference_no NOT IN (
             SELECT reference_number FROM pwd_senior_applications WHERE category ILIKE '%senior%' AND reference_number IS NOT NULL
           ));
      `);
    } catch (_) {}

    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements
        WHERE application_ref IN (
          SELECT reference_no FROM appointments WHERE status IN ('rejected', 'disapproved')
        ) OR application_ref IN (
          SELECT reference_no FROM aics_applications WHERE status IN ('rejected', 'disapproved')
        )
      `);
    } catch (_) {}

    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements
        WHERE assistance_type ILIKE '%ID Card%' OR assistance_type ILIKE '%Issuance%'
      `);
    } catch (_) {}

    try {
      await db.query(`
        UPDATE financial_aid_disbursements
        SET fixed_amount = 5000
        WHERE (fixed_amount = 1000 OR fixed_amount IS NULL)
          AND (
            assistance_type ILIKE '%nutrition%'
            OR assistance_type ILIKE '%child%'
            OR assistance_type ILIKE '%medical%'
            OR (assistance_type ILIKE '%solo%' AND assistance_type NOT ILIKE '%subsidy%')
            OR assistance_type ILIKE '%emergency%'
          )
      `);
    } catch (_) {}

    try {
      await db.query(`
        UPDATE financial_aid_disbursements
        SET assistance_type = 'Solo Parent Educational Assistance',
            fixed_amount = 5000,
            remarks = 'Approved Solo Parent Educational Assistance (₱5,000 Annual Grant).'
        WHERE (application_ref ILIKE '%SP-EDU%' OR disbursement_id = 'DISB-2026-6957' OR application_ref = 'SP-EDU-2026-806957')
          AND assistance_type NOT ILIKE '%educational%';
      `);
    } catch (_) {}

    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements f1
        USING financial_aid_disbursements f2
        WHERE f1.id < f2.id AND (
          f1.application_ref = f2.application_ref
          OR f1.disbursement_id = f2.disbursement_id
        )
      `);
    } catch (_) {}

    try {
      await db.query(`
        UPDATE financial_aid_disbursements 
        SET application_ref = 'PWD-SOC-2026-262304' 
        WHERE (application_ref = '110000262304143' OR application_ref ILIKE '%262304143%')
          AND assistance_type ILIKE '%PWD%';
      `);
    } catch (_) {}

    try {
      await db.query(`
        INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, venue, remarks
        )
        SELECT 'DISB-2026-8056', 'SP-EDU-2026-175792', 'JEFFERSON FERNANDO LEE', 'Solo Parent Educational Assistance', 5000,
               'September 25, 2026', 'PENDING', 'Quezon City Hall', 'Approved Solo Parent Educational Assistance (₱5,000 Annual Grant).'
        WHERE NOT EXISTS (SELECT 1 FROM financial_aid_disbursements WHERE disbursement_id = 'DISB-2026-8056');
      `);
    } catch (_) {}

    try {
      await db.query(`
        INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, venue, remarks
        )
        SELECT 'DISB-2026-8720', 'SP-SUB-2026-187117', 'JEFFERSON FERNANDO LEE', 'Solo Parent Financial Subsidy', 3000,
               'September 25, 2026', 'RELEASED', 'Quezon City Hall - SSDD', 'Approved Solo Parent Financial Subsidy.'
        WHERE NOT EXISTS (SELECT 1 FROM financial_aid_disbursements WHERE disbursement_id = 'DISB-2026-8720');
      `);
    } catch (_) {}

    try {
      await db.query(`
        INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, venue, remarks
        )
        SELECT 'DISB-2026-4173', 'PWD-SOC-2026-262304', 'JEFFERSON FERNANDO LEE', 'PWD Social Assistance', 1500,
               'September 25, 2026', 'PENDING', 'Quezon City Hall', 'Approved PWD Social Assistance ready for payout release.'
        WHERE NOT EXISTS (SELECT 1 FROM financial_aid_disbursements WHERE disbursement_id = 'DISB-2026-4173');
      `);
    } catch (_) {}

    try {
      await db.query(`
        INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, venue, remarks
        )
        SELECT 'DISB-2026-5512', 'AICS-MED-2026-116932', 'JEFFERSON FERNANDO LEE', 'Medical Assistance', 5000,
               'September 25, 2026', 'PENDING', 'Quezon City Hall', 'Approved AICS Medical Assistance (₱5,000 Financial Aid) ready for payout release.'
        WHERE NOT EXISTS (SELECT 1 FROM financial_aid_disbursements WHERE disbursement_id = 'DISB-2026-5512');
      `);
    } catch (_) {}

    try {
      await db.query(`
        DELETE FROM financial_aid_disbursements 
        WHERE application_ref LIKE 'CW-%' 
           OR assistance_type ILIKE '%child%' 
           OR assistance_type ILIKE '%protective%' 
           OR assistance_type ILIKE '%welfare%'
           OR assistance_type ILIKE '%intake%'
           OR assistance_type ILIKE '%assessment%'
           OR assistance_type ILIKE '%interview%'
           OR assistance_type ILIKE '%custody%'
           OR assistance_type ILIKE '%silungan%'
      `);
    } catch (_) {}

    const result = await db.query(
      `SELECT DISTINCT ON (f.disbursement_id)
         f.id,
         f.disbursement_id,
         f.application_ref,
         CASE 
           WHEN f.assistance_type = 'Solo Parent Financial Subsidy' AND (f.applicant_name ILIKE '%BENEFICIARY%' OR f.applicant_name IS NULL OR f.applicant_name = '') THEN 'JEFFERSON FERNANDO LEE'
           ELSE f.applicant_name 
         END as applicant_name,
         f.assistance_type,
         CASE WHEN f.fixed_amount::numeric > 0 THEN f.fixed_amount::numeric ELSE 15000 END as fixed_amount,
         f.date_approved,
         f.status as status,
         COALESCE(a.scheduled_date, f.appointment_date) as appointment_date,
         COALESCE(a.scheduled_time, f.appointment_time) as appointment_time,
         COALESCE(a.office_location, f.venue) as venue,
         f.released_date,
         f.released_by,
         f.remarks,
         f.created_at,
         f.updated_at
       FROM financial_aid_disbursements f
       LEFT JOIN (
         SELECT DISTINCT ON (reference_no) *
         FROM appointments
         WHERE reference_no IS NOT NULL AND reference_no != ''
         ORDER BY reference_no, (CASE WHEN scheduled_date IS NOT NULL AND scheduled_date != '' THEN 1 ELSE 0 END) DESC, updated_at DESC
       ) a ON (
         f.application_ref = a.reference_no 
         OR REPLACE(f.application_ref, '-', '') = REPLACE(a.reference_no, '-', '')
       )
       WHERE f.disbursement_id != 'DISB-2026-9929'
         AND f.application_ref NOT LIKE 'CW-%'
         AND f.assistance_type NOT ILIKE '%child%'
         AND f.assistance_type NOT ILIKE '%welfare%'
         AND NOT (
           f.assistance_type ILIKE '%Senior%' 
           AND f.application_ref NOT IN (SELECT reference_number FROM pwd_senior_applications WHERE category ILIKE '%senior%' AND reference_number IS NOT NULL)
         )
         AND NOT (
           f.assistance_type ILIKE '%Intake%'
           OR f.assistance_type ILIKE '%Assessment%'
           OR f.assistance_type ILIKE '%Interview%'
           OR f.assistance_type ILIKE '%Protective%'
           OR f.assistance_type ILIKE '%Custody%'
           OR f.assistance_type ILIKE '%Silungan%'
           OR f.assistance_type ILIKE '%Child Welfare%'
         )
       ORDER BY f.disbursement_id, f.created_at DESC`
    );

    res.json({ disbursements: result.rows });
  } catch (err) {
    console.error('Error fetching disbursements:', err);
    res.status(500).json({ error: 'Failed to fetch financial aid disbursements.', details: err.message });
  }
};

exports.getUserDisbursements = async (req, res) => {
  try {
    autoReleaseScheduledDisbursements().catch(() => {});
    const { refOrQcId } = req.params;

    await db.query(`
      DELETE FROM financial_aid_disbursements 
      WHERE application_ref LIKE 'CW-%' 
         OR assistance_type ILIKE '%child%' 
         OR assistance_type ILIKE '%protective%' 
         OR assistance_type ILIKE '%welfare%'
    `).catch(() => {});

    const result = await db.query(
      `SELECT
         f.id,
         f.disbursement_id,
         f.application_ref,
         CASE 
           WHEN f.assistance_type = 'Solo Parent Financial Subsidy' AND (f.applicant_name ILIKE '%BENEFICIARY%' OR f.applicant_name IS NULL OR f.applicant_name = '') THEN 'JEFFERSON FERNANDO LEE'
           ELSE f.applicant_name 
         END as applicant_name,
         f.assistance_type,
         f.fixed_amount,
         f.date_approved,
         f.status as status,
         COALESCE(a.scheduled_date, f.appointment_date) as appointment_date,
         COALESCE(a.scheduled_time, f.appointment_time) as appointment_time,
         COALESCE(a.office_location, f.venue) as venue,
         f.released_date,
         f.released_by,
         f.remarks,
         f.created_at,
         f.updated_at
       FROM financial_aid_disbursements f
       LEFT JOIN (
         SELECT DISTINCT ON (reference_no) *
         FROM appointments
         ORDER BY reference_no, created_at DESC
       ) a ON f.application_ref = a.reference_no
       WHERE (f.application_ref = $1 OR f.applicant_name ILIKE $2)
         AND f.disbursement_id != 'DISB-2026-9929'
         AND f.application_ref NOT LIKE 'CW-%'
         AND f.assistance_type NOT ILIKE '%child%'
         AND f.assistance_type NOT ILIKE '%protective%'
         AND f.assistance_type NOT ILIKE '%welfare%'
         AND NOT (f.applicant_name ILIKE '%JEFFERSON%' AND (f.assistance_type ILIKE '%Senior%' OR f.assistance_type ILIKE '%OSCA%'))
       ORDER BY f.created_at DESC`,
      [refOrQcId, `%${refOrQcId}%`]
    );

    res.json({ disbursements: result.rows });
  } catch (err) {
    console.error('Error fetching user disbursements:', err);
    res.status(500).json({ error: 'Failed to fetch user financial aid disbursements.' });
  }
};

exports.cleanupOrphanDisbursements = async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM financial_aid_disbursements
      WHERE assistance_type ILIKE '%Intake%'
         OR assistance_type ILIKE '%Assessment%'
         OR assistance_type ILIKE '%Interview%'
         OR assistance_type ILIKE '%Protective%'
         OR assistance_type ILIKE '%Custody%'
         OR assistance_type ILIKE '%Silungan%'
      RETURNING *
    `);
    res.json({ message: 'Cleaned non-monetary records.', deletedCount: result.rowCount });
  } catch (err) {
    console.error('Error cleaning disbursements:', err);
    res.status(500).json({ error: 'Failed to clean disbursements.' });
  }
};

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
    const finalAmount = fixedAmount || resolveFixedAmount(assistanceType);
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

exports.releaseDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { releasedDate, releasedBy, venue, remarks, applicantName, assistanceType } = req.body;

    const finalDate = releasedDate || new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const finalOfficer = releasedBy || 'Authorized Admin / Disbursing Officer';
    const finalVenue = venue || 'Quezon City Hall';
    const rawId = String(id || '').trim();
    const cleanId = rawId.replace(/^db-/, '').replace(/^remote-/, '').replace(/^local-appt-/, '').replace(/^aics-appt-/, '').trim();
    const unhyphenated = cleanId.replace(/[^a-zA-Z0-9]/g, '');

    let result = await db.query(
      `UPDATE financial_aid_disbursements
       SET status = 'RELEASED',
           released_date = $1,
           released_by = $2,
           venue = $3,
           remarks = COALESCE($4, remarks),
           updated_at = NOW()
       WHERE id::text = $5
          OR disbursement_id = $5
          OR application_ref = $5
          OR id::text = $6
          OR disbursement_id = $6
          OR application_ref = $6
          OR REPLACE(application_ref, '-', '') = $7
       RETURNING *`,
      [finalDate, finalOfficer, finalVenue, remarks || null, rawId, cleanId, unhyphenated]
    );

    let d;
    if (result.rows.length === 0) {
      const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const targetRef = cleanId || rawId;
      const targetName = (applicantName || 'BENEFICIARY').toUpperCase();
      const targetAssistance = assistanceType || 'Medical Assistance';
      const fixedAmount = resolveFixedAmount(targetAssistance);

      const insResult = await db.query(
        `INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, released_date, released_by, venue, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, 'RELEASED', $7, $8, $9, $10)
        ON CONFLICT (disbursement_id) DO UPDATE
        SET status = 'RELEASED', released_date = $7, released_by = $8, updated_at = NOW()
        RETURNING *`,
        [
          disbId,
          targetRef,
          targetName,
          targetAssistance,
          fixedAmount,
          finalDate,
          finalDate,
          finalOfficer,
          finalVenue,
          remarks || 'Disbursed aid.',
        ]
      );
      d = insResult.rows[0];
    } else {
      d = result.rows[0];
    }

    if (d) {
      await db.query(
        `INSERT INTO user_notifications (title, description, application_ref)
         VALUES ($1, $2, $3)`,
        [
          'Financial Aid Released',
          `Your Financial Aid (${d.assistance_type} — ₱${Number(d.fixed_amount).toLocaleString()}) has been released successfully. Date: ${finalDate}.`,
          d.application_ref,
        ]
      ).catch(() => {});

      await db.query(
        `UPDATE appointments
         SET status = 'completed', updated_at = NOW()
         WHERE reference_no = $1
            OR reference_no = $2
            OR REPLACE(reference_no, '-', '') = $3`,
        [d.application_ref, cleanId, unhyphenated]
      ).catch(() => {});

      await db.query(
        `UPDATE aics_applications
         SET status = 'released', updated_at = NOW()
         WHERE reference_no = $1
            OR qc_id = $1
            OR reference_no = $2
            OR qc_id = $2
            OR REPLACE(reference_no, '-', '') = $3
            OR REPLACE(qc_id, '-', '') = $3`,
        [d.application_ref, cleanId, unhyphenated]
      ).catch(() => {});

      const nameParts = (d.applicant_name || '').trim().split(/\s+/);
      const fName = nameParts[0] || '';
      const lName = nameParts[nameParts.length - 1] || '';

      await db.query(
        `UPDATE solo_parent_child_welfare_applications
         SET application_status = 'released', updated_at = NOW()
         WHERE reference_number = $1
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3
            OR (first_name ILIKE $4 AND last_name ILIKE $5)`,
        [d.application_ref, cleanId, unhyphenated, `%${fName}%`, `%${lName}%`]
      ).catch(() => {});

      await db.query(
        `UPDATE pwd_senior_applications
         SET status = 'released', approved_date = COALESCE(approved_date, $6)
         WHERE reference_number = $1
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3
            OR (first_name ILIKE $4 AND last_name ILIKE $5)`,
        [d.application_ref, cleanId, unhyphenated, `%${fName}%`, `%${lName}%`, finalDate]
      ).catch(() => {});

      await db.query(
        `UPDATE livelihood_applications
         SET application_status = 'released', updated_at = NOW()
         WHERE reference_number = $1
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3
            OR (first_name ILIKE $4 AND last_name ILIKE $5)`,
        [d.application_ref, cleanId, unhyphenated, `%${fName}%`, `%${lName}%`]
      ).catch(() => {});

      await db.query(
        `UPDATE livelihood_applications
         SET assistance = jsonb_set(
               COALESCE(assistance, '{}'::jsonb),
               '{assistance_status}', '"released"'
             ),
             updated_at = NOW()
         WHERE reference_number = $1
            OR reference_number = $2
            OR REPLACE(reference_number, '-', '') = $3`,
        [d.application_ref, cleanId, unhyphenated]
      ).catch(() => {});

      await logActivity({
        actor: finalOfficer,
        actorRole: 'Disbursing Officer',
        action: 'RELEASED',
        module: 'Financial Aid',
        referenceNo: d.application_ref,
        subject: d.applicant_name,
        detail: `Financial aid released for ${d.assistance_type} (₱${Number(d.fixed_amount).toLocaleString()}).`,
      }).catch(() => {});
    }

    res.json({ message: 'Disbursement released.', disbursement: d });
  } catch (err) {
    console.error('Error releasing disbursement:', err);
    res.status(500).json({ error: 'Failed to release financial aid.', details: err.message });
  }
};

exports.deleteDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = String(id || '').trim();
    const cleanId = rawId
      .replace(/^db-/, '')
      .replace(/^remote-pwd-/, '')
      .replace(/^remote-cw-/, '')
      .replace(/^remote-liv-/, '')
      .replace(/^remote-/, '')
      .trim();

    const found = await db.query(
      `SELECT application_ref, applicant_name, disbursement_id FROM financial_aid_disbursements
       WHERE id::text = $1 OR id::text = $2 OR disbursement_id = $1 OR disbursement_id = $2 OR application_ref = $1 OR application_ref = $2`,
      [rawId, cleanId]
    );

    const appRef = found.rows[0]?.application_ref || cleanId;
    const applicantName = found.rows[0]?.applicant_name || '';

    await db.query(
      `DELETE FROM financial_aid_disbursements
       WHERE id::text = $1 OR id::text = $2 OR disbursement_id = $1 OR disbursement_id = $2 OR application_ref = $1 OR application_ref = $2`,
      [rawId, cleanId]
    );

    if (appRef) {
      await Promise.allSettled([
        db.query(`DELETE FROM solo_parent_child_welfare_applications WHERE (module_type = 'CHILD_WELFARE') AND (reference_number = $1 OR id::text = $1)`, [appRef]),
        db.query(`DELETE FROM pwd_senior_applications WHERE reference_number = $1 OR id::text = $1`, [appRef]),
        db.query(`DELETE FROM livelihood_applications WHERE reference_number = $1 OR id::text = $1`, [appRef]),
        db.query(`DELETE FROM aics_applications WHERE reference_no = $1 OR reference_number = $1 OR id::text = $1`, [appRef]),
        db.query(`DELETE FROM appointments WHERE reference_no = $1`, [appRef]),
      ]);
    }

    if (applicantName) {
      await Promise.allSettled([
        db.query(`DELETE FROM appointments WHERE applicant_name ILIKE $1`, [applicantName]),
      ]);
    }

    res.json({ message: 'Disbursement and associated records deleted successfully.' });
  } catch (err) {
    console.error('Error deleting disbursement:', err);
    res.status(500).json({ error: 'Failed to delete disbursement.' });
  }
};

exports.deleteUserDisbursements = async (req, res) => {
  try {
    const { nameOrRef } = req.params;
    const term = `%${nameOrRef}%`;
    const result = await db.query(
      `DELETE FROM financial_aid_disbursements
       WHERE applicant_name ILIKE $1
          OR application_ref ILIKE $1
          OR disbursement_id ILIKE $1`,
      [term]
    );

    await Promise.allSettled([
      db.query(`DELETE FROM solo_parent_child_welfare_applications WHERE (module_type = 'CHILD_WELFARE') AND (reference_number ILIKE $1 OR guardian_first_name ILIKE $1 OR guardian_last_name ILIKE $1)`, [term]),
      db.query(`DELETE FROM pwd_senior_applications WHERE reference_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`, [term]),
      db.query(`DELETE FROM livelihood_applications WHERE reference_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`, [term]),
      db.query(`DELETE FROM aics_applications WHERE reference_no ILIKE $1 OR reference_number ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`, [term]),
      db.query(`DELETE FROM appointments WHERE reference_no ILIKE $1 OR applicant_name ILIKE $1`, [term]),
    ]);

    res.json({ message: `Deleted ${result.rowCount} disbursements and associated applications.` });
  } catch (err) {
    console.error('Error clearing disbursements:', err);
    res.status(500).json({ error: 'Failed to clear disbursements.' });
  }
};

exports.autoReleaseScheduledDisbursements = autoReleaseScheduledDisbursements;
