const { verifyToken } = require('../config/jwt');
const db = require('../config/db');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'];
    } else if (req.query && (req.query.token || req.query.sessionToken)) {
      token = req.query.token || req.query.sessionToken;
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
        return next();
      }

      try {
        const sessionRes = await db.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.role
           FROM user_login_sessions s
           JOIN users u ON LOWER(u.email) = LOWER(s.email)
           WHERE s.session_token = $1 AND s.is_active = true`,
          [token]
        );
        if (sessionRes.rows.length > 0) {
          req.user = sessionRes.rows[0];
          return next();
        }
      } catch {}

      try {
        const sessionRes = await db.query(
          'SELECT id, email, first_name, last_name, role FROM users WHERE active_session_token = $1',
          [token]
        );
        if (sessionRes.rows.length > 0) {
          req.user = sessionRes.rows[0];
          return next();
        }
      } catch {}
    }

    const queryEmail = (req.query && req.query.email ? String(req.query.email).trim().toLowerCase() : null) ||
                       (req.headers['x-user-email'] ? String(req.headers['x-user-email']).trim().toLowerCase() : null);

    if (req.method === 'GET' && queryEmail) {
      try {
        const userRes = await db.query(
          'SELECT id, email, first_name, last_name, role FROM users WHERE LOWER(email) = $1',
          [queryEmail]
        );
        if (userRes.rows.length > 0) {
          req.user = userRes.rows[0];
          return next();
        }
      } catch {}
    }

    if (req.method !== 'GET') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in again.',
        code: 'AUTH_REQUIRED',
      });
    }

    req.user = req.user || { role: 'guest' };
    next();
  } catch (err) {
    console.error('Error in authMiddleware:', err);
    next();
  }
};