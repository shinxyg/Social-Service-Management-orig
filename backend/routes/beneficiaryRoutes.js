const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controllers/beneficiaryController');

router.get('/run-consolidation-migration', beneficiaryController.runConsolidationMigration);

router.get('/', beneficiaryController.getAllBeneficiaries);

router.get('/:id', beneficiaryController.getBeneficiaryById);

router.put('/:id/verify', beneficiaryController.verifyBeneficiary);

router.post('/:id/history', beneficiaryController.addBeneficiaryHistory);

router.delete('/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;

