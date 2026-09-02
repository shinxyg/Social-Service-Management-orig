const db = require('../config/db');

// In-memory fallback if database table is initializing or offline
let memoryApplications = [];

// Ensure table exists
async function initPwdSeniorTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pwd_senior_applications (
        id VARCHAR(100) PRIMARY KEY,
        reference_number VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        suffix VARCHAR(20),
        date_of_birth VARCHAR(50),
        age VARCHAR(10),
        sex VARCHAR(20),
        civil_status VARCHAR(50),
        contact_no VARCHAR(50),
        email VARCHAR(150),
        address TEXT,
        disability_type VARCHAR(100),
        disability_class VARCHAR(50),
        cause_of_disability VARCHAR(100),
        applying_for VARCHAR(50) DEFAULT 'myself',
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'pending',
        assigned_id_number VARCHAR(100),
        approved_by VARCHAR(100),
        approved_date VARCHAR(50),
        rejection_reason TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] pwd_senior_applications table ready.');
  } catch (err) {
    console.warn('[DB] Could not initialize pwd_senior_applications table, using fallback memory store:', err.message);
  }
}

initPwdSeniorTable();

/**
 * GET /api/pwd-senior/applications
 * Returns all submitted applications
 */
exports.getAllApplications = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM pwd_senior_applications ORDER BY created_at DESC'
    );
    const mapped = result.rows.map((row) => ({
      id: row.id,
      submittedAt: row.submitted_at || row.created_at,
      referenceNumber: row.reference_number,
      category: row.category,
      type: row.type,
      firstName: row.first_name,
      middleName: row.middle_name || '',
      lastName: row.last_name,
      suffix: row.suffix || '',
      dateOfBirth: row.date_of_birth,
      age: row.age,
      sex: row.sex,
      civilStatus: row.civil_status,
      contactNo: row.contact_no,
      cellphoneNo: row.contact_no,
      email: row.email,
      address: row.address,
      disabilityType: row.disability_type,
      disabilityClass: row.disability_class,
      causeOfDisability: row.cause_of_disability,
      applyingFor: row.applying_for || 'myself',
      documents: Array.isArray(row.documents) ? row.documents : [],
      status: row.status || 'pending',
      assignedIdNumber: row.assigned_id_number,
      approvedBy: row.approved_by,
      approvedDate: row.approved_date,
      rejectionReason: row.rejection_reason,
    }));
    return res.json(mapped);
  } catch (err) {
    console.warn('[DB Error] Fetching from DB failed, returning in-memory:', err.message);
    return res.json(memoryApplications);
  }
};

/**
 * POST /api/pwd-senior/applications
 * Submits a new PWD or Senior Citizen application
 */
exports.createApplication = async (req, res) => {
  try {
    const body = req.body;
    const appId = body.id || `APP-${Date.now()}`;
    const refNum = body.referenceNumber || '110000116932100';

    const newApp = {
      id: appId,
      submittedAt: body.submittedAt || new Date().toISOString(),
      referenceNumber: refNum,
      category: body.category || 'PWD',
      type: body.type || 'new',
      firstName: body.firstName || '',
      middleName: body.middleName || '',
      lastName: body.lastName || '',
      suffix: body.suffix || '',
      dateOfBirth: body.dateOfBirth || '',
      age: body.age || '',
      sex: body.sex || '',
      civilStatus: body.civilStatus || '',
      contactNo: body.contactNo || body.cellphoneNo || '',
      cellphoneNo: body.contactNo || body.cellphoneNo || '',
      email: body.email || '',
      address: body.address || '',
      disabilityType: body.disabilityType || '',
      disabilityClass: body.disabilityClass || '',
      causeOfDisability: body.causeOfDisability || '',
      applyingFor: body.applyingFor || 'myself',
      documents: body.documents || [],
      status: 'pending',
      assignedIdNumber: body.assignedIdNumber || null,
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null,
    };

    try {
      await db.query(
        `DELETE FROM pwd_senior_applications WHERE (reference_number = $1 OR email = $2) AND category = $3 AND status = 'rejected'`,
        [newApp.referenceNumber, newApp.email, newApp.category]
      );
      await db.query(
        `INSERT INTO pwd_senior_applications (
          id, reference_number, category, type, first_name, middle_name, last_name, suffix,
          date_of_birth, age, sex, civil_status, contact_no, email, address, disability_type,
          disability_class, cause_of_disability, applying_for, documents, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          newApp.id,
          newApp.referenceNumber,
          newApp.category,
          newApp.type,
          newApp.firstName,
          newApp.middleName,
          newApp.lastName,
          newApp.suffix,
          newApp.dateOfBirth,
          newApp.age,
          newApp.sex,
          newApp.civilStatus,
          newApp.contactNo,
          newApp.email,
          newApp.address,
          newApp.disabilityType,
          newApp.disabilityClass,
          newApp.causeOfDisability,
          newApp.applyingFor,
          JSON.stringify(newApp.documents),
          'pending',
        ]
      );
    } catch (dbErr) {
      console.warn('[DB Error] Could not insert to DB, saving to memory fallback:', dbErr.message);
      memoryApplications = [
        newApp,
        ...memoryApplications.filter(
          (a) =>
            !(
              (a.referenceNumber === newApp.referenceNumber || a.email === newApp.email) &&
              a.category === newApp.category &&
              a.status === 'rejected'
            )
        ),
      ];
    }

    return res.status(201).json({ success: true, application: newApp });
  } catch (err) {
    console.error('Error creating PWD/Senior application:', err);
    return res.status(500).json({ error: 'Failed to create application', details: err.message });
  }
};

/**
 * PATCH /api/pwd-senior/applications/:id/status
 * Updates status (approve / reject)
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedIdNumber, approvedBy, approvedDate, rejectionReason } = req.body;

    try {
      await db.query(
        `UPDATE pwd_senior_applications
         SET status = $1, assigned_id_number = $2, approved_by = $3, approved_date = $4, rejection_reason = $5
         WHERE id = $6`,
        [status, assignedIdNumber || null, approvedBy || null, approvedDate || null, rejectionReason || null, id]
      );
    } catch (dbErr) {
      console.warn('[DB Error] Updating DB failed, updating in memory fallback:', dbErr.message);
      memoryApplications = memoryApplications.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              assignedIdNumber: assignedIdNumber || app.assignedIdNumber,
              approvedBy: approvedBy || app.approvedBy,
              approvedDate: approvedDate || app.approvedDate,
              rejectionReason: rejectionReason || app.rejectionReason,
            }
          : app
      );
    }

    return res.json({ success: true, id, status, assignedIdNumber });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
};
