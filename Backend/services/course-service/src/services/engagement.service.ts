import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UpdateProfileParams {
  userId: string;
  bio?: string;
  tagline?: string;
  location?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  githubUsername?: string;
}

interface UpdateProfileSettingsParams {
  userId: string;
  isPublic?: boolean;
  showEmail?: boolean;
  showProgress?: boolean;
  showAchievements?: boolean;
  allowMessages?: boolean;
  allowFollows?: boolean;
}

interface RecordEngagementParams {
  userId: string;
  engagementType: string;
  targetType: string;
  targetId: string;
  metadata?: any;
}

interface SendKudosParams {
  senderId: string;
  recipientId: string;
  kudosType: string;
  message?: string;
  relatedType?: string;
  relatedId?: string;
  isPublic?: boolean;
}

interface ShareContentParams {
  userId: string;
  targetType: string;
  targetId: string;
  platform: string;
  shareUrl?: string;
  shareMessage?: string;
}

interface BookmarkContentParams {
  userId: string;
  targetType: string;
  targetId: string;
  folderName?: string;
  notes?: string;
}

interface CreateActivityParams {
  userId: string;
  activityType: string;
  activityData: any;
  isPublic?: boolean;
}

// ============================================================================
// ENGAGEMENT SERVICE
// ============================================================================

export class EngagementService {
  // ========================================
  // USER PROFILES
  // ========================================

  async getUserProfile(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create initial profile
      const createResult = await pool.query(
        `INSERT INTO user_profiles (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return createResult.rows[0];
    }

    return result.rows[0];
  }

  async updateProfile(params: UpdateProfileParams): Promise<any> {
    const {
      userId,
      bio,
      tagline,
      location,
      websiteUrl,
      twitterHandle,
      linkedinUrl,
      githubUsername
    } = params;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex}`);
      values.push(bio);
      paramIndex++;
    }

