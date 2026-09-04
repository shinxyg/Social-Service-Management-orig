// controllers/childWelfareController.js
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
    const { isResident, selectedCategoryId, selectedCategory, formData = {} } = applicationData || {};

    // Existing draft/pending check
    const existing = await db.query(
      `SELECT * FROM child_welfare_applications
       WHERE user_id = $1 AND application_status IN ('draft', 'pending')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      const app = existing.rows[0];
      return res.status(200).json({
        success: true,
        message: 'Resuming existing draft application',
        referenceNumber: app.reference_number,
        applicationId: app.id,
      });
    }

    const referenceNumber = req.body.referenceNumber || req.body.reference_number || (formData && (formData.qcidNumber || formData.qcidNo || formData.qcId)) || generateReference();

    const result = await db.query(
      `INSERT INTO child_welfare_applications (
        reference_number, user_id, application_status, category_id, category_title, required_document_ids,
        guardian_first_name, guardian_middle_name, guardian_last_name, guardian_sex, guardian_date_of_birth,
        guardian_age, guardian_civil_status, guardian_relationship_to_child, guardian_contact_no,
        guardian_email, guardian_valid_id,
        address_house_no, address_street, address_barangay, address_city_municipality,
        child_name, child_sex, child_birthday, child_age, child_school_daycare, child_birth_certificate,
        child_grade_level, child_school_address, child_enrollment_status, child_special_needs, child_special_needs_specify,
        household_members, children_studying, monthly_household_income, main_source_income,
        employment_status, other_financial_support,
        support_types, support_other,
        primary_reason_for_assistance, specific_needs, estimated_amount_needed, urgency,
        child_living_arrangement, other_children_needing_assistance, other_children_count,
        other_govt_assistance_received, other_govt_program, additional_info
      ) VALUES (
        $1, $2, 'draft', $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16,
        $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31,
        $32, $33, $34, $35,
        $36, $37,
        $38, $39,
        $40, $41, $42, $43,
        $44, $45, $46,
        $47, $48, $49
      ) RETURNING id, reference_number`,
      [
        referenceNumber, userId, selectedCategoryId, selectedCategory?.title || null, JSON.stringify(requiredDocumentIds || []),
        formData.guardianFirstName || null, formData.guardianMiddleName || null, formData.guardianLastName || null, formData.guardianSex || null, formData.guardianDateOfBirth || null,
        formData.guardianAge || null, formData.guardianCivilStatus || null, formData.guardianRelationshipToChild || null, formData.guardianContactNo || null,
        formData.guardianEmail || null, formData.guardianValidId || null,
        formData.addressHouseNo || null, formData.addressStreet || null, formData.addressBarangay || null, formData.addressCityMunicipality || null,
        formData.childName || null, formData.childSex || null, formData.childBirthday || null, formData.childAge || null, formData.childSchoolDaycare || null, formData.childBirthCertificate || null,
        formData.childGradeLevel || null, formData.childSchoolAddress || null, formData.childEnrollmentStatus || null, formData.childSpecialNeeds || null, formData.childSpecialNeedsSpecify || null,
        formData.householdMembers || null, formData.childrenStudying || null, formData.monthlyHouseholdIncome || null, formData.mainSourceIncome || null,
        formData.employmentStatus || null, formData.otherFinancialSupport || null,
        JSON.stringify(formData.supportTypes || []), formData.supportOther || null,
        formData.primaryReasonForAssistance || null, formData.specificNeeds || null, formData.estimatedAmountNeeded || null, formData.urgency || null,
        formData.childLivingArrangement || null, formData.otherChildrenNeedingAssistance || null, formData.otherChildrenCount || null,
        formData.otherGovtAssistanceReceived || null, formData.otherGovtProgram || null, formData.additionalInfo || null,
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
    console.error('Error creating child welfare application:', error);
    res.status(500).json({ success: false, message: 'Error creating application', error: error.message });
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

    const appResult = await db.query('SELECT uploaded_documents FROM child_welfare_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      fileUrl: `/uploads/child-welfare/${file.filename}`,
      fileSize: file.size,
      uploadedAt: new Date(),
    }));

    let uploadedDocuments = appResult.rows[0].uploaded_documents || [];
    const existingDocIndex = uploadedDocuments.findIndex((doc) => doc.documentId === documentId);

    if (existingDocIndex > -1) {
      uploadedDocuments[existingDocIndex].files.push(...uploadedFiles);
    } else {
      uploadedDocuments.push({ documentId, documentLabel, files: uploadedFiles });
    }

    await db.query(
      'UPDATE child_welfare_applications SET uploaded_documents = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(uploadedDocuments), applicationId]
    );

    res.status(200).json({ success: true, message: 'Documents uploaded successfully', files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, message: 'Error uploading documents', error: error.message });
  }
};

// Remove document
exports.removeDocument = async (req, res) => {
  try {
    const { applicationId, documentId, filename } = req.params;

    const appResult = await db.query('SELECT uploaded_documents FROM child_welfare_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let uploadedDocuments = appResult.rows[0].uploaded_documents || [];
    const documentIndex = uploadedDocuments.findIndex((doc) => doc.documentId === documentId);

    if (documentIndex > -1) {
      const fileIndex = uploadedDocuments[documentIndex].files.findIndex((file) => file.filename === filename);

      if (fileIndex > -1) {
        try {
          const filePath = path.join(__dirname, '../uploads/child-welfare', filename);
          await fs.unlink(filePath);
        } catch (err) {
          console.warn('Could not delete physical file:', err);
        }

        uploadedDocuments[documentIndex].files.splice(fileIndex, 1);
        if (uploadedDocuments[documentIndex].files.length === 0) {
          uploadedDocuments.splice(documentIndex, 1);
        }

        await db.query(
          'UPDATE child_welfare_applications SET uploaded_documents = $1, updated_at = NOW() WHERE id = $2',
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

    const appResult = await db.query('SELECT * FROM child_welfare_applications WHERE id = $1', [applicationId]);
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
      `UPDATE child_welfare_applications SET application_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    res.status(200).json({ success: true, message: 'Application submitted successfully', referenceNumber: application.reference_number });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Error submitting application', error: error.message });
  }
};

