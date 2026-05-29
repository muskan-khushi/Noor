require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const gapRoutes = require('./routes/gap.routes');
const hyperlocalRoutes = require('./routes/hyperlocal.routes');
const { errorMiddleware } = require('./middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gap', gapRoutes);
app.use('/api/hyperlocal', hyperlocalRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Noor backend running on port ${PORT}`));
});
