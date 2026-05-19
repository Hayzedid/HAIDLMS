import pool from '../db/pool';
import crypto from 'crypto';

/**
 * Clipboard & Keystroke Tracking Service
 * Logs clipboard attempts and tracks keystroke sessions for integrity monitoring
 */

interface ClipboardAttempt {
  id: string;
  userId: string;
  sessionId: string;
  lessonId?: string;
  assessmentId?: string;
  problemId?: string;
  attemptType: string;
  source: string;
  blocked: boolean;
  contentLength?: number;
  contentHash?: string;
  cursorPosition?: number;
  selectedTextLength?: number;
  fileName?: string;
  lineNumber?: number;
  detectedBy: string;
  createdAt: Date;
}

interface KeystrokeSession {
  id: string;
  userId: string;
  lessonId?: string;
  assessmentId?: string;
  problemId?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  isActive: boolean;
  totalKeystrokes: number;
  totalDeletions: number;
  totalCopyAttempts: number;
  totalPasteAttempts: number;
  avgTypingSpeedWPM?: number;
  avgKeyIntervalMs?: number;
  pauseCount: number;
  longestPauseSeconds?: number;
  linesWritten: number;
  charsWritten: number;
  charsDeleted: number;
  hasSuspiciousBurst: boolean;
  hasLongIdle: boolean;
  consistencyScore?: number;
  finalCode?: string;
  language?: string;
}

interface KeystrokeEvent {
  sessionId: string;
  timestampMs: number;
  eventType: string;
  keyCode?: number;
  keyName: string;
  isSpecialKey: boolean;
  modifiers?: string;
  cursorPosition?: number;
  lineNumber?: number;
  columnNumber?: number;
  selectionStart?: number;
  selectionEnd?: number;
  charInserted?: string;
  charsDeleted?: string;
}

