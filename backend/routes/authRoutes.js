const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { sendOtpLimiter, loginRateLimiter } = require('../middleware/rateLimiter');
const botProtection = require('../middleware/botProtection');

router.post('/send-otp', sendOtpLimiter, botProtection, authController.sendOtp);

router.post('/verify-otp', botProtection, authController.verifyOtp);

router.post('/register', botProtection, authController.register);

router.post('/login', loginRateLimiter, authController.login);

router.get('/lockout-status', authController.getLockoutStatus);

router.post('/forgot-password', botProtection, authController.forgotPassword);

router.post('/reset-password', botProtection, authController.resetPassword);

router.post('/change-password', authController.changePassword);

router.post('/reactivate', authController.reactivateAccount);

router.get('/verify-session', authController.verifySession);
router.post('/verify-session', authController.verifySession);

router.get('/devices', authController.getUserDevices);
router.post('/devices/logout-others', authController.terminateAllOtherDevices);
router.delete('/devices/clear-history', authController.clearAllDeviceHistory);
router.post('/devices/clear-history', authController.clearAllDeviceHistory);
router.delete('/devices/:id', authController.removeDeviceSession);

router.all('/reset-test-citizen', authController.resetTestCitizenAccount);

router.get('/migrate-passwords', authController.migrateAllPasswords);
router.post('/migrate-passwords', authController.migrateAllPasswords);

router.get('/profile', authController.getProfile);

router.put('/profile', authController.updateProfile);

router.get('/', authController.getAllUsers);
router.get('/all', authController.getAllUsers);
router.get('/users', authController.getAllUsers);
router.get('/:id', authController.getUserById);
router.put('/:id', authController.updateUser);
router.patch('/:id/status', authController.toggleUserStatus);
router.post('/:id/toggle-status', authController.toggleUserStatus);
router.delete('/:id', authController.deleteUser);

module.exports = router;
