import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GetLeaderboardParams {
  leaderboardType: string;
  scopeType?: string;
  courseId?: string;
  organizationId?: string;
  timePeriod?: string;
  limit?: number;
  offset?: number;
}

interface CreateCompetitionParams {
  competitionName: string;
  competitionCode: string;
  description: string;
  competitionType: string;
  startDate: Date;
  endDate: Date;
  winningMetric: string;
  courseIds?: string[];
  maxParticipants?: number;
  entryFeePoints?: number;
  prizePool?: any[];
  createdBy: string;
}

// ============================================================================
// LEADERBOARDS SERVICE
// ============================================================================

export class LeaderboardsService {
  // ========================================
  // LEADERBOARDS
  // ========================================

  async getLeaderboard(params: GetLeaderboardParams): Promise<any> {
    const {
      leaderboardType,
      scopeType = 'global',
      courseId,
      organizationId,
      timePeriod = 'all_time',
      limit = 100,
      offset = 0
    } = params;

    // Find or create leaderboard definition
    let leaderboard: any;

    const leaderboardQuery = `
      SELECT * FROM leaderboards
      WHERE leaderboard_type = $1
        AND scope_type = $2
        AND time_period = $3
        AND ($4::UUID IS NULL OR course_id = $4)
        AND ($5::UUID IS NULL OR organization_id = $5)
        AND is_active = true
      LIMIT 1
    `;

    const result = await pool.query(leaderboardQuery, [
      leaderboardType,
      scopeType,
      timePeriod,
      courseId || null,
      organizationId || null
    ]);

    if (result.rows.length > 0) {
      leaderboard = result.rows[0];
    } else {
      // Create default leaderboard
      const leaderboardCode = `${leaderboardType}_${scopeType}_${timePeriod}${courseId ? `_${courseId}` : ''}`;
      const createResult = await pool.query(
        `INSERT INTO leaderboards (
          leaderboard_name, leaderboard_code, leaderboard_type, scope_type,
          time_period, course_id, organization_id, ranking_metric
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          `${leaderboardType} Leaderboard`,
          leaderboardCode,
          leaderboardType,
          scopeType,
          timePeriod,
          courseId,
          organizationId,
          leaderboardType === 'points' ? 'total_points' : 'total_xp'
        ]
      );
      leaderboard = createResult.rows[0];
    }

    // Get entries
    const entriesResult = await pool.query(
      `SELECT * FROM leaderboard_entries
      WHERE leaderboard_id = $1
        AND is_hidden = false
      ORDER BY rank
      LIMIT $2 OFFSET $3`,
      [leaderboard.id, limit, offset]
    );

    return {
      leaderboard,
      entries: entriesResult.rows
    };
  }

  async getGlobalPointsLeaderboard(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM global_points_leaderboard LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getGlobalXPLeaderboard(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM global_xp_leaderboard LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getGlobalStreakLeaderboard(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM global_streak_leaderboard LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getCourseCompletionLeaderboard(courseId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM course_completion_leaderboard WHERE course_id = $1 LIMIT $2`,
      [courseId, limit]
    );
    return result.rows;
  }

  async getUserRank(leaderboardId: string, userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM get_user_rank($1, $2)`,
      [leaderboardId, userId]
    );
    return result.rows[0];
  }

  async upsertLeaderboardEntry(leaderboardId: string, userId: string, score: number, metrics: any = {}): Promise<string> {
    const result = await pool.query(
      `SELECT upsert_leaderboard_entry($1, $2, $3, $4) as entry_id`,
      [leaderboardId, userId, score, JSON.stringify(metrics)]
    );
    return result.rows[0].entry_id;
  }

  async getUserLeaderboardPositions(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        le.leaderboard_id,
        l.leaderboard_name,
        l.leaderboard_type,
        l.scope_type,
        le.rank,
        le.score,
        le.rank_change
      FROM leaderboard_entries le
      JOIN leaderboards l ON le.leaderboard_id = l.id
      WHERE le.user_id = $1
        AND l.is_active = true
      ORDER BY le.rank`,
      [userId]
    );
    return result.rows;
  }

  // ========================================
  // PRIVACY SETTINGS
  // ========================================

