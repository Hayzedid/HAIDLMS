import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AwardPointsParams {
  userId: string;
  points: number;
  xp: number;
  transactionType?: string;
  sourceType: string;
  sourceId?: string;
  description: string;
}

interface CreateAchievementParams {
  achievementName: string;
  achievementCode: string;
  description: string;
  category: string;
  difficulty?: string;
  criteria: any;
  criteriaDescription: string;
  pointsReward?: number;
  xpReward?: number;
  badgeId?: string;
  isProgressive?: boolean;
  totalSteps?: number;
}

interface CreateRewardParams {
  rewardName: string;
  rewardCode: string;
  description: string;
  rewardType: string;
  pointsCost: number;
  rewardValue: any;
  stockQuantity?: number;
  minLevelRequired?: number;
}

interface CreateQuestParams {
  questName: string;
  questCode: string;
  description: string;
  questType: string;
  difficulty?: string;
  objectives: any[];
  pointsReward?: number;
  xpReward?: number;
  isRepeatable?: boolean;
}

// ============================================================================
// GAMIFICATION SERVICE
// ============================================================================

export class GamificationService {
  // ========================================
  // POINTS & XP
  // ========================================

  async getUserPoints(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_points WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create initial record
      const createResult = await pool.query(
        `INSERT INTO user_points (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  }

  async awardPoints(params: AwardPointsParams): Promise<string> {
    const {
      userId,
      points,
      xp,
      transactionType = 'earned',
      sourceType,
      sourceId,
      description
    } = params;

    const result = await pool.query(
      `SELECT award_points($1, $2, $3, $4, $5, $6, $7) as transaction_id`,
      [userId, points, xp, transactionType, sourceType, sourceId, description]
    );

    return result.rows[0].transaction_id;
  }

  async spendPoints(userId: string, points: number, description: string, rewardId?: string): Promise<string> {
    // Check if user has enough points
    const userPoints = await this.getUserPoints(userId);

    if (userPoints.available_points < points) {
      throw new Error('Insufficient points');
    }

    // Deduct points
    await pool.query(
      `UPDATE user_points SET available_points = available_points - $1, updated_at = NOW() WHERE user_id = $2`,
      [points, userId]
    );

    // Create transaction
    const result = await pool.query(
      `INSERT INTO point_transactions (
        user_id, transaction_type, points_change, source_type, source_id,
        description, points_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [userId, 'spent', -points, 'reward', rewardId, description, userPoints.available_points - points]
    );

    return result.rows[0].id;
  }

  async getPointTransactions(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM point_transactions WHERE user_id = $1`,
      [userId]
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  async getLevelDefinitions(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM level_definitions ORDER BY level_number`
    );
    return result.rows;
  }

  async createLevelDefinition(params: any): Promise<any> {
    const { levelNumber, levelName, xpRequired, xpToNext, rewards, unlockedFeatures } = params;

    const result = await pool.query(
      `INSERT INTO level_definitions (
        level_number, level_name, xp_required, xp_to_next, rewards, unlocked_features
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [levelNumber, levelName, xpRequired, xpToNext, JSON.stringify(rewards), JSON.stringify(unlockedFeatures)]
    );

    return result.rows[0];
  }

  // ========================================
  // ACHIEVEMENTS
  // ========================================

  async createAchievement(params: CreateAchievementParams): Promise<any> {
    const {
      achievementName,
      achievementCode,
      description,
      category,
      difficulty = 'common',
      criteria,
      criteriaDescription,
      pointsReward = 0,
      xpReward = 0,
      badgeId,
      isProgressive = false,
      totalSteps
    } = params;

    const result = await pool.query(
      `INSERT INTO achievements (
        achievement_name, achievement_code, description, category, difficulty,
        criteria, criteria_description, points_reward, xp_reward, badge_id,
        is_progressive, total_steps
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        achievementName, achievementCode, description, category, difficulty,
        JSON.stringify(criteria), criteriaDescription, pointsReward, xpReward, badgeId,
        isProgressive, totalSteps
      ]
    );

    return result.rows[0];
  }

