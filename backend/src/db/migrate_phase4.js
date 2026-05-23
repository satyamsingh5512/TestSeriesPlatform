const pool = require('./pool');

async function migratePhase4() {
  console.log('Starting Phase 4 DB Migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Add difficulty_tier enum
    console.log('Adding difficulty_tier enum...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_tier') THEN
          CREATE TYPE difficulty_tier AS ENUM ('easy', 'medium', 'hard');
        END IF;
      END
      $$;
    `);

    // 2. Add difficulty_tier column to questions table
    console.log('Adding difficulty_tier to questions...');
    await client.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS difficulty_tier difficulty_tier NOT NULL DEFAULT 'medium';
    `);

    await client.query('COMMIT');
    console.log('Phase 4 Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migratePhase4();
