const jwt = require('jsonwebtoken');

/**
 * Production-grade Authentication Middleware
 * Verifies JWT and injects user & tenant context into request
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Authentication required. Please provide a valid token.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inject full context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenant_id
    };

    next();
  } catch (err) {
    let message = 'Session expired or invalid. Please log in again.';
    if (err.name === 'TokenExpiredError') message = 'Session expired. Please log in again.';
    
    return res.status(401).json({ 
      status: 'error',
      message 
    });
  }
}

module.exports = authMiddleware;
