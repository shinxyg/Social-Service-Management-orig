// controllers/soloParentController.js
const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

function generateReference(qcid) {
  if (qcid && String(qcid).trim()) return String(qcid).trim();
  return '110000116932100';
}

async function initSoloParentColumns() {
  try {
    await db.query(`
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_first_name VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_last_name VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(200);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_contact_no VARCHAR(50);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS emergency_address TEXT;
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS blood_type VARCHAR(20);
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE solo_parent_applications ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
    `);
  } catch (e) {
    console.warn('[Solo Parent DB init columns]:', e.message);
  }
}
initSoloParentColumns();

// Create new application
exports.createApplication = async (req, res) => {
  try {
    const { userId, applicationData, requiredDocumentIds } = req.body;
    const { isResident, idStatus, selectedCategoryId, selectedCategory, existingIdNumber, isIdVerified, formData = {}, familyMembers = [] } = applicationData || {};

    // Clean up any unsubmitted draft records so they never block new attempts
    await db.query(
      `DELETE FROM solo_parent_applications
       WHERE user_id = $1 AND application_status = 'draft'`,
      [userId]
    );

    const referenceNumber = req.body.referenceNumber || req.body.reference_number || (formData && (formData.qcidNumber || formData.qcidNo || formData.qcId)) || generateReference();

    const parsedAge = formData.age ? parseInt(formData.age, 10) : null;
    const safeAge = isNaN(parsedAge) ? null : parsedAge;
    const soloParentIdNum = existingIdNumber || formData.soloParentIdNumber || null;

    const emergencyFirstName = formData.emergencyFirstName || (formData.emergencyName ? formData.emergencyName.split(' ')[0] : null) || null;
    const emergencyLastName = formData.emergencyLastName || (formData.emergencyName && formData.emergencyName.split(' ').length > 1 ? formData.emergencyName.split(' ').slice(1).join(' ') : null) || null;
    const emergencyName = [emergencyFirstName, emergencyLastName].filter(Boolean).join(' ') || formData.emergencyName || formData.emergencyContactPerson || formData.emergencyPerson || null;
    const emergencyPhone = formData.emergencyContactNo || formData.emergencyPhone || formData.contactNo || null;
    const emergencyRel = formData.emergencyRelationship || formData.relationshipToApplicant || formData.relationship || null;
    const emergencyAddr = formData.emergencyAddress || (formData.addressHouseNo ? `${formData.addressHouseNo} ${formData.addressStreet || ''}, ${formData.addressBarangay || ''}, ${formData.addressCityMunicipality || 'Quezon City'}`.trim() : null);
    const bloodType = formData.bloodType || 'O+';

    const result = await db.query(
      `INSERT INTO solo_parent_applications (
        reference_number, user_id, application_status, application_type,
        is_resident, classification_id, classification_title, required_document_ids,
        solo_parent_id_number, is_id_verified,
        first_name, middle_name, last_name, suffix, age, sex,
        dob_month, dob_day, dob_year, civil_status, contact_no,
        address_house_no, address_street, address_barangay, address_city_municipality,
        qcid_number, email,
        emergency_first_name, emergency_last_name, emergency_name,
        emergency_contact_no, emergency_relationship, emergency_address,
        blood_type, form_data, family_members, extra_data
      ) VALUES (
        $1, $2, 'draft', $3,
        $4, $5, $6, $7,
        $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26,
        $27, $28, $29,
        $30, $31, $32,
        $33, $34, $35, $36
      ) RETURNING id, reference_number`,
      [
        referenceNumber, userId, idStatus,
        isResident, selectedCategoryId, selectedCategory?.title || null, JSON.stringify(requiredDocumentIds || []),
        soloParentIdNum, Boolean(isIdVerified),
        formData.firstName || null, formData.middleName || null, formData.lastName || null, formData.suffix || null, safeAge, formData.sex || null,
        formData.dobMonth || null, formData.dobDay || null, formData.dobYear || null, formData.civilStatus || null, formData.contactNo || null,
        formData.addressHouseNo || null, formData.addressStreet || null, formData.addressBarangay || null, formData.addressCityMunicipality || null,
        formData.qcidNumber || null, formData.email || null,
        formData.emergencyFirstName || null, formData.emergencyLastName || null, emergencyName,
        emergencyPhone, emergencyRel, emergencyAddr,
        bloodType, JSON.stringify(formData || {}), JSON.stringify(familyMembers || []), JSON.stringify({ formData, familyMembers })
      ]
    );

    const saved = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      referenceNumber: saved.reference_number,
      applicationId: saved.id,
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message,
    });
  }
};

