import pool from '../db/pool';

interface StudentActivity {
  userId: string;
  courseId?: string;
  activityType: string;
  activityTarget?: string;
  sessionId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  durationSeconds?: number;
  metadata?: any;
}

export class AnalyticsService {
  // ========================================
  // ACTIVITY TRACKING
  // ========================================

  async trackActivity(activity: StudentActivity): Promise<void> {
    const query = `
      INSERT INTO student_activities (
        user_id, course_id, activity_type, activity_target, session_id,
        device_type, browser, os, ip_address, duration_seconds, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const values = [
      activity.userId,
      activity.courseId,
      activity.activityType,
      activity.activityTarget,
      activity.sessionId,
      activity.deviceType,
      activity.browser,
      activity.os,
      activity.ipAddress,
      activity.durationSeconds || 0,
      activity.metadata ? JSON.stringify(activity.metadata) : null,
    ];

    await pool.query(query, values);
  }

  async getStudentActivities(
    userId: string,
    courseId?: string,
    limit: number = 100
  ): Promise<any[]> {
    let query = `
      SELECT * FROM student_activities
      WHERE user_id = $1
    `;

    const values: any[] = [userId];
    let paramCount = 2;

    if (courseId) {
      query += ` AND course_id = $${paramCount}`;
      values.push(courseId);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // COURSE ANALYTICS
  // ========================================

  async getCourseDashboard(courseId: string): Promise<any> {
    const query = 'SELECT * FROM course_dashboard WHERE course_id = $1';
    const result = await pool.query(query, [courseId]);
    return result.rows[0] || {};
  }

  async getCourseAnalytics(
    courseId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = `
      SELECT * FROM course_analytics
      WHERE course_id = $1
    `;

    const values: any[] = [courseId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getCoursePerformanceTrend(courseId: string, days: number = 30): Promise<any[]> {
    const query = 'SELECT * FROM get_course_performance_trend($1, $2)';
    const result = await pool.query(query, [courseId, days]);
    return result.rows;
  }

  async aggregateCourseAnalytics(courseId: string, date: Date = new Date()): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    const query = `
      INSERT INTO course_analytics (
        course_id, date, total_enrollments, new_enrollments, active_students,
        completed_students, avg_progress_percentage, completion_rate,
        avg_assessment_score
      )
      SELECT
        $1 AS course_id,
        $2::DATE AS date,
        COUNT(DISTINCT e.user_id) AS total_enrollments,
        COUNT(DISTINCT CASE WHEN e.enrolled_at::DATE = $2::DATE THEN e.user_id END) AS new_enrollments,
        COUNT(DISTINCT CASE WHEN e.last_accessed_at::DATE = $2::DATE THEN e.user_id END) AS active_students,
        COUNT(DISTINCT CASE WHEN e.completed = true THEN e.user_id END) AS completed_students,
        ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress_percentage,
        ROUND(
          COUNT(DISTINCT CASE WHEN e.completed = true THEN e.user_id END)::NUMERIC /
          NULLIF(COUNT(DISTINCT e.user_id), 0) * 100,
          2
        ) AS completion_rate,
        ROUND(AVG(e.final_score)::NUMERIC, 2) AS avg_assessment_score
      FROM enrollments e
      WHERE e.course_id = $1
        AND e.enrolled_at <= $2::DATE + INTERVAL '1 day'
      ON CONFLICT (course_id, date)
      DO UPDATE SET
        total_enrollments = EXCLUDED.total_enrollments,
        new_enrollments = EXCLUDED.new_enrollments,
        active_students = EXCLUDED.active_students,
        completed_students = EXCLUDED.completed_students,
        avg_progress_percentage = EXCLUDED.avg_progress_percentage,
        completion_rate = EXCLUDED.completion_rate,
        avg_assessment_score = EXCLUDED.avg_assessment_score,
        updated_at = NOW()
    `;

    await pool.query(query, [courseId, dateStr]);
  }

  // ========================================
  // STUDENT PERFORMANCE
  // ========================================

  async getStudentPerformance(userId: string, courseId: string): Promise<any> {
    const query = `
      SELECT * FROM student_performance
      WHERE user_id = $1 AND course_id = $2
      ORDER BY snapshot_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId, courseId]);
    return result.rows[0] || null;
  }

  async updateStudentPerformance(userId: string, courseId: string): Promise<void> {
    const query = `
      INSERT INTO student_performance (
        user_id, course_id, snapshot_date, overall_progress, lessons_completed,
        total_lessons, assessments_completed, avg_assessment_score,
        total_time_spent_minutes, forum_posts_count, badges_earned
      )
      SELECT
        $1 AS user_id,
        $2 AS course_id,
        CURRENT_DATE AS snapshot_date,
        COALESCE(e.progress, 0) AS overall_progress,
        COALESCE(
          (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = $1 AND lp.completed = true),
          0
        ) AS lessons_completed,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = $2) AS total_lessons,
        COALESCE(
          (SELECT COUNT(DISTINCT assessment_id) FROM assessment_submissions asub
           JOIN assessments a ON asub.assessment_id = a.id
           WHERE asub.user_id = $1 AND a.course_id = $2),
          0
        ) AS assessments_completed,
        COALESCE(e.final_score, 0) AS avg_assessment_score,
        COALESCE(
          (SELECT SUM(duration_seconds) / 60 FROM student_activities
           WHERE user_id = $1 AND course_id = $2),
          0
        ) AS total_time_spent_minutes,
        COALESCE(
          (SELECT COUNT(*) FROM discussion_threads dt
           JOIN forum_categories fc ON dt.category_id = fc.id
           WHERE dt.author_id = $1 AND fc.course_id = $2),
          0
        ) AS forum_posts_count,
        COALESCE(
          (SELECT COUNT(*) FROM badge_assertions ba
           WHERE ba.recipient_id = $1 AND ba.course_id = $2),
          0
        ) AS badges_earned
      FROM enrollments e
      WHERE e.user_id = $1 AND e.course_id = $2
      ON CONFLICT (user_id, course_id, snapshot_date)
      DO UPDATE SET
        overall_progress = EXCLUDED.overall_progress,
        lessons_completed = EXCLUDED.lessons_completed,
        assessments_completed = EXCLUDED.assessments_completed,
        avg_assessment_score = EXCLUDED.avg_assessment_score,
        total_time_spent_minutes = EXCLUDED.total_time_spent_minutes,
        forum_posts_count = EXCLUDED.forum_posts_count,
        badges_earned = EXCLUDED.badges_earned,
        updated_at = NOW()
    `;

    await pool.query(query, [userId, courseId]);
  }

  async getAtRiskStudents(courseId: string): Promise<any[]> {
    const query = 'SELECT * FROM detect_at_risk_students($1)';
    const result = await pool.query(query, [courseId]);
    return result.rows;
  }

  async markStudentsAtRisk(courseId: string): Promise<void> {
    const atRiskStudents = await this.getAtRiskStudents(courseId);

    for (const student of atRiskStudents) {
      await pool.query(
        `UPDATE student_performance
         SET is_at_risk = true, risk_factors = $3, updated_at = NOW()
         WHERE user_id = $1 AND course_id = $2 AND snapshot_date = CURRENT_DATE`,
        [student.user_id, courseId, student.risk_factors]
      );
    }
  }

  // ========================================
  // LESSON ANALYTICS
  // ========================================

  async getLessonAnalytics(lessonId: string, days: number = 30): Promise<any[]> {
    const query = `
      SELECT * FROM lesson_analytics
      WHERE lesson_id = $1 AND date >= CURRENT_DATE - $2
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [lessonId, days]);
    return result.rows;
  }

  async aggregateLessonAnalytics(lessonId: string, date: Date = new Date()): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    const query = `
      INSERT INTO lesson_analytics (
        lesson_id, course_id, date, total_views, unique_viewers,
        avg_time_spent_seconds, completion_rate
      )
      SELECT
        $1 AS lesson_id,
        l.course_id,
        $2::DATE AS date,
        COUNT(*) AS total_views,
        COUNT(DISTINCT sa.user_id) AS unique_viewers,
        ROUND(AVG(sa.duration_seconds)) AS avg_time_spent_seconds,
        ROUND(
          COUNT(DISTINCT lp.user_id) FILTER (WHERE lp.completed = true)::NUMERIC /
          NULLIF(COUNT(DISTINCT sa.user_id), 0) * 100,
          2
        ) AS completion_rate
      FROM lessons l
      LEFT JOIN student_activities sa ON sa.activity_target = l.id::TEXT
        AND sa.activity_type = 'lesson_view'
        AND sa.created_at::DATE = $2::DATE
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
      WHERE l.id = $1
      GROUP BY l.id, l.course_id
      ON CONFLICT (lesson_id, date)
      DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_viewers = EXCLUDED.unique_viewers,
        avg_time_spent_seconds = EXCLUDED.avg_time_spent_seconds,
        completion_rate = EXCLUDED.completion_rate
    `;

    await pool.query(query, [lessonId, dateStr]);
  }

  // ========================================
  // ASSESSMENT ANALYTICS
  // ========================================

  async getAssessmentAnalytics(assessmentId: string, days: number = 30): Promise<any[]> {
    const query = `
      SELECT * FROM assessment_analytics
      WHERE assessment_id = $1 AND date >= CURRENT_DATE - $2
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [assessmentId, days]);
    return result.rows;
  }

  async aggregateAssessmentAnalytics(
    assessmentId: string,
    date: Date = new Date()
  ): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    const query = `
      INSERT INTO assessment_analytics (
        assessment_id, course_id, date, total_attempts, unique_students,
        avg_score, median_score, min_score, max_score
      )
      SELECT
        $1 AS assessment_id,
        a.course_id,
        $2::DATE AS date,
        COUNT(*) AS total_attempts,
        COUNT(DISTINCT asub.user_id) AS unique_students,
        ROUND(AVG(asub.score)::NUMERIC, 2) AS avg_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY asub.score) AS median_score,
        MIN(asub.score) AS min_score,
        MAX(asub.score) AS max_score
      FROM assessments a
      LEFT JOIN assessment_submissions asub ON asub.assessment_id = a.id
        AND asub.submitted_at::DATE = $2::DATE
      WHERE a.id = $1
      GROUP BY a.id, a.course_id
      ON CONFLICT (assessment_id, date)
      DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        unique_students = EXCLUDED.unique_students,
        avg_score = EXCLUDED.avg_score,
        median_score = EXCLUDED.median_score,
        min_score = EXCLUDED.min_score,
        max_score = EXCLUDED.max_score
    `;

    await pool.query(query, [assessmentId, dateStr]);
  }

  // ========================================
  // ENGAGEMENT METRICS
  // ========================================

  async getStudentEngagement(userId: string): Promise<any> {
    const query = 'SELECT * FROM student_engagement_summary WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  }

  async calculateEngagementScore(userId: string, courseId: string): Promise<number> {
    const query = 'SELECT calculate_engagement_score($1, $2) as score';
    const result = await pool.query(query, [userId, courseId]);
    return result.rows[0]?.score || 0;
  }

  async getEngagementTrend(courseId: string, days: number = 30): Promise<any[]> {
    const query = `
      SELECT
        date,
        active_students,
        total_lessons_viewed,
        total_videos_watched,
        total_assessments_attempted,
        total_forum_posts
      FROM course_analytics
      WHERE course_id = $1 AND date >= CURRENT_DATE - $2
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [courseId, days]);
    return result.rows;
  }

  // ========================================
  // LEARNING PATTERNS
  // ========================================

  async getLearningPatterns(userId: string): Promise<any> {
    const query = 'SELECT * FROM learning_patterns WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async analyzeLearningPatterns(userId: string): Promise<void> {
    // Analyze study times
    const studyTimesQuery = `
      WITH activity_times AS (
        SELECT
          EXTRACT(HOUR FROM created_at) AS hour,
          EXTRACT(DOW FROM created_at) AS dow
        FROM student_activities
        WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '90 days'
      )
      SELECT
        ARRAY_AGG(DISTINCT
          CASE
            WHEN hour >= 6 AND hour < 12 THEN 'morning'
            WHEN hour >= 12 AND hour < 17 THEN 'afternoon'
            WHEN hour >= 17 AND hour < 22 THEN 'evening'
            ELSE 'night'
          END
        ) AS preferred_times,
        ARRAY_AGG(DISTINCT
          CASE dow
            WHEN 0 THEN 'sunday'
            WHEN 1 THEN 'monday'
            WHEN 2 THEN 'tuesday'
            WHEN 3 THEN 'wednesday'
            WHEN 4 THEN 'thursday'
            WHEN 5 THEN 'friday'
            WHEN 6 THEN 'saturday'
          END
        ) AS preferred_days
      FROM activity_times
    `;

    const patternsResult = await pool.query(studyTimesQuery, [userId]);
    const patterns = patternsResult.rows[0];

    // Calculate session metrics
    const sessionQuery = `
      SELECT
        ROUND(AVG(duration_seconds) / 60) AS avg_session_length_minutes,
        ROUND(COUNT(DISTINCT DATE(created_at))::NUMERIC / 4, 2) AS sessions_per_week
      FROM student_activities
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '28 days'
    `;

    const sessionResult = await pool.query(sessionQuery, [userId]);
    const sessionMetrics = sessionResult.rows[0];

    // Insert or update learning patterns
    const upsertQuery = `
      INSERT INTO learning_patterns (
        user_id, preferred_study_times, preferred_days,
        avg_session_length_minutes, sessions_per_week, last_calculated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        preferred_study_times = EXCLUDED.preferred_study_times,
        preferred_days = EXCLUDED.preferred_days,
        avg_session_length_minutes = EXCLUDED.avg_session_length_minutes,
        sessions_per_week = EXCLUDED.sessions_per_week,
        last_calculated_at = NOW(),
        updated_at = NOW()
    `;

    await pool.query(upsertQuery, [
      userId,
      patterns.preferred_times || [],
      patterns.preferred_days || [],
      sessionMetrics.avg_session_length_minutes || 0,
      sessionMetrics.sessions_per_week || 0,
    ]);
  }

  // ========================================
  // RETENTION & CHURN
  // ========================================

  async getRetentionMetrics(courseId: string): Promise<any[]> {
    const query = `
      SELECT * FROM retention_metrics
      WHERE course_id = $1
      ORDER BY cohort_start_date DESC
    `;

    const result = await pool.query(query, [courseId]);
    return result.rows;
  }

  async calculateCohortRetention(
    courseId: string,
    cohortStartDate: Date,
    cohortEndDate: Date
  ): Promise<void> {
    const query = `
      WITH cohort AS (
        SELECT user_id, enrolled_at
        FROM enrollments
        WHERE course_id = $1
          AND enrolled_at >= $2
          AND enrolled_at < $3
      )
      INSERT INTO retention_metrics (
        course_id, cohort_start_date, cohort_end_date, cohort_size,
        retention_day_7, retention_day_30, retention_day_60, retention_day_90,
        completed_students, completion_rate
      )
      SELECT
        $1,
        $2,
        $3,
        COUNT(*) AS cohort_size,
        COUNT(*) FILTER (WHERE last_accessed_at >= enrolled_at + INTERVAL '7 days') AS retention_day_7,
        COUNT(*) FILTER (WHERE last_accessed_at >= enrolled_at + INTERVAL '30 days') AS retention_day_30,
        COUNT(*) FILTER (WHERE last_accessed_at >= enrolled_at + INTERVAL '60 days') AS retention_day_60,
        COUNT(*) FILTER (WHERE last_accessed_at >= enrolled_at + INTERVAL '90 days') AS retention_day_90,
        COUNT(*) FILTER (WHERE completed = true) AS completed_students,
        ROUND(
          COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*) * 100,
          2
        ) AS completion_rate
      FROM cohort c
      JOIN enrollments e ON c.user_id = e.user_id AND e.course_id = $1
    `;

    await pool.query(query, [courseId, cohortStartDate, cohortEndDate]);
  }

  // ========================================
  // REPORTING
  // ========================================

  async getInstructorDashboard(instructorId: string): Promise<any> {
    const query = `
      SELECT
        c.id AS course_id,
        c.title,
        COUNT(DISTINCT e.user_id) AS total_students,
        COUNT(DISTINCT CASE WHEN e.last_accessed_at > NOW() - INTERVAL '7 days' THEN e.user_id END) AS active_students,
        ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress,
        COUNT(DISTINCT CASE WHEN e.completed = true THEN e.user_id END) AS completed_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.instructor_id = $1
      GROUP BY c.id, c.title
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [instructorId]);
    return result.rows;
  }

  async exportAnalyticsData(courseId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const dashboard = await this.getCourseDashboard(courseId);
    const analytics = await this.getCourseAnalytics(courseId);
    const atRisk = await this.getAtRiskStudents(courseId);

    return {
      summary: dashboard,
      historicalData: analytics,
      atRiskStudents: atRisk,
      exportedAt: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
