const { Redis } = require('@upstash/redis');

let redis;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✅ Upstash Redis connected (REST client)');
} else {
  // Fallback no-op mock when Redis is not configured
  console.warn('⚠️  Upstash Redis not configured. Caching is disabled.');
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
  };
}

module.exports = redis;

