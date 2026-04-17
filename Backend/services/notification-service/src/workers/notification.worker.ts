import { Job } from 'bull';
import {
  notificationQueue,
  emailQueue,
  slackQueue,
  spacedRepetitionQueue,
  NotificationJobData,
  EmailJobData,
  SlackJobData,
  SpacedRepetitionJobData,
  queueEmail,
  queueSlackMessage,
} from '../queues/notification.queue';
import { emailService } from '../services/email.service';
import { slackService } from '../services/slack.service';
import pool from '../db/pool';

// ── Notification Worker ────────────────────────────────────────────────────

notificationQueue.process(async (job: Job<NotificationJobData>) => {
  const { notificationId, userId, channel, type, subject, body, actionUrl, metadata, templateId, templateVariables } =
    job.data;

  console.log(`[worker:notification] Processing notification ${notificationId} for user ${userId} via ${channel}`);

  try {
    // Update notification status to 'queued'
    await pool.query(
      `UPDATE notifications SET status = 'queued', updated_at = NOW() WHERE id = $1`,
      [notificationId]
    );

    // Get user preferences
    const prefsResult = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    const preferences = prefsResult.rows[0];

    // Check if channel is enabled for user
    if (preferences) {
      const channelEnabled =
        (channel === 'email' && preferences.email_enabled) ||
        (channel === 'slack' && preferences.slack_enabled) ||
        (channel === 'in_app' && preferences.in_app_enabled) ||
        (channel === 'push' && preferences.push_enabled) ||
        (channel === 'sms' && preferences.sms_enabled);

      if (!channelEnabled) {
        console.log(`[worker:notification] Channel ${channel} disabled for user ${userId}`);
        await pool.query(
          `UPDATE notifications SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
          [notificationId]
        );
        return;
      }

      // Check type-specific preferences
      const typePrefs = preferences.type_preferences?.[type];
      if (typePrefs && typePrefs[channel] === false) {
        console.log(`[worker:notification] Type ${type} disabled for channel ${channel} for user ${userId}`);
        await pool.query(
          `UPDATE notifications SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
          [notificationId]
        );
        return;
      }

      // Check quiet hours
      if (channel === 'email' || channel === 'push' || channel === 'sms') {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: preferences.timezone || 'UTC',
        });

        if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
          const start = preferences.quiet_hours_start;
          const end = preferences.quiet_hours_end;

          if (currentTime >= start && currentTime <= end) {
            // Reschedule after quiet hours end
            const delay = calculateDelayUntilQuietHoursEnd(preferences.quiet_hours_end);
            console.log(`[worker:notification] Delaying notification ${notificationId} due to quiet hours`);

            await pool.query(
              `UPDATE notifications SET scheduled_for = NOW() + INTERVAL '${delay} milliseconds' WHERE id = $1`,
              [notificationId]
            );

            throw new Error('Quiet hours - will retry');
          }
        }
      }
    }

    // Route to appropriate channel queue
    switch (channel) {
      case 'email':
        await handleEmailChannel(job.data, preferences);
        break;

      case 'slack':
        await handleSlackChannel(job.data, preferences);
        break;

      case 'in_app':
        await handleInAppChannel(job.data);
        break;

      case 'push':
        await handlePushChannel(job.data, preferences);
        break;

      case 'sms':
        await handleSMSChannel(job.data, preferences);
        break;

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    // Log success
    await pool.query(
      `INSERT INTO notification_logs (notification_id, event, channel, created_at)
       VALUES ($1, 'queued', $2, NOW())`,
      [notificationId, channel]
    );

    console.log(`[worker:notification] Notification ${notificationId} queued for ${channel}`);
  } catch (error: any) {
    console.error(`[worker:notification] Failed to process notification ${notificationId}:`, error.message);

    // Update retry count and status
    await pool.query(
      `UPDATE notifications
       SET retry_count = retry_count + 1,
           next_retry_at = CASE
             WHEN retry_count + 1 < max_retries
             THEN NOW() + INTERVAL '5 minutes'
             ELSE NULL
           END,
           status = CASE
             WHEN retry_count + 1 >= max_retries
             THEN 'failed'::notification_status
             ELSE 'pending'::notification_status
           END,
           failure_reason = $2,
           failed_at = CASE
             WHEN retry_count + 1 >= max_retries
             THEN NOW()
             ELSE NULL
           END
       WHERE id = $1`,
      [notificationId, error.message]
    );

    throw error;
  }
});

// ── Email Worker ───────────────────────────────────────────────────────────

