const pool = require('../db/pool');

/**
 * Middleware to detect tenant from subdomain or header
 * Attach to req.tenant
 */
async function tenantMiddleware(req, res, next) {
  // Allow explicit header for easy dev testing, fallback to host
  let subdomain = req.headers['x-tenant-subdomain'];
  
  if (!subdomain && req.hostname) {
    // Basic extraction: "tenantA.example.com" -> "tenantA"
    const parts = req.hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    } else {
      subdomain = 'default'; // Fallback for localhost or direct IP
    }
  }

  if (!subdomain) {
    subdomain = 'default';
  }

  try {
    const result = await pool.query(
      'SELECT id, name, subdomain, logo_url, theme_settings FROM tenants WHERE subdomain = $1 AND status = \'active\'',
      [subdomain]
    );

    if (result.rows.length > 0) {
      req.tenant = result.rows[0];
    } else {
      // If we strictly require a tenant for the route, we can throw here, 
      // but usually we just attach null and let the route decide.
      req.tenant = null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = tenantMiddleware;
