import pool from '../db/pool';
import { queueNotification } from '../queues/notification.queue';
import { templateService } from './template.service';
import { inAppNotificationService } from './in-app.service';

export interface SendNotificationOptions {
  userId: string;
  type: string;
  channel: string | string[];
  priority?: string;
  subject?: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  templateId?: string;
  templateName?: string;
  templateVariables?: Record<string, any>;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Send notification(s) to user
   */
  async send(options: SendNotificationOptions): Promise<string[]> {
    const {
      userId,
      type,
      channel,
      priority = 'normal',
      subject,
      body,
      actionUrl,
      metadata,
      templateId,
      templateName,
      templateVariables,
      scheduledFor,
      expiresAt,
    } = options;

    try {
      // Determine channels (can be single or array)
      const channels = Array.isArray(channel) ? channel : [channel];
      const notificationIds: string[] = [];

      // Render template if provided
      let renderedSubject = subject;
      let renderedBody = body;
      let usedTemplateId = templateId;

      if (templateId || templateName) {
        if (!templateVariables) {
          throw new Error('Template variables required when using templates');
        }

        const rendered = await templateService.renderTemplate({
          templateId,
          templateName,
          variables: templateVariables,
        });

        renderedSubject = rendered.subject || subject;
        renderedBody = rendered.body;
        usedTemplateId = rendered.template.id;
      }

      if (!renderedBody) {
        throw new Error('Notification body is required');
      }

      // Create notification for each channel
      for (const ch of channels) {
        const result = await pool.query(
          `INSERT INTO notifications (
            user_id, type, channel, priority, subject, body, action_url, metadata,
            template_id, template_variables, scheduled_for, expires_at, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id`,
          [
            userId,
            type,
            ch,
            priority,
            renderedSubject,
            renderedBody,
            actionUrl,
            metadata ? JSON.stringify(metadata) : null,
            usedTemplateId,
            templateVariables ? JSON.stringify(templateVariables) : null,
            scheduledFor || null,
            expiresAt || null,
            scheduledFor ? 'pending' : 'pending',
          ]
        );

        const notificationId = result.rows[0].id;
        notificationIds.push(notificationId);

        // Queue notification
        await queueNotification(
          {
            notificationId,
            userId,
            type,
            channel: ch,
            priority,
            subject: renderedSubject,
            body: renderedBody,
            actionUrl,
            metadata,
            templateId: usedTemplateId,
            templateVariables,
          },
          {
            delay: scheduledFor ? scheduledFor.getTime() - Date.now() : undefined,
          }
        );

        // For in-app notifications, send immediately via WebSocket
        if (ch === 'in_app' && !scheduledFor) {
          await inAppNotificationService.sendToUser(userId, {
            id: notificationId,
            userId,
            type,
            subject: renderedSubject,
            body: renderedBody,
            actionUrl,
            metadata,
            createdAt: new Date(),
          });
        }
      }

      console.log(`[notification] Notifications created: ${notificationIds.join(', ')}`);

      return notificationIds;
    } catch (error) {
      console.error('[notification] Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users (broadcast)
   */
  async broadcast(
    userIds: string[],
    options: Omit<SendNotificationOptions, 'userId'>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const userId of userIds) {
      try {
        const ids = await this.send({ ...options, userId });
        notificationIds.push(...ids);
      } catch (error) {
        console.error(`[notification] Failed to send to user ${userId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Cancel scheduled notification
   */
  async cancel(notificationId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notifications
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [notificationId]
      );

      console.log(`[notification] Notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error('[notification] Failed to cancel notification:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getById(notificationId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications WHERE id = $1`,
        [notificationId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('[notification] Failed to get notification:', error);
      return null;
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default preferences
        return this.createDefaultPreferences(userId);
      }

      return result.rows[0];
    } catch (error) {
      console.error('[notification] Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: {
      emailEnabled?: boolean;
      slackEnabled?: boolean;
      inAppEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      typePreferences?: Record<string, any>;
      emailDigest?: boolean;
      digestFrequency?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      timezone?: string;
      slackWebhookUrl?: string;
      slackChannel?: string;
      phoneNumber?: string;
    }
  ): Promise<any> {
    try {
      // Upsert preferences
      const result = await pool.query(
        `INSERT INTO notification_preferences (
          user_id, email_enabled, slack_enabled, in_app_enabled, push_enabled, sms_enabled,
          type_preferences, email_digest, digest_frequency,
          quiet_hours_start, quiet_hours_end, timezone,
          slack_webhook_url, slack_channel, phone_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (user_id) DO UPDATE SET
          email_enabled = COALESCE($2, notification_preferences.email_enabled),
          slack_enabled = COALESCE($3, notification_preferences.slack_enabled),
          in_app_enabled = COALESCE($4, notification_preferences.in_app_enabled),
          push_enabled = COALESCE($5, notification_preferences.push_enabled),
          sms_enabled = COALESCE($6, notification_preferences.sms_enabled),
          type_preferences = COALESCE($7, notification_preferences.type_preferences),
          email_digest = COALESCE($8, notification_preferences.email_digest),
          digest_frequency = COALESCE($9, notification_preferences.digest_frequency),
          quiet_hours_start = COALESCE($10, notification_preferences.quiet_hours_start),
          quiet_hours_end = COALESCE($11, notification_preferences.quiet_hours_end),
          timezone = COALESCE($12, notification_preferences.timezone),
          slack_webhook_url = COALESCE($13, notification_preferences.slack_webhook_url),
          slack_channel = COALESCE($14, notification_preferences.slack_channel),
          phone_number = COALESCE($15, notification_preferences.phone_number),
          updated_at = NOW()
        RETURNING *`,
        [
          userId,
          preferences.emailEnabled,
          preferences.slackEnabled,
          preferences.inAppEnabled,
          preferences.pushEnabled,
          preferences.smsEnabled,
          preferences.typePreferences ? JSON.stringify(preferences.typePreferences) : null,
          preferences.emailDigest,
          preferences.digestFrequency,
          preferences.quietHoursStart,
          preferences.quietHoursEnd,
          preferences.timezone,
          preferences.slackWebhookUrl,
          preferences.slackChannel,
          preferences.phoneNumber,
        ]
      );

      console.log(`[notification] Preferences updated for user ${userId}`);

      return result.rows[0];
    } catch (error) {
      console.error('[notification] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Create default preferences for user
   */
  private async createDefaultPreferences(userId: string): Promise<any> {
    try {
      const result = await pool.query(
        `INSERT INTO notification_preferences (user_id)
         VALUES ($1)
         RETURNING *`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('[notification] Failed to create default preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(options: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    type?: string;
  } = {}): Promise<any> {
    try {
      let query = `SELECT * FROM notification_queue_stats WHERE 1=1`;
      const params: any[] = [];
      let paramCount = 1;

      if (options.startDate) {
        query += ` AND date >= $${paramCount}`;
        params.push(options.startDate);
        paramCount++;
      }

      if (options.endDate) {
        query += ` AND date <= $${paramCount}`;
        params.push(options.endDate);
        paramCount++;
      }

      if (options.channel) {
        query += ` AND channel = $${paramCount}`;
        params.push(options.channel);
        paramCount++;
      }

      if (options.type) {
        query += ` AND type = $${paramCount}`;
        params.push(options.type);
        paramCount++;
      }

      query += ` ORDER BY date DESC, channel, type`;

      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      console.error('[notification] Failed to get stats:', error);
      return [];
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
