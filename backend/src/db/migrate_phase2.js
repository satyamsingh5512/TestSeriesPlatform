const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://edtech:edtech_secret@localhost:5432/edtech_db' });

async function migrate() {
  try {
    console.log('Running Phase 2 migrations...');
    await pool.query(`
      ALTER TABLE responses 
      ADD COLUMN IF NOT EXISTS answer_changes INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS first_answer TEXT;
    `);
    console.log('✅ Added answer_changes and first_answer to responses table.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
