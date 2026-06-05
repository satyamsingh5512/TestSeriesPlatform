const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// Superadmin only
router.use(authMiddleware);
router.use(roleMiddleware('superadmin'));

/**
 * GET /api/superadmin/tenants
 * List all tenants
 */
router.get('/tenants', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json({ status: 'success', tenants: result.rows });
  } catch (err) { next(err); }
});

/**
 * POST /api/superadmin/tenants
 * Create a new tenant
 */
router.post('/tenants', async (req, res, next) => {
  try {
    const { name, subdomain, logo_url, theme_settings } = req.body;
    const result = await pool.query(
      `INSERT INTO tenants (name, subdomain, logo_url, theme_settings)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, subdomain, logo_url, theme_settings || {}]
    );
    res.status(201).json({ status: 'success', tenant: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/superadmin/tenants/:id
 * Update tenant
 */
router.patch('/tenants/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subdomain, logo_url, status, theme_settings } = req.body;
    const result = await pool.query(
      `UPDATE tenants
       SET name = COALESCE($1, name),
           subdomain = COALESCE($2, subdomain),
           logo_url = COALESCE($3, logo_url),
           status = COALESCE($4, status),
           theme_settings = COALESCE($5, theme_settings),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, subdomain, logo_url, status, theme_settings, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ status: 'success', tenant: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
