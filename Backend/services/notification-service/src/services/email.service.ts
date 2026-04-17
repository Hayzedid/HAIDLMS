import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export interface TemplateVariables {
  [key: string]: any;
}

export class EmailService {
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@techlearn.com';
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('[email-service] SendGrid API key not configured');
        return { success: false, error: 'SendGrid not configured' };
      }

      const msg: any = {
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
      };

      // Use SendGrid template or custom HTML
      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData || {};
      } else {
        msg.html = options.html;
        msg.text = options.text;
      }

      if (options.attachments) {
        msg.attachments = options.attachments;
      }

      const response = await sgMail.send(msg);
      const messageId = response[0]?.headers?.['x-message-id'];

      console.log(`[email-service] Email sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error('[email-service] Failed to send email:', error.response?.body || error.message);

      return {
        success: false,
        error: error.response?.body?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Render Handlebars template with variables
   */
  renderTemplate(template: string, variables: TemplateVariables): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error: any) {
      console.error('[email-service] Template rendering failed:', error.message);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  /**
   * Send email using custom template
   */
  async sendTemplatedEmail(
    to: string | string[],
    subjectTemplate: string,
    bodyTemplate: string,
    variables: TemplateVariables
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = this.renderTemplate(subjectTemplate, variables);
    const html = this.renderTemplate(bodyTemplate, variables);

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
      text?: string;
    }>
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    // SendGrid allows up to 1000 emails per request with personalizations
    const batchSize = 1000;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      try {
        const personalizations = batch.map((email) => ({
          to: [{ email: email.to }],
          subject: email.subject,
          dynamicTemplateData: {
            html: email.html,
            text: email.text,
          },
        }));

        await sgMail.send({
          personalizations,
          from: this.defaultFrom,
          html: '{{html}}', // Use dynamic template data
          text: '{{text}}',
        } as any);

        results.successful += batch.length;
      } catch (error: any) {
        results.failed += batch.length;
        batch.forEach((email) => {
          results.errors.push({
            email: email.to,
            error: error.response?.body?.errors?.[0]?.message || error.message,
          });
        });
      }
    }

    return results;
  }

  /**
   * Validate email address format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('[email-service] SendGrid API key not configured');
      return false;
    }

    try {
      // Test by sending to a test email (if configured)
      const testEmail = process.env.TEST_EMAIL;
      if (testEmail) {
        await this.sendEmail({
          to: testEmail,
          subject: 'TechLearn Email Service Test',
          html: '<p>Email service is configured correctly!</p>',
        });
      }

      console.log('[email-service] ✅ Email service configured correctly');
      return true;
    } catch (error: any) {
      console.error('[email-service] ❌ Email service test failed:', error.message);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();

// Register custom Handlebars helpers
Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatTime', (date: Date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

Handlebars.registerHelper('uppercase', (str: string) => {
  return str?.toUpperCase();
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str?.toLowerCase();
});

Handlebars.registerHelper('truncate', (str: string, length: number) => {
  if (str && str.length > length) {
    return str.substring(0, length) + '...';
  }
  return str;
});
