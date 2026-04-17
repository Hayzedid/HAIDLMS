import pool from '../db/pool';
import { emailService } from './email.service';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channel: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  defaultPriority: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderOptions {
  templateId?: string;
  templateName?: string;
  variables: Record<string, any>;
}

export class TemplateService {
  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_templates WHERE id = $1 AND is_active = true`,
        [templateId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToTemplate(result.rows[0]);
    } catch (error) {
      console.error('[template] Failed to get template by ID:', error);
      return null;
    }
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string, channel: string): Promise<NotificationTemplate | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_templates
         WHERE name = $1 AND channel = $2 AND is_active = true
         ORDER BY version DESC
         LIMIT 1`,
        [name, channel]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToTemplate(result.rows[0]);
    } catch (error) {
      console.error('[template] Failed to get template by name:', error);
      return null;
    }
  }

  /**
   * Get all templates for a type
   */
  async getTemplatesByType(type: string): Promise<NotificationTemplate[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_templates
         WHERE type = $1 AND is_active = true
         ORDER BY channel, version DESC`,
        [type]
      );

      return result.rows.map(this.mapToTemplate);
    } catch (error) {
      console.error('[template] Failed to get templates by type:', error);
      return [];
    }
  }

  /**
   * List all active templates
   */
  async listTemplates(): Promise<NotificationTemplate[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM notification_templates
         WHERE is_active = true
         ORDER BY type, channel, name`
      );

      return result.rows.map(this.mapToTemplate);
    } catch (error) {
      console.error('[template] Failed to list templates:', error);
      return [];
    }
  }

  /**
   * Create new template
   */
  async createTemplate(data: {
    name: string;
    type: string;
    channel: string;
    subjectTemplate?: string;
    bodyTemplate: string;
    variables: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
    defaultPriority?: string;
  }): Promise<NotificationTemplate> {
    try {
      const result = await pool.query(
        `INSERT INTO notification_templates (
          name, type, channel, subject_template, body_template,
          variables, default_priority
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.name,
          data.type,
          data.channel,
          data.subjectTemplate || null,
          data.bodyTemplate,
          JSON.stringify(data.variables),
          data.defaultPriority || 'normal',
        ]
      );

      console.log(`[template] Template created: ${data.name}`);

      return this.mapToTemplate(result.rows[0]);
    } catch (error) {
      console.error('[template] Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Update template (creates new version)
   */
  async updateTemplate(
    templateId: string,
    data: {
      subjectTemplate?: string;
      bodyTemplate?: string;
      variables?: Array<{
        name: string;
        description: string;
        required: boolean;
      }>;
      defaultPriority?: string;
    }
  ): Promise<NotificationTemplate> {
    try {
      // Get current template
      const current = await this.getTemplateById(templateId);
      if (!current) {
        throw new Error('Template not found');
      }

      // Create new version
      const result = await pool.query(
        `INSERT INTO notification_templates (
          name, type, channel, subject_template, body_template,
          variables, default_priority, version
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          current.name,
          current.type,
          current.channel,
          data.subjectTemplate ?? current.subjectTemplate,
          data.bodyTemplate ?? current.bodyTemplate,
          JSON.stringify(data.variables ?? current.variables),
          data.defaultPriority ?? current.defaultPriority,
          current.version + 1,
        ]
      );

      // Deactivate old version
      await pool.query(
        `UPDATE notification_templates SET is_active = false WHERE id = $1`,
        [templateId]
      );

      console.log(`[template] Template updated: ${current.name} v${current.version + 1}`);

      return this.mapToTemplate(result.rows[0]);
    } catch (error) {
      console.error('[template] Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete template (deactivate)
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE notification_templates SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [templateId]
      );

      console.log(`[template] Template deleted: ${templateId}`);
    } catch (error) {
      console.error('[template] Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  async renderTemplate(options: RenderOptions): Promise<{
    subject?: string;
    body: string;
    template: NotificationTemplate;
  }> {
    try {
      // Get template
      let template: NotificationTemplate | null = null;

      if (options.templateId) {
        template = await this.getTemplateById(options.templateId);
      } else if (options.templateName) {
        // Extract channel from variables or default to email
        const channel = options.variables.channel || 'email';
        template = await this.getTemplateByName(options.templateName, channel);
      }

      if (!template) {
        throw new Error('Template not found');
      }

      // Validate required variables
      this.validateVariables(template, options.variables);

      // Render subject (if exists)
      let subject: string | undefined;
      if (template.subjectTemplate) {
        subject = emailService.renderTemplate(template.subjectTemplate, options.variables);
      }

      // Render body
      const body = emailService.renderTemplate(template.bodyTemplate, options.variables);

      return {
        subject,
        body,
        template,
      };
    } catch (error) {
      console.error('[template] Failed to render template:', error);
      throw error;
    }
  }

  /**
   * Validate template variables
   */
  private validateVariables(template: NotificationTemplate, variables: Record<string, any>): void {
    const requiredVars = template.variables.filter((v) => v.required);

    for (const requiredVar of requiredVars) {
      if (!(requiredVar.name in variables) || variables[requiredVar.name] === undefined) {
        throw new Error(`Missing required variable: ${requiredVar.name}`);
      }
    }
  }

  /**
   * Test template rendering
   */
  async testTemplate(
    templateId: string,
    testVariables: Record<string, any>
  ): Promise<{
    success: boolean;
    subject?: string;
    body?: string;
    error?: string;
  }> {
    try {
      const rendered = await this.renderTemplate({
        templateId,
        variables: testVariables,
      });

      return {
        success: true,
        subject: rendered.subject,
        body: rendered.body,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    lastUsed?: Date;
  }> {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_sent,
           COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
           COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
           MAX(sent_at) as last_used
         FROM notifications
         WHERE template_id = $1`,
        [templateId]
      );

      const row = result.rows[0];

      return {
        totalSent: parseInt(row.total_sent) || 0,
        totalDelivered: parseInt(row.total_delivered) || 0,
        totalFailed: parseInt(row.total_failed) || 0,
        lastUsed: row.last_used,
      };
    } catch (error) {
      console.error('[template] Failed to get template stats:', error);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
      };
    }
  }

  /**
   * Map database row to NotificationTemplate
   */
  private mapToTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      channel: row.channel,
      subjectTemplate: row.subject_template,
      bodyTemplate: row.body_template,
      variables: row.variables || [],
      defaultPriority: row.default_priority,
      version: row.version,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton instance
export const templateService = new TemplateService();
