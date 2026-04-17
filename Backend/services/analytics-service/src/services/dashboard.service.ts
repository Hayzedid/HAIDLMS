import { pool } from '../db/pool';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

/**
 * Dashboard Aggregation Service
 * Prepare dashboard data efficiently for different user roles
 */
class DashboardService {
  /**
   * Get student dashboard data
   */
  async getStudentDashboard(userId: string): Promise<any> {
    // Get user analytics
    const userAnalyticsResult = await pool.query(
      `SELECT * FROM user_analytics WHERE user_id = $1`,
      [userId]
    );

    const userAnalytics = userAnalyticsResult.rows[0] || {
      engagement_score: 0,
      health_score: 50,
      total_time_minutes: 0,
      courses_enrolled: 0,
      courses_completed: 0,
      lessons_completed: 0,
      streak_days: 0,
    };

    // Get active courses
    const activeCoursesResult = await pool.query(
      `SELECT
         ulm.*,
         CASE
           WHEN ulm.progress_percentage >= 100 THEN 'completed'
           WHEN ulm.last_activity_at >= NOW() - INTERVAL '7 days' THEN 'active'
           ELSE 'inactive'
         END as status
       FROM user_learning_metrics ulm
       WHERE ulm.user_id = $1
       ORDER BY ulm.last_activity_at DESC NULLS LAST
       LIMIT 10`,
      [userId]
    );

    // Get recent activity (last 7 days)
    const recentActivityResult = await pool.query(
      `SELECT
         event_type,
         course_id,
         lesson_id,
         created_at,
         properties
       FROM events
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Get learning streak calendar (last 30 days)
    const streakResult = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(DISTINCT event_type) as activity_count,
         SUM(CASE WHEN event_type = 'lesson_complete' THEN 1 ELSE 0 END) as lessons_completed
       FROM events
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    // Get upcoming assessments/deadlines
    const upcomingResult = await pool.query(
      `SELECT DISTINCT
         properties->>'assessmentId' as assessment_id,
         properties->>'dueDate' as due_date,
         course_id
       FROM events
       WHERE user_id = $1
         AND event_type = 'assessment_start'
         AND (properties->>'dueDate')::TIMESTAMP > NOW()
       ORDER BY (properties->>'dueDate')::TIMESTAMP ASC
       LIMIT 5`,
      [userId]
    );

    // Get achievements/milestones
    const achievements = [];
    if (userAnalytics.lessons_completed >= 10) {
      achievements.push({ type: 'lessons', milestone: 10, unlocked: true });
    }
    if (userAnalytics.lessons_completed >= 50) {
      achievements.push({ type: 'lessons', milestone: 50, unlocked: true });
    }
    if (userAnalytics.courses_completed >= 1) {
      achievements.push({ type: 'courses', milestone: 1, unlocked: true });
    }
    if (userAnalytics.streak_days >= 7) {
      achievements.push({ type: 'streak', milestone: 7, unlocked: true });
    }

    // Get time spent by course (pie chart data)
    const timeByCoursesResult = await pool.query(
      `SELECT
         course_id,
         time_spent_minutes
       FROM user_learning_metrics
       WHERE user_id = $1
         AND time_spent_minutes > 0
       ORDER BY time_spent_minutes DESC
       LIMIT 5`,
      [userId]
    );

    // Get weekly activity trend (last 8 weeks)
    const weeklyTrendResult = await pool.query(
      `SELECT
         DATE_TRUNC('week', created_at) as week,
         COUNT(*) as event_count,
         COUNT(DISTINCT lesson_id) FILTER (WHERE event_type = 'lesson_complete') as lessons_completed
       FROM events
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '8 weeks'
       GROUP BY week
       ORDER BY week ASC`,
      [userId]
    );

    return {
      overview: {
        engagementScore: userAnalytics.engagement_score,
        healthScore: userAnalytics.health_score,
        totalTimeMinutes: userAnalytics.total_time_minutes,
        coursesEnrolled: userAnalytics.courses_enrolled,
        coursesCompleted: userAnalytics.courses_completed,
        lessonsCompleted: userAnalytics.lessons_completed,
        streakDays: userAnalytics.streak_days,
        longestStreak: userAnalytics.longest_streak_days,
      },
      activeCourses: activeCoursesResult.rows,
      recentActivity: recentActivityResult.rows,
      streakCalendar: streakResult.rows,
      upcomingDeadlines: upcomingResult.rows,
      achievements,
      timeDistribution: timeByCoursesResult.rows,
      weeklyTrend: weeklyTrendResult.rows,
    };
  }

  /**
   * Get instructor dashboard data
   */
  async getInstructorDashboard(instructorId: string): Promise<any> {
    // Get instructor analytics
    const instructorAnalyticsResult = await pool.query(
      `SELECT * FROM instructor_analytics WHERE instructor_id = $1`,
      [instructorId]
    );

    const instructorAnalytics = instructorAnalyticsResult.rows[0] || {
      total_courses: 0,
      total_students: 0,
      avg_course_rating: 0,
      avg_completion_rate: 0,
    };

    // Get course performance
    const coursesResult = await pool.query(
      `SELECT
         ca.course_id,
         ca.total_enrollments,
         ca.active_learners,
         ca.completion_rate,
         ca.avg_engagement_score,
         ca.avg_assessment_score,
         ca.avg_rating,
         ca.dropout_rate
       FROM course_analytics ca
       WHERE ca.course_id IN (
         SELECT DISTINCT course_id FROM events WHERE user_id = $1
       )
       ORDER BY ca.total_enrollments DESC`,
      [instructorId]
    );

    // Get student engagement summary
    const engagementResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ulm.engagement_score >= 70) as highly_engaged,
         COUNT(*) FILTER (WHERE ulm.engagement_score >= 40 AND ulm.engagement_score < 70) as moderately_engaged,
         COUNT(*) FILTER (WHERE ulm.engagement_score < 40) as low_engaged,
         COUNT(*) FILTER (WHERE ulm.at_risk = true) as at_risk_students
       FROM user_learning_metrics ulm
       WHERE ulm.course_id IN (
         SELECT DISTINCT course_id FROM events WHERE user_id = $1
       )`,
      [instructorId]
    );

    // Get struggling students across all courses
    const strugglingResult = await pool.query(
      `SELECT
         ulm.user_id,
         ulm.course_id,
         ulm.progress_percentage,
         ulm.engagement_score,
         ulm.avg_assessment_score,
         ulm.predicted_success_rate,
         ulm.last_activity_at
       FROM user_learning_metrics ulm
       WHERE ulm.course_id IN (
         SELECT DISTINCT course_id FROM events WHERE user_id = $1
       )
         AND (ulm.at_risk = true OR ulm.predicted_success_rate < 50)
       ORDER BY ulm.predicted_success_rate ASC
       LIMIT 20`,
      [instructorId]
    );

    // Get recent completions
    const recentCompletionsResult = await pool.query(
      `SELECT
         e.user_id,
         e.course_id,
         e.lesson_id,
         e.created_at
       FROM events e
       WHERE e.event_type IN ('lesson_complete', 'course_complete', 'assessment_complete')
         AND e.course_id IN (
           SELECT DISTINCT course_id FROM events WHERE user_id = $1
         )
         AND e.created_at >= NOW() - INTERVAL '7 days'
       ORDER BY e.created_at DESC
       LIMIT 20`,
      [instructorId]
    );

    // Get enrollment trend (last 12 weeks)
    const enrollmentTrendResult = await pool.query(
      `SELECT
         DATE_TRUNC('week', created_at) as week,
         COUNT(DISTINCT user_id) as new_enrollments
       FROM events
       WHERE event_type = 'course_enroll'
         AND course_id IN (
           SELECT DISTINCT course_id FROM events WHERE user_id = $1
         )
         AND created_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY week
       ORDER BY week ASC`,
      [instructorId]
    );

    // Get popular lessons
    const popularLessonsResult = await pool.query(
      `SELECT
         lesson_id,
         course_id,
         COUNT(*) as views,
         COUNT(DISTINCT user_id) as unique_viewers
       FROM events
       WHERE event_type = 'lesson_view'
         AND course_id IN (
           SELECT DISTINCT course_id FROM events WHERE user_id = $1
         )
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY lesson_id, course_id
       ORDER BY views DESC
       LIMIT 10`,
      [instructorId]
    );

    return {
      overview: {
        totalCourses: instructorAnalytics.total_courses,
        totalStudents: instructorAnalytics.total_students,
        activeStudents: instructorAnalytics.active_students,
        avgCourseRating: instructorAnalytics.avg_course_rating,
        avgCompletionRate: instructorAnalytics.avg_completion_rate,
      },
      courses: coursesResult.rows,
      studentEngagement: engagementResult.rows[0],
      strugglingStudents: strugglingResult.rows,
      recentCompletions: recentCompletionsResult.rows,
      enrollmentTrend: enrollmentTrendResult.rows,
      popularLessons: popularLessonsResult.rows,
    };
  }

