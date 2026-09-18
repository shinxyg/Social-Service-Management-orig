const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');

router.get('/deleted', activityLogController.getDeletedActivityLog);
router.get('/', activityLogController.getActivityLog);
router.post('/', activityLogController.createActivityLog);

router.patch('/:id/soft-delete', activityLogController.softDeleteActivity);
router.patch('/:id/restore', activityLogController.restoreActivity);
router.delete('/:id', activityLogController.permanentlyDeleteActivity);

module.exports = router;