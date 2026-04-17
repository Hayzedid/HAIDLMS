import { Request, Response } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { inAppNotificationService } from '../services/in-app.service';

// ── Validation Schemas ─────────────────────────────────────────────────────

const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    'course_enrollment',
    'lesson_completed',
    'assignment_due',
    'certificate_issued',
    'comment_reply',
    'course_update',
    'announcement',
    'review_reminder',
    'spaced_repetition',
    'payment_success',
    'payment_failed',
    'system_alert',
  ]),
  channel: z.union([
    z.enum(['email', 'slack', 'in_app', 'push', 'sms']),
    z.array(z.enum(['email', 'slack', 'in_app', 'push', 'sms'])),
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  templateId: z.string().uuid().optional(),
  templateName: z.string().optional(),
  templateVariables: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

const broadcastSchema = sendNotificationSchema.omit({ userId: true }).extend({
  userIds: z.array(z.string().uuid()),
});

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  typePreferences: z.record(z.any()).optional(),
  emailDigest: z.boolean().optional(),
  digestFrequency: z.enum(['daily', 'weekly']).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
  slackWebhookUrl: z.string().url().optional(),
  slackChannel: z.string().optional(),
  phoneNumber: z.string().optional(),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * Send notification to a user
 * POST /api/notifications/send
 */
export async function sendNotification(req: Request, res: Response) {
  try {
    const data = sendNotificationSchema.parse(req.body);

    const notificationIds = await notificationService.send({
      ...data,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return res.status(201).json({
      success: true,
      notificationIds,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[notification-controller] Send notification error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Broadcast notification to multiple users
 * POST /api/notifications/broadcast
 */
export async function broadcastNotification(req: Request, res: Response) {
  try {
    const data = broadcastSchema.parse(req.body);

    const notificationIds = await notificationService.broadcast(data.userIds, {
      type: data.type,
      channel: data.channel,
      priority: data.priority,
      subject: data.subject,
      body: data.body,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      templateId: data.templateId,
      templateName: data.templateName,
      templateVariables: data.templateVariables,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return res.status(201).json({
      success: true,
      notificationIds,
      count: notificationIds.length,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[notification-controller] Broadcast error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export async function getNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const notification = await notificationService.getById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    console.error('[notification-controller] Get notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Cancel notification
 * POST /api/notifications/:id/cancel
 */
export async function cancelNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await notificationService.cancel(id);

    return res.json({ success: true, message: 'Notification cancelled' });
  } catch (error) {
    console.error('[notification-controller] Cancel notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get user's in-app notifications
 * GET /api/notifications/in-app
 */
export async function getInAppNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset, includeRead } = req.query;

    const result = await inAppNotificationService.getNotifications(userId, {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
      includeRead: includeRead === 'true',
    });

    return res.json(result);
  } catch (error) {
    console.error('[notification-controller] Get in-app notifications error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/in-app/unread-count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await inAppNotificationService.getUnreadCount(userId);

    return res.json({ count });
  } catch (error) {
    console.error('[notification-controller] Get unread count error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await inAppNotificationService.markAsRead(id, userId);

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('[notification-controller] Mark as read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/in-app/read-all
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await inAppNotificationService.markAllAsRead(userId);

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[notification-controller] Mark all as read error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await inAppNotificationService.deleteNotification(id, userId);

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('[notification-controller] Delete notification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get user's notification preferences
 * GET /api/notifications/preferences
 */
export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await notificationService.getPreferences(userId);

    return res.json(preferences);
  } catch (error) {
    console.error('[notification-controller] Get preferences error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update user's notification preferences
 * PATCH /api/notifications/preferences
 */
export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = updatePreferencesSchema.parse(req.body);

    const preferences = await notificationService.updatePreferences(userId, data);

    return res.json(preferences);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[notification-controller] Update preferences error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
export async function getStats(req: Request, res: Response) {
  try {
    const { startDate, endDate, channel, type } = req.query;

    const stats = await notificationService.getStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      channel: channel as string,
      type: type as string,
    });

    return res.json(stats);
  } catch (error) {
    console.error('[notification-controller] Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
