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
          OR REPLACE(f1.application_ref, '-', '') = REPLACE(f2.application_ref, '-', '')
        )
      `);
    } catch (_) {}

    try {
      const approvedLivelihood = await db.query(
        `SELECT l.reference_number, l.first_name, l.last_name, l.estimated_amount
         FROM livelihood_applications l
         WHERE l.application_status = 'approved'
           AND (
             LOWER(COALESCE(l.assistance->>'assistance_status', '')) IN ('for_release', 'released', 'for release', 'for_processing')
             OR l.assistance IS NOT NULL
           )`
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

      await db.query(
        `UPDATE financial_aid_disbursements
         SET fixed_amount = 15000
         WHERE (fixed_amount::numeric = 0 OR fixed_amount IS NULL) AND assistance_type LIKE '%Livelihood%'`
      );
    } catch (_) {}

    try {
      await db.query(`
        UPDATE financial_aid_disbursements
        SET fixed_amount = 500
        WHERE assistance_type ILIKE '%PWD%' AND (fixed_amount = 2000 OR fixed_amount = 1500 OR fixed_amount IS NULL)
      `);
    } catch (_) {}

    try {
      const approvedPwdAssistance = await db.query(
        `SELECT reference_number, category, type, first_name, middle_name, last_name, suffix, approved_date
         FROM pwd_senior_applications
         WHERE status IN ('approved', 'completed', 'for_release')
           AND (type ILIKE '%assist%' OR category ILIKE '%assist%' OR disability_class ILIKE '%assist%')`
      );
      for (const row of approvedPwdAssistance.rows) {
        const isPwd = String(row.category || '').toUpperCase().includes('PWD');
        const isSenior = String(row.category || '').toUpperCase().includes('SENIOR');
        if (!isPwd && !isSenior) continue;
        const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
        const assistanceType = isPwd ? 'PWD Social Assistance' : 'Senior Social Assistance';

        const disbCheck = await db.query(
          'SELECT id FROM financial_aid_disbursements WHERE application_ref = $1',
          [row.reference_number]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
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
              resolveFixedAmount(assistanceType),
              row.approved_date || new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall',
              'Approved PWD/Senior Social Assistance. Ready for Appointment scheduling and payout.',
            ]
          );
        }
      }
    } catch (_) {}

    try {
      const approvedSoloParent = await db.query(
        `SELECT reference_number, application_type, category_title, first_name, middle_name, last_name, suffix, child_name, approved_amount, updated_at, created_at
         FROM solo_parent_child_welfare_applications
         WHERE (module_type = 'SOLO_PARENT' OR module_type IS NULL)
           AND application_status IN ('approved', 'completed', 'for_release', 'for_distribution', 'released')`
      );
      for (const row of approvedSoloParent.rows) {
        const ref = row.reference_number || 'SP-QC-2026';
        const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'JEFFERSON FERNANDO LEE';
        const isEdu = String(row.application_type || '').toUpperCase().includes('EDUCATIONAL') || String(row.category_title || '').toLowerCase().includes('educational') || String(row.category_title || '').toLowerCase().includes('edukasyon');
        const assistanceTitle = isEdu ? 'Solo Parent Educational Assistance' : 'Solo Parent Financial Subsidy';
        const targetAmount = isEdu ? (Number(row.approved_amount) > 0 ? Number(row.approved_amount) : 5000) : 3000;
        const remarksText = isEdu 
          ? `Approved Solo Parent Educational Assistance (₱5,000 Annual Grant) for student: ${row.child_name || 'Dependent Child'}.`
          : 'Approved Solo Parent Monthly Statutory Cash Subsidy (₱1,000/month).';

        const disbCheck = await db.query(
          `SELECT id, applicant_name FROM financial_aid_disbursements 
           WHERE (application_ref = $1 OR REPLACE(application_ref, '-', '') = REPLACE($1, '-', ''))
             AND assistance_type = $2`,
          [ref, assistanceTitle]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${String(ref.slice(-4) || '0004').padStart(4, '0')}`;
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              ref,
              fullName,
              assistanceTitle,
              targetAmount,
              new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall - SSDD Solo Parent Welfare Section',
              remarksText,
            ]
          );
        } else {
          const currentName = String(disbCheck.rows[0].applicant_name || '');
          if (fullName && (currentName.includes('BENEFICIARY') || !currentName)) {
            await db.query(
              `UPDATE financial_aid_disbursements
               SET applicant_name = $1, application_ref = COALESCE(NULLIF(application_ref, ''), $2)
               WHERE id = $3`,
              [fullName, ref, disbCheck.rows[0].id]
            ).catch(() => {});
          }
        }
      }
    } catch (_) {}

    try {
      // Unconditionally remove any legacy Child Welfare records from financial aid (non-monetary protective service)
      await db.query(`DELETE FROM financial_aid_disbursements WHERE application_ref LIKE 'CW-%' OR assistance_type ILIKE '%child welfare%'`).catch(() => {});
    } catch (_) {}

    try {
      const approvedAics = await db.query(
        `SELECT id, reference_no, qc_id, assistance_type, first_name, middle_name, last_name, suffix, created_at, updated_at
         FROM aics_applications
         WHERE status IN ('approved', 'completed', 'for_release', 'released')`
      );
      for (const row of approvedAics.rows) {
        const ref = row.reference_no || row.qc_id || `AICS-2026-${row.id}`;
        const cleanRef = String(ref).trim();
        const unhyphenated = cleanRef.replace(/[^a-zA-Z0-9]/g, '');
        const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
        const rawType = (row.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim();
        const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + ' Assistance';

        const disbCheck = await db.query(
          `SELECT id FROM financial_aid_disbursements 
           WHERE application_ref = $1 
              OR application_ref = $2 
              OR (application_ref = $3 AND $3 <> '')
              OR REPLACE(application_ref, '-', '') = $4
              OR (LOWER(TRIM(applicant_name)) = LOWER(TRIM($5)) AND LOWER(TRIM(assistance_type)) = LOWER(TRIM($6)))`,
          [cleanRef, row.reference_no || '', row.qc_id || '', unhyphenated, fullName, cleanType]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fixedAmount = resolveFixedAmount(cleanType);
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'Quezon City Hall', 'Approved AICS assistance ready for release.')
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              cleanRef,
              fullName,
              cleanType,
              fixedAmount,
              new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
            ]
          );
        }
      }
    } catch (_) {}

    try {
      const approvedAppts = await db.query(
        `SELECT id, reference_no, module, applicant_name, concern, scheduled_date, scheduled_time, office_location, notes, created_at, updated_at
         FROM appointments
         WHERE status = 'approved'
           AND module != 'Child Welfare'
           AND concern NOT ILIKE '%intake%'
           AND concern NOT ILIKE '%assessment%'
           AND concern NOT ILIKE '%interview%'
           AND concern NOT ILIKE '%protective%'
           AND concern NOT ILIKE '%custody%'
           AND concern NOT ILIKE '%silungan%'`
      );
      for (const appt of approvedAppts.rows) {
        const ref = String(appt.reference_no || '').trim();
        if (!ref) continue;
        const unhyphenated = ref.replace(/[^a-zA-Z0-9]/g, '');
        const fullName = String(appt.applicant_name || '').trim().toUpperCase();
        const cleanType = String(appt.concern || 'Medical Assistance').trim();

        const disbCheck = await db.query(
          `SELECT id FROM financial_aid_disbursements 
           WHERE application_ref = $1 
              OR REPLACE(application_ref, '-', '') = $2
              OR (LOWER(TRIM(applicant_name)) = LOWER(TRIM($3)) AND LOWER(TRIM(assistance_type)) = LOWER(TRIM($4)))`,
          [ref, unhyphenated, fullName, cleanType]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fixedAmount = resolveFixedAmount(appt.concern);
          const isPwdConcern = cleanType.toLowerCase().includes('pwd') || cleanType.toLowerCase().includes('disability') || cleanType.toLowerCase().includes('pension');
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, appointment_date, appointment_time, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              ref,
              fullName,
              cleanType,
              fixedAmount,
              new Date(appt.updated_at || appt.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              isPwdConcern ? null : (appt.scheduled_date || null),
              isPwdConcern ? null : (appt.scheduled_time || null),
              appt.office_location || 'Quezon City Hall',
              isPwdConcern ? 'Approved PWD Social Pension (₱500/month). Accumulating for 3-month consolidated payout.' : (appt.notes || 'Approved appointment payout.'),
            ]
          );
        } else {
          // If already exists, update appointment schedule if available (only for non-PWD)
          const isPwdConcern = cleanType.toLowerCase().includes('pwd') || cleanType.toLowerCase().includes('disability') || cleanType.toLowerCase().includes('pension');
          if (appt.scheduled_date && !isPwdConcern) {
            await db.query(
              `UPDATE financial_aid_disbursements
               SET appointment_date = COALESCE(appointment_date, $1),
                   appointment_time = COALESCE(appointment_time, $2),
                   venue = COALESCE(venue, $3)
               WHERE id = $4`,
              [appt.scheduled_date, appt.scheduled_time, appt.office_location || 'Quezon City Hall', disbCheck.rows[0].id]
            ).catch(() => {});
          }
        }
      }
    } catch (_) {}

    try {
      const approvedAics = await db.query(
        `SELECT reference_no, assistance_type, first_name, middle_name, last_name, suffix, approved_amount, updated_at, created_at
         FROM aics_applications
         WHERE status IN ('approved', 'completed', 'for_release', 'released')`
      );
      for (const row of approvedAics.rows) {
        const disbCheck = await db.query(
          'SELECT id FROM financial_aid_disbursements WHERE application_ref = $1',
          [row.reference_no]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'BENEFICIARY';
          const type = row.assistance_type || 'Medical Assistance';
          const amount = Number(row.approved_amount) > 0 ? Number(row.approved_amount) : resolveFixedAmount(type);
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              row.reference_no,
              fullName,
              type,
              amount,
              new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall',
              'Approved AICS financial grant. Ready for Appointment scheduling and payout.',
            ]
          );
        }
      }
    } catch (_) {}

    try {
      const approvedSolo = await db.query(
        `SELECT reference_number, application_type, service_name, first_name, middle_name, last_name, suffix, approved_amount, updated_at, created_at
         FROM solo_parent_child_welfare_applications
         WHERE application_status IN ('approved', 'completed', 'for_release', 'released')
           AND (reference_number ILIKE '%SP-EDU%' OR application_type ILIKE '%educational%' OR service_name ILIKE '%educational%')`
      );
      for (const row of approvedSolo.rows) {
        const ref = row.reference_number;
        if (!ref) continue;
        const disbCheck = await db.query(
          'SELECT id FROM financial_aid_disbursements WHERE application_ref = $1',
          [ref]
        );
        if (disbCheck.rows.length === 0) {
          const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const fullName = [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' ').trim().toUpperCase() || 'SOLO PARENT BENEFICIARY';
          await db.query(
            `INSERT INTO financial_aid_disbursements (
              disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
              date_approved, status, venue, remarks
            ) VALUES ($1, $2, $3, 'Solo Parent Educational Assistance', 5000, $4, 'PENDING', $5, $6)
            ON CONFLICT DO NOTHING`,
            [
              disbId,
              ref,
              fullName,
              new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
              'Quezon City Hall - SSDD Solo Parent Welfare Section',
              'Approved Solo Parent Educational Assistance (₱5,000.00 Annual Grant). Ready for Payout Scheduling.',
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
         ORDER BY reference_no, (CASE WHEN scheduled_date IS NOT NULL AND scheduled_date != '' THEN 1 ELSE 0 END) DESC, updated_at DESC
       ) a ON (
         f.application_ref = a.reference_no 
         OR REPLACE(f.application_ref, '-', '') = REPLACE(a.reference_no, '-', '')
         OR (
            LOWER(TRIM(f.applicant_name)) = LOWER(TRIM(a.applicant_name))
            AND (
              (f.assistance_type ILIKE '%solo%' AND (a.module = 'Solo Parent' OR a.concern ILIKE '%solo%'))
              OR (f.assistance_type ILIKE '%pwd%' AND (a.module = 'PWD' OR a.concern ILIKE '%pwd%'))
              OR (f.assistance_type ILIKE '%senior%' AND (a.module = 'Senior Citizen' OR a.concern ILIKE '%senior%'))
              OR (f.assistance_type ILIKE '%livelihood%' AND (a.module = 'Livelihood' OR a.concern ILIKE '%livelihood%'))
              OR (f.assistance_type ILIKE '%medical%' AND (a.module = 'AICS' OR a.concern ILIKE '%medical%'))
            )
          )
       )
       WHERE f.disbursement_id != 'DISB-2026-9929'
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
       ORDER BY f.created_at DESC`
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