// Get by reference number
exports.getApplicationByReference = async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const result = await db.query('SELECT * FROM child_welfare_applications WHERE reference_number = $1', [referenceNumber]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, application: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all applications by user
exports.getUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
    `SELECT id, reference_number, application_status, category_title, child_name, created_at, updated_at
    FROM child_welfare_applications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
    );
    res.status(200).json({ success: true, applications: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all applications (admin)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM child_welfare_applications';
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE application_status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    const countParams = status ? [status] : [];
    const countQuery = status
      ? 'SELECT COUNT(*) FROM child_welfare_applications WHERE application_status = $1'
      : 'SELECT COUNT(*) FROM child_welfare_applications';
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      success: true,
      applications: result.rows,
      pagination: { total, page: parseInt(page, 10), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single application by id (admin)
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await db.query('SELECT * FROM child_welfare_applications WHERE id = $1', [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.status(200).json({ success: true, application: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update application status (admin) — may approved_amount para dito
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes, rejectionReason, approvedAmount } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE child_welfare_applications
       SET application_status = $1, admin_notes = $2, rejection_reason = $3,
           approved_by = $4, approved_amount = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        status,
        adminNotes || null,
        status === 'rejected' ? rejectionReason : null,
        status === 'approved' ? req.user?.id || null : null,
        status === 'approved' ? approvedAmount || null : null,
        applicationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Application status updated', application: result.rows[0] });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel application (user)
exports.cancelApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const appResult = await db.query('SELECT * FROM child_welfare_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (appResult.rows[0].application_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be cancelled' });
    }
    await db.query(`UPDATE child_welfare_applications SET application_status = 'cancelled', updated_at = NOW() WHERE id = $1`, [applicationId]);
    res.status(200).json({ success: true, message: 'Application cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};