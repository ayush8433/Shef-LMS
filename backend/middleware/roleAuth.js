const jwt = require('jsonwebtoken');

// Middleware to check user role and permissions
const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                    req.header('x-auth-token');

      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }

      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'shef_lms_secret_key_2025'
      );

      req.user = decoded.user;

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          requiredRole: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    } catch (err) {
      console.error('Role auth error:', err.message);
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

// Specific role checkers
const isAdmin = roleAuth('admin');
const isTeacher = roleAuth('teacher', 'admin');
const isStudent = roleAuth('student', 'teacher', 'admin');

module.exports = {
  roleAuth,
  isAdmin,
  isTeacher,
  isStudent
};
