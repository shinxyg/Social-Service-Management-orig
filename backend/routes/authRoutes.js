const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/change-password
router.post('/change-password', authController.changePassword);

// POST /api/auth/reactivate
router.post('/reactivate', authController.reactivateAccount);



// GET /api/auth/migrate-passwords
router.get('/migrate-passwords', authController.migrateAllPasswords);
router.post('/migrate-passwords', authController.migrateAllPasswords);

// GET /api/auth/profile & GET /api/users/profile
router.get('/profile', authController.getProfile);

// PUT /api/auth/profile & PUT /api/users/profile
router.put('/profile', authController.updateProfile);

// Admin User Management routes (/api/users and /api/auth/users)
router.get('/', authController.getAllUsers);
router.get('/all', authController.getAllUsers);
router.get('/users', authController.getAllUsers);
router.get('/:id', authController.getUserById);
router.put('/:id', authController.updateUser);
router.patch('/:id/status', authController.toggleUserStatus);
router.post('/:id/toggle-status', authController.toggleUserStatus);
router.delete('/:id', authController.deleteUser);

module.exports = router;
