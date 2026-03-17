import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import repoRoutes from './routes/repoRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/repo', repoRoutes);

// ── Health check ───────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT);

export default app;
