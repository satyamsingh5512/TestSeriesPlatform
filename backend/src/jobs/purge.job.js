const cron = require('node-cron');
const pool = require('../db/pool');

/**
 * Automated Data Purge Job (DPDP Act Compliance)
 * Runs daily at 02:00 AM
 * Goal: Delete video/image violation data 7 days after exam submission.
 */
function startPurgeJob() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running daily data purge job...');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Select expired violations to log them before deletion
      const expiredRes = await client.query(
        `SELECT id, attempt_id, type FROM violations 
         WHERE purge_after < NOW()`
      );
      
      const expired = expiredRes.rows;
      if (expired.length > 0) {
        // Log to audit table
        for (const v of expired) {
          await client.query(
            `INSERT INTO audit_logs (action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['AUTO_PURGE', 'violation', v.id, JSON.stringify({ type: v.type, attempt_id: v.attempt_id })]
          );
        }

        // Delete from violations
        await client.query(
          `DELETE FROM violations WHERE purge_after < NOW()`
        );
        
        console.log(`[CRON] Successfully purged ${expired.length} expired violation records.`);
      } else {
        console.log('[CRON] No expired violation records found.');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[CRON] Error running data purge job:', error);
    } finally {
      client.release();
    }
  });
}

module.exports = { startPurgeJob };
