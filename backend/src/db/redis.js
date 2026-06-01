const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
  console.log('✅ Redis connected via REDIS_URL');
} else {
  // No Redis configured — create a mock client so app doesn't crash
  console.warn('⚠️  REDIS_URL not set. Redis/BullMQ features are disabled.');
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    on: () => {},
    quit: async () => {},
  };
}

module.exports = redis;
