import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import ideRoutes from './routes/ide.routes';
import adminRoutes from './routes/admin.routes';
import clipboardTrackingRoutes from './routes/clipboard-tracking.routes';
import pool from './db/pool';
import { testDockerConnection } from './services/docker.service';

const app = express();
const PORT = process.env.IDE_SERVICE_PORT || 4003;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit payload size for code submissions

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    // Check Docker connection
    const dockerConnected = await testDockerConnection();

    if (!dockerConnected) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'connected',
        docker: 'disconnected',
      });
    }

    res.json({
      status: 'healthy',
      service: 'ide-service',
      database: 'connected',
      docker: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/ide', ideRoutes);
app.use('/api/ide/admin', adminRoutes);
app.use('/api', clipboardTrackingRoutes);

// ── Error Handler ──────────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ide-service] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = createServer(app);

// ── WebSocket Servers ──────────────────────────────────────────────────────

// WebSocket server for execution streaming
import { executionStreamManager } from './services/execution-stream.service';
const executionWss = new WebSocketServer({ server, path: '/ws/execution' });

executionWss.on('connection', (ws, req) => {
  console.log('[ide-service] Execution WebSocket client connected');

  // Extract executionId from query params
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const executionId = url.searchParams.get('executionId');

  if (!executionId) {
    ws.send(JSON.stringify({ type: 'error', data: 'executionId required' }));
    ws.close();
    return;
  }

  // Register connection for this execution
  executionStreamManager.registerConnection(executionId, ws);

  ws.on('close', () => {
    console.log('[ide-service] Execution WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('[ide-service] Execution WebSocket error:', error);
  });
});

// WebSocket server for keystroke streaming
const keystrokeWss = new WebSocketServer({ server, path: '/ws/keystrokes' });

keystrokeWss.on('connection', (ws, req) => {
  console.log('[ide-service] Keystroke WebSocket client connected');

  let sessionId: string | null = null;
  let userId: string | null = null;
  const keystrokes: any[] = [];

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Initialize session
      if (message.type === 'init') {
        sessionId = message.sessionId;
        userId = message.userId;
        ws.send(JSON.stringify({ type: 'ack', sessionId }));
        return;
      }

      // Capture keystroke
      if (message.type === 'keystroke' && sessionId) {
        keystrokes.push({
          timestamp: message.timestamp || Date.now(),
          key: message.key,
          type: message.keystrokeType, // 'press' or 'delete'
          position: message.position,
        });
      }
    } catch (error) {
      console.error('[ide-service] Keystroke message parse error:', error);
    }
  });

  ws.on('close', async () => {
    console.log('[ide-service] Keystroke WebSocket client disconnected');

    // Save keystroke data to database if session was active
    if (sessionId && userId && keystrokes.length > 0) {
      try {
        const totalKeystrokes = keystrokes.filter((k) => k.type === 'press').length;
        const totalDeletes = keystrokes.filter((k) => k.type === 'delete').length;

        await pool.query(
          `INSERT INTO keystroke_data (
            session_id, user_id, keystrokes, total_keystrokes, total_deletes,
            session_start, session_end
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            sessionId,
            userId,
            JSON.stringify(keystrokes),
            totalKeystrokes,
            totalDeletes,
            new Date(keystrokes[0]?.timestamp || Date.now()),
          ]
        );

        console.log(`[ide-service] Saved ${keystrokes.length} keystrokes for session ${sessionId}`);
      } catch (error) {
        console.error('[ide-service] Failed to save keystroke data:', error);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('[ide-service] Keystroke WebSocket error:', error);
  });
});

// ── Start Server ───────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[ide-service] ✅ Database connected');

    // Test Docker connection
    const dockerConnected = await testDockerConnection();
    if (!dockerConnected) {
      console.warn('[ide-service] ⚠️  Docker daemon not accessible - code execution will fail');
    } else {
      console.log('[ide-service] ✅ Docker connected');
    }

    server.listen(PORT, () => {
      console.log(`[ide-service] 🚀 Server running on port ${PORT}`);
      console.log(`[ide-service] 📝 Health check: http://localhost:${PORT}/health`);
      console.log(`[ide-service] 🔧 API: http://localhost:${PORT}/api/ide`);
      console.log(`[ide-service] 🔌 WebSocket: ws://localhost:${PORT}/ws/keystrokes`);
    });
  } catch (error) {
    console.error('[ide-service] ⚠️ Database connection failed, but starting server anyway:', error);
    
    server.listen(PORT, () => {
      console.log(`[ide-service] 🚀 Server running on port ${PORT} (without DB)`);
      console.log(`[ide-service] 📝 Health check: http://localhost:${PORT}/health`);
    });
  }
}

startServer();

// ── Graceful Shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[ide-service] SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[ide-service] SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

export default app;
