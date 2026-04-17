import pool from '../db/pool';

interface ForumCategory {
  id?: string;
  courseId?: string;
  organizationId?: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  parentCategoryId?: string;
  displayOrder?: number;
  isPublic?: boolean;
  requiresEnrollment?: boolean;
  postingAllowed?: boolean;
  isQaMode?: boolean;
  isModerated?: boolean;
  moderatorIds?: string[];
}

interface DiscussionThread {
  id?: string;
  categoryId: string;
  authorId: string;
  title: string;
  content: string;
  contentType?: string;
  threadType?: string;
  tags?: string[];
  isQuestion?: boolean;
  bountyPoints?: number;
  isPinned?: boolean;
}

interface ThreadReply {
  id?: string;
  threadId: string;
  authorId: string;
  parentReplyId?: string;
  content: string;
  contentType?: string;
  isAnswer?: boolean;
  isInstructorReply?: boolean;
}

export class ForumService {
  // ========================================
  // FORUM CATEGORIES
  // ========================================

  async createCategory(category: ForumCategory): Promise<any> {
    const query = `
      INSERT INTO forum_categories (
        course_id, organization_id, name, description, slug, icon, color,
        parent_category_id, display_order, is_public, requires_enrollment,
        posting_allowed, is_qa_mode, is_moderated, moderator_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      category.courseId,
      category.organizationId,
      category.name,
      category.description,
      category.slug,
      category.icon,
      category.color || '#6366f1',
      category.parentCategoryId,
      category.displayOrder || 0,
      category.isPublic !== false,
      category.requiresEnrollment !== false,
      category.postingAllowed !== false,
      category.isQaMode || false,
      category.isModerated || false,
      category.moderatorIds || [],
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCategories(courseId?: string, organizationId?: string): Promise<any[]> {
    let query = `
      SELECT
        fc.*,
        COUNT(DISTINCT dt.id) AS thread_count,
        COUNT(DISTINCT CASE WHEN dt.last_activity_at > NOW() - INTERVAL '7 days' THEN dt.id END) AS active_threads
      FROM forum_categories fc
      LEFT JOIN discussion_threads dt ON fc.id = dt.category_id AND dt.is_deleted = false
      WHERE fc.is_active = true
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND fc.course_id = $${paramCount}`;
      values.push(courseId);
      paramCount++;
    }

    if (organizationId) {
      query += ` AND fc.organization_id = $${paramCount}`;
      values.push(organizationId);
      paramCount++;
    }

    query += `
      GROUP BY fc.id
      ORDER BY fc.display_order ASC, fc.name ASC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getCategoryById(categoryId: string): Promise<any> {
    const query = 'SELECT * FROM forum_categories WHERE id = $1';
    const result = await pool.query(query, [categoryId]);

    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    return result.rows[0];
  }

  // ========================================
  // DISCUSSION THREADS
  // ========================================

  async createThread(thread: DiscussionThread): Promise<any> {
    const query = `
      INSERT INTO discussion_threads (
        category_id, author_id, title, content, content_type, thread_type,
        tags, is_question, bounty_points, is_pinned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      thread.categoryId,
      thread.authorId,
      thread.title,
      thread.content,
      thread.contentType || 'markdown',
      thread.threadType || 'discussion',
      thread.tags || [],
      thread.isQuestion || false,
      thread.bountyPoints || 0,
      thread.isPinned || false,
    ];

    const result = await pool.query(query, values);

    // Auto-follow thread for author
    await this.followThread(result.rows[0].id, thread.authorId);

    return result.rows[0];
  }

  async getThreads(filters: {
    categoryId?: string;
    authorId?: string;
    threadType?: string;
    tags?: string[];
    isQuestion?: boolean;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ threads: any[]; total: number }> {
    let query = `
      SELECT * FROM active_threads
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (filters.categoryId) {
      query += ` AND category_id = $${paramCount}`;
      values.push(filters.categoryId);
      paramCount++;
    }

    if (filters.authorId) {
      query += ` AND author_id = $${paramCount}`;
      values.push(filters.authorId);
      paramCount++;
    }

    if (filters.threadType) {
      query += ` AND thread_type = $${paramCount}`;
      values.push(filters.threadType);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramCount}`;
      values.push(filters.tags);
      paramCount++;
    }

    if (filters.isQuestion !== undefined) {
      query += ` AND is_question = $${paramCount}`;
      values.push(filters.isQuestion);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Sort
    const sortBy = filters.sortBy || 'recent';
    if (sortBy === 'recent') {
      query += ' ORDER BY last_activity_at DESC';
    } else if (sortBy === 'popular') {
      query += ' ORDER BY score DESC, view_count DESC';
    } else if (sortBy === 'unanswered') {
      query += ' ORDER BY is_question DESC, has_accepted_answer ASC, created_at DESC';
    } else if (sortBy === 'bounty') {
      query += ' ORDER BY bounty_points DESC, created_at DESC';
    }

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      threads: result.rows,
      total,
    };
  }

  async getThreadById(threadId: string, incrementView: boolean = false): Promise<any> {
    if (incrementView) {
      await pool.query(
        'UPDATE discussion_threads SET view_count = view_count + 1 WHERE id = $1',
        [threadId]
      );
    }

    const query = 'SELECT * FROM active_threads WHERE id = $1';
    const result = await pool.query(query, [threadId]);

    if (result.rows.length === 0) {
      throw new Error('Thread not found');
    }

    return result.rows[0];
  }

  async updateThread(
    threadId: string,
    authorId: string,
    updates: Partial<DiscussionThread>
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'authorId' && key !== 'categoryId') {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(threadId, authorId);

    const query = `
      UPDATE discussion_threads
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND author_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Thread not found or unauthorized');
    }

    return result.rows[0];
  }

