import { Router } from 'express';
import { leaderboardsController } from '../controllers/leaderboards.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leaderboards
 *   description: Leaderboards, rankings, and competitions
 */

// ========================================
// LEADERBOARDS
// ========================================

/**
 * @swagger
 * /api/leaderboards:
 *   get:
 *     summary: Get a leaderboard
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: leaderboardType
 *         schema:
 *           type: string
 *           enum: [points, xp, streak, completion, speed, accuracy]
 *           default: points
 *       - in: query
 *         name: scopeType
 *         schema:
 *           type: string
 *           enum: [global, course, organization]
 *           default: global
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: timePeriod
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
router.get('/', leaderboardsController.getLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/global/points:
 *   get:
 *     summary: Get global points leaderboard
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Points leaderboard retrieved successfully
 */
router.get('/global/points', leaderboardsController.getGlobalPointsLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/global/xp:
 *   get:
 *     summary: Get global XP leaderboard
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: XP leaderboard retrieved successfully
 */
router.get('/global/xp', leaderboardsController.getGlobalXPLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/global/streak:
 *   get:
 *     summary: Get global streak leaderboard
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Streak leaderboard retrieved successfully
 */
router.get('/global/streak', leaderboardsController.getGlobalStreakLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/course/{courseId}:
 *   get:
 *     summary: Get course completion leaderboard
 *     tags: [Leaderboards]
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
 *           default: 100
 *     responses:
 *       200:
 *         description: Course leaderboard retrieved successfully
 */
router.get('/course/:courseId', leaderboardsController.getCourseLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/me/rankings:
 *   get:
 *     summary: Get my leaderboard rankings
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User rankings retrieved successfully
 */
router.get('/me/rankings', authenticate, leaderboardsController.getMyRankings.bind(leaderboardsController));

// ========================================
// PRIVACY SETTINGS
// ========================================

/**
 * @swagger
 * /api/leaderboards/me/privacy:
 *   get:
 *     summary: Get my privacy settings
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 */
router.get('/me/privacy', authenticate, leaderboardsController.getMyPrivacySettings.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/me/privacy:
 *   put:
 *     summary: Update my privacy settings
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               showOnGlobalLeaderboards:
 *                 type: boolean
 *               showOnCourseLeaderboards:
 *                 type: boolean
 *               useRealName:
 *                 type: boolean
 *               useAnonymousName:
 *                 type: boolean
 *               anonymousDisplayName:
 *                 type: string
 *               allowCompetitionInvites:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 */
router.put('/me/privacy', authenticate, leaderboardsController.updateMyPrivacySettings.bind(leaderboardsController));

// ========================================
// COMPETITIONS
// ========================================

/**
 * @swagger
 * /api/leaderboards/competitions:
 *   get:
 *     summary: List competitions
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, active, completed]
 *       - in: query
 *         name: competitionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Competitions retrieved successfully
 */
router.get('/competitions', leaderboardsController.listCompetitions.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/active:
 *   get:
 *     summary: Get active competitions
 *     tags: [Leaderboards]
 *     responses:
 *       200:
 *         description: Active competitions retrieved successfully
 */
router.get('/competitions/active', leaderboardsController.getActiveCompetitions.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/{id}:
 *   get:
 *     summary: Get competition details
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Competition retrieved successfully
 *       404:
 *         description: Competition not found
 */
router.get('/competitions/:id', leaderboardsController.getCompetition.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/{competitionId}/join:
 *   post:
 *     summary: Join a competition
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: competitionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Joined competition successfully
 *       400:
 *         description: Competition full or insufficient points
 */
router.post('/competitions/:competitionId/join', authenticate, leaderboardsController.joinCompetition.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/{competitionId}/leaderboard:
 *   get:
 *     summary: Get competition leaderboard
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: competitionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Competition leaderboard retrieved successfully
 */
router.get('/competitions/:competitionId/leaderboard', leaderboardsController.getCompetitionLeaderboard.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/{competitionId}/withdraw:
 *   post:
 *     summary: Withdraw from a competition
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: competitionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Withdrawn successfully
 */
router.post('/competitions/:competitionId/withdraw', authenticate, leaderboardsController.withdrawFromCompetition.bind(leaderboardsController));

/**
 * @swagger
 * /api/leaderboards/competitions/me:
 *   get:
 *     summary: Get my competitions
 *     tags: [Leaderboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User competitions retrieved successfully
 */
router.get('/competitions/me', authenticate, leaderboardsController.getMyCompetitions.bind(leaderboardsController));

export default router;
