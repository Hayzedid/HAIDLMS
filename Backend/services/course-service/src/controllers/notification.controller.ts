import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';

export class NotificationController {
  // ========================================
  // NOTIFICATIONS
  // ========================================

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        isRead,
        notificationType,
        limit = '20',
        offset = '0',
      } = req.query;

      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (isRead !== undefined) {
        filters.isRead = isRead === 'true';
      }

      if (notificationType) {
        filters.notificationType = notificationType as string;
      }

      const result = await notificationService.getNotifications(userId, filters);

      res.json({
        success: true,
        data: result.notifications,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message,
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notification(s) marked as read`,
        count,
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message,
      });
    }
  }

  async archiveNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await notificationService.archiveNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification archived',
      });
    } catch (error: any) {
      console.error('Error archiving notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive notification',
        error: error.message,
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message,
      });
    }
  }

  // ========================================
  // PREFERENCES
  // ========================================

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await notificationService.getPreferences(userId);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch preferences',
        error: error.message,
      });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      const updated = await notificationService.updatePreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
        error: error.message,
      });
    }
  }

  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subscriptionType, entityId } = req.body;

      if (!subscriptionType || !entityId) {
        res.status(400).json({
          success: false,
          message: 'subscriptionType and entityId are required',
        });
        return;
      }

      await notificationService.subscribe(userId, subscriptionType, entityId);

      res.json({
        success: true,
        message: 'Subscribed successfully',
      });
    } catch (error: any) {
      console.error('Error subscribing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe',
        error: error.message,
      });
    }
  }

  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { subscriptionType, entityId } = req.body;

      if (!subscriptionType || !entityId) {
        res.status(400).json({
          success: false,
          message: 'subscriptionType and entityId are required',
        });
        return;
      }

      await notificationService.unsubscribe(userId, subscriptionType, entityId);

      res.json({
        success: true,
        message: 'Unsubscribed successfully',
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe',
        error: error.message,
      });
    }
  }

  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const subscriptions = await notificationService.getSubscriptions(userId);

      res.json({
        success: true,
        data: subscriptions,
      });
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscriptions',
        error: error.message,
      });
    }
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  async sendBulkNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, notification } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'userIds array is required',
        });
        return;
      }

      if (!notification || !notification.title || !notification.message) {
        res.status(400).json({
          success: false,
          message: 'notification with title and message is required',
        });
        return;
      }

      const sent = await notificationService.sendBulkNotification(userIds, notification);

      res.json({
        success: true,
        message: `Sent ${sent} notification(s)`,
        count: sent,
      });
    } catch (error: any) {
      console.error('Error sending bulk notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notification',
        error: error.message,
      });
    }
  }

  async archiveOldNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { days = '90' } = req.query;
      const count = await notificationService.archiveOldNotifications(parseInt(days as string));

      res.json({
        success: true,
        message: `Archived ${count} old notification(s)`,
        count,
      });
    } catch (error: any) {
      console.error('Error archiving old notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive old notifications',
        error: error.message,
      });
    }
  }

  async sendDigests(req: Request, res: Response): Promise<void> {
    try {
      const { digestType } = req.body;

      if (!digestType || !['daily_digest', 'weekly_digest'].includes(digestType)) {
        res.status(400).json({
          success: false,
          message: 'digestType must be "daily_digest" or "weekly_digest"',
        });
        return;
      }

      const sent = await notificationService.sendDigests(digestType);

      res.json({
        success: true,
        message: `Sent ${sent} digest(s)`,
        count: sent,
      });
    } catch (error: any) {
      console.error('Error sending digests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send digests',
        error: error.message,
      });
    }
  }

  // ========================================
  // TEST
  // ========================================

  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const notification = await notificationService.createNotification({
        userId,
        notificationType: 'system_test',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working correctly.',
        priority: 'normal',
      });

      res.json({
        success: true,
        message: 'Test notification sent',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: error.message,
      });
    }
  }
}

export const notificationController = new NotificationController();
