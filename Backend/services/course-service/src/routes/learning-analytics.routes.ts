import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { learningAnalyticsController } from '../controllers/learning-analytics.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Learning Analytics
 *   description: Learning analytics, metrics, and insights
 */

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/learning-analytics/sessions/start:
 *   post:
 *     summary: Start a learning session
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceType:
 *                 type: string
 *               browser:
 *                 type: string
 *               platform:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session started successfully
 */
router.post('/sessions/start', authenticate, learningAnalyticsController.startSession.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/sessions/{sessionId}/end:
 *   post:
 *     summary: End a learning session
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.post('/sessions/:sessionId/end', authenticate, learningAnalyticsController.endSession.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/sessions/activity:
 *   post:
 *     summary: Log a session activity
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - activityAction
 *               - contentType
 *               - contentId
 *             properties:
 *               sessionId:
 *                 type: string
 *               activityAction:
 *                 type: string
 *                 enum: [view, start, pause, resume, complete, skip, rewatch, download, bookmark, note, question, submit]
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               contentTitle:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Activity logged successfully
 */
router.post('/sessions/activity', authenticate, learningAnalyticsController.logActivity.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/sessions/{sessionId}:
 *   get:
 *     summary: Get session details
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 */
router.get('/sessions/:sessionId', authenticate, learningAnalyticsController.getSessionDetails.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/sessions/me:
 *   get:
 *     summary: Get my learning sessions
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get('/sessions/me', authenticate, learningAnalyticsController.getMySessions.bind(learningAnalyticsController));

// ========================================
// LEARNING METRICS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/metrics/me:
 *   get:
 *     summary: Get my learning metrics
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Learning metrics retrieved successfully
 */
router.get('/metrics/me', authenticate, learningAnalyticsController.getMyLearningMetrics.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/summary/me:
 *   get:
 *     summary: Get my learning summary
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning summary retrieved successfully
 */
router.get('/summary/me', authenticate, learningAnalyticsController.getMyLearningSummary.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/active-learners:
 *   get:
 *     summary: Get active learners
 *     tags: [Learning Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Active learners retrieved successfully
 */
router.get('/active-learners', learningAnalyticsController.getActiveLearners.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/top-performers:
 *   get:
 *     summary: Get top performing learners
 *     tags: [Learning Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Top performers retrieved successfully
 */
router.get('/top-performers', learningAnalyticsController.getTopPerformers.bind(learningAnalyticsController));

// ========================================
// CONTENT INTERACTIONS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/content/interaction:
 *   post:
 *     summary: Update content interaction
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               timeSpentSeconds:
 *                 type: integer
 *               completed:
 *                 type: boolean
 *               score:
 *                 type: number
 *               success:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content interaction updated successfully
 */
router.post('/content/interaction', authenticate, learningAnalyticsController.updateContentInteraction.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/content/interaction/{contentType}/{contentId}:
 *   get:
 *     summary: Get content interaction
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content interaction retrieved successfully
 */
router.get('/content/interaction/:contentType/:contentId', authenticate, learningAnalyticsController.getContentInteraction.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/content/interactions/me:
 *   get:
 *     summary: Get my content interactions
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Content interactions retrieved successfully
 */
router.get('/content/interactions/me', authenticate, learningAnalyticsController.getMyContentInteractions.bind(learningAnalyticsController));

// ========================================
// SKILL MASTERY
// ========================================

/**
 * @swagger
 * /api/learning-analytics/skills:
 *   post:
 *     summary: Create a skill
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillName
 *             properties:
 *               skillName:
 *                 type: string
 *               skillCategory:
 *                 type: string
 *               description:
 *                 type: string
 *               parentSkillId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skill created successfully
 */
router.post('/skills', authenticate, learningAnalyticsController.createSkill.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/skills:
 *   get:
 *     summary: List all skills
 *     tags: [Learning Analytics]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
 */
router.get('/skills', learningAnalyticsController.listSkills.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/skills/mastery:
 *   post:
 *     summary: Update skill mastery
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillId
 *               - success
 *             properties:
 *               skillId:
 *                 type: string
 *               success:
 *                 type: boolean
 *               confidenceDelta:
 *                 type: number
 *     responses:
 *       200:
 *         description: Skill mastery updated successfully
 */
router.post('/skills/mastery', authenticate, learningAnalyticsController.updateSkillMastery.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/skills/mastery/me:
 *   get:
 *     summary: Get my skill mastery
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skill mastery retrieved successfully
 */
router.get('/skills/mastery/me', authenticate, learningAnalyticsController.getMySkillMastery.bind(learningAnalyticsController));

// ========================================
// LEARNING VELOCITY
// ========================================

/**
 * @swagger
 * /api/learning-analytics/velocity/me:
 *   get:
 *     summary: Get my learning velocity
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Learning velocity retrieved successfully
 */
router.get('/velocity/me', authenticate, learningAnalyticsController.getMyLearningVelocity.bind(learningAnalyticsController));

// ========================================
// PERFORMANCE TRENDS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/performance/trends/me:
 *   get:
 *     summary: Get my performance trends
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Performance trends retrieved successfully
 */
router.get('/performance/trends/me', authenticate, learningAnalyticsController.getMyPerformanceTrends.bind(learningAnalyticsController));

// ========================================
// LEARNING GOALS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/goals:
 *   post:
 *     summary: Create a learning goal
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalTitle
 *               - goalType
 *               - targetValue
 *               - targetUnit
 *             properties:
 *               goalTitle:
 *                 type: string
 *               goalDescription:
 *                 type: string
 *               goalType:
 *                 type: string
 *                 enum: [course_completion, skill_mastery, certification, time_based, custom]
 *               targetValue:
 *                 type: number
 *               targetUnit:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date
 *               reminderEnabled:
 *                 type: boolean
 *               reminderFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Learning goal created successfully
 */
router.post('/goals', authenticate, learningAnalyticsController.createLearningGoal.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/goals/{goalId}:
 *   put:
 *     summary: Update a learning goal
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentValue:
 *                 type: number
 *               isAchieved:
 *                 type: boolean
 *               goalTitle:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Learning goal updated successfully
 */
router.put('/goals/:goalId', authenticate, learningAnalyticsController.updateLearningGoal.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/goals/me:
 *   get:
 *     summary: Get my learning goals
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeAchieved
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Learning goals retrieved successfully
 */
router.get('/goals/me', authenticate, learningAnalyticsController.getMyLearningGoals.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/goals/{goalId}:
 *   delete:
 *     summary: Delete a learning goal
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning goal deleted successfully
 */
router.delete('/goals/:goalId', authenticate, learningAnalyticsController.deleteLearningGoal.bind(learningAnalyticsController));

// ========================================
// TIME TRACKING
// ========================================

/**
 * @swagger
 * /api/learning-analytics/time/start:
 *   post:
 *     summary: Start time tracking
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Time tracking started successfully
 */
router.post('/time/start', authenticate, learningAnalyticsController.startTimeTracking.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/time/{trackingId}/end:
 *   post:
 *     summary: End time tracking
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionPercentage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Time tracking ended successfully
 */
router.post('/time/:trackingId/end', authenticate, learningAnalyticsController.endTimeTracking.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/time/me:
 *   get:
 *     summary: Get my time tracking
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Time tracking retrieved successfully
 */
router.get('/time/me', authenticate, learningAnalyticsController.getMyTimeTracking.bind(learningAnalyticsController));

// ========================================
// LEARNING PATTERNS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/patterns/analyze:
 *   post:
 *     summary: Analyze my learning patterns
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning patterns analyzed successfully
 */
router.post('/patterns/analyze', authenticate, learningAnalyticsController.analyzeMyLearningPatterns.bind(learningAnalyticsController));

/**
 * @swagger
 * /api/learning-analytics/patterns/me:
 *   get:
 *     summary: Get my learning patterns
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning patterns retrieved successfully
 */
router.get('/patterns/me', authenticate, learningAnalyticsController.getMyLearningPatterns.bind(learningAnalyticsController));

// ========================================
// COMPREHENSIVE ANALYTICS
// ========================================

/**
 * @swagger
 * /api/learning-analytics/comprehensive/me:
 *   get:
 *     summary: Get my comprehensive analytics
 *     tags: [Learning Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive analytics retrieved successfully
 */
router.get('/comprehensive/me', authenticate, learningAnalyticsController.getMyComprehensiveAnalytics.bind(learningAnalyticsController));

export default router;
