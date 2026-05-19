import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { adminDashboardController } from '../controllers/admin-dashboard.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard, system monitoring, and super admin features
 */

// DASHBOARD SUMMARY
/**
 * @swagger
 * /api/admin/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 */
router.get('/dashboard/summary', authenticate, adminDashboardController.getDashboardSummary.bind(adminDashboardController));

// SYSTEM METRICS
/**
 * @swagger
 * /api/admin/metrics:
 *   post:
 *     summary: Record system metric
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricName
 *               - metricType
 *               - metricValue
 *             properties:
 *               metricName:
 *                 type: string
 *               metricType:
 *                 type: string
 *                 enum: [counter, gauge, histogram, summary]
 *               metricValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Metric recorded successfully
 */
router.post('/metrics', authenticate, adminDashboardController.recordSystemMetric.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricName
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', authenticate, adminDashboardController.getSystemMetrics.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/metrics/realtime:
 *   get:
 *     summary: Get realtime system metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Realtime metrics retrieved successfully
 */
router.get('/metrics/realtime', authenticate, adminDashboardController.getRealtimeSystemMetrics.bind(adminDashboardController));

// SYSTEM HEALTH
/**
 * @swagger
 * /api/admin/health:
 *   post:
 *     summary: Record health check
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - componentName
 *               - componentType
 *               - status
 *             properties:
 *               componentName:
 *                 type: string
 *               componentType:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [healthy, degraded, critical, down]
 *     responses:
 *       201:
 *         description: Health check recorded successfully
 */
router.post('/health', authenticate, adminDashboardController.recordHealthCheck.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/health/overview:
 *   get:
 *     summary: Get system health overview
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health overview retrieved successfully
 */
router.get('/health/overview', authenticate, adminDashboardController.getSystemHealthOverview.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/health/score:
 *   get:
 *     summary: Get system health score
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health score retrieved successfully
 */
router.get('/health/score', authenticate, adminDashboardController.getSystemHealthScore.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/health/history/{componentName}:
 *   get:
 *     summary: Get health check history
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: History retrieved successfully
 */
router.get('/health/history/:componentName', authenticate, adminDashboardController.getHealthCheckHistory.bind(adminDashboardController));

// RESOURCE USAGE
/**
 * @swagger
 * /api/admin/resources:
 *   post:
 *     summary: Record resource usage
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceType
 *               - usagePercentage
 *             properties:
 *               resourceType:
 *                 type: string
 *               resourceName:
 *                 type: string
 *               currentValue:
 *                 type: number
 *               maxValue:
 *                 type: number
 *               usagePercentage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Resource usage recorded successfully
 */
router.post('/resources', authenticate, adminDashboardController.recordResourceUsage.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     summary: Get resource usage
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: alertsOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Resource usage retrieved successfully
 */
router.get('/resources', authenticate, adminDashboardController.getResourceUsage.bind(adminDashboardController));

// ERROR LOGS
/**
 * @swagger
 * /api/admin/errors:
 *   post:
 *     summary: Log error
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - errorMessage
 *             properties:
 *               errorCode:
 *                 type: string
 *               errorMessage:
 *                 type: string
 *               errorType:
 *                 type: string
 *               stackTrace:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [info, warning, error, critical]
 *     responses:
 *       201:
 *         description: Error logged successfully
 */
router.post('/errors', authenticate, adminDashboardController.logError.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/errors:
 *   get:
 *     summary: Get error logs
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Error logs retrieved successfully
 */
router.get('/errors', authenticate, adminDashboardController.getErrorLogs.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/errors/top:
 *   get:
 *     summary: Get top errors
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top errors retrieved successfully
 */
router.get('/errors/top', authenticate, adminDashboardController.getTopErrors.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/errors/{errorId}/resolve:
 *   post:
 *     summary: Resolve error
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error resolved successfully
 */
router.post('/errors/:errorId/resolve', authenticate, adminDashboardController.resolveError.bind(adminDashboardController));

// PERFORMANCE METRICS
/**
 * @swagger
 * /api/admin/performance:
 *   post:
 *     summary: Record performance metric
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - method
 *               - responseTimeMs
 *             properties:
 *               endpoint:
 *                 type: string
 *               method:
 *                 type: string
 *               responseTimeMs:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Performance metric recorded successfully
 */
router.post('/performance', authenticate, adminDashboardController.recordPerformanceMetric.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', authenticate, adminDashboardController.getPerformanceMetrics.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/performance/slowest:
 *   get:
 *     summary: Get slowest endpoints
 *     tags: [Admin Dashboard]
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
 *         description: Slowest endpoints retrieved successfully
 */
router.get('/performance/slowest', authenticate, adminDashboardController.getSlowestEndpoints.bind(adminDashboardController));

// ADMIN ACTIONS
/**
 * @swagger
 * /api/admin/actions:
 *   post:
 *     summary: Log admin action
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionType
 *               - action
 *             properties:
 *               actionType:
 *                 type: string
 *                 enum: [user_management, system_config, data_management, security, content_moderation]
 *               action:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Action logged successfully
 */
router.post('/actions', authenticate, adminDashboardController.logAdminAction.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/actions:
 *   get:
 *     summary: Get admin actions
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Admin actions retrieved successfully
 */
router.get('/actions', authenticate, adminDashboardController.getAdminActions.bind(adminDashboardController));

// SYSTEM ANNOUNCEMENTS
/**
 * @swagger
 * /api/admin/announcements:
 *   post:
 *     summary: Create announcement
 *     tags: [Admin Dashboard]
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
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               targetAudience:
 *                 type: string
 *     responses:
 *       201:
 *         description: Announcement created successfully
 */
router.post('/announcements', authenticate, adminDashboardController.createAnnouncement.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/announcements:
 *   get:
 *     summary: List announcements
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 */
router.get('/announcements', authenticate, adminDashboardController.listAnnouncements.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   get:
 *     summary: Get announcement
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 */
router.get('/announcements/:announcementId', authenticate, adminDashboardController.getAnnouncement.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   patch:
 *     summary: Update announcement
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
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
 *         description: Announcement updated successfully
 */
router.patch('/announcements/:announcementId', authenticate, adminDashboardController.updateAnnouncement.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/announcements/{announcementId}:
 *   delete:
 *     summary: Delete announcement
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 */
router.delete('/announcements/:announcementId', authenticate, adminDashboardController.deleteAnnouncement.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/announcements/{announcementId}/interact:
 *   post:
 *     summary: Record announcement interaction
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
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
 *               - interaction
 *             properties:
 *               interaction:
 *                 type: string
 *                 enum: [view, dismiss, click]
 *     responses:
 *       200:
 *         description: Interaction recorded successfully
 */
router.post('/announcements/:announcementId/interact', authenticate, adminDashboardController.recordAnnouncementInteraction.bind(adminDashboardController));

// TENANT MANAGEMENT
/**
 * @swagger
 * /api/admin/tenants:
 *   post:
 *     summary: Create tenant
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *               - displayName
 *               - slug
 *             properties:
 *               tenantName:
 *                 type: string
 *               displayName:
 *                 type: string
 *               slug:
 *                 type: string
 *               planType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant created successfully
 */
router.post('/tenants', authenticate, adminDashboardController.createTenant.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/tenants:
 *   get:
 *     summary: List tenants
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 */
router.get('/tenants', authenticate, adminDashboardController.listTenants.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/tenants/{tenantId}:
 *   get:
 *     summary: Get tenant
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 */
router.get('/tenants/:tenantId', authenticate, adminDashboardController.getTenant.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/tenants/{tenantId}:
 *   patch:
 *     summary: Update tenant
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
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
 *         description: Tenant updated successfully
 */
router.patch('/tenants/:tenantId', authenticate, adminDashboardController.updateTenant.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/tenants/{tenantId}/usage-percentage:
 *   get:
 *     summary: Get tenant usage percentage
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usage percentage retrieved successfully
 */
router.get('/tenants/:tenantId/usage-percentage', authenticate, adminDashboardController.getTenantUsagePercentage.bind(adminDashboardController));

/**
 * @swagger
 * /api/admin/tenants/{tenantId}/usage:
 *   post:
 *     summary: Record tenant usage
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
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
 *               - date
 *               - metrics
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               metrics:
 *                 type: object
 *     responses:
 *       201:
 *         description: Usage recorded successfully
 */
router.post('/tenants/:tenantId/usage', authenticate, adminDashboardController.recordTenantUsage.bind(adminDashboardController));

export default router;
