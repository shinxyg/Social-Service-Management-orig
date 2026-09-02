// routes/childWelfareRoutes.js
const express = require('express');
const router = express.Router();
const childWelfareController = require('../controllers/childWelfareController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const uploadFiles = require('../middleware/fileUpload');

router.post('/create', auth, childWelfareController.createApplication);

router.post(
  '/:applicationId/upload-documents',
  auth,
  uploadFiles.array('documents', 10),
  childWelfareController.uploadDocuments
);

router.delete(
  '/:applicationId/remove-document/:documentId/:filename',
  auth,
  childWelfareController.removeDocument
);

router.post('/:applicationId/submit', auth, childWelfareController.submitApplication);

router.get('/user/:userId', auth, childWelfareController.getUserApplications);

router.get('/reference/:referenceNumber', childWelfareController.getApplicationByReference);

router.post('/:applicationId/cancel', auth, childWelfareController.cancelApplication);

// Admin routes
router.get('/admin/all', auth, adminAuth, childWelfareController.getAllApplications);
router.get('/admin/:applicationId', auth, adminAuth, childWelfareController.getApplicationById);
router.patch('/:applicationId/admin/update-status', auth, adminAuth, childWelfareController.updateApplicationStatus);

module.exports = router;