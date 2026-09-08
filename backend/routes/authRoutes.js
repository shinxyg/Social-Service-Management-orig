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

// GET /api/auth/profile & GET /api/users/profile
router.get('/profile', authController.getProfile);

// PUT /api/auth/profile & PUT /api/users/profile
router.put('/profile', authController.updateProfile);

module.exports = router;
