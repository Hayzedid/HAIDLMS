import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: notificationType
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount.bind(notificationController));

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}/archive:
 *   put:
 *     summary: Archive notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification archived
 */
router.put('/:id/archive', authenticate, notificationController.archiveNotification.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', authenticate, notificationController.deleteNotification.bind(notificationController));

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 */
router.get('/preferences', authenticate, notificationController.getPreferences.bind(notificationController));

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               emailFrequency:
 *                 type: string
 *                 enum: [immediate, daily_digest, weekly_digest, never]
 *               courseAnnouncements:
 *                 type: boolean
 *               forumReplyToThread:
 *                 type: boolean
 *               badgeEarned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.put('/preferences', authenticate, notificationController.updatePreferences.bind(notificationController));

/**
 * @swagger
 * /api/notifications/subscriptions:
 *   get:
 *     summary: Get user subscriptions
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 */
router.get('/subscriptions', authenticate, notificationController.getSubscriptions.bind(notificationController));

/**
 * @swagger
 * /api/notifications/subscribe:
 *   post:
 *     summary: Subscribe to entity notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionType
 *               - entityId
 *             properties:
 *               subscriptionType:
 *                 type: string
 *                 enum: [thread_follow, course_watch, user_follow]
 *               entityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscribed successfully
 */
router.post('/subscribe', authenticate, notificationController.subscribe.bind(notificationController));

/**
 * @swagger
 * /api/notifications/unsubscribe:
 *   post:
 *     summary: Unsubscribe from entity notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionType
 *               - entityId
 *             properties:
 *               subscriptionType:
 *                 type: string
 *                 enum: [thread_follow, course_watch, user_follow]
 *               entityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */
router.post('/unsubscribe', authenticate, notificationController.unsubscribe.bind(notificationController));

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Send test notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post('/test', authenticate, notificationController.sendTestNotification.bind(notificationController));

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Send bulk notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - notification
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               notification:
 *                 type: object
 *                 properties:
 *                   notificationType:
 *                     type: string
 *                   title:
 *                     type: string
 *                   message:
 *                     type: string
 *                   priority:
 *                     type: string
 *     responses:
 *       200:
 *         description: Bulk notifications sent
 */
router.post('/bulk', authenticate, authorize('admin'), notificationController.sendBulkNotification.bind(notificationController));

/**
 * @swagger
 * /api/notifications/archive-old:
 *   post:
 *     summary: Archive old notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Archive notifications older than this many days
 *     responses:
 *       200:
 *         description: Old notifications archived
 */
router.post('/archive-old', authenticate, authorize('admin'), notificationController.archiveOldNotifications.bind(notificationController));

/**
 * @swagger
 * /api/notifications/send-digests:
 *   post:
 *     summary: Send digest notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - digestType
 *             properties:
 *               digestType:
 *                 type: string
 *                 enum: [daily_digest, weekly_digest]
 *     responses:
 *       200:
 *         description: Digests sent successfully
 */
router.post('/send-digests', authenticate, authorize('admin'), notificationController.sendDigests.bind(notificationController));

export default router;
