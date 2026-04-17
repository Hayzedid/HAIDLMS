import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateUserProfileParams {
  userId: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  country?: string;
  city?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

interface UpdateUserProfileParams {
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  country?: string;
  city?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  profileVisibility?: string;
  showActivity?: boolean;
  showProgress?: boolean;
  showAchievements?: boolean;
}

interface BulkOperationParams {
  operationType: string;
  initiatedBy: string;
  organizationId?: string;
  targetUserIds: string[];
  reason?: string;
  parameters?: any;
}

interface ImpersonationParams {
  impersonatorId: string;
  impersonatedUserId: string;
  reason: string;
  justification: string;
  ticketNumber?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface UserDataExportParams {
  userId: string;
  requestedBy: string;
  exportType: string;
  includeSections?: string[];
  format?: string;
  isGdprRequest?: boolean;
}

// ============================================================================
// USER MANAGEMENT SERVICE
// ============================================================================

export class UserManagementService {
  // ========================================
  // USER PROFILES
  // ========================================

  async createUserProfile(params: CreateUserProfileParams): Promise<any> {
    const {
      userId,
      phone,
      bio,
      avatarUrl,
      timezone = 'UTC',
      language = 'en',
      country,
      city,
      jobTitle,
      company,
      industry,
      yearsOfExperience,
      linkedinUrl,
      githubUrl,
      portfolioUrl
    } = params;

    const result = await pool.query(
      `INSERT INTO user_profiles (
        user_id, phone_number, bio, avatar_url, timezone, language,
        country, city, job_title, company, industry, years_of_experience,
        linkedin_url, github_url, portfolio_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (user_id) DO UPDATE SET
        phone_number = EXCLUDED.phone_number,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        country = EXCLUDED.country,
        city = EXCLUDED.city,
        updated_at = NOW()
      RETURNING *`,
      [
        userId, phone, bio, avatarUrl, timezone, language,
        country, city, jobTitle, company, industry, yearsOfExperience,
        linkedinUrl, githubUrl, portfolioUrl
      ]
    );

    return result.rows[0];
  }

  async getUserProfile(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT up.*, u.name, u.email, u.created_at as user_created_at
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfileParams): Promise<any> {
    const allowedFields = [
      'phone_number', 'bio', 'avatar_url', 'timezone', 'language',
      'country', 'city', 'job_title', 'company', 'industry',
      'years_of_experience', 'linkedin_url', 'github_url', 'portfolio_url',
      'email_notifications', 'push_notifications', 'marketing_emails',
      'profile_visibility', 'show_activity', 'show_progress', 'show_achievements'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push((updates as any)[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = NOW()
      WHERE user_id = $${paramIndex}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async updateUserStatus(
    userId: string,
    newStatus: string,
    reason: string,
    changedBy: string
  ): Promise<any> {
    const previousProfile = await this.getUserProfile(userId);

    const result = await pool.query(
      `SELECT * FROM update_user_status($1, $2, $3, $4)`,
      [userId, newStatus, reason, changedBy]
    );

    // Log the action
    await pool.query(
      `SELECT log_account_action($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        newStatus === 'active' ? 'activate' : newStatus === 'inactive' ? 'deactivate' : 'suspend',
        changedBy,
        reason,
        previousProfile?.status,
        newStatus,
        JSON.stringify({ status_changed: true })
      ]
    );

    return result.rows[0];
  }

  async searchUsers(filters: any = {}): Promise<{ users: any[]; total: number }> {
    const {
      search,
      status,
      organizationId,
      country,
      minLoginCount,
      lastLoginAfter,
      tags,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        up.status,
        up.last_login_at,
        up.login_count,
        up.courses_completed,
        up.total_learning_time_minutes,
        up.avatar_url,
        up.job_title,
        up.company,
        up.country,
        up.created_at
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND up.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (organizationId) {
      query += ` AND u.organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (country) {
      query += ` AND up.country = $${paramIndex}`;
      params.push(country);
      paramIndex++;
    }

    if (minLoginCount) {
      query += ` AND up.login_count >= $${paramIndex}`;
      params.push(minLoginCount);
      paramIndex++;
    }

    if (lastLoginAfter) {
      query += ` AND up.last_login_at >= $${paramIndex}`;
      params.push(lastLoginAfter);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      query += `
        AND u.id IN (
          SELECT uta.user_id FROM user_tag_assignments uta
          JOIN user_tags ut ON uta.tag_id = ut.id
          WHERE ut.name = ANY($${paramIndex})
        )
      `;
      params.push(tags);
      paramIndex++;
    }

    const countQuery = query.replace(
      /SELECT.*FROM/s,
      'SELECT COUNT(DISTINCT u.id) as total FROM'
    );

    query += ` ORDER BY up.last_login_at DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async getUsersRequiringAttention(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM users_requiring_attention LIMIT 100`);
    return result.rows;
  }

  async recordLogin(userId: string, ipAddress?: string): Promise<void> {
    await pool.query(
      `UPDATE user_profiles
      SET
        last_login_at = NOW(),
        last_login_ip = $2,
        login_count = login_count + 1,
        failed_login_attempts = 0,
        updated_at = NOW()
      WHERE user_id = $1`,
      [userId, ipAddress]
    );
  }

  async recordFailedLogin(userId: string): Promise<void> {
    await pool.query(
      `UPDATE user_profiles
      SET
        failed_login_attempts = failed_login_attempts + 1,
        last_failed_login_at = NOW(),
        account_locked_until = CASE
          WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '1 hour'
          ELSE account_locked_until
        END,
        updated_at = NOW()
      WHERE user_id = $1`,
      [userId]
    );
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async createBulkOperation(params: BulkOperationParams): Promise<any> {
    const {
      operationType,
      initiatedBy,
      organizationId,
      targetUserIds,
      reason,
      parameters
    } = params;

    const result = await pool.query(
      `INSERT INTO bulk_operations (
        operation_type,
        initiated_by,
        organization_id,
        target_user_ids,
        total_users,
        reason,
        parameters
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        operationType,
        initiatedBy,
        organizationId || null,
        targetUserIds,
        targetUserIds.length,
        reason,
        parameters ? JSON.stringify(parameters) : null
      ]
    );

    return result.rows[0];
  }

  async executeBulkOperation(operationId: string): Promise<any> {
    // Get operation details
    const opResult = await pool.query(
      `SELECT * FROM bulk_operations WHERE id = $1`,
      [operationId]
    );

    const operation = opResult.rows[0];
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    // Update status to processing
    await pool.query(
      `UPDATE bulk_operations SET status = 'processing', started_at = NOW() WHERE id = $1`,
      [operationId]
    );

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // Execute operation for each user
    for (const userId of operation.target_user_ids) {
      try {
        switch (operation.operation_type) {
          case 'activate':
            await this.updateUserStatus(userId, 'active', operation.reason, operation.initiated_by);
            break;
          case 'deactivate':
            await this.updateUserStatus(userId, 'inactive', operation.reason, operation.initiated_by);
            break;
          case 'suspend':
            await this.updateUserStatus(userId, 'suspended', operation.reason, operation.initiated_by);
            break;
          case 'delete':
            await this.updateUserStatus(userId, 'deleted', operation.reason, operation.initiated_by);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.operation_type}`);
        }
        successCount++;
      } catch (error: any) {
        failCount++;
        errors.push({ userId, error: error.message });
      }
    }

    // Update operation with results
    const result = await pool.query(
      `UPDATE bulk_operations
      SET
        status = 'completed',
        completed_at = NOW(),
        successful_count = $2,
        failed_count = $3,
        errors = $4
      WHERE id = $1
      RETURNING *`,
      [operationId, successCount, failCount, JSON.stringify(errors)]
    );

    return result.rows[0];
  }

  async getBulkOperation(operationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT bo.*, u.name as initiated_by_name, u.email as initiated_by_email
      FROM bulk_operations bo
      JOIN users u ON bo.initiated_by = u.id
      WHERE bo.id = $1`,
      [operationId]
    );

    return result.rows[0];
  }

  async listBulkOperations(filters: any = {}): Promise<any[]> {
    const { initiatedBy, status, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT bo.*, u.name as initiated_by_name
      FROM bulk_operations bo
      JOIN users u ON bo.initiated_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (initiatedBy) {
      query += ` AND bo.initiated_by = $${paramIndex}`;
      params.push(initiatedBy);
      paramIndex++;
    }

    if (status) {
      query += ` AND bo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY bo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // IMPERSONATION
  // ========================================

  async startImpersonation(params: ImpersonationParams): Promise<string> {
    const {
      impersonatorId,
      impersonatedUserId,
      reason,
      justification,
      ticketNumber,
      ipAddress,
      userAgent
    } = params;

    const result = await pool.query(
      `SELECT start_impersonation($1, $2, $3, $4, $5, $6, $7)`,
      [
        impersonatorId,
        impersonatedUserId,
        reason,
        justification,
        ticketNumber,
        ipAddress,
        userAgent
      ]
    );

    return result.rows[0].start_impersonation;
  }

  async endImpersonation(
    sessionId: string,
    actionsPerformed: number,
    pagesVisited: string[]
  ): Promise<void> {
    await pool.query(
      `SELECT end_impersonation($1, $2, $3)`,
      [sessionId, actionsPerformed, pagesVisited]
    );
  }

  async getImpersonationSession(sessionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM recent_impersonations WHERE id = $1`,
      [sessionId]
    );

    return result.rows[0];
  }

  async listImpersonationSessions(filters: any = {}): Promise<any[]> {
    const { impersonatorId, impersonatedUserId, limit = 50 } = filters;

    let query = `SELECT * FROM recent_impersonations WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (impersonatorId) {
      query += ` AND impersonator_id = $${paramIndex}`;
      params.push(impersonatorId);
      paramIndex++;
    }

    if (impersonatedUserId) {
      query += ` AND impersonated_user_id = $${paramIndex}`;
      params.push(impersonatedUserId);
      paramIndex++;
    }

    query += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // USER DATA EXPORTS
  // ========================================

  async createUserDataExport(params: UserDataExportParams): Promise<any> {
    const {
      userId,
      requestedBy,
      exportType,
      includeSections = [],
      format = 'json',
      isGdprRequest = false
    } = params;

    const result = await pool.query(
      `INSERT INTO user_data_exports (
        user_id,
        requested_by,
        export_type,
        include_sections,
        format,
        is_gdpr_request,
        expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
      RETURNING *`,
      [userId, requestedBy, exportType, includeSections, format, isGdprRequest]
    );

    return result.rows[0];
  }

  async completeUserDataExport(
    exportId: string,
    fileUrl: string,
    fileSize: number
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE user_data_exports
      SET
        status = 'completed',
        completed_at = NOW(),
        file_url = $2,
        file_size = $3,
        processing_time_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
      WHERE id = $1
      RETURNING *`,
      [exportId, fileUrl, fileSize]
    );

    return result.rows[0];
  }

  async getUserDataExport(exportId: string): Promise<any> {
    const result = await pool.query(
      `SELECT ude.*, u.name as user_name, u.email as user_email,
        r.name as requested_by_name
      FROM user_data_exports ude
      JOIN users u ON ude.user_id = u.id
      JOIN users r ON ude.requested_by = r.id
      WHERE ude.id = $1`,
      [exportId]
    );

    return result.rows[0];
  }

  async listUserDataExports(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM user_data_exports
      WHERE user_id = $1 OR requested_by = $1
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId]
    );

    return result.rows;
  }

  async trackExportDownload(exportId: string): Promise<void> {
    await pool.query(
      `UPDATE user_data_exports
      SET
        download_count = download_count + 1,
        last_downloaded_at = NOW()
      WHERE id = $1`,
      [exportId]
    );
  }

  // ========================================
  // USER TAGS
  // ========================================

  async createUserTag(name: string, description: string, color: string, organizationId?: string, createdBy?: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_tags (name, description, color, organization_id, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [name, description, color, organizationId, createdBy]
    );

    return result.rows[0];
  }

  async assignTagToUser(userId: string, tagId: string, assignedBy: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_tag_assignments (user_id, tag_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, tag_id) DO NOTHING
      RETURNING *`,
      [userId, tagId, assignedBy]
    );

    return result.rows[0];
  }

  async removeTagFromUser(userId: string, tagId: string): Promise<void> {
    await pool.query(
      `DELETE FROM user_tag_assignments WHERE user_id = $1 AND tag_id = $2`,
      [userId, tagId]
    );
  }

  async getUserTags(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT ut.*, uta.assigned_at, u.name as assigned_by_name
      FROM user_tag_assignments uta
      JOIN user_tags ut ON uta.tag_id = ut.id
      LEFT JOIN users u ON uta.assigned_by = u.id
      WHERE uta.user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  async listUserTags(organizationId?: string): Promise<any[]> {
    let query = `SELECT * FROM user_tags WHERE 1=1`;
    const params: any[] = [];

    if (organizationId) {
      query += ` AND organization_id = $1`;
      params.push(organizationId);
    }

    query += ` ORDER BY name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // USER NOTES
  // ========================================

  async createUserNote(
    userId: string,
    createdBy: string,
    subject: string,
    content: string,
    category?: string,
    isFlagged: boolean = false
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_notes (user_id, created_by, subject, content, category, is_flagged)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, createdBy, subject, content, category, isFlagged]
    );

    return result.rows[0];
  }

  async getUserNotes(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT un.*, u.name as created_by_name
      FROM user_notes un
      JOIN users u ON un.created_by = u.id
      WHERE un.user_id = $1
      ORDER BY un.is_flagged DESC, un.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async updateUserNote(noteId: string, updates: any): Promise<any> {
    const allowedFields = ['subject', 'content', 'category', 'is_flagged'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(noteId);
    const result = await pool.query(
      `UPDATE user_notes SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteUserNote(noteId: string): Promise<void> {
    await pool.query(`DELETE FROM user_notes WHERE id = $1`, [noteId]);
  }

  // ========================================
  // USER GROUPS
  // ========================================

  async createUserGroup(
    name: string,
    description: string,
    organizationId: string,
    createdBy: string,
    isDynamic: boolean = false,
    dynamicCriteria?: any
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_groups (name, description, organization_id, created_by, is_dynamic, dynamic_criteria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [name, description, organizationId, createdBy, isDynamic, dynamicCriteria ? JSON.stringify(dynamicCriteria) : null]
    );

    return result.rows[0];
  }

  async addUserToGroup(groupId: string, userId: string, addedBy: string, isAutoAdded: boolean = false): Promise<any> {
    const result = await pool.query(
      `INSERT INTO user_group_members (group_id, user_id, added_by, is_auto_added)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_id, user_id) DO NOTHING
      RETURNING *`,
      [groupId, userId, addedBy, isAutoAdded]
    );

    return result.rows[0];
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM user_group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
  }

  async getUserGroups(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT ug.*, ugm.added_at, ugm.is_auto_added
      FROM user_group_members ugm
      JOIN user_groups ug ON ugm.group_id = ug.id
      WHERE ugm.user_id = $1
      ORDER BY ug.name`,
      [userId]
    );

    return result.rows;
  }

  async getGroupMembers(groupId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, ugm.added_at, ugm.is_auto_added,
        up.avatar_url, up.job_title, up.company
      FROM user_group_members ugm
      JOIN users u ON ugm.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ugm.group_id = $1
      ORDER BY ugm.added_at DESC`,
      [groupId]
    );

    return result.rows;
  }

  async listUserGroups(organizationId?: string): Promise<any[]> {
    let query = `SELECT * FROM user_groups WHERE 1=1`;
    const params: any[] = [];

    if (organizationId) {
      query += ` AND organization_id = $1`;
      params.push(organizationId);
    }

    query += ` ORDER BY name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // ACCOUNT ACTIONS
  // ========================================

  async getAccountActions(userId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT aa.*, u.name as performed_by_name
      FROM account_actions aa
      LEFT JOIN users u ON aa.performed_by = u.id
      WHERE aa.user_id = $1
      ORDER BY aa.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getUserActivitySummary(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_activity_summary WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  async getActiveUsersSummary(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_users_summary ORDER BY last_login_at DESC LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

export const userManagementService = new UserManagementService();
