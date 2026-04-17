import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateLiveClassParams {
  courseId?: string;
  moduleId?: string;
  instructorId: string;
  title: string;
  description?: string;
  classType?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  timezone?: string;
  isRecurring?: boolean;
  recurrencePattern?: any;
  accessType?: string;
  requiresApproval?: boolean;
  maxParticipants?: number;
  password?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  enableRecording?: boolean;
  enableChat?: boolean;
  enableScreenSharing?: boolean;
  enableWhiteboard?: boolean;
  enableBreakoutRooms?: boolean;
  enablePolls?: boolean;
  enableQa?: boolean;
  enableHandRaise?: boolean;
  tags?: string[];
  attachments?: any;
}

interface CreatePollParams {
  classId: string;
  createdBy: string;
  question: string;
  pollType?: string;
  options?: any;
  isAnonymous?: boolean;
  allowMultipleAnswers?: boolean;
  showResultsImmediately?: boolean;
}

// ============================================================================
// LIVE CLASSES SERVICE
// ============================================================================

export class LiveClassesService {
  // ========================================
  // LIVE CLASSES
  // ========================================

  async createLiveClass(params: CreateLiveClassParams): Promise<any> {
    const {
      courseId,
      moduleId,
      instructorId,
      title,
      description,
      classType = 'lecture',
      scheduledStartTime,
      scheduledEndTime,
      timezone = 'UTC',
      isRecurring = false,
      recurrencePattern,
      accessType = 'enrolled',
      requiresApproval = false,
      maxParticipants = 100,
      password,
      meetingProvider = 'internal',
      meetingUrl,
      meetingId,
      meetingPassword,
      enableRecording = true,
      enableChat = true,
      enableScreenSharing = true,
      enableWhiteboard = true,
      enableBreakoutRooms = false,
      enablePolls = true,
      enableQa = true,
      enableHandRaise = true,
      tags,
      attachments
    } = params;

    const result = await pool.query(
      `INSERT INTO live_classes (
        course_id, module_id, instructor_id, title, description, class_type,
        scheduled_start_time, scheduled_end_time, timezone, is_recurring, recurrence_pattern,
        access_type, requires_approval, max_participants, password,
        meeting_provider, meeting_url, meeting_id, meeting_password,
        enable_recording, enable_chat, enable_screen_sharing, enable_whiteboard,
        enable_breakout_rooms, enable_polls, enable_qa, enable_hand_raise,
        tags, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        courseId || null, moduleId || null, instructorId, title, description, classType,
        scheduledStartTime, scheduledEndTime, timezone, isRecurring, recurrencePattern ? JSON.stringify(recurrencePattern) : null,
        accessType, requiresApproval, maxParticipants, password,
        meetingProvider, meetingUrl, meetingId, meetingPassword,
        enableRecording, enableChat, enableScreenSharing, enableWhiteboard,
        enableBreakoutRooms, enablePolls, enableQa, enableHandRaise,
        tags || [], attachments ? JSON.stringify(attachments) : null
      ]
    );

    return result.rows[0];
  }

  async getLiveClass(classId: string): Promise<any> {
    const result = await pool.query(
      `SELECT lc.*,
        u.name as instructor_name,
        u.email as instructor_email,
        c.title as course_title
      FROM live_classes lc
      JOIN users u ON lc.instructor_id = u.id
      LEFT JOIN courses c ON lc.course_id = c.id
      WHERE lc.id = $1`,
      [classId]
    );

    return result.rows[0];
  }

  async listLiveClasses(filters: any = {}): Promise<{ classes: any[]; total: number }> {
    const {
      courseId,
      instructorId,
      classType,
      status,
      fromDate,
      toDate,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT lc.*,
        u.name as instructor_name,
        c.title as course_title,
        COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.registration_status IN ('registered', 'approved')) as registered_count
      FROM live_classes lc
      JOIN users u ON lc.instructor_id = u.id
      LEFT JOIN courses c ON lc.course_id = c.id
      LEFT JOIN class_participants cp ON lc.id = cp.class_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (courseId) {
      query += ` AND lc.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (instructorId) {
      query += ` AND lc.instructor_id = $${paramIndex}`;
      params.push(instructorId);
      paramIndex++;
    }

    if (classType) {
      query += ` AND lc.class_type = $${paramIndex}`;
      params.push(classType);
      paramIndex++;
    }

    if (status) {
      query += ` AND lc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND lc.scheduled_start_time >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND lc.scheduled_end_time <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += ` GROUP BY lc.id, u.name, c.title ORDER BY lc.scheduled_start_time DESC`;

    const countQuery = `SELECT COUNT(DISTINCT lc.id) as total FROM live_classes lc WHERE 1=1${
      courseId ? ` AND lc.course_id = $1` : ''
    }${instructorId ? ` AND lc.instructor_id = $${courseId ? 2 : 1}` : ''}`;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      classes: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async updateLiveClass(classId: string, updates: any): Promise<any> {
    const allowedFields = [
      'title', 'description', 'class_type', 'scheduled_start_time', 'scheduled_end_time',
      'timezone', 'access_type', 'requires_approval', 'max_participants', 'password',
      'meeting_url', 'meeting_id', 'meeting_password', 'recording_url', 'recording_duration',
      'recording_size', 'tags', 'attachments', 'status'
    ];

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

    values.push(classId);
    const result = await pool.query(
      `UPDATE live_classes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteLiveClass(classId: string): Promise<void> {
    await pool.query(`DELETE FROM live_classes WHERE id = $1`, [classId]);
  }

  async startLiveClass(classId: string): Promise<any> {
    await pool.query(`SELECT start_live_class($1)`, [classId]);
    return this.getLiveClass(classId);
  }

  async endLiveClass(classId: string): Promise<any> {
    await pool.query(`SELECT end_live_class($1)`, [classId]);
    return this.getLiveClass(classId);
  }

  async getUpcomingClasses(limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM upcoming_classes LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // ========================================
  // PARTICIPANTS
  // ========================================

  async registerParticipant(classId: string, userId: string, registrationStatus: string = 'registered'): Promise<any> {
    const result = await pool.query(
      `INSERT INTO class_participants (class_id, user_id, registration_status)
      VALUES ($1, $2, $3)
      ON CONFLICT (class_id, user_id) DO UPDATE
      SET registration_status = $3, updated_at = NOW()
      RETURNING *`,
      [classId, userId, registrationStatus]
    );

    return result.rows[0];
  }

  async updateParticipant(classId: string, userId: string, updates: any): Promise<any> {
    const allowedFields = [
      'registration_status', 'role', 'can_share_screen', 'can_use_chat',
      'can_use_whiteboard', 'can_create_polls', 'is_muted_by_host', 'notes'
    ];

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

    values.push(classId, userId);
    const result = await pool.query(
      `UPDATE class_participants SET ${fields.join(', ')}, updated_at = NOW()
      WHERE class_id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async joinClass(classId: string, userId: string): Promise<void> {
    await pool.query(`SELECT join_class($1, $2)`, [classId, userId]);
  }

  async leaveClass(classId: string, userId: string): Promise<void> {
    await pool.query(`SELECT leave_class($1, $2)`, [classId, userId]);
  }

  async getClassParticipants(classId: string, filters: any = {}): Promise<any[]> {
    const { isPresent, role, registrationStatus } = filters;

    let query = `
      SELECT cp.*, u.name as user_name, u.email as user_email, u.avatar_url
      FROM class_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.class_id = $1
    `;

    const params: any[] = [classId];
    let paramIndex = 2;

    if (isPresent !== undefined) {
      query += ` AND cp.is_present = $${paramIndex}`;
      params.push(isPresent);
      paramIndex++;
    }

    if (role) {
      query += ` AND cp.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (registrationStatus) {
      query += ` AND cp.registration_status = $${paramIndex}`;
      params.push(registrationStatus);
      paramIndex++;
    }

    query += ` ORDER BY cp.joined_at DESC NULLS LAST`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getActiveParticipants(classId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_participants WHERE class_id = $1`,
      [classId]
    );
    return result.rows;
  }

  // ========================================
  // BREAKOUT ROOMS
  // ========================================

  async createBreakoutRoom(classId: string, name: string, roomNumber: number, options: any = {}): Promise<any> {
    const {
      description,
      assignmentMethod = 'manual',
      maxParticipants = 10,
      durationMinutes
    } = options;

    const result = await pool.query(
      `INSERT INTO breakout_rooms (class_id, name, room_number, description, assignment_method, max_participants, duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [classId, name, roomNumber, description, assignmentMethod, maxParticipants, durationMinutes]
    );

    return result.rows[0];
  }

  async assignToBreakoutRoom(roomId: string, userId: string, classId: string, assignedBy: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO breakout_room_assignments (room_id, user_id, class_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (room_id, user_id) DO UPDATE SET assigned_at = NOW()
      RETURNING *`,
      [roomId, userId, classId, assignedBy]
    );

    return result.rows[0];
  }

  async openBreakoutRoom(roomId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE breakout_rooms SET status = 'open', opened_at = NOW() WHERE id = $1 RETURNING *`,
      [roomId]
    );
    return result.rows[0];
  }

  async closeBreakoutRoom(roomId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE breakout_rooms SET status = 'closed', closed_at = NOW() WHERE id = $1 RETURNING *`,
      [roomId]
    );
    return result.rows[0];
  }

  async getBreakoutRooms(classId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT br.*,
        COUNT(DISTINCT bra.user_id) as assigned_count
      FROM breakout_rooms br
      LEFT JOIN breakout_room_assignments bra ON br.id = bra.room_id
      WHERE br.class_id = $1
      GROUP BY br.id
      ORDER BY br.room_number`,
      [classId]
    );
    return result.rows;
  }

  // ========================================
  // WHITEBOARD
  // ========================================

  async createWhiteboardSession(classId: string, createdBy: string, title?: string, roomId?: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO whiteboard_sessions (class_id, room_id, title, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [classId, roomId || null, title, createdBy]
    );

    return result.rows[0];
  }

  async updateWhiteboardCanvas(sessionId: string, canvasData: any): Promise<any> {
    const result = await pool.query(
      `UPDATE whiteboard_sessions SET canvas_data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(canvasData), sessionId]
    );
    return result.rows[0];
  }

  async addWhiteboardAction(sessionId: string, userId: string, actionType: string, actionData: any, sequenceNumber: number): Promise<any> {
    const result = await pool.query(
      `INSERT INTO whiteboard_actions (session_id, user_id, action_type, action_data, sequence_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [sessionId, userId, actionType, JSON.stringify(actionData), sequenceNumber]
    );
    return result.rows[0];
  }

  async getWhiteboardSession(sessionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM whiteboard_sessions WHERE id = $1`,
      [sessionId]
    );
    return result.rows[0];
  }

  // ========================================
  // CHAT
  // ========================================

  async sendChatMessage(classId: string, userId: string, content: string, options: any = {}): Promise<any> {
    const {
      roomId,
      messageType = 'text',
      isPrivate = false,
      recipientId,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      replyToId
    } = options;

    const result = await pool.query(
      `INSERT INTO class_chat_messages (
        class_id, room_id, user_id, content, message_type,
        is_private, recipient_id, file_url, file_name, file_size, file_type, reply_to_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [classId, roomId || null, userId, content, messageType, isPrivate, recipientId || null,
       fileUrl, fileName, fileSize, fileType, replyToId || null]
    );

    return result.rows[0];
  }

  async getChatMessages(classId: string, options: any = {}): Promise<any[]> {
    const { roomId, limit = 100, beforeMessageId } = options;

    let query = `
      SELECT ccm.*, u.name as user_name, u.avatar_url
      FROM class_chat_messages ccm
      JOIN users u ON ccm.user_id = u.id
      WHERE ccm.class_id = $1 AND ccm.is_deleted = false
    `;

    const params: any[] = [classId];
    let paramIndex = 2;

    if (roomId) {
      query += ` AND ccm.room_id = $${paramIndex}`;
      params.push(roomId);
      paramIndex++;
    } else {
      query += ` AND ccm.room_id IS NULL`;
    }

    if (beforeMessageId) {
      query += ` AND ccm.created_at < (SELECT created_at FROM class_chat_messages WHERE id = $${paramIndex})`;
      params.push(beforeMessageId);
      paramIndex++;
    }

    query += ` ORDER BY ccm.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.reverse();
  }

  async deleteChatMessage(messageId: string, deletedBy: string): Promise<void> {
    await pool.query(
      `UPDATE class_chat_messages SET is_deleted = true, deleted_by = $1, deleted_at = NOW() WHERE id = $2`,
      [deletedBy, messageId]
    );
  }

  // ========================================
  // POLLS
  // ========================================

  async createPoll(params: CreatePollParams): Promise<any> {
    const {
      classId,
      createdBy,
      question,
      pollType = 'multiple_choice',
      options,
      isAnonymous = false,
      allowMultipleAnswers = false,
      showResultsImmediately = true
    } = params;

    const result = await pool.query(
      `INSERT INTO class_polls (
        class_id, created_by, question, poll_type, options,
        is_anonymous, allow_multiple_answers, show_results_immediately
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [classId, createdBy, question, pollType, JSON.stringify(options), isAnonymous, allowMultipleAnswers, showResultsImmediately]
    );

    return result.rows[0];
  }

  async startPoll(pollId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE class_polls SET status = 'active', started_at = NOW() WHERE id = $1 RETURNING *`,
      [pollId]
    );
    return result.rows[0];
  }

  async closePoll(pollId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE class_polls SET status = 'closed', closed_at = NOW() WHERE id = $1 RETURNING *`,
      [pollId]
    );
    return result.rows[0];
  }

  async submitPollResponse(pollId: string, userId: string, response: any): Promise<any> {
    const { selectedOptions, textResponse, ratingValue } = response;

    const result = await pool.query(
      `INSERT INTO poll_responses (poll_id, user_id, selected_options, text_response, rating_value)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (poll_id, user_id) DO UPDATE
      SET selected_options = $3, text_response = $4, rating_value = $5, responded_at = NOW()
      RETURNING *`,
      [pollId, userId, selectedOptions || [], textResponse, ratingValue]
    );

    // Update poll statistics
    await pool.query(
      `UPDATE class_polls
      SET total_responses = (SELECT COUNT(*) FROM poll_responses WHERE poll_id = $1)
      WHERE id = $1`,
      [pollId]
    );

    return result.rows[0];
  }

  async getPollResults(pollId: string): Promise<any> {
    const pollResult = await pool.query(`SELECT * FROM class_polls WHERE id = $1`, [pollId]);
    const poll = pollResult.rows[0];

    if (!poll) return null;

    const responsesResult = await pool.query(
      `SELECT * FROM poll_responses WHERE poll_id = $1`,
      [pollId]
    );

    return {
      poll,
      responses: responsesResult.rows,
      totalResponses: responsesResult.rows.length
    };
  }

  // ========================================
  // Q&A
  // ========================================

  async askQuestion(classId: string, askedBy: string, question: string, isAnonymous: boolean = false): Promise<any> {
    const result = await pool.query(
      `INSERT INTO class_questions (class_id, asked_by, question, is_anonymous)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [classId, askedBy, question, isAnonymous]
    );

    return result.rows[0];
  }

  async answerQuestion(questionId: string, answeredBy: string, answer: string): Promise<any> {
    const result = await pool.query(
      `UPDATE class_questions
      SET answer = $1, answered_by = $2, answered_at = NOW(), status = 'answered'
      WHERE id = $3
      RETURNING *`,
      [answer, answeredBy, questionId]
    );

    return result.rows[0];
  }

  async upvoteQuestion(questionId: string, userId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE class_questions
      SET upvotes = upvotes + 1,
          upvoted_by = array_append(upvoted_by, $1::UUID)
      WHERE id = $2 AND NOT ($1::UUID = ANY(upvoted_by))
      RETURNING *`,
      [userId, questionId]
    );

    return result.rows[0];
  }

  async getClassQuestions(classId: string, status?: string): Promise<any[]> {
    let query = `
      SELECT cq.*, u.name as asker_name,
        CASE WHEN cq.is_anonymous THEN NULL ELSE u.avatar_url END as asker_avatar
      FROM class_questions cq
      JOIN users u ON cq.asked_by = u.id
      WHERE cq.class_id = $1
    `;

    const params: any[] = [classId];

    if (status) {
      query += ` AND cq.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY cq.is_pinned DESC, cq.upvotes DESC, cq.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // HAND RAISES
  // ========================================

  async raiseHand(classId: string, userId: string, reason?: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO hand_raises (class_id, user_id, reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (class_id, user_id, status) DO UPDATE SET raised_at = NOW()
      RETURNING *`,
      [classId, userId, reason]
    );

    await pool.query(
      `UPDATE class_participants SET hand_raises = hand_raises + 1
      WHERE class_id = $1 AND user_id = $2`,
      [classId, userId]
    );

    return result.rows[0];
  }

  async lowerHand(classId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE hand_raises SET status = 'lowered', lowered_at = NOW()
      WHERE class_id = $1 AND user_id = $2 AND status = 'raised'`,
      [classId, userId]
    );
  }

  async acknowledgeHand(handRaiseId: string, acknowledgedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE hand_raises
      SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
      WHERE id = $2
      RETURNING *`,
      [acknowledgedBy, handRaiseId]
    );

    return result.rows[0];
  }

  async getRaisedHands(classId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT hr.*, u.name as user_name, u.avatar_url
      FROM hand_raises hr
      JOIN users u ON hr.user_id = u.id
      WHERE hr.class_id = $1 AND hr.status = 'raised'
      ORDER BY hr.raised_at ASC`,
      [classId]
    );

    return result.rows;
  }

  // ========================================
  // RECORDINGS
  // ========================================

  async createRecording(classId: string, recordingData: any): Promise<any> {
    const {
      title,
      description,
      recordingUrl,
      thumbnailUrl,
      duration,
      fileSize,
      format,
      resolution,
      recordedAt,
      accessType = 'enrolled'
    } = recordingData;

    const result = await pool.query(
      `INSERT INTO class_recordings (
        class_id, title, description, recording_url, thumbnail_url,
        duration, file_size, format, resolution, recorded_at, access_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [classId, title, description, recordingUrl, thumbnailUrl, duration, fileSize, format, resolution, recordedAt, accessType]
    );

    return result.rows[0];
  }

  async getClassRecordings(classId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM class_recordings WHERE class_id = $1 ORDER BY recorded_at DESC`,
      [classId]
    );
    return result.rows;
  }

  async trackRecordingView(recordingId: string, userId: string, viewData: any): Promise<any> {
    const { deviceType, browser, ipAddress } = viewData;

    const result = await pool.query(
      `INSERT INTO recording_views (recording_id, user_id, device_type, browser, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [recordingId, userId || null, deviceType, browser, ipAddress]
    );

    await pool.query(
      `UPDATE class_recordings SET total_views = total_views + 1 WHERE id = $1`,
      [recordingId]
    );

    return result.rows[0];
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getClassAnalytics(classId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM class_analytics WHERE id = $1`,
      [classId]
    );
    return result.rows[0];
  }
}

export const liveClassesService = new LiveClassesService();
