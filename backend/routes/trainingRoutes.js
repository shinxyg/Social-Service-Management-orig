
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');

router.get('/programs', trainingController.getAvailablePrograms);

router.get('/applications', trainingController.getApplications);
router.post('/apply', trainingController.applyForTraining);
router.patch('/applications/:id/status', trainingController.updateApplicationStatus);
router.delete('/applications/:id', trainingController.deleteApplication);

router.all('/reset', trainingController.resetApplications);

module.exports = router;
