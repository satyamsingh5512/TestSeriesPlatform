require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error.middleware');
const ensureRuntimeSchema = require('./db/ensure_runtime_schema');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Rate Limiting (Global) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// --- Security & Parsing Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// --- Root Health Compatibility ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'edtech-backend' });
});

// --- Routes ---
app.use('/api/tenant', require('./routes/tenant.routes'));
app.use('/tenant', require('./routes/tenant.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/consent', require('./routes/consent.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/exams', require('./routes/exam.routes'));
app.use('/api/attempts', require('./routes/attempt.routes'));
app.use('/api/features', require('./routes/features.routes'));

// --- Client Diagnostics ---
app.post('/api/logs/client', (req, res) => {
  const { type, message, stack, attempt_id } = req.body;
  console.error(`[CLIENT_${type}] Attempt: ${attempt_id} | ${message}`);
  res.status(204).send();
});

// --- Health Check ---
app.get('/health', async (req, res) => {
  try {
    const pool = require('./db/pool');
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      message: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// --- Global Error Handler ---
app.use(errorHandler);

async function startServer() {
  try {
    await ensureRuntimeSchema();

    // Start Background Jobs & Workers after schema is safe to query.
    require('./workers/response.worker');
    const { startConsentJob } = require('./jobs/consent.job');
    const { startPurgeJob } = require('./jobs/purge.job');
    startConsentJob();
    startPurgeJob();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Backend startup failed:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
