const rateLimit = require('express-rate-limit');
const db = require('../config/db');

// In-memory store fallback for progressive failed login attempts: key -> { count, lockedUntil, firstAttempt }
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
 * Checks PostgreSQL database first, falls back to in-memory store.
 */
async function checkLoginLockout(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  const key = `${ip}_${cleanEmail || 'unknown'}`;
  const now = Date.now();

  // 1. Check in PostgreSQL Database
  try {
    const dbRes = await db.query(
      `SELECT attempt_count, locked_until, first_attempt 
       FROM login_attempts 
       WHERE ip_address = $1 AND email = $2 
       LIMIT 1`,
      [ip, cleanEmail]
    );

    if (dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      if (row.locked_until) {
        const lockTime = new Date(row.locked_until).getTime();
        if (lockTime > now) {
          const remainingSeconds = Math.ceil((lockTime - now) / 1000);
          const minutes = Math.ceil(remainingSeconds / 60);
          return {
            isLocked: true,
            remainingSeconds,
            minutes,
            message: row.attempt_count >= 5
              ? `Too many failed login attempts (5/5). Your login is locked for ${minutes} minute${minutes > 1 ? 's' : ''}. Please wait ${remainingSeconds}s before trying again.`
              : `Too many failed login attempts (3/3). Please wait ${remainingSeconds}s before trying again.`,
          };
        }
      }
    }
  } catch (err) {
    // Database check fallback silently to memory store
  }

  // 2. Check in-memory store fallback
  const record = loginAttempts.get(key);
  if (record) {
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

    if (record.lockedUntil && now >= record.lockedUntil) {
      record.lockedUntil = null;
      if (now - record.firstAttempt > 15 * 60 * 1000) {
        loginAttempts.delete(key);
      }
    }
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt and apply progressive lockout rules to Database & Memory
 */
async function recordFailedLogin(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  const key = `${ip}_${cleanEmail || 'unknown'}`;
  const now = Date.now();

  let count = 1;
  let lockedUntil = null;

  // In-Memory store update
  let record = loginAttempts.get(key);
  if (!record || (now - record.firstAttempt > 15 * 60 * 1000)) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000;
  } else if (record.count >= 3) {
    record.lockedUntil = now + 1 * 60 * 1000;
  }
  loginAttempts.set(key, record);
  count = record.count;
  lockedUntil = record.lockedUntil ? new Date(record.lockedUntil) : null;

  // PostgreSQL Database update
  try {
    const existing = await db.query(
      `SELECT id, attempt_count, first_attempt FROM login_attempts WHERE ip_address = $1 AND email = $2 LIMIT 1`,
      [ip, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const dbRow = existing.rows[0];
      const firstTime = new Date(dbRow.first_attempt).getTime();
      const isWindowExpired = (now - firstTime > 15 * 60 * 1000);

      count = isWindowExpired ? 1 : dbRow.attempt_count + 1;
      let dbLockUntil = null;
      if (count >= 5) {
        dbLockUntil = new Date(now + 5 * 60 * 1000);
      } else if (count >= 3) {
        dbLockUntil = new Date(now + 1 * 60 * 1000);
      }

      await db.query(
        `UPDATE login_attempts 
         SET attempt_count = $1, last_attempt = NOW(), locked_until = $2 
         WHERE id = $3`,
        [count, dbLockUntil, dbRow.id]
      );
    } else {
      let dbLockUntil = null;
      if (count >= 5) {
        dbLockUntil = new Date(now + 5 * 60 * 1000);
      } else if (count >= 3) {
        dbLockUntil = new Date(now + 1 * 60 * 1000);
      }

      await db.query(
        `INSERT INTO login_attempts 
         (ip_address, email, attempt_count, first_attempt, last_attempt, locked_until, created_at)
         VALUES ($1, $2, $3, NOW(), NOW(), $4, NOW())`,
        [ip, cleanEmail, count, dbLockUntil]
      );
    }

    // Also update users table if user exists
    if (cleanEmail) {
      await db.query(
        `UPDATE users 
         SET failed_login_attempts = $1, locked_until = $2 
         WHERE LOWER(email) = $3`,
        [count, lockedUntil, cleanEmail]
      ).catch(() => {});
    }
  } catch (err) {
    console.warn('[DB Warning] Failed to update login_attempts table in DB:', err.message);
  }

  return { count, lockedUntil };
}

/**
 * Clear failed login attempts upon successful authentication from Database & Memory
 */
async function clearFailedLogins(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  const key = `${ip}_${cleanEmail || 'unknown'}`;

  loginAttempts.delete(key);

  try {
    await db.query(
      `DELETE FROM login_attempts WHERE ip_address = $1 AND email = $2`,
      [ip, cleanEmail]
    );
    if (cleanEmail) {
      await db.query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE LOWER(email) = $1`,
        [cleanEmail]
      ).catch(() => {});
    }
  } catch (err) {
    console.warn('[DB Warning] Failed to clear login_attempts from DB:', err.message);
  }
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
