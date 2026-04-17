import { Request, Response } from 'express';
import { clipboardTrackingService } from '../services/clipboard-tracking.service';

/**
 * Clipboard & Keystroke Tracking Controller
 * Handles clipboard attempt logging and keystroke session management
 */

export class ClipboardTrackingController {
  /**
   * Log clipboard attempt
   * POST /api/clipboard/log-attempt
   */
  async logAttempt(req: Request, res: Response): Promise<void> {
    try {
      const {
        sessionId,
        lessonId,
        assessmentId,
        problemId,
        attemptType,
        source,
        blocked,
        contentLength,
        content,
        cursorPosition,
        selectedTextLength,
        fileName,
        lineNumber,
        detectedBy,
      } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!userId || !sessionId || !attemptType || !source || blocked === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const attempt = await clipboardTrackingService.logClipboardAttempt({
        userId,
        sessionId,
        lessonId,
        assessmentId,
        problemId,
        attemptType,
        source,
        blocked,
        contentLength,
        content,
        cursorPosition,
        selectedTextLength,
        fileName,
        lineNumber,
        detectedBy,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: attempt,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Log attempt error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to log clipboard attempt',
      });
    }
  }

  /**
   * Get session clipboard attempts
   * GET /api/clipboard/session/:sessionId
   */
  async getSessionAttempts(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const attempts = await clipboardTrackingService.getSessionAttempts(sessionId);

      res.json({
        success: true,
        data: attempts,
        count: attempts.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get session attempts error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get session attempts',
      });
    }
  }

  /**
   * Get assessment clipboard attempts
   * GET /api/clipboard/assessment/:assessmentId
   */
  async getAssessmentAttempts(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { userId } = req.query;

      const attempts = await clipboardTrackingService.getAssessmentAttempts(
        assessmentId,
        userId as string
      );

      res.json({
        success: true,
        data: attempts,
        count: attempts.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get assessment attempts error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get assessment attempts',
      });
    }
  }

  /**
   * Get user attempt statistics
   * GET /api/clipboard/stats/:userId
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { assessmentId } = req.query;

      const stats = await clipboardTrackingService.getUserAttemptStats(
        userId,
        assessmentId as string
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user stats',
      });
    }
  }

  /**
   * Start keystroke session
   * POST /api/keystroke/start-session
   */
  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId, assessmentId, problemId } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const session = await clipboardTrackingService.startKeystrokeSession({
        userId,
        lessonId,
        assessmentId,
        problemId,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Start session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start keystroke session',
      });
    }
  }

  /**
   * End keystroke session
   * POST /api/keystroke/end-session/:sessionId
   */
  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { finalCode, language, avgTypingSpeedWPM, avgKeyIntervalMs, consistencyScore } = req.body;

      await clipboardTrackingService.endKeystrokeSession({
        sessionId,
        finalCode,
        language,
        avgTypingSpeedWPM,
        avgKeyIntervalMs,
        consistencyScore,
      });

      res.json({
        success: true,
        message: 'Session ended successfully',
      });
    } catch (error: any) {
      console.error('[ClipboardController] End session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to end keystroke session',
      });
    }
  }

  /**
   * Log keystroke events (batch)
   * POST /api/keystroke/log-events
   */
  async logEvents(req: Request, res: Response): Promise<void> {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Events array is required',
        });
        return;
      }

      await clipboardTrackingService.logKeystrokeEvents(events);

      res.json({
        success: true,
        message: `Logged ${events.length} keystroke events`,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Log events error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to log keystroke events',
      });
    }
  }

  /**
   * Get keystroke session
   * GET /api/keystroke/session/:sessionId
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await clipboardTrackingService.getKeystrokeSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get keystroke session',
      });
    }
  }

  /**
   * Get keystroke events (for replay)
   * GET /api/keystroke/events/:sessionId
   */
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { limit } = req.query;

      const events = await clipboardTrackingService.getKeystrokeEvents(
        sessionId,
        limit ? parseInt(limit as string) : 10000
      );

      res.json({
        success: true,
        data: events,
        count: events.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get events error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get keystroke events',
      });
    }
  }

  /**
   * Get student typing patterns
   * GET /api/keystroke/patterns/:userId
   */
  async getTypingPatterns(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const patterns = await clipboardTrackingService.getStudentTypingPatterns(userId);

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get typing patterns error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get typing patterns',
      });
    }
  }

  /**
   * Get sessions with integrity concerns
   * GET /api/keystroke/integrity-concerns
   */
  async getIntegrityConcerns(req: Request, res: Response): Promise<void> {
    try {
      const { userId, assessmentId } = req.query;

      const sessions = await clipboardTrackingService.getIntegrityConcernSessions(
        userId as string,
        assessmentId as string
      );

      res.json({
        success: true,
        data: sessions,
        count: sessions.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get integrity concerns error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get integrity concerns',
      });
    }
  }

  /**
   * Get typing pattern deviations
   * GET /api/keystroke/pattern-deviations
   */
  async getPatternDeviations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      const deviations = await clipboardTrackingService.getTypingPatternDeviations(
        userId as string
      );

      res.json({
        success: true,
        data: deviations,
        count: deviations.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get pattern deviations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pattern deviations',
      });
    }
  }

  /**
   * Flag session for integrity review
   * POST /api/keystroke/flag-session
   */
  async flagSession(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        sessionId,
        assessmentId,
        flagType,
        severity,
        description,
        evidence,
      } = req.body;

      if (!userId || !sessionId || !flagType || !severity || !description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      await clipboardTrackingService.flagSession({
        userId,
        sessionId,
        assessmentId,
        flagType,
        severity,
        description,
        evidence,
      });

      res.json({
        success: true,
        message: 'Session flagged successfully',
      });
    } catch (error: any) {
      console.error('[ClipboardController] Flag session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to flag session',
      });
    }
  }

  /**
   * Get integrity flags
   * GET /api/keystroke/integrity-flags
   */
  async getIntegrityFlags(req: Request, res: Response): Promise<void> {
    try {
      const { userId, sessionId, assessmentId, severity, reviewed, limit } = req.query;

      const flags = await clipboardTrackingService.getIntegrityFlags({
        userId: userId as string,
        sessionId: sessionId as string,
        assessmentId: assessmentId as string,
        severity: severity as string,
        reviewed: reviewed ? reviewed === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: flags,
        count: flags.length,
      });
    } catch (error: any) {
      console.error('[ClipboardController] Get integrity flags error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get integrity flags',
      });
    }
  }

  /**
   * Review integrity flag
   * POST /api/keystroke/review-flag/:flagId
   */
  async reviewFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const { reviewNotes, actionTaken } = req.body;

      const reviewedBy = req.user?.id || req.body.reviewedBy;

      if (!reviewNotes || !actionTaken) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: reviewNotes, actionTaken',
        });
        return;
      }

      await clipboardTrackingService.reviewIntegrityFlag({
        flagId,
        reviewedBy,
        reviewNotes,
        actionTaken,
      });

      res.json({
        success: true,
        message: 'Flag reviewed successfully',
      });
    } catch (error: any) {
      console.error('[ClipboardController] Review flag error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to review flag',
      });
    }
  }
}

export const clipboardTrackingController = new ClipboardTrackingController();