export class ClipboardTrackingService {
  /**
   * Log clipboard attempt
   */
  async logClipboardAttempt(params: {
    userId: string;
    sessionId: string;
    lessonId?: string;
    assessmentId?: string;
    problemId?: string;
    attemptType: 'copy' | 'cut' | 'paste' | 'drag_drop' | 'right_click_paste';
    source: string;
    blocked: boolean;
    contentLength?: number;
    content?: string;
    cursorPosition?: number;
    selectedTextLength?: number;
    fileName?: string;
    lineNumber?: number;
    detectedBy: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<ClipboardAttempt> {
    // Generate content hash if content provided (for detecting repeated pastes)
    let contentHash: string | undefined;
    if (params.content) {
      contentHash = crypto.createHash('sha256').update(params.content).digest('hex');
    }

    const result = await pool.query(
      `INSERT INTO clipboard_attempts (
        user_id, session_id, lesson_id, assessment_id, problem_id,
        attempt_type, source, blocked, content_length, content_hash,
        cursor_position, selected_text_length, file_name, line_number,
        detected_by, user_agent, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        params.userId,
        params.sessionId,
        params.lessonId,
        params.assessmentId,
        params.problemId,
        params.attemptType,
        params.source,
        params.blocked,
        params.contentLength,
        contentHash,
        params.cursorPosition,
        params.selectedTextLength,
        params.fileName,
        params.lineNumber,
        params.detectedBy,
        params.userAgent,
        params.ipAddress,
      ]
    );

    return this.mapClipboardAttemptRow(result.rows[0]);
  }

  /**
   * Get clipboard attempts for session
   */
  async getSessionAttempts(sessionId: string): Promise<ClipboardAttempt[]> {
    const result = await pool.query(
      `SELECT * FROM clipboard_attempts
      WHERE session_id = $1
      ORDER BY created_at DESC`,
      [sessionId]
    );

    return result.rows.map(this.mapClipboardAttemptRow);
  }

  /**
   * Get clipboard attempts for assessment
   */
  async getAssessmentAttempts(assessmentId: string, userId?: string): Promise<ClipboardAttempt[]> {
    let query = `SELECT * FROM clipboard_attempts WHERE assessment_id = $1`;
    const values: any[] = [assessmentId];

    if (userId) {
      query += ` AND user_id = $2`;
      values.push(userId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows.map(this.mapClipboardAttemptRow);
  }

  /**
   * Get user's clipboard attempt statistics
   */
  async getUserAttemptStats(userId: string, assessmentId?: string): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE blocked = true) as blocked_attempts,
        COUNT(*) FILTER (WHERE attempt_type = 'paste') as paste_attempts,
        COUNT(*) FILTER (WHERE attempt_type = 'copy') as copy_attempts,
        COUNT(*) FILTER (WHERE attempt_type = 'cut') as cut_attempts,
        COUNT(DISTINCT content_hash) as unique_pastes,
        AVG(content_length) FILTER (WHERE content_length IS NOT NULL) as avg_content_length
      FROM clipboard_attempts
      WHERE user_id = $1
    `;
    const values: any[] = [userId];

    if (assessmentId) {
      query += ` AND assessment_id = $2`;
      values.push(assessmentId);
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Start keystroke session
   */
  async startKeystrokeSession(params: {
    userId: string;
    lessonId?: string;
    assessmentId?: string;
    problemId?: string;
  }): Promise<KeystrokeSession> {
    const result = await pool.query(
      `INSERT INTO keystroke_sessions (
        user_id, lesson_id, assessment_id, problem_id
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [params.userId, params.lessonId, params.assessmentId, params.problemId]
    );

    return this.mapKeystrokeSessionRow(result.rows[0]);
  }

  /**
   * End keystroke session
   */
  async endKeystrokeSession(params: {
    sessionId: string;
    finalCode?: string;
    language?: string;
    avgTypingSpeedWPM?: number;
    avgKeyIntervalMs?: number;
    consistencyScore?: number;
  }): Promise<void> {
    await pool.query(
      `UPDATE keystroke_sessions
      SET is_active = false,
          ended_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
          final_code = $2,
          language = $3,
          avg_typing_speed_wpm = $4,
          avg_key_interval_ms = $5,
          consistency_score = $6,
          updated_at = NOW()
      WHERE id = $1`,
      [
        params.sessionId,
        params.finalCode,
        params.language,
        params.avgTypingSpeedWPM,
        params.avgKeyIntervalMs,
        params.consistencyScore,
      ]
    );
  }

  /**
   * Log keystroke event batch
   */
  async logKeystrokeEvents(events: KeystrokeEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Batch insert for performance
    const values = events.map(e => `(
      '${e.sessionId}',
      ${e.timestampMs},
      '${e.eventType}',
      ${e.keyCode || 'NULL'},
      '${e.keyName.replace(/'/g, "''")}',
      ${e.isSpecialKey},
      ${e.modifiers ? `'${e.modifiers}'` : 'NULL'},
      ${e.cursorPosition || 'NULL'},
      ${e.lineNumber || 'NULL'},
      ${e.columnNumber || 'NULL'},
      ${e.selectionStart || 'NULL'},
      ${e.selectionEnd || 'NULL'},
      ${e.charInserted ? `'${e.charInserted.replace(/'/g, "''")}'` : 'NULL'},
      ${e.charsDeleted ? `'${e.charsDeleted.replace(/'/g, "''")}'` : 'NULL'}
    )`).join(',');

    await pool.query(`
      INSERT INTO keystroke_events (
        session_id, timestamp_ms, event_type, key_code, key_name,
        is_special_key, modifiers, cursor_position, line_number,
        column_number, selection_start, selection_end,
        char_inserted, chars_deleted
      ) VALUES ${values}
    `);
  }

  /**
   * Get keystroke session
   */
  async getKeystrokeSession(sessionId: string): Promise<KeystrokeSession | null> {
    const result = await pool.query(
      `SELECT * FROM keystroke_sessions WHERE id = $1`,
      [sessionId]
    );

    return result.rows[0] ? this.mapKeystrokeSessionRow(result.rows[0]) : null;
  }

  /**
   * Get keystroke events for session (for replay)
   */
  async getKeystrokeEvents(sessionId: string, limit: number = 10000): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM keystroke_events
      WHERE session_id = $1
      ORDER BY timestamp_ms ASC
      LIMIT $2`,
      [sessionId, limit]
    );

    return result.rows;
  }

  /**
   * Get student typing patterns (baseline)
   */
  async getStudentTypingPatterns(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM student_typing_patterns WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Calculate baseline from previous sessions
      await this.calculateTypingBaseline(userId);
      return await this.getStudentTypingPatterns(userId);
    }

    return result.rows[0];
  }

  /**
   * Calculate typing baseline from previous sessions
   */
  private async calculateTypingBaseline(userId: string): Promise<void> {
    const stats = await pool.query(
      `SELECT
        AVG(avg_typing_speed_wpm) as avg_speed,
        STDDEV(avg_typing_speed_wpm) as std_dev_speed,
        AVG(avg_key_interval_ms) as avg_interval,
        STDDEV(avg_key_interval_ms) as std_dev_interval,
        COUNT(*) as sessions_count
      FROM keystroke_sessions
      WHERE user_id = $1
        AND is_active = false
        AND avg_typing_speed_wpm IS NOT NULL
        AND assessment_id IS NULL`, // Only non-assessment sessions for baseline
      [userId]
    );

    const row = stats.rows[0];

    if (!row || row.sessions_count < 3) {
      // Not enough data for baseline
      await pool.query(
        `INSERT INTO student_typing_patterns (user_id, sessions_analyzed)
        VALUES ($1, 0)
        ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      return;
    }

    await pool.query(
      `INSERT INTO student_typing_patterns (
        user_id, avg_typing_speed_wpm, std_dev_typing_speed,
        avg_key_interval_ms, std_dev_key_interval,
        sessions_analyzed, last_calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        avg_typing_speed_wpm = $2,
        std_dev_typing_speed = $3,
        avg_key_interval_ms = $4,
        std_dev_key_interval = $5,
        sessions_analyzed = $6,
        last_calculated_at = NOW()`,
      [
        userId,
        row.avg_speed,
        row.std_dev_speed,
        row.avg_interval,
        row.std_dev_interval,
        row.sessions_count,
      ]
    );
  }

  /**
   * Get sessions with integrity concerns
   */
  async getIntegrityConcernSessions(userId?: string, assessmentId?: string): Promise<any[]> {
    let query = `SELECT * FROM sessions_with_integrity_concerns WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(userId);
      paramCount++;
    }

    if (assessmentId) {
      query += ` AND assessment_id = $${paramCount}`;
      values.push(assessmentId);
      paramCount++;
    }

    query += ` ORDER BY started_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get typing pattern deviations
   */
  async getTypingPatternDeviations(userId?: string): Promise<any[]> {
    let query = `SELECT * FROM typing_pattern_deviations WHERE 1=1`;
    const values: any[] = [];

    if (userId) {
      query += ` AND user_id = $1`;
      values.push(userId);
    }

    query += ` ORDER BY speed_change_percent DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Flag session for integrity review
   */
  async flagSession(params: {
    userId: string;
    sessionId: string;
    assessmentId?: string;
    flagType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: any;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO ide_integrity_flags (
        user_id, session_id, assessment_id, flag_type,
        severity, description, evidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.userId,
        params.sessionId,
        params.assessmentId,
        params.flagType,
        params.severity,
        params.description,
        JSON.stringify(params.evidence),
      ]
    );
  }

  /**
   * Get integrity flags for review
   */
  async getIntegrityFlags(params: {
    userId?: string;
    sessionId?: string;
    assessmentId?: string;
    severity?: string;
    reviewed?: boolean;
    limit?: number;
  }): Promise<any[]> {
    let query = `SELECT * FROM ide_integrity_flags WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (params.userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(params.userId);
      paramCount++;
    }

    if (params.sessionId) {
      query += ` AND session_id = $${paramCount}`;
      values.push(params.sessionId);
      paramCount++;
    }

    if (params.assessmentId) {
      query += ` AND assessment_id = $${paramCount}`;
      values.push(params.assessmentId);
      paramCount++;
    }

    if (params.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(params.severity);
      paramCount++;
    }

    if (params.reviewed !== undefined) {
      query += ` AND reviewed = $${paramCount}`;
      values.push(params.reviewed);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    if (params.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(params.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Review integrity flag
   */
  async reviewIntegrityFlag(params: {
    flagId: string;
    reviewedBy: string;
    reviewNotes: string;
    actionTaken: string;
  }): Promise<void> {
    await pool.query(
      `UPDATE ide_integrity_flags
      SET reviewed = true,
          reviewed_by = $2,
          review_notes = $3,
          action_taken = $4,
          reviewed_at = NOW()
      WHERE id = $1`,
      [params.flagId, params.reviewedBy, params.reviewNotes, params.actionTaken]
    );
  }

  // Row mappers
  private mapClipboardAttemptRow(row: any): ClipboardAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      lessonId: row.lesson_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      attemptType: row.attempt_type,
      source: row.source,
      blocked: row.blocked,
      contentLength: row.content_length,
      contentHash: row.content_hash,
      cursorPosition: row.cursor_position,
      selectedTextLength: row.selected_text_length,
      fileName: row.file_name,
      lineNumber: row.line_number,
      detectedBy: row.detected_by,
      createdAt: row.created_at,
    };
  }

  private mapKeystrokeSessionRow(row: any): KeystrokeSession {
    return {
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
      isActive: row.is_active,
      totalKeystrokes: row.total_keystrokes,
      totalDeletions: row.total_deletions,
      totalCopyAttempts: row.total_copy_attempts,
      totalPasteAttempts: row.total_paste_attempts,
      avgTypingSpeedWPM: row.avg_typing_speed_wpm,
      avgKeyIntervalMs: row.avg_key_interval_ms,
      pauseCount: row.pause_count,
      longestPauseSeconds: row.longest_pause_seconds,
      linesWritten: row.lines_written,
      charsWritten: row.chars_written,
      charsDeleted: row.chars_deleted,
      hasSuspiciousBurst: row.has_suspicious_burst,
      hasLongIdle: row.has_long_idle,
      consistencyScore: row.consistency_score,
      finalCode: row.final_code,
      language: row.language,
    };
  }
}

export const clipboardTrackingService = new ClipboardTrackingService();
