import { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../db/pool';

// ── Validation Schemas ─────────────────────────────────────────────────────

const createTestCaseSchema = z.object({
  lessonId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  stdin: z.string().optional(),
  expectedStdout: z.string().optional(),
  expectedStderr: z.string().optional(),
  expectedExitCode: z.number().int().optional().default(0),
  isHidden: z.boolean().optional().default(false),
  ignoreWhitespace: z.boolean().optional().default(true),
  ignoreCase: z.boolean().optional().default(false),
  timeoutMs: z.number().min(1000).max(30000).optional().default(5000),
  points: z.number().int().min(0).optional().default(10),
});

const updateTestCaseSchema = createTestCaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const createTemplateSchema = z.object({
  lessonId: z.string().uuid(),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'csharp']),
  starterCode: z.string().min(1).max(50000),
  solutionCode: z.string().optional(),
  files: z.array(z.object({
    name: z.string(),
    content: z.string(),
    language: z.string(),
  })).optional(),
  testCommand: z.string().max(500).optional(),
  buildCommand: z.string().max(500).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

// ── Test Case Controllers ──────────────────────────────────────────────────

/**
 * Create test case for a lesson
 * POST /api/ide/admin/test-cases
 */
export async function createTestCase(req: Request, res: Response) {
  try {
    const data = createTestCaseSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO test_cases (
        lesson_id, name, description, display_order,
        stdin, expected_stdout, expected_stderr, expected_exit_code,
        is_hidden, ignore_whitespace, ignore_case, timeout_ms, points
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.lessonId,
        data.name,
        data.description || null,
        data.displayOrder || 0,
        data.stdin || null,
        data.expectedStdout || null,
        data.expectedStderr || null,
        data.expectedExitCode,
        data.isHidden,
        data.ignoreWhitespace,
        data.ignoreCase,
        data.timeoutMs,
        data.points,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Create test case error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get test cases for a lesson
 * GET /api/ide/admin/test-cases/:lessonId
 */
export async function getTestCases(req: Request, res: Response) {
  try {
    const { lessonId } = req.params;

    const result = await pool.query(
      `SELECT * FROM test_cases WHERE lesson_id = $1 ORDER BY display_order, created_at`,
      [lessonId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('[ide] Get test cases error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update test case
 * PATCH /api/ide/admin/test-cases/:id
 */
export async function updateTestCase(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateTestCaseSchema.parse(req.body);

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.displayOrder !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(data.displayOrder);
    }
    if (data.stdin !== undefined) {
      updates.push(`stdin = $${paramCount++}`);
      values.push(data.stdin);
    }
    if (data.expectedStdout !== undefined) {
      updates.push(`expected_stdout = $${paramCount++}`);
      values.push(data.expectedStdout);
    }
    if (data.expectedStderr !== undefined) {
      updates.push(`expected_stderr = $${paramCount++}`);
      values.push(data.expectedStderr);
    }
    if (data.expectedExitCode !== undefined) {
      updates.push(`expected_exit_code = $${paramCount++}`);
      values.push(data.expectedExitCode);
    }
    if (data.isHidden !== undefined) {
      updates.push(`is_hidden = $${paramCount++}`);
      values.push(data.isHidden);
    }
    if (data.ignoreWhitespace !== undefined) {
      updates.push(`ignore_whitespace = $${paramCount++}`);
      values.push(data.ignoreWhitespace);
    }
    if (data.ignoreCase !== undefined) {
      updates.push(`ignore_case = $${paramCount++}`);
      values.push(data.ignoreCase);
    }
    if (data.timeoutMs !== undefined) {
      updates.push(`timeout_ms = $${paramCount++}`);
      values.push(data.timeoutMs);
    }
    if (data.points !== undefined) {
      updates.push(`points = $${paramCount++}`);
      values.push(data.points);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE test_cases SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test case not found' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Update test case error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete test case
 * DELETE /api/ide/admin/test-cases/:id
 */
export async function deleteTestCase(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM test_cases WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test case not found' });
    }

    return res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('[ide] Delete test case error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Template Controllers ───────────────────────────────────────────────────

/**
 * Create code template for a lesson
 * POST /api/ide/admin/templates
 */
export async function createTemplate(req: Request, res: Response) {
  try {
    const data = createTemplateSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO code_templates (
        lesson_id, language, starter_code, solution_code,
        files, test_command, build_command
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.lessonId,
        data.language,
        data.starterCode,
        data.solutionCode || null,
        data.files ? JSON.stringify(data.files) : null,
        data.testCommand || null,
        data.buildCommand || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Template already exists for this lesson and language' });
    }
    console.error('[ide] Create template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get templates for a lesson
 * GET /api/ide/admin/templates/:lessonId
 */
export async function getTemplates(req: Request, res: Response) {
  try {
    const { lessonId } = req.params;

    const result = await pool.query(
      `SELECT * FROM code_templates WHERE lesson_id = $1 ORDER BY language`,
      [lessonId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('[ide] Get templates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update template
 * PATCH /api/ide/admin/templates/:id
 */
export async function updateTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.starterCode !== undefined) {
      updates.push(`starter_code = $${paramCount++}`);
      values.push(data.starterCode);
    }
    if (data.solutionCode !== undefined) {
      updates.push(`solution_code = $${paramCount++}`);
      values.push(data.solutionCode);
    }
    if (data.files !== undefined) {
      updates.push(`files = $${paramCount++}`);
      values.push(JSON.stringify(data.files));
    }
    if (data.testCommand !== undefined) {
      updates.push(`test_command = $${paramCount++}`);
      values.push(data.testCommand);
    }
    if (data.buildCommand !== undefined) {
      updates.push(`build_command = $${paramCount++}`);
      values.push(data.buildCommand);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE code_templates SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Update template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete template
 * DELETE /api/ide/admin/templates/:id
 */
export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM code_templates WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('[ide] Delete template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get execution statistics
 * GET /api/ide/admin/stats?startDate=&endDate=
 */
export async function getExecutionStats(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    let query = `SELECT * FROM execution_stats`;
    const params: any[] = [];

    if (startDate || endDate) {
      query += ` WHERE`;
      const conditions: string[] = [];

      if (startDate) {
        conditions.push(` date >= $${params.length + 1}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(` date <= $${params.length + 1}`);
        params.push(endDate);
      }

      query += conditions.join(' AND');
    }

    query += ` ORDER BY date DESC, language`;

    const result = await pool.query(query, params);

    return res.json(result.rows);
  } catch (error) {
    console.error('[ide] Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
