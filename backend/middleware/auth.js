const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Check for token in multiple header formats
  let token = req.header('x-auth-token');
  
  // Also check Authorization header (Bearer token)
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shef_lms_secret_key_2025');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
