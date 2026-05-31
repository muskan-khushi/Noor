require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB     = require('./config/db');
const { loadEnv }   = require('./config/env');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes       = require('./routes/auth.routes');
const gapRoutes        = require('./routes/gap.routes');
const hyperlocalRoutes = require('./routes/hyperlocal.routes');

// Validate env vars before doing anything
loadEnv();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
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