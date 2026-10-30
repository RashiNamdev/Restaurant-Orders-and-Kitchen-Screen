const AppError = require('../utils/appError');

/**
 * Middleware to enforce role-based access control (RBAC).
 * Reads credentials from:
 * 1. 'x-user-role' or 'x-role' header
 * 2. 'Authorization' header (e.g. "Bearer admin" or "Bearer <role>")
 * 3. Query parameter 'role' (useful for dev/testing)
 * 
 * @param {string[]} allowedRoles Array of roles permitted to access the route
 */
const requireRole = (allowedRoles = ['admin']) => {
  return (req, res, next) => {
    // 1. Extract role from header, authorization bearer, or query
    let userRole = req.headers['x-user-role'] || req.headers['x-role'];

    if (!userRole && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        userRole = authHeader.substring(7).trim();
      } else {
        userRole = authHeader.trim();
      }
    }

    if (!userRole && req.query.role) {
      userRole = req.query.role;
    }

    // 2. Reject with 401 if completely unauthenticated
    if (!userRole) {
      return next(
        new AppError(
          'Authentication required: Missing x-user-role header. Please provide valid credentials via x-user-role or Authorization header.',
          401
        )
      );
    }

    const normalizedUserRole = String(userRole).toLowerCase().trim();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase().trim());

    // 3. Reject with 403 if role is not authorized
    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return next(
        new AppError(
          `Forbidden: Role "${normalizedUserRole}" is not authorized to perform this action. Required roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    req.userRole = normalizedUserRole;
    next();
  };
};

/**
 * Shorthand middleware for admin-only mutation routes
 */
const requireAdmin = requireRole(['admin']);

module.exports = {
  requireRole,
  requireAdmin,
};
