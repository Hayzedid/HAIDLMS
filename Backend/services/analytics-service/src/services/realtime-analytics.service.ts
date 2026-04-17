import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { parse as parseUrl } from 'url';
import { pool } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  subscribedMetrics: Set<string>;
  lastHeartbeat: number;
}

/**
 * Real-time Analytics Service
 * Provides WebSocket connections for live dashboard updates
 */
class RealTimeAnalyticsService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private metricSubscriptions: Map<string, Set<string>> = new Map(); // metric -> Set<userId>
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/analytics',
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat to detect disconnected clients
    this.startHeartbeat();

    console.log('✅ Real-time analytics WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    try {
      // Extract and verify JWT token
      const url = parseUrl(req.url, true);
      const token = url.query.token as string;

      if (!token) {
        ws.close(4001, 'Authentication token required');
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.userId;
      const role = decoded.role;

      // Store client connection
      const client: ConnectedClient = {
        ws,
        userId,
        role,
        subscribedMetrics: new Set(),
        lastHeartbeat: Date.now(),
      };

      this.clients.set(userId, client);

      console.log(`📊 Analytics WebSocket connected: ${userId} (${role})`);

      // Send connection confirmation
      this.sendToClient(userId, {
        type: 'connected',
        message: 'Real-time analytics connected',
        userId,
      });

      // Handle messages
      ws.on('message', (data) => {
        this.handleMessage(userId, data.toString());
      });

      // Handle disconnect
      ws.on('close', () => {
        this.handleDisconnect(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        const client = this.clients.get(userId);
        if (client) {
          client.lastHeartbeat = Date.now();
        }
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4003, 'Authentication failed');
    }
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(userId: string, message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(userId, data.metrics || []);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(userId, data.metrics || []);
          break;

        case 'request_update':
          this.handleRequestUpdate(userId, data.metric);
          break;

        case 'heartbeat':
          // Client-initiated heartbeat
          this.sendToClient(userId, { type: 'heartbeat', timestamp: Date.now() });
          break;

        default:
          console.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle metric subscription
   */
  private handleSubscribe(userId: string, metrics: string[]): void {
    const client = this.clients.get(userId);
    if (!client) return;

    for (const metric of metrics) {
      client.subscribedMetrics.add(metric);

      // Add to global subscriptions
      if (!this.metricSubscriptions.has(metric)) {
        this.metricSubscriptions.set(metric, new Set());
      }
      this.metricSubscriptions.get(metric)!.add(userId);
    }

    this.sendToClient(userId, {
      type: 'subscribed',
      metrics,
    });

    console.log(`User ${userId} subscribed to: ${metrics.join(', ')}`);
  }

  /**
   * Handle metric unsubscription
   */
  private handleUnsubscribe(userId: string, metrics: string[]): void {
    const client = this.clients.get(userId);
    if (!client) return;

    for (const metric of metrics) {
      client.subscribedMetrics.delete(metric);

      // Remove from global subscriptions
      const subscribers = this.metricSubscriptions.get(metric);
      if (subscribers) {
        subscribers.delete(userId);
        if (subscribers.size === 0) {
          this.metricSubscriptions.delete(metric);
        }
      }
    }

    this.sendToClient(userId, {
      type: 'unsubscribed',
      metrics,
    });
  }

  /**
   * Handle immediate metric update request
   */
  private async handleRequestUpdate(userId: string, metric: string): Promise<void> {
    try {
      const data = await this.fetchMetricData(userId, metric);
      this.sendToClient(userId, {
        type: 'metric_update',
        metric,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to fetch metric ${metric}:`, error);
      this.sendToClient(userId, {
        type: 'error',
        message: `Failed to fetch ${metric}`,
      });
    }
  }

  /**
   * Fetch metric data from database
   */
  private async fetchMetricData(userId: string, metric: string): Promise<any> {
    const client = this.clients.get(userId);
    if (!client) return null;

    switch (metric) {
      case 'engagement_score':
        const engagementResult = await pool.query(
          'SELECT engagement_score FROM user_analytics WHERE user_id = $1',
          [userId]
        );
        return engagementResult.rows[0]?.engagement_score || 0;

      case 'health_score':
        const healthResult = await pool.query(
          'SELECT health_score FROM user_analytics WHERE user_id = $1',
          [userId]
        );
        return healthResult.rows[0]?.health_score || 50;

      case 'active_session':
        const sessionResult = await pool.query(
          `SELECT * FROM learning_sessions
           WHERE user_id = $1 AND status = 'active'
           ORDER BY start_time DESC LIMIT 1`,
          [userId]
        );
        return sessionResult.rows[0] || null;

      case 'active_users_count':
        if (client.role !== 'admin') return null;
        const activeUsersResult = await pool.query(
          `SELECT COUNT(*) as count FROM mv_active_users_30d`
        );
        return parseInt(activeUsersResult.rows[0].count, 10);

      case 'platform_stats':
        if (client.role !== 'admin') return null;
        const platformResult = await pool.query(
          'SELECT * FROM platform_analytics WHERE id = 1'
        );
        return platformResult.rows[0] || null;

      default:
        return null;
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(userId: string): void {
    const client = this.clients.get(userId);
    if (!client) return;

    // Remove from metric subscriptions
    for (const metric of client.subscribedMetrics) {
      const subscribers = this.metricSubscriptions.get(metric);
      if (subscribers) {
        subscribers.delete(userId);
        if (subscribers.size === 0) {
          this.metricSubscriptions.delete(metric);
        }
      }
    }

    // Remove client
    this.clients.delete(userId);

    console.log(`📊 Analytics WebSocket disconnected: ${userId}`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(userId: string, message: any): void {
    const client = this.clients.get(userId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to ${userId}:`, error);
    }
  }

  /**
   * Broadcast metric update to all subscribers
   */
  async broadcastMetricUpdate(metric: string, data: any): Promise<void> {
    const subscribers = this.metricSubscriptions.get(metric);
    if (!subscribers || subscribers.size === 0) return;

    const message = {
      type: 'metric_update',
      metric,
      data,
      timestamp: Date.now(),
    };

    for (const userId of subscribers) {
      this.sendToClient(userId, message);
    }

    console.log(`📊 Broadcast ${metric} to ${subscribers.size} subscribers`);
  }

  /**
   * Send metric update to specific user
   */
  async sendMetricUpdate(userId: string, metric: string, data: any): Promise<void> {
    this.sendToClient(userId, {
      type: 'metric_update',
      metric,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send alert/notification to user
   */
  sendAlert(userId: string, alert: {
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
  }): void {
    this.sendToClient(userId, {
      type: 'alert',
      ...alert,
      timestamp: Date.now(),
    });
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [userId, client] of this.clients.entries()) {
        // Send ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();

          // Check if client has responded recently
          if (now - client.lastHeartbeat > timeout) {
            console.log(`Closing stale connection: ${userId}`);
            client.ws.terminate();
            this.handleDisconnect(userId);
          }
        } else {
          // Connection already closed
          this.handleDisconnect(userId);
        }
      }
    }, 15000); // Check every 15 seconds
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectedUsers: number;
    subscriptionCount: number;
  } {
    return {
      totalConnections: this.clients.size,
      connectedUsers: new Set(this.clients.keys()).size,
      subscriptionCount: this.metricSubscriptions.size,
    };
  }

  /**
   * Shutdown the WebSocket server
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close(1001, 'Server shutting down');
    }

    this.clients.clear();
    this.metricSubscriptions.clear();

    if (this.wss) {
      this.wss.close();
    }

    console.log('📊 Real-time analytics WebSocket server shutdown complete');
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();
