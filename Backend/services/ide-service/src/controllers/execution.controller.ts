import { Request, Response } from 'express';
import { z } from 'zod';
import { DockerSandbox } from '../services/docker.service';
import { executionStreamManager } from '../services/execution-stream.service';
import pool from '../db/pool';

// ── Validation Schemas ─────────────────────────────────────────────────────

const executeCodeSchema = z.object({
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'csharp']),
  code: z.string().min(1).max(50000),
  stdin: z.string().optional(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  memoryLimitMB: z.number().min(64).max(1024).optional(),
});

const submitCodeSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'csharp']),
  code: z.string().min(1).max(50000),
  fileName: z.string().optional(),
});

const runTestsSchema = z.object({
  lessonId: z.string().uuid(),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'csharp']),
  code: z.string().min(1).max(50000),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * Execute code in sandbox (non-graded, for testing)
 * POST /api/ide/execute
 */
export async function executeCode(req: Request, res: Response) {
  try {
    const data = executeCodeSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create execution record
    const executionResult = await pool.query(
      `INSERT INTO code_executions (user_id, language, code, stdin, status, timeout_ms, memory_limit_mb)
       VALUES ($1, $2, $3, $4, 'running', $5, $6)
       RETURNING id`,
      [
        userId,
        data.language,
        data.code,
        data.stdin || null,
        data.timeoutMs || 30000,
        data.memoryLimitMB || 256,
      ]
    );

    const executionId = executionResult.rows[0].id;

    // Execute in Docker sandbox
    const sandbox = new DockerSandbox();

    // Update status to running
    await pool.query(
      `UPDATE code_executions SET status = 'running', started_at = NOW() WHERE id = $1`,
      [executionId]
    );

    try {
      const result = await sandbox.execute({
        language: data.language,
        code: data.code,
        stdin: data.stdin,
        timeoutMs: data.timeoutMs,
        memoryLimitMB: data.memoryLimitMB,
      });

      // Update execution record with results
      const status = result.timedOut ? 'timeout' : result.exitCode === 0 ? 'completed' : 'failed';

      await pool.query(
        `UPDATE code_executions
         SET status = $1, stdout = $2, stderr = $3, exit_code = $4,
             execution_time_ms = $5, memory_used_kb = $6, completed_at = NOW()
         WHERE id = $7`,
        [status, result.stdout, result.stderr, result.exitCode, result.executionTimeMs, result.memoryUsedKB, executionId]
      );

      return res.json({
        executionId,
        status,
        output: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        },
        metrics: {
          executionTimeMs: result.executionTimeMs,
          memoryUsedKB: result.memoryUsedKB,
        },
        timedOut: result.timedOut,
      });
    } catch (error: any) {
      // Update execution record with error
      await pool.query(
        `UPDATE code_executions
         SET status = 'error', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [error.message, executionId]
      );

      return res.status(500).json({
        executionId,
        error: 'Execution failed',
        message: error.message,
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Execute code error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Submit code for grading
 * POST /api/ide/submit
 */
export async function submitCode(req: Request, res: Response) {
  try {
    const data = submitCodeSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if lesson exists and has test cases
    const testCasesResult = await pool.query(
      `SELECT * FROM test_cases WHERE lesson_id = $1 AND is_active = true ORDER BY display_order`,
      [data.lessonId]
    );

    if (testCasesResult.rows.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this lesson' });
    }

    // Get previous attempt number
    const attemptResult = await pool.query(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
       FROM code_submissions
       WHERE user_id = $1 AND lesson_id = $2`,
      [userId, data.lessonId]
    );

    const attemptNumber = attemptResult.rows[0].next_attempt;

    // Create submission record
    const submissionResult = await pool.query(
      `INSERT INTO code_submissions
       (user_id, lesson_id, course_id, code, language, file_name, status, attempt_number)
       VALUES ($1, $2, $3, $4, $5, $6, 'grading', $7)
       RETURNING id`,
      [userId, data.lessonId, data.courseId, data.code, data.language, data.fileName, attemptNumber]
    );

    const submissionId = submissionResult.rows[0].id;

    // Run tests
    const sandbox = new DockerSandbox();
    const testResults: any[] = [];
    let testsPassed = 0;
    let testsFailed = 0;
    let totalExecutionTime = 0;

    for (const testCase of testCasesResult.rows) {
      try {
        const result = await sandbox.execute({
          language: data.language,
          code: data.code,
          stdin: testCase.stdin,
          timeoutMs: testCase.timeout_ms || 5000,
          memoryLimitMB: 256,
        });

        totalExecutionTime += result.executionTimeMs;

        // Compare output
        const expectedStdout = testCase.ignore_whitespace
          ? testCase.expected_stdout?.trim()
          : testCase.expected_stdout;

        const actualStdout = testCase.ignore_whitespace
          ? result.stdout.trim()
          : result.stdout;

        const passed =
          actualStdout === expectedStdout &&
          result.exitCode === testCase.expected_exit_code &&
          !result.timedOut;

        if (passed) {
          testsPassed++;
        } else {
          testsFailed++;
        }

        testResults.push({
          name: testCase.name,
          passed,
          isHidden: testCase.is_hidden,
          points: passed ? testCase.points : 0,
          maxPoints: testCase.points,
          input: testCase.is_hidden ? '[hidden]' : testCase.stdin,
          expectedOutput: testCase.is_hidden ? '[hidden]' : expectedStdout,
          actualOutput: testCase.is_hidden && !passed ? '[hidden]' : actualStdout,
          executionTimeMs: result.executionTimeMs,
        });
      } catch (error: any) {
        testsFailed++;
        testResults.push({
          name: testCase.name,
          passed: false,
          isHidden: testCase.is_hidden,
          points: 0,
          maxPoints: testCase.points,
          error: error.message,
        });
      }
    }

    // Calculate score
    const totalPoints = testResults.reduce((sum, t) => sum + t.maxPoints, 0);
    const earnedPoints = testResults.reduce((sum, t) => sum + t.points, 0);
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = testsPassed === testCasesResult.rows.length;

    // Update submission with results
    await pool.query(
      `UPDATE code_submissions
       SET status = $1, score = $2, passed = $3,
           tests_passed = $4, tests_failed = $5, tests_total = $6,
           test_results = $7, execution_time_ms = $8,
           submitted_at = NOW(), graded_at = NOW()
       WHERE id = $9`,
      [
        'submitted',
        score,
        passed,
        testsPassed,
        testsFailed,
        testCasesResult.rows.length,
        JSON.stringify(testResults),
        totalExecutionTime,
        submissionId,
      ]
    );

    return res.json({
      submissionId,
      passed,
      score,
      attemptNumber,
      tests: {
        passed: testsPassed,
        failed: testsFailed,
        total: testCasesResult.rows.length,
      },
      results: testResults.filter(t => !t.isHidden || t.passed), // Only show hidden tests if they passed
      executionTimeMs: totalExecutionTime,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Submit code error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get submission details
 * GET /api/ide/submissions/:id
 */
export async function getSubmission(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT * FROM code_submissions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('[ide] Get submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * List user submissions for a lesson
 * GET /api/ide/submissions?lessonId=xxx
 */
export async function listSubmissions(req: Request, res: Response) {
  try {
    const { lessonId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId is required' });
    }

    const result = await pool.query(
      `SELECT id, lesson_id, course_id, language, status, score, passed,
              tests_passed, tests_failed, tests_total, attempt_number,
              submitted_at, created_at
       FROM code_submissions
       WHERE user_id = $1 AND lesson_id = $2
       ORDER BY created_at DESC`,
      [userId, lessonId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('[ide] List submissions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get code template for a lesson
 * GET /api/ide/templates/:lessonId/:language
 */
export async function getTemplate(req: Request, res: Response) {
  try {
    const { lessonId, language } = req.params;

    const result = await pool.query(
      `SELECT * FROM code_templates WHERE lesson_id = $1 AND language = $2`,
      [lessonId, language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('[ide] Get template error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Run tests on code without submitting
 * POST /api/ide/test
 */
export async function runTests(req: Request, res: Response) {
  try {
    const data = runTestsSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get visible test cases only
    const testCasesResult = await pool.query(
      `SELECT * FROM test_cases
       WHERE lesson_id = $1 AND is_active = true AND is_hidden = false
       ORDER BY display_order`,
      [data.lessonId]
    );

    if (testCasesResult.rows.length === 0) {
      return res.status(400).json({ error: 'No visible test cases found' });
    }

    // Run tests
    const sandbox = new DockerSandbox();
    const testResults: any[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    for (const testCase of testCasesResult.rows) {
      try {
        const result = await sandbox.execute({
          language: data.language,
          code: data.code,
          stdin: testCase.stdin,
          timeoutMs: testCase.timeout_ms || 5000,
          memoryLimitMB: 256,
        });

        const expectedStdout = testCase.ignore_whitespace
          ? testCase.expected_stdout?.trim()
          : testCase.expected_stdout;

        const actualStdout = testCase.ignore_whitespace
          ? result.stdout.trim()
          : result.stdout;

        const passed =
          actualStdout === expectedStdout &&
          result.exitCode === testCase.expected_exit_code &&
          !result.timedOut;

        if (passed) {
          testsPassed++;
        } else {
          testsFailed++;
        }

        testResults.push({
          name: testCase.name,
          description: testCase.description,
          passed,
          input: testCase.stdin,
          expectedOutput: expectedStdout,
          actualOutput: actualStdout,
          executionTimeMs: result.executionTimeMs,
        });
      } catch (error: any) {
        testsFailed++;
        testResults.push({
          name: testCase.name,
          passed: false,
          error: error.message,
        });
      }
    }

    return res.json({
      passed: testsPassed,
      failed: testsFailed,
      total: testCasesResult.rows.length,
      results: testResults,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Run tests error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Execute code with streaming output
 * POST /api/ide/execute-stream
 *
 * Client should connect to WebSocket at /ws/execution?executionId=<id>
 * before calling this endpoint
 */
export async function executeCodeStream(req: Request, res: Response) {
  try {
    const data = executeCodeSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create execution record
    const executionResult = await pool.query(
      `INSERT INTO code_executions (user_id, language, code, stdin, status, timeout_ms, memory_limit_mb)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING id`,
      [
        userId,
        data.language,
        data.code,
        data.stdin || null,
        data.timeoutMs || 30000,
        data.memoryLimitMB || 256,
      ]
    );

    const executionId = executionResult.rows[0].id;

    // Return execution ID immediately
    res.json({
      executionId,
      message: 'Connect to WebSocket at /ws/execution?executionId=' + executionId,
    });

    // Execute with streaming in background
    setImmediate(async () => {
      await pool.query(
        `UPDATE code_executions SET status = 'running', started_at = NOW() WHERE id = $1`,
        [executionId]
      );

      try {
        await executionStreamManager.executeWithStream({
          executionId,
          language: data.language,
          code: data.code,
          stdin: data.stdin,
          timeoutMs: data.timeoutMs,
          memoryLimitMB: data.memoryLimitMB,
        });

        // Update execution record with completed status
        await pool.query(
          `UPDATE code_executions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [executionId]
        );
      } catch (error: any) {
        // Update execution record with error
        await pool.query(
          `UPDATE code_executions SET status = 'error', error_message = $1, completed_at = NOW() WHERE id = $2`,
          [error.message, executionId]
        );
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[ide] Execute stream error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
