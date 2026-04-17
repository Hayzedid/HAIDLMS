import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── Mark Lesson Complete ──────────────────────────────────────────────────
export const completeLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lessonId } = req.params;
  const userId = req.user!.userId;
  const {
    completionPercent = 100,
    timeSpentSeconds = 0,
    lastPositionSeconds,
    score,
  } = req.body;

  // Get lesson and course info
  const lessonCheck = await pool.query(
    `SELECT l.id, m.course_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE l.id = $1`,
    [lessonId]
  );

  if (lessonCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Lesson not found' });
    return;
  }

  const courseId = lessonCheck.rows[0].course_id;

  // Check enrollment
  const enrollmentCheck = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
    [userId, courseId, 'active']
  );

  if (enrollmentCheck.rows.length === 0) {
    res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    return;
  }

  const enrollmentId = enrollmentCheck.rows[0].id;

  // Upsert lesson progress
  const result = await pool.query(
    `INSERT INTO lesson_progress (
      enrollment_id, lesson_id, user_id, is_completed, completion_percent,
      time_spent_seconds, last_position_seconds, score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (enrollment_id, lesson_id)
    DO UPDATE SET
      is_completed = CASE
        WHEN $5 >= 100 THEN true
        ELSE lesson_progress.is_completed
      END,
      completion_percent = GREATEST(lesson_progress.completion_percent, $5),
      time_spent_seconds = lesson_progress.time_spent_seconds + $6,
      last_position_seconds = COALESCE($7, lesson_progress.last_position_seconds),
      score = COALESCE($8, lesson_progress.score),
      attempts = lesson_progress.attempts + 1,
      completed_at = CASE
        WHEN $5 >= 100 AND lesson_progress.completed_at IS NULL THEN NOW()
        ELSE lesson_progress.completed_at
      END,
      last_accessed_at = NOW()
    RETURNING *`,
    [
      enrollmentId,
      lessonId,
      userId,
      completionPercent >= 100,
      completionPercent,
      timeSpentSeconds,
      lastPositionSeconds,
      score,
    ]
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Get Lesson Progress ───────────────────────────────────────────────────
export const getLessonProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lessonId } = req.params;
  const userId = req.user!.userId;

  // Get lesson and course
  const lessonCheck = await pool.query(
    `SELECT l.id, m.course_id
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE l.id = $1`,
    [lessonId]
  );

  if (lessonCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Lesson not found' });
    return;
  }

  const courseId = lessonCheck.rows[0].course_id;

  // Get enrollment
  const enrollmentCheck = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (enrollmentCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Not enrolled in this course' });
    return;
  }

  const enrollmentId = enrollmentCheck.rows[0].id;

  // Get or create progress
  let result = await pool.query(
    'SELECT * FROM lesson_progress WHERE enrollment_id = $1 AND lesson_id = $2',
    [enrollmentId, lessonId]
  );

  if (result.rows.length === 0) {
    // Create initial progress record
    result = await pool.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [enrollmentId, lessonId, userId]
    );
  }

  res.json({ success: true, data: result.rows[0] });
};

// ── Get Course Progress ───────────────────────────────────────────────────
export const getCourseProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;

  // Check enrollment
  const enrollmentCheck = await pool.query(
    'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (enrollmentCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Not enrolled in this course' });
    return;
  }

  const enrollment = enrollmentCheck.rows[0];

  // Get all modules with lessons and progress
  const modulesResult = await pool.query(
    `SELECT
      m.id,
      m.title,
      m.display_order,
      COUNT(l.id) as total_lessons,
      COUNT(lp.id) FILTER (WHERE lp.is_completed = true) as completed_lessons
    FROM modules m
    LEFT JOIN lessons l ON m.id = l.module_id
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = $1
    WHERE m.course_id = $2
    GROUP BY m.id, m.title, m.display_order
    ORDER BY m.display_order ASC`,
    [enrollment.id, courseId]
  );

  // Get detailed lesson progress
  const lessonsResult = await pool.query(
    `SELECT
      l.id as lesson_id,
      l.module_id,
      l.title,
      l.lesson_type,
      l.display_order,
      l.duration_minutes,
      lp.is_completed,
      lp.completion_percent,
      lp.time_spent_seconds,
      lp.last_position_seconds,
      lp.score,
      lp.last_accessed_at
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = $1
    WHERE m.course_id = $2
    ORDER BY m.display_order ASC, l.display_order ASC`,
    [enrollment.id, courseId]
  );

  // Calculate statistics
  const totalLessons = lessonsResult.rows.length;
  const completedLessons = lessonsResult.rows.filter((l) => l.is_completed).length;
  const totalTimeSpent = lessonsResult.rows.reduce(
    (sum, l) => sum + (l.time_spent_seconds || 0),
    0
  );

  res.json({
    success: true,
    data: {
      enrollment,
      modules: modulesResult.rows,
      lessons: lessonsResult.rows,
      statistics: {
        totalLessons,
        completedLessons,
        progressPercent: enrollment.progress_percent,
        totalTimeSpentSeconds: totalTimeSpent,
      },
    },
  });
};

// ── Get Next Lesson ───────────────────────────────────────────────────────
export const getNextLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;

  // Check enrollment
  const enrollmentCheck = await pool.query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = $3',
    [userId, courseId, 'active']
  );

  if (enrollmentCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Not enrolled in this course' });
    return;
  }

  const enrollmentId = enrollmentCheck.rows[0].id;

  // Find the first incomplete lesson
  const result = await pool.query(
    `SELECT
      l.id,
      l.title,
      l.lesson_type,
      l.display_order as lesson_order,
      m.id as module_id,
      m.title as module_title,
      m.display_order as module_order
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = $1
    WHERE m.course_id = $2 AND (lp.is_completed IS NULL OR lp.is_completed = false)
    ORDER BY m.display_order ASC, l.display_order ASC
    LIMIT 1`,
    [enrollmentId, courseId]
  );

  if (result.rows.length === 0) {
    res.json({
      success: true,
      message: 'Course completed',
      data: null,
    });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
};
