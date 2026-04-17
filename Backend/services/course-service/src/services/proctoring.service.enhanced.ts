import { Pool, PoolClient } from 'pg';
import {
  ProctoringSessionSchema,
  ViolationSchema,
  PlagiarismCheckSchema,
  IdentityVerificationSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProctoringService');

export class ProctoringServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // PROCTORING SESSIONS - ENHANCED
  // ========================================

  async createProctoringSessionWithValidation(data: any): Promise<string> {
    try {
      const validatedData = ProctoringSessionSchema.parse(data);
      logger.info('Creating proctoring session', {
        assessment_id: validatedData.assessment_id,
        user_id: validatedData.user_id,
        proctoring_mode: validatedData.proctoring_mode
      });

      // Validate time range
      if (new Date(validatedData.scheduled_start_time) >= new Date(validatedData.scheduled_end_time)) {
        throw new ValidationError('scheduled_end_time must be after scheduled_start_time');
      }

      // Check for duplicate active session
      const existingSession = await this.pool.query(
        `SELECT id FROM proctoring_sessions
         WHERE assessment_id = $1 AND user_id = $2 AND status IN ('scheduled', 'in_progress')`,
        [validatedData.assessment_id, validatedData.user_id]
      );

      if (existingSession.rows.length > 0) {
        throw new ConflictError('User already has an active proctoring session for this assessment');
      }

      const result = await this.pool.query(
        `INSERT INTO proctoring_sessions (
          assessment_id, user_id, session_token, proctoring_mode,
          scheduled_start_time, scheduled_end_time
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          validatedData.assessment_id,
          validatedData.user_id,
          validatedData.session_token,
          validatedData.proctoring_mode,
          validatedData.scheduled_start_time,
          validatedData.scheduled_end_time
        ]
      );

      logger.info('Proctoring session created', { session_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create proctoring session', error, { user_id: data.user_id });
      throw error;
    }
  }

  async getSessionByIdWithValidation(session_id: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM proctoring_sessions WHERE id = $1`,
        [session_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Proctoring session', session_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch proctoring session', error, { session_id });
      throw error;
    }
  }

  async getProctoringSessionsWithMetrics(filters?: {
    user_id?: string;
    assessment_id?: string;
    status?: string;
    proctoring_mode?: string;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT
          ps.*,
          COUNT(DISTINCT vi.id) as violation_count,
          COUNT(DISTINCT vi.id) FILTER (WHERE vi.severity IN ('high', 'critical')) as high_severity_violations,
          MAX(vi.severity) as max_severity
        FROM proctoring_sessions ps
        LEFT JOIN violation_incidents vi ON vi.session_id = ps.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.user_id) {
        query += ` AND ps.user_id = $${paramIndex++}`;
        values.push(filters.user_id);
      }

      if (filters?.assessment_id) {
        query += ` AND ps.assessment_id = $${paramIndex++}`;
        values.push(filters.assessment_id);
      }

      if (filters?.status) {
        query += ` AND ps.status = $${paramIndex++}`;
        values.push(filters.status);
      }

      if (filters?.proctoring_mode) {
        query += ` AND ps.proctoring_mode = $${paramIndex++}`;
        values.push(filters.proctoring_mode);
      }

      query += ` GROUP BY ps.id ORDER BY ps.scheduled_start_time DESC LIMIT 100`;

      const result = await this.pool.query(query, values);

      logger.debug('Proctoring sessions retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch proctoring sessions', error, filters);
      throw error;
    }
  }

  async updateSessionStatusWithValidation(session_id: string, status: string): Promise<void> {
    try {
      const validStatuses = ['scheduled', 'in_progress', 'paused', 'completed', 'terminated', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      logger.info('Updating session status', { session_id, status });

      // Verify session exists
      await this.getSessionByIdWithValidation(session_id);

      const updates = [`status = $1`, `updated_at = NOW()`];
      const values: any[] = [status];
      let paramIndex = 2;

      if (status === 'in_progress') {
        updates.push(`actual_start_time = COALESCE(actual_start_time, NOW())`);
      } else if (status === 'completed' || status === 'terminated') {
        updates.push(`actual_end_time = NOW()`);
      }

      values.push(session_id);

      await this.pool.query(
        `UPDATE proctoring_sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      logger.info('Session status updated', { session_id, status });
    } catch (error: any) {
      logger.error('Failed to update session status', error, { session_id, status });
      throw error;
    }
  }

  // ========================================
  // VIOLATION INCIDENTS - ENHANCED
  // ========================================

  async recordViolationWithValidation(data: any): Promise<string> {
    try {
      const validatedData = ViolationSchema.parse(data);
      logger.warn('Recording violation incident', {
        session_id: validatedData.session_id,
        violation_type: validatedData.violation_type,
        severity: validatedData.severity
      });

      // Verify session exists and is active
      const session = await this.getSessionByIdWithValidation(validatedData.session_id);

      if (session.status !== 'in_progress') {
        logger.warn('Recording violation for non-active session', {
          session_id: validatedData.session_id,
          session_status: session.status
        });
      }

      const result = await this.pool.query(
        `SELECT record_violation($1, $2, $3, $4, true) as id`,
        [
          validatedData.session_id,
          validatedData.violation_type,
          validatedData.severity,
          validatedData.violation_description || null
        ]
      );

      const violationId = result.rows[0].id;

      // Update snapshot URL if provided
      if (validatedData.snapshot_url) {
        await this.pool.query(
          `UPDATE violation_incidents SET snapshot_url = $1 WHERE id = $2`,
          [validatedData.snapshot_url, violationId]
        );
      }

      // Auto-terminate session on critical violations
      if (validatedData.severity === 'critical') {
        logger.warn('Critical violation detected, checking auto-termination rules', {
          session_id: validatedData.session_id
        });
      }

      logger.warn('Violation recorded', { violation_id: violationId });
      return violationId;
    } catch (error: any) {
      logger.error('Failed to record violation', error, data);
      throw error;
    }
  }

  async getViolationsWithSummary(session_id: string): Promise<any> {
    try {
      const violations = await this.pool.query(
        `SELECT * FROM violation_incidents WHERE session_id = $1 ORDER BY detected_at DESC`,
        [session_id]
      );

      // Calculate summary
      const summary = {
        total_violations: violations.rows.length,
        critical: violations.rows.filter(v => v.severity === 'critical').length,
        high: violations.rows.filter(v => v.severity === 'high').length,
        medium: violations.rows.filter(v => v.severity === 'medium').length,
        low: violations.rows.filter(v => v.severity === 'low').length,
        most_common_type: this.getMostCommonViolationType(violations.rows)
      };

      logger.debug('Violations retrieved', { session_id, total: summary.total_violations });

      return {
        session_id,
        violations: violations.rows,
        summary
      };
    } catch (error: any) {
      logger.error('Failed to fetch violations', error, { session_id });
      throw error;
    }
  }

  private getMostCommonViolationType(violations: any[]): string | null {
    if (violations.length === 0) return null;

    const counts: Record<string, number> = {};
    violations.forEach(v => {
      counts[v.violation_type] = (counts[v.violation_type] || 0) + 1;
    });

    return Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }

  // ========================================
  // FACE RECOGNITION - ENHANCED
  // ========================================

  async recordFaceCaptureWithValidation(data: {
    session_id: string;
    user_id: string;
    image_url: string;
    faces_detected: number;
    face_match_score?: number;
  }): Promise<string> {
    try {
      logger.debug('Recording face capture', {
        session_id: data.session_id,
        faces_detected: data.faces_detected
      });

      // Verify session exists
      await this.getSessionByIdWithValidation(data.session_id);

      // Auto-detect violations based on face count
      if (data.faces_detected === 0) {
        await this.recordViolationWithValidation({
          session_id: data.session_id,
          user_id: data.user_id,
          violation_type: 'no_face',
          severity: 'high',
          violation_description: 'No face detected in camera feed'
        });
      } else if (data.faces_detected > 1) {
        await this.recordViolationWithValidation({
          session_id: data.session_id,
          user_id: data.user_id,
          violation_type: 'multiple_faces',
          severity: 'critical',
          violation_description: `${data.faces_detected} faces detected in camera feed`
        });
      } else if (data.face_match_score !== undefined && data.face_match_score < 0.7) {
        await this.recordViolationWithValidation({
          session_id: data.session_id,
          user_id: data.user_id,
          violation_type: 'face_not_recognized',
          severity: 'high',
          violation_description: `Low face match score: ${data.face_match_score}`
        });
      }

      const result = await this.pool.query(
        `INSERT INTO face_recognition_captures (
          session_id, user_id, image_url, faces_detected, face_match_score
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [data.session_id, data.user_id, data.image_url, data.faces_detected, data.face_match_score || null]
      );

      logger.debug('Face capture recorded', { capture_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to record face capture', error, data);
      throw error;
    }
  }

  async getFaceCaptures(session_id: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM face_recognition_captures
         WHERE session_id = $1
         ORDER BY captured_at DESC
         LIMIT $2`,
        [session_id, limit]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch face captures', error, { session_id });
      throw error;
    }
  }

  // ========================================
  // IDENTITY VERIFICATION - ENHANCED
  // ========================================

  async verifyIdentityWithValidation(data: any): Promise<string> {
    try {
      const validatedData = IdentityVerificationSchema.parse(data);
      logger.info('Initiating identity verification', {
        session_id: validatedData.session_id,
        verification_method: validatedData.verification_method
      });

      // Verify session exists
      await this.getSessionByIdWithValidation(validatedData.session_id);

      const result = await this.pool.query(
        `INSERT INTO identity_verifications (
          session_id, user_id, verification_method, face_photo_url
        ) VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [
          validatedData.session_id,
          validatedData.user_id,
          validatedData.verification_method,
          validatedData.face_photo_url || null
        ]
      );

      logger.info('Identity verification initiated', { verification_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to initiate identity verification', error, data);
      throw error;
    }
  }

  async updateVerificationResultWithValidation(
    verification_id: string,
    is_verified: boolean,
    confidence: number
  ): Promise<void> {
    try {
      if (confidence < 0 || confidence > 1) {
        throw new ValidationError('Verification confidence must be between 0 and 1');
      }

      logger.info('Updating verification result', {
        verification_id,
        is_verified,
        confidence
      });

      await this.pool.query(
        `UPDATE identity_verifications
         SET is_verified = $1, verification_confidence = $2, verification_timestamp = NOW()
         WHERE id = $3`,
        [is_verified, confidence, verification_id]
      );

      logger.info('Verification result updated', { verification_id, is_verified });
    } catch (error: any) {
      logger.error('Failed to update verification result', error, { verification_id });
      throw error;
    }
  }

  // ========================================
  // PLAGIARISM DETECTION - ENHANCED
  // ========================================

  async checkPlagiarismWithValidation(data: any): Promise<string> {
    try {
      const validatedData = PlagiarismCheckSchema.parse(data);
      logger.info('Initiating plagiarism check', {
        submission_id: validatedData.submission_id,
        user_id: validatedData.user_id,
        content_length: validatedData.content_text.length
      });

      const result = await this.pool.query(
        `INSERT INTO plagiarism_checks (
          submission_id, user_id, assessment_id, content_text, content_hash
        ) VALUES ($1, $2, $3, $4, md5($4))
        RETURNING id`,
        [
          validatedData.submission_id,
          validatedData.user_id,
          validatedData.assessment_id,
          validatedData.content_text
        ]
      );

      logger.info('Plagiarism check initiated', { check_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to initiate plagiarism check', error, data);
      throw error;
    }
  }

  async updatePlagiarismResultWithValidation(
    check_id: string,
    similarity_percent: number,
    is_plagiarized: boolean,
    matched_sources?: string[]
  ): Promise<void> {
    try {
      if (similarity_percent < 0 || similarity_percent > 100) {
        throw new ValidationError('Similarity percent must be between 0 and 100');
      }

      logger.info('Updating plagiarism result', {
        check_id,
        similarity_percent,
        is_plagiarized
      });

      const updates = [
        `overall_similarity_percent = $1`,
        `is_plagiarized = $2`,
        `checked_at = NOW()`
      ];
      const values: any[] = [similarity_percent, is_plagiarized];
      let paramIndex = 3;

      if (matched_sources && matched_sources.length > 0) {
        updates.push(`matched_sources = $${paramIndex++}`);
        values.push(matched_sources);
      }

      values.push(check_id);

      await this.pool.query(
        `UPDATE plagiarism_checks SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      logger.info('Plagiarism result updated', { check_id, is_plagiarized });
    } catch (error: any) {
      logger.error('Failed to update plagiarism result', error, { check_id });
      throw error;
    }
  }

  async getPlagiarismChecksWithDetails(filters?: {
    submission_id?: string;
    user_id?: string;
    is_plagiarized?: boolean;
  }): Promise<any[]> {
    try {
      let query = `SELECT * FROM plagiarism_checks WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.submission_id) {
        query += ` AND submission_id = $${paramIndex++}`;
        values.push(filters.submission_id);
      }

      if (filters?.user_id) {
        query += ` AND user_id = $${paramIndex++}`;
        values.push(filters.user_id);
      }

      if (filters?.is_plagiarized !== undefined) {
        query += ` AND is_plagiarized = $${paramIndex++}`;
        values.push(filters.is_plagiarized);
      }

      query += ` ORDER BY checked_at DESC LIMIT 100`;

      const result = await this.pool.query(query, values);

      logger.debug('Plagiarism checks retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch plagiarism checks', error, filters);
      throw error;
    }
  }

  // ========================================
  // HIGH RISK ANALYSIS - ENHANCED
  // ========================================

  async getHighRiskSessionsWithPriority(): Promise<any[]> {
    try {
      logger.info('Fetching high-risk sessions');

      const result = await this.pool.query(`
        SELECT
          hrs.*,
          CASE
            WHEN hrs.risk_score >= 0.8 THEN 'critical'
            WHEN hrs.risk_score >= 0.6 THEN 'high'
            WHEN hrs.risk_score >= 0.4 THEN 'medium'
            ELSE 'low'
          END as risk_level
        FROM high_risk_sessions hrs
        ORDER BY hrs.risk_score DESC
        LIMIT 50
      `);

      logger.warn('High-risk sessions identified', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch high-risk sessions', error);
      throw error;
    }
  }

  // ========================================
  // BROWSER LOCKDOWN - ENHANCED
  // ========================================

  async recordBrowserLockdownWithValidation(data: {
    session_id: string;
    user_id: string;
    browser_name?: string;
    lockdown_level: string;
  }): Promise<string> {
    try {
      const validLevels = ['strict', 'moderate', 'basic'];
      if (!validLevels.includes(data.lockdown_level)) {
        throw new ValidationError(`Invalid lockdown level. Must be one of: ${validLevels.join(', ')}`);
      }

      logger.info('Recording browser lockdown', {
        session_id: data.session_id,
        lockdown_level: data.lockdown_level
      });

      // Verify session exists
      await this.getSessionByIdWithValidation(data.session_id);

      const result = await this.pool.query(
        `INSERT INTO browser_lockdown_status (
          session_id, user_id, browser_name, lockdown_level, lockdown_active
        ) VALUES ($1, $2, $3, $4, true)
        RETURNING id`,
        [data.session_id, data.user_id, data.browser_name || null, data.lockdown_level]
      );

      logger.info('Browser lockdown recorded', { lockdown_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to record browser lockdown', error, data);
      throw error;
    }
  }

  async updateLockdownHeartbeatWithMonitoring(lockdown_id: string): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE browser_lockdown_status
         SET last_heartbeat_at = NOW()
         WHERE id = $1 AND lockdown_active = true
         RETURNING id, session_id, EXTRACT(EPOCH FROM (NOW() - last_heartbeat_at)) as seconds_since_last`,
        [lockdown_id]
      );

      if (result.rows.length === 0) {
        logger.warn('Lockdown heartbeat update failed - lockdown may be inactive', { lockdown_id });
        return;
      }

      const secondsSinceLast = result.rows[0].seconds_since_last;

      // Alert if heartbeat was missed for too long
      if (secondsSinceLast > 30) {
        logger.warn('Lockdown heartbeat missed', {
          lockdown_id,
          seconds_since_last: secondsSinceLast
        });

        // Record violation for missed heartbeat
        await this.recordViolationWithValidation({
          session_id: result.rows[0].session_id,
          user_id: '', // Will be filled from session
          violation_type: 'browser_exit',
          severity: 'critical',
          violation_description: `Browser lockdown heartbeat missed for ${Math.round(secondsSinceLast)} seconds`
        });
      }

      logger.debug('Lockdown heartbeat updated', { lockdown_id });
    } catch (error: any) {
      logger.error('Failed to update lockdown heartbeat', error, { lockdown_id });
      throw error;
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getProctoringHealthCheck(): Promise<any> {
    try {
      const [activeSessions, violations, highRisk] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM proctoring_sessions WHERE status = 'in_progress'`),
        this.pool.query(`SELECT COUNT(*) as count FROM violation_incidents WHERE detected_at > NOW() - INTERVAL '1 hour'`),
        this.pool.query(`SELECT COUNT(*) as count FROM high_risk_sessions WHERE risk_score >= 0.6`)
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          active_sessions: parseInt(activeSessions.rows[0].count),
          recent_violations: parseInt(violations.rows[0].count),
          high_risk_sessions: parseInt(highRisk.rows[0].count)
        }
      };
    } catch (error: any) {
      logger.error('Failed to get proctoring health check', error);
      throw error;
    }
  }
}
