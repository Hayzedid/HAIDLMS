import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { engagementController } from '../controllers/engagement.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Engagement
 *   description: User profiles, social features, engagement tracking
 */

// ========================================
// USER PROFILES
// ========================================

/**
 * @swagger
 * /api/engagement/profile/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile/me', authenticate, engagementController.getMyProfile.bind(engagementController));

/**
 * @swagger
 * /api/engagement/profile/{userId}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Engagement]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       403:
 *         description: Profile is private
 */
router.get('/profile/:userId', engagementController.getUserProfileById.bind(engagementController));

/**
 * @swagger
 * /api/engagement/profile/me:
 *   put:
 *     summary: Update my profile
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               tagline:
 *                 type: string
 *               location:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               twitterHandle:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *               githubUsername:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile/me', authenticate, engagementController.updateMyProfile.bind(engagementController));

/**
 * @swagger
 * /api/engagement/profile/me/settings:
 *   put:
 *     summary: Update my profile settings
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *               showEmail:
 *                 type: boolean
 *               showProgress:
 *                 type: boolean
 *               showAchievements:
 *                 type: boolean
 *               allowMessages:
 *                 type: boolean
 *               allowFollows:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/profile/me/settings', authenticate, engagementController.updateMyProfileSettings.bind(engagementController));

// ========================================
// FOLLOWS
// ========================================

/**
 * @swagger
 * /api/engagement/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User followed successfully
 */
router.post('/follow', authenticate, engagementController.followUser.bind(engagementController));

/**
 * @swagger
 * /api/engagement/unfollow:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 */
router.post('/unfollow', authenticate, engagementController.unfollowUser.bind(engagementController));

/**
 * @swagger
 * /api/engagement/followers/me:
 *   get:
 *     summary: Get my followers
 *     tags: [Engagement]
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
 *         description: Followers retrieved successfully
 */
router.get('/followers/me', authenticate, engagementController.getMyFollowers.bind(engagementController));

/**
 * @swagger
 * /api/engagement/following/me:
 *   get:
 *     summary: Get users I'm following
 *     tags: [Engagement]
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
 *         description: Following list retrieved successfully
 */
router.get('/following/me', authenticate, engagementController.getMyFollowing.bind(engagementController));

/**
 * @swagger
 * /api/engagement/followers/{userId}:
 *   get:
 *     summary: Get user's followers
 *     tags: [Engagement]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *         description: Followers retrieved successfully
 */
router.get('/followers/:userId', engagementController.getUserFollowers.bind(engagementController));

/**
 * @swagger
 * /api/engagement/following/{userId}:
 *   get:
 *     summary: Get users that a user is following
 *     tags: [Engagement]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *         description: Following list retrieved successfully
 */
router.get('/following/:userId', engagementController.getUserFollowing.bind(engagementController));

// ========================================
// ENGAGEMENT ACTIVITIES
// ========================================

/**
 * @swagger
 * /api/engagement/like:
 *   post:
 *     summary: Like content
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum: [course, lesson, assessment, forum_post, forum_reply, portfolio_project, achievement, user_profile]
 *               targetId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content liked successfully
 */
router.post('/like', authenticate, engagementController.likeContent.bind(engagementController));

/**
 * @swagger
 * /api/engagement/unlike:
 *   post:
 *     summary: Unlike content
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *             properties:
 *               targetType:
 *                 type: string
 *               targetId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content unliked successfully
 */
router.post('/unlike', authenticate, engagementController.unlikeContent.bind(engagementController));

/**
 * @swagger
 * /api/engagement/stats/{targetType}/{targetId}:
 *   get:
 *     summary: Get engagement stats for content
 *     tags: [Engagement]
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Engagement stats retrieved successfully
 */
router.get('/stats/:targetType/:targetId', engagementController.getEngagementStats.bind(engagementController));

// ========================================
// KUDOS
// ========================================

/**
 * @swagger
 * /api/engagement/kudos:
 *   post:
 *     summary: Send kudos to a user
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - kudosType
 *             properties:
 *               recipientId:
 *                 type: string
 *               kudosType:
 *                 type: string
 *                 enum: [helpful, inspiring, knowledgeable, supportive, creative, dedicated]
 *               message:
 *                 type: string
 *               relatedType:
 *                 type: string
 *               relatedId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kudos sent successfully
 */
router.post('/kudos', authenticate, engagementController.sendKudos.bind(engagementController));

/**
 * @swagger
 * /api/engagement/kudos/received:
 *   get:
 *     summary: Get kudos I've received
 *     tags: [Engagement]
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
 *         description: Kudos retrieved successfully
 */
