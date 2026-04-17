import express from 'express';
import { learningHealthController } from '../controllers/learning-health.controller';

const router = express.Router();

/**
 * Learning Health Dashboard Routes
 * All routes require authentication (add auth middleware)
 */

/**
 * @route   GET /api/learning-health/users/:userId/courses/:courseId/health-score
 * @desc    Get composite health score for a user
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get(
  '/users/:userId/courses/:courseId/health-score',
  learningHealthController.getUserHealthScore.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/courses/:courseId/at-risk-learners
 * @desc    Get at-risk learners for a course
 * @access  Private (Instructor, Admin)
 * @query   riskLevel (optional: 'critical', 'high', 'medium')
 */
router.get(
  '/courses/:courseId/at-risk-learners',
  learningHealthController.getAtRiskLearners.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/users/:userId/courses/:courseId/instructor-nudge
 * @desc    Generate instructor nudge for a specific learner
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/users/:userId/courses/:courseId/instructor-nudge',
  learningHealthController.generateInstructorNudge.bind(learningHealthController)
);

/**
 * @route   POST /api/learning-health/users/:userId/courses/:courseId/update-health-score
 * @desc    Update health score for a user
 * @access  Private (System, Instructor, Admin)
 */
router.post(
  '/users/:userId/courses/:courseId/update-health-score',
  learningHealthController.updateHealthScore.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/courses/:courseId/dashboard-summary
 * @desc    Get dashboard summary for instructor
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/courses/:courseId/dashboard-summary',
  learningHealthController.getDashboardSummary.bind(learningHealthController)
);

/**
 * @route   POST /api/learning-health/courses/:courseId/batch-update
 * @desc    Batch update health scores for all learners in a course
 * @access  Private (System, Instructor, Admin)
 */
router.post(
  '/courses/:courseId/batch-update',
  learningHealthController.batchUpdateHealthScores.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/users/:userId/courses/:courseId/trends
 * @desc    Get health score trends for a user
 * @access  Private (Student - Owner, Instructor, Admin)
 * @query   days (optional, default: 30)
 */
router.get(
  '/users/:userId/courses/:courseId/trends',
  learningHealthController.getHealthScoreTrends.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/users/:userId/courses/:courseId/component-breakdown
 * @desc    Get component breakdown for a user
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get(
  '/users/:userId/courses/:courseId/component-breakdown',
  learningHealthController.getComponentBreakdown.bind(learningHealthController)
);

/**
 * @route   GET /api/learning-health/courses/:courseId/interventions
 * @desc    Get intervention recommendations for course
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/courses/:courseId/interventions',
  learningHealthController.getInterventionRecommendations.bind(learningHealthController)
);

export default router;
