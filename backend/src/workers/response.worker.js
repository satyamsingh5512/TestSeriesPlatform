const { Worker } = require('bullmq');
const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

const stateFilePath = path.resolve(__dirname, '../../../../agents/STATE.json');

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

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
  try {
    if (fs.existsSync(stateFilePath)) {
      const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      const errorMsg = `Worker Error: ${err.message} on attemptId ${job.data?.attemptId}`;
      if (!stateData.failed_steps.includes(errorMsg)) {
        stateData.failed_steps.push(errorMsg);
        fs.writeFileSync(stateFilePath, JSON.stringify(stateData, null, 2));
      }
    }
  } catch (fsErr) {
    console.error('Could not write to STATE.json:', fsErr.message);
  }
});

module.exports = worker;
