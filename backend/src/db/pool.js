const { Pool } = require('pg');

let poolConfig;

function isLocalDatabaseHost(connectionString) {
  try {
    const { hostname } = new URL(connectionString);
    return ['localhost', '127.0.0.1', 'postgres', 'edtech_postgres'].includes(hostname);
  } catch (e) {
    return false;
  }
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@')) {
  let url = process.env.DATABASE_URL;
  try {
    const protocolAndUserMatch = url.match(/^(postgresql:\/\/)([^:]+):/);
    if (protocolAndUserMatch) {
      const prefix = protocolAndUserMatch[0];
      const remaining = url.substring(prefix.length);
      const atIndex = remaining.lastIndexOf('@');
      if (atIndex !== -1) {
        const password = remaining.substring(0, atIndex);
        const rest = remaining.substring(atIndex);
        // URL-encode password if it contains special characters and is not already encoded
        if (password.includes('#') && !password.includes('%23')) {
          url = prefix + encodeURIComponent(password) + rest;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e);
  }
  poolConfig = {
    connectionString: url,
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

const shouldUseSsl = poolConfig.connectionString
  ? !isLocalDatabaseHost(poolConfig.connectionString) && !poolConfig.connectionString.includes('sslmode=disable')
  : Boolean(poolConfig.ssl);

// Ensure SSL is applied for hosted PostgreSQL providers such as Supabase.
if (poolConfig.connectionString && shouldUseSsl && !poolConfig.connectionString.includes('sslmode=')) {
  poolConfig.connectionString += (poolConfig.connectionString.includes('?') ? '&' : '?') + 'sslmode=require&uselibpqcompat=true';
} else if (poolConfig.connectionString && poolConfig.connectionString.includes('sslmode=require') && !poolConfig.connectionString.includes('uselibpqcompat=true')) {
  poolConfig.connectionString += '&uselibpqcompat=true';
}

const finalPoolConfig = {
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

if (shouldUseSsl) {
  finalPoolConfig.ssl = poolConfig.ssl || { rejectUnauthorized: false };
} else {
  delete finalPoolConfig.ssl;
}

const pool = new Pool(finalPoolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
