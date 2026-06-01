require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB     = require('./config/db');
const { loadEnv }   = require('./config/env');
const errorMiddleware = require('./middleware/errorMiddleware');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes       = require('./routes/auth.routes');
const gapRoutes        = require('./routes/gap.routes');
const hyperlocalRoutes = require('./routes/hyperlocal.routes');

// Validate env vars before doing anything
loadEnv();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost',
      'http://127.0.0.1:3000',
      'http://172.30.1.35:3000'
      
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ───────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} │ ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/gap',        gapRoutes);
app.use('/api/hyperlocal', hyperlocalRoutes);

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'noor-backend' }));

// ── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────────
app.use(errorMiddleware);

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  ✦  Noor backend running on http://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});