  async deleteThread(threadId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const query = `
      UPDATE discussion_threads
      SET is_deleted = true, deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND (author_id = $2 OR $3 = true)
    `;

    const result = await pool.query(query, [threadId, userId, isAdmin]);

    if (result.rowCount === 0) {
      throw new Error('Thread not found or unauthorized');
    }
  }

  async pinThread(threadId: string, isPinned: boolean): Promise<void> {
    await pool.query(
      'UPDATE discussion_threads SET is_pinned = $2, updated_at = NOW() WHERE id = $1',
      [threadId, isPinned]
    );
  }

  async lockThread(threadId: string, isLocked: boolean): Promise<void> {
    await pool.query(
      'UPDATE discussion_threads SET is_locked = $2, updated_at = NOW() WHERE id = $1',
      [threadId, isLocked]
    );
  }

  async closeThread(threadId: string, isClosed: boolean): Promise<void> {
    await pool.query(
      'UPDATE discussion_threads SET is_closed = $2, updated_at = NOW() WHERE id = $1',
      [threadId, isClosed]
    );
  }

  // ========================================
  // THREAD REPLIES
  // ========================================

  async createReply(reply: ThreadReply): Promise<any> {
    // Check if thread is locked
    const threadCheck = await pool.query(
      'SELECT is_locked FROM discussion_threads WHERE id = $1',
      [reply.threadId]
    );

    if (threadCheck.rows[0]?.is_locked) {
      throw new Error('Thread is locked, cannot add replies');
    }

    const query = `
      INSERT INTO thread_replies (
        thread_id, author_id, parent_reply_id, content, content_type,
        is_answer, is_instructor_reply
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      reply.threadId,
      reply.authorId,
      reply.parentReplyId,
      reply.content,
      reply.contentType || 'markdown',
      reply.isAnswer || false,
      reply.isInstructorReply || false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getReplies(threadId: string): Promise<any[]> {
    const query = `
      SELECT
        r.*,
        u.full_name AS author_name,
        u.avatar_url AS author_avatar,
        COALESCE(rep.total_points, 0) AS author_reputation
      FROM thread_replies r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN forum_reputation rep ON r.author_id = rep.user_id AND rep.course_id IS NULL
      WHERE r.thread_id = $1 AND r.is_deleted = false
      ORDER BY
        r.is_accepted_answer DESC,
        r.upvote_count - r.downvote_count DESC,
        r.created_at ASC
    `;

    const result = await pool.query(query, [threadId]);
    return result.rows;
  }

  async updateReply(
    replyId: string,
    authorId: string,
    updates: { content?: string; contentType?: string }
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.content !== undefined) {
      fields.push(`content = $${paramCount}`);
      values.push(updates.content);
      paramCount++;
    }

    if (updates.contentType !== undefined) {
      fields.push(`content_type = $${paramCount}`);
      values.push(updates.contentType);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(replyId, authorId);

    const query = `
      UPDATE thread_replies
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND author_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Reply not found or unauthorized');
    }

