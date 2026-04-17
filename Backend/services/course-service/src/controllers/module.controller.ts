import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import pool from '../db/pool';

// ── Create Module ─────────────────────────────────────────────────────────
export const createModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const moduleData = req.body;

  // Check course ownership
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
    `INSERT INTO modules (course_id, title, description, display_order, duration_minutes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      courseId,
      moduleData.title,
      moduleData.description,
      moduleData.displayOrder,
      moduleData.durationMinutes,
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

// ── Update Module ─────────────────────────────────────────────────────────
export const updateModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const moduleData = req.body;

  // Check ownership via course
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = $1`,
    [id]
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

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  Object.entries(moduleData).forEach(([key, value]) => {
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
    `UPDATE modules SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING *`,
    params
  );

  res.json({ success: true, data: result.rows[0] });
};

// ── Delete Module ─────────────────────────────────────────────────────────
export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check ownership
  const ownerCheck = await pool.query(
    `SELECT c.instructor_id
     FROM modules m
     JOIN courses c ON m.course_id = c.id
     WHERE m.id = $1`,
    [id]
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

  await pool.query('DELETE FROM modules WHERE id = $1', [id]);
  res.json({ success: true, message: 'Module deleted successfully' });
};

// ── Reorder Modules ───────────────────────────────────────────────────────
export const reorderModules = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const { moduleIds } = req.body; // Array of module IDs in new order

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

  // Update display_order for each module
  for (let i = 0; i < moduleIds.length; i++) {
    await pool.query(
      'UPDATE modules SET display_order = $1 WHERE id = $2 AND course_id = $3',
      [i, moduleIds[i], courseId]
    );
  }

  res.json({ success: true, message: 'Modules reordered successfully' });
};
