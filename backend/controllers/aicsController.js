const fs = require('fs');
const path = require('path');
const db = require('../config/db');

let logActivity = null;
try {
  const actCtrl = require('./activityLogController');
  logActivity = actCtrl.logActivity;
} catch {}

// Initialize AICS Tables and Ensure Required Columns Exist
async function initAicsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS aics_applications (
        id SERIAL PRIMARY KEY,
        reference_no VARCHAR(100) UNIQUE NOT NULL,
        assistance_type VARCHAR(150) NOT NULL,
        qc_id VARCHAR(100),
        first_name VARCHAR(150) NOT NULL,
        middle_name VARCHAR(150),
        last_name VARCHAR(150) NOT NULL,
        suffix VARCHAR(50),
        nationality VARCHAR(100),
        birth_date VARCHAR(50),
        age INTEGER,
        gender VARCHAR(50),
        civil_status VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(150),
        address TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        referral_details TEXT,
        guarantee_letter_url TEXT,
        certificate_type VARCHAR(100),
        amount NUMERIC(12, 2) DEFAULT 0.00,
        payout_date VARCHAR(100),
        payout_time VARCHAR(100),
        payout_venue VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS referral_details TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS guarantee_letter_url TEXT;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0.00;
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS payout_date VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS payout_time VARCHAR(100);
      ALTER TABLE aics_applications ADD COLUMN IF NOT EXISTS payout_venue VARCHAR(255);

      CREATE INDEX IF NOT EXISTS idx_aics_reference_no ON aics_applications(reference_no);
      CREATE INDEX IF NOT EXISTS idx_aics_status ON aics_applications(status);
      CREATE INDEX IF NOT EXISTS idx_aics_qc_id ON aics_applications(qc_id);

      CREATE TABLE IF NOT EXISTS aics_documents (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES aics_applications(id) ON DELETE CASCADE,
        document_label VARCHAR(255),
        original_filename VARCHAR(255),
        file_type VARCHAR(100),
        file_data BYTEA,
        file_path TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_aics_documents_app_id ON aics_documents(application_id);
    `);
    console.log('[DB] aics_applications & aics_documents schema verified.');
  } catch (err) {
    console.warn('[DB] Could not initialize aics tables:', err.message);
  }
}

initAicsTable();

// Helper: Generate unique reference number
function generateReferenceNo(qcId) {
  const randDigit = Math.floor(1000 + Math.random() * 9000);
  if (qcId && String(qcId).trim()) {
    const cleanQc = String(qcId).trim().replace(/[^a-zA-Z0-9-]/g, '');
    return `AICS-${cleanQc}-${randDigit}`;
  }
  return `AICS-2026-${Date.now().toString().slice(-6)}${randDigit}`;
}

// Helper: Create user notification safely
async function sendUserNotification(userId, refNo, title, description) {
  try {
    if (!userId) return;
    const notifId = `aics_notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await db.query(
      `INSERT INTO user_notifications (user_id, notif_id, title, description, application_ref, is_read, is_dismissed, created_at)
       VALUES ($1, $2, $3, $4, $5, false, false, NOW())
       ON CONFLICT (user_id, notif_id) DO NOTHING`,
      [userId, notifId, title, description, refNo]
    );
  } catch (err) {
    console.warn('[AICS] Warning sending user notification:', err.message);
  }
}

