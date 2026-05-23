const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://edtech:edtech_secret@localhost:5432/edtech_db',
});

async function migrate() {
  try {
    console.log('Running Phase 3 patch migration...');

    await pool.query(`
      ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS difficulty_level NUMERIC(4,3) NOT NULL DEFAULT 0.500;
    `);
    console.log('✅ Added questions.difficulty_level');

    await pool.query(`
      ALTER TABLE attempts
      ADD COLUMN IF NOT EXISTS irt_theta NUMERIC(6,3);
    `);
    console.log('✅ Added attempts.irt_theta');

    await pool.query(`
      ALTER TABLE violations
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'under_review';
    `);
    console.log('✅ Added violations.status');

    await pool.query(`
      ALTER TABLE violations
      ADD CONSTRAINT violations_status_check
      CHECK (status IN ('suspicious', 'cleared', 'under_review'));
    `).catch(() => {});
    console.log('✅ Ensured violations.status constraint');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
