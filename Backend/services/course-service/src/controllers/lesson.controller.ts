import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── Get Lesson ────────────────────────────────────────────────────────────
export const getLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT l.*, m.course_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE l.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Lesson not found' });
    return;
  }

  const lesson = result.rows[0];

  // Check if user is enrolled (for students)
  if (req.user?.role === 'student') {
    const enrollmentCheck = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
      [req.user.userId, lesson.course_id, 'active']
    );

    if (enrollmentCheck.rows.length === 0 && !lesson.is_preview) {
      res.status(403).json({ success: false, message: 'Not enrolled in this course' });
      return;
    }
  }

  // Hide solution for code exercises from students
  if (lesson.lesson_type === 'code' && req.user?.role === 'student') {
    delete lesson.code_solution;
  }

  res.json({ success: true, data: lesson });
};

// ── Create Lesson ─────────────────────────────────────────────────────────
export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { moduleId } = req.params;
  const lessonData = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = $1`,
    [moduleId]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Module not found' });
    return;
  }

  if (
    ownerCheck.rows[0].instructor_id !== req.user!.userId &&
    req.user!.role !== 'admin'
  ) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const result = await pool.query(
    `INSERT INTO lessons (
      module_id, title, description, lesson_type, display_order, duration_minutes,
      video_url, video_provider, content_markdown, code_template, code_solution,
      quiz_data, audio_url, is_preview, require_completion
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      moduleId,
      lessonData.title,
      lessonData.description,
      lessonData.lessonType,
      lessonData.displayOrder,
      lessonData.durationMinutes,
      lessonData.videoUrl,
      lessonData.videoProvider,
      lessonData.contentMarkdown,
      lessonData.codeTemplate,
      lessonData.codeSolution,
      lessonData.quizData ? JSON.stringify(lessonData.quizData) : null,
      lessonData.audioUrl,
      lessonData.isPreview,
      lessonData.requireCompletion,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Update Lesson ─────────────────────────────────────────────────────────
export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const lessonData = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1`,
    [id]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Lesson not found' });
    return;
  }

  if (
    ownerCheck.rows[0].instructor_id !== req.user!.userId &&
    req.user!.role !== 'admin'
  ) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  Object.entries(lessonData).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (snakeKey === 'quiz_data' && value) {
      updates.push(`${snakeKey} = $${paramCount++}`);
      params.push(JSON.stringify(value));
    } else {
      updates.push(`${snakeKey} = $${paramCount++}`);
      params.push(value);
    }
  });

  if (updates.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  params.push(id);
  const result = await pool.query(
    `UPDATE lessons SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING *`,
    params
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Delete Lesson ─────────────────────────────────────────────────────────
export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check ownership
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     JOIN courses c ON m.course_id = c.id
     WHERE l.id = $1`,
    [id]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Lesson not found' });
    return;
  }

  if (
    ownerCheck.rows[0].instructor_id !== req.user!.userId &&
    req.user!.role !== 'admin'
  ) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
  res.json({ success: true, message: 'Lesson deleted successfully' });
};

// ── Reorder Lessons ───────────────────────────────────────────────────────
export const reorderLessons = async (req: AuthRequest, res: Response): Promise<void> => {
  const { moduleId } = req.params;
  const { lessonIds } = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = $1`,
    [moduleId]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Module not found' });
    return;
  }

  if (
    ownerCheck.rows[0].instructor_id !== req.user!.userId &&
    req.user!.role !== 'admin'
  ) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  for (let i = 0; i < lessonIds.length; i++) {
    await pool.query(
      'UPDATE lessons SET display_order = $1 WHERE id = $2 AND module_id = $3',
      [i, lessonIds[i], moduleId]
    );
  }

  res.json({ success: true, message: 'Lessons reordered successfully' });
};
