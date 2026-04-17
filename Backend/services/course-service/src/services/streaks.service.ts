import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LogStreakActivityParams {
  userId: string;
  activityDate?: Date;
  activityType: string;
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
}

interface CreateDailyChallengeParams {
  challengeName: string;
  challengeCode: string;
  description: string;
  challengeType: string;
  difficulty?: string;
  targetCount: number;
  pointsReward?: number;
  xpReward?: number;
}

interface CreateStreakMilestoneParams {
  milestoneName: string;
  milestoneCode: string;
  daysRequired: number;
  pointsReward?: number;
  xpReward?: number;
  streakFreezeReward?: number;
}

// ============================================================================
// STREAKS SERVICE
// ============================================================================

export class StreaksService {
  // ========================================
  // STREAK TRACKING
  // ========================================

  async getUserStreak(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_streaks WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create initial streak record
      const createResult = await pool.query(
        `INSERT INTO user_streaks (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  }

  async logStreakActivity(params: LogStreakActivityParams): Promise<void> {
    const {
      userId,
      activityDate = new Date(),
      activityType,
      courseId,
      lessonId,
      assessmentId
    } = params;

    const activityDateStr = activityDate.toISOString().split('T')[0];

    // Insert activity
    await pool.query(
      `INSERT INTO streak_activities (
        user_id, activity_date, activity_type, course_id, lesson_id, assessment_id, activity_count
      ) VALUES ($1, $2, $3, $4, $5, $6, 1)
      ON CONFLICT (user_id, activity_date)
      DO UPDATE SET activity_count = streak_activities.activity_count + 1, created_at = NOW()`,
      [userId, activityDateStr, activityType, courseId, lessonId, assessmentId]
    );

    // Update streak
    await pool.query(
      `SELECT update_user_streak($1, $2)`,
      [userId, activityDateStr]
    );
  }

  async useStreakFreeze(userId: string, freezeDate?: Date): Promise<any> {
    const dateStr = freezeDate ? freezeDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Check if user has freezes available
    const streak = await this.getUserStreak(userId);

    if (streak.streak_freezes_available <= 0) {
      throw new Error('No streak freezes available');
    }

    // Use freeze
    await pool.query(
      `UPDATE user_streaks
      SET streak_freezes_available = streak_freezes_available - 1,
          streak_freezes_used = streak_freezes_used + 1,
          last_freeze_used_date = $1
      WHERE user_id = $2`,
      [dateStr, userId]
    );

    // Log freeze usage
    await pool.query(
      `INSERT INTO streak_freeze_log (user_id, freeze_date, freeze_type, reason)
      VALUES ($1, $2, $3, $4)`,
      [userId, dateStr, 'manual', 'Manual freeze used by user']
    );

    return await this.getUserStreak(userId);
  }

  async getStreakHistory(userId: string, days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM streak_activities
      WHERE user_id = $1
        AND activity_date >= CURRENT_DATE - INTERVAL '1 day' * $2
      ORDER BY activity_date DESC`,
      [userId, days]
    );
    return result.rows;
  }

