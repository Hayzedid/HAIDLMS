import { pool } from '../db/pool';
import { metricsService } from './metrics.service';

/**
 * Learning Analytics Service
 * Course-specific analytics and learning insights
 */
class LearningAnalyticsService {
  /**
   * Update user learning metrics for a course
   */
  async updateUserLearningMetrics(userId: string, courseId: string): Promise<void> {
    try {
      // Get course structure (total lessons, modules)
      const structureResult = await pool.query(
        `SELECT
           COUNT(DISTINCT lesson_id) as total_lessons,
           COUNT(DISTINCT module_id) as total_modules
         FROM events
         WHERE course_id = $1
         GROUP BY course_id`,
        [courseId]
      );

      const totalLessons = structureResult.rows[0]?.total_lessons || 0;
      const totalModules = structureResult.rows[0]?.total_modules || 0;

      // Get user progress
      const progressResult = await pool.query(
        `SELECT
           COUNT(DISTINCT lesson_id) FILTER (WHERE event_type = 'lesson_complete') as lessons_completed,
           COUNT(DISTINCT module_id) FILTER (WHERE event_type = 'module_complete') as modules_completed,
           SUM(CASE WHEN session_id IS NOT NULL THEN 1 ELSE 0 END) as events_in_sessions,
           MAX(created_at) as last_activity
         FROM events
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      const progress = progressResult.rows[0];
      const lessonsCompleted = parseInt(progress.lessons_completed || '0', 10);
      const modulesCompleted = parseInt(progress.modules_completed || '0', 10);

      // Calculate progress percentage
      const progressPercentage = totalLessons > 0
        ? (lessonsCompleted / totalLessons) * 100
        : 0;

      // Get time spent
      const timeResult = await pool.query(
        `SELECT
           SUM(duration_seconds) / 60 as total_minutes,
           AVG(duration_seconds) / 60 as avg_session_minutes,
           COUNT(*) as session_count
         FROM learning_sessions
         WHERE user_id = $1 AND course_id = $2
           AND status IN ('completed', 'abandoned')`,
        [userId, courseId]
      );

      const timeSpentMinutes = parseFloat(timeResult.rows[0].total_minutes || '0');
      const avgSessionMinutes = parseFloat(timeResult.rows[0].avg_session_minutes || '0');
      const sessionCount = parseInt(timeResult.rows[0].session_count || '0', 10);

      // Get assessment metrics
      const assessmentResult = await pool.query(
        `SELECT
           COUNT(*) as attempts,
           COUNT(*) FILTER (WHERE (properties->>'passed')::BOOLEAN = true) as passed,
           AVG((properties->>'score')::NUMERIC) as avg_score,
           MAX((properties->>'score')::NUMERIC) as best_score
         FROM events
         WHERE user_id = $1 AND course_id = $2
           AND event_type = 'assessment_complete'
           AND properties->>'score' IS NOT NULL`,
        [userId, courseId]
      );

      const assessments = assessmentResult.rows[0];
      const assessmentsAttempted = parseInt(assessments.attempts || '0', 10);
      const assessmentsPassed = parseInt(assessments.passed || '0', 10);
      const avgAssessmentScore = parseFloat(assessments.avg_score || '0');
      const bestAssessmentScore = parseFloat(assessments.best_score || '0');

      // Calculate engagement score
      const engagementScore = await metricsService.calculateUserEngagementScore(userId);

      // Calculate days active
      const daysActiveResult = await pool.query(
        `SELECT COUNT(DISTINCT DATE(created_at)) as days_active
         FROM events
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      const daysActive = parseInt(daysActiveResult.rows[0].days_active || '0', 10);

      // Calculate lessons per week
      const enrollmentResult = await pool.query(
        `SELECT MIN(created_at) as enrollment_date
         FROM events
         WHERE user_id = $1 AND course_id = $2 AND event_type = 'course_enroll'`,
        [userId, courseId]
      );

      let lessonsPerWeek = 0;
      let estimatedCompletionDate = null;

      if (enrollmentResult.rows.length > 0) {
        const enrollmentDate = new Date(enrollmentResult.rows[0].enrollment_date);
        const weeksEnrolled = Math.max(1, (Date.now() - enrollmentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        lessonsPerWeek = lessonsCompleted / weeksEnrolled;

        // Estimate completion date
        if (lessonsPerWeek > 0 && progressPercentage < 100) {
          const lessonsRemaining = totalLessons - lessonsCompleted;
          const weeksRemaining = lessonsRemaining / lessonsPerWeek;
          estimatedCompletionDate = new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000);
        }
      }

      // Determine if user is at risk
      const atRisk = this.determineAtRisk({
        progressPercentage,
        engagementScore,
        avgAssessmentScore,
        daysActive,
        lessonsPerWeek,
      });

      // Predict success rate (simple heuristic)
      const predictedSuccessRate = this.predictSuccessRate({
        progressPercentage,
        engagementScore,
        avgAssessmentScore,
        lessonsPerWeek,
      });

      // Upsert user learning metrics
      await pool.query(
        `INSERT INTO user_learning_metrics (
          user_id, course_id, progress_percentage, lessons_completed, total_lessons,
          modules_completed, total_modules, time_spent_minutes, avg_session_duration_minutes,
          last_activity_at, assessments_attempted, assessments_passed, avg_assessment_score,
          best_assessment_score, engagement_score, days_active, lessons_per_week,
          estimated_completion_date, predicted_success_rate, at_risk
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (user_id, course_id) DO UPDATE SET
          progress_percentage = $3,
          lessons_completed = $4,
          total_lessons = $5,
          modules_completed = $6,
          total_modules = $7,
          time_spent_minutes = $8,
          avg_session_duration_minutes = $9,
          last_activity_at = $10,
          assessments_attempted = $11,
          assessments_passed = $12,
          avg_assessment_score = $13,
          best_assessment_score = $14,
          engagement_score = $15,
          days_active = $16,
          lessons_per_week = $17,
          estimated_completion_date = $18,
          predicted_success_rate = $19,
          at_risk = $20,
          updated_at = NOW()`,
        [
          userId, courseId, progressPercentage, lessonsCompleted, totalLessons,
          modulesCompleted, totalModules, timeSpentMinutes, avgSessionMinutes,
          progress.last_activity, assessmentsAttempted, assessmentsPassed,
          avgAssessmentScore, bestAssessmentScore, engagementScore, daysActive,
          lessonsPerWeek, estimatedCompletionDate, predictedSuccessRate, atRisk,
        ]
      );
    } catch (error) {
      console.error('Failed to update user learning metrics:', error);
      throw error;
    }
  }

  /**
   * Determine if a user is at risk of not completing
   */
  private determineAtRisk(metrics: {
    progressPercentage: number;
    engagementScore: number;
    avgAssessmentScore: number;
    daysActive: number;
    lessonsPerWeek: number;
  }): boolean {
    const { progressPercentage, engagementScore, avgAssessmentScore, daysActive, lessonsPerWeek } = metrics;

    // At risk if:
    // - Low engagement score (< 30)
    // - Low assessment scores (< 50)
    // - Slow progress (< 1 lesson per week and enrolled for > 2 weeks)
    // - Low activity (< 3 days active in a month)

    if (engagementScore < 30) return true;
    if (avgAssessmentScore > 0 && avgAssessmentScore < 50) return true;
    if (lessonsPerWeek < 1 && daysActive > 14) return true;
    if (daysActive < 3 && progressPercentage < 10) return true;

    return false;
  }

  /**
   * Predict success rate (probability of completing the course)
   */
  private predictSuccessRate(metrics: {
    progressPercentage: number;
    engagementScore: number;
    avgAssessmentScore: number;
    lessonsPerWeek: number;
  }): number {
    const { progressPercentage, engagementScore, avgAssessmentScore, lessonsPerWeek } = metrics;

    // Simple weighted formula
    let successRate = 0;

    // Progress (30%)
    successRate += (progressPercentage / 100) * 30;

    // Engagement (30%)
    successRate += (engagementScore / 100) * 30;

    // Performance (20%)
    if (avgAssessmentScore > 0) {
      successRate += (avgAssessmentScore / 100) * 20;
    } else {
      successRate += 10; // Neutral if no assessments yet
    }

    // Velocity (20%)
    if (lessonsPerWeek >= 2) {
      successRate += 20;
    } else if (lessonsPerWeek >= 1) {
      successRate += 15;
    } else if (lessonsPerWeek >= 0.5) {
      successRate += 10;
    }

    return Math.min(100, Math.max(0, successRate));
  }

  /**
   * Get learning insights for a user in a course
   */
  async getLearningInsights(userId: string, courseId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_learning_metrics
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const metrics = result.rows[0];

    // Generate insights based on metrics
    const insights = [];

    if (metrics.at_risk) {
      insights.push({
        type: 'warning',
        title: 'At Risk',
        message: 'You may need additional support to complete this course.',
        suggestions: [
          'Review difficult concepts',
          'Increase study frequency',
          'Join study groups',
          'Contact instructor for help',
        ],
      });
    }

    if (metrics.engagement_score < 40) {
      insights.push({
        type: 'info',
        title: 'Low Engagement',
        message: 'Your engagement with this course is below average.',
        suggestions: [
          'Set a regular study schedule',
          'Take notes while learning',
          'Participate in discussions',
        ],
      });
    }

    if (metrics.avg_assessment_score > 0 && metrics.avg_assessment_score < 60) {
      insights.push({
        type: 'warning',
        title: 'Assessment Performance',
        message: 'Your assessment scores suggest you may benefit from review.',
        suggestions: [
          'Review previous lessons',
          'Practice with additional exercises',
          'Study prerequisite material',
        ],
      });
    }

    if (metrics.lessons_per_week < 1 && metrics.progress_percentage < 50) {
      insights.push({
        type: 'info',
        title: 'Slow Progress',
        message: 'Consider increasing your study pace to maintain momentum.',
        suggestions: [
          'Dedicate specific time blocks for learning',
          'Break lessons into smaller chunks',
          'Set weekly goals',
        ],
      });
    }

    if (metrics.predicted_success_rate >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Progress!',
        message: 'You\'re on track to successfully complete this course.',
        suggestions: [
          'Maintain your current pace',
          'Help other students in discussions',
          'Consider advanced topics',
        ],
      });
    }

    return {
      metrics,
      insights,
      estimatedCompletionDate: metrics.estimated_completion_date,
      predictedSuccessRate: metrics.predicted_success_rate,
    };
  }

