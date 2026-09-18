
const express = require('express');
const router = express.Router();
const caseManagementController = require('../controllers/caseManagementController');

router.get('/cases', caseManagementController.getAllCases);

router.put('/case/:caseNumber/status', caseManagementController.updateCaseStatus);

router.post('/case/:caseNumber/referral', caseManagementController.addReferral);

router.post('/case/:caseNumber/monitoring', caseManagementController.addMonitoring);

module.exports = router;
