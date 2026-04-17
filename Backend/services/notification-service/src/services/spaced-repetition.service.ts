import pool from '../db/pool';
import { scheduleSpacedRepetition, cancelSpacedRepetition } from '../queues/notification.queue';

/**
 * SM-2 Algorithm for Spaced Repetition
 * Reference: https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
 *
 * Quality scale (0-5):
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout
 */

export interface SpacedRepetitionSchedule {
  id: string;
  userId: string;
  contentId: string;
  contentType: string;
  easinessFactor: number;
  repetitionNumber: number;
  intervalDays: number;
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  reviewCount: number;
  qualityHistory: Array<{
    date: string;
    quality: number;
    interval: number;
  }>;
  isActive: boolean;
  pausedUntil?: Date;
}

export interface ReviewResponse {
  quality: number; // 0-5
  timeSpentSeconds?: number;
}

export class SpacedRepetitionService {
  /**
   * Initialize spaced repetition schedule for new content
   */
  async initializeSchedule(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<SpacedRepetitionSchedule> {
    try {
      // Check if schedule already exists
      const existing = await pool.query(
        `SELECT * FROM spaced_repetition_schedule
         WHERE user_id = $1 AND content_id = $2 AND content_type = $3`,
        [userId, contentId, contentType]
      );

      if (existing.rows.length > 0) {
        return this.mapToSchedule(existing.rows[0]);
      }

      // Create new schedule
      const result = await pool.query(
        `INSERT INTO spaced_repetition_schedule (
          user_id, content_id, content_type,
          easiness_factor, repetition_number, interval_days,
          next_review_at, quality_history
        )
        VALUES ($1, $2, $3, 2.5, 0, 1, NOW() + INTERVAL '1 day', '[]'::jsonb)
        RETURNING *`,
        [userId, contentId, contentType]
      );

      const schedule = this.mapToSchedule(result.rows[0]);

      // Schedule first review notification
      await this.scheduleReviewNotification(schedule);

      console.log(`[spaced-rep] Schedule initialized for user ${userId}, content ${contentId}`);

      return schedule;
    } catch (error) {
      console.error('[spaced-rep] Failed to initialize schedule:', error);
      throw error;
    }
  }

  /**
   * Record review response and calculate next interval
   */
  async recordReview(
    scheduleId: string,
    response: ReviewResponse
  ): Promise<SpacedRepetitionSchedule> {
    try {
      const { quality } = response;

      // Validate quality (0-5)
      if (quality < 0 || quality > 5) {
        throw new Error('Quality must be between 0 and 5');
      }

      // Get current schedule
      const result = await pool.query(
        `SELECT * FROM spaced_repetition_schedule WHERE id = $1`,
        [scheduleId]
      );

      if (result.rows.length === 0) {
        throw new Error('Schedule not found');
      }

      const schedule = this.mapToSchedule(result.rows[0]);

      // Calculate new values using SM-2 algorithm
      const { easinessFactor, repetitionNumber, intervalDays } = this.calculateSM2(
        schedule.easinessFactor,
        schedule.repetitionNumber,
        schedule.intervalDays,
        quality
      );

      // Calculate next review date
      const nextReviewAt = new Date();
      nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

      // Update quality history
      const qualityHistory = [
        ...schedule.qualityHistory,
        {
          date: new Date().toISOString(),
          quality,
          interval: intervalDays,
        },
      ];

      // Update schedule in database
      const updateResult = await pool.query(
        `UPDATE spaced_repetition_schedule
         SET easiness_factor = $1,
             repetition_number = $2,
             interval_days = $3,
             last_reviewed_at = NOW(),
             next_review_at = $4,
             review_count = review_count + 1,
             quality_history = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [easinessFactor, repetitionNumber, intervalDays, nextReviewAt, JSON.stringify(qualityHistory), scheduleId]
      );

      const updatedSchedule = this.mapToSchedule(updateResult.rows[0]);

      // Cancel previous notification
      await cancelSpacedRepetition(scheduleId);

      // Schedule next review notification
      await this.scheduleReviewNotification(updatedSchedule);

      console.log(
        `[spaced-rep] Review recorded: quality=${quality}, nextInterval=${intervalDays} days, nextReview=${nextReviewAt.toISOString()}`
      );

      return updatedSchedule;
    } catch (error) {
      console.error('[spaced-rep] Failed to record review:', error);
      throw error;
    }
  }

  /**
   * SM-2 Algorithm implementation
   */
  private calculateSM2(
    currentEF: number,
    currentN: number,
    currentI: number,
    quality: number
  ): {
    easinessFactor: number;
    repetitionNumber: number;
    intervalDays: number;
  } {
    let easinessFactor = currentEF;
    let repetitionNumber = currentN;
    let intervalDays = currentI;

    // If quality < 3, restart from the beginning
    if (quality < 3) {
      repetitionNumber = 0;
      intervalDays = 1;
    } else {
      // Calculate new E-Factor
      easinessFactor = Math.max(
        1.3,
        easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      // Increment repetition number
      repetitionNumber += 1;

      // Calculate new interval
      if (repetitionNumber === 1) {
        intervalDays = 1;
      } else if (repetitionNumber === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(currentI * easinessFactor);
      }
    }

    return {
      easinessFactor: Math.round(easinessFactor * 100) / 100, // Round to 2 decimal places
      repetitionNumber,
      intervalDays,
    };
  }

  /**
   * Get schedule for a user and content
   */
  async getSchedule(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<SpacedRepetitionSchedule | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM spaced_repetition_schedule
         WHERE user_id = $1 AND content_id = $2 AND content_type = $3`,
        [userId, contentId, contentType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToSchedule(result.rows[0]);
    } catch (error) {
      console.error('[spaced-rep] Failed to get schedule:', error);
      return null;
    }
  }

  /**
   * Get all due reviews for a user
   */
  async getDueReviews(userId: string): Promise<SpacedRepetitionSchedule[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM spaced_repetition_schedule
         WHERE user_id = $1
           AND is_active = true
           AND next_review_at <= NOW()
           AND (paused_until IS NULL OR paused_until <= NOW())
         ORDER BY next_review_at ASC`,
        [userId]
      );

      return result.rows.map(this.mapToSchedule);
    } catch (error) {
      console.error('[spaced-rep] Failed to get due reviews:', error);
      return [];
    }
  }

  /**
   * Get upcoming reviews for a user
   */
  async getUpcomingReviews(
    userId: string,
    days: number = 7
  ): Promise<SpacedRepetitionSchedule[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM spaced_repetition_schedule
         WHERE user_id = $1
           AND is_active = true
           AND next_review_at > NOW()
           AND next_review_at <= NOW() + INTERVAL '${days} days'
           AND (paused_until IS NULL OR paused_until <= NOW())
         ORDER BY next_review_at ASC`,
        [userId]
      );

      return result.rows.map(this.mapToSchedule);
    } catch (error) {
      console.error('[spaced-rep] Failed to get upcoming reviews:', error);
      return [];
    }
  }

  /**
   * Pause schedule (e.g., during vacation)
   */
  async pauseSchedule(scheduleId: string, pauseUntil: Date): Promise<void> {
    try {
      await pool.query(
        `UPDATE spaced_repetition_schedule
         SET paused_until = $1, updated_at = NOW()
         WHERE id = $2`,
        [pauseUntil, scheduleId]
      );

      // Cancel scheduled notification
      await cancelSpacedRepetition(scheduleId);

      console.log(`[spaced-rep] Schedule ${scheduleId} paused until ${pauseUntil.toISOString()}`);
    } catch (error) {
      console.error('[spaced-rep] Failed to pause schedule:', error);
      throw error;
    }
  }

  /**
   * Resume schedule
   */
  async resumeSchedule(scheduleId: string): Promise<void> {
    try {
      const result = await pool.query(
        `UPDATE spaced_repetition_schedule
         SET paused_until = NULL, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [scheduleId]
      );

      if (result.rows.length > 0) {
        const schedule = this.mapToSchedule(result.rows[0]);
        await this.scheduleReviewNotification(schedule);
      }

      console.log(`[spaced-rep] Schedule ${scheduleId} resumed`);
    } catch (error) {
      console.error('[spaced-rep] Failed to resume schedule:', error);
      throw error;
    }
  }

  /**
   * Deactivate schedule
   */
  async deactivateSchedule(scheduleId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE spaced_repetition_schedule
         SET is_active = false, updated_at = NOW()
         WHERE id = $1`,
        [scheduleId]
      );

      // Cancel scheduled notification
      await cancelSpacedRepetition(scheduleId);

      console.log(`[spaced-rep] Schedule ${scheduleId} deactivated`);
    } catch (error) {
      console.error('[spaced-rep] Failed to deactivate schedule:', error);
      throw error;
    }
  }

  /**
   * Schedule review notification in queue
   */
  private async scheduleReviewNotification(schedule: SpacedRepetitionSchedule): Promise<void> {
    try {
      await scheduleSpacedRepetition(
        {
          userId: schedule.userId,
          contentId: schedule.contentId,
          contentType: schedule.contentType,
          scheduleId: schedule.id,
        },
        schedule.nextReviewAt
      );

      console.log(
        `[spaced-rep] Review notification scheduled for ${schedule.nextReviewAt.toISOString()}`
      );
    } catch (error) {
      console.error('[spaced-rep] Failed to schedule notification:', error);
    }
  }

  /**
   * Map database row to SpacedRepetitionSchedule
   */
  private mapToSchedule(row: any): SpacedRepetitionSchedule {
    return {
      id: row.id,
      userId: row.user_id,
      contentId: row.content_id,
      contentType: row.content_type,
      easinessFactor: parseFloat(row.easiness_factor),
      repetitionNumber: row.repetition_number,
      intervalDays: row.interval_days,
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: new Date(row.next_review_at),
      reviewCount: row.review_count,
      qualityHistory: row.quality_history || [],
      isActive: row.is_active,
      pausedUntil: row.paused_until,
    };
  }

  /**
   * Get schedule statistics for a user
   */
  async getScheduleStats(userId: string): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    dueToday: number;
    upcomingWeek: number;
    averageEF: number;
    totalReviews: number;
  }> {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) as total_schedules,
           COUNT(*) FILTER (WHERE is_active = true) as active_schedules,
           COUNT(*) FILTER (WHERE is_active = true AND next_review_at::date = CURRENT_DATE) as due_today,
           COUNT(*) FILTER (WHERE is_active = true AND next_review_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') as upcoming_week,
           AVG(easiness_factor) as avg_ef,
           SUM(review_count) as total_reviews
         FROM spaced_repetition_schedule
         WHERE user_id = $1`,
        [userId]
      );

      const row = result.rows[0];

      return {
        totalSchedules: parseInt(row.total_schedules) || 0,
        activeSchedules: parseInt(row.active_schedules) || 0,
        dueToday: parseInt(row.due_today) || 0,
        upcomingWeek: parseInt(row.upcoming_week) || 0,
        averageEF: parseFloat(row.avg_ef) || 2.5,
        totalReviews: parseInt(row.total_reviews) || 0,
      };
    } catch (error) {
      console.error('[spaced-rep] Failed to get schedule stats:', error);
      return {
        totalSchedules: 0,
        activeSchedules: 0,
        dueToday: 0,
        upcomingWeek: 0,
        averageEF: 2.5,
        totalReviews: 0,
      };
    }
  }
}

// Singleton instance
export const spacedRepetitionService = new SpacedRepetitionService();
