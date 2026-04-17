import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import passport from './config/passport';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import pool from './db/pool';
import redis from './db/redis';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/auth', authLimiter);

app.get('/health', (_req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[auth-service] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[auth-service] Shutting down gracefully...');
  await pool.end();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server and connect to Redis
app.listen(PORT, async () => {
  console.log(`[auth-service] running on port ${PORT}`);

  // Connect to Redis
  try {
    await redis.connect();
  } catch (error) {
    console.error('[auth-service] Redis connection failed:', error);
    console.log('[auth-service] Continuing without Redis (MFA setup will not work)');
  }
});

export default app;
