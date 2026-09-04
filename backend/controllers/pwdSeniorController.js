const db = require('../config/db');
let logActivity = null;
try {
  const actCtrl = require('./activityLogController');
  logActivity = actCtrl.logActivity;
} catch {}

const SEED_PWD_SENIOR_APPS = [
  {
    id: "APP-PWD-2026-001",
    submittedAt: "2026-08-20T09:30:00.000Z",
    referenceNumber: "PWD-QC-2026-4891",
    category: "PWD",
    type: "new",
    firstName: "Juan",
    middleName: "Ramos",
    lastName: "Dela Cruz",
    suffix: "",
    dateOfBirth: "1998-05-14",
    age: "28",
    sex: "Male",
    civilStatus: "Single",
    contactNo: "09171234567",
    cellphoneNo: "09171234567",
    email: "juan.delacruz@gmail.com",
    address: "Block 12 Lot 4, Brgy. Batasan Hills, Quezon City",
    disabilityType: "Visual Disability",
    disabilityClass: "apparent",
    causeOfDisability: "Congenital / Inborn",
    applyingFor: "myself",
    documents: [
      { name: "Whole Body Picture", filename: "whole_body.jpg", fileUrl: "/samples/WHOLE BODY.jpg", uploadedAt: "2026-08-20T09:25:00.000Z", status: "verified" },
      { name: "Certificate of Disability", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-20T09:26:00.000Z", status: "verified" },
      { name: "Proof of Residence", filename: "residency.webp", fileUrl: "/samples/PROOF OF RESIDENCE.webp", uploadedAt: "2026-08-20T09:27:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-20T09:28:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
  {
    id: "APP-PWD-2026-002",
    submittedAt: "2026-08-18T14:15:00.000Z",
    referenceNumber: "PWD-QC-2026-3109",
    category: "PWD",
    type: "renewal",
    firstName: "Maria",
    middleName: "Clara",
    lastName: "Santos",
    suffix: "",
    dateOfBirth: "1992-11-20",
    age: "33",
    sex: "Female",
    civilStatus: "Married",
    contactNo: "09189876543",
    cellphoneNo: "09189876543",
    email: "maria.santos@gmail.com",
    address: "24 Malakas St., Brgy. Pinyahan, Quezon City",
    disabilityType: "Orthopedic Disability",
    disabilityClass: "apparent",
    causeOfDisability: "Accident / Trauma",
    applyingFor: "myself",
    documents: [
      { name: "Previous PWD ID Card", filename: "qc_id_pwd.jpg", fileUrl: "/samples/QC ID NG PERSON WITH DISABILITY.jpg", uploadedAt: "2026-08-18T14:10:00.000Z", status: "verified" },
      { name: "Certificate of Disability", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-18T14:12:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-18T14:13:00.000Z", status: "verified" },
    ],
    status: "approved",
    assignedIdNumber: "PWD-137404-2026-310901",
    approvedBy: "Social Worker Admin",
    approvedDate: "2026-08-19T10:00:00.000Z",
  },
  {
    id: "APP-PWD-2026-003",
    submittedAt: "2026-08-22T11:00:00.000Z",
    referenceNumber: "PWD-QC-2026-5520",
    category: "PWD",
    type: "assistance",
    firstName: "Ricardo",
    middleName: "Bautista",
    lastName: "Dimal",
    suffix: "Jr.",
    dateOfBirth: "2001-03-08",
    age: "25",
    sex: "Male",
    civilStatus: "Single",
    contactNo: "09205554321",
    cellphoneNo: "09205554321",
    email: "ricardo.dimal@gmail.com",
    address: "Zone 3, Brgy. Holy Spirit, Quezon City",
    disabilityType: "Psychosocial Disability",
    disabilityClass: "non-apparent",
    causeOfDisability: "Illness / Disease",
    applyingFor: "myself",
    documents: [
      { name: "Certificate of Disability from Specialist", filename: "cert_disability.jpg", fileUrl: "/samples/CERTIFICATE OF DISABILITY.jpg", uploadedAt: "2026-08-22T10:50:00.000Z", status: "verified" },
      { name: "Barangay Indigency Certificate", filename: "barangay_cert.webp", fileUrl: "/samples/BARANGAY CERTIFICATE.webp", uploadedAt: "2026-08-22T10:52:00.000Z", status: "verified" },
      { name: "Proof of Residence", filename: "residency.webp", fileUrl: "/samples/PROOF OF RESIDENCE.webp", uploadedAt: "2026-08-22T10:55:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
  {
    id: "APP-SNR-2026-004",
    submittedAt: "2026-08-21T08:45:00.000Z",
    referenceNumber: "OSCA-QC-2026-8802",
    category: "Senior Citizen",
    type: "new",
    firstName: "Teresa",
    middleName: "Manalo",
    lastName: "Lopez",
    suffix: "",
    dateOfBirth: "1960-04-12",
    age: "66",
    sex: "Female",
    civilStatus: "Widowed",
    contactNo: "09193337788",
    cellphoneNo: "09193337788",
    email: "teresa.lopez@gmail.com",
    address: "15 Dahlia St., Brgy. Fairview, Quezon City",
    disabilityType: "",
    disabilityClass: "",
    causeOfDisability: "",
    vaccinatedCovid: "Yes",
    applyingFor: "myself",
    documents: [
      { name: "Birth Certificate / Valid ID", filename: "birth_cert.jpg", fileUrl: "/samples/BIRTH CERTIFICATE OF MINOR.jpg", uploadedAt: "2026-08-21T08:40:00.000Z", status: "verified" },
      { name: "Barangay Residency Certificate", filename: "barangay_cert.webp", fileUrl: "/samples/BARANGAY CERTIFICATE.webp", uploadedAt: "2026-08-21T08:42:00.000Z", status: "verified" },
      { name: "2x2 ID Picture", filename: "id_picture.webp", fileUrl: "/samples/ID PICTURE (2X2).webp", uploadedAt: "2026-08-21T08:43:00.000Z", status: "verified" },
    ],
    status: "pending",
  },
];

// In-memory fallback if database table is initializing or offline
let memoryApplications = [...SEED_PWD_SENIOR_APPS];

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

    // Seed sample applications if table is empty
    const checkCount = await db.query('SELECT COUNT(*) FROM pwd_senior_applications');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      for (const app of SEED_PWD_SENIOR_APPS) {
        await db.query(
          `INSERT INTO pwd_senior_applications (
            id, reference_number, category, type, first_name, middle_name, last_name, suffix,
            date_of_birth, age, sex, civil_status, contact_no, email, address, disability_type,
            disability_class, cause_of_disability, applying_for, documents, status, assigned_id_number,
            approved_by, approved_date
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
          ON CONFLICT (id) DO NOTHING`,
          [
            app.id,
            app.referenceNumber,
            app.category,
            app.type,
            app.firstName,
            app.middleName || '',
            app.lastName,
            app.suffix || '',
            app.dateOfBirth,
            app.age,
            app.sex,
            app.civilStatus,
            app.contactNo,
            app.email,
            app.address,
            app.disabilityType || '',
            app.disabilityClass || '',
            app.causeOfDisability || '',
            app.applyingFor || 'myself',
            JSON.stringify(app.documents || []),
            app.status || 'pending',
            app.assignedIdNumber || null,
            app.approvedBy || null,
            app.approvedDate || null,
          ]
        );
      }
      console.log('[DB] Seeded initial PWD/Senior applications.');
    }
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
    if (result.rows.length === 0) {
      return res.json(memoryApplications);
    }
    const mapped = result.rows.map((row) => {
      let parsedDocs = [];
      if (Array.isArray(row.documents)) {
        parsedDocs = row.documents;
      } else if (typeof row.documents === 'string') {
        try {
          parsedDocs = JSON.parse(row.documents);
        } catch {
          parsedDocs = [];
        }
      }
      return {
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
        documents: parsedDocs,
        status: row.status || 'pending',
        assignedIdNumber: row.assigned_id_number,
        approvedBy: row.approved_by,
        approvedDate: row.approved_date,
        rejectionReason: row.rejection_reason,
      };
    });
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

    if (logActivity) {
      logActivity({
        actor: `${newApp.firstName} ${newApp.lastName}`.trim() || 'Resident',
        actorRole: 'Citizen',
        action: 'created',
        module: 'PWD & Senior Citizen',
        referenceNo: newApp.referenceNumber,
        subject: `${newApp.category} ${newApp.type.toUpperCase()} Application Submitted`,
        detail: `Application submitted for ${newApp.category} (${newApp.type})`,
      });
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

    if (logActivity) {
      logActivity({
        actor: approvedBy || 'Social Worker Admin',
        actorRole: 'Social Worker',
        action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'edited',
        module: 'PWD & Senior Citizen',
        referenceNo: assignedIdNumber || id,
        subject: `${status === 'approved' ? 'Approved' : 'Rejected'} PWD/Senior Application`,
        detail: status === 'approved' ? `Official ID: ${assignedIdNumber || 'Assigned'}` : (rejectionReason || 'Requirements not met'),
      });
    }

    return res.json({ success: true, id, status, assignedIdNumber });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
};
