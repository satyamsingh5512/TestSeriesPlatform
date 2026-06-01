const { Worker } = require('bullmq');
const pool = require('../db/pool');

if (!process.env.REDIS_URL) {
  console.warn('⚠️  REDIS_URL not set. BullMQ response worker is disabled.');
  module.exports = null;
} else {
  const connection = {
    host: process.env.REDIS_HOST || new URL(process.env.REDIS_URL).hostname,
    port: process.env.REDIS_PORT || new URL(process.env.REDIS_URL).port || 6379,
    password: new URL(process.env.REDIS_URL).password || undefined,
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  };

  const worker = new Worker('responses', async (job) => {
    const { attemptId, responses } = job.data;
    
    const entries = Object.entries(responses);
    const BATCH_SIZE = 100;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const [questionId, data] of batch) {
          const { answer, time_spent_seconds, answer_changes, first_answer } = data;
          await client.query(
            `INSERT INTO responses (attempt_id, question_id, answer, time_spent_seconds, answer_changes, first_answer, synced_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (attempt_id, question_id) DO UPDATE SET
               answer = EXCLUDED.answer,
               time_spent_seconds = EXCLUDED.time_spent_seconds,
               answer_changes = EXCLUDED.answer_changes,
               first_answer = EXCLUDED.first_answer,
               synced_at = NOW()`,
            [attemptId, questionId, answer ?? null, time_spent_seconds ?? 0, answer_changes ?? 0, first_answer ?? null]
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }, { connection });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed:`, err.message);
  });

  console.log('✅ BullMQ response worker started.');
  module.exports = worker;
}

