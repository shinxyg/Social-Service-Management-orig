const express = require('express');
const router = express.Router();
const userApplicationController = require('../controllers/userApplicationController');

router.post('/archive', userApplicationController.archiveApplication);
router.delete('/:id', userApplicationController.archiveApplication);
router.delete('/:category/:id', userApplicationController.archiveApplication);

module.exports = router;
