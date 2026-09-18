
const express = require('express');
const router = express.Router();
const livelihoodController = require('../controllers/livelihoodController');
const upload = require('../middleware/fileUpload');

router.all('/applications/reset', livelihoodController.resetApplications);

router.post('/applications', livelihoodController.createApplication);
router.get('/applications', livelihoodController.getApplications);
router.get('/applications/:referenceNumber', livelihoodController.getApplicationByReference);
router.put('/applications/:id', livelihoodController.updateApplication);
router.patch('/applications/:id/status', livelihoodController.updateStatus);

router.post('/applications/:id/assistance', livelihoodController.saveAssistance);
router.put('/applications/:id/assistance', livelihoodController.saveAssistance);

router.post('/applications/:id/monitoring', livelihoodController.addMonitoringLog);

router.post('/upload-documents', upload.array('documents', 10), livelihoodController.uploadDocuments);

module.exports = router;
