import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import notificationRoutes from './routes/notification.routes';
import spacedRepetitionRoutes from './routes/spaced-repetition.routes';
import templateRoutes from './routes/template.routes';
import pool from './db/pool';
import { inAppNotificationService } from './services/in-app.service';
import { emailService } from './services/email.service';

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4005;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    // Get in-app service stats
    const inAppStats = inAppNotificationService.getStats();

    res.json({
      status: 'healthy',
      service: 'notification-service',
      database: 'connected',
      websocket: {
        connectedUsers: inAppStats.connectedUsers,
        totalConnections: inAppStats.totalConnections,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);
app.use('/api/spaced-repetition', spacedRepetitionRoutes);
app.use('/api/templates', templateRoutes);

// ── Error Handler ──────────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[notification-service] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = createServer(app);

// ── WebSocket Server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: '/ws/notifications' });

wss.on('connection', (ws, req) => {
  console.log('[notification-service] WebSocket client connected');

  // Extract token from query params
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.send(JSON.stringify({ type: 'error', data: 'Authentication token required' }));
    ws.close();
    return;
  }

  // Verify JWT token
  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', data: 'Invalid or expired token' }));
    ws.close();
    return;
  }

  // Register connection with in-app notification service
  inAppNotificationService.registerConnection(userId, ws);

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'mark_read':
          if (message.notificationId) {
            await inAppNotificationService.markAsRead(message.notificationId, userId);
          }
          break;

        case 'mark_all_read':
          await inAppNotificationService.markAllAsRead(userId);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          console.log(`[notification-service] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[notification-service] WebSocket message parse error:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('[notification-service] WebSocket error:', error);
  });
});

// ── Start Server ───────────────────────────────────────────────────────────

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[notification-service] ✅ Database connected');

    // Test email service configuration
    await emailService.testConfiguration();

    // Start queue worker (in separate process in production)
    // Uncomment for development:
    // require('./workers/notification.worker');

    server.listen(PORT, () => {
      console.log(`[notification-service] 🚀 Server running on port ${PORT}`);
      console.log(`[notification-service] 📝 Health check: http://localhost:${PORT}/health`);
      console.log(`[notification-service] 🔧 API: http://localhost:${PORT}/api/notifications`);
      console.log(`[notification-service] 🔌 WebSocket: ws://localhost:${PORT}/ws/notifications`);
    });
  } catch (error) {
    console.error('[notification-service] ❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// ── Graceful Shutdown ──────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[notification-service] SIGTERM received, shutting down gracefully...');
  inAppNotificationService.destroy();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[notification-service] SIGINT received, shutting down gracefully...');
  inAppNotificationService.destroy();
  await pool.end();
  process.exit(0);
});

export default app;
