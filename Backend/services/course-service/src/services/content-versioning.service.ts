import pool from '../db/pool';

interface CreateVersionInput {
  contentType: string;
  contentId: string;
  contentData: any;
  changeType: string;
  changeSummary: string;
  changeDescription?: string;
  breakingChanges?: string[];
  createdBy: string;
}

interface PublishVersionInput {
  versionId: string;
  publishedBy: string;
  scheduledPublishAt?: Date;
}

interface ApprovalInput {
  versionId: string;
  requestedFrom: string;
  requestedBy: string;
  comments?: string;
}

interface ReviewInput {
  approvalId: string;
  reviewedBy: string;
  approvalStatus: string;
  reviewComments?: string;
  changesRequested?: string[];
}

class ContentVersioningService {
  // ==================== VERSIONS ====================

  async createVersion(data: CreateVersionInput) {
    const result = await pool.query(
      `SELECT create_content_version($1, $2, $3, $4, $5, $6) AS version_id`,
      [
        data.contentType,
        data.contentId,
        JSON.stringify(data.contentData),
        data.changeType,
        data.changeSummary,
        data.createdBy
      ]
    );

    const versionId = result.rows[0].version_id;

    // Update version with additional details
    if (data.changeDescription || data.breakingChanges) {
      await pool.query(
        `UPDATE content_versions
         SET change_description = $2, breaking_changes = $3
         WHERE id = $1`,
        [versionId, data.changeDescription || null, data.breakingChanges || null]
      );
    }

    return this.getVersion(versionId);
  }

  async getVersions(contentType: string, contentId: string, filters?: {
    status?: string;
    limit?: number;
  }) {
    const conditions: string[] = ['content_type = $1', 'content_id = $2'];
    const values: any[] = [contentType, contentId];
    let paramCount = 2;

    if (filters?.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    const limit = filters?.limit || 50;

    const result = await pool.query(
      `SELECT
        cv.*,
        u1.full_name AS created_by_name,
        u2.full_name AS published_by_name
       FROM content_versions cv
       LEFT JOIN users u1 ON cv.created_by = u1.id
       LEFT JOIN users u2 ON cv.published_by = u2.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY cv.created_at DESC
       LIMIT $${paramCount + 1}`,
      [...values, limit]
    );

    return result.rows;
  }

  async getVersion(versionId: string) {
    const result = await pool.query(
      `SELECT
        cv.*,
        u1.full_name AS created_by_name,
        u2.full_name AS published_by_name
       FROM content_versions cv
       LEFT JOIN users u1 ON cv.created_by = u1.id
       LEFT JOIN users u2 ON cv.published_by = u2.id
       WHERE cv.id = $1`,
      [versionId]
    );

    return result.rows[0] || null;
  }

  async getCurrentVersion(contentType: string, contentId: string) {
    const result = await pool.query(
      `SELECT * FROM current_content_versions
       WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );

    return result.rows[0] || null;
  }

  async publishVersion(data: PublishVersionInput) {
    if (data.scheduledPublishAt) {
      // Schedule publish
      await pool.query(
        `INSERT INTO publishing_schedules (
          version_id, content_type, content_id,
          scheduled_for, scheduled_by
        )
        SELECT $1, content_type, content_id, $2, $3
        FROM content_versions WHERE id = $1`,
        [data.versionId, data.scheduledPublishAt, data.publishedBy]
      );

      await pool.query(
        `UPDATE content_versions
         SET status = 'scheduled', scheduled_publish_at = $2
         WHERE id = $1`,
        [data.versionId, data.scheduledPublishAt]
      );
    } else {
      // Publish immediately
      await pool.query(
        `SELECT publish_content_version($1, $2)`,
        [data.versionId, data.publishedBy]
      );
    }

    return this.getVersion(data.versionId);
  }

  async archiveVersion(versionId: string) {
    const result = await pool.query(
      `UPDATE content_versions
       SET status = 'archived', archived_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [versionId]
    );

    return result.rows[0] || null;
  }

  async rollbackVersion(contentType: string, contentId: string, toVersionId: string, reason: string, rolledBackBy: string) {
    const result = await pool.query(
      `SELECT rollback_content_version($1, $2, $3, $4, $5) AS rollback_id`,
      [contentType, contentId, toVersionId, reason, rolledBackBy]
    );

    return result.rows[0].rollback_id;
  }

  // ==================== APPROVALS ====================

  async requestApproval(data: ApprovalInput) {
    const result = await pool.query(
      `INSERT INTO content_approvals (
        version_id, content_type, content_id,
        requested_from, requested_by
      )
      SELECT $1, content_type, content_id, $2, $3
      FROM content_versions WHERE id = $1
      RETURNING *`,
      [data.versionId, data.requestedFrom, data.requestedBy]
    );

    // Update version status
    await pool.query(
      `UPDATE content_versions
       SET status = 'in_review'
       WHERE id = $1`,
      [data.versionId]
    );

    return result.rows[0];
  }

  async getApprovals(filters?: {
    requestedFrom?: string;
    status?: string;
    limit?: number;
  }) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters?.requestedFrom) {
      paramCount++;
      conditions.push(`requested_from = $${paramCount}`);
      values.push(filters.requestedFrom);
    }

