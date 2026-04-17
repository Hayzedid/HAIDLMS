import { Pool } from 'pg';

export class ProctoringService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Proctoring Sessions
  async createProctoringSession(data: {
    assessment_id: string;
    user_id: string;
    session_token: string;
    proctoring_mode: string;
    scheduled_start_time: Date;
    scheduled_end_time: Date;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO proctoring_sessions (assessment_id, user_id, session_token, proctoring_mode, scheduled_start_time, scheduled_end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.assessment_id, data.user_id, data.session_token, data.proctoring_mode, data.scheduled_start_time, data.scheduled_end_time]
    );
    return result.rows[0].id;
  }

  async getProctoringSessions(filters?: { user_id?: string; status?: string; }): Promise<any[]> {
    let query = `SELECT * FROM proctoring_sessions WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(filters.user_id);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }

    query += ` ORDER BY scheduled_start_time DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async updateSessionStatus(session_id: string, status: string): Promise<void> {
    await this.pool.query(
      `UPDATE proctoring_sessions SET status = $2, updated_at = NOW() WHERE id = $1`,
      [session_id, status]
    );
  }

  // Violation Incidents
  async recordViolation(data: {
    session_id: string;
    user_id: string;
    violation_type: string;
    severity: string;
    snapshot_url?: string;
    violation_description?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `SELECT record_violation($1, $2, $3, $4, true) as id`,
      [data.session_id, data.violation_type, data.severity, data.violation_description || null]
    );
    return result.rows[0].id;
  }

  async getViolations(session_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM violation_incidents WHERE session_id = $1 ORDER BY detected_at DESC`,
      [session_id]
    );
    return result.rows;
  }

  // Face Recognition
  async recordFaceCapture(data: {
    session_id: string;
    user_id: string;
    image_url: string;
    faces_detected: number;
    face_match_score?: number;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO face_recognition_captures (session_id, user_id, image_url, faces_detected, face_match_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.session_id, data.user_id, data.image_url, data.faces_detected, data.face_match_score || null]
    );
    return result.rows[0].id;
  }

  // Identity Verification
  async verifyIdentity(data: {
    session_id: string;
    user_id: string;
    verification_method: string;
    face_photo_url?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO identity_verifications (session_id, user_id, verification_method, face_photo_url)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.session_id, data.user_id, data.verification_method, data.face_photo_url || null]
    );
    return result.rows[0].id;
  }

  async updateVerificationResult(verification_id: string, is_verified: boolean, confidence: number): Promise<void> {
    await this.pool.query(
      `UPDATE identity_verifications SET is_verified = $2, verification_confidence = $3, verification_timestamp = NOW()
       WHERE id = $1`,
      [verification_id, is_verified, confidence]
    );
  }

  // Plagiarism Detection
  async checkPlagiarism(data: {
    submission_id: string;
    user_id: string;
    assessment_id: string;
    content_text: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO plagiarism_checks (submission_id, user_id, assessment_id, content_text, content_hash)
       VALUES ($1, $2, $3, $4, md5($4)) RETURNING id`,
      [data.submission_id, data.user_id, data.assessment_id, data.content_text]
    );
    return result.rows[0].id;
  }

  async updatePlagiarismResult(check_id: string, similarity_percent: number, is_plagiarized: boolean): Promise<void> {
    await this.pool.query(
      `UPDATE plagiarism_checks SET overall_similarity_percent = $2, is_plagiarized = $3 WHERE id = $1`,
      [check_id, similarity_percent, is_plagiarized]
    );
  }

  async getPlagiarismChecks(filters?: { submission_id?: string; }): Promise<any[]> {
    const query = filters?.submission_id
      ? `SELECT * FROM plagiarism_checks WHERE submission_id = $1`
      : `SELECT * FROM plagiarism_checks ORDER BY checked_at DESC LIMIT 100`;
    const result = filters?.submission_id
      ? await this.pool.query(query, [filters.submission_id])
      : await this.pool.query(query);
    return result.rows;
  }

  // High Risk Sessions
  async getHighRiskSessions(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM high_risk_sessions LIMIT 50`);
    return result.rows;
  }

  // Browser Lockdown
  async recordBrowserLockdown(data: {
    session_id: string;
    user_id: string;
    browser_name?: string;
    lockdown_level: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO browser_lockdown_status (session_id, user_id, browser_name, lockdown_level, lockdown_active)
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [data.session_id, data.user_id, data.browser_name || null, data.lockdown_level]
    );
    return result.rows[0].id;
  }

  async updateLockdownHeartbeat(lockdown_id: string): Promise<void> {
    await this.pool.query(
      `UPDATE browser_lockdown_status SET last_heartbeat_at = NOW() WHERE id = $1`,
      [lockdown_id]
    );
  }
}
