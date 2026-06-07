const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Production-grade Authentication Middleware
 * Verifies JWT and injects user & tenant context into request
 */
async function authMiddleware(req, res, next) {
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
    
    // Check single active session against DB
    if (decoded.jti) {
      const result = await pool.query('SELECT current_session_token FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0 || result.rows[0].current_session_token !== decoded.jti) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Session invalidated. Logged in from another device.' 
        });
      }
    }

    // Inject full context
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenant_id
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      let message = 'Session expired or invalid. Please log in again.';
      if (err.name === 'TokenExpiredError') message = 'Session expired. Please log in again.';
      
      return res.status(401).json({ 
        status: 'error',
        message 
      });
    }

    // It's a DB error or other unexpected error
    console.error('Auth Middleware Database Error:', err);
    return res.status(500).json({ 
      status: 'error',
      message: 'Internal server error during authentication.' 
    });
  }
}

module.exports = authMiddleware;
