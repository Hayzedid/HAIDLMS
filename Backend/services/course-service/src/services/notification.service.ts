import pool from '../db/pool';

interface Notification {
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  relatedCourseId?: string;
  relatedThreadId?: string;
  relatedUserId?: string;
  priority?: string;
  metadata?: any;
  expiresAt?: Date;
}

interface NotificationPreferences {
  userId: string;
  emailEnabled?: boolean;
  emailFrequency?: string;
  [key: string]: any;
}

interface EmailMessage {
  userId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  templateKey?: string;
  templateVariables?: any;
  priority?: string;
  scheduledFor?: Date;
}

export class NotificationService {
  // ========================================
  // NOTIFICATIONS
  // ========================================

  async createNotification(notification: Notification): Promise<any> {
    const query = `
      INSERT INTO notifications (
        user_id, notification_type, title, message, action_url, action_text,
        related_course_id, related_thread_id, related_user_id,
        priority, metadata, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      notification.userId,
      notification.notificationType,
      notification.title,
      notification.message,
      notification.actionUrl,
      notification.actionText,
      notification.relatedCourseId,
      notification.relatedThreadId,
      notification.relatedUserId,
      notification.priority || 'normal',
      notification.metadata ? JSON.stringify(notification.metadata) : null,
      notification.expiresAt,
    ];

    const result = await pool.query(query, values);
    const createdNotification = result.rows[0];

    // Queue email if user has email enabled
    if (createdNotification.delivered_via === 'both' || createdNotification.delivered_via === 'email') {
      await this.queueEmailForNotification(createdNotification.id);
    }

    return createdNotification;
  }

  async getNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      notificationType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: any[]; total: number }> {
    let query = `
      SELECT * FROM recent_notifications
      WHERE user_id = $1
    `;

    const values: any[] = [userId];
    let paramCount = 2;

    if (filters.isRead !== undefined) {
      query += ` AND is_read = $${paramCount}`;
      values.push(filters.isRead);
      paramCount++;
    }

    if (filters.notificationType) {
      query += ` AND notification_type = $${paramCount}`;
      values.push(filters.notificationType);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      notifications: result.rows,
      total,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT unread_count FROM unread_notification_counts
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0]?.unread_count || 0;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const query = 'SELECT mark_all_notifications_read($1) as count';
    const result = await pool.query(query, [userId]);
    return result.rows[0].count;
  }

  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_archived = true, archived_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [
      notificationId,
      userId,
    ]);
  }

  // ========================================
  // PREFERENCES
  // ========================================

  async getPreferences(userId: string): Promise<any> {
    const query = 'SELECT * FROM notification_preferences WHERE user_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // Create default preferences
      return this.createDefaultPreferences(userId);
    }

    return result.rows[0];
  }

  async createDefaultPreferences(userId: string): Promise<any> {
    const query = `
      INSERT INTO notification_preferences (user_id)
      VALUES ($1)
      RETURNING *
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(preferences).forEach(([key, value]) => {
      if (value !== undefined && key !== 'userId') {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(userId);

    const query = `
      UPDATE notification_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // EMAIL QUEUE
  // ========================================

  async queueEmail(email: EmailMessage): Promise<any> {
    const query = `
      INSERT INTO email_queue (
        user_id, recipient_email, recipient_name, subject, body_text, body_html,
        template_key, template_variables, priority, scheduled_for
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      email.userId,
      email.recipientEmail,
      email.recipientName,
      email.subject,
      email.bodyText,
      email.bodyHtml,
      email.templateKey,
      email.templateVariables ? JSON.stringify(email.templateVariables) : null,
      email.priority || 'normal',
      email.scheduledFor || new Date(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async queueEmailForNotification(notificationId: string): Promise<void> {
    const query = `
      WITH notification_data AS (
        SELECT
          n.user_id,
          n.title,
          n.message,
          n.action_url,
          u.email,
          u.full_name
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.id = $1
      )
      INSERT INTO email_queue (
        notification_id, user_id, recipient_email, recipient_name,
        subject, body_text, body_html
      )
      SELECT
        $1,
        user_id,
        email,
        full_name,
        title,
        message,
        '<html><body><h2>' || title || '</h2><p>' || message || '</p>' ||
        CASE WHEN action_url IS NOT NULL
          THEN '<p><a href="' || action_url || '">View Details</a></p>'
          ELSE ''
        END ||
        '</body></html>'
      FROM notification_data
    `;

    await pool.query(query, [notificationId]);
  }

  async getPendingEmails(limit: number = 100): Promise<any[]> {
    const query = `
      SELECT * FROM email_queue
      WHERE status = 'pending'
        AND scheduled_for <= NOW()
        AND attempts < max_attempts
      ORDER BY priority DESC, scheduled_for ASC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async markEmailAsSent(emailId: string): Promise<void> {
    await pool.query(
      `UPDATE email_queue
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [emailId]
    );

    // Mark notification as email sent
    await pool.query(
      `UPDATE notifications
       SET email_sent = true, email_sent_at = NOW()
       WHERE id = (SELECT notification_id FROM email_queue WHERE id = $1)`,
      [emailId]
    );
  }

  async markEmailAsFailed(emailId: string, errorMessage: string): Promise<void> {
    await pool.query(
      `UPDATE email_queue
       SET status = 'failed', attempts = attempts + 1,
           last_attempt_at = NOW(), error_message = $2, updated_at = NOW()
       WHERE id = $1`,
      [emailId, errorMessage]
    );
  }

  // ========================================
  // TEMPLATES
  // ========================================

  async getTemplate(templateKey: string): Promise<any> {
    const query = `
      SELECT * FROM notification_templates
      WHERE template_key = $1 AND is_active = true
    `;

    const result = await pool.query(query, [templateKey]);

    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    return result.rows[0];
  }

  async renderTemplate(templateKey: string, variables: any): Promise<{ subject: string; body: string; html?: string }> {
    const template = await this.getTemplate(templateKey);

    // Simple variable replacement (in production, use a proper template engine)
    let subject = template.subject_template;
    let body = template.body_template;
    let html = template.html_template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, value as string);
      body = body.replace(placeholder, value as string);
      if (html) {
        html = html.replace(placeholder, value as string);
      }
    });

    return { subject, body, html };
  }

  async createTemplate(template: {
    templateKey: string;
    templateName: string;
    description?: string;
    subjectTemplate: string;
    bodyTemplate: string;
    htmlTemplate?: string;
    requiredVariables?: string[];
  }): Promise<any> {
    const query = `
      INSERT INTO notification_templates (
        template_key, template_name, description, subject_template,
        body_template, html_template, required_variables
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      template.templateKey,
      template.templateName,
      template.description,
      template.subjectTemplate,
      template.bodyTemplate,
      template.htmlTemplate,
      template.requiredVariables || [],
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  async subscribe(
    userId: string,
    subscriptionType: string,
    entityId: string
  ): Promise<void> {
    let query = `
      INSERT INTO notification_subscriptions (user_id, subscription_type, `;

    if (subscriptionType === 'thread_follow') {
      query += 'thread_id) VALUES ($1, $2, $3)';
    } else if (subscriptionType === 'course_watch') {
      query += 'course_id) VALUES ($1, $2, $3)';
    } else if (subscriptionType === 'user_follow') {
      query += 'followed_user_id) VALUES ($1, $2, $3)';
    }

    query += ' ON CONFLICT DO NOTHING';

    await pool.query(query, [userId, subscriptionType, entityId]);
  }

  async unsubscribe(
    userId: string,
    subscriptionType: string,
    entityId: string
  ): Promise<void> {
    let whereClause = 'user_id = $1 AND subscription_type = $2 AND ';

    if (subscriptionType === 'thread_follow') {
      whereClause += 'thread_id = $3';
    } else if (subscriptionType === 'course_watch') {
      whereClause += 'course_id = $3';
    } else if (subscriptionType === 'user_follow') {
      whereClause += 'followed_user_id = $3';
    }

    const query = `DELETE FROM notification_subscriptions WHERE ${whereClause}`;
    await pool.query(query, [userId, subscriptionType, entityId]);
  }

  async getSubscriptions(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM notification_subscriptions
      WHERE user_id = $1
      ORDER BY subscribed_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ========================================
  // DIGESTS
  // ========================================

  async createDigestBatch(
    userId: string,
    batchType: 'daily_digest' | 'weekly_digest'
  ): Promise<any> {
    const periodStart = batchType === 'daily_digest'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const periodEnd = new Date();

    // Get pending notifications for digest
    const notificationsQuery = `
      SELECT * FROM get_digest_notifications($1, $2)
    `;

    const notificationsResult = await pool.query(notificationsQuery, [userId, batchType]);
    const notifications = notificationsResult.rows;

    if (notifications.length === 0) {
      return null; // No notifications for digest
    }

    const notificationIds = notifications.map((n: any) => n.notification_id);

    // Create batch
    const batchQuery = `
      INSERT INTO notification_batches (
        user_id, batch_type, notification_ids, notification_count,
        period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(batchQuery, [
      userId,
      batchType,
      notificationIds,
      notifications.length,
      periodStart,
      periodEnd,
    ]);

    return result.rows[0];
  }

  async sendDigests(digestType: 'daily_digest' | 'weekly_digest'): Promise<number> {
    // Get users who want digests
    const usersQuery = `
      SELECT user_id, email_frequency
      FROM notification_preferences
      WHERE email_enabled = true AND email_frequency = $1
    `;

    const usersResult = await pool.query(usersQuery, [digestType]);
    const users = usersResult.rows;

    let digestsSent = 0;

    for (const user of users) {
      const batch = await this.createDigestBatch(user.user_id, digestType);

      if (batch) {
        // Queue digest email
        const userDetails = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [
          user.user_id,
        ]);

        if (userDetails.rows.length > 0) {
          await this.queueEmail({
            userId: user.user_id,
            recipientEmail: userDetails.rows[0].email,
            recipientName: userDetails.rows[0].full_name,
            subject: `Your ${digestType === 'daily_digest' ? 'Daily' : 'Weekly'} Digest`,
            bodyText: `You have ${batch.notification_count} new notifications.`,
            bodyHtml: `<h2>Your ${digestType === 'daily_digest' ? 'Daily' : 'Weekly'} Digest</h2><p>You have ${batch.notification_count} new notifications.</p>`,
            priority: 'normal',
          });

          // Mark batch as sent
          await pool.query(
            'UPDATE notification_batches SET status = $1, sent_at = NOW() WHERE id = $2',
            ['sent', batch.id]
          );

          digestsSent++;
        }
      }
    }

    return digestsSent;
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async sendBulkNotification(
    userIds: string[],
    notification: Omit<Notification, 'userId'>
  ): Promise<number> {
    let sent = 0;

    for (const userId of userIds) {
      try {
        await this.createNotification({
          ...notification,
          userId,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    return sent;
  }

  async archiveOldNotifications(days: number = 90): Promise<number> {
    const query = 'SELECT archive_old_notifications($1) as count';
    const result = await pool.query(query, [days]);
    return result.rows[0].count;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  async notifyForumReply(threadId: string, replyAuthorId: string, replyContent: string): Promise<void> {
    // Get thread details and followers
    const query = `
      SELECT
        dt.title,
        tf.user_id,
        u.full_name AS author_name
      FROM discussion_threads dt
      JOIN thread_followers tf ON dt.id = tf.thread_id
      JOIN users u ON u.id = $2
      WHERE dt.id = $1
        AND tf.user_id != $2
        AND tf.notify_on_reply = true
    `;

    const result = await pool.query(query, [threadId, replyAuthorId]);

    for (const row of result.rows) {
      await this.createNotification({
        userId: row.user_id,
        notificationType: 'forum_reply',
        title: `New reply to "${row.title}"`,
        message: `${row.author_name} replied to a thread you're following.`,
        actionUrl: `/forum/thread/${threadId}`,
        actionText: 'View Reply',
        relatedThreadId: threadId,
        relatedUserId: replyAuthorId,
        priority: 'normal',
      });
    }
  }

  async notifyAssignmentDue(courseId: string, assignmentName: string, dueDate: Date): Promise<void> {
    // Get enrolled students
    const query = `
      SELECT e.user_id
      FROM enrollments e
      JOIN notification_preferences np ON e.user_id = np.user_id
      WHERE e.course_id = $1
        AND e.completed = false
        AND np.assignment_deadline = true
    `;

    const result = await pool.query(query, [courseId]);

    for (const row of result.rows) {
      await this.createNotification({
        userId: row.user_id,
        notificationType: 'assignment_deadline',
        title: 'Assignment Due Soon',
        message: `"${assignmentName}" is due on ${dueDate.toLocaleDateString()}.`,
        actionUrl: `/courses/${courseId}`,
        actionText: 'View Assignment',
        relatedCourseId: courseId,
        priority: 'high',
      });
    }
  }
}

export const notificationService = new NotificationService();
