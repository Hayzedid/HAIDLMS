import { pool } from '../db/pool';
import { subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

/**
 * Metrics Calculation Service
 * Computes various analytics metrics and scores
 */
class MetricsService {
  /**
   * Calculate engagement score for a user
   */
  async calculateUserEngagementScore(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT
         total_sessions,
         total_time_minutes,
         total_events,
         lessons_completed
       FROM user_analytics
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return 0;

    const { total_sessions, total_time_minutes, total_events, lessons_completed } = result.rows[0];

    // Use the database function for consistency
    const scoreResult = await pool.query(
      `SELECT calculate_engagement_score($1, $2, $3, $4) as score`,
      [total_sessions, total_time_minutes, total_events, lessons_completed]
    );

    return parseFloat(scoreResult.rows[0].score);
  }

  /**
   * Calculate health score for a user
   */
  async calculateUserHealthScore(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT
         engagement_score,
         completion_rate,
         streak_days,
         avg_assessment_score
       FROM user_analytics
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return 50; // Default health score

    const { engagement_score, completion_rate, streak_days, avg_assessment_score } = result.rows[0];

    // Use the database function
    const scoreResult = await pool.query(
      `SELECT calculate_health_score($1, $2, $3, $4) as score`,
      [engagement_score, completion_rate, streak_days, avg_assessment_score]
    );

    return parseFloat(scoreResult.rows[0].score);
  }

  /**
   * Calculate streak days for a user
   */
  async calculateStreakDays(userId: string): Promise<{ current: number; longest: number }> {
    // Get all distinct days the user was active
    const result = await pool.query(
      `SELECT DISTINCT DATE(created_at) as activity_date
       FROM events
       WHERE user_id = $1
       ORDER BY activity_date DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { current: 0, longest: 0 };
    }

    const activityDates = result.rows.map((row) => new Date(row.activity_date));
    const today = startOfDay(new Date());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let expectedDate = today;

    for (const date of activityDates) {
      const activityDate = startOfDay(date);
      const daysDiff = differenceInDays(expectedDate, activityDate);

      if (daysDiff === 0) {
        // Activity on expected date
        tempStreak++;
        if (expectedDate.getTime() === today.getTime() || differenceInDays(today, expectedDate) === 1) {
          currentStreak = tempStreak;
        }
        expectedDate = subDays(expectedDate, 1);
      } else if (daysDiff === 1) {
        // Continue streak
        tempStreak++;
        if (currentStreak === 0) {
          currentStreak = tempStreak;
        }
        expectedDate = subDays(expectedDate, 1);
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        expectedDate = subDays(activityDate, 1);
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // If last activity wasn't today or yesterday, current streak is 0
    const lastActivityDate = startOfDay(activityDates[0]);
    const daysSinceLastActivity = differenceInDays(today, lastActivityDate);
    if (daysSinceLastActivity > 1) {
      currentStreak = 0;
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Calculate completion rate for a user
   */
  async calculateCompletionRate(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT courses_enrolled, courses_completed
       FROM user_analytics
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0 || result.rows[0].courses_enrolled === 0) {
      return 0;
    }

    const { courses_enrolled, courses_completed } = result.rows[0];
    return (courses_completed / courses_enrolled) * 100;
  }

  /**
   * Calculate learning velocity (lessons per week)
   */
  async calculateLearningVelocity(userId: string, weeks = 4): Promise<number> {
    const startDate = subDays(new Date(), weeks * 7);

    const result = await pool.query(
      `SELECT COUNT(DISTINCT lesson_id) as lessons_count
       FROM events
       WHERE user_id = $1
         AND event_type = 'lesson_complete'
         AND created_at >= $2`,
      [userId, startDate]
    );

    const lessonsCount = parseInt(result.rows[0].lessons_count || '0', 10);
    return lessonsCount / weeks;
  }

  /**
   * Calculate course completion rate
   */
  async calculateCourseCompletionRate(courseId: string): Promise<number> {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'course_enroll') as enrolled,
         COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'course_complete') as completed
       FROM events
       WHERE course_id = $1`,
      [courseId]
    );

    const { enrolled, completed } = result.rows[0];
    if (parseInt(enrolled) === 0) return 0;

    return (parseInt(completed) / parseInt(enrolled)) * 100;
  }

  /**
   * Calculate average assessment score for a course
   */
  async calculateCourseAvgAssessmentScore(courseId: string): Promise<number> {
    const result = await pool.query(
      `SELECT AVG((properties->>'score')::NUMERIC) as avg_score
       FROM events
       WHERE course_id = $1
         AND event_type = 'assessment_complete'
         AND properties->>'score' IS NOT NULL`,
      [courseId]
    );

    return parseFloat(result.rows[0].avg_score || '0');
  }

  /**
   * Calculate dropout rate and point for a course
   */
  async calculateCourseDropoutAnalysis(courseId: string): Promise<{
    dropoutRate: number;
    avgDropoutPoint: number;
  }> {
    // Get total enrollments
    const enrollmentResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total
       FROM events
       WHERE course_id = $1 AND event_type = 'course_enroll'`,
      [courseId]
    );

    const totalEnrolled = parseInt(enrollmentResult.rows[0].total || '0', 10);
    if (totalEnrolled === 0) {
      return { dropoutRate: 0, avgDropoutPoint: 0 };
    }

    // Get completions
    const completionResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as completed
       FROM events
       WHERE course_id = $1 AND event_type = 'course_complete'`,
      [courseId]
    );

    const totalCompleted = parseInt(completionResult.rows[0].completed || '0', 10);
    const dropouts = totalEnrolled - totalCompleted;
    const dropoutRate = (dropouts / totalEnrolled) * 100;

    // Calculate average dropout point (based on last lesson accessed)
    const dropoutPointResult = await pool.query(
      `WITH course_progress AS (
         SELECT
           ulm.user_id,
           ulm.progress_percentage
         FROM user_learning_metrics ulm
         WHERE ulm.course_id = $1
           AND ulm.progress_percentage < 100
       )
       SELECT AVG(progress_percentage) as avg_dropout_point
       FROM course_progress`,
      [courseId]
    );

    const avgDropoutPoint = parseFloat(dropoutPointResult.rows[0].avg_dropout_point || '0');

    return { dropoutRate, avgDropoutPoint };
  }

  /**
   * Calculate time-based metrics for a user
   */
  async calculateTimeMetrics(
    userId: string,
    days = 30
  ): Promise<{
    totalMinutes: number;
    avgSessionMinutes: number;
    avgDailyMinutes: number;
    peakHour: number;
  }> {
    const startDate = subDays(new Date(), days);

    const result = await pool.query(
      `SELECT
         SUM(duration_seconds) / 60 as total_minutes,
         AVG(duration_seconds) / 60 as avg_session_minutes,
         COUNT(*) as session_count
       FROM learning_sessions
       WHERE user_id = $1
         AND start_time >= $2
         AND status IN ('completed', 'abandoned')`,
      [userId, startDate]
    );

    const totalMinutes = parseFloat(result.rows[0].total_minutes || '0');
    const avgSessionMinutes = parseFloat(result.rows[0].avg_session_minutes || '0');
    const avgDailyMinutes = totalMinutes / days;

    // Find peak hour
    const peakHourResult = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM start_time) as hour,
         COUNT(*) as session_count
       FROM learning_sessions
       WHERE user_id = $1
         AND start_time >= $2
       GROUP BY hour
       ORDER BY session_count DESC
       LIMIT 1`,
      [userId, startDate]
    );

    const peakHour = peakHourResult.rows.length > 0
      ? parseInt(peakHourResult.rows[0].hour, 10)
      : 0;

    return {
      totalMinutes,
      avgSessionMinutes,
      avgDailyMinutes,
      peakHour,
    };
  }

  /**
   * Calculate trend indicators (-1: declining, 0: stable, 1: improving)
   */
  async calculateTrends(userId: string): Promise<{
    engagementTrend: number;
    performanceTrend: number;
  }> {
    // Compare last 7 days vs previous 7 days
    const last7Days = subDays(new Date(), 7);
    const previous7Days = subDays(new Date(), 14);

    // Engagement trend (based on events and time)
    const engagementResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= $1) as recent_events,
         COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $1) as previous_events
       FROM events
       WHERE user_id = $3`,
      [last7Days, previous7Days, userId]
    );

    const recentEvents = parseInt(engagementResult.rows[0].recent_events || '0', 10);
    const previousEvents = parseInt(engagementResult.rows[0].previous_events || '0', 10);

    let engagementTrend = 0;
    if (recentEvents > previousEvents * 1.1) {
      engagementTrend = 1;
    } else if (recentEvents < previousEvents * 0.9) {
      engagementTrend = -1;
    }

    // Performance trend (based on assessment scores)
    const performanceResult = await pool.query(
      `SELECT
         AVG((properties->>'score')::NUMERIC) FILTER (WHERE created_at >= $1) as recent_score,
         AVG((properties->>'score')::NUMERIC) FILTER (WHERE created_at >= $2 AND created_at < $1) as previous_score
       FROM events
       WHERE user_id = $3
         AND event_type = 'assessment_complete'
         AND properties->>'score' IS NOT NULL`,
      [last7Days, previous7Days, userId]
    );

    const recentScore = parseFloat(performanceResult.rows[0].recent_score || '0');
    const previousScore = parseFloat(performanceResult.rows[0].previous_score || '0');

    let performanceTrend = 0;
    if (recentScore > previousScore + 5) {
      performanceTrend = 1;
    } else if (recentScore < previousScore - 5) {
      performanceTrend = -1;
    }

    return { engagementTrend, performanceTrend };
  }

  /**
   * Identify users at risk (low engagement, not progressing)
   */
  async identifyAtRiskUsers(thresholds: {
    healthScore?: number;
    engagementScore?: number;
    daysInactive?: number;
  } = {}): Promise<string[]> {
    const {
      healthScore = 40,
      engagementScore = 30,
      daysInactive = 7,
    } = thresholds;

    const inactiveDate = subDays(new Date(), daysInactive);

    const result = await pool.query(
      `SELECT user_id
       FROM user_analytics
       WHERE health_score < $1
          OR engagement_score < $2
          OR last_active_at < $3`,
      [healthScore, engagementScore, inactiveDate]
    );

    return result.rows.map((row) => row.user_id);
  }

  /**
   * Calculate predicted completion date for a course enrollment
   */
  async predictCompletionDate(userId: string, courseId: string): Promise<Date | null> {
    // Get current progress
    const progressResult = await pool.query(
      `SELECT progress_percentage, lessons_completed, total_lessons, created_at
       FROM user_learning_metrics
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (progressResult.rows.length === 0) return null;

    const { progress_percentage, lessons_completed, total_lessons, created_at } = progressResult.rows[0];

    if (progress_percentage >= 100) return new Date(); // Already completed

    // Calculate lessons per day
    const daysEnrolled = differenceInDays(new Date(), new Date(created_at));
    if (daysEnrolled === 0) return null; // Too early to predict

    const lessonsPerDay = lessons_completed / daysEnrolled;
    if (lessonsPerDay === 0) return null; // No progress

    const lessonsRemaining = total_lessons - lessons_completed;
    const daysToComplete = Math.ceil(lessonsRemaining / lessonsPerDay);

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysToComplete);

    return predictedDate;
  }

  /**
   * Calculate platform-wide retention rate
   */
  async calculateRetentionRate(days = 30): Promise<{
    dailyRetention: number;
    weeklyRetention: number;
    monthlyRetention: number;
  }> {
    const startDate = subDays(new Date(), days);

    const result = await pool.query(
      `WITH user_activity AS (
         SELECT
           user_id,
           COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as active_days_1d,
           COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as active_days_7d,
           COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as active_days_30d
         FROM events
         WHERE created_at >= $1
         GROUP BY user_id
       ),
       total_users AS (
         SELECT COUNT(DISTINCT user_id) as count
         FROM events
         WHERE created_at >= $1
       )
       SELECT
         COUNT(*) FILTER (WHERE active_days_1d > 0)::DECIMAL / (SELECT count FROM total_users) * 100 as daily_retention,
         COUNT(*) FILTER (WHERE active_days_7d >= 3)::DECIMAL / (SELECT count FROM total_users) * 100 as weekly_retention,
         COUNT(*) FILTER (WHERE active_days_30d >= 10)::DECIMAL / (SELECT count FROM total_users) * 100 as monthly_retention
       FROM user_activity`,
      [startDate]
    );

    return {
      dailyRetention: parseFloat(result.rows[0].daily_retention || '0'),
      weeklyRetention: parseFloat(result.rows[0].weekly_retention || '0'),
      monthlyRetention: parseFloat(result.rows[0].monthly_retention || '0'),
    };
  }
}

export const metricsService = new MetricsService();
