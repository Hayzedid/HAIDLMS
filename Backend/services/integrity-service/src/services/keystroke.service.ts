import { pool } from '../db/pool';
import {
  KeystrokeSession,
  KeystrokeEvent,
  StartKeystrokeSessionRequest,
  TrackKeystrokeRequest,
} from '../types';

/**
 * Keystroke Recording Service
 * Captures and analyzes typing behavior for academic integrity
 */
class KeystrokeService {
  private readonly COPY_PASTE_DETECTION = process.env.COPY_PASTE_DETECTION === 'true';

  /**
   * Start keystroke session
   */
  async startSession(params: StartKeystrokeSessionRequest): Promise<KeystrokeSession> {
    const result = await pool.query(
      `INSERT INTO keystroke_sessions (
        user_id, assessment_id, problem_id, language
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [params.userId, params.assessmentId, params.problemId, params.language]
    );

    return this.mapSession(result.rows[0]);
  }

  /**
   * Track keystroke event
   */
  async trackKeystroke(params: TrackKeystrokeRequest): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert keystroke event
      await client.query(
        `INSERT INTO keystroke_events (
          session_id, event_type, key, timestamp_ms, cursor_position,
          line_number, column_number, code_length
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          params.sessionId,
          params.eventType,
          params.key,
          params.timestampMs,
          params.cursorPosition,
          params.lineNumber,
          params.columnNumber,
          params.codeLength,
        ]
      );

      // Update session counters
      if (params.eventType === 'keydown') {
        await client.query(
          'UPDATE keystroke_sessions SET total_keystrokes = total_keystrokes + 1 WHERE id = $1',
          [params.sessionId]
        );
      }

      if (params.eventType === 'paste') {
        await client.query(
          'UPDATE keystroke_sessions SET paste_count = paste_count + 1 WHERE id = $1',
          [params.sessionId]
        );
      }

      if (params.eventType === 'copy') {
        await client.query(
          'UPDATE keystroke_sessions SET copy_count = copy_count + 1 WHERE id = $1',
          [params.sessionId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save code snapshot
   */
  async saveSnapshot(sessionId: string, code: string, timestampMs: number): Promise<void> {
    const lineCount = code.split('\n').length;
    const characterCount = code.length;

    await pool.query(
      `INSERT INTO code_snapshots (
        session_id, code, timestamp_ms, line_count, character_count
      )
      VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, code, timestampMs, lineCount, characterCount]
    );
  }

  /**
   * End keystroke session
   */
  async endSession(sessionId: string, finalCode: string): Promise<KeystrokeSession> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get session start time
      const sessionResult = await client.query(
        'SELECT started_at FROM keystroke_sessions WHERE id = $1',
        [sessionId]
      );

      const startedAt = sessionResult.rows[0].started_at;
      const durationSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);

      // Calculate metrics
      const lineCount = finalCode.split('\n').length;
      const characterCount = finalCode.length;

      // Analyze typing behavior
      const analysis = await this.analyzeTypingBehavior(sessionId);

      // Calculate typing speed (WPM)
      const wordsTyped = characterCount / 5; // Average 5 chars per word
      const minutesElapsed = durationSeconds / 60;
      const typingSpeedWpm = minutesElapsed > 0 ? wordsTyped / minutesElapsed : 0;

      // Update session
      const result = await client.query(
        `UPDATE keystroke_sessions
         SET ended_at = NOW(),
             duration_seconds = $1,
             final_code = $2,
             character_count = $3,
             line_count = $4,
             typing_speed_wpm = $5,
             analysis = $6,
             is_suspicious = $7
         WHERE id = $8
         RETURNING *`,
        [
          durationSeconds,
          finalCode,
          characterCount,
          lineCount,
          typingSpeedWpm.toFixed(2),
          JSON.stringify(analysis),
          analysis.isSuspicious,
          sessionId,
        ]
      );

      await client.query('COMMIT');
      return this.mapSession(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Analyze typing behavior
   */
  private async analyzeTypingBehavior(sessionId: string): Promise<any> {
    // Get session data
    const sessionResult = await pool.query(
      'SELECT * FROM keystroke_sessions WHERE id = $1',
      [sessionId]
    );

    const session = sessionResult.rows[0];

    // Get all events
    const eventsResult = await pool.query(
      'SELECT * FROM keystroke_events WHERE session_id = $1 ORDER BY timestamp_ms ASC',
      [sessionId]
    );

    const events = eventsResult.rows;

    // Calculate pause patterns
    const pauses = [];
    for (let i = 1; i < events.length; i++) {
      const pauseDuration = events[i].timestamp_ms - events[i - 1].timestamp_ms;
      if (pauseDuration > 2000) {
        // Pause longer than 2 seconds
        pauses.push(pauseDuration);
      }
    }

    const avgPauseDuration = pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0;

    // Update pause metrics
    await pool.query(
      'UPDATE keystroke_sessions SET pause_count = $1, avg_pause_duration = $2 WHERE id = $3',
      [pauses.length, avgPauseDuration, sessionId]
    );

    // Detect suspicious patterns
    const suspiciousPatterns = [];

    // High paste count
    if (session.paste_count > 5) {
      suspiciousPatterns.push({
        type: 'excessive_pasting',
        count: session.paste_count,
        severity: 'high',
      });
    }

    // Very high typing speed (likely pasted)
    const durationMinutes = (session.duration_seconds || 1) / 60;
    const wordsTyped = (session.character_count || 0) / 5;
    const wpm = wordsTyped / durationMinutes;

    if (wpm > 120) {
      suspiciousPatterns.push({
        type: 'unusually_high_typing_speed',
        wpm: wpm.toFixed(2),
        severity: 'medium',
      });
    }

    // Very few keystrokes for code length (mostly pasted)
    const pasteRatio = session.character_count / Math.max(session.total_keystrokes, 1);
    if (pasteRatio > 5) {
      suspiciousPatterns.push({
        type: 'high_paste_ratio',
        ratio: pasteRatio.toFixed(2),
        severity: 'high',
      });
    }

    // Long pauses might indicate external help
    if (pauses.length > 10 && avgPauseDuration > 30000) {
      suspiciousPatterns.push({
        type: 'long_pauses',
        avgPauseDuration: (avgPauseDuration / 1000).toFixed(0) + 's',
        severity: 'medium',
      });
    }

    return {
      isSuspicious: suspiciousPatterns.length > 0,
      suspiciousPatterns,
      metrics: {
        totalKeystrokes: session.total_keystrokes,
        pasteCount: session.paste_count,
        copyCount: session.copy_count,
        pauseCount: pauses.length,
        avgPauseDuration: (avgPauseDuration / 1000).toFixed(2) + 's',
        typingSpeedWpm: wpm.toFixed(2),
        pasteRatio: pasteRatio.toFixed(2),
      },
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<KeystrokeSession | null> {
    const result = await pool.query('SELECT * FROM keystroke_sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSession(result.rows[0]);
  }

  /**
   * Get session events
   */
  async getSessionEvents(sessionId: string): Promise<KeystrokeEvent[]> {
    const result = await pool.query(
      `SELECT * FROM keystroke_events
       WHERE session_id = $1
       ORDER BY timestamp_ms ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      sessionId: row.session_id,
      eventType: row.event_type,
      key: row.key,
      timestampMs: row.timestamp_ms,
      cursorPosition: row.cursor_position,
      lineNumber: row.line_number,
      columnNumber: row.column_number,
      codeLength: row.code_length,
      metadata: row.metadata,
    }));
  }

  /**
   * Get code snapshots
   */
  async getSnapshots(sessionId: string): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM code_snapshots WHERE session_id = $1 ORDER BY timestamp_ms ASC',
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Get user's sessions
   */
  async getUserSessions(userId: string): Promise<KeystrokeSession[]> {
    const result = await pool.query(
      'SELECT * FROM keystroke_sessions WHERE user_id = $1 ORDER BY started_at DESC',
      [userId]
    );

    return result.rows.map(this.mapSession);
  }

  /**
   * Get suspicious sessions
   */
  async getSuspiciousSessions(limit = 100): Promise<KeystrokeSession[]> {
    const result = await pool.query(
      `SELECT * FROM keystroke_sessions
       WHERE is_suspicious = true
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapSession);
  }

  /**
   * Map database row to KeystrokeSession
   */
  private mapSession(row: any): KeystrokeSession {
    return {
      id: row.id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      language: row.language,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
      totalKeystrokes: row.total_keystrokes,
      pasteCount: row.paste_count,
      copyCount: row.copy_count,
      typingSpeedWpm: row.typing_speed_wpm ? parseFloat(row.typing_speed_wpm) : undefined,
      pauseCount: row.pause_count,
      avgPauseDuration: row.avg_pause_duration ? parseFloat(row.avg_pause_duration) : undefined,
      finalCode: row.final_code,
      characterCount: row.character_count,
      lineCount: row.line_count,
      isSuspicious: row.is_suspicious,
      analysis: row.analysis,
    };
  }
}

export const keystrokeService = new KeystrokeService();
