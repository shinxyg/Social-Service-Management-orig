const db = require('../config/db');
const { logActivity } = require('./activityLogController');

function generateReferenceNo(qcId) {
  if (qcId && String(qcId).trim()) return String(qcId).trim();
  return '110000116932100';
}

// POST /api/aics/applications
// Multipart form-data: mga regular fields + "documents" (multiple files) + "documentLabels" (JSON array na parehong pagkasunod-sunod sa files)
exports.createApplication = async (req, res) => {
  const client = await db.connect();
  try {
    const {
      assistanceType,
      qcId,
      firstName,
      middleName,
      lastName,
      suffix,
      nationality,
      birthDate,
      age,
      gender,
      civilStatus,
      phone,
      email,
      address,
      details, // dapat JSON string mula sa frontend (informant/deceased/beneficiary info, checklist answers)
      documentLabels, // JSON string array, kaparehong pagkakasunod-sunod ng files
    } = req.body;

    const finalFirstName = firstName || 'CLARISA MAE';
    const finalLastName = lastName || 'DIMAL';
    const finalAssistanceType = assistanceType || 'Medical Assistance';

    const referenceNo = req.body.referenceNo || req.body.reference_no || (qcId && String(qcId).trim()) || generateReferenceNo(qcId);
    let parsedDetails = {};
    try {
      parsedDetails = typeof details === 'string' ? JSON.parse(details) : (details || {});
    } catch {
      parsedDetails = {};
    }

    let parsedLabels = [];
    try {
      parsedLabels = typeof documentLabels === 'string' ? JSON.parse(documentLabels) : (documentLabels || []);
    } catch {
      parsedLabels = [];
    }

    await client.query('BEGIN');

    const appResult = await client.query(
      `INSERT INTO aics_applications
        (reference_no, assistance_type, qc_id, first_name, middle_name, last_name, suffix,
         nationality, birth_date, age, gender, civil_status, phone, email, address, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        referenceNo,
        finalAssistanceType,
        qcId || null,
        finalFirstName,
        middleName || null,
        finalLastName,
        suffix || null,
        nationality || null,
        birthDate || null,
        age || null,
        gender || null,
        civilStatus || null,
        phone || null,
        email || null,
        address || null,
        parsedDetails,
      ]
    );

    const application = appResult.rows[0];
    const files = req.files || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const label = parsedLabels[i] || file.originalname;
      await client.query(
        `INSERT INTO aics_documents (application_id, document_label, original_filename, file_type, file_data)
         VALUES ($1,$2,$3,$4,$5)`,
        [application.id, label, file.originalname, file.mimetype, file.buffer]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Matagumpay na na-submit ang application.',
      application,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'May naganap na error sa pag-submit ng application.' });
  } finally {
    client.release();
  }
};

async function enrichApplicationWithSuffix(app) {
  if (!app) return app;
  if (app.suffix && String(app.suffix).trim()) return app;

  try {
    // 1. Check users table by qcid or email
    if (app.qc_id || app.email) {
      const uRes = await db.query(
        `SELECT suffix FROM users 
         WHERE (qcid_number = $1 OR ($2 <> '' AND LOWER(email) = LOWER($2))) 
           AND suffix IS NOT NULL AND suffix <> '' LIMIT 1`,
        [app.qc_id || '', app.email || '']
      );
      if (uRes.rows.length > 0 && uRes.rows[0].suffix) {
        app.suffix = uRes.rows[0].suffix;
        // background update so it's persisted in aics_applications
        db.query('UPDATE aics_applications SET suffix = $1 WHERE id = $2', [app.suffix, app.id]).catch(() => {});
        return app;
      }
    }

    // 2. Check pwd_senior_applications table
    const pRes = await db.query(
      `SELECT suffix FROM pwd_senior_applications 
       WHERE (reference_number = $1 OR ($2 <> '' AND LOWER(email) = LOWER($2)) 
              OR (LOWER(first_name) = LOWER($3) AND LOWER(last_name) = LOWER($4))) 
         AND suffix IS NOT NULL AND suffix <> '' LIMIT 1`,
      [app.qc_id || '', app.email || '', app.first_name || '', app.last_name || '']
    );
    if (pRes.rows.length > 0 && pRes.rows[0].suffix) {
      app.suffix = pRes.rows[0].suffix;
      db.query('UPDATE aics_applications SET suffix = $1 WHERE id = $2', [app.suffix, app.id]).catch(() => {});
      return app;
    }
  } catch (e) {
    // ignore query errors
  }
  return app;
}

// GET /api/aics/applications  (para sa admin, may optional ?status= filter)
// GET /api/aics/applications  (may optional ?status= at ?qcId= filter)
exports.getApplications = async (req, res) => {
  try {
    const { status, qcId } = req.query;
    let query = 'SELECT * FROM aics_applications';
    const conditions = [];
    const params = [];

    if (qcId) {
      params.push(qcId);
      conditions.push(`qc_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    const rows = await Promise.all(
      result.rows.map(async (row) => {
        const enriched = await enrichApplicationWithSuffix(row);
        return {
          ...enriched,
          reference_no: enriched.qc_id || enriched.reference_no || '110000116932100',
        };
      })
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hindi makuha ang listahan ng applications.' });
  }
};

// GET /api/aics/applications/:referenceNo
exports.getApplicationByReference = async (req, res) => {
  try {
    const { referenceNo } = req.params;

    const appResult = await db.query(
      'SELECT * FROM aics_applications WHERE reference_no = $1 OR qc_id = $1',
      [referenceNo]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Walang nahanap na application.' });
    }

    const application = await enrichApplicationWithSuffix(appResult.rows[0]);

    const docsResult = await db.query(
      'SELECT id, document_label, original_filename, file_type, file_path, uploaded_at FROM aics_documents WHERE application_id = $1',
      [application.id]
    );

    res.json({
      application,
      documents: docsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'May error sa pagkuha ng application.' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid na status.' });
    }

    const result = await db.query(
      `UPDATE aics_applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Walang nahanap na application.' });
    }

    const app = result.rows[0];
    const fullName = [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(' ');

    if (status === 'approved') {
      const FIXED_AMOUNTS = {
        'Medical Assistance': 5000,
        'Funeral Assistance': 10000,
        'Educational Assistance': 3000,
        'Burial Assistance': 10000,
        'Food Assistance': 1500,
        'Transportation Assistance': 1000,
        'PWD Social Assistance': 2000,
        'Senior Social Assistance': 2000,
      };
      const rawType = (app.assistance_type || 'Medical').replace(/\s*assistance/gi, '').trim();
      const cleanType = (rawType.charAt(0).toUpperCase() + rawType.slice(1)) + ' Assistance';
      const fixedAmount = FIXED_AMOUNTS[cleanType] || FIXED_AMOUNTS[app.assistance_type] || 1000;
      const disbId = `DISB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert into financial_aid_disbursements
      await db.query(
        `INSERT INTO financial_aid_disbursements
          (disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
           date_approved, status, venue, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'Quezon City Hall', 'Awtomatikong pumasok sa Financial Aid Disbursement mula sa na-aprubahang aplikasyon.')
         ON CONFLICT (disbursement_id) DO NOTHING`,
        [
          disbId,
          app.reference_no,
          fullName.toUpperCase(),
          cleanType,
          fixedAmount,
          new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
        ]
      );

      // 2. Insert into appointments queue
      await db.query(
        `INSERT INTO appointments
          (reference_no, module, applicant_name, concern, status, office_location, notes)
         VALUES ($1, 'AICS', $2, $3, 'pending', 'Quezon City Hall', 'Awtomatikong pumasok mula sa na-aprubahang aplikasyon para sa scheduling.')
         ON CONFLICT DO NOTHING`,
        [app.reference_no, fullName.toUpperCase(), cleanType]
      );
    } else if (status === 'rejected') {
      await db.query(`DELETE FROM appointments WHERE reference_no = $1`, [app.reference_no]);
      await db.query(`DELETE FROM financial_aid_disbursements WHERE application_ref = $1`, [app.reference_no]);
    }

    if (status === 'approved' || status === 'rejected') {
      await logActivity({
        actor: 'Admin User',
        actorRole: 'Social Worker',
        action: status,
        module: 'AICS',
        referenceNo: app.reference_no,
        subject: fullName,
        detail: `${app.assistance_type} application ${status}.`,
      });
    }

    res.json({ message: 'Na-update ang status.', application: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'May error sa pag-update ng status.' });
  }
};

exports.checkDuplicatePerson = async (req, res) => {
  try {
    const { assistanceType, firstName, middleName, lastName, suffix, birthDate, gender, address } = req.query;
    if (!assistanceType || !firstName || !lastName || !birthDate) {
      return res.status(400).json({ error: 'Kulang ang kinakailangang impormasyon para sa duplicate check.' });
    }
    const result = await db.query(
      `SELECT * FROM aics_applications WHERE assistance_type = $1 AND status IN ('pending', 'approved')`,
      [assistanceType]
    );
    const norm = (s) => (s || '').toString().trim().toLowerCase();

    // FIX: i-normalize ang date papuntang plain YYYY-MM-DD, hindi Date.toString()
    const normDate = (d) => {
      if (!d) return '';
      if (d instanceof Date) {
        // gamitin ang local calendar date parts, iwas sa UTC shift
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      // string na format, kunin lang ang unang 10 chars (YYYY-MM-DD)
      return d.toString().slice(0, 10);
    };

    const isDuplicate = result.rows.some((app) => {
      const d = app.details || {};
      let cFirst, cMiddle, cLast, cSuffix, cBirth, cGender, cAddress;
      if (assistanceType === 'Funeral Assistance') {
        cFirst = d.deceasedFirstName;
        cMiddle = d.deceasedMiddleName;
        cLast = d.deceasedLastName;
        cSuffix = d.deceasedSuffix;
        cBirth = d.deceasedBirthDate;
        cGender = d.deceasedGender;
        cAddress = d.deceasedAddress;
      } else if (assistanceType === 'Educational Assistance') {
        cFirst = d.beneficiaryFirstName;
        cMiddle = d.beneficiaryMiddleName;
        cLast = d.beneficiaryLastName;
        cSuffix = d.beneficiarySuffix;
        cBirth = d.beneficiaryBirthDate;
        cGender = d.beneficiaryGender;
        cAddress = d.beneficiaryAddress;
      } else {
        cFirst = app.first_name;
        cMiddle = app.middle_name;
        cLast = app.last_name;
        cSuffix = app.suffix;
        cBirth = app.birth_date;
        cGender = app.gender;
        cAddress = app.address;
      }
      return (
        norm(cFirst) === norm(firstName) &&
        norm(cMiddle) === norm(middleName) &&
        norm(cLast) === norm(lastName) &&
        norm(cSuffix) === norm(suffix) &&
        normDate(cBirth) === normDate(birthDate) &&
        norm(cGender) === norm(gender) &&
        norm(cAddress) === norm(address)
      );
    });
    res.json({ duplicate: isDuplicate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'May error sa pag-check ng duplicate.' });
  }
};

// GET /api/aics/documents/:id/file
exports.getDocumentFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT file_data, file_type, original_filename FROM aics_documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].file_data) {
      return res.status(404).json({ error: 'Walang nahanap na file.' });
    }

    const doc = result.rows[0];
    res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
    res.send(doc.file_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'May error sa pagkuha ng file.' });
  }
};