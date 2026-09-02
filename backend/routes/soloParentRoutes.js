// routes/soloParentRoutes.js
const express = require('express');
const router = express.Router();
const soloParentController = require('../controllers/soloParentController');
const auth = require('../middleware/auth'); // Authentication middleware
const adminAuth = require('../middleware/adminAuth'); // Admin authentication
const uploadFiles = require('../middleware/fileUpload'); // Multer config

// User routes
router.post(
  '/create',
  auth,
  soloParentController.createApplication
);

router.post(
  '/:applicationId/upload-documents',
  auth,
  uploadFiles.array('documents', 10),
  soloParentController.uploadDocuments
);

router.delete(
  '/:applicationId/remove-document/:documentId/:filename',
  auth,
  soloParentController.removeDocument
);

router.post(
  '/:applicationId/submit',
  auth,
  soloParentController.submitApplication
);

router.get(
  '/admin/all',
  auth,
  adminAuth,
  soloParentController.getAllApplications
);

router.get(
  '/eligibility/:userId',
  auth,
  soloParentController.checkEligibility
);

router.patch(
  '/:applicationId/update',
  auth,
  soloParentController.updateApplicationData
);

router.get(
  '/user/:userId',
  auth,
  soloParentController.getUserApplications
);

router.get(
  '/reference/:referenceNumber',
  soloParentController.getApplicationByReference
);

router.post(
  '/:applicationId/cancel',
  auth,
  soloParentController.cancelApplication
);

router.get(
  '/admin/:applicationId',
  auth,
  adminAuth,
  soloParentController.getApplicationById
);

router.patch(
  '/:applicationId/admin/update-status',
  auth,
  adminAuth,
  soloParentController.updateApplicationStatus
);

module.exports = router;