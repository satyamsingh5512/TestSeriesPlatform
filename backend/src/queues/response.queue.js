const { Queue } = require('bullmq');
const IORedis = require('ioredis');

let responseQueue = null;

// PAUSED: BullMQ disabled until re-enabled (set BULLMQ_ENABLED=true to turn back on).
// Reason: Upstash per-command request quota was being exhausted by the worker's
// blocking poll loop (bzpopmin) against bull:responses:marker.
if (process.env.BULLMQ_ENABLED === 'true' && process.env.REDIS_URL) {
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });

  connection.on('error', (err) => console.error('❌ Queue Redis error:', err.message));

  responseQueue = new Queue('responses', { connection });
  console.log('✅ BullMQ response queue ready');
} else {
  console.warn('⚠️  BullMQ response queue is paused. Direct DB writes will be used. (Set BULLMQ_ENABLED=true to re-enable.)');
}

module.exports = responseQueue;
