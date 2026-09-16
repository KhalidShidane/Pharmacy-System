const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');

function protect(req, _res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return next(new ApiError(401, 'Not authenticated'));
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // { id, name, email, role, permissions }
    next();
  } catch (err) {
    next(new ApiError(401, 'Session expired or invalid, please log in again'));
  }
}

function authorize(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    const has = requiredPermissions.every((p) => req.user.permissions?.includes(p));
    if (!has) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { protect, authorize };