  /**
   * Get admin dashboard data
   */
  async getAdminDashboard(): Promise<any> {
    // Get platform analytics
    const platformResult = await pool.query(
      `SELECT * FROM platform_analytics WHERE id = 1`
    );

    const platform = platformResult.rows[0] || {};

    // Get user growth (last 30 days)
    const userGrowthResult = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(DISTINCT user_id) as new_users
       FROM events
       WHERE event_type = 'login'
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY date
       ORDER BY date ASC`
    );

    // Get daily active users (last 30 days)
    const dauResult = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(DISTINCT user_id) as active_users
       FROM events
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY date
       ORDER BY date ASC`
    );

    // Get top courses by enrollment
    const topCoursesResult = await pool.query(
      `SELECT * FROM mv_top_courses LIMIT 10`
    );

    // Get active users summary
    const activeUsersResult = await pool.query(
      `SELECT
         COUNT(*) as total_active,
         AVG(engagement_score) as avg_engagement,
         AVG(health_score) as avg_health,
         SUM(time_30d_minutes) as total_time_30d
       FROM mv_active_users_30d`
    );

    // Get at-risk users count
    const atRiskResult = await pool.query(
      `SELECT COUNT(*) as count FROM mv_users_at_risk`
    );

    // Get course statistics
    const courseStatsResult = await pool.query(
      `SELECT
         COUNT(*) as total_courses,
         AVG(completion_rate) as avg_completion_rate,
         AVG(avg_engagement_score) as avg_engagement,
         SUM(total_enrollments) as total_enrollments,
         SUM(completed_count) as total_completions
       FROM course_analytics`
    );

