const cron = require('node-cron');
const pool = require('../db/pool');

/**
 * DPDP Act 2023 Compliance Job
 * Runs daily at midnight (00:00)
 * Goal: Find users whose 18th birthday is exactly today.
 * If they turn 18, their parental consent is no longer valid for them as an adult.
 * We must revoke `consent_verified` so they re-consent for themselves.
 */
function startConsentJob() {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily DPDP Act consent verification job...');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate 18 years ago exactly from today's date
      // Anyone born exactly 18 years ago needs re-consent.
      // E.g., if today is 2026-06-05, we look for DOB = 2008-06-05
      const result = await client.query(
        `UPDATE users
         SET consent_verified = FALSE,
             updated_at = NOW()
         WHERE dob = CURRENT_DATE - INTERVAL '18 years'
           AND consent_verified = TRUE
         RETURNING id, email`
      );

      await client.query('COMMIT');
      
      if (result.rows.length > 0) {
        console.log(`[CRON] Revoked consent for ${result.rows.length} users turning 18 today.`);
      } else {
        console.log('[CRON] No users turning 18 today.');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[CRON] Error running consent job:', error);
    } finally {
      client.release();
    }
  });
}

module.exports = { startConsentJob };
