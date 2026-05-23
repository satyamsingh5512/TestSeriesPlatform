require('dotenv').config();
const pool = require('../db/pool');

async function calibrateDifficulties() {
  console.log('Starting question difficulty calibration...');
  const client = await pool.connect();
  let calibratedCount = 0;

  try {
    // We only calibrate questions that have 50 or more responses.
    const result = await client.query(`
      SELECT 
        q.id as question_id,
        q.difficulty_tier as current_tier,
        COUNT(r.id) as total_attempts,
        SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) as correct_attempts
      FROM questions q
      JOIN responses r ON q.id = r.question_id
      GROUP BY q.id, q.difficulty_tier
      HAVING COUNT(r.id) >= 50
    `);

    console.log(`Found ${result.rows.length} questions with 50+ attempts.`);

    await client.query('BEGIN');

    for (const row of result.rows) {
      const accuracy = (row.correct_attempts / row.total_attempts) * 100;
      let newTier = row.current_tier;

      if (accuracy < 30 && row.current_tier !== 'hard') {
        newTier = 'hard';
      } else if (accuracy > 70 && row.current_tier !== 'easy') {
        newTier = 'easy';
      }

      if (newTier !== row.current_tier) {
        await client.query(
          'UPDATE questions SET difficulty_tier = $1 WHERE id = $2',
          [newTier, row.question_id]
        );
        console.log(`Question ${row.question_id}: accuracy ${accuracy.toFixed(1)}% -> changed to ${newTier}`);
        calibratedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Calibration complete. Updated ${calibratedCount} questions.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Calibration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

calibrateDifficulties();
