const express = require('express');
const router = express.Router();
const pwdSeniorController = require('../controllers/pwdSeniorController');

router.get('/applications', pwdSeniorController.getAllApplications);
router.post('/applications', pwdSeniorController.createApplication);
router.patch('/applications/:id/status', pwdSeniorController.updateApplicationStatus);

module.exports = router;
