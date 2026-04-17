import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (_req, res) => {
  res.json({ service: 'api-gateway', status: 'ok' });
});

// ── Service proxies ────────────────────────────────────────────────────────
app.use('/api/auth', createProxyMiddleware({
  target: `http://localhost:${process.env.AUTH_SERVICE_PORT || 4001}`,
  changeOrigin: true,
}));

app.use('/api/courses', createProxyMiddleware({
  target: `http://localhost:${process.env.COURSE_SERVICE_PORT || 4002}`,
  changeOrigin: true,
}));

app.use('/api/ide', createProxyMiddleware({
  target: `http://localhost:${process.env.IDE_SERVICE_PORT || 4003}`,
  changeOrigin: true,
  ws: true, // proxy WebSocket for keystroke streaming
}));

app.use('/api/analytics', createProxyMiddleware({
  target: `http://localhost:${process.env.ANALYTICS_SERVICE_PORT || 4004}`,
  changeOrigin: true,
}));

app.use('/api/notifications', createProxyMiddleware({
  target: `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 4005}`,
  changeOrigin: true,
}));

app.use('/api/billing', createProxyMiddleware({
  target: `http://localhost:${process.env.BILLING_SERVICE_PORT || 4006}`,
  changeOrigin: true,
}));

app.listen(PORT, () => {
  console.log(`[api-gateway] running on port ${PORT}`);
});

export default app;
