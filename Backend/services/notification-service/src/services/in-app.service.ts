import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import pool from '../db/pool';

export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  subject?: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
}

export interface WebSocketClient {
  userId: string;
  ws: WebSocket;
  lastActivity: Date;
}

/**
 * Manages in-app notifications and WebSocket connections
 */
export class InAppNotificationService extends EventEmitter {
  private connections: Map<string, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHeartbeat();
  }

  /**
   * Register a WebSocket connection for a user
   */
  registerConnection(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userConnections = this.connections.get(userId)!;
    userConnections.add(ws);

    console.log(`[in-app] User ${userId} connected (${userConnections.size} connections)`);

    // Send connection acknowledgment
    this.sendToSocket(ws, {
      type: 'connected',
      timestamp: Date.now(),
      data: { userId, message: 'Connected to notification service' },
    });

    // Send unread count
    this.sendUnreadCount(userId);

    // Handle disconnect
    ws.on('close', () => {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      console.log(`[in-app] User ${userId} disconnected (${userConnections.size} remaining)`);
    });

    // Handle ping
    ws.on('ping', () => {
      ws.pong();
    });
  }

  /**
   * Send notification to user in real-time
   */
  async sendToUser(userId: string, notification: InAppNotification): Promise<void> {
    const connections = this.connections.get(userId);

    if (connections && connections.size > 0) {
      const message = {
        type: 'notification',
        timestamp: Date.now(),
        data: notification,
      };

      connections.forEach((ws) => {
        this.sendToSocket(ws, message);
      });

      console.log(`[in-app] Notification sent to user ${userId} (${connections.size} clients)`);
    } else {
      console.log(`[in-app] User ${userId} not connected - notification stored in DB`);
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastToUsers(userIds: string[], notification: InAppNotification): Promise<void> {
    for (const userId of userIds) {
      await this.sendToUser(userId, notification);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications
         SET read_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [notificationId, userId]
      );

      // Send updated unread count
      await this.sendUnreadCount(userId);

      console.log(`[in-app] Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('[in-app] Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications
         SET read_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND channel = 'in_app' AND read_at IS NULL`,
        [userId]
      );

      // Send updated unread count
      await this.sendUnreadCount(userId);

      console.log(`[in-app] All notifications marked as read for user ${userId}`);
    } catch (error) {
      console.error('[in-app] Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limit: number = 50): Promise<InAppNotification[]> {
    try {
      const result = await pool.query(
        `SELECT id, user_id, type, subject, body, action_url, metadata, read_at, created_at
         FROM notifications
         WHERE user_id = $1 AND channel = 'in_app' AND read_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        subject: row.subject,
        body: row.body,
        actionUrl: row.action_url,
        metadata: row.metadata,
        readAt: row.read_at,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('[in-app] Failed to get unread notifications:', error);
      return [];
    }
  }

  /**
   * Get all notifications for a user (paginated)
   */
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      includeRead?: boolean;
    } = {}
  ): Promise<{ notifications: InAppNotification[]; total: number }> {
    const { limit = 20, offset = 0, includeRead = true } = options;

    try {
      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM notifications
         WHERE user_id = $1 AND channel = 'in_app'
         ${!includeRead ? 'AND read_at IS NULL' : ''}`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      // Get notifications
      const result = await pool.query(
        `SELECT id, user_id, type, subject, body, action_url, metadata, read_at, created_at
         FROM notifications
         WHERE user_id = $1 AND channel = 'in_app'
         ${!includeRead ? 'AND read_at IS NULL' : ''}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const notifications = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        subject: row.subject,
        body: row.body,
        actionUrl: row.action_url,
        metadata: row.metadata,
        readAt: row.read_at,
        createdAt: row.created_at,
      }));

      return { notifications, total };
    } catch (error) {
      console.error('[in-app] Failed to get notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM notifications
         WHERE user_id = $1 AND channel = 'in_app' AND read_at IS NULL`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[in-app] Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Send unread count to user's connected clients
   */
  async sendUnreadCount(userId: string): Promise<void> {
    const count = await this.getUnreadCount(userId);
    const connections = this.connections.get(userId);

    if (connections && connections.size > 0) {
      const message = {
        type: 'unread_count',
        timestamp: Date.now(),
        data: { count },
      };

      connections.forEach((ws) => {
        this.sendToSocket(ws, message);
      });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await pool.query(
        `DELETE FROM notifications WHERE id = $1 AND user_id = $2 AND channel = 'in_app'`,
        [notificationId, userId]
      );

      // Send updated unread count
      await this.sendUnreadCount(userId);

      console.log(`[in-app] Notification ${notificationId} deleted`);
    } catch (error) {
      console.error('[in-app] Failed to delete notification:', error);
    }
  }

  /**
   * Send message to WebSocket
   */
  private sendToSocket(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[in-app] Failed to send message:', error);
      }
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((connections, userId) => {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          } else {
            connections.delete(ws);
          }
        });

        if (connections.size === 0) {
          this.connections.delete(userId);
        }
      });
    }, 30000); // 30 seconds
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connectedUsers: number;
    totalConnections: number;
  } {
    let totalConnections = 0;
    this.connections.forEach((connections) => {
      totalConnections += connections.size;
    });

    return {
      connectedUsers: this.connections.size,
      totalConnections,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connections.forEach((connections) => {
      connections.forEach((ws) => {
        ws.close();
      });
    });

    this.connections.clear();
  }
}

// Singleton instance
export const inAppNotificationService = new InAppNotificationService();