    if (tagline !== undefined) {
      updates.push(`tagline = $${paramIndex}`);
      values.push(tagline);
      paramIndex++;
    }

    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }

    if (websiteUrl !== undefined) {
      updates.push(`website_url = $${paramIndex}`);
      values.push(websiteUrl);
      paramIndex++;
    }

    if (twitterHandle !== undefined) {
      updates.push(`twitter_handle = $${paramIndex}`);
      values.push(twitterHandle);
      paramIndex++;
    }

    if (linkedinUrl !== undefined) {
      updates.push(`linkedin_url = $${paramIndex}`);
      values.push(linkedinUrl);
      paramIndex++;
    }

    if (githubUsername !== undefined) {
      updates.push(`github_username = $${paramIndex}`);
      values.push(githubUsername);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await this.getUserProfile(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const result = await pool.query(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async updateProfileSettings(params: UpdateProfileSettingsParams): Promise<any> {
    const {
      userId,
      isPublic,
      showEmail,
      showProgress,
      showAchievements,
      allowMessages,
      allowFollows
    } = params;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      values.push(isPublic);
      paramIndex++;
    }

    if (showEmail !== undefined) {
      updates.push(`show_email = $${paramIndex}`);
      values.push(showEmail);
      paramIndex++;
    }

    if (showProgress !== undefined) {
      updates.push(`show_progress = $${paramIndex}`);
      values.push(showProgress);
      paramIndex++;
    }

    if (showAchievements !== undefined) {
      updates.push(`show_achievements = $${paramIndex}`);
      values.push(showAchievements);
      paramIndex++;
    }

    if (allowMessages !== undefined) {
      updates.push(`allow_messages = $${paramIndex}`);
      values.push(allowMessages);
      paramIndex++;
    }

    if (allowFollows !== undefined) {
      updates.push(`allow_follows = $${paramIndex}`);
      values.push(allowFollows);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await this.getUserProfile(userId);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const result = await pool.query(
      `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // FOLLOWS
  // ========================================

  async followUser(followerId: string, followingId: string): Promise<any> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    await pool.query(
      `SELECT follow_user($1, $2)`,
      [followerId, followingId]
    );

    return { success: true, message: 'User followed successfully' };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<any> {
    const result = await pool.query(
      `SELECT unfollow_user($1, $2) as success`,
      [followerId, followingId]
    );

    if (!result.rows[0].success) {
      throw new Error('Not following this user');
    }

    return { success: true, message: 'User unfollowed successfully' };
  }

  async getFollowers(userId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT uf.*, u.full_name, u.email, up.tagline, up.followers_count
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      LEFT JOIN user_profiles up ON uf.follower_id = up.user_id
      WHERE uf.following_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getFollowing(userId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT uf.*, u.full_name, u.email, up.tagline, up.followers_count
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      LEFT JOIN user_profiles up ON uf.following_id = up.user_id
      WHERE uf.follower_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2
      ) as is_following`,
      [followerId, followingId]
    );

    return result.rows[0].is_following;
  }

  // ========================================
  // ENGAGEMENT ACTIVITIES
  // ========================================

  async recordEngagement(params: RecordEngagementParams): Promise<any> {
    const { userId, engagementType, targetType, targetId, metadata } = params;

    const result = await pool.query(
      `SELECT record_engagement($1, $2, $3, $4, $5) as engagement_id`,
      [userId, engagementType, targetType, targetId, metadata ? JSON.stringify(metadata) : null]
    );

    return { engagementId: result.rows[0].engagement_id };
  }

  async removeEngagement(userId: string, engagementType: string, targetType: string, targetId: string): Promise<void> {
    await pool.query(
      `DELETE FROM engagement_activities
      WHERE user_id = $1 AND engagement_type = $2 AND target_type = $3 AND target_id = $4`,
      [userId, engagementType, targetType, targetId]
    );
  }

  async getEngagementStats(targetType: string, targetId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE engagement_type = 'like') as likes_count,
        COUNT(*) FILTER (WHERE engagement_type = 'view') as views_count,
        COUNT(*) FILTER (WHERE engagement_type = 'share') as shares_count,
        COUNT(*) FILTER (WHERE engagement_type = 'bookmark') as bookmarks_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM engagement_activities
      WHERE target_type = $1 AND target_id = $2`,
      [targetType, targetId]
    );

    return result.rows[0];
  }

  async hasUserEngaged(userId: string, engagementType: string, targetType: string, targetId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM engagement_activities
        WHERE user_id = $1 AND engagement_type = $2 AND target_type = $3 AND target_id = $4
      ) as has_engaged`,
      [userId, engagementType, targetType, targetId]
    );

    return result.rows[0].has_engaged;
  }

  // ========================================
  // KUDOS
  // ========================================

  async sendKudos(params: SendKudosParams): Promise<any> {
    const {
      senderId,
      recipientId,
      kudosType,
      message,
      relatedType,
      relatedId,
      isPublic = true
    } = params;

    if (senderId === recipientId) {
      throw new Error('Cannot send kudos to yourself');
    }

    const result = await pool.query(
      `INSERT INTO kudos (sender_id, recipient_id, kudos_type, message, related_type, related_id, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [senderId, recipientId, kudosType, message, relatedType, relatedId, isPublic]
    );

    // Add to activity feed
    await this.createActivity({
      userId: recipientId,
      activityType: 'kudos_received',
      activityData: {
        kudos_id: result.rows[0].id,
        sender_id: senderId,
        kudos_type: kudosType,
        message
      },
      isPublic
    });

    return result.rows[0];
  }

  async getReceivedKudos(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT k.*, u.full_name as sender_name, u.email as sender_email
      FROM kudos k
      JOIN users u ON k.sender_id = u.id
      WHERE k.recipient_id = $1
      ORDER BY k.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getSentKudos(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT k.*, u.full_name as recipient_name, u.email as recipient_email
      FROM kudos k
      JOIN users u ON k.recipient_id = u.id
      WHERE k.sender_id = $1
      ORDER BY k.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // CONTENT SHARING
  // ========================================

  async shareContent(params: ShareContentParams): Promise<any> {
    const { userId, targetType, targetId, platform, shareUrl, shareMessage } = params;

    const result = await pool.query(
      `INSERT INTO content_shares (user_id, target_type, target_id, platform, share_url, share_message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, targetType, targetId, platform, shareUrl, shareMessage]
    );

    // Record as engagement activity
    await this.recordEngagement({
      userId,
      engagementType: 'share',
      targetType,
      targetId,
      metadata: { platform, share_url: shareUrl }
    });

    return result.rows[0];
  }

  async getUserShares(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM content_shares
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // BOOKMARKS
  // ========================================

  async bookmarkContent(params: BookmarkContentParams): Promise<any> {
    const { userId, targetType, targetId, folderName, notes } = params;

    const result = await pool.query(
      `INSERT INTO user_bookmarks (user_id, target_type, target_id, folder_name, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET
        folder_name = COALESCE($4, user_bookmarks.folder_name),
        notes = COALESCE($5, user_bookmarks.notes)
      RETURNING *`,
      [userId, targetType, targetId, folderName, notes]
    );

    // Record as engagement activity
    await this.recordEngagement({
      userId,
      engagementType: 'bookmark',
      targetType,
      targetId
    });

    return result.rows[0];
  }

  async removeBookmark(userId: string, targetType: string, targetId: string): Promise<void> {
    await pool.query(
      `DELETE FROM user_bookmarks
      WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
      [userId, targetType, targetId]
    );

    await this.removeEngagement(userId, 'bookmark', targetType, targetId);
  }

  async getUserBookmarks(userId: string, folderName?: string, limit: number = 100): Promise<any[]> {
    let query = `SELECT * FROM user_bookmarks WHERE user_id = $1`;
    const params: any[] = [userId];

    if (folderName) {
      query += ` AND folder_name = $2`;
      params.push(folderName);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getBookmarkFolders(userId: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT folder_name FROM user_bookmarks
      WHERE user_id = $1 AND folder_name IS NOT NULL
      ORDER BY folder_name`,
      [userId]
    );

    return result.rows.map(row => row.folder_name);
  }

  // ========================================
  // ACTIVITY FEED
  // ========================================

  async createActivity(params: CreateActivityParams): Promise<any> {
    const { userId, activityType, activityData, isPublic = true } = params;

    const result = await pool.query(
      `INSERT INTO activity_feeds (user_id, activity_type, activity_data, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, activityType, JSON.stringify(activityData), isPublic]
    );

    return result.rows[0];
  }

  async getUserActivityFeed(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM user_feed
      WHERE user_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = $1
        UNION
        SELECT $1
      )
      ORDER BY created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getPublicActivityFeed(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM user_feed ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // ENGAGEMENT SCORES
  // ========================================

  async calculateEngagementScore(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT calculate_engagement_score($1) as score`,
      [userId]
    );

    return result.rows[0].score;
  }

  async getUserEngagementScore(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM engagement_scores WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Calculate score for the first time
      await this.calculateEngagementScore(userId);
      return await this.getUserEngagementScore(userId);
    }

    return result.rows[0];
  }

  async getTopEngagedUsers(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM top_engaged_users LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // ENGAGEMENT ANALYTICS
  // ========================================

  async getEngagementAnalytics(userId: string, days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM engagement_analytics
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
      ORDER BY date DESC`,
      [userId, days]
    );

    return result.rows;
  }

  async getTrendingContent(limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM trending_content LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ========================================
  // ACTIVITY LOG
  // ========================================

  async logActivity(userId: string, activityType: string, activityDetails: any, ipAddress?: string, userAgent?: string): Promise<void> {
    await pool.query(
      `INSERT INTO user_activity_log (user_id, activity_type, activity_details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)`,
      [userId, activityType, JSON.stringify(activityDetails), ipAddress, userAgent]
    );
  }

  async getUserActivityLog(userId: string, limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM user_activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

export const engagementService = new EngagementService();
