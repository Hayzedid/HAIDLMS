import { Router } from 'express';
import { auditLoggingController } from '../controllers/audit-logging.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logging
 *   description: Comprehensive audit trail and compliance logging
 */

// All audit routes require authentication
router.use(authenticate);

// ========================================
// AUDIT LOGS
// ========================================

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isSensitive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
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
 *         description: Audit logs retrieved successfully
 */
router.get('/logs', auditLoggingController.getAuditLogs.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/logs/{logId}:
 *   get:
 *     summary: Get audit log details
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 */
router.get('/logs/:logId', auditLoggingController.getAuditLog.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/entities/{entityType}/{entityId}/summary:
 *   get:
 *     summary: Get entity audit summary
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit summary retrieved successfully
 */
router.get('/entities/:entityType/:entityId/summary', auditLoggingController.getEntityAuditSummary.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/entities/{entityType}/{entityId}/trail:
 *   get:
 *     summary: Get entity audit trail
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit trail retrieved successfully
 */
router.get('/entities/:entityType/:entityId/trail', auditLoggingController.getAuditTrail.bind(auditLoggingController));

// ========================================
// SECURITY EVENTS
// ========================================

/**
 * @swagger
 * /api/audit/security-events:
 *   get:
 *     summary: Get security events
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: threatLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Security events retrieved successfully
 */
router.get('/security-events', auditLoggingController.getSecurityEvents.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/security-events/alerts:
 *   get:
 *     summary: Get recent security alerts
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security alerts retrieved successfully
 */
router.get('/security-events/alerts', auditLoggingController.getRecentSecurityAlerts.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/security-events/{eventId}/respond:
 *   post:
 *     summary: Respond to security event
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *               - actionTaken
 *               - resolutionNotes
 *             properties:
 *               actionTaken:
 *                 type: string
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response recorded successfully
 */
router.post('/security-events/:eventId/respond', auditLoggingController.respondToSecurityEvent.bind(auditLoggingController));

// ========================================
// DATA ACCESS LOGS
// ========================================

/**
 * @swagger
 * /api/audit/data-access:
 *   get:
 *     summary: Get data access logs
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: containsPii
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data access logs retrieved successfully
 */
router.get('/data-access', auditLoggingController.getDataAccessLogs.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/data-access/sensitive-summary:
 *   get:
 *     summary: Get sensitive data access summary
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 */
router.get('/data-access/sensitive-summary', auditLoggingController.getSensitiveDataAccessSummary.bind(auditLoggingController));

// ========================================
// COMPLIANCE LOGS
// ========================================

/**
 * @swagger
 * /api/audit/compliance:
 *   get:
 *     summary: Get compliance logs
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: regulation
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isCompliant
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: reviewed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compliance logs retrieved successfully
 */
router.get('/compliance', auditLoggingController.getComplianceLogs.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/compliance/violations:
 *   get:
 *     summary: Get compliance violations
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Violations retrieved successfully
 */
router.get('/compliance/violations', auditLoggingController.getComplianceViolations.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/compliance/{logId}/review:
 *   post:
 *     summary: Review compliance log
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
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
 *               - reviewNotes
 *             properties:
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review recorded successfully
 */
router.post('/compliance/:logId/review', auditLoggingController.reviewComplianceLog.bind(auditLoggingController));

// ========================================
// SYSTEM EVENTS
// ========================================

/**
 * @swagger
 * /api/audit/system-events:
 *   get:
 *     summary: Get system events
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: System events retrieved successfully
 */
router.get('/system-events', auditLoggingController.getSystemEvents.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/system-events/critical:
 *   get:
 *     summary: Get critical system events
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Critical events retrieved successfully
 */
router.get('/system-events/critical', auditLoggingController.getCriticalSystemEvents.bind(auditLoggingController));

// ========================================
// STATISTICS & REPORTS
// ========================================

/**
 * @swagger
 * /api/audit/statistics/user-activity:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Audit Logging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity summary retrieved successfully
 */
router.get('/statistics/user-activity', auditLoggingController.getUserActivitySummary.bind(auditLoggingController));

/**
 * @swagger
 * /api/audit/statistics/overview:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit Logging]
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
 *         description: Statistics retrieved successfully
 */
router.get('/statistics/overview', auditLoggingController.getAuditStatistics.bind(auditLoggingController));

// ========================================
// MAINTENANCE
// ========================================

router.post('/maintenance/cleanup', auditLoggingController.cleanupAuditLogs.bind(auditLoggingController));
router.get('/export', auditLoggingController.exportAuditLogs.bind(auditLoggingController));

export default router;
