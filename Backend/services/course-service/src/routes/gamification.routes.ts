import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { gamificationController } from '../controllers/gamification.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Gamification
 *   description: Points, rewards, achievements, quests, and gamification features
 */

// ========================================
// POINTS & XP
// ========================================

/**
 * @swagger
 * /api/gamification/points/me:
 *   get:
 *     summary: Get my points and XP
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User points retrieved successfully
 */
router.get('/points/me', authenticate, gamificationController.getMyPoints.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/points/transactions:
 *   get:
 *     summary: Get my point transaction history
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Point transactions retrieved successfully
 */
router.get('/points/transactions', authenticate, gamificationController.getPointTransactions.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/levels:
 *   get:
 *     summary: Get all level definitions
 *     tags: [Gamification]
 *     responses:
 *       200:
 *         description: Levels retrieved successfully
 */
router.get('/levels', gamificationController.getLevels.bind(gamificationController));

// ========================================
// ACHIEVEMENTS
// ========================================

/**
 * @swagger
 * /api/gamification/achievements:
 *   get:
 *     summary: List all achievements
 *     tags: [Gamification]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 */
router.get('/achievements', gamificationController.listAchievements.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/achievements/{id}:
 *   get:
 *     summary: Get achievement details
 *     tags: [Gamification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Achievement retrieved successfully
 *       404:
 *         description: Achievement not found
 */
router.get('/achievements/:id', gamificationController.getAchievement.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/achievements/me:
 *   get:
 *     summary: Get my achievements
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User achievements retrieved successfully
 */
router.get('/achievements/me', authenticate, gamificationController.getMyAchievements.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/achievements/{achievementId}/progress:
 *   post:
 *     summary: Update achievement progress
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: achievementId
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
 *               - progress
 *             properties:
 *               progress:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Achievement progress updated
 */
router.post('/achievements/:achievementId/progress', authenticate, gamificationController.updateAchievementProgress.bind(gamificationController));

// ========================================
// REWARDS
// ========================================

/**
 * @swagger
 * /api/gamification/rewards:
 *   get:
 *     summary: List all rewards
 *     tags: [Gamification]
 *     parameters:
 *       - in: query
 *         name: rewardType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPoints
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxPoints
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rewards retrieved successfully
 */
router.get('/rewards', gamificationController.listRewards.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/rewards/{id}:
 *   get:
 *     summary: Get reward details
 *     tags: [Gamification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward retrieved successfully
 *       404:
 *         description: Reward not found
 */
router.get('/rewards/:id', gamificationController.getReward.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/rewards/{rewardId}/redeem:
 *   post:
 *     summary: Redeem a reward
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rewardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Reward redeemed successfully
 *       400:
 *         description: Insufficient points or reward unavailable
 */
router.post('/rewards/:rewardId/redeem', authenticate, gamificationController.redeemReward.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/rewards/redemptions/me:
 *   get:
 *     summary: Get my reward redemptions
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Redemptions retrieved successfully
 */
router.get('/rewards/redemptions/me', authenticate, gamificationController.getMyRedemptions.bind(gamificationController));

// ========================================
// QUESTS
// ========================================

/**
 * @swagger
 * /api/gamification/quests:
 *   get:
 *     summary: List all quests
 *     tags: [Gamification]
 *     parameters:
 *       - in: query
 *         name: questType
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quests retrieved successfully
 */
router.get('/quests', gamificationController.listQuests.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/quests/{id}:
 *   get:
 *     summary: Get quest details
 *     tags: [Gamification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quest retrieved successfully
 *       404:
 *         description: Quest not found
 */
router.get('/quests/:id', gamificationController.getQuest.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/quests/{questId}/start:
 *   post:
 *     summary: Start a quest
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Quest started successfully
 */
router.post('/quests/:questId/start', authenticate, gamificationController.startQuest.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/quests/me:
 *   get:
 *     summary: Get my quests
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, abandoned, expired]
 *     responses:
 *       200:
 *         description: User quests retrieved successfully
 */
router.get('/quests/me', authenticate, gamificationController.getMyQuests.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/quests/progress/{userQuestId}:
 *   post:
 *     summary: Update quest progress
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userQuestId
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
 *               - completedObjectives
 *             properties:
 *               completedObjectives:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Quest progress updated
 */
router.post('/quests/progress/:userQuestId', authenticate, gamificationController.updateQuestProgress.bind(gamificationController));

// ========================================
// POWER-UPS
// ========================================

/**
 * @swagger
 * /api/gamification/power-ups:
 *   get:
 *     summary: List all power-ups
 *     tags: [Gamification]
 *     responses:
 *       200:
 *         description: Power-ups retrieved successfully
 */
router.get('/power-ups', gamificationController.listPowerUps.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/power-ups/{powerUpId}/activate:
 *   post:
 *     summary: Activate a power-up
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: powerUpId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Power-up activated successfully
 *       400:
 *         description: Insufficient points
 */
router.post('/power-ups/:powerUpId/activate', authenticate, gamificationController.activatePowerUp.bind(gamificationController));

/**
 * @swagger
 * /api/gamification/power-ups/active/me:
 *   get:
 *     summary: Get my active power-ups
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active power-ups retrieved successfully
 */
router.get('/power-ups/active/me', authenticate, gamificationController.getMyActivePowerUps.bind(gamificationController));

export default router;
