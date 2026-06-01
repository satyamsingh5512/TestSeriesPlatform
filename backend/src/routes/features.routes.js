const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

/**
 * GET /api/features
 * Get all active or coming_soon features for the default tenant
 * (Can be called publicly or authenticated)
 */
router.get('/', async (req, res, next) => {
  try {
    // Assuming single-tenant or default tenant for public views
    const tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantRes.rows.length === 0) return res.json({ features: [] });

    const tenantId = tenantRes.rows[0].id;
    const result = await pool.query(
      `SELECT feature_key, title, description, status, metadata 
       FROM tenant_features 
       WHERE tenant_id = $1
       ORDER BY title ASC`,
      [tenantId]
    );
    res.json({ status: 'success', features: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
