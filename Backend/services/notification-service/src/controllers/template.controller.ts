import { Request, Response } from 'express';
import { z } from 'zod';
import { templateService } from '../services/template.service';

// ── Validation Schemas ─────────────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
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
  channel: z.enum(['email', 'slack', 'in_app', 'push', 'sms']),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().min(1),
  variables: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
    })
  ),
  defaultPriority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const updateTemplateSchema = z.object({
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().optional(),
  variables: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
    })
  ).optional(),
  defaultPriority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const testTemplateSchema = z.object({
  variables: z.record(z.any()),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * List all templates
 * GET /api/templates
 */
export async function listTemplates(req: Request, res: Response) {
  try {
    const templates = await templateService.listTemplates();

    return res.json(templates);
  } catch (error) {
    console.error('[template-controller] List templates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get template by ID
 * GET /api/templates/:id
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const template = await templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json(template);
  } catch (error) {
    console.error('[template-controller] Get template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get templates by type
 * GET /api/templates/type/:type
 */
export async function getTemplatesByType(req: Request, res: Response) {
  try {
    const { type } = req.params;

    const templates = await templateService.getTemplatesByType(type);

    return res.json(templates);
  } catch (error) {
    console.error('[template-controller] Get templates by type error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create template
 * POST /api/templates
 */
export async function createTemplate(req: Request, res: Response) {
  try {
    const data = createTemplateSchema.parse(req.body);

    const template = await templateService.createTemplate(data);

    return res.status(201).json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[template-controller] Create template error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Update template (creates new version)
 * PATCH /api/templates/:id
 */
export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const template = await templateService.updateTemplate(id, data);

    return res.json(template);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[template-controller] Update template error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Delete template (deactivate)
 * DELETE /api/templates/:id
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await templateService.deleteTemplate(id);

    return res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('[template-controller] Delete template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Test template rendering
 * POST /api/templates/:id/test
 */
export async function testTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = testTemplateSchema.parse(req.body);

    const result = await templateService.testTemplate(id, data.variables);

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[template-controller] Test template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get template statistics
 * GET /api/templates/:id/stats
 */
export async function getTemplateStats(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const stats = await templateService.getTemplateStats(id);

    return res.json(stats);
  } catch (error) {
    console.error('[template-controller] Get template stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
