import { Request, Response } from 'express';
import { z } from 'zod';
import { spacedRepetitionService } from '../services/spaced-repetition.service';
import { retentionTrackingService } from '../services/retention-tracking.service';

// ── Validation Schemas ─────────────────────────────────────────────────────

const initializeScheduleSchema = z.object({
  userId: z.string().uuid(),
  contentId: z.string().uuid(),
  contentType: z.enum(['lesson', 'module', 'course']),
});

const recordReviewSchema = z.object({
  quality: z.number().int().min(0).max(5),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

const pauseScheduleSchema = z.object({
  pauseUntil: z.string().datetime(),
});

// ── Controllers ────────────────────────────────────────────────────────────

/**
 * Initialize spaced repetition schedule
 * POST /api/spaced-repetition/schedules
 */
export async function initializeSchedule(req: Request, res: Response) {
  try {
    const data = initializeScheduleSchema.parse(req.body);

    const schedule = await spacedRepetitionService.initializeSchedule(
      data.userId,
      data.contentId,
      data.contentType
    );

    return res.status(201).json(schedule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[spaced-rep-controller] Initialize schedule error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Get schedule for specific content
 * GET /api/spaced-repetition/schedules/:userId/:contentId/:contentType
 */
export async function getSchedule(req: Request, res: Response) {
  try {
    const { userId, contentId, contentType } = req.params;

    const schedule = await spacedRepetitionService.getSchedule(userId, contentId, contentType);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.json(schedule);
  } catch (error) {
    console.error('[spaced-rep-controller] Get schedule error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Record review response
 * POST /api/spaced-repetition/schedules/:scheduleId/review
 */
export async function recordReview(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params;
    const data = recordReviewSchema.parse(req.body);

    const schedule = await spacedRepetitionService.recordReview(scheduleId, data);

    return res.json(schedule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[spaced-rep-controller] Record review error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

/**
 * Get due reviews for user
 * GET /api/spaced-repetition/reviews/due
 */
export async function getDueReviews(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reviews = await spacedRepetitionService.getDueReviews(userId);

    return res.json(reviews);
  } catch (error) {
    console.error('[spaced-rep-controller] Get due reviews error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get upcoming reviews for user
 * GET /api/spaced-repetition/reviews/upcoming
 */
export async function getUpcomingReviews(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { days } = req.query;

    const reviews = await spacedRepetitionService.getUpcomingReviews(
      userId,
      days ? parseInt(days as string) : 7
    );

    return res.json(reviews);
  } catch (error) {
    console.error('[spaced-rep-controller] Get upcoming reviews error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Pause schedule
 * POST /api/spaced-repetition/schedules/:scheduleId/pause
 */
export async function pauseSchedule(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params;
    const data = pauseScheduleSchema.parse(req.body);

    await spacedRepetitionService.pauseSchedule(scheduleId, new Date(data.pauseUntil));

    return res.json({ success: true, message: 'Schedule paused' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[spaced-rep-controller] Pause schedule error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Resume schedule
 * POST /api/spaced-repetition/schedules/:scheduleId/resume
 */
export async function resumeSchedule(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params;

    await spacedRepetitionService.resumeSchedule(scheduleId);

    return res.json({ success: true, message: 'Schedule resumed' });
  } catch (error) {
    console.error('[spaced-rep-controller] Resume schedule error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Deactivate schedule
 * DELETE /api/spaced-repetition/schedules/:scheduleId
 */
export async function deactivateSchedule(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params;

    await spacedRepetitionService.deactivateSchedule(scheduleId);

    return res.json({ success: true, message: 'Schedule deactivated' });
  } catch (error) {
    console.error('[spaced-rep-controller] Deactivate schedule error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get schedule statistics for user
 * GET /api/spaced-repetition/stats
 */
export async function getScheduleStats(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await spacedRepetitionService.getScheduleStats(userId);

    return res.json(stats);
  } catch (error) {
    console.error('[spaced-rep-controller] Get schedule stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get retention metrics for user
 * GET /api/spaced-repetition/retention
 */
export async function getRetentionMetrics(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const metrics = await retentionTrackingService.getRetentionMetrics(userId);

    return res.json(metrics);
  } catch (error) {
    console.error('[spaced-rep-controller] Get retention metrics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get learning health score for user
 * GET /api/spaced-repetition/health
 */
export async function getLearningHealthScore(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const health = await retentionTrackingService.getLearningHealthScore(userId);

    return res.json(health);
  } catch (error) {
    console.error('[spaced-rep-controller] Get health score error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get review sessions history
 * GET /api/spaced-repetition/sessions?days=30
 */
export async function getReviewSessions(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { days } = req.query;
    const sessions = await retentionTrackingService.getReviewSessions(
      userId,
      days ? parseInt(days as string) : 30
    );

    return res.json(sessions);
  } catch (error) {
    console.error('[spaced-rep-controller] Get review sessions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
