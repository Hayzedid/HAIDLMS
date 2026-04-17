import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4009;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '100mb' })); // Large limit for video data
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    features: {
      tutor: !!process.env.OPENAI_API_KEY,
      contentGeneration: !!process.env.OPENAI_API_KEY,
      codeViva: !!process.env.OPENAI_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

// API routes (will be implemented)
// import tutorRoutes from './routes/tutor.routes';
// import vivaRoutes from './routes/viva.routes';
// import contentRoutes from './routes/content.routes';

// app.use('/api/tutor', tutorRoutes);
// app.use('/api/viva', vivaRoutes);
// app.use('/api/content', contentRoutes);

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
    // Verify API keys
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set, AI features will be limited');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   AI Service                           ║
╠════════════════════════════════════════╣
║   Status: Running                      ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}      ║
║   Features:                            ║
║   - AI Pair Programmer                 ║
║   - Code Viva Mode                     ║
║   - Content Generation                 ║
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
