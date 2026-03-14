/**
 * @module authMiddleware
 * @description JWT authentication middleware for protected routes
 */
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return sendError(res, 401, 'Unauthorized', 'Authentication token is missing');
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    req.user = { id: decoded.userId };
    return next();
  } catch (error) {
    return sendError(res, 401, 'Unauthorized', 'Invalid or expired token');
  }
};

module.exports = { protect };
