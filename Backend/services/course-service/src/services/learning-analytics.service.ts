import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StartSessionParams {
  userId: string;
  deviceType?: string;
  browser?: string;
  platform?: string;
  ipAddress?: string;
}

interface LogActivityParams {
  sessionId: string;
  userId: string;
  activityAction: string;
  contentType: string;
  contentId: string;
  contentTitle?: string;
  metadata?: any;
}

interface UpdateContentInteractionParams {
  userId: string;
  contentType: string;
  contentId: string;
  timeSpentSeconds?: number;
  completed?: boolean;
  score?: number;
  success?: boolean;
}

interface UpdateSkillMasteryParams {
  userId: string;
  skillId: string;
  success: boolean;
  confidenceDelta?: number;
}

interface CreateLearningGoalParams {
  userId: string;
  goalTitle: string;
  goalDescription?: string;
  goalType: string;
  targetValue: number;
  targetUnit: string;
  targetDate?: Date;
  reminderEnabled?: boolean;
  reminderFrequency?: string;
}

interface UpdateLearningGoalParams {
  goalId: string;
  userId: string;
  currentValue?: number;
  isAchieved?: boolean;
  goalTitle?: string;
  targetDate?: Date;
}

interface CreateSkillParams {
  skillName: string;
  skillCategory?: string;
  description?: string;
  parentSkillId?: string;
}

// ============================================================================
// LEARNING ANALYTICS SERVICE
// ============================================================================

export class LearningAnalyticsService {
  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async startSession(params: StartSessionParams): Promise<any> {
    const { userId, deviceType, browser, platform, ipAddress } = params;

    const result = await pool.query(
      `SELECT start_learning_session($1, $2, $3, $4, $5) as session_id`,
      [userId, deviceType, browser, platform, ipAddress]
    );

    return { sessionId: result.rows[0].session_id };
  }

  async endSession(sessionId: string): Promise<void> {
    await pool.query(`SELECT end_learning_session($1)`, [sessionId]);
  }

