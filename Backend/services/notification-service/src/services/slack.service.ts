import axios from 'axios';

export interface SlackMessage {
  text?: string;
  blocks?: Array<any>;
  attachments?: Array<any>;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  thread_ts?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<any>;
  accessory?: any;
}

export class SlackService {
  /**
   * Send message via Slack Webhook
   */
  async sendWebhookMessage(
    webhookUrl: string,
    message: SlackMessage
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!webhookUrl) {
        return { success: false, error: 'Webhook URL not provided' };
      }

      await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[slack-service] Message sent successfully via webhook');

      return { success: true };
    } catch (error: any) {
      console.error('[slack-service] Webhook message failed:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Build rich message blocks for Slack
   */
  buildRichMessage(options: {
    title: string;
    text: string;
    color?: string;
    actionUrl?: string;
    actionText?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }): SlackMessage {
    const { title, text, color = '#3b82f6', actionUrl, actionText = 'View', fields } = options;

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
    ];

    // Add fields if provided
    if (fields && fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map((field) => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })) as any,
      });
    }

    // Add action button if URL provided
    if (actionUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: actionText,
              emoji: true,
            },
            url: actionUrl,
            style: 'primary',
          },
        ],
      });
    }

    blocks.push({
      type: 'divider',
    } as any);

    return {
      blocks,
      attachments: [
        {
          color,
          footer: 'TechLearn LMS',
          footer_icon: 'https://techlearn.com/icon.png',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
  }

  /**
   * Format notification for Slack
   */
  formatNotification(type: string, data: Record<string, any>): SlackMessage {
    switch (type) {
      case 'course_enrollment':
        return this.buildRichMessage({
          title: '📚 New Course Enrollment',
          text: `*${data.userName}* enrolled in *${data.courseName}*`,
          color: '#10b981',
          actionUrl: data.courseUrl,
          actionText: 'View Course',
        });

      case 'lesson_completed':
        return this.buildRichMessage({
          title: '✓ Lesson Completed',
          text: `*${data.userName}* completed *${data.lessonName}*`,
          color: '#3b82f6',
          fields: [
            { title: 'Course', value: data.courseName, short: true },
            { title: 'Progress', value: `${data.completionPercent}%`, short: true },
          ],
        });

      case 'certificate_issued':
        return this.buildRichMessage({
          title: '🎓 Certificate Issued',
          text: `*${data.userName}* earned a certificate for *${data.courseName}*!`,
          color: '#f59e0b',
          actionUrl: data.certificateUrl,
          actionText: 'View Certificate',
        });

      case 'assignment_due':
        return this.buildRichMessage({
          title: '⏰ Assignment Due Soon',
          text: `*${data.assignmentName}* is due ${data.remainingTime}`,
          color: '#ef4444',
          actionUrl: data.assignmentUrl,
          actionText: 'View Assignment',
        });

      case 'payment_success':
        return this.buildRichMessage({
          title: '💰 Payment Received',
          text: `Payment of *${data.amount}* received from *${data.userName}*`,
          color: '#10b981',
          fields: [
            { title: 'Course', value: data.courseName, short: true },
            { title: 'Receipt', value: data.receiptNumber, short: true },
          ],
        });

      case 'payment_failed':
        return this.buildRichMessage({
          title: '❌ Payment Failed',
          text: `Payment failed for *${data.userName}* - ${data.reason}`,
          color: '#ef4444',
          fields: [
            { title: 'Course', value: data.courseName, short: true },
            { title: 'Amount', value: data.amount, short: true },
          ],
        });

      case 'system_alert':
        return this.buildRichMessage({
          title: '🚨 System Alert',
          text: data.message,
          color: '#dc2626',
          fields: data.fields,
        });

      default:
        return {
          text: data.message || 'Notification from TechLearn',
        };
    }
  }

  /**
   * Send notification to Slack
   */
  async sendNotification(
    webhookUrl: string,
    type: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const message = this.formatNotification(type, data);
    return this.sendWebhookMessage(webhookUrl, message);
  }

  /**
   * Send simple text message
   */
  async sendTextMessage(
    webhookUrl: string,
    text: string,
    channel?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendWebhookMessage(webhookUrl, {
      text,
      channel,
    });
  }

  /**
   * Test Slack webhook configuration
   */
  async testWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const result = await this.sendWebhookMessage(webhookUrl, {
        text: '✅ Slack integration test successful!',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*TechLearn Notification Service* is configured correctly!',
            },
          },
        ],
      });

      return result.success;
    } catch (error) {
      console.error('[slack-service] Webhook test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const slackService = new SlackService();