// Upload documents
exports.uploadDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { documentId, documentLabel } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const appResult = await db.query('SELECT uploaded_documents FROM solo_parent_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      fileUrl: `/uploads/solo-parent/${file.filename}`,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    let uploadedDocuments = appResult.rows[0].uploaded_documents || [];
    const existingDocIndex = uploadedDocuments.findIndex((doc) => doc.documentId === documentId);

    if (existingDocIndex > -1) {
      uploadedDocuments[existingDocIndex].files.push(...uploadedFiles);
    } else {
      uploadedDocuments.push({
        documentId,
        documentLabel,
        files: uploadedFiles,
      });
    }

    await db.query(
      'UPDATE solo_parent_applications SET uploaded_documents = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(uploadedDocuments), applicationId]
    );

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, message: 'Error uploading documents', error: error.message });
  }
};

// Remove document
exports.removeDocument = async (req, res) => {
  try {
    const { applicationId, documentId, filename } = req.params;

    const appResult = await db.query('SELECT uploaded_documents FROM solo_parent_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let uploadedDocuments = appResult.rows[0].uploaded_documents || [];
    const documentIndex = uploadedDocuments.findIndex((doc) => doc.documentId === documentId);

    if (documentIndex > -1) {
      const fileIndex = uploadedDocuments[documentIndex].files.findIndex((file) => file.filename === filename);

      if (fileIndex > -1) {
        try {
          const filePath = path.join(__dirname, '../uploads/solo-parent', filename);
          await fs.unlink(filePath);
        } catch (err) {
          console.warn('Could not delete physical file:', err);
        }

        uploadedDocuments[documentIndex].files.splice(fileIndex, 1);

        if (uploadedDocuments[documentIndex].files.length === 0) {
          uploadedDocuments.splice(documentIndex, 1);
        }

        await db.query(
          'UPDATE solo_parent_applications SET uploaded_documents = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(uploadedDocuments), applicationId]
        );

        return res.status(200).json({ success: true, message: 'File removed successfully' });
      }
    }

    res.status(404).json({ success: false, message: 'File not found' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ success: false, message: 'Error removing document', error: error.message });
  }
};

// Submit application
exports.submitApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const appResult = await db.query('SELECT * FROM solo_parent_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appResult.rows[0];
    const requiredDocumentIds = application.required_document_ids || [];
    const uploadedDocuments = application.uploaded_documents || [];
    const uploadedIds = uploadedDocuments.map((d) => d.documentId);
    const missing = requiredDocumentIds.filter((id) => !uploadedIds.includes(id));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Not all required documents have been uploaded',
        missingDocumentIds: missing,
      });
    }

    await db.query(
      `UPDATE solo_parent_applications SET application_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      referenceNumber: application.reference_number,
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Error submitting application', error: error.message });
  }
};

// Get application by reference number
exports.getApplicationByReference = async (req, res) => {
  try {
    const { referenceNumber } = req.params;

    const result = await db.query('SELECT * FROM solo_parent_applications WHERE reference_number = $1', [referenceNumber]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, message: 'Error fetching application', error: error.message });
  }
};

// Get all applications by user
exports.getUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { qcid, email } = req.query;

    const cleanUserId = userId && userId !== 'undefined' && userId !== 'null' && userId !== '0' && userId !== '1' ? String(userId).trim() : null;
    const cleanQcid = qcid && String(qcid).trim() && !['110000116932100', '11000015952309', '110000572516915'].includes(String(qcid).trim()) ? String(qcid).trim() : null;
    const cleanEmail = email && String(email).trim() && String(email).trim().toLowerCase() !== 'resident@gmail.com' ? String(email).trim().toLowerCase() : null;

    if (!cleanUserId && !cleanQcid && !cleanEmail) {
      return res.status(200).json({ success: true, applications: [] });
    }

    const params = [];
    const orClauses = [];

    if (cleanUserId) {
      params.push(cleanUserId);
      orClauses.push(`user_id = $${params.length}`);
    }
    if (cleanQcid) {
      params.push(cleanQcid);
      orClauses.push(`qcid_number = $${params.length}`);
    }
    if (cleanEmail) {
      params.push(cleanEmail);
      orClauses.push(`LOWER(email) = LOWER($${params.length})`);
    }

    const result = await db.query(
      `SELECT *
       FROM solo_parent_applications
       WHERE ${orClauses.join(' OR ')}
       ORDER BY created_at DESC`,
      params
    );

    res.status(200).json({ success: true, applications: result.rows });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ success: false, message: 'Error fetching applications', error: error.message });
  }
};

// Get all applications (admin)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM solo_parent_applications';
    const params = [];

        if (status) {
      params.push(status);
      query += ` WHERE application_status = $${params.length}`;
    } else {
      query += ` WHERE application_status != 'draft'`;
    }

    query += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    const countParams = status ? [status] : [];
    const countQuery = status
      ? 'SELECT COUNT(*) FROM solo_parent_applications WHERE application_status = $1'
      : 'SELECT COUNT(*) FROM solo_parent_applications';
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      success: true,
      applications: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Error fetching applications', error: error.message });
  }
};

// Get single application by id (admin)
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await db.query('SELECT * FROM solo_parent_applications WHERE id = $1', [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, application: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update application status (admin)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes, rejectionReason, assignedIdNumber, soloParentIdNumber } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const assignedId = assignedIdNumber || soloParentIdNumber || null;

    const result = await db.query(
      `UPDATE solo_parent_applications
       SET application_status = $1,
           admin_notes = $2,
           rejection_reason = $3,
           approved_by = $4,
           solo_parent_id_number = COALESCE($5, solo_parent_id_number),
           assigned_id_number = COALESCE($5, assigned_id_number),
           updated_at = NOW()
       WHERE id::text = $6 OR reference_number = $6 RETURNING *`,
      [
        status,
        adminNotes || null,
        status === 'rejected' ? rejectionReason : null,
        status === 'approved' ? req.user?.id || null : null,
        status === 'approved' ? assignedId : null,
        applicationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Application status updated', application: result.rows[0] });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, message: 'Error updating application', error: error.message });
  }
};

// Cancel application (user)
exports.cancelApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const appResult = await db.query('SELECT * FROM solo_parent_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (appResult.rows[0].application_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be cancelled' });
    }

    await db.query(`UPDATE solo_parent_applications SET application_status = 'cancelled', updated_at = NOW() WHERE id = $1`, [applicationId]);

    res.status(200).json({ success: true, message: 'Application cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling application:', error);
    res.status(500).json({ success: false, message: 'Error cancelling application', error: error.message });
  }
};

// Check eligibility bago pumasok sa wizard
exports.checkEligibility = async (req, res) => {
  try {
    const { userId } = req.params;
    const { applicationType, qcid, email } = req.query;

    if (!applicationType) {
      return res.status(400).json({ success: false, message: 'applicationType is required' });
    }

    const cleanUserId = userId && userId !== 'undefined' && userId !== 'null' && userId !== '0' && userId !== '1' ? String(userId).trim() : null;
    const cleanQcid = qcid && String(qcid).trim() && !['110000116932100', '11000015952309', '110000572516915'].includes(String(qcid).trim()) ? String(qcid).trim() : null;
    const cleanEmail = email && String(email).trim() && String(email).trim().toLowerCase() !== 'resident@gmail.com' ? String(email).trim().toLowerCase() : null;

    // If no valid unique user identifier is provided (e.g. brand new unregistered/unauthenticated user), never block!
    if (!cleanUserId && !cleanQcid && !cleanEmail) {
      return res.status(200).json({ success: true, blocked: false, reason: null });
    }

    const params = [applicationType];
    const orClauses = [];

    if (cleanUserId) {
      params.push(cleanUserId);
      orClauses.push(`user_id = $${params.length}`);
    }
    if (cleanQcid) {
      params.push(cleanQcid);
      orClauses.push(`qcid_number = $${params.length}`);
    }
    if (cleanEmail) {
      params.push(cleanEmail);
      orClauses.push(`LOWER(email) = LOWER($${params.length})`);
    }

    const query = `
      SELECT * FROM solo_parent_applications
      WHERE (${orClauses.join(' OR ')})
      AND (
        application_type = $1
        OR ($1 = 'new' AND (application_type = 'new' OR application_type IS NULL))
        OR ($1 = 'renewal' AND application_type = 'renewal')
        OR ($1 = 'loss' AND (application_type = 'loss' OR application_type = 'replacement'))
      )
      ORDER BY created_at DESC LIMIT 1
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, blocked: false, reason: null });
    }

    const lastApp = result.rows[0];

    if (lastApp.application_status === 'pending') {
      return res.status(200).json({
        success: true,
        blocked: true,
        reason: 'pending',
        applicationId: lastApp.id,
        referenceNumber: lastApp.reference_number,
      });
    }

    if (lastApp.application_status === 'approved') {
      return res.status(200).json({
        success: true,
        blocked: true,
        reason: 'approved',
        referenceNumber: lastApp.reference_number,
      });
    }

    return res.status(200).json({ success: true, blocked: false, reason: null });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update application data (personal info, family members, atbp.)