    return result.rows[0];
  }

  async deleteReply(replyId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const query = `
      UPDATE thread_replies
      SET is_deleted = true, deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND (author_id = $2 OR $3 = true)
    `;

    const result = await pool.query(query, [replyId, userId, isAdmin]);

    if (result.rowCount === 0) {
      throw new Error('Reply not found or unauthorized');
    }
  }

  async acceptAnswer(threadId: string, replyId: string, authorId: string): Promise<void> {
    // Verify thread author
    const threadCheck = await pool.query(
      'SELECT author_id, is_question FROM discussion_threads WHERE id = $1',
      [threadId]
    );

    if (threadCheck.rows.length === 0) {
      throw new Error('Thread not found');
    }

    if (threadCheck.rows[0].author_id !== authorId) {
      throw new Error('Only thread author can accept answers');
    }

    if (!threadCheck.rows[0].is_question) {
      throw new Error('Thread is not a question');
    }

    // Unaccept any previous answer
    await pool.query(
      `UPDATE thread_replies
       SET is_accepted_answer = false
       WHERE thread_id = $1 AND is_accepted_answer = true`,
      [threadId]
    );

    // Accept new answer
    await pool.query(
      `UPDATE thread_replies
       SET is_accepted_answer = true, accepted_at = NOW()
       WHERE id = $1 AND thread_id = $2`,
      [replyId, threadId]
    );

    // Mark thread as having accepted answer
    await pool.query(
      `UPDATE discussion_threads
       SET has_accepted_answer = true, accepted_answer_id = $2
       WHERE id = $1`,
      [threadId, replyId]
    );
  }

  // ========================================
  // VOTING
  // ========================================

  async vote(
    userId: string,
    entityType: 'thread' | 'reply',
    entityId: string,
    voteType: 'upvote' | 'downvote'
  ): Promise<void> {
    const threadId = entityType === 'thread' ? entityId : null;
    const replyId = entityType === 'reply' ? entityId : null;

    // Check if user already voted
    const existingQuery = `
      SELECT id, vote_type FROM forum_votes
      WHERE user_id = $1 AND ${entityType}_id = $2
    `;
    const existing = await pool.query(existingQuery, [userId, entityId]);

    if (existing.rows.length > 0) {
      // Same vote = remove vote
      if (existing.rows[0].vote_type === voteType) {
        await pool.query('DELETE FROM forum_votes WHERE id = $1', [existing.rows[0].id]);
        return;
      }

      // Different vote = update vote
      await pool.query('UPDATE forum_votes SET vote_type = $1 WHERE id = $2', [
        voteType,
        existing.rows[0].id,
      ]);
      return;
    }

    // New vote
    const query = `
      INSERT INTO forum_votes (user_id, thread_id, reply_id, vote_type)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [userId, threadId, replyId, voteType]);
  }

  async getUserVote(
    userId: string,
    entityType: 'thread' | 'reply',
    entityId: string
  ): Promise<string | null> {
    const query = `
      SELECT vote_type FROM forum_votes
      WHERE user_id = $1 AND ${entityType}_id = $2
    `;

    const result = await pool.query(query, [userId, entityId]);
    return result.rows[0]?.vote_type || null;
  }

  // ========================================
  // FOLLOWING
  // ========================================

  async followThread(threadId: string, userId: string): Promise<void> {
    const query = `
      INSERT INTO thread_followers (thread_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (thread_id, user_id) DO NOTHING
    `;

    await pool.query(query, [threadId, userId]);
  }

  async unfollowThread(threadId: string, userId: string): Promise<void> {
    await pool.query('DELETE FROM thread_followers WHERE thread_id = $1 AND user_id = $2', [
      threadId,
      userId,
    ]);
  }

  async isFollowing(threadId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM thread_followers WHERE thread_id = $1 AND user_id = $2',
      [threadId, userId]
    );

    return result.rows.length > 0;
  }

  async getFollowers(threadId: string): Promise<any[]> {
    const query = `
      SELECT
        tf.user_id,
        u.full_name,
        u.email,
        tf.notify_on_reply,
        tf.notify_on_answer
      FROM thread_followers tf
      JOIN users u ON tf.user_id = u.id
      WHERE tf.thread_id = $1
    `;

    const result = await pool.query(query, [threadId]);
    return result.rows;
  }

  // ========================================
  // FLAGGING
  // ========================================

  async flagContent(
    userId: string,
    entityType: 'thread' | 'reply',
    entityId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    const threadId = entityType === 'thread' ? entityId : null;
    const replyId = entityType === 'reply' ? entityId : null;

    const query = `
      INSERT INTO forum_flags (flagger_id, thread_id, reply_id, flag_reason, flag_description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `;

    await pool.query(query, [userId, threadId, replyId, reason, description]);

    // Increment flag count
    if (entityType === 'thread') {
      await pool.query(
        'UPDATE discussion_threads SET is_flagged = true, flag_count = flag_count + 1 WHERE id = $1',
        [entityId]
      );
    } else {
      await pool.query(
        'UPDATE thread_replies SET is_flagged = true, flag_count = flag_count + 1 WHERE id = $1',
        [entityId]
      );
    }
  }

  async getFlaggedContent(): Promise<any[]> {
    const query = `
      SELECT
        f.*,
        u.full_name AS flagger_name,
        CASE
          WHEN f.thread_id IS NOT NULL THEN 'thread'
          ELSE 'reply'
        END AS entity_type,
        COALESCE(t.title, 'Reply') AS content_title
      FROM forum_flags f
      JOIN users u ON f.flagger_id = u.id
      LEFT JOIN discussion_threads t ON f.thread_id = t.id
      WHERE f.status = 'pending'
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  async resolveflag(flagId: string, moderatorId: string, status: string, notes?: string): Promise<void> {
    await pool.query(
      `UPDATE forum_flags
       SET status = $2, reviewed_by = $3, reviewed_at = NOW(), resolution_notes = $4
       WHERE id = $1`,
      [flagId, status, moderatorId, notes]
    );
  }

  // ========================================
  // REPUTATION & GAMIFICATION
  // ========================================

  async getUserReputation(userId: string, courseId?: string): Promise<any> {
    const query = `
      SELECT * FROM forum_reputation
      WHERE user_id = $1 AND (course_id = $2 OR ($2 IS NULL AND course_id IS NULL))
    `;

    const result = await pool.query(query, [userId, courseId]);

    if (result.rows.length === 0) {
      // Initialize reputation
      const insertQuery = `
        INSERT INTO forum_reputation (user_id, course_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [userId, courseId]);
      return insertResult.rows[0];
    }

    return result.rows[0];
  }

  async getLeaderboard(courseId?: string, limit: number = 50): Promise<any[]> {
    let query = `
      SELECT * FROM top_contributors
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (courseId) {
      query = `
        SELECT
          r.user_id,
          u.full_name,
          u.avatar_url,
          r.total_points,
          r.reputation_level,
          r.reputation_rank,
          r.threads_created,
          r.replies_posted,
          r.best_answers,
          r.helpful_votes_received,
          ROW_NUMBER() OVER (ORDER BY r.total_points DESC) AS rank
        FROM forum_reputation r
        JOIN users u ON r.user_id = u.id
        WHERE r.course_id = $${paramCount}
        ORDER BY r.total_points DESC
      `;
      values.push(courseId);
      paramCount++;
    }

    query += ` LIMIT $${paramCount}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getReputationHistory(userId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM reputation_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // ========================================
  // SEARCH
  // ========================================

  async searchThreads(
    searchQuery: string,
    filters: {
      categoryId?: string;
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM active_threads
      WHERE (
        title ILIKE $1
        OR content ILIKE $1
        OR $2 = ANY(tags)
      )
    `;

    const searchPattern = `%${searchQuery}%`;
    const values: any[] = [searchPattern, searchQuery];
    let paramCount = 3;

    if (filters.categoryId) {
      query += ` AND category_id = $${paramCount}`;
      values.push(filters.categoryId);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramCount}`;
      values.push(filters.tags);
      paramCount++;
    }

    query += ` ORDER BY score DESC, last_activity_at DESC LIMIT $${paramCount}`;
    values.push(filters.limit || 20);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getCategoryStats(categoryId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT t.id) AS total_threads,
        COUNT(DISTINCT r.id) AS total_replies,
        COUNT(DISTINCT t.author_id) AS unique_authors,
        COUNT(DISTINCT CASE WHEN t.is_question THEN t.id END) AS total_questions,
        COUNT(DISTINCT CASE WHEN t.has_accepted_answer THEN t.id END) AS answered_questions,
        MAX(t.last_activity_at) AS last_activity
      FROM discussion_threads t
      LEFT JOIN thread_replies r ON t.id = r.thread_id AND r.is_deleted = false
      WHERE t.category_id = $1 AND t.is_deleted = false
    `;

    const result = await pool.query(query, [categoryId]);
    return result.rows[0];
  }

  async getUnansweredQuestions(categoryId?: string, limit: number = 20): Promise<any[]> {
    let query = 'SELECT * FROM unanswered_questions WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (categoryId) {
      query += ` AND category_id = $${paramCount}`;
      values.push(categoryId);
      paramCount++;
    }

    query += ` LIMIT $${paramCount}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export const forumService = new ForumService();
