import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── Create Review ─────────────────────────────────────────────────────────
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const userId = req.user!.userId;
  const { rating, reviewText } = req.body;

  // Check if enrolled and completed
  const enrollmentCheck = await pool.query(
    'SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (enrollmentCheck.rows.length === 0) {
    res.status(403).json({ success: false, message: 'Must be enrolled to review' });
    return;
  }

  const enrollment = enrollmentCheck.rows[0];

  // Check for existing review
  const existingReview = await pool.query(
    'SELECT id FROM course_reviews WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );

  if (existingReview.rows.length > 0) {
    res.status(400).json({ success: false, message: 'You have already reviewed this course' });
    return;
  }

  // Create review
  const result = await pool.query(
    `INSERT INTO course_reviews (course_id, user_id, enrollment_id, rating, review_text)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [courseId, userId, enrollment.id, rating, reviewText]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Get Course Reviews ────────────────────────────────────────────────────
export const getCourseReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const result = await pool.query(
    `SELECT
      cr.id,
      cr.rating,
      cr.review_text,
      cr.instructor_response,
      cr.created_at,
      cr.responded_at,
      cr.user_id
    FROM course_reviews cr
    WHERE cr.course_id = $1 AND cr.is_published = true
    ORDER BY cr.created_at DESC
    LIMIT $2 OFFSET $3`,
    [courseId, Number(limit), offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM course_reviews WHERE course_id = $1 AND is_published = true',
    [courseId]
  );

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
  });
};

// ── Update Review ─────────────────────────────────────────────────────────
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { rating, reviewText } = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT user_id FROM course_reviews WHERE id = $1',
    [id]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return;
  }

  if (ownerCheck.rows[0].user_id !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const result = await pool.query(
    `UPDATE course_reviews
     SET rating = COALESCE($1, rating), review_text = COALESCE($2, review_text), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [rating, reviewText, id]
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Delete Review ─────────────────────────────────────────────────────────
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT user_id FROM course_reviews WHERE id = $1',
    [id]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return;
  }

  if (ownerCheck.rows[0].user_id !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await pool.query('DELETE FROM course_reviews WHERE id = $1', [id]);
  res.json({ success: true, message: 'Review deleted successfully' });
};

// ── Respond to Review (Instructor) ────────────────────────────────────────
export const respondToReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { instructorResponse } = req.body;

  // Check if review's course is owned by this instructor
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM course_reviews cr
     JOIN courses c ON cr.course_id = c.id
     WHERE cr.id = $1`,
    [id]
  );

  if (ownerCheck.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Review not found' });
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
    `UPDATE course_reviews
     SET instructor_response = $1, responded_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [instructorResponse, id]
  );

  res.json({ success: true, data: result.rows[0] });
};
