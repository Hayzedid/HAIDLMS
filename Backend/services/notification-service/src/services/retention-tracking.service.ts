import pool from '../db/pool';

/**
 * Retention Tracking Service
 * Calculates retention scores, detects cramming, tracks streaks
 * Implements Ebbinghaus forgetting curve principles
 */

export interface RetentionMetrics {
  userId: string;
  retentionScore: number; // 0-100
  currentStreak: number; // days
  longestStreak: number; // days
  totalReviews: number;
  onTimeReviews: number;
  lateReviews: number;
  missedReviews: number;
  averageQuality: number; // 0-5
  isCramming: boolean;
  crammingScore: number; // 0-100
  lastActivityDate?: Date;
}

export interface ReviewSession {
  date: Date;
  reviewCount: number;
  averageQuality: number;
  timeSpentMinutes: number;
}

export class RetentionTrackingService {
  /**
   * Calculate comprehensive retention metrics for a user
   */
  async getRetentionMetrics(userId: string): Promise<RetentionMetrics> {
    try {
      // Get all schedules for user
      const schedulesResult = await pool.query(
        `SELECT * FROM spaced_repetition_schedule WHERE user_id = $1`,
        [userId]
      );

      const schedules = schedulesResult.rows;

      if (schedules.length === 0) {
        return this.getEmptyMetrics(userId);
      }

      // Calculate review statistics
      const reviewStats = this.calculateReviewStats(schedules);

      // Calculate retention score (weighted by quality and timeliness)
      const retentionScore = this.calculateRetentionScore(reviewStats, schedules);

      // Calculate streak (consecutive days with reviews)
      const streakData = await this.calculateStreaks(userId);

      // Detect cramming behavior
      const crammingData = await this.detectCramming(userId);

      return {
        userId,
        retentionScore: Math.round(retentionScore * 100) / 100,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalReviews: reviewStats.total,
        onTimeReviews: reviewStats.onTime,
        lateReviews: reviewStats.late,
        missedReviews: reviewStats.missed,
        averageQuality: reviewStats.averageQuality,
        isCramming: crammingData.isCramming,
        crammingScore: crammingData.score,
        lastActivityDate: streakData.lastActivityDate,
      };
    } catch (error) {
      console.error('[retention-tracking] Failed to get metrics:', error);
      return this.getEmptyMetrics(userId);
    }
  }

  /**
   * Calculate review statistics from schedules
   */
  private calculateReviewStats(schedules: any[]): {
    total: number;
    onTime: number;
    late: number;
    missed: number;
    averageQuality: number;
  } {
    let total = 0;
    let onTime = 0;
    let late = 0;
    let missed = 0;
    let totalQuality = 0;
    let qualityCount = 0;

    for (const schedule of schedules) {
      const reviewCount = schedule.review_count || 0;
      total += reviewCount;

      const qualityHistory = schedule.quality_history || [];

      for (const review of qualityHistory) {
        qualityCount++;
        totalQuality += review.quality;

        // Check if review was on time
        // (In real implementation, compare review date with scheduled date)
        if (review.quality >= 3) {
          onTime++;
        } else if (review.quality >= 1) {
          late++;
        } else {
          missed++;
        }
      }
    }

    return {
      total,
      onTime,
      late,
      missed,
      averageQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
    };
  }

  /**
   * Calculate retention score (0-100)
   * Based on: quality, timeliness, consistency
   */
  private calculateRetentionScore(
    reviewStats: {
      total: number;
      onTime: number;
      late: number;
      missed: number;
      averageQuality: number;
    },
    schedules: any[]
  ): number {
    if (reviewStats.total === 0) {
      return 0;
    }

    // Quality score (40% weight) - based on average quality (0-5 scale)
    const qualityScore = (reviewStats.averageQuality / 5) * 40;

    // Timeliness score (30% weight) - based on on-time reviews
    const timelinessScore =
      (reviewStats.onTime / Math.max(1, reviewStats.total)) * 30;

    // Consistency score (30% weight) - based on active schedules
    const activeSchedules = schedules.filter((s) => s.is_active).length;
    const totalSchedules = schedules.length;
    const consistencyScore = (activeSchedules / Math.max(1, totalSchedules)) * 30;

    return qualityScore + timelinessScore + consistencyScore;
  }