  /**
   * Update lesson analytics
   */
  async updateLessonAnalytics(lessonId: string, courseId: string): Promise<void> {
    try {
      // Get lesson engagement metrics
      const result = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE event_type = 'lesson_view') as total_views,
           COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'lesson_view') as unique_viewers,
           COUNT(*) FILTER (WHERE event_type = 'lesson_complete') as total_completions,
           AVG(EXTRACT(EPOCH FROM (
             (SELECT MAX(created_at) FROM events e2
              WHERE e2.user_id = events.user_id
                AND e2.lesson_id = events.lesson_id
                AND e2.event_type = 'lesson_complete')
             -
             (SELECT MIN(created_at) FROM events e3
              WHERE e3.user_id = events.user_id
                AND e3.lesson_id = events.lesson_id
                AND e3.event_type = 'lesson_start')
           )) / 60) as avg_time_minutes,
           AVG((properties->>'videoCompletionRate')::NUMERIC) as avg_video_completion,
           AVG((properties->>'rewatchCount')::NUMERIC) as avg_rewatch_count
         FROM events
         WHERE lesson_id = $1`,
        [lessonId]
      );

      const metrics = result.rows[0];
      const totalViews = parseInt(metrics.total_views || '0', 10);
      const uniqueViewers = parseInt(metrics.unique_viewers || '0', 10);
      const totalCompletions = parseInt(metrics.total_completions || '0', 10);
      const completionRate = uniqueViewers > 0 ? (totalCompletions / uniqueViewers) * 100 : 0;

      // Calculate dropout (viewed but didn't complete)
      const dropouts = uniqueViewers - totalCompletions;
      const dropoutRate = uniqueViewers > 0 ? (dropouts / uniqueViewers) * 100 : 0;

      await pool.query(
        `INSERT INTO lesson_analytics (
          lesson_id, course_id, total_views, unique_viewers, total_completions,
          completion_rate, avg_time_spent_minutes, dropout_count, dropout_rate,
          avg_video_completion_rate, avg_rewatch_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (lesson_id) DO UPDATE SET
          total_views = $3,
          unique_viewers = $4,
          total_completions = $5,
          completion_rate = $6,
          avg_time_spent_minutes = $7,
          dropout_count = $8,
          dropout_rate = $9,
          avg_video_completion_rate = $10,
          avg_rewatch_count = $11,
          updated_at = NOW()`,
        [
          lessonId, courseId, totalViews, uniqueViewers, totalCompletions,
          completionRate, parseFloat(metrics.avg_time_minutes || '0'), dropouts,
          dropoutRate, parseFloat(metrics.avg_video_completion || '0'),
          parseFloat(metrics.avg_rewatch_count || '0'),
        ]
      );
    } catch (error) {
      console.error('Failed to update lesson analytics:', error);
    }
  }

  /**
   * Get drop-off points for a course
   */
  async getCourseDropOffPoints(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         la.lesson_id,
         la.dropout_rate,
         la.completion_rate,
         la.total_views,
         la.unique_viewers
       FROM lesson_analytics la
       WHERE la.course_id = $1
       ORDER BY la.dropout_rate DESC
       LIMIT 10`,
      [courseId]
    );