router.get('/kudos/received', authenticate, engagementController.getMyReceivedKudos.bind(engagementController));

/**
 * @swagger
 * /api/engagement/kudos/sent:
 *   get:
 *     summary: Get kudos I've sent
 *     tags: [Engagement]
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
 *         description: Kudos retrieved successfully
 */
router.get('/kudos/sent', authenticate, engagementController.getMySentKudos.bind(engagementController));

// ========================================
// CONTENT SHARING
// ========================================

/**
 * @swagger
 * /api/engagement/share:
 *   post:
 *     summary: Share content
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *               - platform
 *             properties:
 *               targetType:
 *                 type: string
 *               targetId:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [twitter, facebook, linkedin, whatsapp, email, copy_link, internal]
 *               shareUrl:
 *                 type: string
 *               shareMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content shared successfully
 */
router.post('/share', authenticate, engagementController.shareContent.bind(engagementController));

/**
 * @swagger
 * /api/engagement/shares/me:
 *   get:
 *     summary: Get my share history
 *     tags: [Engagement]
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
 *         description: Share history retrieved successfully
 */
router.get('/shares/me', authenticate, engagementController.getMyShares.bind(engagementController));

// ========================================
// BOOKMARKS
// ========================================

/**
 * @swagger
 * /api/engagement/bookmark:
 *   post:
 *     summary: Bookmark content
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *             properties:
 *               targetType:
 *                 type: string
 *               targetId:
 *                 type: string
 *               folderName:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content bookmarked successfully
 */
router.post('/bookmark', authenticate, engagementController.bookmarkContent.bind(engagementController));

/**
 * @swagger
 * /api/engagement/bookmark/{targetType}/{targetId}:
 *   delete:
 *     summary: Remove bookmark
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 */
router.delete('/bookmark/:targetType/:targetId', authenticate, engagementController.removeBookmark.bind(engagementController));

/**
 * @swagger
 * /api/engagement/bookmarks/me:
 *   get:
 *     summary: Get my bookmarks
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Bookmarks retrieved successfully
 */
router.get('/bookmarks/me', authenticate, engagementController.getMyBookmarks.bind(engagementController));

/**
 * @swagger
 * /api/engagement/bookmarks/folders:
 *   get:
 *     summary: Get my bookmark folders
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmark folders retrieved successfully
 */
router.get('/bookmarks/folders', authenticate, engagementController.getMyBookmarkFolders.bind(engagementController));

// ========================================
// ACTIVITY FEED
// ========================================

/**
 * @swagger
 * /api/engagement/feed/me:
 *   get:
 *     summary: Get my personalized activity feed
 *     tags: [Engagement]
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
 *         description: Activity feed retrieved successfully
 */
router.get('/feed/me', authenticate, engagementController.getMyActivityFeed.bind(engagementController));

/**
 * @swagger
 * /api/engagement/feed/public:
 *   get:
 *     summary: Get public activity feed
 *     tags: [Engagement]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Public activity feed retrieved successfully
 */
router.get('/feed/public', engagementController.getPublicActivityFeed.bind(engagementController));

// ========================================
// ENGAGEMENT SCORES
// ========================================

/**
 * @swagger
 * /api/engagement/score/me:
 *   get:
 *     summary: Get my engagement score
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement score retrieved successfully
 */
router.get('/score/me', authenticate, engagementController.getMyEngagementScore.bind(engagementController));

/**
 * @swagger
 * /api/engagement/score/refresh:
 *   post:
 *     summary: Refresh my engagement score
 *     tags: [Engagement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement score refreshed successfully
 */
router.post('/score/refresh', authenticate, engagementController.refreshMyEngagementScore.bind(engagementController));

/**
 * @swagger
 * /api/engagement/score/leaderboard:
 *   get:
 *     summary: Get engagement score leaderboard
 *     tags: [Engagement]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
router.get('/score/leaderboard', engagementController.getTopEngagedUsers.bind(engagementController));

// ========================================
// ENGAGEMENT ANALYTICS
// ========================================

/**
 * @swagger
 * /api/engagement/analytics/me:
 *   get:
 *     summary: Get my engagement analytics
 *     tags: [Engagement]
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
 *         description: Engagement analytics retrieved successfully
 */
router.get('/analytics/me', authenticate, engagementController.getMyEngagementAnalytics.bind(engagementController));

/**
 * @swagger
 * /api/engagement/trending:
 *   get:
 *     summary: Get trending content
 *     tags: [Engagement]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Trending content retrieved successfully
 */
router.get('/trending', engagementController.getTrendingContent.bind(engagementController));

export default router;
