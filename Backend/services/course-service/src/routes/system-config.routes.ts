import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { systemConfigController } from '../controllers/system-config.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: System Config
 *   description: System configuration including settings, feature flags, templates, and maintenance
 */

// ========================================
// SYSTEM SETTINGS
// ========================================

/**
 * @swagger
 * /api/system-config/settings:
 *   post:
 *     summary: Create system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               dataType:
 *                 type: string
 *               scope:
 *                 type: string
 *               scopeId:
 *                 type: string
 *               category:
 *                 type: string
 *               label:
 *                 type: string
 *               description:
 *                 type: string
 *               isSensitive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Setting created successfully
 */
router.post('/settings', authenticate, systemConfigController.createSetting.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings:
 *   get:
 *     summary: List system settings
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/settings', authenticate, systemConfigController.listSettings.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings/overview:
 *   get:
 *     summary: Get settings overview
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview retrieved successfully
 */
router.get('/settings/overview', authenticate, systemConfigController.getSettingsOverview.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings/{key}:
 *   get:
 *     summary: Get system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 */
router.get('/settings/:key', authenticate, systemConfigController.getSetting.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings/{key}/value:
 *   get:
 *     summary: Get setting value
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Value retrieved successfully
 */
router.get('/settings/:key/value', authenticate, systemConfigController.getSettingValue.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings/{settingId}:
 *   patch:
 *     summary: Update system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settingId
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
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated successfully
 */
router.patch('/settings/:settingId', authenticate, systemConfigController.updateSetting.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/settings/{settingId}:
 *   delete:
 *     summary: Delete system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 */
router.delete('/settings/:settingId', authenticate, systemConfigController.deleteSetting.bind(systemConfigController));

// ========================================
// FEATURE FLAGS
// ========================================

/**
 * @swagger
 * /api/system-config/feature-flags:
 *   post:
 *     summary: Create feature flag
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - key
 *             properties:
 *               name:
 *                 type: string
 *               key:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               rolloutStrategy:
 *                 type: string
 *               rolloutPercentage:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Feature flag created successfully
 */
router.post('/feature-flags', authenticate, systemConfigController.createFeatureFlag.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags:
 *   get:
 *     summary: List feature flags
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 */
router.get('/feature-flags', authenticate, systemConfigController.listFeatureFlags.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags/active:
 *   get:
 *     summary: Get active feature flags
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active flags retrieved successfully
 */
router.get('/feature-flags/active', authenticate, systemConfigController.getActiveFeatureFlags.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags/{flagId}:
 *   get:
 *     summary: Get feature flag
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature flag retrieved successfully
 */
router.get('/feature-flags/:flagId', authenticate, systemConfigController.getFeatureFlag.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags/{flagId}:
 *   patch:
 *     summary: Update feature flag
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flagId
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
 *         description: Feature flag updated successfully
 */
router.patch('/feature-flags/:flagId', authenticate, systemConfigController.updateFeatureFlag.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags/{featureKey}/check:
 *   get:
 *     summary: Check if feature is enabled
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: featureKey
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature checked successfully
 */
router.get('/feature-flags/:featureKey/check', authenticate, systemConfigController.checkFeature.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/feature-flags/overrides:
 *   post:
 *     summary: Create feature flag override
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flagId
 *               - overrideType
 *               - targetId
 *               - isEnabled
 *             properties:
 *               flagId:
 *                 type: string
 *               overrideType:
 *                 type: string
 *               targetId:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Override created successfully
 */
router.post('/feature-flags/overrides', authenticate, systemConfigController.createFeatureFlagOverride.bind(systemConfigController));

// ========================================
// TEMPLATES
// ========================================

/**
 * @swagger
 * /api/system-config/templates:
 *   post:
 *     summary: Create template
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - templateType
 *               - body
 *             properties:
 *               name:
 *                 type: string
 *               templateType:
 *                 type: string
 *               templateFormat:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               locale:
 *                 type: string
 *               availableVariables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/templates', authenticate, systemConfigController.createTemplate.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/templates:
 *   get:
 *     summary: List templates
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
router.get('/templates', authenticate, systemConfigController.listTemplates.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/templates/statistics:
 *   get:
 *     summary: Get template statistics
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/templates/statistics', authenticate, systemConfigController.getTemplateStatistics.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/templates/{templateId}:
 *   get:
 *     summary: Get template
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 */
router.get('/templates/:templateId', authenticate, systemConfigController.getTemplate.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/templates/{templateId}:
 *   patch:
 *     summary: Update template
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
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
 *         description: Template updated successfully
 */
router.patch('/templates/:templateId', authenticate, systemConfigController.updateTemplate.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/templates/default/{templateType}:
 *   get:
 *     summary: Get default template
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           default: en
 *     responses:
 *       200:
 *         description: Default template retrieved successfully
 */
router.get('/templates/default/:templateType', authenticate, systemConfigController.getDefaultTemplate.bind(systemConfigController));

// ========================================
// MAINTENANCE WINDOWS
// ========================================

/**
 * @swagger
 * /api/system-config/maintenance:
 *   post:
 *     summary: Create maintenance window
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - scheduledStart
 *               - scheduledEnd
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               maintenanceType:
 *                 type: string
 *               scheduledStart:
 *                 type: string
 *                 format: date-time
 *               scheduledEnd:
 *                 type: string
 *                 format: date-time
 *               affectedServices:
 *                 type: array
 *                 items:
 *                   type: string
 *               notifyUsers:
 *                 type: boolean
 *               notificationMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Maintenance window created successfully
 */
router.post('/maintenance', authenticate, systemConfigController.createMaintenanceWindow.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/maintenance:
 *   get:
 *     summary: List maintenance windows
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Maintenance windows retrieved successfully
 */
router.get('/maintenance', authenticate, systemConfigController.listMaintenanceWindows.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/maintenance/check:
 *   get:
 *     summary: Check maintenance mode
 *     tags: [System Config]
 *     responses:
 *       200:
 *         description: Maintenance mode status retrieved
 */
router.get('/maintenance/check', systemConfigController.checkMaintenanceMode.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/maintenance/{windowId}:
 *   get:
 *     summary: Get maintenance window
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: windowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance window retrieved successfully
 */
router.get('/maintenance/:windowId', authenticate, systemConfigController.getMaintenanceWindow.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/maintenance/{windowId}/activate:
 *   post:
 *     summary: Activate maintenance window
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: windowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance window activated
 */
router.post('/maintenance/:windowId/activate', authenticate, systemConfigController.activateMaintenanceWindow.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/maintenance/{windowId}/complete:
 *   post:
 *     summary: Complete maintenance window
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: windowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance window completed
 */
router.post('/maintenance/:windowId/complete', authenticate, systemConfigController.completeMaintenanceWindow.bind(systemConfigController));

// ========================================
// RATE LIMITING
// ========================================

/**
 * @swagger
 * /api/system-config/rate-limits:
 *   post:
 *     summary: Create rate limit config
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - endpointPattern
 *             properties:
 *               name:
 *                 type: string
 *               endpointPattern:
 *                 type: string
 *               requestsPerSecond:
 *                 type: integer
 *               requestsPerMinute:
 *                 type: integer
 *               requestsPerHour:
 *                 type: integer
 *               requestsPerDay:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rate limit config created successfully
 */
router.post('/rate-limits', authenticate, systemConfigController.createRateLimitConfig.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/rate-limits:
 *   get:
 *     summary: List rate limit configs
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limit configs retrieved successfully
 */
router.get('/rate-limits', authenticate, systemConfigController.listRateLimitConfigs.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/rate-limits/{configId}:
 *   get:
 *     summary: Get rate limit config
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rate limit config retrieved successfully
 */
router.get('/rate-limits/:configId', authenticate, systemConfigController.getRateLimitConfig.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/rate-limits/{configId}:
 *   patch:
 *     summary: Update rate limit config
 *     tags: [System Config]
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
 *         description: Rate limit config updated successfully
 */
router.patch('/rate-limits/:configId', authenticate, systemConfigController.updateRateLimitConfig.bind(systemConfigController));

// ========================================
// BRANDING
// ========================================

/**
 * @swagger
 * /api/system-config/branding:
 *   post:
 *     summary: Create branding config
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationId:
 *                 type: string
 *               brandName:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               customDomain:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branding config created successfully
 */
router.post('/branding', authenticate, systemConfigController.createBrandingConfig.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/branding/{organizationId}:
 *   get:
 *     summary: Get branding config
 *     tags: [System Config]
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
 *         description: Branding config retrieved successfully
 */
router.get('/branding/:organizationId', authenticate, systemConfigController.getBrandingConfig.bind(systemConfigController));

/**
 * @swagger
 * /api/system-config/branding/{configId}:
 *   patch:
 *     summary: Update branding config
 *     tags: [System Config]
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
 *         description: Branding config updated successfully
 */
router.patch('/branding/:configId', authenticate, systemConfigController.updateBrandingConfig.bind(systemConfigController));

// ========================================
// CONFIGURATION HISTORY
// ========================================

/**
 * @swagger
 * /api/system-config/history/{configType}/{configId}:
 *   get:
 *     summary: Get configuration history
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: configId
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
 *         description: History retrieved successfully
 */
router.get('/history/:configType/:configId', authenticate, systemConfigController.getConfigHistory.bind(systemConfigController));

export default router;
