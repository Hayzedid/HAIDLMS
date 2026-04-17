import { Router } from 'express';
import { LMSStandardsControllerEnhanced } from '../controllers/lms-standards.controller.enhanced';
import { Pool } from 'pg';

export const createLMSStandardsRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new LMSStandardsControllerEnhanced(pool);

  // ========================================
  // HEALTH CHECK
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/health:
   *   get:
   *     summary: Health check for LMS Standards service
   *     tags: [LMS Standards - System]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 service:
   *                   type: string
   *                   example: LMS Standards
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 features:
   *                   type: object
   */
  router.get('/health', controller.healthCheck);

  // ========================================
  // SCORM PACKAGES - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/scorm/packages:
   *   post:
   *     summary: Create a SCORM package (Enhanced with validation)
   *     description: Creates a new SCORM package with comprehensive validation, duplicate checking, and error handling
   *     tags: [LMS Standards - SCORM]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - package_identifier
   *               - package_title
   *               - scorm_version
   *               - manifest_file_path
   *               - package_file_path
   *               - storage_path
   *               - launch_url
   *             properties:
   *               package_identifier:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Unique identifier for the SCORM package
   *                 example: "scorm_pkg_001"
   *               package_title:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *                 description: Display title of the package
   *                 example: "Introduction to JavaScript"
   *               package_description:
   *                 type: string
   *                 maxLength: 2000
   *                 description: Optional description
   *               scorm_version:
   *                 type: string
   *                 enum: ['1.2', '2004_3rd', '2004_4th']
   *                 description: SCORM specification version
   *               manifest_file_path:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Path to imsmanifest.xml file
   *               package_file_path:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Path to the packaged SCORM file (.zip)
   *               storage_path:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Storage location path
   *               launch_url:
   *                 type: string
   *                 format: uri
   *                 maxLength: 1000
   *                 description: URL to launch the SCORM content
   *               course_id:
   *                 type: string
   *                 format: uuid
   *                 description: Associated course ID (optional)
   *               lesson_id:
   *                 type: string
   *                 format: uuid
   *                 description: Associated lesson ID (optional)
   *               created_by:
   *                 type: string
   *                 format: uuid
   *                 description: User ID who created the package
   *     responses:
   *       201:
   *         description: SCORM package created successfully
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
   *         description: Package identifier already exists
   *       500:
   *         description: Internal server error
   */
  router.post('/scorm/packages', controller.createSCORMPackage);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages/{package_id}:
   *   get:
   *     summary: Get SCORM package by ID (Enhanced)
   *     description: Retrieves a SCORM package with proper error handling
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: SCORM package UUID
   *     responses:
   *       200:
   *         description: SCORM package details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 package_identifier:
   *                   type: string
   *                 package_title:
   *                   type: string
   *                 scorm_version:
   *                   type: string
   *                 is_validated:
   *                   type: boolean
   *                 created_at:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: SCORM package not found
   *       500:
   *         description: Internal server error
   */
  router.get('/scorm/packages/:package_id', controller.getSCORMPackageById);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages/{package_id}/validate:
   *   post:
   *     summary: Validate SCORM package (NEW)
   *     description: Validates SCORM package structure, manifest, and version-specific requirements
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Validation results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 package_id:
   *                   type: string
   *                 is_valid:
   *                   type: boolean
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: string
   *                 validated_at:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Package not found
   */
  router.post('/scorm/packages/:package_id/validate', controller.validateSCORMPackage);

  // ========================================
  // SCORM ATTEMPTS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts:
   *   post:
   *     summary: Create SCORM attempt (Enhanced)
   *     description: Creates a new SCORM attempt with validation and package existence verification
   *     tags: [LMS Standards - SCORM]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - package_id
   *               - user_id
   *             properties:
   *               package_id:
   *                 type: string
   *                 format: uuid
   *                 description: SCORM package UUID
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 description: User UUID
   *     responses:
   *       201:
   *         description: SCORM attempt created
   *       400:
   *         description: Validation error
   *       404:
   *         description: Package not found
   */
  router.post('/scorm/attempts', controller.createSCORMAttempt);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts/{attempt_id}:
   *   put:
   *     summary: Update SCORM attempt with CMI data (Enhanced)
   *     description: Updates SCORM attempt with validated CMI data, supports transactions and auto-calculations
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: attempt_id
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
   *             properties:
   *               cmi_core_lesson_status:
   *                 type: string
   *                 enum: ['not_attempted', 'incomplete', 'completed', 'passed', 'failed', 'browsed']
   *                 description: Current lesson status
   *               cmi_core_score_raw:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *                 description: Raw score (0-100)
   *               cmi_core_lesson_location:
   *                 type: string
   *                 maxLength: 255
   *                 description: Current location in lesson
   *               cmi_suspend_data:
   *                 type: string
   *                 maxLength: 65535
   *                 description: Suspend data for resuming
   *               cmi_core_session_time:
   *                 type: number
   *                 minimum: 0
   *                 description: Session time in seconds
   *     responses:
   *       200:
   *         description: Attempt updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Attempt not found
   */
  router.put('/scorm/attempts/:attempt_id', controller.updateSCORMAttempt);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts/progress:
   *   get:
   *     summary: Get SCORM attempt progress (Enhanced)
   *     description: Retrieves detailed progress with computed completion percentage
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: query
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Progress data with completion percentage
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 completion_percentage:
   *                   type: number
   *                   description: Computed completion (0-100)
   *                 cmi_core_lesson_status:
   *                   type: string
   *                 attempt_number:
   *                   type: integer
   *       400:
   *         description: Missing required parameters
   *       404:
   *         description: No attempt found
   */
  router.get('/scorm/attempts/progress', controller.getSCORMAttemptProgress);

  // ========================================
  // LTI CONSUMERS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/lti/consumers:
   *   post:
   *     summary: Create LTI consumer (Enhanced)
   *     description: Creates LTI consumer with validation, secret encryption, and duplicate checking
   *     tags: [LMS Standards - LTI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - consumer_key
   *               - consumer_name
   *               - consumer_secret
   *               - lti_version
   *             properties:
   *               consumer_key:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Unique consumer key
   *               consumer_name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 255
   *                 description: Consumer display name
   *               consumer_description:
   *                 type: string
   *                 maxLength: 2000
   *               consumer_secret:
   *                 type: string
   *                 minLength: 16
   *                 maxLength: 500
   *                 description: Secret key (will be encrypted)
   *               lti_version:
   *                 type: string
   *                 enum: ['1.1', '1.3']
   *                 description: LTI specification version
   *               platform_id:
   *                 type: string
   *                 maxLength: 500
   *                 description: Platform ID (LTI 1.3)
   *               client_id:
   *                 type: string
   *                 maxLength: 500
   *                 description: Client ID (LTI 1.3)
   *     responses:
   *       201:
   *         description: LTI consumer created
   *       400:
   *         description: Validation error
   *       409:
   *         description: Consumer key already exists
   */
  router.post('/lti/consumers', controller.createLTIConsumer);

  /**
   * @swagger
   * /api/lms-standards/lti/validate:
   *   post:
   *     summary: Validate LTI request (NEW)
   *     description: Validates LTI OAuth 1.0 signature and consumer status
   *     tags: [LMS Standards - LTI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - consumer_key
   *               - oauth_signature
   *             properties:
   *               consumer_key:
   *                 type: string
   *                 description: LTI consumer key
   *               oauth_signature:
   *                 type: string
   *                 description: OAuth signature to validate
   *     responses:
   *       200:
   *         description: Validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 valid:
   *                   type: boolean
   *                 consumer_key:
   *                   type: string
   *                 validated_at:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Missing parameters
   */
  router.post('/lti/validate', controller.validateLTIRequest);

  // ========================================
  // LTI GRADES - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/lti/grades:
   *   post:
   *     summary: Record LTI grade with passback (Enhanced)
   *     description: Records grade and queues automatic grade passback to LMS
   *     tags: [LMS Standards - LTI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - resource_link_id
   *               - user_id
   *               - result_sourcedid
   *               - result_score
   *             properties:
   *               launch_id:
   *                 type: string
   *                 format: uuid
   *                 description: Optional LTI launch ID
   *               resource_link_id:
   *                 type: string
   *                 format: uuid
   *                 description: Resource link UUID
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 description: User UUID
   *               result_sourcedid:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 500
   *                 description: LMS-specific grade identifier
   *               result_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *                 description: Grade score (0.0 to 1.0)
   *     responses:
   *       201:
   *         description: Grade recorded and passback queued
   *       400:
   *         description: Validation error
   */
  router.post('/lti/grades', controller.recordLTIGrade);

  // ========================================
  // xAPI STATEMENTS - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/xapi/statements:
   *   post:
   *     summary: Record xAPI statement (Enhanced)
   *     description: Records xAPI statement with validation and duplicate detection
   *     tags: [LMS Standards - xAPI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - statement_id
   *               - actor_id
   *               - verb
   *               - verb_id
   *               - object_id
   *               - full_statement
   *             properties:
   *               statement_id:
   *                 type: string
   *                 format: uuid
   *                 description: Unique statement UUID
   *               actor_id:
   *                 type: string
   *                 format: uuid
   *                 description: Actor (user) UUID
   *               verb:
   *                 type: string
   *                 enum: ['attempted', 'completed', 'passed', 'failed', 'answered', 'experienced', 'interacted', 'attended', 'scored', 'progressed']
   *                 description: xAPI verb
   *               verb_id:
   *                 type: string
   *                 format: uri
   *                 description: Full verb IRI
   *               object_id:
   *                 type: string
   *                 format: uri
   *                 maxLength: 1000
   *                 description: Activity/object IRI
   *               object_type:
   *                 type: string
   *                 maxLength: 50
   *               result_success:
   *                 type: boolean
   *               result_score_scaled:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *               course_id:
   *                 type: string
   *                 format: uuid
   *               lesson_id:
   *                 type: string
   *                 format: uuid
   *               full_statement:
   *                 type: object
   *                 description: Complete xAPI statement JSON
   *     responses:
   *       201:
   *         description: Statement recorded
   *       400:
   *         description: Validation error
   */
  router.post('/xapi/statements', controller.recordXAPIStatement);

  /**
   * @swagger
   * /api/lms-standards/xapi/learner-profile/{actor_id}:
   *   get:
   *     summary: Get xAPI learner profile (NEW)
   *     description: Aggregated learner analytics from xAPI statements
   *     tags: [LMS Standards - xAPI]
   *     parameters:
   *       - in: path
   *         name: actor_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Actor (user) UUID
   *     responses:
   *       200:
   *         description: Learner profile with aggregated statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 actor_id:
   *                   type: string
   *                 profile:
   *                   type: object
   *                   properties:
   *                     total_statements:
   *                       type: integer
   *                     unique_verbs:
   *                       type: integer
   *                     successful_attempts:
   *                       type: integer
   *                     failed_attempts:
   *                       type: integer
   *                     average_score:
   *                       type: number
   *                     first_activity:
   *                       type: string
   *                       format: date-time
   *                     last_activity:
   *                       type: string
   *                       format: date-time
   *                     total_hours:
   *                       type: number
   *                 generated_at:
   *                   type: string
   *                   format: date-time
   */
  router.get('/xapi/learner-profile/:actor_id', controller.getXAPILearnerProfile);

  // ========================================
  // CONTENT EXPORT - ENHANCED
  // ========================================

  /**
   * @swagger
   * /api/lms-standards/exports:
   *   post:
   *     summary: Create content export job (Enhanced)
   *     description: Creates export job with validation (SCORM, xAPI, Common Cartridge)
   *     tags: [LMS Standards - Exports]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content_type
   *               - content_id
   *               - export_format
   *             properties:
   *               content_type:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 description: Type of content (e.g., 'course', 'lesson')
   *               content_id:
   *                 type: string
   *                 format: uuid
   *                 description: Content UUID to export
   *               export_format:
   *                 type: string
   *                 enum: ['scorm_1.2', 'scorm_2004', 'xapi', 'common_cartridge']
   *                 description: Target export format
   *               generated_by:
   *                 type: string
   *                 format: uuid
   *                 description: User who initiated export
   *     responses:
   *       201:
   *         description: Export job created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   format: uuid
   *                 status:
   *                   type: string
   *                   example: pending
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   */
  router.post('/exports', controller.createContentExport);

  /**
   * @swagger
   * /api/lms-standards/exports/{export_id}/progress:
   *   put:
   *     summary: Update export progress (NEW)
   *     description: Updates export job progress percentage and status
   *     tags: [LMS Standards - Exports]
   *     parameters:
   *       - in: path
   *         name: export_id
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
   *               - progress_percent
   *             properties:
   *               progress_percent:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *                 description: Progress percentage (0-100)
   *               status:
   *                 type: string
   *                 enum: ['pending', 'processing', 'completed', 'failed']
   *                 description: Optional status update
   *     responses:
   *       200:
   *         description: Progress updated
   *       400:
   *         description: Invalid progress value
   */
  router.put('/exports/:export_id/progress', controller.updateContentExportProgress);

  return router;
};
