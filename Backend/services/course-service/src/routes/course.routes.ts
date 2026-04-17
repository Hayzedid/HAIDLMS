import { Router } from 'express';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  listCategories,
} from '../controllers/course.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createCourseSchema,
  updateCourseSchema,
  publishCourseSchema,
} from '../validators/course.validators';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────
router.get('/', listCourses);
router.get('/categories', listCategories);
router.get('/:id', getCourse);

// ── Instructor/Admin ──────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('instructor', 'admin'),
  validate(createCourseSchema),
  createCourse
);

router.patch(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  validate(updateCourseSchema),
  updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  deleteCourse
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('instructor', 'admin'),
  validate(publishCourseSchema),
  publishCourse
);

export default router;
