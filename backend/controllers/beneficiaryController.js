const db = require('../config/db');

// In-memory fallback if database query fails or tables are initializing
let memoryBeneficiaries = [
  {
    id: 1,
    beneficiary_number: "BNF-2026-0001",
    full_name: "Clarisa Mae Dimal",
    first_name: "Clarisa Mae",
    last_name: "Dimal",
    age: "21",
    sex: "Female",
    address: "11 Sampaloc Street, Brgy. Sauyo, Quezon City",
    contact_no: "0917 555 1234",
    household_members: "4",
    verification_status: "verified",
    verified_by: "Admin User",
    verification_date: "2026-08-15T08:30:00Z",
    verification_remarks: "Verified via PhilSys National ID authentication",
    id_type: "PhilID",
    id_number: "1234-5678-9012",
    created_at: "2026-08-15T08:00:00Z",
    updated_at: "2026-08-15T08:30:00Z",
  },
  {
    id: 2,
    beneficiary_number: "BNF-2026-0002",
    full_name: "Rosalinda Torres",
    first_name: "Rosalinda",
    last_name: "Torres",
    age: "71",
    sex: "Female",
    address: "Purok 5, Barangay Malaya, Quezon City",
    contact_no: "0917 555 2233",
    household_members: "3",
    verification_status: "verified",
    verified_by: "Admin User",
    verification_date: "2026-08-14T10:15:00Z",
    verification_remarks: "Verified with OSCA Senior Registry record",
    id_type: "Voter's ID",
    id_number: "8812-4471",
    created_at: "2026-08-14T09:00:00Z",
    updated_at: "2026-08-14T10:15:00Z",
  },
  {
    id: 3,
    beneficiary_number: "BNF-2026-0003",
    full_name: "Julius Cabrera",
    first_name: "Julius",
    last_name: "Cabrera",
    age: "36",
    sex: "Male",
    address: "Zone 1, Barangay San Roque, Quezon City",
    contact_no: "0928 774 4410",
    household_members: "5",
    verification_status: "pending",
    id_type: "PWD ID (expired)",
    id_number: "PWD-2023-00127",
    created_at: "2026-08-13T11:00:00Z",
    updated_at: "2026-08-13T11:00:00Z",
  },
  {
    id: 4,
    beneficiary_number: "BNF-2026-0004",
    full_name: "Emilyn Salazar",
    first_name: "Emilyn",
    last_name: "Salazar",
    age: "34",
    sex: "Female",
    address: "Purok 2, Barangay Sto. Niño, Quezon City",
    contact_no: "0917 332 8891",
    household_members: "2",
    verification_status: "unverified",
    verification_remarks: "Missing death certificate of spouse",
    created_at: "2026-08-17T14:20:00Z",
    updated_at: "2026-08-17T14:20:00Z",
  },
  {
    id: 5,
    beneficiary_number: "BNF-2026-0005",
    full_name: "RENZ MAHINAY MILLARES",
    first_name: "RENZ",
    middle_name: "MAHINAY",
    last_name: "MILLARES",
    age: "28",
    sex: "Male",
    address: "123 Katipunan Ave, Brgy. Loyola Heights, Quezon City",
    contact_no: "09155212352",
    email: "renzmillares@gmail.com",
    qcid_number: "110000116932100",
    household_members: "3",
    verification_status: "verified",
    verified_by: "Admin Officer",
    verification_date: "2026-09-08T09:00:00Z",
    verification_remarks: "Official QCitizen ID and supporting documents authenticated",
    id_type: "QCitizen ID",
    id_number: "110000116932100",
    created_at: "2026-09-08T08:30:00Z",
    updated_at: "2026-09-08T09:00:00Z",
  }
];

let memoryVerifications = [];
let memoryHistory = [];

/**
 * Generate unique Beneficiary Number (e.g. BNF-2026-0001)
 */
async function generateBeneficiaryNumber() {
  const year = new Date().getFullYear();
  try {
    const result = await db.query('SELECT COUNT(*) FROM beneficiaries');
    const count = parseInt(result.rows[0].count, 10) + 1;
    return `BNF-${year}-${String(count).padStart(4, '0')}`;
  } catch {
    const count = memoryBeneficiaries.length + 1;
    return `BNF-${year}-${String(count).padStart(4, '0')}`;
  }
}

