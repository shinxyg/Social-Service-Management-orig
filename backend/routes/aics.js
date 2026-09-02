const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const aicsController = require('../controllers/aicsController');

router.post('/applications', (req, res, next) => {
  upload.array('documents', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'May error sa pag-upload ng file.' });
    }
    next();
  });
}, aicsController.createApplication);
router.get('/applications', aicsController.getApplications);
router.get('/applications/check-duplicate', aicsController.checkDuplicatePerson); 
router.get('/applications/:referenceNo', aicsController.getApplicationByReference);
router.get('/documents/:id/file', aicsController.getDocumentFile);
router.patch('/applications/:id/status', aicsController.updateApplicationStatus);

module.exports = router;