import { Router } from 'express';
import { securityController } from '../controllers/security.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security features including 2FA, sessions, and password management
 */

// ========================================
// PASSWORD MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/security/password-policy:
 *   get:
 *     summary: Get password policy
 *     tags: [Security]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password policy retrieved successfully
 */
router.get('/password-policy', securityController.getPasswordPolicy.bind(securityController));

/**
 * @swagger
 * /api/security/password/validate:
 *   post:
 *     summary: Validate password against policy
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/password/validate', authenticate, securityController.validatePassword.bind(securityController));

/**
 * @swagger
 * /api/security/password/history/{userId}:
 *   get:
 *     summary: Get password history
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Password history retrieved successfully
 */
router.get('/password/history/:userId', authenticate, securityController.getPasswordHistory.bind(securityController));

/**
 * @swagger
 * /api/security/password/reset-token:
 *   post:
 *     summary: Create password reset token
 *     tags: [Security]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset token created successfully
 */
router.post('/password/reset-token', securityController.createPasswordResetToken.bind(securityController));

/**
 * @swagger
 * /api/security/password/verify-reset-token:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Security]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token verified successfully
 */
router.post('/password/verify-reset-token', securityController.verifyPasswordResetToken.bind(securityController));

// ========================================
// MULTI-FACTOR AUTHENTICATION
// ========================================

/**
 * @swagger
 * /api/security/mfa/setup:
 *   post:
 *     summary: Setup MFA
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [totp, sms, email, backup_codes]
 *     responses:
 *       200:
 *         description: MFA setup initiated successfully
 */
router.post('/mfa/setup', authenticate, securityController.setupMFA.bind(securityController));

/**
 * @swagger
 * /api/security/mfa/enable:
 *   post:
 *     summary: Enable MFA
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA enabled successfully
 */
router.post('/mfa/enable', authenticate, securityController.enableMFA.bind(securityController));

/**
 * @swagger
 * /api/security/mfa/disable:
 *   post:
 *     summary: Disable MFA
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 */
router.post('/mfa/disable', authenticate, securityController.disableMFA.bind(securityController));

/**
 * @swagger
 * /api/security/mfa/settings:
 *   get:
 *     summary: Get MFA settings
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA settings retrieved successfully
 */
router.get('/mfa/settings', authenticate, securityController.getMFASettings.bind(securityController));

/**
 * @swagger
 * /api/security/mfa/verify:
 *   post:
 *     summary: Verify MFA code
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *               - code
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [totp, sms, email, backup_codes]
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
router.post('/mfa/verify', authenticate, securityController.verifyMFA.bind(securityController));

/**
 * @swagger
 * /api/security/mfa/backup-codes:
 *   post:
 *     summary: Generate backup codes
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Backup codes generated successfully
 */
router.post('/mfa/backup-codes', authenticate, securityController.generateBackupCodes.bind(securityController));

// ========================================
// SESSION MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/security/sessions/me:
 *   get:
 *     summary: Get my sessions
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get('/sessions/me', authenticate, securityController.getMySessions.bind(securityController));

/**
 * @swagger
 * /api/security/sessions/{sessionId}/revoke:
 *   post:
 *     summary: Revoke a session
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session revoked successfully
 */
router.post('/sessions/:sessionId/revoke', authenticate, securityController.revokeSession.bind(securityController));

/**
 * @swagger
 * /api/security/sessions/revoke-all:
 *   post:
 *     summary: Revoke all sessions
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exceptCurrent
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Sessions revoked successfully
 */
router.post('/sessions/revoke-all', authenticate, securityController.revokeAllSessions.bind(securityController));

/**
 * @swagger
 * /api/security/sessions/active:
 *   get:
 *     summary: Get all active sessions (admin)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
router.get('/sessions/active', authenticate, securityController.getActiveSessions.bind(securityController));

// ========================================
// IP RULES
// ========================================

/**
 * @swagger
 * /api/security/ip-rules:
 *   post:
 *     summary: Create IP rule
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               organizationId:
 *                 type: string
 *               userId:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               ipRange:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [allow, block, challenge]
 *               priority:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: IP rule created successfully
 */
router.post('/ip-rules', authenticate, securityController.createIPRule.bind(securityController));

/**
 * @swagger
 * /api/security/ip-rules:
 *   get:
 *     summary: List IP rules
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: IP rules retrieved successfully
 */
router.get('/ip-rules', authenticate, securityController.listIPRules.bind(securityController));

/**
 * @swagger
 * /api/security/ip-rules/{ipAddress}/check:
 *   get:
 *     summary: Check IP rule
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ipAddress
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: IP rule checked successfully
 */
router.get('/ip-rules/:ipAddress/check', authenticate, securityController.checkIPRule.bind(securityController));

router.delete('/ip-rules/:ruleId', authenticate, securityController.deleteIPRule.bind(securityController));

// ========================================
// TRUSTED DEVICES
// ========================================

/**
 * @swagger
 * /api/security/trusted-devices:
 *   get:
 *     summary: Get trusted devices
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trusted devices retrieved successfully
 */
router.get('/trusted-devices', authenticate, securityController.getTrustedDevices.bind(securityController));

/**
 * @swagger
 * /api/security/trusted-devices/{deviceId}/revoke:
 *   post:
 *     summary: Revoke trusted device
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device trust revoked successfully
 */
router.post('/trusted-devices/:deviceId/revoke', authenticate, securityController.revokeTrustedDevice.bind(securityController));

// ========================================
// SECURITY ALERTS
// ========================================

/**
 * @swagger
 * /api/security/alerts/me:
 *   get:
 *     summary: Get my security alerts
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Security alerts retrieved successfully
 */
router.get('/alerts/me', authenticate, securityController.getMySecurityAlerts.bind(securityController));

/**
 * @swagger
 * /api/security/alerts/{alertId}/read:
 *   post:
 *     summary: Mark alert as read
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert marked as read
 */
router.post('/alerts/:alertId/read', authenticate, securityController.markAlertAsRead.bind(securityController));

/**
 * @swagger
 * /api/security/alerts/{alertId}/dismiss:
 *   post:
 *     summary: Dismiss alert
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert dismissed
 */
router.post('/alerts/:alertId/dismiss', authenticate, securityController.dismissAlert.bind(securityController));

/**
 * @swagger
 * /api/security/alerts/summary:
 *   get:
 *     summary: Get security alerts summary
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts summary retrieved successfully
 */
router.get('/alerts/summary', authenticate, securityController.getSecurityAlertsSummary.bind(securityController));

// ========================================
// STATISTICS
// ========================================

/**
 * @swagger
 * /api/security/statistics/mfa-adoption:
 *   get:
 *     summary: Get MFA adoption statistics
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA statistics retrieved successfully
 */
router.get('/statistics/mfa-adoption', authenticate, securityController.getMFAAdoptionStats.bind(securityController));

/**
 * @swagger
 * /api/security/statistics/password-compliance:
 *   get:
 *     summary: Get password policy compliance
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compliance data retrieved successfully
 */
router.get('/statistics/password-compliance', authenticate, securityController.getPasswordPolicyCompliance.bind(securityController));

export default router;
