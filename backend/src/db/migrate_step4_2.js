const pool = require('./pool');

async function migrateStep4_2() {
  console.log('Starting Phase 4.2 DB Migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Add exam_type enum
    console.log('Adding exam_type enum...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type') THEN
          CREATE TYPE exam_type AS ENUM ('fixed', 'adaptive');
        END IF;
      END
      $$;
    `);

    // 2. Add exam_type column to exams table
    console.log('Adding exam_type to exams...');
    await client.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS type exam_type NOT NULL DEFAULT 'fixed';
    `);

    await client.query('COMMIT');
    console.log('Phase 4.2 Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateStep4_2();
