// @desc    Middleware to authorize based on roles
// @param   allowedRoles - Array of roles that are allowed to access the route
// @example authorizeRoles("government", "university")
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only users with roles: ${allowedRoles.join(', ')} can access this resource`
      });
    }

    next();
  };
};

export default authorizeRoles;
