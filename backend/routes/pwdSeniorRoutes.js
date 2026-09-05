const express = require('express');
const router = express.Router();
const pwdSeniorController = require('../controllers/pwdSeniorController');

router.get('/applications', pwdSeniorController.getAllApplications);
router.post('/applications', pwdSeniorController.createApplication);
router.patch('/applications/:id/status', pwdSeniorController.updateApplicationStatus);
router.delete('/applications/clear-senior', pwdSeniorController.clearSeniorApplications);
router.delete('/applications/:id', pwdSeniorController.deleteApplication);

module.exports = router;