    return result.rows;
  }

  /**
   * Get struggling students for a course
   */
  async getStrugglingStudents(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         ulm.user_id,
         ulm.progress_percentage,
         ulm.engagement_score,
         ulm.avg_assessment_score,
         ulm.predicted_success_rate,
         ulm.last_activity_at,
         ulm.at_risk
       FROM user_learning_metrics ulm
       WHERE ulm.course_id = $1
         AND (ulm.at_risk = true OR ulm.predicted_success_rate < 50)
       ORDER BY ulm.predicted_success_rate ASC, ulm.engagement_score ASC
       LIMIT 50`,
      [courseId]
    );

    return result.rows;
  }

  /**
   * Get top performers for a course
   */
  async getTopPerformers(courseId: string, limit = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         ulm.user_id,
         ulm.progress_percentage,
         ulm.engagement_score,
         ulm.avg_assessment_score,
         ulm.lessons_per_week,
         ulm.time_spent_minutes
       FROM user_learning_metrics ulm
       WHERE ulm.course_id = $1
       ORDER BY ulm.engagement_score DESC, ulm.avg_assessment_score DESC
       LIMIT $2`,
      [courseId, limit]
    );

    return result.rows;
  }

  /**
   * Get learning path recommendations
   */
  async getLearningPathRecommendations(userId: string, courseId: string): Promise<any[]> {
    // Get weak areas based on assessment performance
    const weakAreasResult = await pool.query(
      `SELECT
         lesson_id,
         AVG((properties->>'score')::NUMERIC) as avg_score,
         COUNT(*) as attempts
       FROM events
       WHERE user_id = $1
         AND course_id = $2
         AND event_type = 'assessment_complete'
         AND properties->>'score' IS NOT NULL
       GROUP BY lesson_id
       HAVING AVG((properties->>'score')::NUMERIC) < 70
       ORDER BY avg_score ASC
       LIMIT 5`,
      [userId, courseId]
    );

    const recommendations = weakAreasResult.rows.map((row) => ({
      type: 'review',
      lessonId: row.lesson_id,
      reason: `Average score: ${parseFloat(row.avg_score).toFixed(1)}%`,
      priority: row.avg_score < 50 ? 'high' : 'medium',
    }));

    // Get incomplete lessons
    const incompleteResult = await pool.query(
      `SELECT DISTINCT lesson_id
       FROM events
       WHERE user_id = $1
         AND course_id = $2
         AND event_type = 'lesson_view'
         AND lesson_id NOT IN (
           SELECT lesson_id
           FROM events
           WHERE user_id = $1
             AND course_id = $2
             AND event_type = 'lesson_complete'
         )
       LIMIT 3`,
      [userId, courseId]
    );

    incompleteResult.rows.forEach((row) => {
      recommendations.push({
        type: 'complete',
        lessonId: row.lesson_id,
        reason: 'Lesson started but not completed',
        priority: 'medium',
      });
    });

    return recommendations;
  }
}

export const learningAnalyticsService = new LearningAnalyticsService();
