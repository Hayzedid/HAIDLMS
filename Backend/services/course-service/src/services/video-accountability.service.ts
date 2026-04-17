import pool from '../db/pool';

export interface WatchSession {
  id: string;
  userId: string;
  lessonId: string;
  enrollmentId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  totalWatchTimeSeconds: number;
  activeWatchTimeSeconds: number;
  tabSwitches: number;
  tabAwaySeconds: number;
  idleEvents: number;
  idleSeconds: number;
  seekEvents: number;
  videoDurationSeconds: number;
  furthestPositionSeconds: number;
  completionPercentage: number;
  isFirstWatch: boolean;
  completedFirstWatch: boolean;
  sessionQualityScore?: number;
  isCompleted: boolean;
}

export interface EngagementEvent {
  watchSessionId: string;
  userId: string;
  lessonId: string;
  eventType: string;
  videoPosition: number;
  metadata?: any;
}

export interface Checkpoint {
  id: string;
  lessonId: string;
  triggerAtSeconds: number;
  checkpointType: 'quiz' | 'note_required' | 'reflection';
  isRequired: boolean;
  displayOrder: number;
  questionText?: string;
  questionType?: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: any[];
  correctAnswer?: string;
  notePrompt?: string;
  minNoteLength?: number;
  allowSkip: boolean;
  maxAttempts: number;
  timeLimitSeconds?: number;
}

export interface CheckpointResponse {
  checkpointId: string;
  watchSessionId: string;
  userId: string;
  lessonId: string;
  attemptNumber: number;
  responseText?: string;
  selectedOption?: number;
  isCorrect?: boolean;
  passed: boolean;
  timeTakenSeconds?: number;
  noteText?: string;
}

export interface AccountabilitySettings {
  lessonId: string;
  enableTabTracking: boolean;
  enableIdleDetection: boolean;
  idleThresholdSeconds: number;
  disableSeekOnFirstWatch: boolean;
  allowBackwardSeek: boolean;
  minActiveWatchPercentage: number;
  minQualityScore: number;
  enableCheckpoints: boolean;
  checkpointRandomization: boolean;
}