  async getStreakLeaderboard(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM current_streak_leaders LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // ========================================
  // STREAK MILESTONES
  // ========================================

  async createStreakMilestone(params: CreateStreakMilestoneParams): Promise<any> {
    const {
      milestoneName,
      milestoneCode,
      daysRequired,
      pointsReward = 0,
      xpReward = 0,
      streakFreezeReward = 0
    } = params;

    const result = await pool.query(
      `INSERT INTO streak_milestones (
        milestone_name, milestone_code, days_required,
        points_reward, xp_reward, streak_freeze_reward
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [milestoneName, milestoneCode, daysRequired, pointsReward, xpReward, streakFreezeReward]
    );

    return result.rows[0];
  }

  async listStreakMilestones(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM streak_milestones WHERE is_active = true ORDER BY days_required`
    );
    return result.rows;
  }

  async getUserMilestones(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT usm.*, sm.milestone_name, sm.days_required, sm.points_reward, sm.xp_reward
      FROM user_streak_milestones usm
      JOIN streak_milestones sm ON usm.milestone_id = sm.id
      WHERE usm.user_id = $1
      ORDER BY usm.achieved_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // ========================================
  // DAILY CHALLENGES
  // ========================================

  async createDailyChallenge(params: CreateDailyChallengeParams): Promise<any> {
    const {
      challengeName,
      challengeCode,
      description,
      challengeType,
      difficulty = 'easy',
      targetCount,
      pointsReward = 0,
      xpReward = 0
    } = params;

    const result = await pool.query(
      `INSERT INTO daily_challenges (
        challenge_name, challenge_code, description, challenge_type,
        difficulty, target_count, points_reward, xp_reward
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [challengeName, challengeCode, description, challengeType, difficulty, targetCount, pointsReward, xpReward]
    );

    return result.rows[0];
  }

  async listDailyChallenges(filters: any = {}): Promise<any[]> {
    const { challengeType, difficulty, isActive = true } = filters;

    let query = `SELECT * FROM daily_challenges WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (challengeType) {
      query += ` AND challenge_type = $${paramIndex}`;
      params.push(challengeType);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY difficulty, created_at`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async assignDailyChallenges(userId: string): Promise<void> {
    await pool.query(`SELECT assign_daily_challenges($1)`, [userId]);
  }

  async getUserDailyChallenges(userId: string, date?: Date): Promise<any[]> {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT udc.*, dc.challenge_name, dc.description, dc.challenge_type, dc.difficulty
      FROM user_daily_challenges udc
      JOIN daily_challenges dc ON udc.challenge_id = dc.id
      WHERE udc.user_id = $1 AND udc.assigned_date = $2
      ORDER BY dc.difficulty`,
      [userId, dateStr]
    );

    return result.rows;
  }

  async updateChallengeProgress(userId: string, challengeType: string, increment: number = 1): Promise<void> {
    await pool.query(
      `SELECT update_challenge_progress($1, $2, $3)`,
      [userId, challengeType, increment]
    );
  }

  async skipChallenge(userId: string, userChallengeId: string): Promise<void> {
    await pool.query(
      `UPDATE user_daily_challenges SET status = 'skipped', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [userChallengeId, userId]
    );
  }

  async getChallengeStats(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_challenges,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_challenges,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_challenges,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_challenges,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate,
        SUM(points_earned) as total_points_earned,
        SUM(xp_earned) as total_xp_earned
      FROM user_daily_challenges
      WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  async getActiveChallengesSummary(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_daily_challenges_summary ORDER BY completion_rate DESC`
    );
    return result.rows;
  }

  // ========================================
  // STREAK STATS
  // ========================================

  async getUserStreakStats(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_streak_stats WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  async updateStreakReminders(userId: string, enabled: boolean, reminderTime?: string): Promise<void> {
    const updates: string[] = ['reminder_enabled = $1'];
    const params: any[] = [enabled];
    let paramIndex = 2;

    if (reminderTime) {
      updates.push(`reminder_time = $${paramIndex}`);
      params.push(reminderTime);
      paramIndex++;
    }

    params.push(userId);

    await pool.query(
      `UPDATE user_streaks SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
      params
    );
  }

  // ========================================
  // MAINTENANCE
  // ========================================

  async expireOldChallenges(): Promise<void> {
    await pool.query(`SELECT expire_old_challenges()`);
  }

  async getUsersNeedingReminders(): Promise<any[]> {
    const result = await pool.query(
      `SELECT us.user_id, u.email, us.current_streak, us.reminder_time
      FROM user_streaks us
      JOIN users u ON us.user_id = u.id
      WHERE us.reminder_enabled = true
        AND us.last_activity_date < CURRENT_DATE
        AND (us.last_reminder_sent_at IS NULL OR us.last_reminder_sent_at < CURRENT_DATE)
        AND CURRENT_TIME >= us.reminder_time`
    );
    return result.rows;
  }

  async markReminderSent(userId: string): Promise<void> {
    await pool.query(
      `UPDATE user_streaks SET last_reminder_sent_at = NOW() WHERE user_id = $1`,
      [userId]
    );
  }
}

export const streaksService = new StreaksService();
