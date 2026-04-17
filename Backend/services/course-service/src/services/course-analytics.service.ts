import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RecordDropoutParams {
  userId: string;
  courseId: string;
  enrollmentId: string;
  progressPercentage: number;
  lastLessonId?: string;
  lastModuleId?: string;
  dropoutReason?: string;
  feedback?: string;
}

interface CreateCohortParams {
  courseId: string;
  cohortName: string;
  cohortStartDate: Date;
  cohortEndDate: Date;
}

// ============================================================================
// COURSE ANALYTICS SERVICE
// ============================================================================

export class CourseAnalyticsService {
  // ========================================
  // COURSE METRICS
  // ========================================

  async calculateCourseMetrics(courseId: string, date?: Date): Promise<void> {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    await pool.query(`SELECT calculate_course_metrics($1, $2)`, [courseId, dateStr]);
  }

  async getCourseMetrics(courseId: string, days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM course_metrics
      WHERE course_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
      ORDER BY date DESC`,
      [courseId, days]
    );

    return result.rows;
  }

  async getAllCoursesMetrics(date?: Date): Promise<any[]> {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT cm.*, c.title as course_title, c.instructor_id
      FROM course_metrics cm
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.date = $1
      ORDER BY cm.total_enrollments DESC`,
      [dateStr]
    );

