const { Pool } = require('pg');

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
  };
} else {
  poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

// Ensure SSL is applied even if using connectionString for Supabase
if (poolConfig.connectionString && !poolConfig.connectionString.includes('sslmode=')) {
  poolConfig.connectionString += (poolConfig.connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: poolConfig.ssl || { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
  process.exit(-1);
});

module.exports = pool;
