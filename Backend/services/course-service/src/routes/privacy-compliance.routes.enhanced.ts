import { Router } from 'express';
import { PrivacyComplianceControllerEnhanced } from '../controllers/privacy-compliance.controller.enhanced';
import { Pool } from 'pg';

export const createPrivacyComplianceRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new PrivacyComplianceControllerEnhanced(pool);

  // ========================================
  // HEALTH CHECK
  // ========================================

  /**
   * @swagger
   * /api/privacy/health:
   *   get:
   *     summary: Privacy compliance health check
   *     description: Checks compliance system health, overdue requests, and data breach alerts
   *     tags: [Privacy Compliance - System]
   *     responses:
   *       200:
   *         description: System healthy or with warnings
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [healthy, warning, critical]
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 metrics:
   *                   type: object
   *                   properties:
   *                     overdue_privacy_requests:
   *                       type: integer
   *                     active_consents:
   *                       type: integer
   *                     active_retention_policies:
   *                       type: integer
   *                     recent_unresolved_breaches:
   *                       type: integer
   *                 alerts:
   *                   type: array
   *                   items:
   *                     type: string
   *       503:
   *         description: Critical issues detected
   */
  router.get('/health', controller.complianceHealthCheck);

  // ========================================
  // CONSENT MANAGEMENT - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/privacy/consent/grant:
   *   post:
   *     summary: Grant user consent (Enhanced with validation)
   *     description: Records user consent with validation, duplicate checking, and IP logging
   *     tags: [Privacy Compliance - Consent]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - consent_type
   *               - consent_version
   *               - consent_purpose
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 description: User UUID
   *               consent_type:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 description: Type of consent (e.g., 'data_processing', 'marketing')
   *                 example: data_processing
   *               consent_version:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *                 description: Consent document version
   *                 example: v1.0
   *               consent_purpose:
   *                 type: string
   *                 enum: [service_provision, analytics, marketing, personalization, security, legal_obligation, legitimate_interest]
   *                 description: Purpose of data processing
   *               ip_address:
   *                 type: string
   *                 format: ipv4
   *                 description: IP address of consent action
   *     responses:
   *       201:
   *         description: Consent granted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       409:
   *         description: Active consent already exists
   */
  router.post('/consent/grant', controller.grantConsent);

  /**
   * @swagger
   * /api/privacy/consent/withdraw:
   *   post:
   *     summary: Withdraw user consent (Enhanced)
   *     description: Withdraws active consent with validation and existence checking
   *     tags: [Privacy Compliance - Consent]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - consent_type
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               consent_type:
   *                 type: string
   *                 description: Type of consent to withdraw
   *     responses:
   *       200:
   *         description: Consent withdrawn
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 count:
   *                   type: integer
   *                   description: Number of consents withdrawn
   *       400:
   *         description: Missing required fields
   *       404:
   *         description: No active consent found
   */
  router.post('/consent/withdraw', controller.withdrawConsent);

  /**
   * @swagger
   * /api/privacy/consent/user/{user_id}:
   *   get:
   *     summary: Get user consents with details (Enhanced)
   *     description: Retrieves all consents for a user with status display and metadata
   *     tags: [Privacy Compliance - Consent]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [granted, withdrawn]
   *         description: Filter by consent status
   *     responses:
   *       200:
   *         description: List of user consents
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 consents:
   *                   type: array
   *                   items:
   *                     type: object
   *                 count:
   *                   type: integer
   */
  router.get('/consent/user/:user_id', controller.getUserConsents);

  /**
   * @swagger
   * /api/privacy/consent/check:
   *   get:
   *     summary: Check if user has specific consent (NEW)
   *     description: Verifies if user has granted consent for a specific purpose
   *     tags: [Privacy Compliance - Consent]
   *     parameters:
   *       - in: query
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: purpose
   *         required: true
   *         schema:
   *           type: string
   *           enum: [service_provision, analytics, marketing, personalization]
   *     responses:
   *       200:
   *         description: Consent check result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user_id:
   *                   type: string
   *                 purpose:
   *                   type: string
   *                 has_consent:
   *                   type: boolean
   *                 checked_at:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Missing required parameters
   */
  router.get('/consent/check', controller.checkConsent);

  // ========================================
  // PRIVACY REQUESTS (GDPR/CCPA) - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/privacy/requests:
   *   post:
   *     summary: Create privacy request (Enhanced)
   *     description: Creates GDPR/CCPA privacy request with validation and duplicate checking
   *     tags: [Privacy Compliance - Requests]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - requester_email
   *               - request_type
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               requester_email:
   *                 type: string
   *                 format: email
   *                 maxLength: 255
   *                 description: Email of person making request
   *               request_type:
   *                 type: string
   *                 enum: [data_access, data_portability, data_erasure, data_rectification, processing_restriction, objection]
   *                 description: Type of privacy request
   *               request_description:
   *                 type: string
   *                 maxLength: 2000
   *                 description: Additional details about the request
   *               data_categories:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [personal_identity, contact_info, account_data, educational_data, financial_data, behavioral_data, technical_data, communication_data]
   *                 description: Specific data categories requested
   *     responses:
   *       201:
   *         description: Privacy request created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 message:
   *                   type: string
   *                 sla_days:
   *                   type: integer
   *                   example: 30
   *       400:
   *         description: Validation error
   *       409:
   *         description: Request already in progress for this user/type
   */
  router.post('/requests', controller.createPrivacyRequest);

  /**
   * @swagger
   * /api/privacy/requests/{request_id}:
   *   get:
   *     summary: Get privacy request by ID (Enhanced)
   *     description: Retrieves privacy request with validation
   *     tags: [Privacy Compliance - Requests]
   *     parameters:
   *       - in: path
   *         name: request_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Privacy request details
   *       404:
   *         description: Request not found
   */
  router.get('/requests/:request_id', controller.getPrivacyRequestById);

  /**
   * @swagger
   * /api/privacy/requests/{request_id}/status:
   *   put:
   *     summary: Update privacy request status (Enhanced)
   *     description: Updates request status with validation and transition checks
   *     tags: [Privacy Compliance - Requests]
   *     parameters:
   *       - in: path
   *         name: request_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
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
   *                 enum: [pending, in_progress, completed, rejected]
   *                 description: New status
   *               assigned_to:
   *                 type: string
   *                 format: uuid
   *                 description: User assigned to handle request
   *               rejection_reason:
   *                 type: string
   *                 description: Reason if status is rejected
   *               result_data:
   *                 type: object
   *                 description: Result data if status is completed
   *     responses:
   *       200:
   *         description: Status updated successfully
   *       400:
   *         description: Invalid status or missing required data
   *       404:
   *         description: Request not found
   */
  router.put('/requests/:request_id/status', controller.updatePrivacyRequestStatus);

  /**
   * @swagger
   * /api/privacy/requests/overdue:
   *   get:
   *     summary: Get overdue privacy requests (Enhanced)
   *     description: Retrieves requests past SLA deadline with alert levels
   *     tags: [Privacy Compliance - Requests]
   *     responses:
   *       200:
   *         description: List of overdue requests
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 overdue_requests:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       days_overdue:
   *                         type: integer
   *                       sla_days:
   *                         type: integer
   *                 count:
   *                   type: integer
   *                 alert_level:
   *                   type: string
   *                   enum: [none, high]
   */
  router.get('/requests/overdue', controller.getOverdueRequests);

  // ========================================
  // DATA RETENTION - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/privacy/retention/policies:
   *   post:
   *     summary: Create data retention policy (Enhanced)
   *     description: Creates retention policy with validation and duplicate checking
   *     tags: [Privacy Compliance - Retention]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - policy_name
   *               - data_category
   *               - retention_period_days
   *             properties:
   *               policy_name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Unique policy name
   *               description:
   *                 type: string
   *                 maxLength: 2000
   *               data_category:
   *                 type: string
   *                 enum: [personal_identity, contact_info, account_data, educational_data, financial_data, behavioral_data, technical_data, communication_data]
   *               table_name:
   *                 type: string
   *                 maxLength: 255
   *                 description: Database table name (optional)
   *               retention_period_days:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 3650
   *                 description: Days to retain data (1-3650)
   *               legal_basis:
   *                 type: string
   *                 maxLength: 100
   *                 description: Legal justification for retention period
   *               deletion_method:
   *                 type: string
   *                 enum: [hard_delete, anonymize, archive]
   *                 default: hard_delete
   *     responses:
   *       201:
   *         description: Retention policy created
   *       400:
   *         description: Validation error
   *       409:
   *         description: Policy name already exists
   */
  router.post('/retention/policies', controller.createRetentionPolicy);

  /**
   * @swagger
   * /api/privacy/retention/policies/{policy_id}/execute:
   *   post:
   *     summary: Execute retention policy (Enhanced)
   *     description: Executes retention policy with validation and logging
   *     tags: [Privacy Compliance - Retention]
   *     parameters:
   *       - in: path
   *         name: policy_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               executed_by:
   *                 type: string
   *                 format: uuid
   *                 description: User executing the policy
   *     responses:
   *       200:
   *         description: Policy executed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 policy_id:
   *                   type: string
   *                 deleted_count:
   *                   type: integer
   *                 executed_at:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Policy not found
   *       422:
   *         description: Policy is inactive
   */
  router.post('/retention/policies/:policy_id/execute', controller.executeRetentionPolicy);

  /**
   * @swagger
   * /api/privacy/retention/summary:
   *   get:
   *     summary: Get retention summary with recommendations (NEW)
   *     description: Retrieves retention summary, active policies, and execution recommendations
   *     tags: [Privacy Compliance - Retention]
   *     responses:
   *       200:
   *         description: Retention summary with recommendations
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 summary:
   *                   type: array
   *                   description: Summary from database view
   *                 policies:
   *                   type: array
   *                   description: Active policies with execution history
   *                 recommendations:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Recommended actions
   */
  router.get('/retention/summary', controller.getRetentionSummary);

  // ========================================
  // DATA DELETION - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/privacy/deletion/log:
   *   post:
   *     summary: Log data deletion (Enhanced)
   *     description: Records data deletion event with validation
   *     tags: [Privacy Compliance - Deletion]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - deletion_type
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               user_email:
   *                 type: string
   *                 format: email
   *               deletion_type:
   *                 type: string
   *                 description: Type of deletion (e.g., 'user_request', 'retention_policy', 'anonymization')
   *               data_category:
   *                 type: string
   *               table_name:
   *                 type: string
   *               record_count:
   *                 type: integer
   *               deleted_by:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Deletion logged successfully
   *       400:
   *         description: Validation error (user_id or user_email required)
   */
  router.post('/deletion/log', controller.logDataDeletion);

  // ========================================
  // DATA ANONYMIZATION - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/privacy/anonymize/{user_id}:
   *   post:
   *     summary: Anonymize user data (Enhanced)
   *     description: Anonymizes all user data with transaction support and logging
   *     tags: [Privacy Compliance - Anonymization]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               initiated_by:
   *                 type: string
   *                 format: uuid
   *                 description: User who initiated anonymization
   *     responses:
   *       200:
   *         description: User data anonymized successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user_id:
   *                   type: string
   *                 anonymized_at:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: User not found
   */
  router.post('/anonymize/:user_id', controller.anonymizeUserData);

  return router;
};
