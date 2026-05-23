const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://edtech:edtech_secret@localhost:5432/edtech_db' });

async function migrate() {
  try {
    console.log('Running Step 2.3 migrations...');
    
    // Add topic to questions
    await pool.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS topic VARCHAR(255) DEFAULT 'General';
    `);
    console.log('✅ Added topic column to questions table.');

    // Create analysis table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id  UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
        report      JSONB NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (attempt_id)
      );
    `);
    console.log('✅ Created analysis table.');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
