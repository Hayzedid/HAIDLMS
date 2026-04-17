import { pool } from '../db/pool';

/**
 * Code Explain / Viva Mode Service
 * Manages async video explanations of code submissions
 */

export interface VivaRequest {
  id: string;
  submissionId: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  requestedBy: string;
  selectionType: 'random' | 'flagged' | 'all' | 'manual';
  reason?: string;
  instructions?: string;
  requestedAt: Date;
  dueAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  status: 'pending' | 'submitted' | 'under_review' | 'graded' | 'expired' | 'waived';
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoTranscript?: string;
  studentNotes?: string;
  reviewedBy?: string;
  explanationScore?: number;
  comprehensionLevel?: 'poor' | 'fair' | 'good' | 'excellent';
  reviewNotes?: string;
  authenticityVerified?: boolean;
  isLate: boolean;
  isIncomplete: boolean;
  requiresResubmit: boolean;
}

export interface CreateVivaRequestParams {
  submissionId: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  requestedBy: string;
  selectionType: 'random' | 'flagged' | 'all' | 'manual';
  reason?: string;
  instructions?: string;
  deadlineHours?: number;
}

export interface SubmitVivaParams {
  vivaRequestId: string;
  videoUrl: string;
  videoDurationSeconds: number;
  studentNotes?: string;
}

export interface ReviewVivaParams {
  vivaRequestId: string;
  reviewedBy: string;
  explanationScore: number;
  comprehensionLevel: 'poor' | 'fair' | 'good' | 'excellent';
  reviewNotes: string;
  authenticityVerified: boolean;
  requiresResubmit?: boolean;
}

export interface VivaStatistics {
  assessmentId: string;
  totalRequests: number;
  totalSubmitted: number;
  totalGraded: number;
  totalExpired: number;
  avgSubmissionHours: number;
  avgReviewHours: number;
  avgExplanationScore: number;
  avgVideoDuration: number;
  authenticityVerifiedCount: number;
  requiresResubmitCount: number;
}