  async getAchievement(achievementId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM achievements WHERE id = $1`,
      [achievementId]
    );
    return result.rows[0];
  }

  async listAchievements(filters: any = {}): Promise<any[]> {
    const { category, difficulty, isActive = true, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM achievements WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
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

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT ua.*, a.achievement_name, a.description, a.icon_url, a.category, a.difficulty
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.completed_at DESC NULLS LAST, ua.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async completeAchievement(userId: string, achievementId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT complete_achievement($1, $2) as completed`,
      [userId, achievementId]
    );
    return result.rows[0].completed;
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET progress = $3, updated_at = NOW()
      RETURNING *`,
      [userId, achievementId, progress]
    );

    return result.rows[0];
  }

  // ========================================
  // REWARDS
  // ========================================

  async createReward(params: CreateRewardParams): Promise<any> {
    const {
      rewardName,
      rewardCode,
      description,
      rewardType,
      pointsCost,
      rewardValue,
      stockQuantity,
      minLevelRequired = 1
    } = params;

    const result = await pool.query(
      `INSERT INTO rewards (
        reward_name, reward_code, description, reward_type, points_cost,
        reward_value, stock_quantity, stock_remaining, min_level_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        rewardName, rewardCode, description, rewardType, pointsCost,
        JSON.stringify(rewardValue), stockQuantity, stockQuantity, minLevelRequired
      ]
    );

    return result.rows[0];
  }

  async getReward(rewardId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM rewards WHERE id = $1`,
      [rewardId]
    );
    return result.rows[0];
  }

  async listRewards(filters: any = {}): Promise<any[]> {
    const { rewardType, isActive = true, minPoints, maxPoints, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM rewards WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (rewardType) {
      query += ` AND reward_type = $${paramIndex}`;
      params.push(rewardType);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (minPoints) {
      query += ` AND points_cost >= $${paramIndex}`;
      params.push(minPoints);
      paramIndex++;
    }

    if (maxPoints) {
      query += ` AND points_cost <= $${paramIndex}`;
      params.push(maxPoints);
      paramIndex++;
    }

    query += ` ORDER BY points_cost LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async redeemReward(userId: string, rewardId: string): Promise<any> {
    const reward = await this.getReward(rewardId);

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.is_active) {
      throw new Error('Reward is not available');
    }

    if (reward.stock_remaining !== null && reward.stock_remaining <= 0) {
      throw new Error('Reward is out of stock');
    }

    // Check user level
    const userPoints = await this.getUserPoints(userId);
    if (userPoints.current_level < reward.min_level_required) {
      throw new Error(`Minimum level ${reward.min_level_required} required`);
    }

    // Check user points
    if (userPoints.available_points < reward.points_cost) {
      throw new Error('Insufficient points');
    }

    // Spend points
    await this.spendPoints(userId, reward.points_cost, `Redeemed: ${reward.reward_name}`, rewardId);

    // Update stock
    if (reward.stock_remaining !== null) {
      await pool.query(
        `UPDATE rewards SET stock_remaining = stock_remaining - 1 WHERE id = $1`,
        [rewardId]
      );
    }

    // Create redemption
    const redemptionCode = await pool.query(`SELECT generate_redemption_code() as code`);

    const result = await pool.query(
      `INSERT INTO reward_redemptions (
        redemption_code, user_id, reward_id, points_spent
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [redemptionCode.rows[0].code, userId, rewardId, reward.points_cost]
    );

    return result.rows[0];
  }

  async getUserRedemptions(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT rr.*, r.reward_name, r.reward_type, r.reward_value
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.user_id = $1
      ORDER BY rr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM reward_redemptions WHERE user_id = $1`,
      [userId]
    );

    return {
      redemptions: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  // ========================================
  // QUESTS
  // ========================================

  async createQuest(params: CreateQuestParams): Promise<any> {
    const {
      questName,
      questCode,
      description,
      questType,
      difficulty = 'medium',
      objectives,
      pointsReward = 0,
      xpReward = 0,
      isRepeatable = false
    } = params;

    const result = await pool.query(
      `INSERT INTO quests (
        quest_name, quest_code, description, quest_type, difficulty,
        objectives, total_objectives, points_reward, xp_reward, is_repeatable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        questName, questCode, description, questType, difficulty,
        JSON.stringify(objectives), objectives.length, pointsReward, xpReward, isRepeatable
      ]
    );

    return result.rows[0];
  }

  async getQuest(questId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM quests WHERE id = $1`,
      [questId]
    );
    return result.rows[0];
  }

  async listQuests(filters: any = {}): Promise<any[]> {
    const { questType, difficulty, isActive = true, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM quests WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (questType) {
      query += ` AND quest_type = $${paramIndex}`;
      params.push(questType);
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

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async startQuest(userId: string, questId: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_quests (user_id, quest_id, status)
      VALUES ($1, $2, 'active')
      RETURNING *`,
      [userId, questId]
    );

    return result.rows[0];
  }

  async getUserQuests(userId: string, status?: string): Promise<any[]> {
    let query = `SELECT uq.*, q.quest_name, q.quest_type, q.description, q.objectives, q.points_reward, q.xp_reward
      FROM user_quests uq
      JOIN quests q ON uq.quest_id = q.id
      WHERE uq.user_id = $1`;

    const params: any[] = [userId];

    if (status) {
      query += ` AND uq.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY uq.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateQuestProgress(userQuestId: string, completedObjectives: string[]): Promise<any> {
    const result = await pool.query(
      `UPDATE user_quests
      SET objectives_completed = $1, last_progress_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
      [JSON.stringify(completedObjectives), userQuestId]
    );

    const userQuest = result.rows[0];

    // Check if quest is completed and award rewards
    if (userQuest.status === 'completed') {
      const quest = await this.getQuest(userQuest.quest_id);

      if (quest.points_reward > 0 || quest.xp_reward > 0) {
        await this.awardPoints({
          userId: userQuest.user_id,
          points: quest.points_reward,
          xp: quest.xp_reward,
          sourceType: 'quest',
          sourceId: quest.id,
          description: `Quest completed: ${quest.quest_name}`
        });
      }
    }

    return userQuest;
  }

  // ========================================
  // POWER-UPS
  // ========================================

  async createPowerUp(params: any): Promise<any> {
    const {
      powerUpName,
      powerUpCode,
      description,
      effectType,
      effectValue,
      durationMinutes,
      pointsCost
    } = params;

    const result = await pool.query(
      `INSERT INTO power_ups (
        power_up_name, power_up_code, description, effect_type,
        effect_value, duration_minutes, points_cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [powerUpName, powerUpCode, description, effectType, effectValue, durationMinutes, pointsCost]
    );

    return result.rows[0];
  }

  async listPowerUps(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM power_ups WHERE is_active = true ORDER BY points_cost`
    );
    return result.rows;
  }

  async activatePowerUp(userId: string, powerUpId: string): Promise<any> {
    const powerUp = await pool.query(`SELECT * FROM power_ups WHERE id = $1`, [powerUpId]);

    if (powerUp.rows.length === 0) {
      throw new Error('Power-up not found');
    }

    const powerUpData = powerUp.rows[0];

    // Check user points
    const userPoints = await this.getUserPoints(userId);
    if (userPoints.available_points < powerUpData.points_cost) {
      throw new Error('Insufficient points');
    }

    // Spend points
    await this.spendPoints(userId, powerUpData.points_cost, `Activated: ${powerUpData.power_up_name}`, powerUpId);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + powerUpData.duration_minutes);

    // Activate power-up
    const result = await pool.query(
      `INSERT INTO user_power_ups (user_id, power_up_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, powerUpId, expiresAt]
    );

    return result.rows[0];
  }

  async getUserActivePowerUps(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT upu.*, pu.power_up_name, pu.effect_type, pu.effect_value
      FROM user_power_ups upu
      JOIN power_ups pu ON upu.power_up_id = pu.id
      WHERE upu.user_id = $1
        AND upu.status = 'active'
        AND upu.expires_at > NOW()
      ORDER BY upu.expires_at`,
      [userId]
    );
    return result.rows;
  }
}

export const gamificationService = new GamificationService();
