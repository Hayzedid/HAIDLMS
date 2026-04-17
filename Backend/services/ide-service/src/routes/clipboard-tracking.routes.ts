import express from 'express';
import { clipboardTrackingController } from '../controllers/clipboard-tracking.controller';

const router = express.Router();

/**
 * Clipboard Tracking Routes
 * All routes require authentication (add auth middleware)
 */

/**
 * @route   POST /api/clipboard/log-attempt
 * @desc    Log clipboard attempt (copy/paste/cut)
 * @access  Private (Student)
 * @body    { sessionId, lessonId, assessmentId, problemId, attemptType, source, blocked, contentLength, content, cursorPosition, selectedTextLength, fileName, lineNumber, detectedBy }
 */
router.post('/clipboard/log-attempt', clipboardTrackingController.logAttempt.bind(clipboardTrackingController));

/**
 * @route   GET /api/clipboard/session/:sessionId
 * @desc    Get clipboard attempts for session
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/clipboard/session/:sessionId', clipboardTrackingController.getSessionAttempts.bind(clipboardTrackingController));

/**
 * @route   GET /api/clipboard/assessment/:assessmentId
 * @desc    Get clipboard attempts for assessment
 * @access  Private (Instructor, Admin)
 * @query   userId (optional)
 */
router.get('/clipboard/assessment/:assessmentId', clipboardTrackingController.getAssessmentAttempts.bind(clipboardTrackingController));

/**
 * @route   GET /api/clipboard/stats/:userId
 * @desc    Get user clipboard attempt statistics
 * @access  Private (Student - Owner, Instructor, Admin)
 * @query   assessmentId (optional)
 */
router.get('/clipboard/stats/:userId', clipboardTrackingController.getUserStats.bind(clipboardTrackingController));

/**
 * Keystroke Tracking Routes
 */

/**
 * @route   POST /api/keystroke/start-session
 * @desc    Start keystroke recording session
 * @access  Private (Student)
 * @body    { lessonId, assessmentId, problemId }
 */
router.post('/keystroke/start-session', clipboardTrackingController.startSession.bind(clipboardTrackingController));

/**
 * @route   POST /api/keystroke/end-session/:sessionId
 * @desc    End keystroke recording session
 * @access  Private (Student - Owner)
 * @body    { finalCode, language, avgTypingSpeedWPM, avgKeyIntervalMs, consistencyScore }
 */
router.post('/keystroke/end-session/:sessionId', clipboardTrackingController.endSession.bind(clipboardTrackingController));

/**
 * @route   POST /api/keystroke/log-events
 * @desc    Log keystroke events (batch)
 * @access  Private (Student)
 * @body    { events: [{ sessionId, timestampMs, eventType, keyCode, keyName, isSpecialKey, modifiers, cursorPosition, lineNumber, columnNumber, selectionStart, selectionEnd, charInserted, charsDeleted }] }
 */
router.post('/keystroke/log-events', clipboardTrackingController.logEvents.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/session/:sessionId
 * @desc    Get keystroke session details
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/keystroke/session/:sessionId', clipboardTrackingController.getSession.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/events/:sessionId
 * @desc    Get keystroke events for session (for replay)
 * @access  Private (Student - Owner, Instructor, Admin)
 * @query   limit (optional, default: 10000)
 */
router.get('/keystroke/events/:sessionId', clipboardTrackingController.getEvents.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/patterns/:userId
 * @desc    Get student typing patterns (baseline)
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/keystroke/patterns/:userId', clipboardTrackingController.getTypingPatterns.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/integrity-concerns
 * @desc    Get sessions with integrity concerns
 * @access  Private (Instructor, Admin)
 * @query   userId (optional), assessmentId (optional)
 */
router.get('/keystroke/integrity-concerns', clipboardTrackingController.getIntegrityConcerns.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/pattern-deviations
 * @desc    Get typing pattern deviations
 * @access  Private (Instructor, Admin)
 * @query   userId (optional)
 */
router.get('/keystroke/pattern-deviations', clipboardTrackingController.getPatternDeviations.bind(clipboardTrackingController));

/**
 * @route   POST /api/keystroke/flag-session
 * @desc    Flag session for integrity review
 * @access  Private (System, Instructor, Admin)
 * @body    { userId, sessionId, assessmentId, flagType, severity, description, evidence }
 */
router.post('/keystroke/flag-session', clipboardTrackingController.flagSession.bind(clipboardTrackingController));

/**
 * @route   GET /api/keystroke/integrity-flags
 * @desc    Get integrity flags
 * @access  Private (Instructor, Admin)
 * @query   userId (optional), sessionId (optional), assessmentId (optional), severity (optional), reviewed (optional), limit (optional)
 */
router.get('/keystroke/integrity-flags', clipboardTrackingController.getIntegrityFlags.bind(clipboardTrackingController));

/**
 * @route   POST /api/keystroke/review-flag/:flagId
 * @desc    Review integrity flag
 * @access  Private (Instructor, Admin)
 * @body    { reviewNotes, actionTaken }
 */
router.post('/keystroke/review-flag/:flagId', clipboardTrackingController.reviewFlag.bind(clipboardTrackingController));

export default router;