class VivaService {
  /**
   * Create a viva request for a student
   */
  async createVivaRequest(params: CreateVivaRequestParams): Promise<VivaRequest> {
    try {
      const {
        submissionId,
        userId,
        assessmentId,
        problemId,
        requestedBy,
        selectionType,
        reason,
        instructions,
        deadlineHours = 48,
      } = params;

      // Check if viva already exists for this submission
      const existing = await pool.query(
        'SELECT * FROM viva_requests WHERE submission_id = $1',
        [submissionId]
      );

      if (existing.rows.length > 0) {
        throw new Error('Viva request already exists for this submission');
      }

      // Calculate due date
      const dueAt = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

      // Create viva request
      const result = await pool.query(
        `INSERT INTO viva_requests (
          submission_id, user_id, assessment_id, problem_id, requested_by,
          selection_type, reason, instructions, due_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [submissionId, userId, assessmentId, problemId, requestedBy, selectionType, reason, instructions, dueAt]
      );

      console.log(`[viva] Request created: ${result.rows[0].id} for user ${userId}`);

      return this.mapToVivaRequest(result.rows[0]);
    } catch (error) {
      console.error('[viva] Failed to create request:', error);
      throw error;
    }
  }

  /**
   * Create multiple viva requests (batch)
   */
  async createMultipleVivaRequests(
    submissions: Array<{
      submissionId: string;
      userId: string;
      assessmentId: string;
      problemId: string;
    }>,
    requestedBy: string,
    selectionType: 'random' | 'flagged' | 'all' | 'manual',
    instructions?: string,
    deadlineHours = 48
  ): Promise<VivaRequest[]> {
    const requests: VivaRequest[] = [];

    for (const sub of submissions) {
      try {
        const request = await this.createVivaRequest({
          ...sub,
          requestedBy,
          selectionType,
          instructions,
          deadlineHours,
        });
        requests.push(request);
      } catch (error) {
        console.error(`[viva] Failed to create request for ${sub.submissionId}:`, error);
      }
    }

    return requests;
  }

  /**
   * Random selection of students for viva
   */
  async selectRandomStudentsForViva(
    assessmentId: string,
    problemId: string,
    requestedBy: string,
    percentage: number, // e.g., 20 for 20%
    instructions?: string,
    deadlineHours = 48
  ): Promise<VivaRequest[]> {
    try {
      // Get all submissions for this problem (excluding already selected)
      const result = await pool.query(
        `SELECT cs.id as submission_id, cs.user_id, cs.assessment_id, cs.problem_id
         FROM code_submissions cs
         LEFT JOIN viva_requests vr ON vr.submission_id = cs.id
         WHERE cs.assessment_id = $1
           AND cs.problem_id = $2
           AND vr.id IS NULL
         ORDER BY RANDOM()`,
        [assessmentId, problemId]
      );

      const allSubmissions = result.rows;
      const selectCount = Math.ceil((allSubmissions.length * percentage) / 100);
      const selectedSubmissions = allSubmissions.slice(0, selectCount);

      console.log(
        `[viva] Random selection: ${selectCount} of ${allSubmissions.length} students (${percentage}%)`
      );

      return await this.createMultipleVivaRequests(
        selectedSubmissions,
        requestedBy,
        'random',
        instructions,
        deadlineHours
      );
    } catch (error) {
      console.error('[viva] Random selection failed:', error);
      throw error;
    }
  }

  /**
   * Select flagged submissions for viva (plagiarism suspects)
   */
  async selectFlaggedStudentsForViva(
    assessmentId: string,
    problemId: string,
    requestedBy: string,
    similarityThreshold: number = 0.75,
    instructions?: string,
    deadlineHours = 48
  ): Promise<VivaRequest[]> {
    try {
      // Get flagged submissions
      const result = await pool.query(
        `SELECT cs.id as submission_id, cs.user_id, cs.assessment_id, cs.problem_id
         FROM code_submissions cs
         LEFT JOIN viva_requests vr ON vr.submission_id = cs.id
         WHERE cs.assessment_id = $1
           AND cs.problem_id = $2
           AND cs.is_flagged = true
           AND cs.similarity_score >= $3
           AND vr.id IS NULL`,
        [assessmentId, problemId, similarityThreshold]
      );

      console.log(`[viva] Flagged selection: ${result.rows.length} students`);

      return await this.createMultipleVivaRequests(
        result.rows,
        requestedBy,
        'flagged',
        instructions || 'Please explain your code to verify authorship.',
        deadlineHours
      );
    } catch (error) {
      console.error('[viva] Flagged selection failed:', error);
      throw error;
    }
  }

  /**
   * Submit video explanation
   */
  async submitVideoExplanation(params: SubmitVivaParams): Promise<VivaRequest> {
    try {
      const { vivaRequestId, videoUrl, videoDurationSeconds, studentNotes } = params;

      // Update viva request
      const result = await pool.query(
        `UPDATE viva_requests
         SET video_url = $1,
             video_duration_seconds = $2,
             student_notes = $3,
             status = 'submitted',
             submitted_at = NOW(),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [videoUrl, videoDurationSeconds, studentNotes, vivaRequestId]
      );

      if (result.rows.length === 0) {
        throw new Error('Viva request not found');
      }

      console.log(`[viva] Video submitted for request ${vivaRequestId}`);

      return this.mapToVivaRequest(result.rows[0]);
    } catch (error) {
      console.error('[viva] Failed to submit video:', error);
      throw error;
    }
  }

  /**
   * Review video explanation
   */
  async reviewVideoExplanation(params: ReviewVivaParams): Promise<VivaRequest> {
    try {
      const {
        vivaRequestId,
        reviewedBy,
        explanationScore,
        comprehensionLevel,
        reviewNotes,
        authenticityVerified,
        requiresResubmit = false,
      } = params;

      // Update viva request
      const result = await pool.query(
        `UPDATE viva_requests
         SET reviewed_by = $1,
             explanation_score = $2,
             comprehension_level = $3,
             review_notes = $4,
             authenticity_verified = $5,
             requires_resubmit = $6,
             status = CASE WHEN $6 = true THEN 'pending' ELSE 'graded' END,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          reviewedBy,
          explanationScore,
          comprehensionLevel,
          reviewNotes,
          authenticityVerified,
          requiresResubmit,
          vivaRequestId,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Viva request not found');
      }

      console.log(`[viva] Review completed for request ${vivaRequestId}: score=${explanationScore}`);

      return this.mapToVivaRequest(result.rows[0]);
    } catch (error) {
      console.error('[viva] Failed to review video:', error);
      throw error;
    }
  }

  /**
   * Get viva request by ID
   */
  async getVivaRequest(id: string): Promise<VivaRequest | null> {
    try {
      const result = await pool.query('SELECT * FROM viva_requests WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToVivaRequest(result.rows[0]);
    } catch (error) {
      console.error('[viva] Failed to get request:', error);
      return null;
    }
  }

  /**
   * Get pending viva requests for a student
   */
  async getPendingRequestsForStudent(userId: string): Promise<VivaRequest[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM viva_requests
         WHERE user_id = $1
           AND status = 'pending'
           AND due_at > NOW()
         ORDER BY due_at ASC`,
        [userId]
      );

      return result.rows.map(this.mapToVivaRequest);
    } catch (error) {
      console.error('[viva] Failed to get pending requests:', error);
      return [];
    }
  }