    if (filters?.status) {
      paramCount++;
      conditions.push(`approval_status = $${paramCount}`);
      values.push(filters.status);
    }

    const limit = filters?.limit || 50;

    const result = await pool.query(
      `SELECT * FROM pending_content_approvals
       WHERE ${conditions.join(' AND ')}
       LIMIT $${paramCount + 1}`,
      [...values, limit]
    );

    return result.rows;
  }

  async reviewApproval(data: ReviewInput) {
    const result = await pool.query(
      `UPDATE content_approvals
       SET
         approval_status = $2,
         reviewed_by = $3,
         reviewed_at = NOW(),
         review_comments = $4,
         changes_requested = $5
       WHERE id = $1
       RETURNING *`,
      [
        data.approvalId,
        data.approvalStatus,
        data.reviewedBy,
        data.reviewComments || null,
        data.changesRequested || null
      ]
    );

    return result.rows[0] || null;
  }

  // ==================== DRAFTS ====================

  async createDraft(contentType: string, contentId: string, draftData: any, createdBy: string, options?: {
    draftName?: string;
    baseVersionId?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO content_drafts (
        content_type, content_id, draft_data,
        base_version_id, draft_name, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        contentType,
        contentId,
        JSON.stringify(draftData),
        options?.baseVersionId || null,
        options?.draftName || null,
        createdBy
      ]
    );

    return result.rows[0];
  }

  async getDrafts(contentType: string, contentId: string, createdBy?: string) {
    const query = createdBy
      ? `SELECT * FROM content_drafts
         WHERE content_type = $1 AND content_id = $2 AND created_by = $3
         ORDER BY updated_at DESC`
      : `SELECT * FROM content_drafts
         WHERE content_type = $1 AND content_id = $2
         ORDER BY updated_at DESC`;

    const params = createdBy ? [contentType, contentId, createdBy] : [contentType, contentId];
    const result = await pool.query(query, params);

    return result.rows;
  }

  async updateDraft(draftId: string, draftData: any, isAutosave: boolean = false) {
    const result = await pool.query(
      `UPDATE content_drafts
       SET draft_data = $2, is_autosave = $3, last_saved_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [draftId, JSON.stringify(draftData), isAutosave]
    );

    return result.rows[0] || null;
  }

  async deleteDraft(draftId: string, userId: string) {
    await pool.query(
      `DELETE FROM content_drafts WHERE id = $1 AND created_by = $2`,
      [draftId, userId]
    );
  }

  // ==================== LOCKS ====================

  async lockContent(contentType: string, contentId: string, lockedBy: string, durationMinutes: number = 30) {
    const result = await pool.query(
      `SELECT lock_content($1, $2, $3, $4) AS lock_id`,
      [contentType, contentId, lockedBy, durationMinutes]
    );

    return result.rows[0].lock_id;
  }

  async unlockContent(contentType: string, contentId: string, userId: string) {
    const result = await pool.query(
      `SELECT unlock_content($1, $2, $3) AS success`,
      [contentType, contentId, userId]
    );

    return result.rows[0].success;
  }

  async checkLock(contentType: string, contentId: string) {
    const result = await pool.query(
      `SELECT * FROM is_content_locked($1, $2)`,
      [contentType, contentId]
    );

    return result.rows[0];
  }

  async getActiveLocks(userId?: string) {
    const query = userId
      ? `SELECT * FROM active_content_locks WHERE locked_by = $1`
      : `SELECT * FROM active_content_locks`;

    const params = userId ? [userId] : [];
    const result = await pool.query(query, params);

    return result.rows;
  }

  // ==================== COMPARISONS ====================

  async compareVersions(contentType: string, contentId: string, versionAId: string, versionBId: string, comparedBy?: string) {
    // Get both versions
    const versionsResult = await pool.query(
      `SELECT id, content_data FROM content_versions
       WHERE id = ANY($1)`,
      [[versionAId, versionBId]]
    );

    if (versionsResult.rows.length !== 2) {
      throw new Error('One or both versions not found');
    }

    const versionA = versionsResult.rows.find(v => v.id === versionAId);
    const versionB = versionsResult.rows.find(v => v.id === versionBId);

    // Simple diff calculation (in production, use a proper diff library)
    const diffData = {
      versionA: versionA.content_data,
      versionB: versionB.content_data
    };

    const result = await pool.query(
      `INSERT INTO version_comparisons (
        content_type, content_id, version_a_id, version_b_id,
        diff_data, compared_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [contentType, contentId, versionAId, versionBId, JSON.stringify(diffData), comparedBy || null]
    );

    return result.rows[0];
  }

  // ==================== CHANGELOG ====================

  async getChangelog(versionId: string) {
    const result = await pool.query(
      `SELECT * FROM version_changelog
       WHERE version_id = $1
       ORDER BY changed_at DESC`,
      [versionId]
    );

    return result.rows;
  }

  async addChangelogEntry(versionId: string, contentType: string, contentId: string, changes: {
    changeCategory: string;
    changeType: string;
    fieldPath: string;
    oldValue?: any;
    newValue?: any;
    changedBy: string;
  }[]) {
    const values = changes.map(change => [
      versionId,
      contentType,
      contentId,
      change.changeCategory,
      change.changeType,
      change.fieldPath,
      change.oldValue ? JSON.stringify(change.oldValue) : null,
      change.newValue ? JSON.stringify(change.newValue) : null,
      change.changedBy
    ]);

    await pool.query(
      `INSERT INTO version_changelog (
        version_id, content_type, content_id,
        change_category, change_type, field_path,
        old_value, new_value, changed_by
      )
      SELECT * FROM UNNEST($1::uuid[], $2::content_type[], $3::uuid[],
        $4::varchar[], $5::varchar[], $6::varchar[],
        $7::jsonb[], $8::jsonb[], $9::uuid[])`,
      values
    );
  }

  // ==================== METADATA ====================

  async updateMetadata(contentType: string, contentId: string, metadata: {
    tags?: string[];
    categories?: string[];
    keywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    language?: string;
    customFields?: any;
  }) {
    const result = await pool.query(
      `INSERT INTO content_metadata (
        content_type, content_id, tags, categories, keywords,
        meta_title, meta_description, slug, language, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (content_type, content_id)
      DO UPDATE SET
        tags = COALESCE(EXCLUDED.tags, content_metadata.tags),
        categories = COALESCE(EXCLUDED.categories, content_metadata.categories),
        keywords = COALESCE(EXCLUDED.keywords, content_metadata.keywords),
        meta_title = COALESCE(EXCLUDED.meta_title, content_metadata.meta_title),
        meta_description = COALESCE(EXCLUDED.meta_description, content_metadata.meta_description),
        slug = COALESCE(EXCLUDED.slug, content_metadata.slug),
        language = COALESCE(EXCLUDED.language, content_metadata.language),
        custom_fields = COALESCE(EXCLUDED.custom_fields, content_metadata.custom_fields),
        updated_at = NOW()
      RETURNING *`,
      [
        contentType,
        contentId,
        metadata.tags || null,
        metadata.categories || null,
        metadata.keywords || null,
        metadata.metaTitle || null,
        metadata.metaDescription || null,
        metadata.slug || null,
        metadata.language || null,
        metadata.customFields ? JSON.stringify(metadata.customFields) : null
      ]
    );

    return result.rows[0];
  }

  async getMetadata(contentType: string, contentId: string) {
    const result = await pool.query(
      `SELECT * FROM content_metadata
       WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );

    return result.rows[0] || null;
  }

  // ==================== PUBLISHING SCHEDULES ====================

  async getScheduledPublishes(filters?: { status?: string; limit?: number }) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters?.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    const limit = filters?.limit || 50;

    const result = await pool.query(
      `SELECT * FROM upcoming_publishes
       WHERE ${conditions.join(' AND ')}
       LIMIT $${paramCount + 1}`,
      [...values, limit]
    );

    return result.rows;
  }

  async cancelScheduledPublish(scheduleId: string) {
    const result = await pool.query(
      `UPDATE publishing_schedules
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [scheduleId]
    );

    return result.rows[0] || null;
  }

  // ==================== STATISTICS ====================

  async getVersionStatistics(contentType: string, contentId: string) {
    const result = await pool.query(
      `SELECT * FROM version_history_summary
       WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );

    return result.rows[0] || null;
  }

  async getRollbackHistory(contentType: string, contentId: string, limit: number = 20) {
    const result = await pool.query(
      `SELECT
        cr.*,
        cv1.version_number AS from_version,
        cv2.version_number AS to_version,
        u.full_name AS rolled_back_by_name
       FROM content_rollbacks cr
       JOIN content_versions cv1 ON cr.from_version_id = cv1.id
       JOIN content_versions cv2 ON cr.to_version_id = cv2.id
       LEFT JOIN users u ON cr.rolled_back_by = u.id
       WHERE cr.content_type = $1 AND cr.content_id = $2
       ORDER BY cr.rolled_back_at DESC
       LIMIT $3`,
      [contentType, contentId, limit]
    );

    return result.rows;
  }
}

export const contentVersioningService = new ContentVersioningService();
