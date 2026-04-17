import { pool } from '../db/pool';
import { IntegrityScore, ViolationLog } from '../types';

/**
 * Integrity Score Service
 * Calculates and manages user integrity scores
 */
class IntegrityScoreService {
  /**
   * Get user integrity score
   */
  async getUserScore(userId: string): Promise<IntegrityScore> {
    let result = await pool.query('SELECT * FROM integrity_scores WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      // Initialize score for user
      await pool.query(
        'INSERT INTO integrity_scores (user_id) VALUES ($1)',
        [userId]
      );

      result = await pool.query('SELECT * FROM integrity_scores WHERE user_id = $1', [userId]);
    }

    return this.mapScore(result.rows[0]);
  }

  /**
   * Recalculate user integrity score
   */
  async recalculateScore(userId: string): Promise<IntegrityScore> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get video accountability metrics
      const videoResult = await client.query(
        `SELECT
           COUNT(*) as total_sessions,
           SUM(CASE WHEN is_valid = false THEN 1 ELSE 0 END) as invalid_sessions,
           AVG(CASE WHEN passed_threshold THEN 100 ELSE completion_percentage END) as avg_completion
         FROM video_watch_sessions
         WHERE user_id = $1`,
        [userId]
      );

      const videoMetrics = videoResult.rows[0];
      const videoScore = this.calculateVideoScore(videoMetrics);

      // Get proctoring metrics
      const proctoringResult = await client.query(
        `SELECT
           COUNT(*) as total_sessions,
           SUM(CASE WHEN is_flagged THEN 1 ELSE 0 END) as flagged_sessions,
           AVG(suspicious_events_count) as avg_suspicious_events
         FROM proctoring_sessions
         WHERE user_id = $1`,
        [userId]
      );

      const proctoringMetrics = proctoringResult.rows[0];
      const proctoringScore = this.calculateProctoringScore(proctoringMetrics);

      // Get plagiarism metrics
      const plagiarismResult = await client.query(
        `SELECT
           COUNT(*) as total_submissions,
           SUM(CASE WHEN plagiarism_status = 'plagiarized' THEN 1 ELSE 0 END) as plagiarized_count,
           SUM(CASE WHEN plagiarism_status = 'suspicious' THEN 1 ELSE 0 END) as suspicious_count,
           AVG(COALESCE(similarity_score, 0)) as avg_similarity
         FROM code_submissions
         WHERE user_id = $1`,
        [userId]
      );

      const plagiarismMetrics = plagiarismResult.rows[0];
      const plagiarismScore = this.calculatePlagiarismScore(plagiarismMetrics);

      // Get behavior metrics
      const behaviorResult = await client.query(
        `SELECT
           COUNT(*) as total_violations,
           SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_violations,
           SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) as major_violations,
           SUM(CASE WHEN severity = 'minor' THEN 1 ELSE 0 END) as minor_violations
         FROM violation_logs
         WHERE user_id = $1`,
        [userId]
      );

      const behaviorMetrics = behaviorResult.rows[0];
      const behaviorScore = this.calculateBehaviorScore(behaviorMetrics);

      // Calculate overall score (weighted average)
      const overallScore = (
        videoScore * 0.2 +
        proctoringScore * 0.3 +
        plagiarismScore * 0.3 +
        behaviorScore * 0.2
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore, behaviorMetrics);

      // Get last violation date
      const lastViolationResult = await client.query(
        'SELECT MAX(created_at) as last_violation FROM violation_logs WHERE user_id = $1',
        [userId]
      );

      const lastViolationDate = lastViolationResult.rows[0].last_violation;

      // Update scores
      await client.query(
        `UPDATE integrity_scores
         SET overall_score = $1,
             video_accountability_score = $2,
             proctoring_score = $3,
             plagiarism_score = $4,
             behavior_score = $5,
             total_violations = $6,
             major_violations = $7,
             minor_violations = $8,
             last_violation_date = $9,
             risk_level = $10,
             updated_at = NOW()
         WHERE user_id = $11`,
        [
          overallScore.toFixed(2),
          videoScore.toFixed(2),
          proctoringScore.toFixed(2),
          plagiarismScore.toFixed(2),
          behaviorScore.toFixed(2),
          behaviorMetrics.total_violations,
          behaviorMetrics.major_violations + behaviorMetrics.critical_violations,
          behaviorMetrics.minor_violations,
          lastViolationDate,
          riskLevel,
          userId,
        ]
      );

      await client.query('COMMIT');

