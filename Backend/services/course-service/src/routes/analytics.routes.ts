import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Advanced analytics, metrics, and insights
 */

// ACTIVITY TRACKING
/**
 * @swagger
 * /api/analytics/activities:
 *   post:
 *     summary: Track student activity
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activityType
 *             properties:
 *               courseId:
 *                 type: string
 *               activityType:
 *                 type: string
 *               activityTarget:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               browser:
 *                 type: string
 *               os:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               durationSeconds:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Activity tracked successfully
 */
router.post('/activities', authenticate, analyticsController.trackActivity.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/activities/{userId}:
 *   get:
 *     summary: Get student activities
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 */
router.get('/activities/:userId', authenticate, analyticsController.getStudentActivities.bind(analyticsController));

// COURSE ANALYTICS
/**
 * @swagger
 * /api/analytics/courses/{courseId}/dashboard:
 *   get:
 *     summary: Get course dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 */
router.get('/courses/:courseId/dashboard', authenticate, analyticsController.getCourseDashboard.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}:
 *   get:
 *     summary: Get course analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/courses/:courseId', authenticate, analyticsController.getCourseAnalytics.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/trend:
 *   get:
 *     summary: Get course performance trend
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend retrieved successfully
 */
router.get('/courses/:courseId/trend', authenticate, analyticsController.getCoursePerformanceTrend.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/aggregate:
 *   post:
 *     summary: Aggregate course analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Analytics aggregated successfully
 */
router.post('/courses/:courseId/aggregate', authenticate, analyticsController.aggregateCourseAnalytics.bind(analyticsController));

// STUDENT PERFORMANCE
/**
 * @swagger
 * /api/analytics/performance/{userId}/{courseId}:
 *   get:
 *     summary: Get student performance
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance retrieved successfully
 */
router.get('/performance/:userId/:courseId', authenticate, analyticsController.getStudentPerformance.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/performance/{userId}/{courseId}:
 *   post:
 *     summary: Update student performance
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance updated successfully
 */
router.post('/performance/:userId/:courseId', authenticate, analyticsController.updateStudentPerformance.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/at-risk:
 *   get:
 *     summary: Get at-risk students
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: At-risk students retrieved successfully
 */
router.get('/courses/:courseId/at-risk', authenticate, analyticsController.getAtRiskStudents.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/at-risk:
 *   post:
 *     summary: Mark students at risk
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: At-risk students marked successfully
 */
router.post('/courses/:courseId/at-risk', authenticate, analyticsController.markStudentsAtRisk.bind(analyticsController));

// LESSON ANALYTICS
/**
 * @swagger
 * /api/analytics/lessons/{lessonId}:
 *   get:
 *     summary: Get lesson analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Lesson analytics retrieved successfully
 */
router.get('/lessons/:lessonId', authenticate, analyticsController.getLessonAnalytics.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/lessons/{lessonId}/aggregate:
 *   post:
 *     summary: Aggregate lesson analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Lesson analytics aggregated successfully
 */
router.post('/lessons/:lessonId/aggregate', authenticate, analyticsController.aggregateLessonAnalytics.bind(analyticsController));

// ASSESSMENT ANALYTICS
/**
 * @swagger
 * /api/analytics/assessments/{assessmentId}:
 *   get:
 *     summary: Get assessment analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Assessment analytics retrieved successfully
 */
router.get('/assessments/:assessmentId', authenticate, analyticsController.getAssessmentAnalytics.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/assessments/{assessmentId}/aggregate:
 *   post:
 *     summary: Aggregate assessment analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Assessment analytics aggregated successfully
 */
router.post('/assessments/:assessmentId/aggregate', authenticate, analyticsController.aggregateAssessmentAnalytics.bind(analyticsController));

// ENGAGEMENT METRICS
/**
 * @swagger
 * /api/analytics/engagement/{userId}:
 *   get:
 *     summary: Get student engagement
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Engagement retrieved successfully
 */
router.get('/engagement/:userId', authenticate, analyticsController.getStudentEngagement.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/engagement/{userId}/{courseId}/score:
 *   get:
 *     summary: Calculate engagement score
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Score calculated successfully
 */
router.get('/engagement/:userId/:courseId/score', authenticate, analyticsController.calculateEngagementScore.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/engagement/trend:
 *   get:
 *     summary: Get engagement trend
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend retrieved successfully
 */
router.get('/courses/:courseId/engagement/trend', authenticate, analyticsController.getEngagementTrend.bind(analyticsController));

// LEARNING PATTERNS
/**
 * @swagger
 * /api/analytics/patterns/{userId}:
 *   get:
 *     summary: Get learning patterns
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patterns retrieved successfully
 */
router.get('/patterns/:userId', authenticate, analyticsController.getLearningPatterns.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/patterns/{userId}/analyze:
 *   post:
 *     summary: Analyze learning patterns
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patterns analyzed successfully
 */
router.post('/patterns/:userId/analyze', authenticate, analyticsController.analyzeLearningPatterns.bind(analyticsController));

// RETENTION & CHURN
/**
 * @swagger
 * /api/analytics/courses/{courseId}/retention:
 *   get:
 *     summary: Get retention metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retention metrics retrieved successfully
 */
router.get('/courses/:courseId/retention', authenticate, analyticsController.getRetentionMetrics.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/retention/calculate:
 *   post:
 *     summary: Calculate cohort retention
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cohortStartDate
 *               - cohortEndDate
 *             properties:
 *               cohortStartDate:
 *                 type: string
 *                 format: date
 *               cohortEndDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Retention calculated successfully
 */
router.post('/courses/:courseId/retention/calculate', authenticate, analyticsController.calculateCohortRetention.bind(analyticsController));

// REPORTING
/**
 * @swagger
 * /api/analytics/instructor/dashboard:
 *   get:
 *     summary: Get instructor dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 */
router.get('/instructor/dashboard', authenticate, analyticsController.getInstructorDashboard.bind(analyticsController));

/**
 * @swagger
 * /api/analytics/courses/{courseId}/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Data exported successfully
 */
router.get('/courses/:courseId/export', authenticate, analyticsController.exportAnalyticsData.bind(analyticsController));

export default router;
