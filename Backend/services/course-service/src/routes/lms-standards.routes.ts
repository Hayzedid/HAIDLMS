import { Router } from 'express';
import { LMSStandardsController } from '../controllers/lms-standards.controller';
import { Pool } from 'pg';

export const createLMSStandardsRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new LMSStandardsController(pool);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages:
   *   post:
   *     summary: Create a SCORM package
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
   *               package_title:
   *                 type: string
   *               package_description:
   *                 type: string
   *               scorm_version:
   *                 type: string
   *                 enum: ['1.2', '2004_3rd', '2004_4th']
   *               manifest_file_path:
   *                 type: string
   *               package_file_path:
   *                 type: string
   *               storage_path:
   *                 type: string
   *               launch_url:
   *                 type: string
   *               course_id:
   *                 type: string
   *               lesson_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: SCORM package created
   */
  router.post('/scorm/packages', controller.createSCORMPackage);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages:
   *   get:
   *     summary: Get SCORM packages
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: query
   *         name: course_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: lesson_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: is_active
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of SCORM packages
   */
  router.get('/scorm/packages', controller.getSCORMPackages);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages/{package_id}:
   *   get:
   *     summary: Get SCORM package by ID
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: SCORM package details
   *       404:
   *         description: Package not found
   */
  router.get('/scorm/packages/:package_id', controller.getSCORMPackageById);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages/{package_id}:
   *   put:
   *     summary: Update SCORM package
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               package_title:
   *                 type: string
   *               is_active:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Package updated
   */
  router.put('/scorm/packages/:package_id', controller.updateSCORMPackage);

  /**
   * @swagger
   * /api/lms-standards/scorm/packages/{package_id}:
   *   delete:
   *     summary: Delete SCORM package
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: package_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Package deleted
   */
  router.delete('/scorm/packages/:package_id', controller.deleteSCORMPackage);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts:
   *   post:
   *     summary: Create SCORM attempt
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
   *               user_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: Attempt created
   */
  router.post('/scorm/attempts', controller.createSCORMAttempt);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts:
   *   get:
   *     summary: Get SCORM attempts
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: query
   *         name: package_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of attempts
   */
  router.get('/scorm/attempts', controller.getSCORMAttempts);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts/{attempt_id}:
   *   put:
   *     summary: Update SCORM attempt (CMI data)
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: attempt_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               cmi_core_lesson_status:
   *                 type: string
   *               cmi_core_score_raw:
   *                 type: number
   *               cmi_core_lesson_location:
   *                 type: string
   *               cmi_suspend_data:
   *                 type: string
   *               cmi_core_session_time:
   *                 type: number
   *     responses:
   *       200:
   *         description: Attempt updated
   */
  router.put('/scorm/attempts/:attempt_id', controller.updateSCORMAttempt);

  /**
   * @swagger
   * /api/lms-standards/scorm/attempts/{attempt_id}/complete:
   *   post:
   *     summary: Complete SCORM attempt
   *     tags: [LMS Standards - SCORM]
   *     parameters:
   *       - in: path
   *         name: attempt_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [completed, passed, failed]
   *               score:
   *                 type: number
   *     responses:
   *       200:
   *         description: Attempt completed
   */
  router.post('/scorm/attempts/:attempt_id/complete', controller.completeSCORMAttempt);

  /**
   * @swagger
   * /api/lms-standards/scorm/progress:
   *   get:
   *     summary: Get SCORM user progress
   *     tags: [LMS Standards - SCORM]
   *     responses:
   *       200:
   *         description: User progress data
   */
  router.get('/scorm/progress', controller.getSCORMUserProgress);

  /**
   * @swagger
   * /api/lms-standards/lti/consumers:
   *   post:
   *     summary: Create LTI consumer
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
   *               consumer_name:
   *                 type: string
   *               consumer_description:
   *                 type: string
   *               consumer_secret:
   *                 type: string
   *               lti_version:
   *                 type: string
   *                 enum: ['1.1', '1.3']
   *               platform_id:
   *                 type: string
   *               client_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: Consumer created
   */
  router.post('/lti/consumers', controller.createLTIConsumer);

  /**
   * @swagger
   * /api/lms-standards/lti/consumers:
   *   get:
   *     summary: Get LTI consumers
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: query
   *         name: is_enabled
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of LTI consumers
   */
  router.get('/lti/consumers', controller.getLTIConsumers);

  /**
   * @swagger
   * /api/lms-standards/lti/consumers/key/{consumer_key}:
   *   get:
   *     summary: Get LTI consumer by key
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: path
   *         name: consumer_key
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Consumer details
   *       404:
   *         description: Consumer not found
   */
  router.get('/lti/consumers/key/:consumer_key', controller.getLTIConsumerByKey);

  /**
   * @swagger
   * /api/lms-standards/lti/consumers/{consumer_id}:
   *   put:
   *     summary: Update LTI consumer
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: path
   *         name: consumer_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               consumer_name:
   *                 type: string
   *               is_enabled:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Consumer updated
   */
  router.put('/lti/consumers/:consumer_id', controller.updateLTIConsumer);

  /**
   * @swagger
   * /api/lms-standards/lti/consumers/{consumer_id}:
   *   delete:
   *     summary: Delete LTI consumer
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: path
   *         name: consumer_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Consumer deleted
   */
  router.delete('/lti/consumers/:consumer_id', controller.deleteLTIConsumer);

  /**
   * @swagger
   * /api/lms-standards/lti/resource-links:
   *   post:
   *     summary: Create LTI resource link
   *     tags: [LMS Standards - LTI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tool_consumer_id
   *               - resource_link_id
   *             properties:
   *               tool_consumer_id:
   *                 type: string
   *               resource_link_id:
   *                 type: string
   *               resource_link_title:
   *                 type: string
   *               course_id:
   *                 type: string
   *               lesson_id:
   *                 type: string
   *               context_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: Resource link created
   */
  router.post('/lti/resource-links', controller.createLTIResourceLink);

  /**
   * @swagger
   * /api/lms-standards/lti/resource-links:
   *   get:
   *     summary: Get LTI resource links
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: query
   *         name: tool_consumer_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: course_id
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of resource links
   */
  router.get('/lti/resource-links', controller.getLTIResourceLinks);

  /**
   * @swagger
   * /api/lms-standards/lti/launches:
   *   post:
   *     summary: Record LTI launch
   *     tags: [LMS Standards - LTI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - resource_link_id
   *               - tool_consumer_id
   *               - lti_user_id
   *               - message_type
   *               - roles
   *             properties:
   *               resource_link_id:
   *                 type: string
   *               tool_consumer_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               lti_user_id:
   *                 type: string
   *               message_type:
   *                 type: string
   *               roles:
   *                 type: array
   *                 items:
   *                   type: string
   *               context_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: Launch recorded
   */
  router.post('/lti/launches', controller.recordLTILaunch);

  /**
   * @swagger
   * /api/lms-standards/lti/launches:
   *   get:
   *     summary: Get LTI launches
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: query
   *         name: resource_link_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_id
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of launches
   */
  router.get('/lti/launches', controller.getLTILaunches);

  /**
   * @swagger
   * /api/lms-standards/lti/launches/statistics:
   *   get:
   *     summary: Get LTI launch statistics
   *     tags: [LMS Standards - LTI]
   *     responses:
   *       200:
   *         description: Launch statistics
   */
  router.get('/lti/launches/statistics', controller.getLTILaunchStatistics);

  /**
   * @swagger
   * /api/lms-standards/lti/grades:
   *   post:
   *     summary: Record LTI grade
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
   *               resource_link_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               result_sourcedid:
   *                 type: string
   *               result_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *     responses:
   *       201:
   *         description: Grade recorded
   */
  router.post('/lti/grades', controller.recordLTIGrade);

  /**
   * @swagger
   * /api/lms-standards/lti/grades/{grade_id}/sync:
   *     summary: Sync LTI grade to consumer
   *     tags: [LMS Standards - LTI]
   *     parameters:
   *       - in: path
   *         name: grade_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Grade synced
   */
  router.post('/lti/grades/:grade_id/sync', controller.syncLTIGrade);

  /**
   * @swagger
   * /api/lms-standards/xapi/statements:
   *   post:
   *     summary: Record xAPI statement
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
   *               actor_id:
   *                 type: string
   *               verb:
   *                 type: string
   *               verb_id:
   *                 type: string
   *               object_id:
   *                 type: string
   *               full_statement:
   *                 type: object
   *     responses:
   *       201:
   *         description: Statement recorded
   */
  router.post('/xapi/statements', controller.recordXAPIStatement);

  /**
   * @swagger
   * /api/lms-standards/xapi/statements:
   *   get:
   *     summary: Get xAPI statements
   *     tags: [LMS Standards - xAPI]
   *     parameters:
   *       - in: query
   *         name: actor_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: verb
   *         schema:
   *           type: string
   *       - in: query
   *         name: course_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *     responses:
   *       200:
   *         description: List of statements
   */
  router.get('/xapi/statements', controller.getXAPIStatements);

  /**
   * @swagger
   * /api/lms-standards/xapi/activity/summary:
   *   get:
   *     summary: Get xAPI activity summary
   *     tags: [LMS Standards - xAPI]
   *     responses:
   *       200:
   *         description: Activity summary
   */
  router.get('/xapi/activity/summary', controller.getXAPIActivitySummary);

  /**
   * @swagger
   * /api/lms-standards/xapi/state:
   *   post:
   *     summary: Save xAPI state
   *     tags: [LMS Standards - xAPI]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - activity_id
   *               - agent_id
   *               - state_id
   *               - state_content
   *             properties:
   *               activity_id:
   *                 type: string
   *               agent_id:
   *                 type: string
   *               state_id:
   *                 type: string
   *               registration:
   *                 type: string
   *               state_content:
   *                 type: object
   *     responses:
   *       201:
   *         description: State saved
   */
  router.post('/xapi/state', controller.saveXAPIState);

  /**
   * @swagger
   * /api/lms-standards/xapi/state:
   *   get:
   *     summary: Get xAPI state
   *     tags: [LMS Standards - xAPI]
   *     parameters:
   *       - in: query
   *         name: activity_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: agent_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: state_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: registration
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: State data
   *       404:
   *         description: State not found
   */
  router.get('/xapi/state', controller.getXAPIState);

  /**
   * @swagger
   * /api/lms-standards/xapi/state:
   *   delete:
   *     summary: Delete xAPI state
   *     tags: [LMS Standards - xAPI]
   *     parameters:
   *       - in: query
   *         name: activity_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: agent_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: state_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: State deleted
   */
  router.delete('/xapi/state', controller.deleteXAPIState);

  /**
   * @swagger
   * /api/lms-standards/exports:
   *   post:
   *     summary: Create content export
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
   *               content_id:
   *                 type: string
   *               export_format:
   *                 type: string
   *                 enum: [scorm_1.2, scorm_2004, xapi, common_cartridge]
   *               generated_by:
   *                 type: string
   *     responses:
   *       201:
   *         description: Export created
   */
  router.post('/exports', controller.createContentExport);

  /**
   * @swagger
   * /api/lms-standards/exports/{export_id}:
   *   put:
   *     summary: Update content export
   *     tags: [LMS Standards - Exports]
   *     parameters:
   *       - in: path
   *         name: export_id
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
   *                 enum: [pending, processing, completed, failed]
   *               export_file_path:
   *                 type: string
   *               progress_percent:
   *                 type: integer
   *               error_message:
   *                 type: string
   *     responses:
   *       200:
   *         description: Export updated
   */
  router.put('/exports/:export_id', controller.updateContentExport);

  /**
   * @swagger
   * /api/lms-standards/exports:
   *   get:
   *     summary: Get content exports
   *     tags: [LMS Standards - Exports]
   *     parameters:
   *       - in: query
   *         name: content_type
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: generated_by
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of exports
   */
  router.get('/exports', controller.getContentExports);

  return router;
};
