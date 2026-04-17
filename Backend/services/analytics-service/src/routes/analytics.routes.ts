import { Router } from 'express';
import { authenticateToken, requireInstructor, requireAdmin } from '../middleware/auth.middleware';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

/**
 * @route GET /api/analytics/user
 * @desc Get user analytics
 * @access Protected
 */
router.get('/user', authenticateToken, analyticsController.getUserAnalytics);

/**
 * @route GET /api/analytics/course/:courseId
 * @desc Get course analytics
 * @access Protected (Instructor/Admin)
 */
router.get('/course/:courseId', authenticateToken, requireInstructor, analyticsController.getCourseAnalytics);

/**
 * @route GET /api/analytics/course/:courseId/insights
 * @desc Get learning insights for a course
 * @access Protected
 */
router.get('/course/:courseId/insights', authenticateToken, analyticsController.getLearningInsights);

/**
 * @route GET /api/analytics/course/:courseId/recommendations
 * @desc Get learning path recommendations
 * @access Protected
 */
router.get('/course/:courseId/recommendations', authenticateToken, analyticsController.getLearningPathRecommendations);

/**
 * @route POST /api/analytics/course/:courseId/metrics/update
 * @desc Update user learning metrics
 * @access Protected
 */
router.post('/course/:courseId/metrics/update', authenticateToken, analyticsController.updateLearningMetrics);

/**
 * @route GET /api/analytics/retention
 * @desc Get retention metrics
 * @access Protected (Admin)
 */
router.get('/retention', authenticateToken, requireAdmin, analyticsController.getRetentionMetrics);

/**
 * @route GET /api/analytics/at-risk
 * @desc Get at-risk users
 * @access Protected (Instructor/Admin)
 */
router.get('/at-risk', authenticateToken, requireInstructor, analyticsController.getAtRiskUsers);

export default router;