      return await this.getUserScore(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate video accountability score
   */
  private calculateVideoScore(metrics: any): number {
    if (metrics.total_sessions === 0) {
      return 100;
    }

    const invalidRate = metrics.invalid_sessions / metrics.total_sessions;
    const completionRate = parseFloat(metrics.avg_completion) / 100;

    return Math.max(0, 100 - (invalidRate * 30) - ((1 - completionRate) * 20));
  }

  /**
   * Calculate proctoring score
   */
  private calculateProctoringScore(metrics: any): number {
    if (metrics.total_sessions === 0) {
      return 100;
    }

    const flaggedRate = metrics.flagged_sessions / metrics.total_sessions;
    const avgSuspicious = parseFloat(metrics.avg_suspicious_events);

    return Math.max(0, 100 - (flaggedRate * 50) - (avgSuspicious * 5));
  }

  /**
   * Calculate plagiarism score
   */
  private calculatePlagiarismScore(metrics: any): number {
    if (metrics.total_submissions === 0) {
      return 100;
    }

    const plagiarizedRate = metrics.plagiarized_count / metrics.total_submissions;
    const suspiciousRate = metrics.suspicious_count / metrics.total_submissions;

    return Math.max(0, 100 - (plagiarizedRate * 60) - (suspiciousRate * 20));
  }

  /**
   * Calculate behavior score
   */
  private calculateBehaviorScore(metrics: any): number {
    const criticalPenalty = metrics.critical_violations * 15;
    const majorPenalty = metrics.major_violations * 5;
    const minorPenalty = metrics.minor_violations * 1;

    return Math.max(0, 100 - criticalPenalty - majorPenalty - minorPenalty);
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(overallScore: number, behaviorMetrics: any): 'low' | 'medium' | 'high' | 'critical' {
    if (behaviorMetrics.critical_violations > 0 || overallScore < 50) {
      return 'critical';
    }

    if (overallScore < 70) {
      return 'high';
    }

    if (overallScore < 85) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get user violations
   */
  async getUserViolations(userId: string, limit = 100): Promise<ViolationLog[]> {
    const result = await pool.query(
      `SELECT * FROM violation_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(this.mapViolation);
  }

  /**
   * Log violation
   */
  async logViolation(params: {
    userId: string;
    violationType: string;
    severity: 'minor' | 'major' | 'critical';
    description: string;
    context?: Record<string, any>;
    relatedSessionId?: string;
    actionTaken?: string;
  }): Promise<ViolationLog> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Calculate penalty
      const penalties = { minor: 1.0, major: 5.0, critical: 15.0 };
      const scorePenalty = penalties[params.severity];

      // Insert violation
      const result = await client.query(
        `INSERT INTO violation_logs (
          user_id, violation_type, severity, description, context,
          related_session_id, action_taken, score_penalty
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          params.userId,
          params.violationType,
          params.severity,
          params.description,
          JSON.stringify(params.context || {}),
          params.relatedSessionId,
          params.actionTaken,
          scorePenalty,
        ]
      );

      // Update integrity score
      await client.query('SELECT update_integrity_score($1, $2, $3)', [
        params.userId,
        params.violationType,
        params.severity,
      ]);

      await client.query('COMMIT');

      return this.mapViolation(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get flagged users
   */
  async getFlaggedUsers(limit = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM flagged_users
       ORDER BY overall_score ASC, total_violations DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get leaderboard (highest integrity)
   */
  async getLeaderboard(limit = 50): Promise<IntegrityScore[]> {
    const result = await pool.query(
      `SELECT * FROM integrity_scores
       WHERE overall_score > 0
       ORDER BY overall_score DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapScore);
  }

  /**
   * Map database row to IntegrityScore
   */
  private mapScore(row: any): IntegrityScore {
    return {
      userId: row.user_id,
      overallScore: parseFloat(row.overall_score),
      videoAccountabilityScore: parseFloat(row.video_accountability_score),
      proctoringScore: parseFloat(row.proctoring_score),
      plagiarismScore: parseFloat(row.plagiarism_score),
      behaviorScore: parseFloat(row.behavior_score),
      totalViolations: row.total_violations,
      majorViolations: row.major_violations,
      minorViolations: row.minor_violations,
      lastViolationDate: row.last_violation_date,
      riskLevel: row.risk_level,
      flags: row.flags,
    };
  }

  /**
   * Map database row to ViolationLog
   */
  private mapViolation(row: any): ViolationLog {
    return {
      id: row.id,
      userId: row.user_id,
      violationType: row.violation_type,
      severity: row.severity,
      description: row.description,
      context: row.context,
      relatedSessionId: row.related_session_id,
      actionTaken: row.action_taken,
      scorePenalty: parseFloat(row.score_penalty),
      notified: row.notified,
      reviewed: row.reviewed,
      createdAt: row.created_at,
    };
  }
}

export const integrityScoreService = new IntegrityScoreService();
