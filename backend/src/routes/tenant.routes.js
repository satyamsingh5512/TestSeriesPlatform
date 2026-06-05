const express = require('express');
const pool = require('../db/pool');
const tenantMiddleware = require('../middleware/tenant.middleware');

const router = express.Router();

/**
 * GET /api/tenant/config
 * Unauthenticated route for frontend to fetch tenant branding and settings
 */
router.get('/config', tenantMiddleware, async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ error: 'Tenant not found for this subdomain' });
    }

    res.json({
      status: 'success',
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        subdomain: req.tenant.subdomain,
        logo_url: req.tenant.logo_url,
        theme_settings: req.tenant.theme_settings
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
