const rateLimit = require('express-rate-limit');

// In-memory store for progressive failed login attempts: key -> { count, lockedUntil, firstAttempt }
const loginAttempts = new Map();

// Helper to get client IP cleanly
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || '127.0.0.1');
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
}

// Generate key based on IP and lowercase email
function getLoginKey(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  return `${ip}_${cleanEmail || 'unknown'}`;
}

/**
 * Check if the user/IP is currently locked out from logging in due to failed attempts
 * Tier 1: 3 failed attempts -> 1 minute (60s) cooldown
 * Tier 2: 5 failed attempts -> 5 minutes (300s) lockout
 */
function checkLoginLockout(req, email) {
  const key = getLoginKey(req, email);
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const minutes = Math.ceil(remainingSeconds / 60);
    return {
      isLocked: true,
      remainingSeconds,
      minutes,
      message: record.count >= 5
        ? `Too many failed login attempts (5/5). Your login is locked for ${minutes} minute${minutes > 1 ? 's' : ''}. Please wait ${remainingSeconds}s before trying again.`
        : `Too many failed login attempts (3/3). Please wait ${remainingSeconds}s before trying again.`,
    };
  }

  // If lockout duration has elapsed, remove lock
  if (record.lockedUntil && now >= record.lockedUntil) {
    record.lockedUntil = null;
    // Reset if window passed (15 mins)
    if (now - record.firstAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt and apply progressive lockout rules
 */
function recordFailedLogin(req, email) {
  const key = getLoginKey(req, email);
  const now = Date.now();
  let record = loginAttempts.get(key);

  if (!record || (now - record.firstAttempt > 15 * 60 * 1000)) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  // Progressive Lockout thresholds:
  // >= 5 attempts -> 5 minutes (300,000 ms) lock
  // >= 3 attempts -> 1 minute (60,000 ms) lock
  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000;
  } else if (record.count >= 3) {
    record.lockedUntil = now + 1 * 60 * 1000;
  }

  loginAttempts.set(key, record);
  return record;
}

/**
 * Clear failed login attempts upon successful authentication
 */
function clearFailedLogins(req, email) {
  const key = getLoginKey(req, email);
  loginAttempts.delete(key);
}

/**
 * Express Rate Limit Middleware for /api/auth/send-otp
 * Maximum 3 requests per 5 minutes per IP/Email
 */
const sendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per 5-minute window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = (req.body?.email || req.query?.email || '').trim().toLowerCase();
    return `${ip}_${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      isRateLimited: true,
      retryAfterMinutes: 5,
      message: 'Too many OTP requests. Maximum 3 requests allowed per 5 minutes. Please wait a few minutes before trying again.',
    });
  },
});

/**
 * Express Rate Limit Middleware for /api/auth/login
 * Standard burst protection: Maximum 10 total requests per 5 minutes
 */
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 total HTTP attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const email = (req.body?.email || '').trim().toLowerCase();
    return `${ip}_${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      isRateLimited: true,
      message: 'Too many login requests from this device. Please wait 5 minutes before trying again.',
    });
  },
});

module.exports = {
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogins,
  sendOtpLimiter,
  loginRateLimiter,
};
