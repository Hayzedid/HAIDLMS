import { pool } from '../db/pool';
import {
  VideoWatchSession,
  VideoWatchEvent,
  CreateVideoSessionRequest,
  TrackVideoEventRequest,
  WatchEventType,
} from '../types';

/**
 * Video Accountability Service
 * Tracks video watching behavior, prevents cheating, and validates engagement
 */
class VideoAccountabilityService {
  private readonly WATCH_THRESHOLD = parseFloat(process.env.VIDEO_WATCH_THRESHOLD || '0.85');
  private readonly SEEK_RESTRICTION = process.env.VIDEO_SEEK_RESTRICTION === 'true';

  /**
   * Create new video watch session
   */
  async createSession(params: CreateVideoSessionRequest): Promise<VideoWatchSession> {
    const result = await pool.query(
      `INSERT INTO video_watch_sessions (
        user_id, course_id, lesson_id, video_url, video_duration
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [params.userId, params.courseId, params.lessonId, params.videoUrl, params.videoDuration]
    );

    return this.mapSession(result.rows[0]);
  }

  /**
   * Track video event
   */
  async trackEvent(params: TrackVideoEventRequest): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert event
      await client.query(
        `INSERT INTO video_watch_events (
          session_id, event_type, timestamp_ms, duration_ms,
          from_position, to_position, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          params.sessionId,
          params.eventType,
          params.timestampMs,
          params.durationMs,
          params.fromPosition,
          params.toPosition,
          JSON.stringify(params.metadata || {}),
        ]
      );

      // Update session statistics
      await this.updateSessionStats(client, params.sessionId, params.eventType);

      // Check for violations
      await this.checkViolations(client, params.sessionId, params);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update session statistics
   */
  private async updateSessionStats(client: any, sessionId: string, eventType: WatchEventType): Promise<void> {
    if (eventType === 'seek') {
      await client.query(
        'UPDATE video_watch_sessions SET seek_count = seek_count + 1 WHERE id = $1',
        [sessionId]
      );
    }

    if (eventType === 'tab_blur' || eventType === 'window_blur') {
      await client.query(
        'UPDATE video_watch_sessions SET tab_switch_count = tab_switch_count + 1 WHERE id = $1',
        [sessionId]
      );
    }
  }

  /**
   * Check for violations
   */
  private async checkViolations(client: any, sessionId: string, event: TrackVideoEventRequest): Promise<void> {
    const violations: any[] = [];

    // Check excessive seeking
    if (event.eventType === 'seek') {
      const result = await client.query(
        'SELECT seek_count FROM video_watch_sessions WHERE id = $1',
        [sessionId]
      );

      if (result.rows[0].seek_count > 10) {
        violations.push({
          type: 'excessive_seeking',
          count: result.rows[0].seek_count,
          timestamp: new Date(),
        });
      }

      // Check forward seeking (skipping)
      if (event.fromPosition && event.toPosition && event.toPosition > event.fromPosition + 5000) {
        violations.push({
          type: 'forward_seek',
          from: event.fromPosition,
          to: event.toPosition,
          skippedMs: event.toPosition - event.fromPosition,
          timestamp: new Date(),
        });
      }
    }

    // Check excessive tab switching
    if (event.eventType === 'tab_blur' || event.eventType === 'window_blur') {
      const result = await client.query(
        'SELECT tab_switch_count FROM video_watch_sessions WHERE id = $1',
        [sessionId]
      );

      if (result.rows[0].tab_switch_count > 5) {
        violations.push({
          type: 'excessive_tab_switching',
          count: result.rows[0].tab_switch_count,
          timestamp: new Date(),
        });
      }
    }

    // Save violations
    if (violations.length > 0) {
      await client.query(
        `UPDATE video_watch_sessions
         SET violations = violations || $1::jsonb,
             is_valid = CASE WHEN array_length(violations, 1) > 5 THEN false ELSE is_valid END
         WHERE id = $2`,
        [JSON.stringify(violations), sessionId]
      );
    }
  }

  /**
   * End video watch session
   */
  async endSession(sessionId: string): Promise<VideoWatchSession> {
    // Calculate total watch time from events
    const watchTimeResult = await pool.query(
      `SELECT SUM(duration_ms) / 1000 as total_seconds
       FROM video_watch_events
       WHERE session_id = $1 AND event_type = 'play'`,
      [sessionId]
    );

    const totalWatchTime = watchTimeResult.rows[0]?.total_seconds || 0;

    // Get video duration
    const sessionResult = await pool.query(
      'SELECT video_duration FROM video_watch_sessions WHERE id = $1',
      [sessionId]
    );

    const videoDuration = sessionResult.rows[0]?.video_duration || 1;

    // Calculate completion percentage
    const completionPercentage = Math.min(100, (totalWatchTime / videoDuration) * 100);
    const passedThreshold = completionPercentage >= this.WATCH_THRESHOLD * 100;

    // Update session
    const result = await pool.query(
      `UPDATE video_watch_sessions
       SET ended_at = NOW(),
           total_watch_time = $1,
           completion_percentage = $2,
           passed_threshold = $3
       WHERE id = $4
       RETURNING *`,
      [Math.round(totalWatchTime), completionPercentage.toFixed(2), passedThreshold, sessionId]
    );

    return this.mapSession(result.rows[0]);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<VideoWatchSession | null> {
    const result = await pool.query('SELECT * FROM video_watch_sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSession(result.rows[0]);
  }

  /**
   * Get user's video sessions
   */
  async getUserSessions(userId: string, lessonId?: string): Promise<VideoWatchSession[]> {
    let query = 'SELECT * FROM video_watch_sessions WHERE user_id = $1';
    const params: any[] = [userId];

    if (lessonId) {
      query += ' AND lesson_id = $2';
      params.push(lessonId);
    }

    query += ' ORDER BY started_at DESC';

    const result = await pool.query(query, params);
    return result.rows.map(this.mapSession);
  }

  /**
   * Get session events
   */
  async getSessionEvents(sessionId: string): Promise<VideoWatchEvent[]> {
    const result = await pool.query(
      `SELECT * FROM video_watch_events
       WHERE session_id = $1
       ORDER BY timestamp_ms ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      sessionId: row.session_id,
      eventType: row.event_type,
      timestampMs: row.timestamp_ms,
      clientTimestamp: row.client_timestamp,
      durationMs: row.duration_ms,
      fromPosition: row.from_position,
      toPosition: row.to_position,
      metadata: row.metadata,
    }));
  }

  /**
   * Create comprehension checkpoint
   */
  async createCheckpoint(params: {
    courseId: string;
    lessonId: string;
    videoTimestamp: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO comprehension_checkpoints (
        course_id, lesson_id, video_timestamp, question, options, correct_answer, explanation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.courseId,
        params.lessonId,
        params.videoTimestamp,
        params.question,
        JSON.stringify(params.options),
        params.correctAnswer,
        params.explanation,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get checkpoints for lesson
   */
  async getCheckpoints(lessonId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM comprehension_checkpoints WHERE lesson_id = $1 AND is_active = true ORDER BY video_timestamp ASC',
      [lessonId]
    );

    return result.rows;
  }

  /**
   * Submit checkpoint response
   */
  async submitCheckpointResponse(params: {
    checkpointId: string;
    sessionId: string;
    userId: string;
    selectedAnswer: string;
    timeTaken: number;
  }): Promise<any> {
    // Get correct answer
    const checkpointResult = await pool.query(
      'SELECT correct_answer FROM comprehension_checkpoints WHERE id = $1',
      [params.checkpointId]
    );

    const correctAnswer = checkpointResult.rows[0]?.correct_answer;
    const isCorrect = params.selectedAnswer === correctAnswer;
    const result = isCorrect ? 'correct' : 'incorrect';

    // Save response
    const responseResult = await pool.query(
      `INSERT INTO checkpoint_responses (
        checkpoint_id, session_id, user_id, selected_answer, result, time_taken
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [params.checkpointId, params.sessionId, params.userId, params.selectedAnswer, result, params.timeTaken]
    );

    return responseResult.rows[0];
  }

  /**
   * Get user's checkpoint responses
   */
  async getUserCheckpointResponses(userId: string, lessonId?: string): Promise<any[]> {
    let query = `
      SELECT cr.*, cp.question, cp.correct_answer, cp.lesson_id
      FROM checkpoint_responses cr
      JOIN comprehension_checkpoints cp ON cp.id = cr.checkpoint_id
      WHERE cr.user_id = $1
    `;
    const params: any[] = [userId];

    if (lessonId) {
      query += ' AND cp.lesson_id = $2';
      params.push(lessonId);
    }

    query += ' ORDER BY cr.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Map database row to VideoWatchSession
   */
  private mapSession(row: any): VideoWatchSession {
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      videoUrl: row.video_url,
      videoDuration: row.video_duration,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      totalWatchTime: row.total_watch_time,
      completionPercentage: parseFloat(row.completion_percentage),
      passedThreshold: row.passed_threshold,
      seekCount: row.seek_count,
      tabSwitchCount: row.tab_switch_count,
      violations: row.violations,
      isValid: row.is_valid,
    };
  }
}

export const videoAccountabilityService = new VideoAccountabilityService();
