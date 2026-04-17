import { Request, Response } from 'express';
import { proctoringService } from '../services/proctoring.service';

/**
 * Start proctored exam session
 */
export const startProctoringSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, assessmentId, assessmentType, webcamEnabled, screenRecordingEnabled, browserLockdownEnabled, faceVerificationRequired } = req.body;

    if (!userId || !assessmentId) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, assessmentId',
      });
      return;
    }

    const session = await proctoringService.startSession({
      userId,
      assessmentId,
      assessmentType: assessmentType || 'assessment',
      webcamEnabled: webcamEnabled !== false,
      screenRecordingEnabled: screenRecordingEnabled === true,
      browserLockdownEnabled: browserLockdownEnabled !== false,
      faceVerificationRequired: faceVerificationRequired !== false,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('[proctoring] Start session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start proctoring session',
    });
  }
};

/**
 * Track proctoring event
 */
export const trackProctoringEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, eventType, severity, description, metadata } = req.body;

    if (!sessionId || !eventType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, eventType',
      });
      return;
    }

    await proctoringService.trackEvent({
      sessionId,
      eventType,
      severity: severity || 'info',
      description,
      metadata,
    });

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('[proctoring] Track event error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to track event',
    });
  }
};

/**
 * End proctoring session
 */
export const endProctoringSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await proctoringService.endSession(sessionId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('[proctoring] End session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end proctoring session',
    });
  }
};

/**
 * Get proctoring session details
 */
export const getProctoringSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await proctoringService.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Proctoring session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('[proctoring] Get session error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get proctoring session',
    });
  }
};

/**
 * Get session events
 */
export const getSessionEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const events = await proctoringService.getSessionEvents(sessionId);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('[proctoring] Get events error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get session events',
    });
  }
};

/**
 * Get user's proctoring sessions
 */
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const sessions = await proctoringService.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('[proctoring] Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user sessions',
    });
  }
};

/**
 * Get flagged sessions (Admin/Instructor only)
 */
export const getFlaggedSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const sessions = await proctoringService.getFlaggedSessions(limit);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('[proctoring] Get flagged sessions error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get flagged sessions',
    });
  }
};

/**
 * Save face snapshot during proctoring
 */
export const saveFaceSnapshot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, userId, imageUrl, faceDetected, faceCount, confidenceScore, faceEncodings } = req.body;

    if (!sessionId || !userId || !imageUrl) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: sessionId, userId, imageUrl',
      });
      return;
    }

    await proctoringService.saveFaceSnapshot({
      sessionId,
      userId,
      imageUrl,
      faceDetected: faceDetected !== false,
      faceCount: faceCount || 0,
      confidenceScore,
      faceEncodings,
    });

    res.json({
      success: true,
      message: 'Face snapshot saved successfully',
    });
  } catch (error) {
    console.error('[proctoring] Save snapshot error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save face snapshot',
    });
  }
};

/**
 * Get session snapshots
 */
export const getSessionSnapshots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const snapshots = await proctoringService.getSessionSnapshots(sessionId);

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('[proctoring] Get snapshots error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get session snapshots',
    });
  }
};

/**
 * Update proctor review (Admin/Instructor only)
 */
export const updateProctorReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { reviewStatus, notes } = req.body;

    if (!reviewStatus) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: reviewStatus',
      });
      return;
    }

    await proctoringService.updateProctorReview(sessionId, {
      reviewStatus,
      notes,
    });

    res.json({
      success: true,
      message: 'Proctor review updated successfully',
    });
  } catch (error) {
    console.error('[proctoring] Update review error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update proctor review',
    });
  }
};
