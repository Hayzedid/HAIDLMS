import { Router } from 'express';
import {
  createReview,
  getCourseReviews,
  updateReview,
  deleteReview,
  respondToReview,
} from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createReviewSchema,
  respondToReviewSchema,
} from '../validators/course.validators';

const router = Router();

// Public route
router.get('/courses/:courseId/reviews', getCourseReviews);

// Authenticated routes
router.post(
  '/courses/:courseId/reviews',
  authenticate,
  validate(createReviewSchema),
  createReview
);

router.patch('/reviews/:id', authenticate, updateReview);
router.delete('/reviews/:id', authenticate, deleteReview);

// Instructor route
router.post(
  '/reviews/:id/respond',
  authenticate,
  authorize('instructor', 'admin'),
  validate(respondToReviewSchema),
  respondToReview
);

export default router;