  /**
   * Get overdue viva requests for a student
   */
  async getOverdueRequestsForStudent(userId: string): Promise<VivaRequest[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM viva_requests
         WHERE user_id = $1
           AND status = 'pending'
           AND due_at < NOW()
         ORDER BY due_at ASC`,
        [userId]
      );

      return result.rows.map(this.mapToVivaRequest);
    } catch (error) {
      console.error('[viva] Failed to get overdue requests:', error);
      return [];
    }
  }

  /**
   * Get vivas needing review (instructor view)
   */
  async getVivasNeedingReview(instructorId: string, limit = 50): Promise<VivaRequest[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM viva_requests
         WHERE requested_by = $1
           AND status IN ('submitted', 'under_review')
         ORDER BY submitted_at ASC
         LIMIT $2`,
        [instructorId, limit]
      );

      return result.rows.map(this.mapToVivaRequest);
    } catch (error) {
      console.error('[viva] Failed to get vivas needing review:', error);
      return [];
    }
  }

  /**
   * Get all viva requests for an assessment
   */
  async getVivaRequestsForAssessment(
    assessmentId: string,
    status?: string
  ): Promise<VivaRequest[]> {
    try {
      let query = 'SELECT * FROM viva_requests WHERE assessment_id = $1';
      const params: any[] = [assessmentId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      query += ' ORDER BY requested_at DESC';

      const result = await pool.query(query, params);

      return result.rows.map(this.mapToVivaRequest);
    } catch (error) {
      console.error('[viva] Failed to get assessment requests:', error);
      return [];
    }
  }

  /**
   * Get viva statistics for assessment
   */
  async getVivaStatistics(assessmentId: string): Promise<VivaStatistics | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM viva_statistics WHERE assessment_id = $1',
        [assessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        assessmentId: row.assessment_id,
        totalRequests: row.total_requests || 0,
        totalSubmitted: row.total_submitted || 0,
        totalGraded: row.total_graded || 0,
        totalExpired: row.total_expired || 0,
        avgSubmissionHours: parseFloat(row.avg_submission_hours) || 0,
        avgReviewHours: parseFloat(row.avg_review_hours) || 0,
        avgExplanationScore: parseFloat(row.avg_explanation_score) || 0,
        avgVideoDuration: parseFloat(row.avg_video_duration) || 0,
        authenticityVerifiedCount: row.authenticity_verified_count || 0,
        requiresResubmitCount: row.requires_resubmit_count || 0,
      };
    } catch (error) {
      console.error('[viva] Failed to get statistics:', error);
      return null;
    }
  }

  /**
   * Waive viva requirement
   */
  async waiveVivaRequest(vivaRequestId: string, reviewedBy: string, reason: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE viva_requests
         SET status = 'waived',
             reviewed_by = $1,
             review_notes = $2,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [reviewedBy, `Waived: ${reason}`, vivaRequestId]
      );

      console.log(`[viva] Request ${vivaRequestId} waived by ${reviewedBy}`);
    } catch (error) {
      console.error('[viva] Failed to waive request:', error);
      throw error;
    }
  }

  /**
   * Mark expired viva requests
   */
  async markExpiredRequests(): Promise<number> {
    try {
      const result = await pool.query(
        `UPDATE viva_requests
         SET status = 'expired', is_incomplete = true, updated_at = NOW()
         WHERE status = 'pending' AND due_at < NOW()`
      );

      const count = result.rowCount || 0;

      if (count > 0) {
        console.log(`[viva] Marked ${count} requests as expired`);
      }

      return count;
    } catch (error) {
      console.error('[viva] Failed to mark expired requests:', error);
      return 0;
    }
  }

  /**
   * Map database row to VivaRequest
   */
  private mapToVivaRequest(row: any): VivaRequest {
    return {
      id: row.id,
      submissionId: row.submission_id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      requestedBy: row.requested_by,
      selectionType: row.selection_type,
      reason: row.reason,
      instructions: row.instructions,
      requestedAt: new Date(row.requested_at),
      dueAt: new Date(row.due_at),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      status: row.status,
      videoUrl: row.video_url,
      videoDurationSeconds: row.video_duration_seconds,
      videoTranscript: row.video_transcript,
      studentNotes: row.student_notes,
      reviewedBy: row.reviewed_by,
      explanationScore: row.explanation_score ? parseFloat(row.explanation_score) : undefined,
      comprehensionLevel: row.comprehension_level,
      reviewNotes: row.review_notes,
      authenticityVerified: row.authenticity_verified,
      isLate: row.is_late,
      isIncomplete: row.is_incomplete,
      requiresResubmit: row.requires_resubmit,
    };
  }
}

export const vivaService = new VivaService();
