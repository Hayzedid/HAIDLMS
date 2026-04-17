import { Router } from 'express';
import * as proctoringController from '../controllers/proctoring.controller';

const router = Router();

/**
 * @route   POST /api/proctoring/sessions/start
 * @desc    Start a new proctored exam session
 * @access  Private (Student)
 * @body    { userId, assessmentId, assessmentType, webcamEnabled, screenRecordingEnabled, browserLockdownEnabled, faceVerificationRequired }
 */
router.post('/sessions/start', proctoringController.startProctoringSession);

/**
 * @route   POST /api/proctoring/events
 * @desc    Track proctoring event (tab switch, face not detected, etc.)
 * @access  Private (Student)
 * @body    { sessionId, eventType, severity, description, metadata }
 */
router.post('/events', proctoringController.trackProctoringEvent);

/**
 * @route   POST /api/proctoring/sessions/:sessionId/end
 * @desc    End proctoring session
 * @access  Private (Student)
 */
router.post('/sessions/:sessionId/end', proctoringController.endProctoringSession);

/**
 * @route   GET /api/proctoring/sessions/:sessionId
 * @desc    Get proctoring session details
 * @access  Private (Student - own session, Instructor/Admin - any session)
 */
router.get('/sessions/:sessionId', proctoringController.getProctoringSession);

/**
 * @route   GET /api/proctoring/sessions/:sessionId/events
 * @desc    Get session events timeline
 * @access  Private (Student - own session, Instructor/Admin - any session)
 */
router.get('/sessions/:sessionId/events', proctoringController.getSessionEvents);

/**
 * @route   GET /api/proctoring/users/:userId/sessions
 * @desc    Get user's proctoring sessions
 * @access  Private (Student - own sessions, Instructor/Admin - any user)
 */
router.get('/users/:userId/sessions', proctoringController.getUserSessions);

/**
 * @route   GET /api/proctoring/flagged
 * @desc    Get all flagged proctoring sessions
 * @access  Private (Instructor, Admin)
 * @query   { limit?: number }
 */
router.get('/flagged', proctoringController.getFlaggedSessions);

/**
 * @route   POST /api/proctoring/snapshots
 * @desc    Save face snapshot during proctoring
 * @access  Private (Student)
 * @body    { sessionId, userId, imageUrl, faceDetected, faceCount, confidenceScore, faceEncodings }
 */
router.post('/snapshots', proctoringController.saveFaceSnapshot);

/**
 * @route   GET /api/proctoring/sessions/:sessionId/snapshots
 * @desc    Get session face snapshots
 * @access  Private (Student - own session, Instructor/Admin - any session)
 */
router.get('/sessions/:sessionId/snapshots', proctoringController.getSessionSnapshots);

/**
 * @route   PATCH /api/proctoring/sessions/:sessionId/review
 * @desc    Update proctor review status and notes
 * @access  Private (Instructor, Admin)
 * @body    { reviewStatus, notes }
 */
router.patch('/sessions/:sessionId/review', proctoringController.updateProctorReview);

export default router;
