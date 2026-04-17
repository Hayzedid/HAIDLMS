import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── Enroll in Course ──────────────────────────────────────────────────────
export const enrollInCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;

  // Check if course exists and is published
  const courseCheck = await pool.query(
    'SELECT id, status, enrollment_limit FROM courses WHERE id = $1',
    [courseId]
  );

  if (courseCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const course = courseCheck.rows[0];

  if (course.status !== 'published') {
    res.status(400).json({ success: false, message: 'Course is not available for enrollment' });
    return;
  }

  // Check enrollment limit
  if (course.enrollment_limit) {
    const enrollmentCount = await pool.query(
      'SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = $2',
      [courseId, 'active']
    );
    if (parseInt(enrollmentCount.rows[0].count) >= course.enrollment_limit) {
      res.status(400).json({ success: false, message: 'Course is full' });
      return;
    }
  }

  // Check if already enrolled
  const existingEnrollment = await pool.query(
    'SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (existingEnrollment.rows.length > 0) {
    if (existingEnrollment.rows[0].status === 'active') {
      res.status(400).json({ success: false, message: 'Already enrolled in this course' });
      return;
    }
    // Reactivate if dropped
    await pool.query(
      'UPDATE enrollments SET status = $1, enrolled_at = NOW() WHERE id = $2',
      ['active', existingEnrollment.rows[0].id]
    );
    res.json({
      success: true,
      message: 'Enrollment reactivated',
      data: { enrollmentId: existingEnrollment.rows[0].id },
    });
    return;
  }

  // Create enrollment
  const result = await pool.query(
    `INSERT INTO enrollments (course_id, user_id, status)
     VALUES ($1, $2, 'active')
     RETURNING *`,
    [courseId, userId]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Get My Enrollments ────────────────────────────────────────────────────
export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { status, page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions = ['e.user_id = $1'];
  const params: any[] = [userId];
  let paramCount = 2;

  if (status) {
    params.push(status);
    conditions.push(`e.status = $${paramCount++}`);
  }

  const where = conditions.join(' AND ');
  params.push(Number(limit), offset);

  const result = await pool.query(
    `SELECT
      e.*,
      c.title as course_title,
      c.slug as course_slug,
      c.cover_image_url,
      c.instructor_id,
      cs.average_rating,
      cs.total_reviews
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN course_stats cs ON c.id = cs.course_id
    WHERE ${where}
    ORDER BY e.last_accessed_at DESC NULLS LAST, e.enrolled_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    params
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM enrollments e WHERE ${where}`,
    params.slice(0, -2)
  );

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
  });
};

// ── Get Course Students (Instructor) ──────────────────────────────────────
export const getCourseStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT instructor_id FROM courses WHERE id = $1',
    [courseId]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Course not found' });
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
    `SELECT
      e.id as enrollment_id,
      e.user_id,
      e.status,
      e.progress_percent,
      e.enrolled_at,
      e.completed_at,
      e.last_accessed_at
    FROM enrollments e
    WHERE e.course_id = $1
    ORDER BY e.enrolled_at DESC`,
    [courseId]
  );

  res.json({ success: true, data: result.rows });
};

// ── Get Enrollment Details ────────────────────────────────────────────────
export const getEnrollmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;

  const result = await pool.query(
    `SELECT e.*, c.title as course_title, c.slug as course_slug
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = $1 AND e.course_id = $2`,
    [userId, courseId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Enrollment not found' });
    return;
  }

  // Get lesson progress
  const progressResult = await pool.query(
    `SELECT
      lp.*,
      l.title as lesson_title,
      l.lesson_type,
      m.id as module_id,
      m.title as module_title
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE lp.enrollment_id = $1
    ORDER BY lp.last_accessed_at DESC`,
    [result.rows[0].id]
  );

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      lessonProgress: progressResult.rows,
    },
  });
};

// ── Drop Enrollment ───────────────────────────────────────────────────────
export const dropEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;

  const result = await pool.query(
    `UPDATE enrollments
     SET status = 'dropped'
     WHERE user_id = $1 AND course_id = $2 AND status = 'active'
     RETURNING *`,
    [userId, courseId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Active enrollment not found' });
    return;
  }

  res.json({ success: true, message: 'Enrollment dropped successfully' });
};
