import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UpdatePreferencesParams {
  userId: string;
  preferredTopics?: string[];
  preferredDifficultyLevels?: string[];
  preferredContentTypes?: string[];
  preferredDuration?: string;
  learningGoals?: string[];
  careerGoals?: string[];
  skillInterests?: string[];
  availableHoursPerWeek?: number;
  preferredLearningTime?: string;
  enableRecommendations?: boolean;
  recommendationFrequency?: string;
}

interface CreateLearningPathParams {
  userId: string;
  pathName: string;
  pathDescription?: string;
  courseSequence: any[];
  totalCourses: number;
  estimatedDurationWeeks?: number;
  targetSkill?: string;
  targetRole?: string;
  learningOutcome?: string;
  recommendationScore: number;
}

interface AnalyzeSkillGapParams {
  userId: string;
  targetRole: string;
  targetSkillLevel?: string;
}

interface SubmitFeedbackParams {
  userId: string;
  recommendationId: string;
  recommendationType: string;
  feedbackType: string;
  feedbackRating?: number;
  feedbackText?: string;
}

interface CreateNextActionParams {
  userId: string;
  actionType: string;
  actionTitle: string;
  actionDescription?: string;
  targetId?: string;
  targetType?: string;
  actionUrl?: string;
  priorityScore: number;
  urgencyLevel?: string;
  impactLevel?: string;
  reasoning?: string;
  expectedOutcome?: string;
}

// ============================================================================
// RECOMMENDATIONS SERVICE
// ============================================================================

export class RecommendationsService {
  // ========================================
  // USER PREFERENCES
  // ========================================

  async getUserPreferences(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      const createResult = await pool.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  }

