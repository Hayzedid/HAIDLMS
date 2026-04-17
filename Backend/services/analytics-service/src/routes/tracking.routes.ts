import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as trackingController from '../controllers/tracking.controller';

const router = Router();

/**
 * @route POST /api/tracking/event
 * @desc Track a single event
 * @access Protected
 */
router.post('/event', authenticateToken, trackingController.trackEvent);

/**
 * @route POST /api/tracking/batch
 * @desc Track multiple events in batch
 * @access Protected
 */
router.post('/batch', authenticateToken, trackingController.trackBatch);

/**
 * @route GET /api/tracking/events
 * @desc Get user events
 * @access Protected
 */
router.get('/events', authenticateToken, trackingController.getUserEvents);

/**
 * @route GET /api/tracking/events/counts
 * @desc Get event counts by type
 * @access Protected
 */
router.get('/events/counts', authenticateToken, trackingController.getEventCounts);

/**
 * @route GET /api/tracking/session
 * @desc Get active session
 * @access Protected
 */
router.get('/session', authenticateToken, trackingController.getActiveSession);

/**
 * @route POST /api/tracking/session/end
 * @desc End user session
 * @access Protected
 */
router.post('/session/end', authenticateToken, trackingController.endSession);

/**
 * @route GET /api/tracking/sessions/history
 * @desc Get session history
 * @access Protected
 */
router.get('/sessions/history', authenticateToken, trackingController.getSessionHistory);

export default router;
