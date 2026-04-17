import { Request, Response } from 'express';
import { z } from 'zod';
import { eventTrackingService } from '../services/event-tracking.service';

// Validation schemas
const TrackEventSchema = z.object({
  eventType: z.string(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  properties: z.record(z.any()).optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional(),
  pageLoadTime: z.number().optional(),
});

const TrackBatchSchema = z.object({
  events: z.array(TrackEventSchema),
});

/**
 * Track a single event
 */
export async function trackEvent(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = TrackEventSchema.parse(req.body);

    await eventTrackingService.trackEvent({
      userId,
      ...validated,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(202).json({ message: 'Event tracked' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
}

/**
 * Track multiple events in batch
 */
export async function trackBatch(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = TrackBatchSchema.parse(req.body);

    const eventsWithContext = validated.events.map((event) => ({
      userId,
      ...event,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    }));

    await eventTrackingService.trackBatch(eventsWithContext);

    res.status(202).json({ message: `${validated.events.length} events tracked` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Track batch error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
}

/**
 * Get user events
 */
export async function getUserEvents(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventType, limit, offset, startDate, endDate } = req.query;

    const events = await eventTrackingService.getUserEvents(userId, {
      eventType: eventType as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ data: events });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
}

/**
 * Get event counts by type
 */
export async function getEventCounts(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;

    const counts = await eventTrackingService.getEventCounts(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({ data: counts });
  } catch (error) {
    console.error('Get event counts error:', error);
    res.status(500).json({ error: 'Failed to get event counts' });
  }
}

/**
 * Get active session
 */
export async function getActiveSession(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await eventTrackingService.getActiveSession(userId);

    res.json({ data: session });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
}

/**
 * End user session
 */
export async function endSession(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await eventTrackingService.endSession(userId);

    res.json({ message: 'Session ended' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
}

/**
 * Get session history
 */
export async function getSessionHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset } = req.query;

    const sessions = await eventTrackingService.getSessionHistory(
      userId,
      limit ? parseInt(limit as string, 10) : undefined,
      offset ? parseInt(offset as string, 10) : undefined
    );

    res.json({ data: sessions });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Failed to get session history' });
  }
}
