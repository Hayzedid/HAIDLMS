import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { recommendationsController } from '../controllers/recommendations.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: AI-powered recommendations and personalization
 */

// ========================================
// USER PREFERENCES
// ========================================

/**
 * @swagger
 * /api/recommendations/preferences/me:
 *   get:
 *     summary: Get my preferences
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 */
router.get('/preferences/me', authenticate, recommendationsController.getMyPreferences.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/preferences/me:
 *   put:
 *     summary: Update my preferences
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredTopics:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredDifficultyLevels:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredContentTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredDuration:
 *                 type: string
 *                 enum: [short, medium, long]
 *               learningGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               careerGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               skillInterests:
 *                 type: array
 *                 items:
 *                   type: string
 *               availableHoursPerWeek:
 *                 type: integer
 *               preferredLearningTime:
 *                 type: string
 *                 enum: [morning, afternoon, evening, flexible]
 *               enableRecommendations:
 *                 type: boolean
 *               recommendationFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.put('/preferences/me', authenticate, recommendationsController.updateMyPreferences.bind(recommendationsController));

// ========================================
// COURSE RECOMMENDATIONS
// ========================================

/**
 * @swagger
 * /api/recommendations/courses/me:
 *   get:
 *     summary: Get my course recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 */
router.get('/courses/me', authenticate, recommendationsController.getMyRecommendations.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/courses/generate:
 *   post:
 *     summary: Generate fresh course recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 */
router.post('/courses/generate', authenticate, recommendationsController.generateMyRecommendations.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/{recommendationId}/track:
 *   post:
 *     summary: Track recommendation interaction
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
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
 *               - interactionType
 *             properties:
 *               interactionType:
 *                 type: string
 *                 enum: [view, click, enroll, dismiss]
 *     responses:
 *       200:
 *         description: Interaction tracked successfully
 */
router.post('/:recommendationId/track', authenticate, recommendationsController.trackRecommendationInteraction.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/{recommendationId}/dismiss:
 *   post:
 *     summary: Dismiss a recommendation
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendation dismissed successfully
 */
router.post('/:recommendationId/dismiss', authenticate, recommendationsController.dismissRecommendation.bind(recommendationsController));

// ========================================
// LEARNING PATH RECOMMENDATIONS
// ========================================

/**
 * @swagger
 * /api/recommendations/learning-paths/me:
 *   get:
 *     summary: Get my learning path recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning paths retrieved successfully
 */
router.get('/learning-paths/me', authenticate, recommendationsController.getMyLearningPaths.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/learning-paths/{pathId}/start:
 *   post:
 *     summary: Start a learning path
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pathId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning path started successfully
 */
router.post('/learning-paths/:pathId/start', authenticate, recommendationsController.startLearningPath.bind(recommendationsController));

// ========================================
// SKILL GAP ANALYSIS
// ========================================

/**
 * @swagger
 * /api/recommendations/skill-gap/analyze:
 *   post:
 *     summary: Analyze my skill gap
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetRole
 *             properties:
 *               targetRole:
 *                 type: string
 *               targetSkillLevel:
 *                 type: string
 *                 enum: [junior, mid, senior, expert]
 *     responses:
 *       200:
 *         description: Skill gap analysis completed successfully
 */
router.post('/skill-gap/analyze', authenticate, recommendationsController.analyzeMySkillGap.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/skill-gap/me:
 *   get:
 *     summary: Get my skill gap analysis
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: targetRole
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill gap analysis retrieved successfully
 */
router.get('/skill-gap/me', authenticate, recommendationsController.getMySkillGapAnalysis.bind(recommendationsController));

// ========================================
// USER SIMILARITY
// ========================================

/**
 * @swagger
 * /api/recommendations/similar-users:
 *   get:
 *     summary: Get users similar to me
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Similar users retrieved successfully
 */
router.get('/similar-users', authenticate, recommendationsController.getSimilarUsers.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/similar-users/courses:
 *   get:
 *     summary: Get courses popular with similar users
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/similar-users/courses', authenticate, recommendationsController.getCoursesFromSimilarUsers.bind(recommendationsController));

// ========================================
// COURSE SIMILARITY
// ========================================

/**
 * @swagger
 * /api/recommendations/courses/{courseId}/similar:
 *   get:
 *     summary: Get courses similar to a specific course
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Similar courses retrieved successfully
 */
router.get('/courses/:courseId/similar', recommendationsController.getSimilarCourses.bind(recommendationsController));

// ========================================
// RECOMMENDATION FEEDBACK
// ========================================

/**
 * @swagger
 * /api/recommendations/feedback:
 *   post:
 *     summary: Submit recommendation feedback
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendationId
 *               - recommendationType
 *               - feedbackType
 *             properties:
 *               recommendationId:
 *                 type: string
 *               recommendationType:
 *                 type: string
 *                 enum: [course, learning_path]
 *               feedbackType:
 *                 type: string
 *                 enum: [helpful, not_helpful, not_interested, already_known, too_difficult, too_easy, wrong_topic, enrolled, completed]
 *               feedbackRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedbackText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 */
router.post('/feedback', authenticate, recommendationsController.submitFeedback.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/effectiveness:
 *   get:
 *     summary: Get recommendation effectiveness metrics
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Effectiveness metrics retrieved successfully
 */
router.get('/effectiveness', recommendationsController.getRecommendationEffectiveness.bind(recommendationsController));

// ========================================
// TRENDING COURSES
// ========================================

/**
 * @swagger
 * /api/recommendations/trending:
 *   get:
 *     summary: Get trending courses
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trending courses retrieved successfully
 */
router.get('/trending', recommendationsController.getTrendingCourses.bind(recommendationsController));

// ========================================
// NEXT BEST ACTIONS
// ========================================

/**
 * @swagger
 * /api/recommendations/next-actions/me:
 *   get:
 *     summary: Get my next best actions
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Next best actions retrieved successfully
 */
router.get('/next-actions/me', authenticate, recommendationsController.getMyNextBestActions.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/next-actions/{actionId}/complete:
 *   post:
 *     summary: Mark action as completed
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Action completed successfully
 */
router.post('/next-actions/:actionId/complete', authenticate, recommendationsController.completeAction.bind(recommendationsController));

/**
 * @swagger
 * /api/recommendations/next-actions/{actionId}/dismiss:
 *   post:
 *     summary: Dismiss an action
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Action dismissed successfully
 */
router.post('/next-actions/:actionId/dismiss', authenticate, recommendationsController.dismissAction.bind(recommendationsController));

// ========================================
// COMPREHENSIVE RECOMMENDATIONS
// ========================================

/**
 * @swagger
 * /api/recommendations/comprehensive/me:
 *   get:
 *     summary: Get comprehensive recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive recommendations retrieved successfully
 */
router.get('/comprehensive/me', authenticate, recommendationsController.getMyComprehensiveRecommendations.bind(recommendationsController));

// ========================================
// PERFORMANCE
// ========================================

/**
 * @swagger
 * /api/recommendations/performance:
 *   get:
 *     summary: Get recommendation performance metrics
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', recommendationsController.getRecommendationPerformance.bind(recommendationsController));

export default router;