emailQueue.process(async (job: Job<EmailJobData>) => {
  const { notificationId, to, subject, html, text, from, attachments } = job.data;

  console.log(`[worker:email] Sending email to ${to}`);

  try {
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      attachments,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Update notification status
    await pool.query(
      `UPDATE notifications
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [notificationId]
    );

    // Log success
    await pool.query(
      `INSERT INTO notification_logs (notification_id, event, channel, provider, provider_id)
       VALUES ($1, 'sent', 'email', 'sendgrid', $2)`,
      [notificationId, result.messageId]
    );

    console.log(`[worker:email] Email sent successfully: ${result.messageId}`);
  } catch (error: any) {
    console.error(`[worker:email] Failed to send email:`, error.message);

    // Log failure
    await pool.query(
      `INSERT INTO notification_logs (notification_id, event, channel, error_message)
       VALUES ($1, 'failed', 'email', $2)`,
      [notificationId, error.message]
    );

    throw error;
  }
});

// ── Slack Worker ───────────────────────────────────────────────────────────

slackQueue.process(async (job: Job<SlackJobData>) => {
  const { notificationId, webhookUrl, type, data } = job.data;

  console.log(`[worker:slack] Sending Slack notification type: ${type}`);

  try {
    const result = await slackService.sendNotification(webhookUrl, type, data);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Update notification status
    await pool.query(
      `UPDATE notifications
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [notificationId]
    );

    // Log success
    await pool.query(
      `INSERT INTO notification_logs (notification_id, event, channel, provider)
       VALUES ($1, 'sent', 'slack', 'slack_webhook')`,
      [notificationId]
    );

    console.log(`[worker:slack] Slack notification sent successfully`);
  } catch (error: any) {
    console.error(`[worker:slack] Failed to send Slack notification:`, error.message);

    // Log failure
    await pool.query(
      `INSERT INTO notification_logs (notification_id, event, channel, error_message)
       VALUES ($1, 'failed', 'slack', $2)`,
      [notificationId, error.message]
    );

    throw error;
  }
});

// ── Spaced Repetition Worker ───────────────────────────────────────────────

spacedRepetitionQueue.process(async (job: Job<SpacedRepetitionJobData>) => {
  const { userId, contentId, contentType, scheduleId } = job.data;

  console.log(`[worker:spaced-rep] Processing review reminder for user ${userId}, content ${contentId}`);

  try {
    // Get schedule details
    const scheduleResult = await pool.query(
      `SELECT * FROM spaced_repetition_schedule WHERE id = $1 AND is_active = true`,
      [scheduleId]
    );

    if (scheduleResult.rows.length === 0) {
      console.log(`[worker:spaced-rep] Schedule ${scheduleId} not found or inactive`);
      return;
    }

    const schedule = scheduleResult.rows[0];

    // Get content details (from course service - placeholder for now)
    const contentName = `${contentType} ${contentId}`;
    const reviewUrl = `${process.env.FRONTEND_URL}/review/${contentId}`;

    // Create notification
    const notificationResult = await pool.query(
      `INSERT INTO notifications (
        user_id, type, channel, priority, subject, body, action_url, metadata
      )
      VALUES ($1, 'spaced_repetition', 'email', 'normal', $2, $3, $4, $5)
      RETURNING id`,
      [
        userId,
        `Time to review: ${contentName}`,
        `It's time to review ${contentName} to reinforce your learning.`,
        reviewUrl,
        JSON.stringify({ contentId, contentType, scheduleId }),
      ]
    );

    const notificationId = notificationResult.rows[0].id;

    // Queue the notification
    await queueEmail({
      notificationId,
      to: userId, // Should be user email
      subject: `Time to review: ${contentName}`,
      html: `
        <h2>Review Time!</h2>
        <p>It's time to review <strong>${contentName}</strong> to reinforce your learning.</p>
        <p>Regular reviews help improve long-term retention.</p>
        <p><a href="${reviewUrl}">Start Review →</a></p>
      `,
    });

    console.log(`[worker:spaced-rep] Review reminder created and queued`);
  } catch (error: any) {
    console.error(`[worker:spaced-rep] Failed to process spaced repetition:`, error.message);
    throw error;
  }
});

// ── Helper Functions ───────────────────────────────────────────────────────

async function handleEmailChannel(data: NotificationJobData, preferences: any) {
  await queueEmail({
    notificationId: data.notificationId,
    to: data.userId, // Should be user email
    subject: data.subject || 'Notification from TechLearn',
    html: data.body,
  });
}

async function handleSlackChannel(data: NotificationJobData, preferences: any) {
  if (!preferences?.slack_webhook_url) {
    throw new Error('Slack webhook URL not configured');
  }

  await queueSlackMessage({
    notificationId: data.notificationId,
    webhookUrl: preferences.slack_webhook_url,
    type: data.type,
    data: data.metadata || {},
    message: {},
  });
}

async function handleInAppChannel(data: NotificationJobData) {
  // In-app notifications are stored in DB and pushed via WebSocket
  await pool.query(
    `UPDATE notifications
     SET status = 'delivered', sent_at = NOW(), delivered_at = NOW()
     WHERE id = $1`,
    [data.notificationId]
  );

  // WebSocket push happens in real-time via the notification service
  console.log(`[worker:notification] In-app notification ${data.notificationId} marked as delivered`);
}

async function handlePushChannel(data: NotificationJobData, preferences: any) {
  // Push notification handling (FCM, APNS, etc.)
  // Placeholder for now
  console.log(`[worker:notification] Push notifications not yet implemented`);
  throw new Error('Push notifications not yet implemented');
}

async function handleSMSChannel(data: NotificationJobData, preferences: any) {
  // SMS handling (Twilio, etc.)
  // Placeholder for now
  console.log(`[worker:notification] SMS notifications not yet implemented`);
  throw new Error('SMS notifications not yet implemented');
}

function calculateDelayUntilQuietHoursEnd(endTime: string): number {
  const now = new Date();
  const [hours, minutes, seconds] = endTime.split(':').map(Number);

  const endDateTime = new Date(now);
  endDateTime.setHours(hours, minutes, seconds || 0);

  if (endDateTime < now) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return endDateTime.getTime() - now.getTime();
}

console.log('[worker] ✅ All workers initialized and processing');
