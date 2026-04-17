import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { testConnection } from './db/pool';
import { sessionManagerService } from './services/session-manager.service';
import { eventTrackingService } from './services/event-tracking.service';
import { realTimeAnalyticsService } from './services/realtime-analytics.service';

// Routes
import trackingRoutes from './routes/tracking.routes';
import dashboardRoutes from './routes/dashboard.routes';
import analyticsRoutes from './routes/analytics.routes';
import learningHealthRoutes from './routes/learning-health.routes';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4006;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  const wsStats = realTimeAnalyticsService.getStats();

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'analytics-service',
    database: dbConnected ? 'connected' : 'disconnected',
    websocket: wsStats,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/tracking', trackingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/learning-health', learningHealthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = createServer(app);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but starting server anyway');
    }

    // Start session manager
    sessionManagerService.start();

    // Initialize WebSocket server
    realTimeAnalyticsService.initialize(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Analytics Service                    ║
╠════════════════════════════════════════╣
║   Status: Running                      ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Database: ${dbConnected ? 'Connected' : 'Disconnected'}    ║
║   WebSocket: Enabled (/ws/analytics)   ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Close WebSocket server
  realTimeAnalyticsService.shutdown();

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Stop session manager
  sessionManagerService.stop();

  // Flush remaining events
  await eventTrackingService.shutdown();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  // Close WebSocket server
  realTimeAnalyticsService.shutdown();

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Stop session manager
  sessionManagerService.stop();

  // Flush remaining events
  await eventTrackingService.shutdown();

  process.exit(0);
});

// Start the server
startServer();

export default app;
