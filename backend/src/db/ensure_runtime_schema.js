const pool = require('./pool');

async function ensureRuntimeSchema() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS current_session_token TEXT,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
        ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_password_reset
      ON users(tenant_id, email, reset_otp_expires_at)
      WHERE reset_otp IS NOT NULL;
    `);

    await client.query(`
      ALTER TABLE violations
        ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_violations_purge_after
      ON violations(purge_after)
      WHERE purge_after IS NOT NULL;
    `);

    await client.query(`
      UPDATE violations v
      SET purge_after = a.submitted_at + INTERVAL '7 days'
      FROM attempts a
      WHERE v.attempt_id = a.id
        AND a.status = 'submitted'
        AND v.purge_after IS NULL;
    `);

    await client.query('COMMIT');
    console.log('[DB] Runtime schema verified.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Runtime schema verification failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = ensureRuntimeSchema;
