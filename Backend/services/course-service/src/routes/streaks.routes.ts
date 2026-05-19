import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { streaksController } from '../controllers/streaks.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Streaks
 *   description: Streaks, daily challenges, and milestones
 */

// ========================================
// STREAKS
// ========================================

/**
 * @swagger
 * /api/streaks/me:
 *   get:
 *     summary: Get my current streak
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak retrieved successfully
 */
router.get('/me', authenticate, streaksController.getMyStreak.bind(streaksController));

/**
 * @swagger
 * /api/streaks/me/freeze:
 *   post:
 *     summary: Use a streak freeze
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak freeze used successfully
 *       400:
 *         description: No streak freezes available
 */
router.post('/me/freeze', authenticate, streaksController.useStreakFreeze.bind(streaksController));

/**
 * @swagger
 * /api/streaks/me/history:
 *   get:
 *     summary: Get my streak history
 *     tags: [Streaks]
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
 *         description: Streak history retrieved successfully
 */
router.get('/me/history', authenticate, streaksController.getMyStreakHistory.bind(streaksController));

/**
 * @swagger
 * /api/streaks/leaderboard:
 *   get:
 *     summary: Get streak leaderboard
 *     tags: [Streaks]
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
router.get('/leaderboard', streaksController.getStreakLeaderboard.bind(streaksController));

/**
 * @swagger
 * /api/streaks/me/stats:
 *   get:
 *     summary: Get my streak statistics
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak stats retrieved successfully
 */
router.get('/me/stats', authenticate, streaksController.getMyStreakStats.bind(streaksController));

/**
 * @swagger
 * /api/streaks/me/reminders:
 *   put:
 *     summary: Update streak reminder settings
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               reminderTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       200:
 *         description: Reminder settings updated successfully
 */
router.put('/me/reminders', authenticate, streaksController.updateStreakReminders.bind(streaksController));

// ========================================
// MILESTONES
// ========================================

/**
 * @swagger
 * /api/streaks/milestones:
 *   get:
 *     summary: List all streak milestones
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 */
router.get('/milestones', streaksController.listStreakMilestones.bind(streaksController));

/**
 * @swagger
 * /api/streaks/milestones/me:
 *   get:
 *     summary: Get my achieved milestones
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User milestones retrieved successfully
 */
router.get('/milestones/me', authenticate, streaksController.getMyMilestones.bind(streaksController));

// ========================================
// DAILY CHALLENGES
// ========================================

/**
 * @swagger
 * /api/streaks/challenges/me:
 *   get:
 *     summary: Get my daily challenges
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily challenges retrieved successfully
 */
router.get('/challenges/me', authenticate, streaksController.getMyDailyChallenges.bind(streaksController));

/**
 * @swagger
 * /api/streaks/challenges/{challengeId}/skip:
 *   post:
 *     summary: Skip a daily challenge
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge skipped successfully
 */
router.post('/challenges/:challengeId/skip', authenticate, streaksController.skipChallenge.bind(streaksController));

/**
 * @swagger
 * /api/streaks/challenges/me/stats:
 *   get:
 *     summary: Get my challenge statistics
 *     tags: [Streaks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Challenge stats retrieved successfully
 */
router.get('/challenges/me/stats', authenticate, streaksController.getMyChallengeStats.bind(streaksController));

/**
 * @swagger
 * /api/streaks/challenges:
 *   get:
 *     summary: List all daily challenges
 *     tags: [Streaks]
 *     parameters:
 *       - in: query
 *         name: challengeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Challenges retrieved successfully
 */
router.get('/challenges', streaksController.listDailyChallenges.bind(streaksController));

/**
 * @swagger
 * /api/streaks/challenges/summary:
 *   get:
 *     summary: Get active challenges summary
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: Challenges summary retrieved successfully
 */
router.get('/challenges/summary', streaksController.getActiveChallengesSummary.bind(streaksController));

export default router;
