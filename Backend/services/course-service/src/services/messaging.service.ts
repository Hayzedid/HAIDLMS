import pool from '../db/pool';

interface CreateConversationParams {
  type: 'direct' | 'group';
  createdBy: string;
  title?: string;
  description?: string;
  participantIds: string[];
}

interface SendMessageParams {
  conversationId: string;
  senderId: string;
  content: string;
  contentType?: string;
  parentMessageId?: string;
  mentions?: string[];
  attachments?: any[];
  metadata?: any;
}

export class MessagingService {
  // ========================================
  // CONVERSATIONS
  // ========================================

  async createConversation(params: CreateConversationParams): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create conversation
      const convQuery = `
        INSERT INTO conversations (type, title, description, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const convResult = await client.query(convQuery, [
        params.type,
        params.title,
        params.description,
        params.createdBy,
      ]);

      const conversation = convResult.rows[0];

      // Add participants
      const participantQuery = `
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES ($1, $2, $3)
      `;

      for (const userId of params.participantIds) {
        const role = userId === params.createdBy ? 'admin' : 'member';
        await client.query(participantQuery, [conversation.id, userId, role]);
      }

      // Create conversation settings
      await client.query(
        'INSERT INTO conversation_settings (conversation_id) VALUES ($1)',
        [conversation.id]
      );

      await client.query('COMMIT');

      return conversation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<any> {
    const query = 'SELECT get_or_create_direct_conversation($1, $2) AS conversation_id';
    const result = await pool.query(query, [user1Id, user2Id]);
    const conversationId = result.rows[0].conversation_id;

    return this.getConversation(conversationId, user1Id);
  }

  async getConversation(conversationId: string, userId: string): Promise<any> {
    const query = `
      SELECT * FROM user_conversations
      WHERE conversation_id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [conversationId, userId]);
    return result.rows[0] || null;
  }

  async getUserConversations(
    userId: string,
    filters: {
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ conversations: any[]; total: number }> {
    let query = `
      SELECT * FROM user_conversations
      WHERE user_id = $1
    `;

    const values: any[] = [userId];
    let paramCount = 2;

    if (filters.type) {
      query += ` AND type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query += ` ORDER BY last_message_at DESC NULLS LAST LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      conversations: result.rows,
      total,
    };
  }

  async updateConversation(
    conversationId: string,
    updates: {
      title?: string;
      description?: string;
      avatarUrl?: string;
    }
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(conversationId);

    const query = `
      UPDATE conversations
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await pool.query(
      'UPDATE conversations SET is_archived = true, archived_at = NOW(), updated_at = NOW() WHERE id = $1',
      [conversationId]
    );
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    await pool.query(
      'UPDATE conversations SET is_archived = false, archived_at = NULL, updated_at = NOW() WHERE id = $1',
      [conversationId]
    );
  }

  // ========================================
  // PARTICIPANTS
  // ========================================

  async addParticipants(
    conversationId: string,
    userIds: string[],
    addedBy: string
  ): Promise<void> {
    const query = `
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET is_active = true, left_at = NULL, updated_at = NOW()
    `;

    for (const userId of userIds) {
      await pool.query(query, [conversationId, userId]);
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE conversation_participants SET is_active = false, left_at = NOW(), updated_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
  }

  async getParticipants(conversationId: string): Promise<any[]> {
    const query = `
      SELECT cp.*, u.full_name, u.email, u.avatar_url
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = $1 AND cp.is_active = true
      ORDER BY cp.joined_at ASC
    `;

    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  async updateParticipant(
    conversationId: string,
    userId: string,
    updates: {
      role?: string;
      isMuted?: boolean;
      mutedUntil?: Date;
    }
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(conversationId, userId);

    const query = `
      UPDATE conversation_participants
      SET ${fields.join(', ')}
      WHERE conversation_id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // MESSAGES
  // ========================================

  async sendMessage(params: SendMessageParams): Promise<any> {
    const query = `
      INSERT INTO messages (
        conversation_id, sender_id, content, content_type,
        parent_message_id, mentions, attachments, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      params.conversationId,
      params.senderId,
      params.content,
      params.contentType || 'text',
      params.parentMessageId,
      params.mentions || [],
      params.attachments ? JSON.stringify(params.attachments) : null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ];

    const result = await pool.query(query, values);
    const message = result.rows[0];

    // Get message with sender details
    return this.getMessage(message.id);
  }

  async getMessage(messageId: string): Promise<any> {
    const query = 'SELECT * FROM message_details WHERE id = $1';
    const result = await pool.query(query, [messageId]);
    return result.rows[0] || null;
  }

  async getMessages(
    conversationId: string,
    filters: {
      beforeMessageId?: string;
      afterMessageId?: string;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM message_details
      WHERE conversation_id = $1
    `;

    const values: any[] = [conversationId];
    let paramCount = 2;

    if (filters.beforeMessageId) {
      query += ` AND created_at < (SELECT created_at FROM messages WHERE id = $${paramCount})`;
      values.push(filters.beforeMessageId);
      paramCount++;
    }

    if (filters.afterMessageId) {
      query += ` AND created_at > (SELECT created_at FROM messages WHERE id = $${paramCount})`;
      values.push(filters.afterMessageId);
      paramCount++;
    }

    const limit = filters.limit || 50;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows.reverse(); // Return in chronological order
  }

  async updateMessage(
    messageId: string,
    senderId: string,
    content: string
  ): Promise<any> {
    const query = `
      UPDATE messages
      SET content = $1, is_edited = true, edited_at = NOW(), updated_at = NOW()
      WHERE id = $2 AND sender_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [content, messageId, senderId]);
    return result.rows[0];
  }

  async deleteMessage(messageId: string, senderId: string): Promise<void> {
    await pool.query(
      'UPDATE messages SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND sender_id = $2',
      [messageId, senderId]
    );
  }

  async getThreadMessages(parentMessageId: string): Promise<any[]> {
    const query = `
      SELECT * FROM message_details
      WHERE parent_message_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [parentMessageId]);
    return result.rows;
  }

  // ========================================
  // READ RECEIPTS & UNREAD
  // ========================================

  async markConversationRead(conversationId: string, userId: string): Promise<number> {
    const query = 'SELECT mark_conversation_read($1, $2) AS count';
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows[0].count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(unread_count), 0) AS total_unread
      FROM conversation_participants
      WHERE user_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total_unread);
  }

  async getMessageReadReceipts(messageId: string): Promise<any[]> {
    const query = `
      SELECT mrr.*, u.full_name, u.avatar_url
      FROM message_read_receipts mrr
      JOIN users u ON mrr.user_id = u.id
      WHERE mrr.message_id = $1
      ORDER BY mrr.read_at ASC
    `;

    const result = await pool.query(query, [messageId]);
    return result.rows;
  }

  // ========================================
  // REACTIONS
  // ========================================

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await pool.query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [messageId, userId, emoji]
    );
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await pool.query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    const query = `
      SELECT emoji, COUNT(*) AS count, array_agg(user_id) AS users
      FROM message_reactions
      WHERE message_id = $1
      GROUP BY emoji
    `;

    const result = await pool.query(query, [messageId]);
    return result.rows;
  }

  // ========================================
  // TYPING INDICATORS
  // ========================================

  async setTypingIndicator(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    if (isTyping) {
      await pool.query(
        `INSERT INTO typing_indicators (conversation_id, user_id, is_typing, expires_at)
         VALUES ($1, $2, true, NOW() + INTERVAL '10 seconds')
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET is_typing = true, started_at = NOW(), expires_at = NOW() + INTERVAL '10 seconds'`,
        [conversationId, userId]
      );
    } else {
      await pool.query(
        'DELETE FROM typing_indicators WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, userId]
      );
    }
  }

  async getTypingIndicators(conversationId: string): Promise<any[]> {
    // Clean up expired indicators first
    await pool.query('SELECT cleanup_expired_typing_indicators()');

    const query = `
      SELECT ti.user_id, u.full_name
      FROM typing_indicators ti
      JOIN users u ON ti.user_id = u.id
      WHERE ti.conversation_id = $1
        AND ti.is_typing = true
        AND ti.expires_at > NOW()
    `;

    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  // ========================================
  // ATTACHMENTS
  // ========================================

  async addAttachment(
    messageId: string,
    conversationId: string,
    uploadedBy: string,
    fileInfo: {
      fileName: string;
      fileType: string;
      fileSize: number;
      fileUrl: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
      durationSeconds?: number;
    }
  ): Promise<any> {
    const query = `
      INSERT INTO message_attachments (
        message_id, conversation_id, uploaded_by, file_name,
        file_type, file_size, file_url, thumbnail_url,
        width, height, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      messageId,
      conversationId,
      uploadedBy,
      fileInfo.fileName,
      fileInfo.fileType,
      fileInfo.fileSize,
      fileInfo.fileUrl,
      fileInfo.thumbnailUrl,
      fileInfo.width,
      fileInfo.height,
      fileInfo.durationSeconds,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getConversationAttachments(
    conversationId: string,
    fileType?: string
  ): Promise<any[]> {
    let query = `
      SELECT * FROM message_attachments
      WHERE conversation_id = $1
    `;

    const values: any[] = [conversationId];

    if (fileType) {
      query += ' AND file_type LIKE $2';
      values.push(`${fileType}%`);
    }

    query += ' ORDER BY uploaded_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // SEARCH
  // ========================================

  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    limit: number = 20
  ): Promise<any[]> {
    const searchQuery = 'SELECT * FROM search_messages($1, $2, $3, $4)';
    const result = await pool.query(searchQuery, [userId, query, conversationId, limit]);
    return result.rows;
  }

  // ========================================
  // BLOCKING
  // ========================================

  async blockUser(blockerUserId: string, blockedUserId: string, reason?: string): Promise<void> {
    await pool.query(
      'INSERT INTO blocked_users (blocker_user_id, blocked_user_id, reason) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [blockerUserId, blockedUserId, reason]
    );
  }

  async unblockUser(blockerUserId: string, blockedUserId: string): Promise<void> {
    await pool.query(
      'DELETE FROM blocked_users WHERE blocker_user_id = $1 AND blocked_user_id = $2',
      [blockerUserId, blockedUserId]
    );
  }

  async getBlockedUsers(userId: string): Promise<any[]> {
    const query = `
      SELECT bu.*, u.full_name, u.email, u.avatar_url
      FROM blocked_users bu
      JOIN users u ON bu.blocked_user_id = u.id
      WHERE bu.blocker_user_id = $1
      ORDER BY bu.blocked_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async isUserBlocked(user1Id: string, user2Id: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM blocked_users
        WHERE (blocker_user_id = $1 AND blocked_user_id = $2)
           OR (blocker_user_id = $2 AND blocked_user_id = $1)
      ) AS is_blocked
    `;

    const result = await pool.query(query, [user1Id, user2Id]);
    return result.rows[0].is_blocked;
  }

  // ========================================
  // CONVERSATION SETTINGS
  // ========================================

  async getConversationSettings(conversationId: string): Promise<any> {
    const query = 'SELECT * FROM conversation_settings WHERE conversation_id = $1';
    const result = await pool.query(query, [conversationId]);
    return result.rows[0] || null;
  }

  async updateConversationSettings(
    conversationId: string,
    settings: any
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(conversationId);

    const query = `
      UPDATE conversation_settings
      SET ${fields.join(', ')}
      WHERE conversation_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getConversationStats(conversationId: string): Promise<any> {
    const query = `
      SELECT
        c.id,
        c.type,
        c.created_at,
        COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.is_active = true) AS active_participants,
        COUNT(DISTINCT m.id) AS total_messages,
        COUNT(DISTINCT m.sender_id) AS unique_senders,
        MAX(m.created_at) AS last_message_at,
        COUNT(DISTINCT ma.id) AS total_attachments
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN messages m ON c.id = m.conversation_id AND m.is_deleted = false
      LEFT JOIN message_attachments ma ON c.id = ma.conversation_id
      WHERE c.id = $1
      GROUP BY c.id, c.type, c.created_at
    `;

    const result = await pool.query(query, [conversationId]);
    return result.rows[0] || null;
  }
}

export const messagingService = new MessagingService();