export class VideoAccountabilityService {
  /**
   * Start a new watch session
   */
  async startWatchSession(
    userId: string,
    lessonId: string,
    enrollmentId: string,
    videoDurationSeconds: number
  ): Promise<WatchSession> {
    // Check if there's an existing incomplete session
    const existingResult = await pool.query(
      `SELECT * FROM video_watch_sessions
       WHERE user_id = $1 AND lesson_id = $2 AND is_completed = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, lessonId]
    );

    if (existingResult.rows.length > 0) {
      return this.mapRowToWatchSession(existingResult.rows[0]);
    }

    // Check if this is first watch
    const watchHistoryResult = await pool.query(
      `SELECT COUNT(*) as watch_count FROM video_watch_sessions
       WHERE user_id = $1 AND lesson_id = $2 AND is_completed = true`,
      [userId, lessonId]
    );

    const isFirstWatch = parseInt(watchHistoryResult.rows[0].watch_count) === 0;

    // Create new session
    const result = await pool.query(
      `INSERT INTO video_watch_sessions (
        user_id, lesson_id, enrollment_id, video_duration_seconds, is_first_watch
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [userId, lessonId, enrollmentId, videoDurationSeconds, isFirstWatch]
    );

    return this.mapRowToWatchSession(result.rows[0]);
  }

  /**
   * Update watch session metrics
   */
  async updateWatchSession(
    sessionId: string,
    updates: {
      totalWatchTimeSeconds?: number;
      activeWatchTimeSeconds?: number;
      tabSwitches?: number;
      tabAwaySeconds?: number;
      idleEvents?: number;
      idleSeconds?: number;
      seekEvents?: number;
      furthestPositionSeconds?: number;
      completionPercentage?: number;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(sessionId);
    await pool.query(
      `UPDATE video_watch_sessions
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}`,
      values
    );
  }

  /**
   * End watch session
   */
  async endWatchSession(sessionId: string): Promise<WatchSession> {
    // Check if session should be marked as completed
    const completedResult = await pool.query(
      `SELECT is_video_lesson_completed($1) as is_completed`,
      [sessionId]
    );

    const isCompleted = completedResult.rows[0].is_completed;

    const result = await pool.query(
      `UPDATE video_watch_sessions
       SET session_end = NOW(),
           is_completed = $2,
           completed_first_watch = CASE WHEN is_first_watch THEN $2 ELSE completed_first_watch END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [sessionId, isCompleted]
    );

    // If completed, update lesson progress
    if (isCompleted && result.rows.length > 0) {
      const session = result.rows[0];
      await this.updateLessonProgress(
        session.user_id,
        session.lesson_id,
        session.enrollment_id
      );
    }

    return this.mapRowToWatchSession(result.rows[0]);
  }

  /**
   * Log engagement event
   */
  async logEngagementEvent(event: EngagementEvent): Promise<void> {
    await pool.query(
      `INSERT INTO video_engagement_events (
        watch_session_id, user_id, lesson_id, event_type, video_position, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.watchSessionId,
        event.userId,
        event.lessonId,
        event.eventType,
        event.videoPosition,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ]
    );

    // Update session metrics based on event type
    if (event.eventType === 'tab_blur') {
      await pool.query(
        `UPDATE video_watch_sessions
         SET tab_switches = tab_switches + 1
         WHERE id = $1`,
        [event.watchSessionId]
      );
    } else if (event.eventType === 'idle_start') {
      await pool.query(
        `UPDATE video_watch_sessions
         SET idle_events = idle_events + 1
         WHERE id = $1`,
        [event.watchSessionId]
      );
    } else if (event.eventType === 'seek') {
      await pool.query(
        `UPDATE video_watch_sessions
         SET seek_events = seek_events + 1
         WHERE id = $1`,
        [event.watchSessionId]
      );
    }
  }

  /**
   * Get accountability settings for a lesson
   */
  async getAccountabilitySettings(lessonId: string): Promise<AccountabilitySettings> {
    const result = await pool.query(
      `SELECT * FROM video_accountability_settings WHERE lesson_id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      // Return defaults
      return {
        lessonId,
        enableTabTracking: true,
        enableIdleDetection: true,
        idleThresholdSeconds: 30,
        disableSeekOnFirstWatch: true,
        allowBackwardSeek: true,
        minActiveWatchPercentage: 80,
        minQualityScore: 60,
        enableCheckpoints: false,
        checkpointRandomization: true,
      };
    }

    return this.mapRowToSettings(result.rows[0]);
  }

  /**
   * Get checkpoints for a lesson
   */
  async getCheckpoints(lessonId: string, includeInactive = false): Promise<Checkpoint[]> {
    const query = includeInactive
      ? `SELECT * FROM video_checkpoints WHERE lesson_id = $1 ORDER BY trigger_at_seconds ASC`
      : `SELECT * FROM video_checkpoints WHERE lesson_id = $1 AND is_active = true ORDER BY trigger_at_seconds ASC`;

    const result = await pool.query(query, [lessonId]);
    return result.rows.map(this.mapRowToCheckpoint);
  }

  /**
   * Get next checkpoint to trigger
   */
  async getNextCheckpoint(
    lessonId: string,
    currentPosition: number,
    watchSessionId: string
  ): Promise<Checkpoint | null> {
    // Get checkpoints that haven't been answered yet in this session
    const result = await pool.query(
      `SELECT c.* FROM video_checkpoints c
       WHERE c.lesson_id = $1
         AND c.trigger_at_seconds > $2
         AND c.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM checkpoint_responses r
           WHERE r.checkpoint_id = c.id
             AND r.watch_session_id = $3
             AND r.passed = true
         )
       ORDER BY c.trigger_at_seconds ASC
       LIMIT 1`,
      [lessonId, currentPosition, watchSessionId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToCheckpoint(result.rows[0]);
  }

  /**
   * Submit checkpoint response
   */
  async submitCheckpointResponse(response: Omit<CheckpointResponse, 'attemptNumber'>): Promise<{
    passed: boolean;
    attemptsRemaining: number;
    correctAnswer?: string;
  }> {
    // Get checkpoint details
    const checkpointResult = await pool.query(
      `SELECT * FROM video_checkpoints WHERE id = $1`,
      [response.checkpointId]
    );

    if (checkpointResult.rows.length === 0) {
      throw new Error('Checkpoint not found');
    }

    const checkpoint = this.mapRowToCheckpoint(checkpointResult.rows[0]);

    // Get attempt count
    const attemptsResult = await pool.query(
      `SELECT COUNT(*) as attempt_count FROM checkpoint_responses
       WHERE checkpoint_id = $1 AND watch_session_id = $2`,
      [response.checkpointId, response.watchSessionId]
    );

    const attemptNumber = parseInt(attemptsResult.rows[0].attempt_count) + 1;

    // Check if max attempts exceeded
    if (checkpoint.maxAttempts && attemptNumber > checkpoint.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    // Evaluate response
    let isCorrect = false;
    let passed = false;

    if (checkpoint.checkpointType === 'quiz') {
      if (checkpoint.questionType === 'multiple_choice') {
        const correctOption = checkpoint.options?.findIndex((opt) => opt.is_correct);
        isCorrect = response.selectedOption === correctOption;
      } else if (checkpoint.questionType === 'true_false') {
        isCorrect = response.responseText?.toLowerCase() === checkpoint.correctAnswer?.toLowerCase();
      } else if (checkpoint.questionType === 'short_answer') {
        // Simple string matching (case-insensitive)
        isCorrect = response.responseText?.toLowerCase().trim() === checkpoint.correctAnswer?.toLowerCase().trim();
      }
      passed = isCorrect;
    } else if (checkpoint.checkpointType === 'note_required') {
      // Check note length
      const wordCount = response.noteText?.split(/\s+/).length || 0;
      passed = wordCount >= (checkpoint.minNoteLength || 50);
    } else {
      // Reflection type - always passes
      passed = true;
    }

    // Save response
    await pool.query(
      `INSERT INTO checkpoint_responses (
        checkpoint_id, watch_session_id, user_id, lesson_id,
        attempt_number, response_text, selected_option,
        is_correct, passed, note_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        response.checkpointId,
        response.watchSessionId,
        response.userId,
        response.lessonId,
        attemptNumber,
        response.responseText,
        response.selectedOption,
        isCorrect,
        passed,
        response.noteText,
      ]
    );

    const attemptsRemaining = checkpoint.maxAttempts ? checkpoint.maxAttempts - attemptNumber : 999;

    return {
      passed,
      attemptsRemaining,
      correctAnswer: !passed && attemptNumber >= checkpoint.maxAttempts ? checkpoint.correctAnswer : undefined,
    };
  }

  /**
   * Save video note
   */
  async saveVideoNote(
    userId: string,
    lessonId: string,
    videoTimestamp: number,
    noteText: string,
    watchSessionId?: string,
    checkpointId?: string
  ): Promise<void> {
    const wordCount = noteText.split(/\s+/).length;

    await pool.query(
      `INSERT INTO video_notes (
        user_id, lesson_id, video_timestamp, note_text, word_count,
        watch_session_id, checkpoint_id, is_required_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, lessonId, videoTimestamp, noteText, wordCount, watchSessionId, checkpointId, !!checkpointId]
    );
  }

  /**
   * Get watch session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    session: WatchSession;
    events: EngagementEvent[];
    checkpointResponses: any[];
    notes: any[];
  }> {
    const sessionResult = await pool.query(
      `SELECT * FROM video_watch_sessions WHERE id = $1`,
      [sessionId]
    );

    const eventsResult = await pool.query(
      `SELECT * FROM video_engagement_events WHERE watch_session_id = $1 ORDER BY event_timestamp ASC`,
      [sessionId]
    );

    const responsesResult = await pool.query(
      `SELECT r.*, c.question_text, c.checkpoint_type
       FROM checkpoint_responses r
       JOIN video_checkpoints c ON r.checkpoint_id = c.id
       WHERE r.watch_session_id = $1
       ORDER BY r.responded_at ASC`,
      [sessionId]
    );

    const notesResult = await pool.query(
      `SELECT * FROM video_notes WHERE watch_session_id = $1 ORDER BY video_timestamp ASC`,
      [sessionId]
    );

    return {
      session: this.mapRowToWatchSession(sessionResult.rows[0]),
      events: eventsResult.rows,
      checkpointResponses: responsesResult.rows,
      notes: notesResult.rows,
    };
  }

  /**
   * Get student watch history for a lesson
   */
  async getWatchHistory(userId: string, lessonId: string): Promise<WatchSession[]> {
    const result = await pool.query(
      `SELECT * FROM video_watch_sessions
       WHERE user_id = $1 AND lesson_id = $2
       ORDER BY created_at DESC`,
      [userId, lessonId]
    );

    return result.rows.map(this.mapRowToWatchSession);
  }

  /**
   * Get instructor accountability dashboard
   */
  async getInstructorDashboard(lessonId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageQualityScore: number;
    averageActiveWatchPercentage: number;
    totalTabSwitches: number;
    totalIdleEvents: number;
    checkpointStats: any;
    atRiskStudents: any[];
  }> {
    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_completed = true) as completed_sessions,
        AVG(session_quality_score) as avg_quality_score,
        AVG(active_watch_time_seconds::DECIMAL / NULLIF(total_watch_time_seconds, 0) * 100) as avg_active_percentage,
        SUM(tab_switches) as total_tab_switches,
        SUM(idle_events) as total_idle_events
       FROM video_watch_sessions
       WHERE lesson_id = $1`,
      [lessonId]
    );

    const checkpointStatsResult = await pool.query(
      `SELECT
        c.id,
        c.question_text,
        COUNT(r.id) as total_attempts,
        COUNT(r.id) FILTER (WHERE r.passed = true) as passed_attempts,
        AVG(r.attempt_number) as avg_attempts_per_student
       FROM video_checkpoints c
       LEFT JOIN checkpoint_responses r ON c.id = r.checkpoint_id
       WHERE c.lesson_id = $1
       GROUP BY c.id, c.question_text`,
      [lessonId]
    );

    const atRiskResult = await pool.query(
      `SELECT
        user_id,
        COUNT(*) as session_count,
        AVG(session_quality_score) as avg_quality,
        MAX(tab_switches) as max_tab_switches,
        MAX(idle_events) as max_idle_events
       FROM video_watch_sessions
       WHERE lesson_id = $1
         AND is_completed = false
       GROUP BY user_id
       HAVING AVG(session_quality_score) < 50 OR MAX(tab_switches) > 10
       ORDER BY avg_quality ASC`,
      [lessonId]
    );

    return {
      totalSessions: parseInt(statsResult.rows[0].total_sessions) || 0,
      completedSessions: parseInt(statsResult.rows[0].completed_sessions) || 0,
      averageQualityScore: parseFloat(statsResult.rows[0].avg_quality_score) || 0,
      averageActiveWatchPercentage: parseFloat(statsResult.rows[0].avg_active_percentage) || 0,
      totalTabSwitches: parseInt(statsResult.rows[0].total_tab_switches) || 0,
      totalIdleEvents: parseInt(statsResult.rows[0].total_idle_events) || 0,
      checkpointStats: checkpointStatsResult.rows,
      atRiskStudents: atRiskResult.rows,
    };
  }

  /**
   * Update lesson progress based on video completion
   */
  private async updateLessonProgress(
    userId: string,
    lessonId: string,
    enrollmentId: string
  ): Promise<void> {
    // This will be handled by the existing progress tracking system
    // Mark lesson as completed in lesson_progress table
    await pool.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, user_id, is_completed, completed_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (enrollment_id, lesson_id)
       DO UPDATE SET is_completed = true, completed_at = NOW()`,
      [enrollmentId, lessonId, userId]
    );
  }

  // Helper mapping functions
  private mapRowToWatchSession(row: any): WatchSession {
    return {
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      enrollmentId: row.enrollment_id,
      sessionStart: row.session_start,
      sessionEnd: row.session_end,
      totalWatchTimeSeconds: row.total_watch_time_seconds,
      activeWatchTimeSeconds: row.active_watch_time_seconds,
      tabSwitches: row.tab_switches,
      tabAwaySeconds: row.tab_away_seconds,
      idleEvents: row.idle_events,
      idleSeconds: row.idle_seconds,
      seekEvents: row.seek_events,
      videoDurationSeconds: row.video_duration_seconds,
      furthestPositionSeconds: row.furthest_position_seconds,
      completionPercentage: parseFloat(row.completion_percentage),
      isFirstWatch: row.is_first_watch,
      completedFirstWatch: row.completed_first_watch,
      sessionQualityScore: row.session_quality_score ? parseFloat(row.session_quality_score) : undefined,
      isCompleted: row.is_completed,
    };
  }

  private mapRowToCheckpoint(row: any): Checkpoint {
    return {
      id: row.id,
      lessonId: row.lesson_id,
      triggerAtSeconds: row.trigger_at_seconds,
      checkpointType: row.checkpoint_type,
      isRequired: row.is_required,
      displayOrder: row.display_order,
      questionText: row.question_text,
      questionType: row.question_type,
      options: row.options,
      correctAnswer: row.correct_answer,
      notePrompt: row.note_prompt,
      minNoteLength: row.min_note_length,
      allowSkip: row.allow_skip,
      maxAttempts: row.max_attempts,
      timeLimitSeconds: row.time_limit_seconds,
    };
  }

  private mapRowToSettings(row: any): AccountabilitySettings {
    return {
      lessonId: row.lesson_id,
      enableTabTracking: row.enable_tab_tracking,
      enableIdleDetection: row.enable_idle_detection,
      idleThresholdSeconds: row.idle_threshold_seconds,
      disableSeekOnFirstWatch: row.disable_seek_on_first_watch,
      allowBackwardSeek: row.allow_backward_seek,
      minActiveWatchPercentage: parseFloat(row.min_active_watch_percentage),
      minQualityScore: parseFloat(row.min_quality_score),
      enableCheckpoints: row.enable_checkpoints,
      checkpointRandomization: row.checkpoint_randomization,
    };
  }
}

export const videoAccountabilityService = new VideoAccountabilityService();
