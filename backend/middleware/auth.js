const { verifyToken } = require('../config/jwt');

/**
 * Middleware to authenticate requests via JWT Bearer token
 * Checks Authorization header: `Bearer <token>` or `x-access-token` header
 */
module.exports = function authMiddleware(req, res, next) {
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
      message: 'Authentication required. No token provided.',
      code: 'AUTH_NO_TOKEN',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
      code: 'AUTH_INVALID_TOKEN',
    });
  }

  // Attach decoded user info to the request object
  req.user = decoded;
  next();
};