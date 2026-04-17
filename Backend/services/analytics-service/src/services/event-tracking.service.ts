import { pool } from '../db/pool';
import { createHash } from 'crypto';
import UAParser from 'ua-parser-js';

export interface TrackEventOptions {
  userId: string;
  eventType: string;
  courseId?: string;
  lessonId?: string;
  moduleId?: string;
  assessmentId?: string;
  properties?: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  pageUrl?: string;
  referrer?: string;
  pageLoadTime?: number;
}

export interface BatchEvent extends TrackEventOptions {
  timestamp: Date;
}

class EventTrackingService {
  private eventBatch: BatchEvent[] = [];
  private batchSize = parseInt(process.env.BATCH_SIZE || '100', 10);
  private batchInterval = parseInt(process.env.BATCH_INTERVAL_MS || '5000', 10);
  private batchTimer: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, string> = new Map(); // userId -> sessionId
  private sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;

  constructor() {
    this.startBatchTimer();
  }

  /**
   * Track a single event (will be batched)
   */
  async trackEvent(options: TrackEventOptions): Promise<void> {
    // Generate or use existing session ID
    const sessionId = options.sessionId || this.getOrCreateSession(options.userId);

    // Parse user agent if provided
    let parsedUA: any = {};
    if (options.userAgent) {
      const parser = new UAParser(options.userAgent);
      parsedUA = {
        browser: parser.getBrowser(),
        os: parser.getOS(),
        device: parser.getDevice(),
      };
    }

    // Add to batch
    const batchEvent: BatchEvent = {
      ...options,
      sessionId,
      timestamp: new Date(),
      properties: {
        ...options.properties,
        ...(options.userAgent ? { userAgentParsed: parsedUA } : {}),
      },
    };

    this.eventBatch.push(batchEvent);

    // Update session activity
    this.updateSessionActivity(options.userId, sessionId);

    // Flush if batch is full
    if (this.eventBatch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Track multiple events at once
   */
  async trackBatch(events: TrackEventOptions[]): Promise<void> {
    for (const event of events) {
      await this.trackEvent(event);
    }
  }

  /**
   * Get or create a session ID for a user
   */
  private getOrCreateSession(userId: string): string {
    const existingSession = this.activeSessions.get(userId);
    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const sessionId = this.generateSessionId(userId);
    this.activeSessions.set(userId, sessionId);

    // Create session in database
    this.createSessionInDB(userId, sessionId).catch(console.error);

    return sessionId;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const data = `${userId}-${timestamp}-${random}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Create a new learning session in the database
   */
  private async createSessionInDB(userId: string, sessionId: string): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO learning_sessions (id, user_id, status, start_time, events_count)
         VALUES ($1, $2, 'active', NOW(), 0)
         ON CONFLICT (id) DO NOTHING`,
        [sessionId, userId]
      );
    } catch (error) {
      console.error('Failed to create session in DB:', error);
    }
  }

  /**
   * Update session activity timestamp
   */
  private updateSessionActivity(userId: string, sessionId: string): void {
    // Update session in database (async, no await)
    this.updateSessionInDB(sessionId).catch(console.error);
  }

