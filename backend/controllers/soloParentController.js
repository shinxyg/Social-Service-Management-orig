// controllers/soloParentController.js
const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

function generateReference(qcid) {
  if (qcid && String(qcid).trim()) return String(qcid).trim();
  return '110000116932100';
}

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

    const result = await db.query(
      `INSERT INTO solo_parent_applications (
        reference_number, user_id, application_status, application_type,
        is_resident, classification_id, classification_title, required_document_ids,
        solo_parent_id_number, is_id_verified,
        first_name, middle_name, last_name, suffix, age, sex,
        dob_month, dob_day, dob_year, civil_status, contact_no,
        address_house_no, address_street, address_barangay, address_city_municipality,
        qcid_number, email
      ) VALUES (
        $1, $2, 'draft', $3,
        $4, $5, $6, $7,
        $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26
      ) RETURNING id, reference_number`,
      [
        referenceNumber, userId, idStatus,
        isResident, selectedCategoryId, selectedCategory?.title || null, JSON.stringify(requiredDocumentIds || []),
        soloParentIdNum, Boolean(isIdVerified),
        formData.firstName || null, formData.middleName || null, formData.lastName || null, formData.suffix || null, safeAge, formData.sex || null,
        formData.dobMonth || null, formData.dobDay || null, formData.dobYear || null, formData.civilStatus || null, formData.contactNo || null,
        formData.addressHouseNo || null, formData.addressStreet || null, formData.addressBarangay || null, formData.addressCityMunicipality || null,
        formData.qcidNumber || null, formData.email || null,
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

    const result = await db.query(
      `SELECT id, reference_number, application_status, application_type, first_name, last_name,
              created_at, updated_at, rejection_reason, admin_notes
       FROM solo_parent_applications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
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
    const { status, adminNotes, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE solo_parent_applications
       SET application_status = $1, admin_notes = $2, rejection_reason = $3, approved_by = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [
        status,
        adminNotes || null,
        status === 'rejected' ? rejectionReason : null,
        status === 'approved' ? req.user?.id || null : null,
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
    const { applicationType } = req.query;

    if (!applicationType) {
      return res.status(400).json({ success: false, message: 'applicationType is required' });
    }

    const result = await db.query(
      `SELECT * FROM solo_parent_applications
       WHERE user_id = $1 AND application_type = $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, applicationType]
    );

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