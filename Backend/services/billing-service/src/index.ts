import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { testConnection } from './db/pool';
import { webhookService } from './services/webhook.service';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4007;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create Express app
const app = express();

// Webhook routes MUST come before express.json() to get raw body
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await webhookService.handleStripeWebhook(req.body.toString(), signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
});

app.post('/api/webhooks/paystack', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    await webhookService.handlePaystackWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
});

app.post('/api/webhooks/flutterwave', express.json(), async (req, res) => {
  try {
    const signature = req.headers['verif-hash'] as string;
    await webhookService.handleFlutterwaveWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
});

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

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'billing-service',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API routes would be registered here
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/coupons', couponRoutes);

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
║   Billing Service                      ║
╠════════════════════════════════════════╣
║   Status: Running                      ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Database: ${dbConnected ? 'Connected' : 'Disconnected'}    ║
║   Gateways: Stripe, Paystack, FW       ║
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