  async getUserPrivacySettings(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM leaderboard_privacy_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      const createResult = await pool.query(
        `INSERT INTO leaderboard_privacy_settings (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  }

  async updatePrivacySettings(userId: string, settings: any): Promise<any> {
    const allowedFields = [
      'show_on_global_leaderboards',
      'show_on_course_leaderboards',
      'show_on_org_leaderboards',
      'use_real_name',
      'use_anonymous_name',
      'anonymous_display_name',
      'allow_competition_invites',
      'auto_join_course_competitions'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(settings).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(settings[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const result = await pool.query(
      `INSERT INTO leaderboard_privacy_settings (user_id, ${fields.map((_, i) => allowedFields[i]).join(', ')})
      VALUES ($${paramIndex}, ${fields.map((_, i) => `$${i + 1}`).join(', ')})
      ON CONFLICT (user_id)
      DO UPDATE SET ${fields.join(', ')}, updated_at = NOW()
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // COMPETITIONS
  // ========================================

  async createCompetition(params: CreateCompetitionParams): Promise<any> {
    const {
      competitionName,
      competitionCode,
      description,
      competitionType,
      startDate,
      endDate,
      winningMetric,
      courseIds,
      maxParticipants,
      entryFeePoints = 0,
      prizePool,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO competitions (
        competition_name, competition_code, description, competition_type,
        start_date, end_date, winning_metric, course_ids, max_participants,
        entry_fee_points, prize_pool, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        competitionName, competitionCode, description, competitionType,
        startDate, endDate, winningMetric, courseIds || [],
        maxParticipants, entryFeePoints, JSON.stringify(prizePool || []), createdBy
      ]
    );

    return result.rows[0];
  }

  async getCompetition(competitionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM competitions WHERE id = $1`,
      [competitionId]
    );
    return result.rows[0];
  }

  async listCompetitions(filters: any = {}): Promise<any[]> {
    const { status, competitionType, isActive, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM competitions WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (competitionType) {
      query += ` AND competition_type = $${paramIndex}`;
      params.push(competitionType);
      paramIndex++;
    }

    query += ` ORDER BY start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getActiveCompetitions(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_competitions_summary ORDER BY start_date`
    );
    return result.rows;
  }

  async joinCompetition(userId: string, competitionId: string): Promise<any> {
    const competition = await this.getCompetition(competitionId);

    if (!competition) {
      throw new Error('Competition not found');
    }

    if (competition.status !== 'active' && competition.status !== 'upcoming') {
      throw new Error('Competition is not open for registration');
    }

    if (competition.max_participants && competition.current_participants >= competition.max_participants) {
      throw new Error('Competition is full');
    }

    // Check entry fee
    if (competition.entry_fee_points > 0) {
      const userPoints = await pool.query(
        `SELECT available_points FROM user_points WHERE user_id = $1`,
        [userId]
      );

      if (userPoints.rows.length === 0 || userPoints.rows[0].available_points < competition.entry_fee_points) {
        throw new Error('Insufficient points for entry fee');
      }

      // Deduct entry fee
      await pool.query(
        `UPDATE user_points SET available_points = available_points - $1 WHERE user_id = $2`,
        [competition.entry_fee_points, userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO competition_participants (competition_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (competition_id, user_id) DO NOTHING
      RETURNING *`,
      [competitionId, userId]
    );

    return result.rows[0];
  }

  async getCompetitionParticipants(competitionId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT
        cp.*,
        u.email,
        u.first_name || ' ' || u.last_name as full_name
      FROM competition_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.competition_id = $1
        AND cp.registration_status != 'withdrawn'
      ORDER BY cp.current_rank NULLS LAST, cp.current_score DESC
      LIMIT $2`,
      [competitionId, limit]
    );
    return result.rows;
  }

  async updateCompetitionScore(competitionId: string, userId: string, score: number, metrics: any = {}): Promise<any> {
    const result = await pool.query(
      `UPDATE competition_participants
      SET current_score = $1, metrics = $2, updated_at = NOW()
      WHERE competition_id = $3 AND user_id = $4
      RETURNING *`,
      [score, JSON.stringify(metrics), competitionId, userId]
    );

    // Recalculate ranks
    await this.updateCompetitionRankings(competitionId);

    return result.rows[0];
  }

  async updateCompetitionRankings(competitionId: string): Promise<void> {
    await pool.query(
      `UPDATE competition_participants cp
      SET current_rank = subquery.rank
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY current_score DESC) as rank
        FROM competition_participants
        WHERE competition_id = $1
      ) AS subquery
      WHERE cp.id = subquery.id`,
      [competitionId]
    );
  }

  async withdrawFromCompetition(userId: string, competitionId: string): Promise<void> {
    await pool.query(
      `UPDATE competition_participants
      SET registration_status = 'withdrawn', updated_at = NOW()
      WHERE competition_id = $1 AND user_id = $2`,
      [competitionId, userId]
    );
  }

  async getUserCompetitions(userId: string, status?: string): Promise<any[]> {
    let query = `
      SELECT
        c.*,
        cp.current_score,
        cp.current_rank,
        cp.registration_status
      FROM competition_participants cp
      JOIN competitions c ON cp.competition_id = c.id
      WHERE cp.user_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY c.start_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // SNAPSHOTS
  // ========================================

  async createRankingSnapshot(): Promise<void> {
    await pool.query(`SELECT create_ranking_snapshot()`);
  }

  async getUserRankingHistory(userId: string, leaderboardId: string, days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM ranking_snapshots
      WHERE user_id = $1
        AND leaderboard_id = $2
        AND snapshot_date >= CURRENT_DATE - INTERVAL '1 day' * $3
      ORDER BY snapshot_date DESC`,
      [userId, leaderboardId, days]
    );
    return result.rows;
  }
}

export const leaderboardsService = new LeaderboardsService();
