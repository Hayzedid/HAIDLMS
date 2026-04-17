import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── List Courses ──────────────────────────────────────────────────────────
export const listCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    status,
    categoryId,
    skillLevel,
    isFeatured,
    instructorId,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  // Only show published courses to students
  if (req.user?.role === 'student' || !req.user) {
    conditions.push(`c.status = 'published'`);
  } else if (status) {
    params.push(status);
    conditions.push(`c.status = $${paramCount++}`);
  }

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`c.category_id = $${paramCount++}`);
  }

  if (skillLevel) {
    params.push(skillLevel);
    conditions.push(`c.skill_level = $${paramCount++}`);
  }

  if (isFeatured === 'true') {
    conditions.push(`c.is_featured = true`);
  }

  if (instructorId) {
    params.push(instructorId);
    conditions.push(`c.instructor_id = $${paramCount++}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
    paramCount++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), offset);

  const query = `
    SELECT
      c.*,
      cat.name as category_name,
      cat.slug as category_slug,
      cs.total_enrollments,
      cs.average_rating,
      cs.total_reviews
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN course_stats cs ON c.id = cs.course_id
    ${where}
    ORDER BY
      CASE WHEN c.is_featured THEN 0 ELSE 1 END,
      c.published_at DESC NULLS LAST,
      c.created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `;

  const result = await pool.query(query, params);

  const countQuery = `SELECT COUNT(*) FROM courses c ${where}`;
  const countResult = await pool.query(countQuery, params.slice(0, -2));

  res.json({
    success: true,
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
  });
};

// ── Get Course by ID ──────────────────────────────────────────────────────
export const getCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT
      c.*,
      cat.name as category_name,
      cat.slug as category_slug,
      cs.total_enrollments,
      cs.active_enrollments,
      cs.completed_enrollments,
      cs.average_rating,
      cs.total_reviews
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN course_stats cs ON c.id = cs.course_id
    WHERE c.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const course = result.rows[0];

  // Check access permissions
  if (
    course.status !== 'published' &&
    req.user?.role === 'student'
  ) {
    res.status(403).json({ success: false, message: 'Course not available' });
    return;
  }

  // Get modules with lessons
  const modulesResult = await pool.query(
    `SELECT * FROM modules WHERE course_id = $1 ORDER BY display_order ASC`,
    [id]
  );

  const modules = await Promise.all(
    modulesResult.rows.map(async (module) => {
      const lessonsResult = await pool.query(
        `SELECT
          id, module_id, title, description, lesson_type, display_order,
          duration_minutes, video_url, video_provider, is_preview, is_published
        FROM lessons
        WHERE module_id = $1
        ORDER BY display_order ASC`,
        [module.id]
      );
      return { ...module, lessons: lessonsResult.rows };
    })
  );

  // Get prerequisites
  const prereqResult = await pool.query(
    `SELECT c.id, c.title, c.slug
     FROM course_prerequisites cp
     JOIN courses c ON cp.prerequisite_id = c.id
     WHERE cp.course_id = $1`,
    [id]
  );

  res.json({
    success: true,
    data: {
      ...course,
      modules,
      prerequisites: prereqResult.rows,
    },
  });
};

// ── Create Course ─────────────────────────────────────────────────────────
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const instructorId = req.user!.userId;
  const courseData = req.body;

  const result = await pool.query(
    `INSERT INTO courses (
      title, slug, description, short_description, category_id, skill_level,
      instructor_id, cover_image_url, trailer_video_url, estimated_duration_hours,
      price_cents, enrollment_limit, tags, language
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      courseData.title,
      courseData.slug,
      courseData.description,
      courseData.shortDescription,
      courseData.categoryId,
      courseData.skillLevel,
      instructorId,
      courseData.coverImageUrl,
      courseData.trailerVideoUrl,
      courseData.estimatedDurationHours,
      courseData.priceCents,
      courseData.enrollmentLimit,
      courseData.tags,
      courseData.language,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Update Course ─────────────────────────────────────────────────────────
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const courseData = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT instructor_id FROM courses WHERE id = $1',
    [id]
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

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  Object.entries(courseData).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    updates.push(`${snakeKey} = $${paramCount++}`);
    params.push(value);
  });

  if (updates.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  params.push(id);
  const result = await pool.query(
    `UPDATE courses SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING *`,
    params
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Delete Course ─────────────────────────────────────────────────────────
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT instructor_id FROM courses WHERE id = $1',
    [id]
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

  await pool.query('DELETE FROM courses WHERE id = $1', [id]);
  res.json({ success: true, message: 'Course deleted successfully' });
};

// ── Publish Course ────────────────────────────────────────────────────────
export const publishCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  // Check ownership
  const ownerCheck = await pool.query(
    'SELECT instructor_id FROM courses WHERE id = $1',
    [id]
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
    `UPDATE courses
     SET status = $1, published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── List Categories ───────────────────────────────────────────────────────
export const listCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    'SELECT * FROM categories ORDER BY display_order ASC, name ASC'
  );
  res.json({ success: true, data: result.rows });
};
