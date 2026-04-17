import { Router } from 'express';
import { ProctoringControllerEnhanced } from '../controllers/proctoring.controller.enhanced';
import { Pool } from 'pg';

export const createProctoringRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new ProctoringControllerEnhanced(pool);

  /**
   * @swagger
   * /api/proctoring/health:
   *   get:
   *     summary: Proctoring system health check
   *     tags: [Proctoring - System]
   *     responses:
   *       200:
   *         description: System healthy with proctoring metrics
   */
  router.get('/health', controller.proctoringHealthCheck);

  /**
   * @swagger
   * /api/proctoring/sessions:
   *   post:
   *     summary: Create proctoring session (Enhanced)
   *     tags: [Proctoring - Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [assessment_id, user_id, session_token, proctoring_mode, scheduled_start_time, scheduled_end_time]
   *             properties:
   *               assessment_id:
   *                 type: string
   *                 format: uuid
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               session_token:
   *                 type: string
   *               proctoring_mode:
   *                 type: string
   *                 enum: [live, recorded, ai_automated, hybrid, no_proctoring]
   *               scheduled_start_time:
   *                 type: string
   *                 format: date-time
   *               scheduled_end_time:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Session created
   *       409:
   *         description: Active session already exists for user/assessment
   */
  router.post('/sessions', controller.createSession);

  /**
   * @swagger
   * /api/proctoring/sessions:
   *   get:
   *     summary: Get proctoring sessions with metrics (Enhanced)
   *     tags: [Proctoring - Sessions]
   *     parameters:
   *       - in: query
   *         name: user_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: assessment_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: proctoring_mode
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Sessions with violation counts and severity
   */
  router.get('/sessions', controller.getSessions);

  /**
   * @swagger
   * /api/proctoring/sessions/{session_id}:
   *   get:
   *     summary: Get session by ID (NEW)
   *     tags: [Proctoring - Sessions]
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session details
   *       404:
   *         description: Session not found
   */
  router.get('/sessions/:session_id', controller.getSessionById);

  /**
   * @swagger
   * /api/proctoring/sessions/{session_id}/status:
   *   put:
   *     summary: Update session status (Enhanced)
   *     tags: [Proctoring - Sessions]
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [scheduled, in_progress, paused, completed, terminated, cancelled]
   *     responses:
   *       200:
   *         description: Status updated (auto-tracks start/end times)
   */
  router.put('/sessions/:session_id/status', controller.updateSessionStatus);

  /**
   * @swagger
   * /api/proctoring/violations:
   *   post:
   *     summary: Record violation (Enhanced with auto-detection)
   *     tags: [Proctoring - Violations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [session_id, user_id, violation_type, severity]
   *             properties:
   *               session_id:
   *                 type: string
   *                 format: uuid
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               violation_type:
   *                 type: string
   *                 enum: [multiple_faces, no_face, face_not_recognized, looking_away, suspicious_audio, tab_switch, window_switch, prohibited_app, external_monitor, mobile_device_detected, unauthorized_person, screen_sharing_stopped, browser_exit, copy_paste, suspicious_behavior]
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *               snapshot_url:
   *                 type: string
   *               violation_description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Violation recorded (may trigger auto-termination on critical)
   */
  router.post('/violations', controller.recordViolation);

  /**
   * @swagger
   * /api/proctoring/violations/{session_id}:
   *   get:
   *     summary: Get violations with summary (Enhanced)
   *     tags: [Proctoring - Violations]
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Violations with severity breakdown and most common type
   */
  router.get('/violations/:session_id', controller.getViolations);

  /**
   * @swagger
   * /api/proctoring/face/capture:
   *   post:
   *     summary: Record face capture with auto-violation detection (Enhanced)
   *     tags: [Proctoring - Face Recognition]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [session_id, user_id, image_url, faces_detected]
   *             properties:
   *               session_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               image_url:
   *                 type: string
   *               faces_detected:
   *                 type: integer
   *               face_match_score:
   *                 type: number
   *     responses:
   *       201:
   *         description: Face capture recorded (auto-detects violations)
   */
  router.post('/face/capture', controller.recordFaceCapture);

  /**
   * @swagger
   * /api/proctoring/face/captures/{session_id}:
   *   get:
   *     summary: Get face captures (NEW)
   *     tags: [Proctoring - Face Recognition]
   *     parameters:
   *       - in: path
   *         name: session_id
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
   *         description: Face capture history
   */
  router.get('/face/captures/:session_id', controller.getFaceCaptures);

  /**
   * @swagger
   * /api/proctoring/identity/verify:
   *   post:
   *     summary: Initiate identity verification (Enhanced)
   *     tags: [Proctoring - Identity]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [session_id, user_id, verification_method]
   *             properties:
   *               session_id:
   *                 type: string
   *                 format: uuid
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               verification_method:
   *                 type: string
   *                 enum: [face_match, id_document, knowledge_based, biometric, multi_factor]
   *               face_photo_url:
   *                 type: string
   *     responses:
   *       201:
   *         description: Verification initiated
   */
  router.post('/identity/verify', controller.verifyIdentity);

  /**
   * @swagger
   * /api/proctoring/identity/{verification_id}/result:
   *   put:
   *     summary: Update verification result (NEW)
   *     tags: [Proctoring - Identity]
   *     parameters:
   *       - in: path
   *         name: verification_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [is_verified, confidence]
   *             properties:
   *               is_verified:
   *                 type: boolean
   *               confidence:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *     responses:
   *       200:
   *         description: Verification result updated
   */
  router.put('/identity/:verification_id/result', controller.updateVerificationResult);

  /**
   * @swagger
   * /api/proctoring/plagiarism/check:
   *   post:
   *     summary: Initiate plagiarism check (Enhanced)
   *     tags: [Proctoring - Plagiarism]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [submission_id, user_id, assessment_id, content_text]
   *             properties:
   *               submission_id:
   *                 type: string
   *                 format: uuid
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               assessment_id:
   *                 type: string
   *                 format: uuid
   *               content_text:
   *                 type: string
   *     responses:
   *       201:
   *         description: Plagiarism check initiated
   */
  router.post('/plagiarism/check', controller.checkPlagiarism);

  /**
   * @swagger
   * /api/proctoring/plagiarism/{check_id}/result:
   *   put:
   *     summary: Update plagiarism result (Enhanced)
   *     tags: [Proctoring - Plagiarism]
   *     parameters:
   *       - in: path
   *         name: check_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [similarity_percent, is_plagiarized]
   *             properties:
   *               similarity_percent:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *               is_plagiarized:
   *                 type: boolean
   *               matched_sources:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Plagiarism result updated
   */
  router.put('/plagiarism/:check_id/result', controller.updatePlagiarismResult);

  /**
   * @swagger
   * /api/proctoring/plagiarism/checks:
   *   get:
   *     summary: Get plagiarism checks with filters (Enhanced)
   *     tags: [Proctoring - Plagiarism]
   *     parameters:
   *       - in: query
   *         name: submission_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: is_plagiarized
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of plagiarism checks
   */
  router.get('/plagiarism/checks', controller.getPlagiarismChecks);

  /**
   * @swagger
   * /api/proctoring/risk/high-risk-sessions:
   *   get:
   *     summary: Get high-risk sessions with priority (Enhanced)
   *     tags: [Proctoring - Risk Analysis]
   *     responses:
   *       200:
   *         description: High-risk sessions sorted by risk score with risk level classification
   */
  router.get('/risk/high-risk-sessions', controller.getHighRiskSessions);

  /**
   * @swagger
   * /api/proctoring/lockdown:
   *   post:
   *     summary: Record browser lockdown (Enhanced)
   *     tags: [Proctoring - Browser Lockdown]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [session_id, user_id, lockdown_level]
   *             properties:
   *               session_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               browser_name:
   *                 type: string
   *               lockdown_level:
   *                 type: string
   *                 enum: [strict, moderate, basic]
   *     responses:
   *       201:
   *         description: Browser lockdown recorded
   */
  router.post('/lockdown', controller.recordBrowserLockdown);

  /**
   * @swagger
   * /api/proctoring/lockdown/{lockdown_id}/heartbeat:
   *   post:
   *     summary: Update lockdown heartbeat with monitoring (Enhanced)
   *     tags: [Proctoring - Browser Lockdown]
   *     parameters:
   *       - in: path
   *         name: lockdown_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Heartbeat updated (auto-detects missed heartbeats)
   */
  router.post('/lockdown/:lockdown_id/heartbeat', controller.updateLockdownHeartbeat);

  return router;
};
