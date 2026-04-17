import { Router } from 'express';
import * as videoAccountabilityController from '../controllers/video-accountability.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/video-accountability/sessions/start
 * @desc    Start a new video watch session
 * @access  Private (Student)
 * @body    { lessonId: string, enrollmentId: string, videoDurationSeconds: number }
 */
router.post('/sessions/start', videoAccountabilityController.startWatchSession);

/**
 * @route   PATCH /api/video-accountability/sessions/:sessionId
 * @desc    Update watch session metrics
 * @access  Private (Student)
 * @body    { totalWatchTimeSeconds?, activeWatchTimeSeconds?, tabSwitches?, ... }
 */
router.patch('/sessions/:sessionId', videoAccountabilityController.updateWatchSession);

/**
 * @route   POST /api/video-accountability/sessions/:sessionId/end
 * @desc    End watch session and evaluate completion
 * @access  Private (Student)
 */
router.post('/sessions/:sessionId/end', videoAccountabilityController.endWatchSession);

/**
 * @route   POST /api/video-accountability/events
 * @desc    Log engagement event (play, pause, seek, tab_blur, etc.)
 * @access  Private (Student)
 * @body    { watchSessionId: string, lessonId: string, eventType: string, videoPosition: number, metadata?: any }
 */
router.post('/events', videoAccountabilityController.logEngagementEvent);

/**
 * @route   GET /api/video-accountability/checkpoints/next
 * @desc    Get next checkpoint to trigger based on current position
 * @access  Private (Student)
 * @query   { lessonId: string, currentPosition: number, watchSessionId: string }
 */
router.get('/checkpoints/next', videoAccountabilityController.getNextCheckpoint);

/**
 * @route   POST /api/video-accountability/checkpoints/respond
 * @desc    Submit checkpoint response (quiz answer or note)
 * @access  Private (Student)
 * @body    { checkpointId: string, watchSessionId: string, lessonId: string, responseText?, selectedOption?, noteText? }
 */
router.post('/checkpoints/respond', videoAccountabilityController.submitCheckpointResponse);

/**
 * @route   POST /api/video-accountability/notes
 * @desc    Save video note at specific timestamp
 * @access  Private (Student)
 * @body    { lessonId: string, videoTimestamp: number, noteText: string, watchSessionId?, checkpointId? }
 */
router.post('/notes', videoAccountabilityController.saveVideoNote);

/**
 * @route   GET /api/video-accountability/sessions/:sessionId/analytics
 * @desc    Get detailed analytics for a watch session
 * @access  Private (Student - own session, Instructor - any session)
 */
router.get('/sessions/:sessionId/analytics', videoAccountabilityController.getSessionAnalytics);

/**
 * @route   GET /api/video-accountability/history/:lessonId
 * @desc    Get student's watch history for a lesson
 * @access  Private (Student - own history)
 */
router.get('/history/:lessonId', videoAccountabilityController.getWatchHistory);

/**
 * @route   GET /api/video-accountability/lessons/:lessonId/dashboard
 * @desc    Get instructor accountability dashboard for a lesson
 * @access  Private (Instructor, Admin)
 */
router.get('/lessons/:lessonId/dashboard', videoAccountabilityController.getInstructorDashboard);

/**
 * @route   GET /api/video-accountability/lessons/:lessonId/settings
 * @desc    Get accountability settings for a lesson
 * @access  Private (any authenticated user)
 */
router.get('/lessons/:lessonId/settings', videoAccountabilityController.getAccountabilitySettings);

/**
 * @route   GET /api/video-accountability/lessons/:lessonId/checkpoints
 * @desc    Get all checkpoints for a lesson
 * @access  Private (any authenticated user)
 * @query   { includeInactive?: boolean }
 */
router.get('/lessons/:lessonId/checkpoints', videoAccountabilityController.getCheckpoints);

export default router;