    return result.rows;
  }

  // ========================================
  // ENROLLMENT TRENDS
  // ========================================

  async calculateEnrollmentTrends(courseId: string, weekStartDate?: Date): Promise<void> {
    const dateStr = weekStartDate
      ? weekStartDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Calculate metrics for the week
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE DATE(enrolled_at) BETWEEN $2 AND $2 + INTERVAL '6 days') as new_enrollments,
        COUNT(*) as total_enrollments,
        COUNT(*) FILTER (WHERE status = 'active') as active_enrollments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_enrollments,
        COUNT(*) FILTER (WHERE status = 'dropped') as dropped_enrollments
      FROM enrollments
      WHERE course_id = $1`,
      [courseId, dateStr]
    );

    const metrics = result.rows[0];

    // Get previous week for trend
    const prevWeekResult = await pool.query(
      `SELECT new_enrollments FROM enrollment_trends
      WHERE course_id = $1 AND week_start_date = $2 - INTERVAL '7 days'`,
      [courseId, dateStr]
    );

    let growthRate = 0;
    let trendDirection = 'stable';

    if (prevWeekResult.rows.length > 0) {
      const prevEnrollments = prevWeekResult.rows[0].new_enrollments;
      if (prevEnrollments > 0) {
        growthRate = ((metrics.new_enrollments - prevEnrollments) / prevEnrollments) * 100;
        if (growthRate > 10) trendDirection = 'growing';
        else if (growthRate < -10) trendDirection = 'declining';
      }
    }

    // Upsert trends
    await pool.query(
      `INSERT INTO enrollment_trends (
        course_id, week_start_date, new_enrollments, total_enrollments,
        active_enrollments, completed_enrollments, dropped_enrollments,
        enrollment_growth_rate, trend_direction
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (course_id, week_start_date) DO UPDATE SET
        new_enrollments = $3,
        total_enrollments = $4,
        active_enrollments = $5,
        completed_enrollments = $6,
        dropped_enrollments = $7,
        enrollment_growth_rate = $8,
        trend_direction = $9,
        updated_at = NOW()`,
      [
        courseId,
        dateStr,
        metrics.new_enrollments,
        metrics.total_enrollments,
        metrics.active_enrollments,
        metrics.completed_enrollments,
        metrics.dropped_enrollments,
        growthRate,
        trendDirection
      ]
    );
  }

  async getEnrollmentTrends(courseId: string, weeks: number = 12): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM enrollment_trends
      WHERE course_id = $1
      ORDER BY week_start_date DESC
      LIMIT $2`,
      [courseId, weeks]
    );

    return result.rows;
  }

  // ========================================
  // COURSE COMPLETION ANALYTICS
  // ========================================

  async calculateCourseCompletionAnalytics(courseId: string): Promise<void> {
    await pool.query(`SELECT calculate_course_completion_analytics($1)`, [courseId]);
  }

  async getCourseCompletionAnalytics(courseId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM course_completion_analytics WHERE course_id = $1`,
      [courseId]
    );

    return result.rows[0] || null;
  }

  async getCoursePerformanceOverview(courseId?: string): Promise<any[]> {
    let query = `SELECT * FROM course_performance_overview`;
    const params: any[] = [];

    if (courseId) {
      query += ` WHERE course_id = $1`;
      params.push(courseId);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTopPerformingCourses(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM top_performing_courses LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async getCoursesNeedingAttention(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM courses_needing_attention LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // MODULE ANALYTICS
  // ========================================

  async calculateModuleAnalytics(moduleId: string): Promise<void> {
    const result = await pool.query(
      `SELECT
        module_id,
        course_id,
        COUNT(DISTINCT lp.user_id) as unique_viewers,
        COUNT(*) FILTER (WHERE lp.status = 'completed') as total_completions,
        AVG(ci.total_time_spent_seconds) / 60 as avg_time_spent_minutes
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id
      LEFT JOIN content_interactions ci ON l.id = ci.content_id::UUID AND ci.content_type = 'lesson'
      WHERE l.module_id = $1
      GROUP BY l.module_id, l.course_id`,
      [moduleId]
    );

    if (result.rows.length > 0) {
      const metrics = result.rows[0];
      const completionRate = metrics.unique_viewers > 0
        ? (metrics.total_completions / metrics.unique_viewers) * 100
        : 0;

      await pool.query(
        `INSERT INTO module_analytics (
          module_id, course_id, unique_viewers, total_completions,
          completion_rate, avg_time_spent_minutes, last_calculated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (module_id) DO UPDATE SET
          unique_viewers = $3,
          total_completions = $4,
          completion_rate = $5,
          avg_time_spent_minutes = $6,
          last_calculated_at = NOW(),
          updated_at = NOW()`,
        [
          moduleId,
          metrics.course_id,
          metrics.unique_viewers,
          metrics.total_completions,
          completionRate,
          metrics.avg_time_spent_minutes || 0
        ]
      );
    }
  }

  async getModuleAnalytics(moduleId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM module_analytics WHERE module_id = $1`,
      [moduleId]
    );

    return result.rows[0] || null;
  }

  async getCourseModulesAnalytics(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT ma.*, m.title as module_title, m.sequence_order
      FROM module_analytics ma
      JOIN modules m ON ma.module_id = m.id
      WHERE ma.course_id = $1
      ORDER BY m.sequence_order`,
      [courseId]
    );

    return result.rows;
  }

  // ========================================
  // LESSON ANALYTICS
  // ========================================

  async calculateLessonAnalytics(lessonId: string): Promise<void> {
    await pool.query(`SELECT calculate_lesson_analytics($1)`, [lessonId]);
  }

  async getLessonAnalytics(lessonId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM lesson_analytics WHERE lesson_id = $1`,
      [lessonId]
    );

    return result.rows[0] || null;
  }

  async getModuleLessonsAnalytics(moduleId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT la.*, l.title as lesson_title, l.sequence_order
      FROM lesson_analytics la
      JOIN lessons l ON la.lesson_id = l.id
      WHERE la.module_id = $1
      ORDER BY l.sequence_order`,
      [moduleId]
    );

    return result.rows;
  }

  async getTopViewedLessons(courseId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT la.*, l.title as lesson_title
      FROM lesson_analytics la
      JOIN lessons l ON la.lesson_id = l.id
      WHERE la.course_id = $1
      ORDER BY la.total_views DESC
      LIMIT $2`,
      [courseId, limit]
    );

    return result.rows;
  }

  // ========================================
  // ASSESSMENT ANALYTICS
  // ========================================

  async calculateAssessmentAnalytics(assessmentId: string): Promise<void> {
    const result = await pool.query(
      `SELECT
        a.course_id,
        COUNT(*) as total_attempts,
        COUNT(DISTINCT aa.user_id) as unique_takers,
        AVG(aa.score) as avg_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY aa.score) as median_score,
        MAX(aa.score) as highest_score,
        MIN(aa.score) as lowest_score,
        COUNT(*) FILTER (WHERE aa.score >= a.passing_score) as passed,
        COUNT(*) FILTER (WHERE aa.attempt_number = 1 AND aa.score >= a.passing_score) as first_attempt_passed
      FROM assessments a
      LEFT JOIN assessment_attempts aa ON a.id = aa.assessment_id AND aa.status = 'completed'
      WHERE a.id = $1
      GROUP BY a.id, a.course_id, a.passing_score`,
      [assessmentId]
    );

    if (result.rows.length > 0) {
      const metrics = result.rows[0];
      const passRate = metrics.total_attempts > 0
        ? (metrics.passed / metrics.total_attempts) * 100
        : 0;
      const firstAttemptPassRate = metrics.unique_takers > 0
        ? (metrics.first_attempt_passed / metrics.unique_takers) * 100
        : 0;
      const avgAttemptsPerUser = metrics.unique_takers > 0
        ? metrics.total_attempts / metrics.unique_takers
        : 0;

      await pool.query(
        `INSERT INTO assessment_analytics (
          assessment_id, course_id, total_attempts, unique_takers,
          avg_attempts_per_user, avg_score, median_score, highest_score,
          lowest_score, pass_rate, first_attempt_pass_rate, last_calculated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (assessment_id) DO UPDATE SET
          total_attempts = $3,
          unique_takers = $4,
          avg_attempts_per_user = $5,
          avg_score = $6,
          median_score = $7,
          highest_score = $8,
          lowest_score = $9,
          pass_rate = $10,
          first_attempt_pass_rate = $11,
          last_calculated_at = NOW(),
          updated_at = NOW()`,
        [
          assessmentId,
          metrics.course_id,
          metrics.total_attempts,
          metrics.unique_takers,
          avgAttemptsPerUser,
          metrics.avg_score,
          metrics.median_score,
          metrics.highest_score,
          metrics.lowest_score,
          passRate,
          firstAttemptPassRate
        ]
      );
    }
  }

  async getAssessmentAnalytics(assessmentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM assessment_analytics WHERE assessment_id = $1`,
      [assessmentId]
    );

    return result.rows[0] || null;
  }

  async getCourseAssessmentsAnalytics(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT aa.*, a.title as assessment_title
      FROM assessment_analytics aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.course_id = $1
      ORDER BY aa.avg_score DESC`,
      [courseId]
    );

    return result.rows;
  }

  // ========================================
  // DROPOUT ANALYSIS
  // ========================================

  async recordDropout(params: RecordDropoutParams): Promise<any> {
    const {
      userId,
      courseId,
      enrollmentId,
      progressPercentage,
      lastLessonId,
      lastModuleId,
      dropoutReason = 'unknown',
      feedback
    } = params;

    // Get enrollment info
    const enrollmentResult = await pool.query(
      `SELECT enrolled_at,
        EXTRACT(EPOCH FROM (NOW() - enrolled_at)) / 86400 as days_since_enrollment
      FROM enrollments WHERE id = $1`,
      [enrollmentId]
    );

    const daysSinceEnrollment = Math.floor(enrollmentResult.rows[0]?.days_since_enrollment || 0);

    // Get completion counts
    const progressResult = await pool.query(
      `SELECT
        COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.status = 'completed') as lessons_completed,
        COUNT(DISTINCT aa.assessment_id) FILTER (WHERE aa.status = 'completed') as assessments_completed,
        MAX(lp.last_accessed_at) as last_activity_date
      FROM enrollments e
      LEFT JOIN lesson_progress lp ON e.user_id = lp.user_id
      LEFT JOIN assessment_attempts aa ON e.user_id = aa.user_id
      WHERE e.id = $1`,
      [enrollmentId]
    );

    const progress = progressResult.rows[0];
    const lastActivityDate = progress.last_activity_date
      ? new Date(progress.last_activity_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const daysInactive = Math.floor(
      (new Date().getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = await pool.query(
      `INSERT INTO course_dropouts (
        user_id, course_id, enrollment_id, progress_percentage,
        last_lesson_id, last_module_id, days_since_enrollment,
        lessons_completed, assessments_completed, dropout_reason,
        feedback, last_activity_date, days_inactive
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId,
        courseId,
        enrollmentId,
        progressPercentage,
        lastLessonId,
        lastModuleId,
        daysSinceEnrollment,
        progress.lessons_completed,
        progress.assessments_completed,
        dropoutReason,
        feedback,
        lastActivityDate,
        daysInactive
      ]
    );

    return result.rows[0];
  }

  async getCourseDropouts(courseId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT cd.*, u.full_name, u.email
      FROM course_dropouts cd
      JOIN users u ON cd.user_id = u.id
      WHERE cd.course_id = $1
      ORDER BY cd.dropped_at DESC
      LIMIT $2`,
      [courseId, limit]
    );

    return result.rows;
  }

  async getDropoutAnalysisByCourse(courseId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_dropouts,
        AVG(progress_percentage) as avg_progress_at_dropout,
        AVG(days_since_enrollment) as avg_days_before_dropout,
        COUNT(*) FILTER (WHERE dropout_reason = 'too_difficult') as too_difficult_count,
        COUNT(*) FILTER (WHERE dropout_reason = 'time_constraints') as time_constraints_count,
        COUNT(*) FILTER (WHERE dropout_reason = 'not_relevant') as not_relevant_count,
        COUNT(*) FILTER (WHERE dropout_reason = 'poor_quality') as poor_quality_count,
        COUNT(*) FILTER (WHERE dropout_reason = 'lost_interest') as lost_interest_count
      FROM course_dropouts
      WHERE course_id = $1`,
      [courseId]
    );

    return result.rows[0];
  }

  // ========================================
  // INSTRUCTOR ANALYTICS
  // ========================================

  async calculateInstructorAnalytics(instructorId: string): Promise<void> {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_courses,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'published') as published_courses,
        COUNT(DISTINCT e.user_id) as total_students,
        COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'active') as active_students,
        COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'completed') as completed_students,
        AVG(r.rating) as avg_course_rating,
        AVG(cca.completion_rate) as avg_completion_rate
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN reviews r ON c.id = r.course_id
      LEFT JOIN course_completion_analytics cca ON c.id = cca.course_id
      WHERE c.instructor_id = $1
      GROUP BY c.instructor_id`,
      [instructorId]
    );

    if (result.rows.length > 0) {
      const metrics = result.rows[0];

      await pool.query(
        `INSERT INTO instructor_analytics (
          instructor_id, total_courses, active_courses, published_courses,
          total_students, active_students, completed_students,
          avg_course_rating, avg_completion_rate, last_calculated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (instructor_id) DO UPDATE SET
          total_courses = $2,
          active_courses = $3,
          published_courses = $4,
          total_students = $5,
          active_students = $6,
          completed_students = $7,
          avg_course_rating = $8,
          avg_completion_rate = $9,
          last_calculated_at = NOW(),
          updated_at = NOW()`,
        [
          instructorId,
          metrics.total_courses,
          metrics.active_courses,
          metrics.published_courses,
          metrics.total_students,
          metrics.active_students,
          metrics.completed_students,
          metrics.avg_course_rating,
          metrics.avg_completion_rate
        ]
      );
    }
  }

  async getInstructorAnalytics(instructorId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM instructor_analytics WHERE instructor_id = $1`,
      [instructorId]
    );

    return result.rows[0] || null;
  }

  async getTopInstructors(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT ia.*, u.full_name, u.email
      FROM instructor_analytics ia
      JOIN users u ON ia.instructor_id = u.id
      ORDER BY ia.avg_course_rating DESC, ia.total_students DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // CONTENT EFFECTIVENESS
  // ========================================

  async calculateContentEffectiveness(contentType: string, contentId: string, courseId: string): Promise<void> {
    // This is a simplified effectiveness calculation
    // In a real system, this would involve more sophisticated ML models

    const result = await pool.query(
      `SELECT
        COALESCE(AVG(CASE
          WHEN content_type = 'lesson' THEN
            (CASE WHEN ci.completion_count > 0 THEN 50 ELSE 0 END) +
            (CASE WHEN ci.total_time_spent_seconds > 0 THEN 30 ELSE 0 END) +
            (CASE WHEN ci.like_count > 0 THEN 20 ELSE 0 END)
          ELSE 0
        END), 0) as effectiveness_score
      FROM content_interactions ci
      WHERE ci.content_type = $1 AND ci.content_id = $2`,
      [contentType, contentId]
    );

    const effectivenessScore = result.rows[0]?.effectiveness_score || 0;
    let effectivenessRating = 'poor';

    if (effectivenessScore >= 80) effectivenessRating = 'excellent';
    else if (effectivenessScore >= 60) effectivenessRating = 'good';
    else if (effectivenessScore >= 40) effectivenessRating = 'fair';

    const needsImprovement = effectivenessScore < 60;

    await pool.query(
      `INSERT INTO content_effectiveness (
        content_type, content_id, course_id, overall_score,
        effectiveness_rating, needs_improvement, last_calculated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (content_type, content_id) DO UPDATE SET
        overall_score = $4,
        effectiveness_rating = $5,
        needs_improvement = $6,
        last_calculated_at = NOW(),
        updated_at = NOW()`,
      [contentType, contentId, courseId, effectivenessScore, effectivenessRating, needsImprovement]
    );
  }

  async getContentNeedingImprovement(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM content_effectiveness
      WHERE course_id = $1 AND needs_improvement = true
      ORDER BY overall_score ASC`,
      [courseId]
    );

    return result.rows;
  }

  // ========================================
  // COHORT ANALYSIS
  // ========================================

  async createCohort(params: CreateCohortParams): Promise<any> {
    const { courseId, cohortName, cohortStartDate, cohortEndDate } = params;

    const result = await pool.query(
      `INSERT INTO enrollment_cohorts (course_id, cohort_name, cohort_start_date, cohort_end_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [courseId, cohortName, cohortStartDate, cohortEndDate]
    );

    return result.rows[0];
  }

  async calculateCohortMetrics(cohortId: string): Promise<void> {
    // Calculate metrics for a cohort
    const cohortResult = await pool.query(
      `SELECT * FROM enrollment_cohorts WHERE id = $1`,
      [cohortId]
    );

    if (cohortResult.rows.length === 0) return;

    const cohort = cohortResult.rows[0];

    const metricsResult = await pool.query(
      `SELECT
        COUNT(*) as total_enrolled,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
        COUNT(*) FILTER (WHERE status = 'dropped') as total_dropped
      FROM enrollments
      WHERE course_id = $1
        AND enrolled_at BETWEEN $2 AND $3`,
      [cohort.course_id, cohort.cohort_start_date, cohort.cohort_end_date]
    );

    const metrics = metricsResult.rows[0];
    const completionRate = metrics.total_enrolled > 0
      ? (metrics.total_completed / metrics.total_enrolled) * 100
      : 0;

    await pool.query(
      `UPDATE enrollment_cohorts SET
        total_enrolled = $1,
        total_completed = $2,
        total_dropped = $3,
        completion_rate = $4,
        updated_at = NOW()
      WHERE id = $5`,
      [
        metrics.total_enrolled,
        metrics.total_completed,
        metrics.total_dropped,
        completionRate,
        cohortId
      ]
    );
  }

  async getCourseCohorts(courseId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM enrollment_cohorts
      WHERE course_id = $1
      ORDER BY cohort_start_date DESC`,
      [courseId]
    );

    return result.rows;
  }

  // ========================================
  // POPULAR CONTENT
  // ========================================

  async calculatePopularContent(courseId: string, periodDays: number = 30): Promise<void> {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Calculate popular lessons
    await pool.query(
      `INSERT INTO popular_content (
        course_id, content_type, content_id, content_title,
        view_count, unique_viewers, completion_count,
        like_count, bookmark_count, popularity_score,
        period_start, period_end
      )
      SELECT
        $1 as course_id,
        'lesson' as content_type,
        l.id as content_id,
        l.title as content_title,
        COUNT(lp.id) as view_count,
        COUNT(DISTINCT lp.user_id) as unique_viewers,
        COUNT(*) FILTER (WHERE lp.status = 'completed') as completion_count,
        COUNT(*) FILTER (WHERE ea.engagement_type = 'like') as like_count,
        COUNT(*) FILTER (WHERE ea.engagement_type = 'bookmark') as bookmark_count,
        (COUNT(lp.id) * 1.0 + COUNT(DISTINCT lp.user_id) * 2.0 + COUNT(*) FILTER (WHERE lp.status = 'completed') * 3.0) as popularity_score,
        $2 as period_start,
        CURRENT_DATE as period_end
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.created_at >= $2
      LEFT JOIN engagement_activities ea ON l.id::TEXT = ea.target_id AND ea.target_type = 'lesson' AND ea.created_at >= $2
      WHERE l.course_id = $1
      GROUP BY l.id, l.title
      ON CONFLICT (course_id, content_type, content_id, period_start, period_end) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        unique_viewers = EXCLUDED.unique_viewers,
        completion_count = EXCLUDED.completion_count,
        like_count = EXCLUDED.like_count,
        bookmark_count = EXCLUDED.bookmark_count,
        popularity_score = EXCLUDED.popularity_score,
        updated_at = NOW()`,
      [courseId, periodStart]
    );
  }

  async getPopularContent(courseId: string, contentType?: string, limit: number = 20): Promise<any[]> {
    let query = `SELECT * FROM popular_content WHERE course_id = $1`;
    const params: any[] = [courseId];

    if (contentType) {
      query += ` AND content_type = $2`;
      params.push(contentType);
    }

    query += ` ORDER BY popularity_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const courseAnalyticsService = new CourseAnalyticsService();
