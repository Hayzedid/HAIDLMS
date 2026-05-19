import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { integrationsController } from '../controllers/integrations.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Third-party integrations including LMS, SSO, calendars, and video conferencing
 */

// ========================================
// INTEGRATION PROVIDERS
// ========================================

/**
 * @swagger
 * /api/integrations/providers:
 *   get:
 *     summary: List integration providers
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: integrationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Providers retrieved successfully
 */
router.get('/providers', authenticate, integrationsController.listProviders.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/providers/{providerId}:
 *   get:
 *     summary: Get integration provider
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Provider retrieved successfully
 */
router.get('/providers/:providerId', authenticate, integrationsController.getProvider.bind(integrationsController));

// ========================================
// ORGANIZATION INTEGRATIONS
// ========================================

/**
 * @swagger
 * /api/integrations:
 *   post:
 *     summary: Create integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - providerId
 *             properties:
 *               organizationId:
 *                 type: string
 *               providerId:
 *                 type: string
 *               integrationName:
 *                 type: string
 *               config:
 *                 type: object
 *               enableSso:
 *                 type: boolean
 *               enableSync:
 *                 type: boolean
 *               enableWebhooks:
 *                 type: boolean
 *               autoSyncEnabled:
 *                 type: boolean
 *               syncIntervalMinutes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Integration created successfully
 */
router.post('/', authenticate, integrationsController.createIntegration.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/active:
 *   get:
 *     summary: Get active integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active integrations retrieved successfully
 */
router.get('/active', authenticate, integrationsController.getActiveIntegrations.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}:
 *   get:
 *     summary: Get integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration retrieved successfully
 */
router.get('/:integrationId', authenticate, integrationsController.getIntegration.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}:
 *   patch:
 *     summary: Update integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               integrationName:
 *                 type: string
 *               config:
 *                 type: object
 *               enableSso:
 *                 type: boolean
 *               enableSync:
 *                 type: boolean
 *               enableWebhooks:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Integration updated successfully
 */
router.patch('/:integrationId', authenticate, integrationsController.updateIntegration.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/disconnect:
 *   post:
 *     summary: Disconnect integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration disconnected successfully
 */
router.post('/:integrationId/disconnect', authenticate, integrationsController.disconnectIntegration.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/organization/{organizationId}:
 *   get:
 *     summary: List organization integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: integrationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Integrations retrieved successfully
 */
router.get('/organization/:organizationId', authenticate, integrationsController.listIntegrations.bind(integrationsController));

// ========================================
// OAUTH CREDENTIALS
// ========================================

/**
 * @swagger
 * /api/integrations/oauth/credentials:
 *   post:
 *     summary: Save OAuth credentials
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - providerType
 *               - accessToken
 *             properties:
 *               integrationId:
 *                 type: string
 *               providerType:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               grantedScopes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Credentials saved successfully
 */
router.post('/oauth/credentials', authenticate, integrationsController.saveOAuthCredentials.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/oauth/credentials:
 *   get:
 *     summary: Get OAuth credentials
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credentials retrieved successfully
 */
router.get('/:integrationId/oauth/credentials', authenticate, integrationsController.getOAuthCredentials.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/oauth/invalidate:
 *   post:
 *     summary: Invalidate OAuth credentials
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credentials invalidated successfully
 */
router.post('/:integrationId/oauth/invalidate', authenticate, integrationsController.invalidateOAuthCredentials.bind(integrationsController));

// ========================================
// SSO CONFIGURATIONS
// ========================================

/**
 * @swagger
 * /api/integrations/sso/config:
 *   post:
 *     summary: Create SSO configuration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - organizationId
 *               - ssoType
 *             properties:
 *               integrationId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               ssoType:
 *                 type: string
 *               samlEntityId:
 *                 type: string
 *               samlSsoUrl:
 *                 type: string
 *               samlCertificate:
 *                 type: string
 *               clientId:
 *                 type: string
 *               clientSecret:
 *                 type: string
 *               authorizationEndpoint:
 *                 type: string
 *               tokenEndpoint:
 *                 type: string
 *               attributeMapping:
 *                 type: object
 *               autoProvisionUsers:
 *                 type: boolean
 *               defaultRole:
 *                 type: string
 *               allowedDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: SSO config created successfully
 */
router.post('/sso/config', authenticate, integrationsController.createSSOConfig.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/sso/config/{organizationId}:
 *   get:
 *     summary: Get SSO configuration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSO config retrieved successfully
 */
router.get('/sso/config/:organizationId', authenticate, integrationsController.getSSOConfig.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/sso/config/{configId}:
 *   patch:
 *     summary: Update SSO configuration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: SSO config updated successfully
 */
router.patch('/sso/config/:configId', authenticate, integrationsController.updateSSOConfig.bind(integrationsController));

// ========================================
// SYNC JOBS
// ========================================

/**
 * @swagger
 * /api/integrations/sync/jobs:
 *   post:
 *     summary: Create sync job
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - jobType
 *               - triggeredBy
 *             properties:
 *               integrationId:
 *                 type: string
 *               jobType:
 *                 type: string
 *               direction:
 *                 type: string
 *               syncConfig:
 *                 type: object
 *               filters:
 *                 type: object
 *               triggeredBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sync job created successfully
 */
router.post('/sync/jobs', authenticate, integrationsController.createSyncJob.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/sync/jobs/{jobId}:
 *   get:
 *     summary: Get sync job
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sync job retrieved successfully
 */
router.get('/sync/jobs/:jobId', authenticate, integrationsController.getSyncJob.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/sync/jobs:
 *   get:
 *     summary: List sync jobs
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Sync jobs retrieved successfully
 */
router.get('/:integrationId/sync/jobs', authenticate, integrationsController.listSyncJobs.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/sync/jobs/{jobId}/status:
 *   patch:
 *     summary: Update sync job status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               progressData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Sync job status updated successfully
 */
router.patch('/sync/jobs/:jobId/status', authenticate, integrationsController.updateSyncJobStatus.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/sync/statistics:
 *   get:
 *     summary: Get sync statistics
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sync statistics retrieved successfully
 */
router.get('/:integrationId/sync/statistics', authenticate, integrationsController.getSyncStatistics.bind(integrationsController));

// ========================================
// WEBHOOKS
// ========================================

/**
 * @swagger
 * /api/integrations/webhooks:
 *   post:
 *     summary: Create webhook
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - name
 *               - url
 *               - events
 *             properties:
 *               integrationId:
 *                 type: string
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               secret:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               customHeaders:
 *                 type: object
 *               filters:
 *                 type: object
 *               verifySsl:
 *                 type: boolean
 *               timeoutSeconds:
 *                 type: integer
 *               retryCount:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Webhook created successfully
 */
router.post('/webhooks', authenticate, integrationsController.createWebhook.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/webhooks/performance:
 *   get:
 *     summary: Get webhook performance
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook performance retrieved successfully
 */
router.get('/webhooks/performance', authenticate, integrationsController.getWebhookPerformance.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/webhooks/{webhookId}:
 *   get:
 *     summary: Get webhook
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook retrieved successfully
 */
router.get('/webhooks/:webhookId', authenticate, integrationsController.getWebhook.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/webhooks:
 *   get:
 *     summary: List webhooks
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 */
router.get('/:integrationId/webhooks', authenticate, integrationsController.listWebhooks.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/webhooks/{webhookId}:
 *   patch:
 *     summary: Update webhook
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 */
router.patch('/webhooks/:webhookId', authenticate, integrationsController.updateWebhook.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/webhooks/{webhookId}:
 *   delete:
 *     summary: Delete webhook
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 */
router.delete('/webhooks/:webhookId', authenticate, integrationsController.deleteWebhook.bind(integrationsController));

// ========================================
// HEALTH CHECKS
// ========================================

/**
 * @swagger
 * /api/integrations/health/check:
 *   post:
 *     summary: Record health check
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - checkType
 *               - status
 *               - checkDetails
 *             properties:
 *               integrationId:
 *                 type: string
 *               checkType:
 *                 type: string
 *               status:
 *                 type: string
 *               checkDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Health check recorded successfully
 */
router.post('/health/check', authenticate, integrationsController.recordHealthCheck.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/health/summary:
 *   get:
 *     summary: Get health summary
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health summary retrieved successfully
 */
router.get('/health/summary', authenticate, integrationsController.getHealthSummary.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/health:
 *   get:
 *     summary: Get integration health
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration health retrieved successfully
 */
router.get('/:integrationId/health', authenticate, integrationsController.getIntegrationHealth.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/health/check:
 *   get:
 *     summary: Check if integration is healthy
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Health check completed successfully
 */
router.get('/:integrationId/health/check', authenticate, integrationsController.checkHealth.bind(integrationsController));

// ========================================
// INTEGRATION EVENTS
// ========================================

/**
 * @swagger
 * /api/integrations/events:
 *   post:
 *     summary: Log integration event
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationId
 *               - eventType
 *               - eventCategory
 *               - severity
 *               - message
 *             properties:
 *               integrationId:
 *                 type: string
 *               eventType:
 *                 type: string
 *               eventCategory:
 *                 type: string
 *               severity:
 *                 type: string
 *               message:
 *                 type: string
 *               eventData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event logged successfully
 */
router.post('/events', authenticate, integrationsController.logEvent.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/events:
 *   get:
 *     summary: Get integration events
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 */
router.get('/:integrationId/events', authenticate, integrationsController.getEvents.bind(integrationsController));

// ========================================
// HELPER ENDPOINTS
// ========================================

/**
 * @swagger
 * /api/integrations/{integrationId}/error:
 *   post:
 *     summary: Record integration error
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
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
 *               - errorMessage
 *             properties:
 *               errorMessage:
 *                 type: string
 *               errorDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Error recorded successfully
 */
router.post('/:integrationId/error', authenticate, integrationsController.recordError.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/reset-errors:
 *   post:
 *     summary: Reset integration errors
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Errors reset successfully
 */
router.post('/:integrationId/reset-errors', authenticate, integrationsController.resetErrors.bind(integrationsController));

/**
 * @swagger
 * /api/integrations/{integrationId}/schedule-sync:
 *   post:
 *     summary: Schedule next sync
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Next sync scheduled successfully
 */
router.post('/:integrationId/schedule-sync', authenticate, integrationsController.scheduleNextSync.bind(integrationsController));

export default router;
