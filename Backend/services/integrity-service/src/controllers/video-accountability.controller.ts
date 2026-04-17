import { Request, Response } from 'express';
import { videoAccountabilityService } from '../services/video-accountability.service';
import { z } from 'zod';

const CreateSessionSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  videoUrl: z.string().url(),
  videoDuration: z.number().positive(),
});

const TrackEventSchema = z.object({
  sessionId: z.string().uuid(),
  eventType: z.enum(['play', 'pause', 'seek', 'tab_blur', 'tab_focus', 'window_blur', 'window_focus', 'fullscreen_enter', 'fullscreen_exit']),
  timestampMs: z.number().nonnegative(),
  durationMs: z.number().optional(),
  fromPosition: z.number().optional(),
  toPosition: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const CreateCheckpointSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  videoTimestamp: z.number().nonnegative(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
});

const SubmitCheckpointResponseSchema = z.object({
  checkpointId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  selectedAnswer: z.string(),
  timeTaken: z.number().nonnegative(),
});

export class VideoAccountabilityController {
  /**
   * Create video watch session
   */
  async createSession(req: Request, res: Response) {
    try {
      const data = CreateSessionSchema.parse(req.body);
      const session = await videoAccountabilityService.createSession(data);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      });
    }
  }

  /**
   * Track video event
   */
  async trackEvent(req: Request, res: Response) {
    try {
      const data = TrackEventSchema.parse(req.body);
      await videoAccountabilityService.trackEvent(data);

      res.json({
        success: true,
        message: 'Event tracked',
      });
    } catch (error) {
      console.error('Track event error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track event',
      });
    }
  }

  /**
   * End video session
   */
  async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await videoAccountabilityService.endSession(sessionId);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('End session error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end session',
      });
    }
  }

  /**
   * Get session details
   */
  async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await videoAccountabilityService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session',
      });
    }
  }

  /**
   * Get user's sessions
   */
  async getUserSessions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { lessonId } = req.query;

      const sessions = await videoAccountabilityService.getUserSessions(
        userId,
        lessonId as string | undefined
      );

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error('Get user sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sessions',
      });
    }
  }

  /**
   * Get session events
   */
  async getSessionEvents(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const events = await videoAccountabilityService.getSessionEvents(sessionId);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error('Get session events error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get events',
      });
    }
  }

  /**
   * Create comprehension checkpoint
   */
  async createCheckpoint(req: Request, res: Response) {
    try {
      const data = CreateCheckpointSchema.parse(req.body);
      const checkpoint = await videoAccountabilityService.createCheckpoint(data);

      res.status(201).json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      console.error('Create checkpoint error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkpoint',
      });
    }
  }

  /**
   * Get lesson checkpoints
   */
  async getCheckpoints(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const checkpoints = await videoAccountabilityService.getCheckpoints(lessonId);

      res.json({
        success: true,
        data: checkpoints,
      });
    } catch (error) {
      console.error('Get checkpoints error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkpoints',
      });
    }
  }

  /**
   * Submit checkpoint response
   */
  async submitCheckpointResponse(req: Request, res: Response) {
    try {
      const data = SubmitCheckpointResponseSchema.parse(req.body);
      const response = await videoAccountabilityService.submitCheckpointResponse(data);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Submit checkpoint response error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit response',
      });
    }
  }

  /**
   * Get user checkpoint responses
   */
  async getUserCheckpointResponses(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { lessonId } = req.query;

      const responses = await videoAccountabilityService.getUserCheckpointResponses(
        userId,
        lessonId as string | undefined
      );

      res.json({
        success: true,
        data: responses,
      });
    } catch (error) {
      console.error('Get checkpoint responses error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get responses',
      });
    }
  }
}

export const videoAccountabilityController = new VideoAccountabilityController();
