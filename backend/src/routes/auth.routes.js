const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Validation Schemas
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  tenant_id: Joi.string().uuid().required(), // All users must belong to a tenant
  dob: Joi.date().iso().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  tenant_id: Joi.string().uuid().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  tenant_id: Joi.string().uuid().required(),
  otp: Joi.string().length(6).required(),
  new_password: Joi.string().min(8).required()
});

/**
 * Sign JWT with tenant awareness
 */
function signToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenant_id: user.tenant_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, tenant_id, dob } = value;

    // Check if tenant exists
    const tenantCheck = await pool.query('SELECT id FROM tenants WHERE id = $1', [tenant_id]);
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization (tenant) not found' });
    }

    // Check for existing user in THIS tenant
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2', 
      [email, tenant_id]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already registered with this organization' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, tenant_id, dob)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, tenant_id, created_at`,
      [name, email, password_hash, tenant_id, dob || null]
    );

    const user = result.rows[0];
    res.status(201).json({ 
      status: 'success',
      user, 
      token: signToken(user) 
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Note: In a multi-tenant system, email + tenant usually defines a unique user.
    // If users can belong to multiple tenants, we might need tenant_id here too.
    const result = await pool.query(
      'SELECT id, name, email, role, tenant_id, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ 
      status: 'success',
      user: safeUser, 
      token: signToken(safeUser) 
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, tenant_id } = value;

    // Check if user exists
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant_id]
    );
    
    if (result.rows.length === 0) {
      // For production security, don't reveal if user exists. 
      // But for development/current request, we can return success.
      return res.json({ status: 'success', message: 'If an account exists, an OTP has been generated.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      'UPDATE users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3 AND tenant_id = $4',
      [otp, expiresAt, email, tenant_id]
    );

    res.json({ 
      status: 'success', 
      message: 'OTP generated successfully.',
      // TEMPORARY: Returning OTP in response since email service is not set up
      debug_otp: otp 
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, tenant_id, otp, new_password } = value;

    const result = await pool.query(
      'SELECT id, reset_otp, reset_otp_expires_at FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenant_id]
    );

    const user = result.rows[0];
    if (!user || user.reset_otp !== otp || new Date() > user.reset_otp_expires_at) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    
    // Update password and clear OTP
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE id = $2',
      [password_hash, user.id]
    );

    res.json({ status: 'success', message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, tenant_id, dob, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      status: 'success',
      user: result.rows[0] 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