  /**
   * Calculate current and longest streaks
   */
  private async calculateStreaks(
    userId: string
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate?: Date;
  }> {
    try {
      // Get all review dates from quality history
      const result = await pool.query(
        `SELECT quality_history, last_reviewed_at
         FROM spaced_repetition_schedule
         WHERE user_id = $1 AND review_count > 0
         ORDER BY last_reviewed_at DESC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      // Extract all review dates
      const reviewDates = new Set<string>();
      let lastActivityDate: Date | undefined;

      for (const row of result.rows) {
        const qualityHistory = row.quality_history || [];

        for (const review of qualityHistory) {
          const date = new Date(review.date);
          reviewDates.add(date.toISOString().split('T')[0]);

          if (!lastActivityDate || date > lastActivityDate) {
            lastActivityDate = date;
          }
        }
      }

      // Sort dates
      const sortedDates = Array.from(reviewDates).sort().reverse();

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Streak is valid if last activity was today or yesterday
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        let checkDate = new Date(sortedDates[0]);

        for (let i = 0; i < sortedDates.length; i++) {
          const dateStr = checkDate.toISOString().split('T')[0];

          if (sortedDates.includes(dateStr)) {
            currentStreak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = Math.round(
          (prevDate.getTime() - currDate.getTime()) / 86400000
        );

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        currentStreak,
        longestStreak,
        lastActivityDate,
      };
    } catch (error) {
      console.error('[retention-tracking] Failed to calculate streaks:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  /**
   * Detect cramming behavior
   * Cramming = burst of reviews in short time before deadline
   */
  private async detectCramming(
    userId: string
  ): Promise<{ isCramming: boolean; score: number }> {
    try {
      // Get reviews from last 7 days
      const result = await pool.query(
        `SELECT quality_history
         FROM spaced_repetition_schedule
         WHERE user_id = $1`,
        [userId]
      );

      // Count reviews per day in last 7 days
      const reviewsByDay: { [key: string]: number } = {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 86400000);
        return date.toISOString().split('T')[0];
      });

      for (const day of last7Days) {
        reviewsByDay[day] = 0;
      }

      for (const row of result.rows) {
        const qualityHistory = row.quality_history || [];

        for (const review of qualityHistory) {
          const date = new Date(review.date).toISOString().split('T')[0];
          if (reviewsByDay[date] !== undefined) {
            reviewsByDay[date]++;
          }
        }
      }

      // Calculate variance to detect bursts
      const counts = Object.values(reviewsByDay);
      const totalReviews = counts.reduce((sum, count) => sum + count, 0);

      if (totalReviews === 0) {
        return { isCramming: false, score: 0 };
      }

      const mean = totalReviews / counts.length;
      const variance =
        counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
        counts.length;
      const stdDev = Math.sqrt(variance);

      // High variance + recent burst = cramming
      const maxRecent = Math.max(counts[0], counts[1]); // Last 2 days
      const isCramming = stdDev > 2 && maxRecent > mean * 2;

      // Cramming score (0-100, higher = more cramming)
      const crammingScore = Math.min(
        100,
        ((maxRecent / Math.max(1, mean)) / 4) * 100
      );

      return {
        isCramming,
        score: Math.round(crammingScore),
      };
    } catch (error) {
      console.error('[retention-tracking] Failed to detect cramming:', error);
      return { isCramming: false, score: 0 };
    }
  }

  /**
   * Get review sessions grouped by date
   */
  async getReviewSessions(
    userId: string,
    days: number = 30
  ): Promise<ReviewSession[]> {
    try {
      const result = await pool.query(
        `SELECT quality_history
         FROM spaced_repetition_schedule
         WHERE user_id = $1`,
        [userId]
      );

      const sessionsByDate: { [key: string]: ReviewSession } = {};

      for (const row of result.rows) {
        const qualityHistory = row.quality_history || [];

        for (const review of qualityHistory) {
          const date = new Date(review.date);
          const dateKey = date.toISOString().split('T')[0];

          // Filter to last N days
          const daysAgo =
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          if (daysAgo > days) continue;

          if (!sessionsByDate[dateKey]) {
            sessionsByDate[dateKey] = {
              date,
              reviewCount: 0,
              averageQuality: 0,
              timeSpentMinutes: 0,
            };
          }

          sessionsByDate[dateKey].reviewCount++;
          sessionsByDate[dateKey].averageQuality += review.quality;
        }
      }

      // Calculate averages
      const sessions = Object.values(sessionsByDate);

      for (const session of sessions) {
        session.averageQuality /= session.reviewCount;
      }

      // Sort by date descending
      sessions.sort((a, b) => b.date.getTime() - a.date.getTime());

      return sessions;
    } catch (error) {
      console.error('[retention-tracking] Failed to get review sessions:', error);
      return [];
    }
  }

  /**
   * Get empty metrics template
   */
  private getEmptyMetrics(userId: string): RetentionMetrics {
    return {
      userId,
      retentionScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalReviews: 0,
      onTimeReviews: 0,
      lateReviews: 0,
      missedReviews: 0,
      averageQuality: 0,
      isCramming: false,
      crammingScore: 0,
    };
  }

  /**
   * Get learning health score (0-100)
   * Composite metric combining retention, consistency, and quality
   */
  async getLearningHealthScore(userId: string): Promise<{
    score: number;
    metrics: RetentionMetrics;
    recommendations: string[];
  }> {
    const metrics = await this.getRetentionMetrics(userId);

    // Learning health = retention score with penalties for negative behaviors
    let healthScore = metrics.retentionScore;

    // Penalty for cramming
    if (metrics.isCramming) {
      healthScore -= metrics.crammingScore * 0.2;
    }

    // Penalty for broken streak
    if (metrics.currentStreak === 0 && metrics.totalReviews > 5) {
      healthScore -= 10;
    }

    // Bonus for consistency
    if (metrics.currentStreak >= 7) {
      healthScore += 5;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics);

    return {
      score: Math.round(healthScore * 100) / 100,
      metrics,
      recommendations,
    };
  }

  /**
   * Generate personalized learning recommendations
   */
  private generateRecommendations(metrics: RetentionMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.isCramming) {
      recommendations.push(
        'Spread out your reviews more evenly to improve retention'
      );
    }

    if (metrics.currentStreak === 0 && metrics.totalReviews > 0) {
      recommendations.push('Start a new streak today to stay consistent');
    }

    if (metrics.averageQuality < 3) {
      recommendations.push(
        'Review content more thoroughly before marking as understood'
      );
    }

    if (metrics.onTimeReviews < metrics.totalReviews * 0.7) {
      recommendations.push('Try to complete reviews on their scheduled dates');
    }

    if (metrics.currentStreak >= 30) {
      recommendations.push('Amazing consistency! Keep up the great work 🎉');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the good work! Your learning is on track.');
    }

    return recommendations;
  }
}

export const retentionTrackingService = new RetentionTrackingService();
