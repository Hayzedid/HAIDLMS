import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { testConnection } from './db/pool';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4008;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'integrity-service',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API routes
import proctoringRoutes from './routes/proctoring.routes';
import plagiarismRoutes from './routes/plagiarism.routes';
import vivaRoutes from './routes/viva.routes';
// import videoAccountabilityRoutes from './routes/video-accountability.routes';
// import keystrokeRoutes from './routes/keystroke.routes';
// import biometricRoutes from './routes/biometric.routes';
// import integrityScoreRoutes from './routes/integrity-score.routes';

app.use('/api/proctoring', proctoringRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/viva', vivaRoutes);
// app.use('/api/video', videoAccountabilityRoutes);
// app.use('/api/keystroke', keystrokeRoutes);
// app.use('/api/biometric', biometricRoutes);
// app.use('/api/integrity', integrityScoreRoutes);

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

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Integrity Service                    ║
╠════════════════════════════════════════╣
║   Status: Running                      ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Database: ${dbConnected ? 'Connected' : 'Disconnected'}    ║
║   Features:                            ║
║   - Video Accountability               ║
║   - Live Proctoring                    ║
║   - Keystroke Recording                ║
║   - Plagiarism Detection               ║
║   - Biometric Verification             ║
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
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;