/**
 * AUTOMATION HELPER: Ensure a citizen beneficiary record exists and link application
 */
async function ensureBeneficiaryForUser(data) {
  const {
    userId,
    qcid,
    fullName,
    firstName,
    middleName,
    lastName,
    suffix,
    age,
    sex,
    civilStatus,
    birthDate,
    address,
    contactNo,
    email,
    idType,
    idNumber,
    householdMembers,
    program,
    applicationRef,
    action = "Application submitted",
    remarks,
    performedBy,
  } = data;

  const resolvedName = (
    fullName ||
    [firstName, middleName, lastName, suffix].filter(Boolean).join(' ') ||
    'Citizen Beneficiary'
  ).trim();

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanQcid = (qcid || '').trim();
  const cleanFirst = (firstName || '').trim().toLowerCase();
  const cleanLast = (lastName || '').trim().toLowerCase();
  const parsedUserId = userId && !isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null;

  let beneficiary = null;

  try {
    // 1. Check if beneficiary already exists in DB
    const searchConditions = [];
    const searchParams = [];
    let paramIdx = 1;

    if (parsedUserId) {
      searchConditions.push(`user_id = $${paramIdx++}`);
      searchParams.push(parsedUserId);
    }
    if (cleanQcid) {
      searchConditions.push(`qcid_number = $${paramIdx++}`);
      searchParams.push(cleanQcid);
    }
    if (cleanEmail) {
      searchConditions.push(`LOWER(email) = $${paramIdx++}`);
      searchParams.push(cleanEmail);
    }
    if (cleanFirst && cleanLast) {
      searchConditions.push(`(LOWER(first_name) = $${paramIdx} AND LOWER(last_name) = $${paramIdx + 1})`);
      searchParams.push(cleanFirst, cleanLast);
      paramIdx += 2;
    } else if (resolvedName) {
      searchConditions.push(`LOWER(full_name) = $${paramIdx++}`);
      searchParams.push(resolvedName.toLowerCase());
    }

    if (searchConditions.length > 0) {
      const findQuery = `SELECT * FROM beneficiaries WHERE ${searchConditions.join(' OR ')} LIMIT 1`;
      const findRes = await db.query(findQuery, searchParams);
      if (findRes.rows.length > 0) {
        beneficiary = findRes.rows[0];
      }
    }

    // 2. If not found, create new Beneficiary record
    if (!beneficiary) {
      const bnfNumber = await generateBeneficiaryNumber();
      const insertQuery = `
        INSERT INTO beneficiaries (
          user_id, beneficiary_number, full_name, first_name, middle_name, last_name, suffix,
          age, sex, civil_status, birth_date, address, contact_no, email, qcid_number,
          household_members, verification_status, id_type, id_number, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', $17, $18, NOW(), NOW()
        ) RETURNING *
      `;
      const insertRes = await db.query(insertQuery, [
        parsedUserId,
        bnfNumber,
        resolvedName,
        firstName || null,
        middleName || null,
        lastName || null,
        suffix || null,
        age ? String(age) : null,
        sex || null,
        civilStatus || null,
        birthDate || null,
        address || null,
        contactNo || null,
        email || null,
        cleanQcid || null,
        householdMembers ? String(householdMembers) : '1',
        idType || (cleanQcid ? 'QCitizen ID' : 'Valid ID'),
        idNumber || cleanQcid || null,
      ]);

      beneficiary = insertRes.rows[0];

      // Auto-log Beneficiary Record Creation
      await db.query(
        `INSERT INTO beneficiary_history (beneficiary_id, program, action, performed_by, status, detail, created_at)
         VALUES ($1, 'System', 'Beneficiary Record Created', 'System Automation', 'Active', 'Official beneficiary profile automatically generated.', NOW())`,
        [beneficiary.id]
      ).catch(() => {});
    }

    // 3. Log Application Submission / Linkage Event
    if (beneficiary && program) {
      await db.query(
        `INSERT INTO beneficiary_history (beneficiary_id, application_id, program, action, performed_by, status, detail, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, 'Pending', $6, $7, NOW())`,
        [
          beneficiary.id,
          applicationRef || null,
          program,
          action || 'Application submitted',
          performedBy || resolvedName,
          remarks || `${program} application submitted with Ref: ${applicationRef || 'N/A'}.`,
          remarks || null,
        ]
      ).catch(() => {});
    }

    return beneficiary;
  } catch (err) {
    console.warn('⚠️ Warning in ensureBeneficiaryForUser (DB fallback):', err.message);

    // In-memory fallback
    beneficiary = memoryBeneficiaries.find(
      (b) =>
        (parsedUserId && b.user_id === parsedUserId) ||
        (cleanQcid && b.qcid_number === cleanQcid) ||
        (cleanEmail && b.email?.toLowerCase() === cleanEmail) ||
        (b.full_name?.toLowerCase() === resolvedName.toLowerCase())
    );

    if (!beneficiary) {
      beneficiary = {
        id: memoryBeneficiaries.length + 1,
        user_id: parsedUserId,
        beneficiary_number: `BNF-2026-${String(memoryBeneficiaries.length + 1).padStart(4, '0')}`,
        full_name: resolvedName,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix,
        age: age ? String(age) : "25",
        sex: sex || "Male",
        address: address || "Quezon City",
        contact_no: contactNo || "0915 000 0000",
        email,
        qcid_number: cleanQcid,
        household_members: householdMembers ? String(householdMembers) : "1",
        verification_status: "pending",
        id_type: idType || "Valid ID",
        id_number: idNumber || cleanQcid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryBeneficiaries.push(beneficiary);

      memoryHistory.push({
        id: memoryHistory.length + 1,
        beneficiary_id: beneficiary.id,
        program: 'System',
        action: 'Beneficiary Record Created',
        performed_by: 'System Automation',
        status: 'Active',
        detail: 'Official beneficiary profile automatically generated.',
        created_at: new Date().toISOString(),
      });
    }

    if (program) {
      memoryHistory.push({
        id: memoryHistory.length + 1,
        beneficiary_id: beneficiary.id,
        application_id: applicationRef,
        program,
        action: action || 'Application submitted',
        performed_by: performedBy || resolvedName,
        status: 'Pending',
        detail: remarks || `${program} application submitted with Ref: ${applicationRef || 'N/A'}.`,
        created_at: new Date().toISOString(),
      });
    }

    return beneficiary;
  }
}

/**
 * AUTOMATION HELPER: Log status updates (Approved, Rejected, Released, Scheduled)
 */
async function logBeneficiaryEvent(eventData) {
  const {
    beneficiaryId,
    qcid,
    email,
    name,
    applicationId,
    program,
    action,
    performedBy = "Admin Social Worker",
    status,
    detail,
    remarks,
  } = eventData;

  try {
    let targetBnfId = beneficiaryId;
    if (!targetBnfId) {
      const bnf = await ensureBeneficiaryForUser({ qcid, email, fullName: name, program: null });
      targetBnfId = bnf?.id;
    }

    if (targetBnfId) {
      await db.query(
        `INSERT INTO beneficiary_history (beneficiary_id, application_id, program, action, performed_by, status, detail, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [targetBnfId, applicationId || null, program || 'General', action, performedBy, status || null, detail || null, remarks || null]
      );
    }
  } catch (err) {
    console.warn('⚠️ Could not record beneficiary history event:', err.message);
  }
}

/**
 * GET /api/beneficiaries
 * Fetch all beneficiaries with aggregated enrolled programs, verification records, and timeline history
 */
async function getAllBeneficiaries(req, res) {
  try {
    let dbBeneficiaries = [];
    try {
      const bRes = await db.query(`SELECT * FROM beneficiaries ORDER BY id DESC`);
      dbBeneficiaries = bRes.rows;
    } catch {
      dbBeneficiaries = memoryBeneficiaries;
    }

    // Seed default records if completely empty
    if (dbBeneficiaries.length === 0 && memoryBeneficiaries.length > 0) {
      for (const m of memoryBeneficiaries) {
        try {
          await db.query(
            `INSERT INTO beneficiaries (
              id, beneficiary_number, full_name, first_name, middle_name, last_name, suffix,
              age, sex, address, contact_no, email, qcid_number, household_members,
              verification_status, verified_by, verification_date, verification_remarks,
              id_type, id_number, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            ON CONFLICT (beneficiary_number) DO NOTHING`,
            [
              m.id, m.beneficiary_number, m.full_name, m.first_name || null, m.middle_name || null, m.last_name || null, m.suffix || null,
              m.age, m.sex, m.address, m.contact_no, m.email || null, m.qcid_number || null, m.household_members || '1',
              m.verification_status || 'pending', m.verified_by || null, m.verification_date || null, m.verification_remarks || null,
              m.id_type || 'Valid ID', m.id_number || null, m.created_at || new Date(), m.updated_at || new Date()
            ]
          );
        } catch {}
      }
      const bRes = await db.query(`SELECT * FROM beneficiaries ORDER BY id DESC`);
      dbBeneficiaries = bRes.rows.length > 0 ? bRes.rows : memoryBeneficiaries;
    }

    // Fetch history logs for each beneficiary
    let allHistory = [];
    try {
      const hRes = await db.query(`SELECT * FROM beneficiary_history ORDER BY created_at DESC`);
      allHistory = hRes.rows;
    } catch {
      allHistory = memoryHistory;
    }

    // Cross-link applications from all service tables
    let aicsList = [], pwdList = [], soloList = [], childList = [], livList = [];
    try {
      const a = await db.query(`SELECT * FROM aics_applications`).catch(() => ({ rows: [] }));
      aicsList = a.rows;
    } catch {}
    try {
      const p = await db.query(`SELECT * FROM pwd_senior_applications`).catch(() => ({ rows: [] }));
      pwdList = p.rows;
    } catch {}
    try {
      const s = await db.query(`SELECT * FROM solo_parent_applications`).catch(() => ({ rows: [] }));
      soloList = s.rows;
    } catch {}
    try {
      const c = await db.query(`SELECT * FROM child_welfare_applications`).catch(() => ({ rows: [] }));
      childList = c.rows;
    } catch {}
    try {
      const l = await db.query(`SELECT * FROM livelihood_applications`).catch(() => ({ rows: [] }));
      livList = l.rows;
    } catch {}

    const results = dbBeneficiaries.map((b) => {
      const bId = b.id;
      const bNum = b.beneficiary_number || `BNF-2026-${String(bId).padStart(4, '0')}`;
      const bQcid = (b.qcid_number || '').trim().toLowerCase();
      const bEmail = (b.email || '').trim().toLowerCase();
      const bName = (b.full_name || '').trim().toLowerCase();
      const bFirst = (b.first_name || '').trim().toLowerCase();
      const bLast = (b.last_name || '').trim().toLowerCase();

      const enrolledPrograms = [];

      // Check AICS
      aicsList.forEach((app) => {
        const appQc = String(app.qc_id || app.reference_no || '').toLowerCase();
        const appEmail = String(app.email || '').toLowerCase();
        const appName = `${app.first_name || ''} ${app.last_name || ''}`.trim().toLowerCase();
        if (
          (bQcid && appQc.includes(bQcid)) ||
          (bEmail && appEmail === bEmail) ||
          (bName && appName && (bName.includes(appName) || appName.includes(bName)))
        ) {
          enrolledPrograms.push({
            program: "AICS",
            referenceNo: app.reference_no,
            status: (app.status || 'Pending').charAt(0).toUpperCase() + (app.status || 'Pending').slice(1),
            dateEnrolled: new Date(app.created_at || Date.now()).toISOString().split('T')[0],
          });
        }
      });

      // Check PWD / Senior
      pwdList.forEach((app) => {
        const appRef = String(app.reference_number || app.id || '').toLowerCase();
        const appEmail = String(app.email || '').toLowerCase();
        const appName = `${app.first_name || ''} ${app.last_name || ''}`.trim().toLowerCase();
        if (
          (bQcid && appRef.includes(bQcid)) ||
          (bEmail && appEmail === bEmail) ||
          (bName && appName && (bName.includes(appName) || appName.includes(bName)))
        ) {
          const progName = (app.category || '').toLowerCase().includes('senior') ? 'Senior Citizen' : 'PWD';
          enrolledPrograms.push({
            program: progName,
            referenceNo: app.reference_number || app.id,
            status: (app.status || 'Pending').charAt(0).toUpperCase() + (app.status || 'Pending').slice(1),
            dateEnrolled: new Date(app.submitted_at || app.created_at || Date.now()).toISOString().split('T')[0],
          });
        }
      });

      // Check Solo Parent
      soloList.forEach((app) => {
        const appQc = String(app.qcid_number || app.reference_number || app.user_id || '').toLowerCase();
        const appEmail = String(app.email || '').toLowerCase();
        const appName = `${app.first_name || ''} ${app.last_name || ''}`.trim().toLowerCase();
        if (
          (bQcid && appQc.includes(bQcid)) ||
          (bEmail && appEmail === bEmail) ||
          (bName && appName && (bName.includes(appName) || appName.includes(bName)))
        ) {
          enrolledPrograms.push({
            program: "Solo Parent",
            referenceNo: app.reference_number || app.solo_parent_id_number || `SP-${app.id}`,
            status: (app.application_status || 'Pending').charAt(0).toUpperCase() + (app.application_status || 'Pending').slice(1),
            dateEnrolled: new Date(app.created_at || Date.now()).toISOString().split('T')[0],
          });
        }
      });

      // Check Child Welfare
      childList.forEach((app) => {
        const appQc = String(app.reference_number || app.user_id || '').toLowerCase();
        const appEmail = String(app.email || app.guardian_email || '').toLowerCase();
        const appName = `${app.guardian_first_name || ''} ${app.guardian_last_name || ''}`.trim().toLowerCase();
        if (
          (bQcid && appQc.includes(bQcid)) ||
          (bEmail && appEmail === bEmail) ||
          (bName && appName && (bName.includes(appName) || appName.includes(bName)))
        ) {
          enrolledPrograms.push({
            program: "Child Welfare",
            referenceNo: app.reference_number || `CW-${app.id}`,
            status: (app.application_status || 'Pending').charAt(0).toUpperCase() + (app.application_status || 'Pending').slice(1),
            dateEnrolled: new Date(app.created_at || Date.now()).toISOString().split('T')[0],
          });
        }
      });

      // Check Livelihood
      livList.forEach((app) => {
        const appQc = String(app.qcid || app.reference_number || app.user_id || '').toLowerCase();
        const appEmail = String(app.email || '').toLowerCase();
        const appName = `${app.first_name || ''} ${app.last_name || ''}`.trim().toLowerCase();
        if (
          (bQcid && appQc.includes(bQcid)) ||
          (bEmail && appEmail === bEmail) ||
          (bName && appName && (bName.includes(appName) || appName.includes(bName)))
        ) {
          enrolledPrograms.push({
            program: "Livelihood",
            referenceNo: app.reference_number || `LP-${app.id}`,
            status: (app.application_status || 'Pending').charAt(0).toUpperCase() + (app.application_status || 'Pending').slice(1),
            dateEnrolled: new Date(app.created_at || Date.now()).toISOString().split('T')[0],
          });
        }
      });

      // Beneficiary timeline history
      const history = allHistory
        .filter((h) => String(h.beneficiary_id) === String(bId))
        .map((h) => ({
          id: `H-${h.id}`,
          date: new Date(h.created_at || Date.now()).toISOString().split('T')[0],
          program: h.program || "General",
          action: h.action,
          detail: h.detail || h.remarks || `${h.action} recorded.`,
          performedBy: h.performed_by,
          status: h.status,
        }));

      return {
        id: String(b.id),
        beneficiaryNo: bNum,
        fullName: b.full_name,
        firstName: b.first_name,
        lastName: b.last_name,
        age: String(b.age || "—"),
        sex: b.sex || "—",
        civilStatus: b.civil_status || "—",
        address: b.address || "Quezon City",
        contactNo: b.contact_no || "—",
        email: b.email || "—",
        qcidNumber: b.qcid_number || "—",
        householdMembers: String(b.household_members || "1"),
        dateRegistered: new Date(b.created_at || Date.now()).toISOString().split('T')[0],
        verificationStatus: b.verification_status || "pending",
        verifiedBy: b.verified_by || undefined,
        verifiedDate: b.verification_date ? new Date(b.verification_date).toISOString().split('T')[0] : undefined,
        verificationRemarks: b.verification_remarks || undefined,
        idType: b.id_type || (b.qcid_number ? "QCitizen ID" : "Government ID"),
        idNumber: b.id_number || b.qcid_number || undefined,
        enrolledPrograms,
        history,
      };
    });

    res.json({
      success: true,
      count: results.length,
      beneficiaries: results,
    });
  } catch (err) {
    console.error('Error in getAllBeneficiaries:', err);
    res.status(500).json({ error: 'Failed to retrieve beneficiaries', details: err.message });
  }
}

/**
 * GET /api/beneficiaries/:id
 */
async function getBeneficiaryById(req, res) {
  try {
    const { id } = req.params;
    let b = null;
    try {
      const result = await db.query(`SELECT * FROM beneficiaries WHERE id = $1 OR beneficiary_number = $1 LIMIT 1`, [id]);
      if (result.rows.length > 0) b = result.rows[0];
    } catch {}

    if (!b) {
      b = memoryBeneficiaries.find((m) => String(m.id) === String(id) || m.beneficiary_number === id);
    }

    if (!b) {
      return res.status(404).json({ error: 'Beneficiary record not found' });
    }

    res.json({ success: true, beneficiary: b });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve beneficiary', details: err.message });
  }
}

/**
 * PUT /api/beneficiaries/:id/verify
 * Admin action to verify, unverify, or set pending
 */
async function verifyBeneficiary(req, res) {
  try {
    const { id } = req.params;
    const {
      status, // 'verified', 'unverified', 'pending'
      verified_by = "Admin Social Worker",
      remarks = "",
      reason = "",
      id_type,
      id_number,
    } = req.body;

    const validStatuses = ['verified', 'unverified', 'pending'];
    const cleanStatus = String(status || '').toLowerCase().trim();

    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ error: 'Invalid verification status. Must be verified, unverified, or pending.' });
    }

    const noteText = remarks || reason || `Beneficiary status set to ${cleanStatus}.`;

    let updatedBeneficiary = null;

    try {
      const updateQuery = `
        UPDATE beneficiaries
        SET verification_status = $1,
            verified_by = $2,
            verification_date = NOW(),
            verification_remarks = $3,
            id_type = COALESCE($4, id_type),
            id_number = COALESCE($5, id_number),
            updated_at = NOW()
        WHERE id = $6 OR beneficiary_number = $6
        RETURNING *
      `;
      const updateRes = await db.query(updateQuery, [cleanStatus, verified_by, noteText, id_type || null, id_number || null, id]);
      if (updateRes.rows.length > 0) {
        updatedBeneficiary = updateRes.rows[0];

        // 1. Record in verification audit table
        await db.query(
          `INSERT INTO beneficiary_verifications (beneficiary_id, status, reviewed_by, reviewed_at, reason, remarks, created_at)
           VALUES ($1, $2, $3, NOW(), $4, $5, NOW())`,
          [updatedBeneficiary.id, cleanStatus, verified_by, reason || null, noteText]
        ).catch(() => {});

        // 2. Record in beneficiary history timeline
        const actionLabel =
          cleanStatus === "verified"
            ? "Beneficiary Verified"
            : cleanStatus === "unverified"
            ? "Beneficiary Flagged Unverified"
            : "Beneficiary Under Review";

        await db.query(
          `INSERT INTO beneficiary_history (beneficiary_id, program, action, performed_by, status, detail, remarks, created_at)
           VALUES ($1, 'Beneficiary Management', $2, $3, $4, $5, $6, NOW())`,
          [updatedBeneficiary.id, actionLabel, verified_by, cleanStatus, noteText, noteText]
        ).catch(() => {});

        // 3. Record in system-wide activity log
        await db.query(
          `INSERT INTO activity_log (actor, actor_role, action, module, reference_no, subject, detail, created_at)
           VALUES ($1, 'Admin', 'VERIFIED_BENEFICIARY', 'Beneficiary Management', $2, $3, $4, NOW())`,
          [verified_by, updatedBeneficiary.beneficiary_number, updatedBeneficiary.full_name, noteText]
        ).catch(() => {});
      }
    } catch (err) {
      console.warn('⚠️ DB update failed, falling back to memory:', err.message);
    }

    if (!updatedBeneficiary) {
      const memIdx = memoryBeneficiaries.findIndex((m) => String(m.id) === String(id) || m.beneficiary_number === id);
      if (memIdx !== -1) {
        memoryBeneficiaries[memIdx].verification_status = cleanStatus;
        memoryBeneficiaries[memIdx].verified_by = verified_by;
        memoryBeneficiaries[memIdx].verification_date = new Date().toISOString();
        memoryBeneficiaries[memIdx].verification_remarks = noteText;
        memoryBeneficiaries[memIdx].updated_at = new Date().toISOString();
        updatedBeneficiary = memoryBeneficiaries[memIdx];

        memoryVerifications.push({
          id: memoryVerifications.length + 1,
          beneficiary_id: updatedBeneficiary.id,
          status: cleanStatus,
          reviewed_by: verified_by,
          reviewed_at: new Date().toISOString(),
          reason: reason || null,
          remarks: noteText,
        });

        memoryHistory.push({
          id: memoryHistory.length + 1,
          beneficiary_id: updatedBeneficiary.id,
          program: 'Beneficiary Management',
          action: cleanStatus === "verified" ? "Beneficiary Verified" : "Verification Status Updated",
          performed_by: verified_by,
          status: cleanStatus,
          detail: noteText,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (!updatedBeneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found to update verification' });
    }

    res.json({
      success: true,
      message: `Beneficiary ${updatedBeneficiary.beneficiary_number} marked as ${cleanStatus}.`,
      beneficiary: updatedBeneficiary,
    });
  } catch (err) {
    console.error('Error in verifyBeneficiary:', err);
    res.status(500).json({ error: 'Failed to verify beneficiary', details: err.message });
  }
}

/**
 * POST /api/beneficiaries/:id/history
 * Add custom case event/log to beneficiary history
 */
async function addBeneficiaryHistory(req, res) {
  try {
    const { id } = req.params;
    const {
      program = "General",
      action,
      performed_by = "Admin Social Worker",
      status = "Active",
      detail = "",
      remarks = "",
      application_id,
    } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required to record history log.' });
    }

    let historyRecord = null;
    try {
      const resLog = await db.query(
        `INSERT INTO beneficiary_history (beneficiary_id, application_id, program, action, performed_by, status, detail, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [id, application_id || null, program, action, performed_by, status, detail, remarks]
      );
      historyRecord = resLog.rows[0];
    } catch {}

    if (!historyRecord) {
      historyRecord = {
        id: memoryHistory.length + 1,
        beneficiary_id: id,
        application_id,
        program,
        action,
        performed_by,
        status,
        detail,
        remarks,
        created_at: new Date().toISOString(),
      };
      memoryHistory.push(historyRecord);
    }

    res.status(201).json({ success: true, history: historyRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add history log', details: err.message });
  }
}

/**
 * DELETE /api/beneficiaries/:id
 */
async function deleteBeneficiary(req, res) {
  try {
    const { id } = req.params;
    try {
      await db.query(`DELETE FROM beneficiaries WHERE id = $1 OR beneficiary_number = $1`, [id]);
    } catch {}
    memoryBeneficiaries = memoryBeneficiaries.filter((m) => String(m.id) !== String(id) && m.beneficiary_number !== id);
    res.json({ success: true, message: `Beneficiary ${id} removed.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete beneficiary', details: err.message });
  }
}

module.exports = {
  ensureBeneficiaryForUser,
  logBeneficiaryEvent,
  getAllBeneficiaries,
  getBeneficiaryById,
  verifyBeneficiary,
  addBeneficiaryHistory,
  deleteBeneficiary,
};
