import { Router } from 'express';
import {
  completeLesson,
  getLessonProgress,
  getCourseProgress,
  getNextLesson,
} from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { completeLessonSchema } from '../validators/course.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/lessons/:lessonId/complete', validate(completeLessonSchema), completeLesson);
router.get('/lessons/:lessonId/progress', getLessonProgress);
router.get('/courses/:courseId/progress', getCourseProgress);
router.get('/courses/:courseId/next-lesson', getNextLesson);

export default router;
