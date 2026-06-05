const pool = require('./pool');

async function migratePhase6() {
  const client = await pool.connect();
  try {
    console.log('Starting Phase 6 Migration: Adding purge_after to violations...');
    await client.query('BEGIN');

    // Add purge_after column
    await client.query(`
      ALTER TABLE violations
      ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;
    `);

    // Backfill any existing submitted attempts with violations
    await client.query(`
      UPDATE violations v
      SET purge_after = a.submitted_at + INTERVAL '7 days'
      FROM attempts a
      WHERE v.attempt_id = a.id AND a.status = 'submitted' AND v.purge_after IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Phase 6 Migration successful.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migratePhase6();
