require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error.middleware');

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

// --- Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/exams', require('./routes/exam.routes'));
app.use('/api/attempts', require('./routes/attempt.routes'));

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

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

module.exports = app;
