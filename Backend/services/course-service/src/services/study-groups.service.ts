import pool from '../db/pool';

interface CreateStudyGroupParams {
  name: string;
  description?: string;
  courseId?: string;
  createdBy: string;
  groupType?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  maxMembers?: number;
  learningGoals?: string[];
  focusAreas?: string[];
  tags?: string[];
}

interface CreateSessionParams {
  groupId: string;
  title: string;
  description?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  locationType?: string;
  locationDetails?: string;
  meetingLink?: string;
  agenda?: string;
  topics?: string[];
  organizedBy: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

interface CreateResourceParams {
  groupId: string;
  uploadedBy: string;
  title: string;
  description?: string;
  resourceType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  externalLink?: string;
  content?: string;
  contentFormat?: string;
  tags?: string[];
  relatedSessionId?: string;
}

export class StudyGroupsService {
  // ========================================
  // STUDY GROUPS
  // ========================================

  async createStudyGroup(params: CreateStudyGroupParams): Promise<any> {
    const query = `
      INSERT INTO study_groups (
        name, description, course_id, created_by, group_type,
        is_private, requires_approval, max_members,
        learning_goals, focus_areas, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      params.name,
      params.description,
      params.courseId,
      params.createdBy,
      params.groupType || 'study',
      params.isPrivate || false,
      params.requiresApproval || false,
      params.maxMembers || 50,
      params.learningGoals || [],
      params.focusAreas || [],
      params.tags || [],
    ];

    const result = await pool.query(query, values);
    const group = result.rows[0];

    // Add creator as leader
    await this.addMember(group.id, params.createdBy, 'leader', 'active');

    return group;
  }

  async getStudyGroup(groupId: string): Promise<any> {
    const query = 'SELECT * FROM study_group_summary WHERE group_id = $1';
    const result = await pool.query(query, [groupId]);
    return result.rows[0] || null;
  }

  async listStudyGroups(
    filters: {
      courseId?: string;
      userId?: string;
      groupType?: string;
      isPrivate?: boolean;
      status?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ groups: any[]; total: number }> {
    let query = `
      SELECT * FROM study_group_summary
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (filters.courseId) {
      query += ` AND course_id = $${paramCount}`;
      values.push(filters.courseId);
      paramCount++;
    }

    if (filters.userId) {
      query += ` AND group_id IN (
        SELECT group_id FROM study_group_members
        WHERE user_id = $${paramCount} AND status = 'active'
      )`;
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.groupType) {
      query += ` AND group_type = $${paramCount}`;
      values.push(filters.groupType);
      paramCount++;
    }

    if (filters.isPrivate !== undefined) {
      query += ` AND is_private = $${paramCount}`;
      values.push(filters.isPrivate);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramCount}::text[]`;
      values.push(filters.tags);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      groups: result.rows,
      total,
    };
  }

  async updateStudyGroup(groupId: string, updates: any): Promise<any> {
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
    values.push(groupId);

    const query = `
      UPDATE study_groups
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteStudyGroup(groupId: string): Promise<void> {
    await pool.query(
      "UPDATE study_groups SET status = 'archived', updated_at = NOW() WHERE id = $1",
      [groupId]
    );
  }

  // ========================================
  // MEMBERS
  // ========================================

  async addMember(
    groupId: string,
    userId: string,
    role: string = 'member',
    status: string = 'active'
  ): Promise<any> {
    const query = 'SELECT add_study_group_member($1, $2, $3) AS success';
    const result = await pool.query(query, [groupId, userId, role]);

    if (!result.rows[0].success) {
      throw new Error('Group is full');
    }

    return this.getMember(groupId, userId);
  }

  async getMember(groupId: string, userId: string): Promise<any> {
    const query = `
      SELECT * FROM study_group_member_activity
      WHERE group_id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [groupId, userId]);
    return result.rows[0] || null;
  }

  async getMembers(
    groupId: string,
    filters: {
      role?: string;
      status?: string;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM study_group_member_activity
      WHERE group_id = $1
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (filters.role) {
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY joined_at ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateMember(groupId: string, userId: string, updates: any): Promise<any> {
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
    values.push(groupId, userId);

    const query = `
      UPDATE study_group_members
      SET ${fields.join(', ')}
      WHERE group_id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await pool.query(
      "UPDATE study_group_members SET status = 'inactive', updated_at = NOW() WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    // Decrement member count
    await pool.query(
      'UPDATE study_groups SET current_member_count = GREATEST(0, current_member_count - 1), updated_at = NOW() WHERE id = $1',
      [groupId]
    );
  }

  // ========================================
  // SESSIONS
  // ========================================

  async createSession(params: CreateSessionParams): Promise<any> {
    const query = `
      INSERT INTO study_sessions (
        group_id, title, description, scheduled_start_time, scheduled_end_time,
        location_type, location_details, meeting_link, agenda, topics,
        organized_by, is_recurring, recurrence_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      params.groupId,
      params.title,
      params.description,
      params.scheduledStartTime,
      params.scheduledEndTime,
      params.locationType || 'virtual',
      params.locationDetails,
      params.meetingLink,
      params.agenda,
      params.topics || [],
      params.organizedBy,
      params.isRecurring || false,
      params.recurrencePattern,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getSession(sessionId: string): Promise<any> {
    const query = 'SELECT * FROM study_sessions WHERE id = $1';
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async getSessions(
    groupId: string,
    filters: {
      status?: string;
      upcoming?: boolean;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM study_sessions
      WHERE group_id = $1
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.upcoming) {
      query += ` AND scheduled_start_time > NOW()`;
    }

    query += ' ORDER BY scheduled_start_time DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateSession(sessionId: string, updates: any): Promise<any> {
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
    values.push(sessionId);

    const query = `
      UPDATE study_sessions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteSession(sessionId: string): Promise<void> {
    await pool.query(
      "UPDATE study_sessions SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [sessionId]
    );
  }

  async rsvpSession(sessionId: string, userId: string, rsvpStatus: string): Promise<any> {
    const query = `
      INSERT INTO session_attendance (session_id, user_id, rsvp_status, rsvp_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (session_id, user_id)
      DO UPDATE SET rsvp_status = $3, rsvp_at = NOW(), updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [sessionId, userId, rsvpStatus]);
    return result.rows[0];
  }

  async checkInSession(sessionId: string, userId: string): Promise<any> {
    const query = `
      UPDATE session_attendance
      SET attendance_status = 'present', checked_in_at = NOW(), updated_at = NOW()
      WHERE session_id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [sessionId, userId]);
    return result.rows[0];
  }

  async getSessionAttendance(sessionId: string): Promise<any[]> {
    const query = `
      SELECT sa.*, u.full_name, u.email, u.avatar_url
      FROM session_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.session_id = $1
      ORDER BY sa.checked_in_at DESC NULLS LAST
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }

  // ========================================
  // RESOURCES
  // ========================================

  async createResource(params: CreateResourceParams): Promise<any> {
    const query = `
      INSERT INTO study_group_resources (
        group_id, uploaded_by, title, description, resource_type,
        file_url, file_name, file_size, external_link,
        content, content_format, tags, related_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      params.groupId,
      params.uploadedBy,
      params.title,
      params.description,
      params.resourceType,
      params.fileUrl,
      params.fileName,
      params.fileSize,
      params.externalLink,
      params.content,
      params.contentFormat || 'markdown',
      params.tags || [],
      params.relatedSessionId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getResource(resourceId: string): Promise<any> {
    const query = 'SELECT * FROM study_group_resources WHERE id = $1';
    const result = await pool.query(query, [resourceId]);
    return result.rows[0] || null;
  }

  async getResources(
    groupId: string,
    filters: {
      resourceType?: string;
      tags?: string[];
      isPinned?: boolean;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM study_group_resources
      WHERE group_id = $1 AND is_archived = false
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filters.resourceType);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramCount}::text[]`;
      values.push(filters.tags);
      paramCount++;
    }

    if (filters.isPinned !== undefined) {
      query += ` AND is_pinned = $${paramCount}`;
      values.push(filters.isPinned);
      paramCount++;
    }

    query += ' ORDER BY is_pinned DESC, uploaded_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateResource(resourceId: string, updates: any): Promise<any> {
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
    values.push(resourceId);

    const query = `
      UPDATE study_group_resources
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteResource(resourceId: string): Promise<void> {
    await pool.query(
      'UPDATE study_group_resources SET is_archived = true, updated_at = NOW() WHERE id = $1',
      [resourceId]
    );
  }

  // ========================================
  // TASKS
  // ========================================

  async createTask(task: any): Promise<any> {
    const query = `
      INSERT INTO group_tasks (
        group_id, title, description, assigned_by, assigned_to,
        due_date, estimated_hours, priority, related_resource_id, related_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      task.groupId,
      task.title,
      task.description,
      task.assignedBy,
      task.assignedTo || [],
      task.dueDate,
      task.estimatedHours,
      task.priority || 'medium',
      task.relatedResourceId,
      task.relatedSessionId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getTasks(
    groupId: string,
    filters: {
      userId?: string;
      status?: string;
      priority?: string;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT * FROM group_tasks
      WHERE group_id = $1
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (filters.userId) {
      query += ` AND ($${paramCount} = ANY(assigned_to) OR assigned_to IS NULL)`;
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramCount}`;
      values.push(filters.priority);
      paramCount++;
    }

    query += ' ORDER BY due_date ASC NULLS LAST, priority DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateTask(taskId: string, updates: any): Promise<any> {
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
    values.push(taskId);

    const query = `
      UPDATE group_tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async completeTask(taskId: string, completionNotes?: string): Promise<any> {
    const query = `
      UPDATE group_tasks
      SET status = 'completed', completed_at = NOW(), completion_notes = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [taskId, completionNotes]);
    return result.rows[0];
  }

  // ========================================
  // STUDY LOGS
  // ========================================

  async createStudyLog(log: any): Promise<any> {
    const query = `
      INSERT INTO study_logs (
        group_id, user_id, study_date, duration_minutes, topics_studied,
        notes, related_session_id, related_resource_ids,
        productivity_rating, mood_rating, is_shared
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      log.groupId,
      log.userId,
      log.studyDate,
      log.durationMinutes,
      log.topicsStudied || [],
      log.notes,
      log.relatedSessionId,
      log.relatedResourceIds || [],
      log.productivityRating,
      log.moodRating,
      log.isShared !== undefined ? log.isShared : true,
    ];

    const result = await pool.query(query, values);

    // Update member's study hours
    await pool.query(
      'UPDATE study_group_members SET study_hours_logged = study_hours_logged + $1, updated_at = NOW() WHERE group_id = $2 AND user_id = $3',
      [Math.floor(log.durationMinutes / 60), log.groupId, log.userId]
    );

    return result.rows[0];
  }

  async getStudyLogs(
    groupId: string,
    filters: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT sl.*, u.full_name, u.avatar_url
      FROM study_logs sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.group_id = $1 AND sl.is_shared = true
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (filters.userId) {
      query += ` AND sl.user_id = $${paramCount}`;
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND sl.study_date >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND sl.study_date <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    query += ' ORDER BY sl.study_date DESC, sl.logged_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async aggregateAnalytics(groupId: string, date: Date = new Date()): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    await pool.query('SELECT aggregate_study_group_analytics($1, $2)', [groupId, dateStr]);
  }

  async getAnalytics(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = `
      SELECT * FROM study_group_analytics
      WHERE group_id = $1
    `;

    const values: any[] = [groupId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getGroupStats(groupId: string): Promise<any> {
    const query = `
      SELECT
        sg.id,
        sg.name,
        sg.current_member_count,
        sg.total_sessions,
        sg.total_resources,
        COUNT(DISTINCT ss.id) FILTER (WHERE ss.status = 'scheduled' AND ss.scheduled_start_time > NOW()) AS upcoming_sessions,
        COUNT(DISTINCT gt.id) FILTER (WHERE gt.status = 'pending') AS pending_tasks,
        COALESCE(SUM(sl.duration_minutes), 0) / 60.0 AS total_study_hours,
        COALESCE(AVG(sa.attendance_status = 'present'::text)::numeric * 100, 0) AS avg_attendance_rate
      FROM study_groups sg
      LEFT JOIN study_sessions ss ON sg.id = ss.group_id
      LEFT JOIN group_tasks gt ON sg.id = gt.group_id
      LEFT JOIN study_logs sl ON sg.id = sl.group_id
      LEFT JOIN session_attendance sa ON ss.id = sa.session_id
      WHERE sg.id = $1
      GROUP BY sg.id, sg.name, sg.current_member_count, sg.total_sessions, sg.total_resources
    `;

    const result = await pool.query(query, [groupId]);
    return result.rows[0] || null;
  }
}

export const studyGroupsService = new StudyGroupsService();
