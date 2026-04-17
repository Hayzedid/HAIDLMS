import { Router } from 'express';
import {
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/lesson.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createLessonSchema,
  updateLessonSchema,
} from '../validators/course.validators';

const router = Router();

// Get lesson (authenticated users)
router.get('/:id', authenticate, getLesson);

// Instructor/Admin only
router.post(
  '/modules/:moduleId/lessons',
  authenticate,
  authorize('instructor', 'admin'),
  validate(createLessonSchema),
  createLesson
);

router.patch(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  validate(updateLessonSchema),
  updateLesson
);

router.delete(
  '/:id',
  authenticate,
  authorize('instructor', 'admin'),
  deleteLesson
);

router.post(
  '/modules/:moduleId/lessons/reorder',
  authenticate,
  authorize('instructor', 'admin'),
  reorderLessons
);

export default router;