exports.updateApplicationData = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { formData = {}, familyMembers = [] } = req.body || {};

    const parsedAge = formData.age ? parseInt(formData.age, 10) : null;
    const safeAge = isNaN(parsedAge) ? null : parsedAge;

    const soloParentIdNum = formData.soloParentIdNumber || formData.existingIdNumber || null;

    const result = await db.query(
      `UPDATE solo_parent_applications SET
        first_name = $1, middle_name = $2, last_name = $3, suffix = $4, age = $5, sex = $6,
        dob_month = $7, dob_day = $8, dob_year = $9, civil_status = $10, contact_no = $11,
        address_house_no = $12, address_street = $13, address_barangay = $14, address_city_municipality = $15,
        qcid_number = $16, email = $17,
        solo_parent_id_number = COALESCE($18, solo_parent_id_number),
        updated_at = NOW()
      WHERE id = $19 RETURNING id`,
      [
        formData.firstName || null, formData.middleName || null, formData.lastName || null, formData.suffix || null, safeAge, formData.sex || null,
        formData.dobMonth || null, formData.dobDay || null, formData.dobYear || null, formData.civilStatus || null, formData.contactNo || null,
        formData.addressHouseNo || null, formData.addressStreet || null, formData.addressBarangay || null, formData.addressCityMunicipality || null,
        formData.qcidNumber || null, formData.email || null,
        soloParentIdNum,
        applicationId,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, message: 'Application data updated' });
  } catch (error) {
    console.error('Error updating application data:', error);
    res.status(500).json({ success: false, message: 'Error updating application data', error: error.message });
  }
};

// Delete single application (admin)
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (applicationId === 'clear-all' || applicationId === 'clear') {
      await db.query('DELETE FROM solo_parent_applications');
      return res.status(200).json({ success: true, message: 'All Solo Parent applications cleared successfully' });
    }
    const cleanId = String(applicationId).replace(/^SP-/, '').trim();
    await db.query(
      'DELETE FROM solo_parent_applications WHERE id::text = $1 OR reference_number = $1 OR reference_number = $2 RETURNING id',
      [cleanId, applicationId]
    );
    res.status(200).json({ success: true, message: 'Solo Parent application deleted successfully' });
  } catch (error) {
    console.error('Error deleting solo parent application:', error);
    res.status(500).json({ success: false, message: 'Error deleting application', error: error.message });
  }
};

// Clear all solo parent applications (admin test cleanup)
exports.clearApplications = async (req, res) => {
  try {
    await db.query('DELETE FROM solo_parent_applications');
    res.status(200).json({ success: true, message: 'All Solo Parent applications cleared successfully' });
  } catch (error) {
    console.error('Error clearing solo parent applications:', error);
    res.status(500).json({ success: false, message: 'Error clearing applications', error: error.message });
  }
};