    // Get recent signups
    const recentSignupsResult = await pool.query(
      `SELECT DISTINCT ON (user_id)
         user_id,
         created_at
       FROM events
       WHERE event_type = 'login'
       ORDER BY user_id, created_at ASC
       LIMIT 20`
    );

    // Get system health metrics
    const systemHealthResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
         AVG(engagement_score) FILTER (WHERE engagement_score > 0) as avg_engagement,
         COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as users_24h
       FROM learning_sessions, user_analytics
       WHERE learning_sessions.created_at >= NOW() - INTERVAL '1 hour'`
    );

    // Get performance metrics
    const performanceResult = await pool.query(
      `SELECT
         AVG(page_load_time) as avg_page_load,
         MAX(page_load_time) as max_page_load,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY page_load_time) as p95_page_load
       FROM events
       WHERE page_load_time IS NOT NULL
         AND created_at >= NOW() - INTERVAL '24 hours'`
    );

    // Get error rate
    const errorRateResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'error') as errors,
         COUNT(*) as total_events,
         (COUNT(*) FILTER (WHERE event_type = 'error')::DECIMAL / NULLIF(COUNT(*), 0)) * 100 as error_rate
       FROM events
       WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );

    return {
      overview: {
        totalUsers: platform.total_users,
        activeUsersDaily: platform.active_users_daily,
        activeUsersWeekly: platform.active_users_weekly,
        activeUsersMonthly: platform.active_users_monthly,
        totalCourses: platform.total_courses,
        totalEnrollments: platform.total_enrollments,
        totalCompletions: platform.total_completions,
        avgEngagementScore: platform.avg_platform_engagement_score,
        totalLearningHours: platform.total_learning_hours,
      },
      growth: {
        userGrowth: userGrowthResult.rows,
        dailyActiveUsers: dauResult.rows,
      },
      topCourses: topCoursesResult.rows,
      activeUsers: {
        total: activeUsersResult.rows[0]?.total_active || 0,
        avgEngagement: activeUsersResult.rows[0]?.avg_engagement || 0,
        avgHealth: activeUsersResult.rows[0]?.avg_health || 0,
        totalTime30d: activeUsersResult.rows[0]?.total_time_30d || 0,
      },
      atRiskUsers: atRiskResult.rows[0]?.count || 0,
      courseStats: courseStatsResult.rows[0],
      recentSignups: recentSignupsResult.rows,
      systemHealth: {
        activeSessions: systemHealthResult.rows[0]?.active_sessions || 0,
        avgEngagement: systemHealthResult.rows[0]?.avg_engagement || 0,
        users24h: systemHealthResult.rows[0]?.users_24h || 0,
      },
      performance: {
        avgPageLoad: performanceResult.rows[0]?.avg_page_load || 0,
        maxPageLoad: performanceResult.rows[0]?.max_page_load || 0,
        p95PageLoad: performanceResult.rows[0]?.p95_page_load || 0,
      },
      errorRate: errorRateResult.rows[0],
    };
  }

  /**
   * Get time series data for a metric
   */
  async getTimeSeriesData(
    metric: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    let dateFormat: string;
    let truncFunction: string;

    switch (granularity) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00';
        truncFunction = 'hour';
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        truncFunction = 'week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        truncFunction = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        truncFunction = 'day';
    }

    let query = '';

    switch (metric) {
      case 'active_users':
        query = `
          SELECT
            TO_CHAR(DATE_TRUNC('${truncFunction}', created_at), '${dateFormat}') as period,
            COUNT(DISTINCT user_id) as value
          FROM events
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'total_events':
        query = `
          SELECT
            TO_CHAR(DATE_TRUNC('${truncFunction}', created_at), '${dateFormat}') as period,
            COUNT(*) as value
          FROM events
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'lesson_completions':
        query = `
          SELECT
            TO_CHAR(DATE_TRUNC('${truncFunction}', created_at), '${dateFormat}') as period,
            COUNT(*) as value
          FROM events
          WHERE created_at >= $1 AND created_at <= $2
            AND event_type = 'lesson_complete'
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'course_enrollments':
        query = `
          SELECT
            TO_CHAR(DATE_TRUNC('${truncFunction}', created_at), '${dateFormat}') as period,
            COUNT(*) as value
          FROM events
          WHERE created_at >= $1 AND created_at <= $2
            AND event_type = 'course_enroll'
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      case 'learning_time':
        query = `
          SELECT
            TO_CHAR(DATE_TRUNC('${truncFunction}', start_time), '${dateFormat}') as period,
            SUM(duration_seconds) / 60 as value
          FROM learning_sessions
          WHERE start_time >= $1 AND start_time <= $2
            AND status IN ('completed', 'abandoned')
          GROUP BY period
          ORDER BY period ASC
        `;
        break;

      default:
        throw new Error(`Unknown metric: ${metric}`);
    }

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Get comparison data (current period vs previous period)
   */
  async getComparisonData(days = 30): Promise<any> {
    const currentStart = subDays(new Date(), days);
    const previousStart = subDays(new Date(), days * 2);
    const previousEnd = currentStart;

    const result = await pool.query(
      `SELECT
         -- Current period
         COUNT(DISTINCT user_id) FILTER (WHERE created_at >= $1) as current_active_users,
         COUNT(*) FILTER (WHERE created_at >= $1) as current_events,
         COUNT(*) FILTER (WHERE created_at >= $1 AND event_type = 'lesson_complete') as current_lessons,
         COUNT(*) FILTER (WHERE created_at >= $1 AND event_type = 'course_enroll') as current_enrollments,

         -- Previous period
         COUNT(DISTINCT user_id) FILTER (WHERE created_at >= $2 AND created_at < $3) as previous_active_users,
         COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $3) as previous_events,
         COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $3 AND event_type = 'lesson_complete') as previous_lessons,
         COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $3 AND event_type = 'course_enroll') as previous_enrollments
       FROM events`,
      [currentStart, previousStart, previousEnd]
    );

    const data = result.rows[0];

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      activeUsers: {
        current: parseInt(data.current_active_users, 10),
        previous: parseInt(data.previous_active_users, 10),
        change: calculateChange(
          parseInt(data.current_active_users, 10),
          parseInt(data.previous_active_users, 10)
        ),
      },
      events: {
        current: parseInt(data.current_events, 10),
        previous: parseInt(data.previous_events, 10),
        change: calculateChange(
          parseInt(data.current_events, 10),
          parseInt(data.previous_events, 10)
        ),
      },
      lessonCompletions: {
        current: parseInt(data.current_lessons, 10),
        previous: parseInt(data.previous_lessons, 10),
        change: calculateChange(
          parseInt(data.current_lessons, 10),
          parseInt(data.previous_lessons, 10)
        ),
      },
      enrollments: {
        current: parseInt(data.current_enrollments, 10),
        previous: parseInt(data.previous_enrollments, 10),
        change: calculateChange(
          parseInt(data.current_enrollments, 10),
          parseInt(data.previous_enrollments, 10)
        ),
      },
    };
  }
}

export const dashboardService = new DashboardService();