  async updateUserPreferences(params: UpdatePreferencesParams): Promise<any> {
    const {
      userId,
      preferredTopics,
      preferredDifficultyLevels,
      preferredContentTypes,
      preferredDuration,
      learningGoals,
      careerGoals,
      skillInterests,
      availableHoursPerWeek,
      preferredLearningTime,
      enableRecommendations,
      recommendationFrequency
    } = params;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (preferredTopics !== undefined) {
      updates.push(`preferred_topics = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(preferredTopics));
      paramIndex++;
    }

    if (preferredDifficultyLevels !== undefined) {
      updates.push(`preferred_difficulty_levels = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(preferredDifficultyLevels));
      paramIndex++;
    }

    if (preferredContentTypes !== undefined) {
      updates.push(`preferred_content_types = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(preferredContentTypes));
      paramIndex++;
    }

    if (preferredDuration !== undefined) {
      updates.push(`preferred_duration = $${paramIndex}`);
      values.push(preferredDuration);
      paramIndex++;
    }

    if (learningGoals !== undefined) {
      updates.push(`learning_goals = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(learningGoals));
      paramIndex++;
    }

    if (careerGoals !== undefined) {
      updates.push(`career_goals = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(careerGoals));
      paramIndex++;
    }

    if (skillInterests !== undefined) {
      updates.push(`skill_interests = $${paramIndex}::JSONB`);
      values.push(JSON.stringify(skillInterests));
      paramIndex++;
    }

    if (availableHoursPerWeek !== undefined) {
      updates.push(`available_hours_per_week = $${paramIndex}`);
      values.push(availableHoursPerWeek);
      paramIndex++;
    }

    if (preferredLearningTime !== undefined) {
      updates.push(`preferred_learning_time = $${paramIndex}`);
      values.push(preferredLearningTime);
      paramIndex++;
    }

    if (enableRecommendations !== undefined) {
      updates.push(`enable_recommendations = $${paramIndex}`);
      values.push(enableRecommendations);
      paramIndex++;
    }

    if (recommendationFrequency !== undefined) {
      updates.push(`recommendation_frequency = $${paramIndex}`);
      values.push(recommendationFrequency);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await this.getUserPreferences(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    // Ensure preferences exist
    await pool.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const result = await pool.query(
      `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // COURSE RECOMMENDATIONS
  // ========================================

  async generateCourseRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM generate_course_recommendations($1, $2)`,
      [userId, limit]
    );

    return result.rows;
  }

  async getUserCourseRecommendations(userId: string, limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_user_recommendations
      WHERE user_id = $1
      ORDER BY recommendation_score DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async trackRecommendationInteraction(recommendationId: string, interactionType: string): Promise<void> {
    await pool.query(
      `SELECT track_recommendation_interaction($1, $2)`,
      [recommendationId, interactionType]
    );
  }

  async dismissRecommendation(recommendationId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE course_recommendations
      SET dismissed_at = NOW(), is_active = false
      WHERE id = $1 AND user_id = $2`,
      [recommendationId, userId]
    );
  }

  // ========================================
  // LEARNING PATH RECOMMENDATIONS
  // ========================================

  async createLearningPathRecommendation(params: CreateLearningPathParams): Promise<any> {
    const {
      userId,
      pathName,
      pathDescription,
      courseSequence,
      totalCourses,
      estimatedDurationWeeks,
      targetSkill,
      targetRole,
      learningOutcome,
      recommendationScore
    } = params;

    const result = await pool.query(
      `INSERT INTO learning_path_recommendations (
        user_id, path_name, path_description, course_sequence,
        total_courses, estimated_duration_weeks, target_skill,
        target_role, learning_outcome, recommendation_score,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '30 days')
      RETURNING *`,
      [
        userId,
        pathName,
        pathDescription,
        JSON.stringify(courseSequence),
        totalCourses,
        estimatedDurationWeeks,
        targetSkill,
        targetRole,
        learningOutcome,
        recommendationScore
      ]
    );

    return result.rows[0];
  }

  async getUserLearningPathRecommendations(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM learning_path_recommendations
      WHERE user_id = $1 AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY recommendation_score DESC`,
      [userId]
    );

    return result.rows;
  }

  async startLearningPath(pathId: string, userId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE learning_path_recommendations
      SET started_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [pathId, userId]
    );

    return result.rows[0];
  }

  // ========================================
  // SKILL GAP ANALYSIS
  // ========================================

  async analyzeSkillGap(params: AnalyzeSkillGapParams): Promise<any> {
    const { userId, targetRole, targetSkillLevel = 'mid' } = params;

    // Get user's current skills
    const currentSkillsResult = await pool.query(
      `SELECT usm.*, s.skill_name, s.skill_category
      FROM user_skill_mastery usm
      JOIN skills s ON usm.skill_id = s.id
      WHERE usm.user_id = $1`,
      [userId]
    );

    const currentSkills = currentSkillsResult.rows.map(row => ({
      skill_id: row.skill_id,
      skill_name: row.skill_name,
      mastery_level: row.mastery_level,
      mastery_percentage: row.mastery_percentage
    }));

    // In a real system, this would query a skills database for the target role
    // For now, we'll create a simplified gap analysis
    const skillGaps = currentSkills
      .filter(skill => skill.mastery_level === 'beginner' || skill.mastery_level === 'intermediate')
      .map(skill => ({
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        required_level: 'advanced',
        current_level: skill.mastery_level,
        gap_severity: skill.mastery_percentage < 50 ? 'high' : 'medium'
      }));

    const overallReadiness = currentSkills.length > 0
      ? currentSkills.reduce((sum, skill) => sum + skill.mastery_percentage, 0) / currentSkills.length
      : 0;

    const result = await pool.query(
      `INSERT INTO skill_gap_analysis (
        user_id, target_role, target_skill_level, current_skills,
        skill_gaps, overall_readiness_score, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')
      RETURNING *`,
      [
        userId,
        targetRole,
        targetSkillLevel,
        JSON.stringify(currentSkills),
        JSON.stringify(skillGaps),
        overallReadiness
      ]
    );

    return result.rows[0];
  }

  async getSkillGapAnalysis(userId: string, targetRole?: string): Promise<any[]> {
    let query = `SELECT * FROM skill_gap_analysis WHERE user_id = $1`;
    const params: any[] = [userId];

    if (targetRole) {
      query += ` AND target_role = $2`;
      params.push(targetRole);
    }

    query += ` ORDER BY analyzed_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // USER SIMILARITY (COLLABORATIVE FILTERING)
  // ========================================

  async calculateUserSimilarity(userId: string, limit: number = 20): Promise<void> {
    await pool.query(`SELECT calculate_user_similarity($1, $2)`, [userId, limit]);
  }

  async getSimilarUsers(userId: string, limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT us.*, u.full_name, u.email
      FROM user_similarity us
      JOIN users u ON us.similar_user_id = u.id
      WHERE us.user_id = $1
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
      ORDER BY us.similarity_score DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getCoursesFromSimilarUsers(userId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT DISTINCT c.*, COUNT(*) as similar_users_enrolled
      FROM user_similarity us
      JOIN enrollments e ON us.similar_user_id = e.user_id
      JOIN courses c ON e.course_id = c.id
      WHERE us.user_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM enrollments e2
          WHERE e2.user_id = $1 AND e2.course_id = c.id
        )
        AND c.status = 'published'
      GROUP BY c.id
      ORDER BY similar_users_enrolled DESC, c.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // COURSE SIMILARITY (CONTENT-BASED FILTERING)
  // ========================================

  async getSimilarCourses(courseId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT cs.*, c.title, c.description, c.difficulty_level, c.duration_hours
      FROM course_similarity cs
      JOIN courses c ON cs.similar_course_id = c.id
      WHERE cs.course_id = $1 AND c.status = 'published'
      ORDER BY cs.similarity_score DESC
      LIMIT $2`,
      [courseId, limit]
    );

    return result.rows;
  }

  // ========================================
  // RECOMMENDATION FEEDBACK
  // ========================================

  async submitRecommendationFeedback(params: SubmitFeedbackParams): Promise<any> {
    const {
      userId,
      recommendationId,
      recommendationType,
      feedbackType,
      feedbackRating,
      feedbackText
    } = params;

    const result = await pool.query(
      `INSERT INTO recommendation_feedback (
        user_id, recommendation_id, recommendation_type,
        feedback_type, feedback_rating, feedback_text
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, recommendationId, recommendationType, feedbackType, feedbackRating, feedbackText]
    );

    return result.rows[0];
  }

  async getRecommendationEffectiveness(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM recommendation_effectiveness ORDER BY conversion_rate DESC`
    );

    return result.rows;
  }

  // ========================================
  // TRENDING COURSES
  // ========================================

  async calculateTrendingCourses(periodDays: number = 7): Promise<void> {
    await pool.query(`SELECT calculate_trending_courses($1)`, [periodDays]);
  }

  async getTrendingCourses(limit: number = 20, category?: string): Promise<any[]> {
    let query = `SELECT tc.*, c.title, c.description, c.instructor_id
      FROM trending_courses tc
      JOIN courses c ON tc.course_id = c.id
      WHERE tc.period_end = CURRENT_DATE`;
    const params: any[] = [];

    if (category) {
      query += ` AND tc.category = $1`;
      params.push(category);
    }

    query += ` ORDER BY tc.trending_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // NEXT BEST ACTIONS
  // ========================================

  async createNextBestAction(params: CreateNextActionParams): Promise<any> {
    const {
      userId,
      actionType,
      actionTitle,
      actionDescription,
      targetId,
      targetType,
      actionUrl,
      priorityScore,
      urgencyLevel = 'medium',
      impactLevel = 'medium',
      reasoning,
      expectedOutcome
    } = params;

    const result = await pool.query(
      `INSERT INTO next_best_actions (
        user_id, action_type, action_title, action_description,
        target_id, target_type, action_url, priority_score,
        urgency_level, impact_level, reasoning, expected_outcome,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() + INTERVAL '7 days')
      RETURNING *`,
      [
        userId,
        actionType,
        actionTitle,
        actionDescription,
        targetId,
        targetType,
        actionUrl,
        priorityScore,
        urgencyLevel,
        impactLevel,
        reasoning,
        expectedOutcome
      ]
    );

    return result.rows[0];
  }

  async getUserNextBestActions(userId: string, limit: number = 5): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM next_best_actions
      WHERE user_id = $1 AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND completed_at IS NULL
      ORDER BY priority_score DESC, urgency_level DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async completeNextBestAction(actionId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE next_best_actions
      SET completed_at = NOW(), is_active = false
      WHERE id = $1 AND user_id = $2`,
      [actionId, userId]
    );
  }

  async dismissNextBestAction(actionId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE next_best_actions
      SET dismissed_at = NOW(), is_active = false
      WHERE id = $1 AND user_id = $2`,
      [actionId, userId]
    );
  }

  // ========================================
  // RECOMMENDATION PERFORMANCE
  // ========================================

  async getRecommendationPerformance(days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM recommendation_performance
      WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1
      ORDER BY date DESC, conversion_rate DESC`,
      [days]
    );

    return result.rows;
  }

  async updateRecommendationPerformance(date?: Date): Promise<void> {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Calculate performance for course recommendations
    await pool.query(
      `INSERT INTO recommendation_performance (
        date, recommendation_type, primary_reason,
        total_recommendations, viewed_count, clicked_count,
        enrolled_count, dismissed_count, view_rate,
        click_through_rate, conversion_rate, dismissal_rate
      )
      SELECT
        $1::DATE,
        'course',
        primary_reason,
        COUNT(*),
        COUNT(*) FILTER (WHERE viewed_at IS NOT NULL),
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
        COUNT(*) FILTER (WHERE enrolled_at IS NOT NULL),
        COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL),
        COUNT(*) FILTER (WHERE viewed_at IS NOT NULL)::NUMERIC / COUNT(*) * 100,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE viewed_at IS NOT NULL), 0) * 100,
        COUNT(*) FILTER (WHERE enrolled_at IS NOT NULL)::NUMERIC / COUNT(*) * 100,
        COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL)::NUMERIC / COUNT(*) * 100
      FROM course_recommendations
      WHERE DATE(generated_at) = $1::DATE
      GROUP BY primary_reason
      ON CONFLICT (date, recommendation_type, primary_reason) DO UPDATE SET
        total_recommendations = EXCLUDED.total_recommendations,
        viewed_count = EXCLUDED.viewed_count,
        clicked_count = EXCLUDED.clicked_count,
        enrolled_count = EXCLUDED.enrolled_count,
        dismissed_count = EXCLUDED.dismissed_count,
        view_rate = EXCLUDED.view_rate,
        click_through_rate = EXCLUDED.click_through_rate,
        conversion_rate = EXCLUDED.conversion_rate,
        dismissal_rate = EXCLUDED.dismissal_rate`,
      [dateStr]
    );
  }

  // ========================================
  // COMPREHENSIVE RECOMMENDATIONS
  // ========================================

  async getComprehensiveRecommendations(userId: string): Promise<any> {
    const [
      courseRecommendations,
      learningPaths,
      trendingCourses,
      nextActions,
      similarUserCourses
    ] = await Promise.all([
      this.getUserCourseRecommendations(userId, 10),
      this.getUserLearningPathRecommendations(userId),
      this.getTrendingCourses(10),
      this.getUserNextBestActions(userId, 5),
      this.getCoursesFromSimilarUsers(userId, 5)
    ]);

    return {
      personalizedCourses: courseRecommendations,
      learningPaths,
      trendingCourses,
      nextBestActions: nextActions,
      popularWithSimilarUsers: similarUserCourses
    };
  }
}

export const recommendationsService = new RecommendationsService();
