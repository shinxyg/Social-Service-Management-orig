const express = require('express');
const router = express.Router();
const userApplicationController = require('../controllers/userApplicationController');

router.get('/deleted', userApplicationController.getDeletedApplications);

router.post('/delete', userApplicationController.archiveApplication);
router.post('/archive', userApplicationController.archiveApplication);

router.post('/restore', userApplicationController.restoreApplication);

router.post('/permanent-delete', userApplicationController.permanentDeleteApplication);

router.delete('/:id', userApplicationController.archiveApplication);
router.delete('/:category/:id', userApplicationController.archiveApplication);

module.exports = router;
