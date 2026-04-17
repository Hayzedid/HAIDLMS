import { pool } from '../db/pool';
import { eventTrackingService } from './event-tracking.service';

/**
 * Session Manager Service
 * Handles automatic session timeouts and cleanup
 */
class SessionManagerService {
  private sessionTimeout: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
  }

  /**
   * Start the session manager (cleanup stale sessions)
   */
  start(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleSessions().catch(console.error);
    }, 5 * 60 * 1000);

    console.log(`✅ Session manager started (timeout: ${this.sessionTimeout} minutes)`);
  }

  /**
   * Stop the session manager
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up stale sessions (active but inactive for > timeout)
   */
  async cleanupStaleSessions(): Promise<number> {
    try {
      const result = await pool.query(
        `UPDATE learning_sessions
         SET status = 'abandoned',
             end_time = updated_at,
             duration_seconds = EXTRACT(EPOCH FROM (updated_at - start_time))::INTEGER
         WHERE status = 'active'
           AND updated_at < NOW() - INTERVAL '${this.sessionTimeout} minutes'
         RETURNING id, user_id`,
      );

      const abandoned = result.rows;

      if (abandoned.length > 0) {
        console.log(`🧹 Cleaned up ${abandoned.length} stale sessions`);

        // Update user analytics for each abandoned session
        for (const session of abandoned) {
          await this.updateUserAnalyticsForAbandonedSession(session.user_id, session.id);
        }
      }

      return abandoned.length;
    } catch (error) {
      console.error('Failed to cleanup stale sessions:', error);
      return 0;
    }
  }

  /**
   * Update user analytics when a session is abandoned
   */
  private async updateUserAnalyticsForAbandonedSession(
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const sessionResult = await pool.query(
        `SELECT duration_seconds, events_count
         FROM learning_sessions
         WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) return;

      const session = sessionResult.rows[0];
      const durationMinutes = Math.floor(session.duration_seconds / 60);

      await pool.query(
        `INSERT INTO user_analytics (
          user_id,
          total_time_minutes,
          total_sessions,
          total_events,
          last_active_at
        )
        VALUES ($1, $2, 1, $3, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          total_time_minutes = user_analytics.total_time_minutes + $2,
          total_sessions = user_analytics.total_sessions + 1,
          total_events = user_analytics.total_events + $3,
          updated_at = NOW()`,
        [userId, durationMinutes, session.events_count]
      );
    } catch (error) {
      console.error('Failed to update user analytics for abandoned session:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    completedToday: number;
    abandonedToday: number;
    avgDurationMinutes: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(end_time) = CURRENT_DATE) as completed_today,
        COUNT(*) FILTER (WHERE status = 'abandoned' AND DATE(end_time) = CURRENT_DATE) as abandoned_today,
        AVG(duration_seconds / 60) FILTER (WHERE status = 'completed' AND duration_seconds > 0) as avg_duration_minutes
      FROM learning_sessions
    `);

    const stats = result.rows[0];

    return {
      activeSessions: parseInt(stats.active_sessions || '0', 10),
      completedToday: parseInt(stats.completed_today || '0', 10),
      abandonedToday: parseInt(stats.abandoned_today || '0', 10),
      avgDurationMinutes: parseFloat(stats.avg_duration_minutes || '0'),
    };
  }

  /**
   * Force end all sessions for a user
   */
  async endAllUserSessions(userId: string): Promise<number> {
    try {
      const result = await pool.query(
        `UPDATE learning_sessions
         SET status = 'completed',
             end_time = NOW(),
             duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER
         WHERE user_id = $1 AND status = 'active'
         RETURNING id`,
        [userId]
      );

      return result.rows.length;
    } catch (error) {
      console.error('Failed to end user sessions:', error);
      return 0;
    }
  }

  /**
   * Get longest active sessions (potential stuck sessions)
   */
  async getLongActiveSessions(thresholdHours = 12): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         id,
         user_id,
         start_time,
         updated_at,
         EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER / 3600 as hours_active,
         events_count
       FROM learning_sessions
       WHERE status = 'active'
         AND start_time < NOW() - INTERVAL '${thresholdHours} hours'
       ORDER BY start_time ASC`,
    );

    return result.rows;
  }
}

export const sessionManagerService = new SessionManagerService();