  async logActivity(params: LogActivityParams): Promise<any> {
    const {
      sessionId,
      userId,
      activityAction,
      contentType,
      contentId,
      contentTitle,
      metadata
    } = params;

    const result = await pool.query(
      `SELECT log_session_activity($1, $2, $3, $4, $5, $6, $7) as activity_id`,
      [
        sessionId,
        userId,
        activityAction,
        contentType,
        contentId,
        contentTitle,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return { activityId: result.rows[0].activity_id };
  }

  async getSessionDetails(sessionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM learning_sessions WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    // Get activities for this session
    const activitiesResult = await pool.query(
      `SELECT * FROM session_activities WHERE session_id = $1 ORDER BY created_at`,
      [sessionId]
    );

    return {
      ...result.rows[0],
      activities: activitiesResult.rows
    };
  }

  async getUserSessions(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM learning_sessions
      WHERE user_id = $1
      ORDER BY session_start DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // LEARNING METRICS
  // ========================================

  async updateLearningMetrics(userId: string, date?: Date): Promise<void> {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    await pool.query(`SELECT update_learning_metrics($1, $2)`, [userId, dateStr]);
  }

  async getLearningMetrics(userId: string, days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM learning_metrics
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
      ORDER BY date DESC`,
      [userId, days]
    );

    return result.rows;
  }

  async getUserLearningSummary(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_learning_summary WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  async getActiveLearners(days: number = 7, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_learners LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async getTopPerformingLearners(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM top_performing_learners LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // CONTENT INTERACTIONS
  // ========================================

  async updateContentInteraction(params: UpdateContentInteractionParams): Promise<void> {
    const { userId, contentType, contentId, timeSpentSeconds, completed, score, success } = params;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Increment view count
    updates.push(`view_count = view_count + 1`);
    updates.push(`last_viewed_at = NOW()`);

    if (timeSpentSeconds !== undefined) {
      updates.push(`total_time_spent_seconds = total_time_spent_seconds + $${paramIndex}`);
      values.push(timeSpentSeconds);
      paramIndex++;
    }

    if (completed) {
      updates.push(`completion_count = completion_count + 1`);
      updates.push(`completed_at = COALESCE(completed_at, NOW())`);
    }

    if (score !== undefined) {
      updates.push(`attempts_count = attempts_count + 1`);
      if (success) {
        updates.push(`success_count = success_count + 1`);
      }
      updates.push(`avg_score = CASE
        WHEN avg_score IS NULL THEN $${paramIndex}
        ELSE (avg_score * attempts_count + $${paramIndex}) / (attempts_count + 1)
      END`);
      updates.push(`best_score = GREATEST(COALESCE(best_score, 0), $${paramIndex})`);
      values.push(score);
      paramIndex++;
    }

    updates.push('updated_at = NOW()');
    values.push(userId, contentType, contentId);

    await pool.query(
      `INSERT INTO content_interactions (user_id, content_type, content_id, first_viewed_at)
      VALUES ($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, NOW())
      ON CONFLICT (user_id, content_type, content_id) DO UPDATE SET ${updates.join(', ')}`,
      values
    );
  }

  async getContentInteraction(userId: string, contentType: string, contentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM content_interactions
      WHERE user_id = $1 AND content_type = $2 AND content_id = $3`,
      [userId, contentType, contentId]
    );

    return result.rows[0] || null;
  }

  async getUserContentInteractions(userId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM content_interactions
      WHERE user_id = $1
      ORDER BY last_viewed_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // SKILL MASTERY
  // ========================================

  async createSkill(params: CreateSkillParams): Promise<any> {
    const { skillName, skillCategory, description, parentSkillId } = params;

    const result = await pool.query(
      `INSERT INTO skills (skill_name, skill_category, description, parent_skill_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [skillName, skillCategory, description, parentSkillId]
    );

    return result.rows[0];
  }

  async listSkills(category?: string): Promise<any[]> {
    let query = `SELECT * FROM skills WHERE is_active = true`;
    const params: any[] = [];

    if (category) {
      query += ` AND skill_category = $1`;
      params.push(category);
    }

    query += ` ORDER BY skill_category, skill_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateSkillMastery(params: UpdateSkillMasteryParams): Promise<void> {
    const { userId, skillId, success, confidenceDelta = 0 } = params;

    await pool.query(
      `SELECT update_skill_mastery($1, $2, $3, $4)`,
      [userId, skillId, success, confidenceDelta]
    );
  }

  async getUserSkillMastery(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT usm.*, s.skill_name, s.skill_category
      FROM user_skill_mastery usm
      JOIN skills s ON usm.skill_id = s.id
      WHERE usm.user_id = $1
      ORDER BY usm.mastery_percentage DESC, s.skill_name`,
      [userId]
    );

    return result.rows;
  }

  async getSkillMasteryByLevel(userId: string, level: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT usm.*, s.skill_name, s.skill_category
      FROM user_skill_mastery usm
      JOIN skills s ON usm.skill_id = s.id
      WHERE usm.user_id = $1 AND usm.mastery_level = $2
      ORDER BY usm.mastery_percentage DESC`,
      [userId, level]
    );

    return result.rows;
  }

  // ========================================
  // LEARNING VELOCITY
  // ========================================

  async calculateLearningVelocity(userId: string, weekStartDate?: Date): Promise<void> {
    const dateStr = weekStartDate
      ? weekStartDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    await pool.query(`SELECT calculate_learning_velocity($1, $2)`, [userId, dateStr]);
  }

  async getLearningVelocity(userId: string, weeks: number = 12): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM learning_velocity
      WHERE user_id = $1
      ORDER BY week_start_date DESC
      LIMIT $2`,
      [userId, weeks]
    );

    return result.rows;
  }

  // ========================================
  // PERFORMANCE TRENDS
  // ========================================

  async updatePerformanceTrend(userId: string, courseId: string, date: Date, avgScore: number): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    // Determine trend by comparing to previous performance
    const prevResult = await pool.query(
      `SELECT avg_score FROM performance_trends
      WHERE user_id = $1 AND course_id = $2 AND date < $3
      ORDER BY date DESC LIMIT 1`,
      [userId, courseId, dateStr]
    );

    let trend = 'stable';
    if (prevResult.rows.length > 0) {
      const prevScore = prevResult.rows[0].avg_score;
      if (avgScore > prevScore * 1.1) {
        trend = 'improving';
      } else if (avgScore < prevScore * 0.9) {
        trend = 'declining';
      }
    }

    await pool.query(
      `INSERT INTO performance_trends (user_id, course_id, date, avg_score, score_trend)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, course_id, date) DO UPDATE SET
        avg_score = $4,
        score_trend = $5`,
      [userId, courseId, dateStr, avgScore, trend]
    );
  }

  async getPerformanceTrends(userId: string, courseId?: string, days: number = 30): Promise<any[]> {
    let query = `SELECT * FROM performance_trends WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (courseId) {
      query += ` AND course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    query += ` AND date >= CURRENT_DATE - INTERVAL '1 day' * $${paramIndex}`;
    params.push(days);

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // LEARNING GOALS
  // ========================================

  async createLearningGoal(params: CreateLearningGoalParams): Promise<any> {
    const {
      userId,
      goalTitle,
      goalDescription,
      goalType,
      targetValue,
      targetUnit,
      targetDate,
      reminderEnabled = true,
      reminderFrequency = 'weekly'
    } = params;

    const result = await pool.query(
      `INSERT INTO learning_goals (
        user_id, goal_title, goal_description, goal_type,
        target_value, target_unit, target_date,
        reminder_enabled, reminder_frequency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        goalTitle,
        goalDescription,
        goalType,
        targetValue,
        targetUnit,
        targetDate,
        reminderEnabled,
        reminderFrequency
      ]
    );

    return result.rows[0];
  }

  async updateLearningGoal(params: UpdateLearningGoalParams): Promise<any> {
    const { goalId, userId, currentValue, isAchieved, goalTitle, targetDate } = params;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (currentValue !== undefined) {
      updates.push(`current_value = $${paramIndex}`);
      values.push(currentValue);
      paramIndex++;

      // Calculate progress percentage
      const goalResult = await pool.query(
        `SELECT target_value FROM learning_goals WHERE id = $1`,
        [goalId]
      );
      if (goalResult.rows.length > 0) {
        const targetValue = goalResult.rows[0].target_value;
        const progressPercentage = Math.min(100, (currentValue / targetValue) * 100);
        updates.push(`progress_percentage = $${paramIndex}`);
        values.push(progressPercentage);
        paramIndex++;
      }
    }

    if (isAchieved !== undefined) {
      updates.push(`is_achieved = $${paramIndex}`);
      values.push(isAchieved);
      paramIndex++;

      if (isAchieved) {
        updates.push(`achieved_at = NOW()`);
      }
    }

    if (goalTitle !== undefined) {
      updates.push(`goal_title = $${paramIndex}`);
      values.push(goalTitle);
      paramIndex++;
    }

    if (targetDate !== undefined) {
      updates.push(`target_date = $${paramIndex}`);
      values.push(targetDate);
      paramIndex++;
    }

    if (updates.length === 0) {
      const result = await pool.query(
        `SELECT * FROM learning_goals WHERE id = $1 AND user_id = $2`,
        [goalId, userId]
      );
      return result.rows[0];
    }

    updates.push('last_updated_at = NOW()');
    updates.push('updated_at = NOW()');
    values.push(goalId, userId);

    const result = await pool.query(
      `UPDATE learning_goals SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async getUserLearningGoals(userId: string, includeAchieved: boolean = true): Promise<any[]> {
    let query = `SELECT * FROM learning_goals WHERE user_id = $1`;
    const params: any[] = [userId];

    if (!includeAchieved) {
      query += ` AND is_achieved = false`;
    }

    query += ` ORDER BY target_date NULLS LAST, created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async deleteLearningGoal(goalId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM learning_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );
  }

  // ========================================
  // TIME TRACKING
  // ========================================

  async startTimeTracking(userId: string, contentType: string, contentId: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO time_tracking (user_id, content_type, content_id)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, contentType, contentId]
    );

    return result.rows[0];
  }

  async endTimeTracking(trackingId: string, completionPercentage?: number): Promise<void> {
    await pool.query(
      `UPDATE time_tracking SET
        end_time = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
        completion_percentage = COALESCE($2, completion_percentage)
      WHERE id = $1`,
      [trackingId, completionPercentage]
    );
  }

  async getUserTimeTracking(userId: string, contentType?: string, limit: number = 100): Promise<any[]> {
    let query = `SELECT * FROM time_tracking WHERE user_id = $1`;
    const params: any[] = [userId];

    if (contentType) {
      query += ` AND content_type = $2`;
      params.push(contentType);
    }

    query += ` ORDER BY start_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // LEARNING PATTERNS
  // ========================================

  async analyzeLearningPatterns(userId: string): Promise<any> {
    // This would typically involve complex analysis
    // For now, we'll create a basic pattern analysis

    // Get session data
    const sessionsResult = await pool.query(
      `SELECT
        EXTRACT(HOUR FROM session_start) as hour,
        EXTRACT(DOW FROM session_start) as day_of_week,
        duration_minutes,
        device_type
      FROM learning_sessions
      WHERE user_id = $1 AND session_start >= NOW() - INTERVAL '90 days'`,
      [userId]
    );

    const sessions = sessionsResult.rows;

    if (sessions.length === 0) {
      return null;
    }

    // Analyze preferred learning time
    const hourCounts = new Map();
    sessions.forEach(s => {
      const hour = parseInt(s.hour);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    let preferredTime = 'morning';
    const maxHour = Array.from(hourCounts.entries()).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    if (maxHour >= 6 && maxHour < 12) preferredTime = 'morning';
    else if (maxHour >= 12 && maxHour < 18) preferredTime = 'afternoon';
    else if (maxHour >= 18 && maxHour < 22) preferredTime = 'evening';
    else preferredTime = 'night';

    // Average session duration
    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length;

    // Peak productivity day
    const dayCounts = new Map();
    sessions.forEach(s => {
      const day = parseInt(s.day_of_week);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const peakDay = daysOfWeek[Array.from(dayCounts.entries()).reduce((a, b) => (a[1] > b[1] ? a : b))[0]];

    // Upsert pattern
    await pool.query(
      `INSERT INTO learning_patterns (
        user_id, preferred_learning_time, avg_session_duration_minutes,
        peak_productivity_day, analysis_start_date, analysis_end_date
      )
      VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE)
      ON CONFLICT (user_id) DO UPDATE SET
        preferred_learning_time = $2,
        avg_session_duration_minutes = $3,
        peak_productivity_day = $4,
        analysis_end_date = CURRENT_DATE,
        updated_at = NOW()`,
      [userId, preferredTime, Math.round(avgDuration), peakDay]
    );

    return await this.getLearningPatterns(userId);
  }

  async getLearningPatterns(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM learning_patterns WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  // ========================================
  // ANALYTICS REPORTS
  // ========================================

  async getComprehensiveUserAnalytics(userId: string): Promise<any> {
    const [summary, metrics, skills, velocity, goals, patterns] = await Promise.all([
      this.getUserLearningSummary(userId),
      this.getLearningMetrics(userId, 30),
      this.getUserSkillMastery(userId),
      this.getLearningVelocity(userId, 12),
      this.getUserLearningGoals(userId, false),
      this.getLearningPatterns(userId)
    ]);

    return {
      summary,
      recentMetrics: metrics.slice(0, 7),
      topSkills: skills.slice(0, 10),
      velocityTrend: velocity,
      activeGoals: goals,
      learningPatterns: patterns
    };
  }
}

export const learningAnalyticsService = new LearningAnalyticsService();
