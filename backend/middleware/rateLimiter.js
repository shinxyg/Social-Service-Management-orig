const rateLimit = require('express-rate-limit');
const db = require('../config/db');

// In-memory store fallback for failed login attempts: key -> { count, lockedUntil, firstAttempt }
const loginAttempts = new Map();

// Helper to get client IP cleanly
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || '127.0.0.1');
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
}

/**
 * Check if the user/IP is currently locked out from logging in due to 3 failed attempts
 * Maximum: 3 attempts -> 1 minute (60s) lockout
 * Covers both IP device protection and targeted email protection.
 */
async function checkLoginLockout(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  const now = Date.now();

  // 1. Check in PostgreSQL Database by IP or Email
  try {
    const dbRes = await db.query(
      `SELECT id, attempt_count, locked_until, first_attempt 
       FROM login_attempts 
       WHERE ip_address = $1 OR ($2 != '' AND email = $2)
       ORDER BY attempt_count DESC 
       LIMIT 1`,
      [ip, cleanEmail]
    );

    if (dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      if (row.locked_until) {
        const lockTime = new Date(row.locked_until).getTime();
        if (lockTime > now) {
          const remainingSeconds = Math.ceil((lockTime - now) / 1000);
          return {
            isLocked: true,
            remainingSeconds,
            message: `Too many failed login attempts (3/3). Your login is locked for ${remainingSeconds}s for security.`,
          };
        } else {
          // Lockout duration expired -> clean up so they start fresh with 3 attempts
          await db.query(`DELETE FROM login_attempts WHERE id = $1`, [row.id]).catch(() => {});
          loginAttempts.delete(ip);
          if (cleanEmail) loginAttempts.delete(cleanEmail);
        }
      }
    }
  } catch (err) {
    // Database check fallback silently to memory store
  }

  // 2. Check in-memory store fallback
  const memRecord = loginAttempts.get(ip) || (cleanEmail ? loginAttempts.get(cleanEmail) : null);
  if (memRecord) {
    if (memRecord.lockedUntil && now < memRecord.lockedUntil) {
      const remainingSeconds = Math.ceil((memRecord.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        message: `Too many failed login attempts (3/3). Your login is locked for ${remainingSeconds}s for security.`,
      };
    }

    if (memRecord.lockedUntil && now >= memRecord.lockedUntil) {
      loginAttempts.delete(ip);
      if (cleanEmail) loginAttempts.delete(cleanEmail);
    }
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt for any wrong password OR non-existent account
 * - Attempt 1 & 2: Increments counter and returns remaining attempts
 * - Attempt 3: Locks for 1 minute (60s)
 */
async function recordFailedLogin(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();
  const now = Date.now();

  let count = 1;
  let lockedUntil = null;

  // PostgreSQL Database update
  try {
    const existing = await db.query(
      `SELECT id, attempt_count, first_attempt, locked_until 
       FROM login_attempts 
       WHERE ip_address = $1 OR ($2 != '' AND email = $2)
       ORDER BY id DESC 
       LIMIT 1`,
      [ip, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const dbRow = existing.rows[0];
      const lockTime = dbRow.locked_until ? new Date(dbRow.locked_until).getTime() : 0;
      const isLockExpired = lockTime > 0 && now >= lockTime;

      count = isLockExpired ? 1 : dbRow.attempt_count + 1;
      let dbLockUntil = null;
      if (count >= 3) {
        dbLockUntil = new Date(now + 1 * 60 * 1000); // 1 minute lockout
      }

      await db.query(
        `UPDATE login_attempts 
         SET attempt_count = $1, email = $2, ip_address = $3, last_attempt = NOW(), locked_until = $4 
         WHERE id = $5`,
        [count, cleanEmail || dbRow.email || 'unknown', ip, dbLockUntil, dbRow.id]
      );
      lockedUntil = dbLockUntil;
    } else {
      let dbLockUntil = null;
      if (count >= 3) {
        dbLockUntil = new Date(now + 1 * 60 * 1000);
      }

      await db.query(
        `INSERT INTO login_attempts 
         (ip_address, email, attempt_count, first_attempt, last_attempt, locked_until, created_at)
         VALUES ($1, $2, $3, NOW(), NOW(), $4, NOW())`,
        [ip, cleanEmail || 'unknown', count, dbLockUntil]
      );
      lockedUntil = dbLockUntil;
    }

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

  // Memory store update
  let record = loginAttempts.get(ip) || (cleanEmail ? loginAttempts.get(cleanEmail) : null);
  if (!record || (record.lockedUntil && now >= record.lockedUntil)) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= 3) {
    record.lockedUntil = now + 1 * 60 * 1000;
  }

  loginAttempts.set(ip, record);
  if (cleanEmail) loginAttempts.set(cleanEmail, record);

  count = record.count;
  lockedUntil = record.lockedUntil ? new Date(record.lockedUntil) : null;

  return { count, lockedUntil };
}

/**
 * Clear failed login attempts upon successful authentication
 */
async function clearFailedLogins(req, email) {
  const ip = getClientIp(req);
  const cleanEmail = (email || '').trim().toLowerCase();

  loginAttempts.delete(ip);
  if (cleanEmail) loginAttempts.delete(cleanEmail);

  try {
    await db.query(
      `DELETE FROM login_attempts WHERE ip_address = $1 OR ($2 != '' AND email = $2)`,
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
      message: 'Too many login requests from this device. Please wait a few minutes before trying again.',
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
