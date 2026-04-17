import { Router } from 'express';
import { webhooksController } from '../controllers/webhooks.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook and event management endpoints
 */

// ========================================
// WEBHOOK ENDPOINTS
// ========================================

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   post:
 *     summary: Create webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - subscribedEvents
 *             properties:
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *               subscribedEvents:
 *                 type: array
 *                 items:
 *                   type: string
 *               organizationId:
 *                 type: string
 *               maxRequestsPerMinute:
 *                 type: integer
 *               maxRetries:
 *                 type: integer
 *               retryDelaySeconds:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Webhook endpoint created
 */
router.post('/endpoints', authenticate, webhooksController.createWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   get:
 *     summary: Get webhook endpoints
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoints retrieved
 */
router.get('/endpoints', authenticate, webhooksController.getWebhookEndpoints.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   get:
 *     summary: Get webhook endpoint by ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint retrieved
 */
router.get('/endpoints/:endpointId', authenticate, webhooksController.getWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   put:
 *     summary: Update webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook endpoint updated
 */
router.put('/endpoints/:endpointId', authenticate, webhooksController.updateWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   delete:
 *     summary: Delete webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint deleted
 */
router.delete('/endpoints/:endpointId', authenticate, webhooksController.deleteWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/enable:
 *   post:
 *     summary: Enable webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint enabled
 */
router.post('/endpoints/:endpointId/enable', authenticate, webhooksController.enableWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/disable:
 *   post:
 *     summary: Disable webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint disabled
 */
router.post('/endpoints/:endpointId/disable', authenticate, webhooksController.disableWebhookEndpoint.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/rotate-secret:
 *   post:
 *     summary: Rotate webhook secret key
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook secret rotated
 */
router.post('/endpoints/:endpointId/rotate-secret', authenticate, webhooksController.rotateWebhookSecret.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/endpoints/health:
 *   get:
 *     summary: Get webhook endpoint health status
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook endpoint health retrieved
 */
router.get('/endpoints/health/all', authenticate, webhooksController.getWebhookEndpointHealth.bind(webhooksController));

// ========================================
// WEBHOOK EVENTS
// ========================================

/**
 * @swagger
 * /api/webhooks/events:
 *   post:
 *     summary: Publish event
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - payload
 *             properties:
 *               eventType:
 *                 type: string
 *               payload:
 *                 type: object
 *               sourceEntityType:
 *                 type: string
 *               sourceEntityId:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event published
 */
router.post('/events', authenticate, webhooksController.publishEvent.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/events:
 *   get:
 *     summary: Get webhook events
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceEntityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceEntityId
 *         schema:
 *           type: string
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
 *         description: Webhook events retrieved
 */
router.get('/events', authenticate, webhooksController.getWebhookEvents.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/events/recent:
 *   get:
 *     summary: Get recent webhook events
 *     tags: [Webhooks]
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
 *         description: Recent webhook events retrieved
 */
router.get('/events/recent', authenticate, webhooksController.getRecentWebhookEvents.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/events/{eventId}:
 *   get:
 *     summary: Get webhook event by ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook event retrieved
 */
router.get('/events/:eventId', authenticate, webhooksController.getWebhookEvent.bind(webhooksController));

// ========================================
// WEBHOOK DELIVERIES
// ========================================

/**
 * @swagger
 * /api/webhooks/deliveries:
 *   get:
 *     summary: Get webhook deliveries
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: webhookEndpointId
 *         schema:
 *           type: string
 *       - in: query
 *         name: webhookEventId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Webhook deliveries retrieved
 */
router.get('/deliveries', authenticate, webhooksController.getWebhookDeliveries.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/deliveries/pending:
 *   get:
 *     summary: Get pending webhook deliveries
 *     tags: [Webhooks]
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
 *         description: Pending deliveries retrieved
 */
router.get('/deliveries/pending', authenticate, authorizeRoles('admin'), webhooksController.getPendingDeliveries.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/deliveries/failed:
 *   get:
 *     summary: Get failed webhook deliveries
 *     tags: [Webhooks]
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
 *         description: Failed deliveries retrieved
 */
router.get('/deliveries/failed', authenticate, webhooksController.getFailedDeliveries.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/deliveries/{deliveryId}:
 *   get:
 *     summary: Get webhook delivery by ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook delivery retrieved
 */
router.get('/deliveries/:deliveryId', authenticate, webhooksController.getWebhookDelivery.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/deliveries/{deliveryId}/retry:
 *   post:
 *     summary: Retry failed webhook delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery retry scheduled
 */
router.post('/deliveries/:deliveryId/retry', authenticate, webhooksController.retryDelivery.bind(webhooksController));

// ========================================
// EVENT SUBSCRIPTIONS
// ========================================

/**
 * @swagger
 * /api/webhooks/subscriptions:
 *   post:
 *     summary: Create event subscription
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriberType
 *               - eventTypes
 *             properties:
 *               subscriberType:
 *                 type: string
 *               subscriberId:
 *                 type: string
 *               eventTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               entityTypeFilter:
 *                 type: string
 *               filterConditions:
 *                 type: object
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event subscription created
 */
router.post('/subscriptions', authenticate, authorizeRoles('admin'), webhooksController.createEventSubscription.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/subscriptions:
 *   get:
 *     summary: Get event subscriptions
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subscriberType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event subscriptions retrieved
 */
router.get('/subscriptions', authenticate, authorizeRoles('admin'), webhooksController.getEventSubscriptions.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/subscriptions/{subscriptionId}:
 *   delete:
 *     summary: Delete event subscription
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event subscription deleted
 */
router.delete('/subscriptions/:subscriptionId', authenticate, authorizeRoles('admin'), webhooksController.deleteEventSubscription.bind(webhooksController));

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * @swagger
 * /api/webhooks/handlers:
 *   post:
 *     summary: Create event handler
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - handlerName
 *               - handlerType
 *               - eventTypes
 *               - handlerFunction
 *             properties:
 *               handlerName:
 *                 type: string
 *               handlerType:
 *                 type: string
 *               description:
 *                 type: string
 *               eventTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               handlerFunction:
 *                 type: string
 *               timeoutSeconds:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event handler created
 */
router.post('/handlers', authenticate, authorizeRoles('admin'), webhooksController.createEventHandler.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/handlers:
 *   get:
 *     summary: Get event handlers
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event handlers retrieved
 */
router.get('/handlers', authenticate, authorizeRoles('admin'), webhooksController.getEventHandlers.bind(webhooksController));

// ========================================
// WEBHOOK LOGS
// ========================================

/**
 * @swagger
 * /api/webhooks/logs:
 *   get:
 *     summary: Get webhook logs
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: webhookEndpointId
 *         schema:
 *           type: string
 *       - in: query
 *         name: webhookDeliveryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: logLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Webhook logs retrieved
 */
router.get('/logs', authenticate, webhooksController.getWebhookLogs.bind(webhooksController));

// ========================================
// EVENT REPLAY
// ========================================

/**
 * @swagger
 * /api/webhooks/replay:
 *   post:
 *     summary: Create event replay
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventIds
 *             properties:
 *               eventIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               webhookEndpointIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event replay queued
 */
router.post('/replay', authenticate, authorizeRoles('admin'), webhooksController.createEventReplay.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/replay:
 *   get:
 *     summary: Get event replays
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event replays retrieved
 */
router.get('/replay', authenticate, authorizeRoles('admin'), webhooksController.getEventReplays.bind(webhooksController));

// ========================================
// STATISTICS
// ========================================

/**
 * @swagger
 * /api/webhooks/statistics:
 *   get:
 *     summary: Get webhook statistics
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: webhookEndpointId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved
 */
router.get('/statistics', authenticate, webhooksController.getWebhookStatistics.bind(webhooksController));

/**
 * @swagger
 * /api/webhooks/statistics/events:
 *   get:
 *     summary: Get event statistics
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event statistics retrieved
 */
router.get('/statistics/events', authenticate, webhooksController.getEventStatistics.bind(webhooksController));

export default router;
