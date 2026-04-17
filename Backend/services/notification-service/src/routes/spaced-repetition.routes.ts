import { Router } from 'express';
import {
  initializeSchedule,
  getSchedule,
  recordReview,
  getDueReviews,
  getUpcomingReviews,
  pauseSchedule,
  resumeSchedule,
  deactivateSchedule,
  getScheduleStats,
  getRetentionMetrics,
  getLearningHealthScore,
  getReviewSessions,
} from '../controllers/spaced-repetition.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints (for internal service-to-service communication)
router.post('/schedules', initializeSchedule);

// Protected endpoints
router.use(authenticateToken);

router.get('/reviews/due', getDueReviews);
router.get('/reviews/upcoming', getUpcomingReviews);
router.get('/stats', getScheduleStats);
router.get('/retention', getRetentionMetrics);
router.get('/health', getLearningHealthScore);
router.get('/sessions', getReviewSessions);

router.get('/schedules/:userId/:contentId/:contentType', getSchedule);
router.post('/schedules/:scheduleId/review', recordReview);
router.post('/schedules/:scheduleId/pause', pauseSchedule);
router.post('/schedules/:scheduleId/resume', resumeSchedule);
router.delete('/schedules/:scheduleId', deactivateSchedule);

export default router;
