const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/analyze-eligibility', aiController.analyzeEligibility);

router.post('/assistant-chat', aiController.assistantChat);

router.get('/health', aiController.healthCheck);

module.exports = router;