  /**
   * Update session in database
   */
  private async updateSessionInDB(sessionId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE learning_sessions
         SET updated_at = NOW(),
             events_count = events_count + 1
         WHERE id = $1 AND status = 'active'`,
        [sessionId]
      );
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  /**
   * End a user's session
   */
  async endSession(userId: string): Promise<void> {
    const sessionId = this.activeSessions.get(userId);
    if (!sessionId) return;

    try {
      // Calculate session metrics
      const result = await pool.query(
        `UPDATE learning_sessions
         SET status = 'completed',
             end_time = NOW(),
             duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
             engagement_score = CASE
               WHEN EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER > 0
               THEN LEAST(100, (events_count::DECIMAL / (EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER / 60)) * 10)
               ELSE 0
             END
         WHERE id = $1 AND status = 'active'
         RETURNING *`,
        [sessionId]
      );

      if (result.rows.length > 0) {
        const session = result.rows[0];

        // Update user analytics
        await this.updateUserAnalyticsFromSession(userId, session);
      }

      // Remove from active sessions
      this.activeSessions.delete(userId);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Update user analytics based on completed session
   */
  private async updateUserAnalyticsFromSession(userId: string, session: any): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_analytics (
          user_id,
          total_time_minutes,
          total_sessions,
          total_events,
          last_active_at
        )
        VALUES ($1, $2, 1, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
          total_time_minutes = user_analytics.total_time_minutes + $2,
          total_sessions = user_analytics.total_sessions + 1,
          total_events = user_analytics.total_events + $3,
          last_active_at = $4,
          updated_at = NOW()`,
        [
          userId,
          Math.floor(session.duration_seconds / 60),
          session.events_count,
          session.end_time,
        ]
      );
    } catch (error) {
      console.error('Failed to update user analytics:', error);
    }
  }

  /**
   * Flush the current batch to database
   */
  async flushBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return;

    const batch = [...this.eventBatch];
    this.eventBatch = [];

    try {
      // Build bulk insert query
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramCount = 0;

      for (const event of batch) {
        const params = [
          event.userId,
          event.eventType,
          event.courseId || null,
          event.lessonId || null,
          event.moduleId || null,
          event.assessmentId || null,
          JSON.stringify(event.properties || {}),
          event.sessionId || null,
          event.ipAddress || null,
          event.userAgent || null,
          event.pageUrl || null,
          event.referrer || null,
          event.pageLoadTime || null,
          event.timestamp,
        ];

        values.push(...params);
        const placeholder = `($${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7}, $${paramCount + 8}, $${paramCount + 9}, $${paramCount + 10}, $${paramCount + 11}, $${paramCount + 12}, $${paramCount + 13}, $${paramCount + 14})`;
        placeholders.push(placeholder);
        paramCount += 14;
      }

      await pool.query(
        `INSERT INTO events (
          user_id, event_type, course_id, lesson_id, module_id, assessment_id,
          properties, session_id, ip_address, user_agent, page_url, referrer,
          page_load_time, created_at
        ) VALUES ${placeholders.join(', ')}`,
        values
      );

      console.log(`✅ Flushed ${batch.length} events to database`);
    } catch (error) {
      console.error('Failed to flush event batch:', error);
      // Put failed events back in batch
      this.eventBatch.unshift(...batch);
    }
  }

  /**
   * Start the batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBatch().catch(console.error);
    }, this.batchInterval);
  }

  /**
   * Stop the batch timer and flush remaining events
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush remaining events
    await this.flushBatch();

    // End all active sessions
    for (const userId of this.activeSessions.keys()) {
      await this.endSession(userId);
    }
  }

  /**
   * Get events for a user
   */
  async getUserEvents(
    userId: string,
    options: {
      eventType?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<any[]> {
    const { eventType, limit = 100, offset = 0, startDate, endDate } = options;

    let query = `
      SELECT * FROM events
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 1;

    if (eventType) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(eventType);
    }

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get events for a course
   */
  async getCourseEvents(
    courseId: string,
    options: {
      eventType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    const { eventType, limit = 100, offset = 0 } = options;

    let query = `
      SELECT * FROM events
      WHERE course_id = $1
    `;
    const params: any[] = [courseId];

    if (eventType) {
      query += ` AND event_type = $2`;
      params.push(eventType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get event counts by type
   */
  async getEventCounts(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    let query = `
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY event_type`;

    const result = await pool.query(query, params);

    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.event_type] = parseInt(row.count, 10);
    }

    return counts;
  }

  /**
   * Get active session for user
   */
  async getActiveSession(userId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT * FROM learning_sessions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get session history for user
   */
  async getSessionHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM learning_sessions
       WHERE user_id = $1
       ORDER BY start_time DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }
}

// Singleton instance
export const eventTrackingService = new EventTrackingService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📊 Shutting down event tracking service...');
  await eventTrackingService.shutdown();
});

process.on('SIGINT', async () => {
  console.log('📊 Shutting down event tracking service...');
  await eventTrackingService.shutdown();
  process.exit(0);
});
