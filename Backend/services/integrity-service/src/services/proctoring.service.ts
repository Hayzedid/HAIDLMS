import { pool } from '../db/pool';
import {
  ProctoringSession,
  ProctoringEvent,
  StartProctoringRequest,
  TrackProctoringEventRequest,
  ProctoringEventType,
} from '../types';

/**
 * Live Proctoring Service
 * Monitors assessments via webcam, screen recording, and browser lockdown
 */
class ProctoringService {
  private readonly SUSPICIOUS_THRESHOLD = parseInt(process.env.SUSPICIOUS_BEHAVIOR_THRESHOLD || '3');

  /**
   * Start proctoring session
   */
  async startSession(params: StartProctoringRequest): Promise<ProctoringSession> {
    const result = await pool.query(
      `INSERT INTO proctoring_sessions (
        user_id, assessment_id, assessment_type, webcam_enabled,
        screen_recording_enabled, browser_lockdown_enabled, face_verification_required
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.userId,
        params.assessmentId,
        params.assessmentType,
        params.webcamEnabled,
        params.screenRecordingEnabled,
        params.browserLockdownEnabled,
        params.faceVerificationRequired,
      ]
    );

    // Log session start event
    await this.trackEvent({
      sessionId: result.rows[0].id,
      eventType: 'session_start',
      severity: 'info',
      description: 'Proctoring session started',
    });

    return this.mapSession(result.rows[0]);
  }

  /**
   * Track proctoring event
   */
  async trackEvent(params: TrackProctoringEventRequest): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert event
      const eventResult = await client.query(
        `INSERT INTO proctoring_events (
          session_id, event_type, severity, description, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          params.sessionId,
          params.eventType,
          params.severity,
          params.description,
          JSON.stringify(params.metadata || {}),
        ]
      );

      // Update session counters
      if (params.severity === 'warning' || params.severity === 'critical') {
        await client.query(
          `UPDATE proctoring_sessions
           SET suspicious_events_count = suspicious_events_count + 1
           WHERE id = $1`,
          [params.sessionId]
        );
      }

      // Check if should flag session
      await this.checkFlagging(client, params.sessionId, params);

      // Add to violations array
      if (params.severity === 'critical') {
        await client.query(
          `UPDATE proctoring_sessions
           SET violations = violations || $1::jsonb
           WHERE id = $2`,
          [
            JSON.stringify([
              {
                type: params.eventType,
                description: params.description,
                timestamp: new Date(),
              },
            ]),
            params.sessionId,
          ]
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
   * Check if session should be flagged
   */
  private async checkFlagging(client: any, sessionId: string, event: TrackProctoringEventRequest): Promise<void> {
    const result = await client.query(
      'SELECT suspicious_events_count FROM proctoring_sessions WHERE id = $1',
      [sessionId]
    );

    const suspiciousCount = result.rows[0]?.suspicious_events_count || 0;

    if (suspiciousCount >= this.SUSPICIOUS_THRESHOLD) {
      await client.query(
        'UPDATE proctoring_sessions SET is_flagged = true WHERE id = $1',
        [sessionId]
      );

      // Log violation
      await client.query(
        `INSERT INTO violation_logs (
          user_id, violation_type, severity, description, related_session_id, score_penalty
        )
        SELECT user_id, 'excessive_suspicious_behavior', 'major',
               'Multiple suspicious events detected during proctored assessment',
               $1, 5.0
        FROM proctoring_sessions WHERE id = $1`,
        [sessionId]
      );
    }
  }

  /**
   * End proctoring session
   */
  async endSession(sessionId: string): Promise<ProctoringSession> {
    // Calculate duration
    const result = await pool.query(
      `UPDATE proctoring_sessions
       SET ended_at = NOW(),
           duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    // Log session end event
    await this.trackEvent({
      sessionId,
      eventType: 'session_end',
      severity: 'info',
      description: 'Proctoring session ended',
    });

    return this.mapSession(result.rows[0]);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ProctoringSession | null> {
    const result = await pool.query('SELECT * FROM proctoring_sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSession(result.rows[0]);
  }

  /**
   * Get session events
   */
  async getSessionEvents(sessionId: string): Promise<ProctoringEvent[]> {
    const result = await pool.query(
      `SELECT * FROM proctoring_events
       WHERE session_id = $1
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      sessionId: row.session_id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      severity: row.severity,
      description: row.description,
      metadata: row.metadata,
      screenshotUrl: row.screenshot_url,
      faceImageUrl: row.face_image_url,
    }));
  }

  /**
   * Get user's proctoring sessions
   */
  async getUserSessions(userId: string): Promise<ProctoringSession[]> {
    const result = await pool.query(
      'SELECT * FROM proctoring_sessions WHERE user_id = $1 ORDER BY started_at DESC',
      [userId]
    );

    return result.rows.map(this.mapSession);
  }

  /**
   * Get flagged sessions
   */
  async getFlaggedSessions(limit = 100): Promise<ProctoringSession[]> {
    const result = await pool.query(
      `SELECT * FROM proctoring_sessions
       WHERE is_flagged = true
       ORDER BY suspicious_events_count DESC, started_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapSession);
  }

  /**
   * Save face snapshot
   */
  async saveFaceSnapshot(params: {
    sessionId: string;
    userId: string;
    imageUrl: string;
    faceDetected: boolean;
    faceCount: number;
    confidenceScore?: number;
    faceEncodings?: Buffer;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO face_snapshots (
        session_id, user_id, image_url, face_detected, face_count, confidence_score, face_encodings
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.sessionId,
        params.userId,
        params.imageUrl,
        params.faceDetected,
        params.faceCount,
        params.confidenceScore,
        params.faceEncodings,
      ]
    );

    // Track event based on face detection
    if (!params.faceDetected) {
      await this.trackEvent({
        sessionId: params.sessionId,
        eventType: 'no_face',
        severity: 'warning',
        description: 'No face detected in snapshot',
      });
    } else if (params.faceCount > 1) {
      await this.trackEvent({
        sessionId: params.sessionId,
        eventType: 'multiple_faces',
        severity: 'critical',
        description: `Multiple faces detected: ${params.faceCount}`,
      });
    } else {
      await this.trackEvent({
        sessionId: params.sessionId,
        eventType: 'face_detected',
        severity: 'info',
        description: 'Face detected',
      });
    }
  }

  /**
   * Get session face snapshots
   */
  async getSessionSnapshots(sessionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM face_snapshots
       WHERE session_id = $1
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Update proctor review
   */
  async updateProctorReview(sessionId: string, params: {
    reviewStatus: string;
    notes?: string;
  }): Promise<void> {
    await pool.query(
      `UPDATE proctoring_sessions
       SET proctor_review_status = $1,
           proctor_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [params.reviewStatus, params.notes, sessionId]
    );
  }

  /**
   * Map database row to ProctoringSession
   */
  private mapSession(row: any): ProctoringSession {
    return {
      id: row.id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      assessmentType: row.assessment_type,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMinutes: row.duration_minutes,
      webcamEnabled: row.webcam_enabled,
      screenRecordingEnabled: row.screen_recording_enabled,
      browserLockdownEnabled: row.browser_lockdown_enabled,
      faceVerificationRequired: row.face_verification_required,
      initialVerificationStatus: row.initial_verification_status,
      finalVerificationStatus: row.final_verification_status,
      suspiciousEventsCount: row.suspicious_events_count,
      violations: row.violations,
      isFlagged: row.is_flagged,
      proctorReviewStatus: row.proctor_review_status,
      proctorNotes: row.proctor_notes,
      recordingUrl: row.recording_url,
    };
  }
}

export const proctoringService = new ProctoringService();