// 1. Submit New AICS Application
exports.createApplication = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
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
      details,
      documentLabels,
    } = req.body;

    const finalFirstName = firstName ? String(firstName).trim() : 'APPLICANT';
    const finalLastName = lastName ? String(lastName).trim() : 'USER';
    const finalAssistanceType = assistanceType || 'Medical Assistance';

    const targetQcId = qcId ? String(qcId).trim() : null;
    let baseRefNo = req.body.referenceNo || req.body.reference_no || targetQcId || generateReferenceNo(targetQcId);
    let referenceNo = baseRefNo;

    // Check existing reference collision
    const existing = await client.query('SELECT id FROM aics_applications WHERE reference_no = $1', [referenceNo]);
    if (existing.rows.length > 0) {
      referenceNo = `${baseRefNo}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const parsedDetails = typeof details === 'string' ? JSON.parse(details) : (details || {});

    // Insert Application
    const insertRes = await client.query(
      `INSERT INTO aics_applications (
        reference_no, assistance_type, qc_id, first_name, middle_name, last_name,
        suffix, nationality, birth_date, age, gender, civil_status, phone, email,
        address, details, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW(), NOW())
      RETURNING *`,
      [
        referenceNo,
        finalAssistanceType,
        targetQcId,
        finalFirstName,
        middleName || '',
        finalLastName,
        suffix || '',
        nationality || 'Filipino',
        birthDate || null,
        age ? parseInt(age, 10) : null,
        gender || null,
        civilStatus || null,
        phone || null,
        email || null,
        address || null,
        JSON.stringify(parsedDetails),
      ]
    );

    const newApp = insertRes.rows[0];

    // Handle Uploaded Files
    let labelsArray = [];
    if (documentLabels) {
      try {
        labelsArray = typeof documentLabels === 'string' ? JSON.parse(documentLabels) : documentLabels;
      } catch (e) {
        labelsArray = Array.isArray(documentLabels) ? documentLabels : [documentLabels];
      }
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const label = labelsArray[i] || file.fieldname || `Document ${i + 1}`;

        let fileBuffer = null;
        if (file.buffer) {
          fileBuffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
          fileBuffer = fs.readFileSync(file.path);
        }

        await client.query(
          `INSERT INTO aics_documents (
            application_id, document_label, original_filename, file_type, file_data, file_path, uploaded_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            newApp.id,
            label,
            file.originalname || file.filename || 'document',
            file.mimetype || 'application/octet-stream',
            fileBuffer,
            file.path || null,
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Notify User
    const userIdentifier = targetQcId || email || referenceNo;
    await sendUserNotification(
      userIdentifier,
      referenceNo,
      'Naisumite ang AICS Application',
      `Matagumpay na naisumite ang inyong AICS application (${finalAssistanceType}). Reference No: ${referenceNo}. Sinusuri na ito ng Admin.`
    );

    if (logActivity) {
      logActivity(
        `${finalFirstName} ${finalLastName}`,
        'User',
        'SUBMIT_APPLICATION',
        'AICS',
        referenceNo,
        `Submitted AICS application for ${finalAssistanceType}`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Matagumpay na naisumite ang inyong AICS application!',
      application: newApp,
      referenceNo,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in AICS createApplication:', err);
    return res.status(500).json({ error: 'Server error sa pag-submit ng AICS application: ' + err.message });
  } finally {
    client.release();
  }
};

// 2. Fetch AICS Applications (User / Admin)
exports.getApplications = async (req, res) => {
  try {
    const { qcId, email, referenceNo, status, userIdentifier, role, isAdmin } = req.query;

    let query = `
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'document_label', d.document_label,
              'original_filename', d.original_filename,
              'file_type', d.file_type,
              'uploaded_at', d.uploaded_at
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM aics_applications a
      LEFT JOIN aics_documents d ON a.id = d.application_id
    `;

    const whereClauses = [];
    const params = [];

    const isExplicitAdmin = String(role).toLowerCase() === 'admin' || String(isAdmin) === 'true';
    const isEmailAdmin = email && (String(email).toLowerCase().includes('admin') || String(email).toLowerCase().includes('sysadmin') || String(email).toLowerCase().includes('socialworker'));

    // Filter by specific user if NOT an admin request
    if (!isExplicitAdmin && !isEmailAdmin) {
      if (referenceNo) {
        params.push(referenceNo);
        whereClauses.push(`a.reference_no = $${params.length}`);
      } else if (qcId) {
        params.push(qcId);
        whereClauses.push(`(a.qc_id = $${params.length} OR a.reference_no ILIKE '%' || $${params.length} || '%')`);
      } else if (email) {
        params.push(email);
        whereClauses.push(`a.email ILIKE $${params.length}`);
      } else if (userIdentifier) {
        params.push(userIdentifier);
        whereClauses.push(`(a.qc_id = $${params.length} OR a.email ILIKE $${params.length} OR a.reference_no = $${params.length})`);
      }
    } else if (referenceNo) {
      params.push(referenceNo);
      whereClauses.push(`a.reference_no = $${params.length}`);
    }

    if (status && String(status).toLowerCase() !== 'all') {
      params.push(status);
      whereClauses.push(`a.status ILIKE $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ` + whereClauses.join(' AND ');
    }

    query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

    const result = await db.query(query, params);
    return res.status(200).json({
      success: true,
      applications: result.rows,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching AICS applications:', err);
    return res.status(500).json({ error: 'May error sa pagkuha ng AICS applications: ' + err.message });
  }
};

// 3. Get Application by Reference Number or ID
exports.getApplicationByReference = async (req, res) => {
  try {
    const { referenceNo } = req.params;
    const query = `
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'document_label', d.document_label,
              'original_filename', d.original_filename,
              'file_type', d.file_type,
              'uploaded_at', d.uploaded_at
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS documents
      FROM aics_applications a
      LEFT JOIN aics_documents d ON a.id = d.application_id
      WHERE a.reference_no = $1 OR CAST(a.id AS VARCHAR) = $1 OR a.qc_id = $1
      GROUP BY a.id
    `;
    const result = await db.query(query, [referenceNo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AICS Application not found' });
    }
    const app = result.rows[0];

    // Extract embedded document previews from app.details if aics_documents table is empty
    let docs = app.documents || [];
    if (!Array.isArray(docs) || docs.length === 0) {
      const detailsObj = typeof app.details === 'string' ? JSON.parse(app.details) : (app.details || {});
      const previews = detailsObj.uploadedDocumentPreviews || detailsObj.uploadedDocuments || detailsObj.documents || detailsObj.attachedFiles || [];
      if (Array.isArray(previews) && previews.length > 0) {
        docs = previews.map((p, idx) => ({
          id: idx + 1,
          document_label: p.label || p.document_label || p.name || `Document ${idx + 1}`,
          original_filename: p.filename || p.original_filename || p.name || `document_${idx + 1}`,
          file_type: p.file_type || p.type || 'image/png',
          dataUrl: p.dataUrl || p.url || p.fileUrl || null,
          uploaded_at: app.created_at
        }));
      }
    }

    return res.status(200).json({
      success: true,
      application: app,
      documents: docs
    });
  } catch (err) {
    console.error('Error fetching AICS application by ref:', err);
    return res.status(500).json({ error: 'Error fetching application: ' + err.message });
  }
};

// 4. Check Duplicate Person
exports.checkDuplicatePerson = async (req, res) => {
  try {
    const { qcId, firstName, lastName } = req.query;
    if (qcId) {
      const qRes = await db.query('SELECT id, status FROM aics_applications WHERE qc_id = $1 ORDER BY created_at DESC LIMIT 1', [qcId]);
      if (qRes.rows.length > 0) {
        return res.status(200).json({ isDuplicate: true, status: qRes.rows[0].status });
      }
    }
    if (firstName && lastName) {
      const nRes = await db.query(
        'SELECT id, status FROM aics_applications WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) ORDER BY created_at DESC LIMIT 1',
        [firstName.trim(), lastName.trim()]
      );
      if (nRes.rows.length > 0) {
        return res.status(200).json({ isDuplicate: true, status: nRes.rows[0].status });
      }
    }
    return res.status(200).json({ isDuplicate: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 5. Get Document File
exports.getDocumentFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM aics_documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('File not found');
    }
    const doc = result.rows[0];
    if (doc.file_data) {
      res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
      return res.send(doc.file_data);
    } else if (doc.file_path && fs.existsSync(doc.file_path)) {
      return res.sendFile(path.resolve(doc.file_path));
    }
    return res.status(404).send('File content unavailable');
  } catch (err) {
    return res.status(500).send('Error retrieving file: ' + err.message);
  }
};

// 6. Update Application Status (Admin Action Workflow)
exports.updateApplicationStatus = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const {
      status,
      rejectionReason,
      referralDetails,
      amount,
      payoutDate,
      payoutTime,
      payoutVenue,
      adminName,
    } = req.body;

    const targetIdStr = String(id || '').trim();

    // Fetch existing application safely (casting id to VARCHAR to avoid integer out of range 500 error)
    const appRes = await client.query(
      'SELECT * FROM aics_applications WHERE reference_no = $1 OR CAST(id AS VARCHAR) = $1 OR qc_id = $1',
      [targetIdStr]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'AICS application not found' });
    }

    const app = appRes.rows[0];
    const applicantFullName = `${app.first_name || ''} ${app.middle_name || ''} ${app.last_name || ''} ${app.suffix || ''}`.replace(/\s+/g, ' ').trim();
    const userIdentifier = app.qc_id || app.email || app.reference_no;

    const normalizedStatus = String(status || '').toLowerCase();

    // Determine Certificate Type based on assistance type if approving
    let certificateType = app.certificate_type || null;
    const assistanceLower = (app.assistance_type || '').toLowerCase();
    if (['approved', 'completed', 'initial_approved', 'waiting_approval'].includes(normalizedStatus)) {
      if (assistanceLower.includes('medicine') || assistanceLower.includes('gamot') || assistanceLower.includes('medical medicine')) {
        certificateType = 'Medicine Certificate / Voucher';
      } else {
        certificateType = 'Guarantee Letter (Hospital/Medical Bill)';
      }
    }

    // Update AICS Application Status
    const updateRes = await client.query(
      `UPDATE aics_applications
       SET status = COALESCE($1, status),
           rejection_reason = COALESCE($2, rejection_reason),
           referral_details = COALESCE($3, referral_details),
           certificate_type = COALESCE($4, certificate_type),
           amount = COALESCE($5, amount),
           payout_date = COALESCE($6, payout_date),
           payout_time = COALESCE($7, payout_time),
           payout_venue = COALESCE($8, payout_venue),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        status,
        rejectionReason || null,
        referralDetails || null,
        certificateType,
        amount ? parseFloat(amount) : null,
        payoutDate || null,
        payoutTime || null,
        payoutVenue || null,
        app.id,
      ]
    );

    const updatedApp = updateRes.rows[0];

    // --- WORKFLOW BRANCHES ---

    // 1. INITIAL APPROVAL / PRE-APPROVAL -> Transfer to Appointments module
    if (['initial_approved', 'waiting_approval', 'for_screening', 'scheduled'].includes(normalizedStatus)) {
      // Create or update appointment record
      await client.query(
        `INSERT INTO appointments (
          reference_no, module, applicant_name, concern, status, created_at, updated_at
        ) VALUES ($1, 'AICS', $2, $3, 'pending', NOW(), NOW())
        ON CONFLICT DO NOTHING`,
        [app.reference_no, applicantFullName, app.assistance_type]
      );

      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'Initial Validation Approved',
        `Na-validate na ng Social Worker ang inyong AICS documents. Ang inyong application (${app.reference_no}) ay nakatakda na para sa interview appointment schedule.`
      );
    }

    // 2. SOCIAL WORKER FINAL APPROVAL -> Transfer to Financial Aid / Payout Module
    else if (['approved', 'completed'].includes(normalizedStatus)) {
      const disbId = `DISB-AICS-${app.id}-${Date.now().toString().slice(-4)}`;
      const disbAmount = amount ? parseFloat(amount) : (app.amount && parseFloat(app.amount) > 0 ? parseFloat(app.amount) : 5000.00);

      // Add to financial disbursements table
      await client.query(
        `INSERT INTO financial_aid_disbursements (
          disbursement_id, application_ref, applicant_name, assistance_type, fixed_amount,
          date_approved, status, appointment_date, appointment_time, venue, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, TO_CHAR(NOW(), 'YYYY-MM-DD'), 'PENDING', $6, $7, $8, NOW(), NOW())
        ON CONFLICT (disbursement_id) DO UPDATE SET
          status = EXCLUDED.status,
          fixed_amount = EXCLUDED.fixed_amount,
          updated_at = NOW()`,
        [
          disbId,
          app.reference_no,
          applicantFullName,
          app.assistance_type,
          disbAmount,
          payoutDate || app.payout_date || null,
          payoutTime || app.payout_time || null,
          payoutVenue || app.payout_venue || 'Quezon City Hall',
        ]
      );

      // Update appointment status to completed/approved
      await client.query(
        `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE reference_no = $1 AND module = 'AICS'`,
        [app.reference_no]
      );

      const certMsg = certificateType === 'Medicine Certificate / Voucher'
        ? 'Maaari niyo nang i-download ang inyong Medicine Voucher / Certificate sa User Portal.'
        : 'Maaari niyo nang i-download at i-print ang inyong Official Guarantee Letter sa User Portal.';

      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'AICS Application Approved!',
        `Inaprubahan na ang inyong AICS Application (${app.reference_no}). ${certMsg}`
      );
    }

    // 3. REJECTED / DENIED
    else if (['rejected', 'denied'].includes(normalizedStatus)) {
      await client.query(
        `UPDATE appointments SET status = 'rejected', updated_at = NOW() WHERE reference_no = $1 AND module = 'AICS'`,
        [app.reference_no]
      );

      const reasonStr = rejectionReason ? ` Dahilan: ${rejectionReason}` : '';
      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'AICS Application Disapproved',
        `Hindi naaprubahan ang inyong AICS Application (${app.reference_no}).${reasonStr}`
      );
    }

    // 4. REFERRED
    else if (['referred', 'for_referral'].includes(normalizedStatus)) {
      await client.query(
        `UPDATE appointments SET status = 'referred', updated_at = NOW() WHERE reference_no = $1 AND module = 'AICS'`,
        [app.reference_no]
      );

      const refStr = referralDetails ? ` Inilipat sa: ${referralDetails}` : '';
      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'AICS Application Referred',
        `Ang inyong AICS Application (${app.reference_no}) ay inilipat sa kaugnay na ahensya.${refStr}`
      );
    }

    // 5. PAYOUT SCHEDULED
    else if (status === 'payout_scheduled') {
      await client.query(
        `UPDATE financial_aid_disbursements 
         SET status = 'PAYOUT SCHEDULED', appointment_date = $1, appointment_time = $2, venue = $3, updated_at = NOW()
         WHERE application_ref = $4`,
        [payoutDate, payoutTime, payoutVenue || 'Quezon City Hall', app.reference_no]
      );

      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'Payout Schedule Set',
        `Naitakda na ang inyong AICS Payout sa ${payoutDate || ''} (${payoutTime || ''}) sa ${payoutVenue || 'Quezon City Hall'}. Magdala ng valid ID.`
      );
    }

    // 6. RELEASED
    else if (status === 'released') {
      await client.query(
        `UPDATE financial_aid_disbursements 
         SET status = 'RELEASED', released_date = TO_CHAR(NOW(), 'YYYY-MM-DD'), released_by = $1, updated_at = NOW()
         WHERE application_ref = $2`,
        [adminName || 'Social Welfare Cashier', app.reference_no]
      );

      await sendUserNotification(
        userIdentifier,
        app.reference_no,
        'Financial Aid Released',
        `Matagumpay na na-release ang inyong AICS assistance/payout para sa Reference No: ${app.reference_no}.`
      );
    }

    await client.query('COMMIT');

    if (logActivity) {
      logActivity(
        adminName || 'Admin',
        'Admin',
        `UPDATE_AICS_STATUS_${(status || '').toUpperCase()}`,
        'AICS',
        app.reference_no,
        `Updated AICS status to ${status} for ${applicantFullName}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Matagumpay na na-update ang status sa '${status}'.`,
      application: updatedApp,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating AICS status:', err);
    return res.status(500).json({ error: 'Error updating status: ' + err.message });
  } finally {
    client.release();
  }
};

// 7. Cleanup / Delete User Applications
exports.cleanupUserAics = async (req, res) => {
  try {
    const { nameOrRef } = req.params;
    if (!nameOrRef) return res.status(400).json({ error: 'Parameter required' });

    const result = await db.query(
      `DELETE FROM aics_applications 
       WHERE reference_no ILIKE $1 
          OR qc_id ILIKE $1 
          OR email ILIKE $1 
          OR CONCAT(first_name, ' ', last_name) ILIKE $1
       RETURNING id, reference_no`,
      [`%${nameOrRef}%`]
    );

    return res.status(200).json({
      success: true,
      message: `Nalinis ang ${result.rowCount} AICS applications.`,
      deleted: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error in cleanup: ' + err.message });
  }
};

// 8. Delete Single Application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM aics_applications WHERE id = $1 OR reference_no = $1 RETURNING id, reference_no', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    return res.status(200).json({ success: true, message: 'Application deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Error deleting application: ' + err.message });
  }
};