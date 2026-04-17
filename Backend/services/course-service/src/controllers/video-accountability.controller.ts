import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { videoAccountabilityService } from '../services/video-accountability.service';

/**
 * Start a new video watch session
 */
export const startWatchSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId, enrollmentId, videoDurationSeconds } = req.body;
    const userId = req.user!.userId;

    if (!lessonId || !enrollmentId || !videoDurationSeconds) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: lessonId, enrollmentId, videoDurationSeconds',
      });
      return;
    }

    const session = await videoAccountabilityService.startWatchSession(
      userId,
      lessonId,
      enrollmentId,
      videoDurationSeconds
    );

    // Also get accountability settings and checkpoints
    const [settings, checkpoints] = await Promise.all([
      videoAccountabilityService.getAccountabilitySettings(lessonId),
      videoAccountabilityService.getCheckpoints(lessonId),
    ]);

    res.json({
      success: true,
      data: {
        session,
        settings,
        checkpoints,
      },
    });
  } catch (error) {
    console.error('[video-accountability] Start session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start watch session',
    });
  }
};

/**
 * Update watch session metrics
 */
export const updateWatchSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;

    await videoAccountabilityService.updateWatchSession(sessionId, updates);

    res.json({
      success: true,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('[video-accountability] Update session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update watch session',
    });
  }
};

/**
 * End watch session
 */
export const endWatchSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await videoAccountabilityService.endWatchSession(sessionId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('[video-accountability] End session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end watch session',
    });
  }
};

/**
 * Log engagement event
 */
export const logEngagementEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { watchSessionId, lessonId, eventType, videoPosition, metadata } = req.body;
    const userId = req.user!.userId;

    if (!watchSessionId || !lessonId || !eventType || videoPosition === undefined) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: watchSessionId, lessonId, eventType, videoPosition',
      });
      return;
    }

    await videoAccountabilityService.logEngagementEvent({
      watchSessionId,
      userId,
      lessonId,
      eventType,
      videoPosition,
      metadata,
    });

    res.json({
      success: true,
      message: 'Event logged successfully',
    });
  } catch (error) {
    console.error('[video-accountability] Log event error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to log engagement event',
    });
  }
};

/**
 * Get next checkpoint to trigger
 */
export const getNextCheckpoint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId, currentPosition, watchSessionId } = req.query;

    if (!lessonId || !currentPosition || !watchSessionId) {
      res.status(400).json({
        success: false,
        message: 'Missing required query parameters: lessonId, currentPosition, watchSessionId',
      });
      return;
    }

    const checkpoint = await videoAccountabilityService.getNextCheckpoint(
      lessonId as string,
      parseInt(currentPosition as string),
      watchSessionId as string
    );

    res.json({
      success: true,
      data: checkpoint,
    });
  } catch (error) {
    console.error('[video-accountability] Get checkpoint error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get next checkpoint',
    });
  }
};

/**
 * Submit checkpoint response
 */
export const submitCheckpointResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      checkpointId,
      watchSessionId,
      lessonId,
      responseText,
      selectedOption,
      noteText,
      timeTakenSeconds,
    } = req.body;
    const userId = req.user!.userId;

    if (!checkpointId || !watchSessionId || !lessonId) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: checkpointId, watchSessionId, lessonId',
      });
      return;
    }

    const result = await videoAccountabilityService.submitCheckpointResponse({
      checkpointId,
      watchSessionId,
      userId,
      lessonId,
      responseText,
      selectedOption,
      passed: false, // Will be determined by service
      timeTakenSeconds,
      noteText,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[video-accountability] Submit response error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit checkpoint response',
    });
  }
};

/**
 * Save video note
 */
export const saveVideoNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId, videoTimestamp, noteText, watchSessionId, checkpointId } = req.body;
    const userId = req.user!.userId;

    if (!lessonId || videoTimestamp === undefined || !noteText) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: lessonId, videoTimestamp, noteText',
      });
      return;
    }

    await videoAccountabilityService.saveVideoNote(
      userId,
      lessonId,
      videoTimestamp,
      noteText,
      watchSessionId,
      checkpointId
    );

    res.json({
      success: true,
      message: 'Note saved successfully',
    });
  } catch (error) {
    console.error('[video-accountability] Save note error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save note',
    });
  }
};

/**
 * Get watch session analytics
 */
export const getSessionAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const analytics = await videoAccountabilityService.getSessionAnalytics(sessionId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[video-accountability] Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get session analytics',
    });
  }
};

/**
 * Get student watch history
 */
export const getWatchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const userId = req.user!.userId;

    const history = await videoAccountabilityService.getWatchHistory(userId, lessonId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[video-accountability] Get history error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get watch history',
    });
  }
};

/**
 * Get instructor accountability dashboard
 * (Instructor/Admin only)
 */
export const getInstructorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;

    // Check if user is instructor or admin
    if (req.user?.role !== 'instructor' && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Instructor or Admin role required.',
      });
      return;
    }

    const dashboard = await videoAccountabilityService.getInstructorDashboard(lessonId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('[video-accountability] Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get instructor dashboard',
    });
  }
};

/**
 * Get accountability settings for a lesson
 */
export const getAccountabilitySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;

    const settings = await videoAccountabilityService.getAccountabilitySettings(lessonId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[video-accountability] Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get accountability settings',
    });
  }
};

/**
 * Get checkpoints for a lesson
 */
export const getCheckpoints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    const checkpoints = await videoAccountabilityService.getCheckpoints(lessonId, includeInactive);

    res.json({
      success: true,
      data: checkpoints,
    });
  } catch (error) {
    console.error('[video-accountability] Get checkpoints error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get checkpoints',
    });
  }
};
