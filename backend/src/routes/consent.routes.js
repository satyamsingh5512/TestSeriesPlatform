const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/consent/status
 * Check the user's current consent status
 */
router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT dob, consent_verified, parent_consent_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    
    // Determine if under 18
    let isUnder18 = false;
    let requiresConsent = false;
    
    if (user.dob) {
      const dob = new Date(user.dob);
      const ageDiffMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      
      isUnder18 = age < 18;
    } else {
      // If DOB is null, we safely assume they need to provide it / verify
      requiresConsent = true; 
    }

    if (isUnder18 && !user.consent_verified) requiresConsent = true;
    if (!isUnder18 && !user.consent_verified && user.dob) requiresConsent = true; // Needs adult consent

    res.json({
      status: 'success',
      consent_verified: user.consent_verified,
      is_under_18: isUnder18,
      requires_consent: requiresConsent,
      has_dob: !!user.dob
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/consent/digilocker/login
 * Mock endpoint to initiate DigiLocker OAuth for DPDP Consent
 */
router.get('/digilocker/login', authMiddleware, (req, res) => {
  // In production, this would generate a state token and redirect to DigiLocker
  // https://api.digitallocker.gov.in/public/oauth2/1/authorize
  const mockRedirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?consent_callback=mock_code`;
  res.json({ status: 'success', redirect_url: mockRedirectUrl });
});

/**
 * POST /api/consent/verify
 * Callback processing to mark consent as true
 */
router.post('/verify', authMiddleware, async (req, res, next) => {
  try {
    const { code, dob } = req.body;
    
    if (!code) return res.status(400).json({ error: 'OAuth code is required' });

    // Validate and update DOB if provided
    let dobUpdateSql = '';
    let dobValues = [];
    if (dob) {
      dobUpdateSql = ', dob = $2';
      dobValues.push(dob);
    }

    // In a real flow, we would exchange `code` for an access token with DigiLocker,
    // fetch the user's/parent's identity, and verify. Here we mock success.
    await pool.query(
      `UPDATE users 
       SET consent_verified = TRUE, 
           parent_consent_at = NOW() 
           ${dobUpdateSql}
       WHERE id = $1`,
      dob ? [req.user.id, dob] : [req.user.id]
    );

    res.json({ status: 'success', message: 'Consent verified successfully via DigiLocker.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
