const { Queue } = require('bullmq');
const IORedis = require('ioredis');

let responseQueue = null;

if (process.env.REDIS_URL) {
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });

  connection.on('error', (err) => console.error('❌ Queue Redis error:', err.message));

  responseQueue = new Queue('responses', { connection });
  console.log('✅ BullMQ response queue ready');
} else {
  console.warn('⚠️  REDIS_URL not set. Response queue is disabled (direct DB writes will be used).');
}

module.exports = responseQueue;
