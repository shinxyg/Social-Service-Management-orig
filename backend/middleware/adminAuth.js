const { verifyToken } = require('../config/jwt');

/**
 * Middleware to authenticate requests and verify that user has Admin privileges
 */
module.exports = function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required. No token provided.',
      code: 'AUTH_NO_TOKEN',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token. Please log in again.',
      code: 'AUTH_INVALID_TOKEN',
    });
  }

  const role = (decoded.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'staff' || role === 'worker';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have sufficient administrative permissions.',
      code: 'AUTH_FORBIDDEN',
    });
  }

  req.user = decoded;
  next();
};