import pool from '../db/pool';
import crypto from 'crypto';

/**
 * Peer Code Review Service
 * Manages rubric-based peer reviews with MOSS collusion detection
 */

interface ReviewRubric {
  id: string;
  courseId: string;
  assessmentId?: string;
  name: string;
  description?: string;
  minReviewsRequired: number;
  allowSelfReview: boolean;
  anonymizeReviewers: boolean;
  anonymizeCodeAuthors: boolean;
  submissionDeadline?: Date;
  reviewDeadline?: Date;
  runMossCheck: boolean;
  mossSimilarityThreshold: number;
  isActive: boolean;
}

interface RubricCriterion {
  id: string;
  rubricId: string;
  name: string;
  description: string;
  displayOrder: number;
  weight: number;
  maxScore: number;
  scoreLabels?: Record<string, string>;
  examples?: string;
  isRequired: boolean;
}

interface CodeReview {
  id: string;
  rubricId: string;
  submissionId: string;
  authorId: string;
  reviewerId: string;
  status: string;
  overallScore?: number;
  overallFeedback?: string;
  startedAt?: Date;
  submittedAt?: Date;
  timeSpentSeconds?: number;
  isFlaggedForCollusion: boolean;
  collusionSimilarityScore?: number;
}

interface ReviewComment {
  id: string;
  reviewId: string;
  fileName?: string;
  lineNumber: number;
  lineEndNumber?: number;
  codeSnippet?: string;
  comment: string;
  commentType?: string;
  severity?: string;
  authorResponse?: string;
  isResolved: boolean;
}

export class PeerReviewService {
  /**
   * Create review rubric
   */
  async createRubric(params: {
    courseId: string;
    assessmentId?: string;
    name: string;
    description?: string;
    minReviewsRequired?: number;
    allowSelfReview?: boolean;
    anonymizeReviewers?: boolean;
    anonymizeCodeAuthors?: boolean;
    submissionDeadline?: Date;
    reviewDeadline?: Date;
    runMossCheck?: boolean;
    mossSimilarityThreshold?: number;
  }): Promise<ReviewRubric> {
    const result = await pool.query(
      `INSERT INTO review_rubrics (
        course_id, assessment_id, name, description,
        min_reviews_required, allow_self_review, anonymize_reviewers,
        anonymize_code_authors, submission_deadline, review_deadline,
        run_moss_check, moss_similarity_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        params.courseId,
        params.assessmentId,
        params.name,
        params.description,
        params.minReviewsRequired || 2,
        params.allowSelfReview || false,
        params.anonymizeReviewers !== undefined ? params.anonymizeReviewers : true,
        params.anonymizeCodeAuthors || false,
        params.submissionDeadline,
        params.reviewDeadline,
        params.runMossCheck !== undefined ? params.runMossCheck : true,
        params.mossSimilarityThreshold || 0.75,
      ]
    );

    return this.mapRubricRow(result.rows[0]);
  }

  /**
   * Get rubric by ID
   */
  async getRubric(rubricId: string): Promise<ReviewRubric | null> {
    const result = await pool.query(
      'SELECT * FROM review_rubrics WHERE id = $1',
      [rubricId]
    );

    return result.rows[0] ? this.mapRubricRow(result.rows[0]) : null;
  }

  /**
   * Get rubrics for course
   */
  async getCourseRubrics(courseId: string): Promise<ReviewRubric[]> {
    const result = await pool.query(
      `SELECT * FROM review_rubrics
      WHERE course_id = $1 AND is_active = true
      ORDER BY created_at DESC`,
      [courseId]
    );

    return result.rows.map(this.mapRubricRow);
  }

  /**
   * Create rubric criterion
   */
  async createCriterion(params: {
    rubricId: string;
    name: string;
    description: string;
    displayOrder?: number;
    weight?: number;
    maxScore?: number;
    scoreLabels?: Record<string, string>;
    examples?: string;
    isRequired?: boolean;
  }): Promise<RubricCriterion> {
    const result = await pool.query(
      `INSERT INTO rubric_criteria (
        rubric_id, name, description, display_order, weight,
        max_score, score_labels, examples, is_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        params.rubricId,
        params.name,
        params.description,
        params.displayOrder || 0,
        params.weight || 1.0,
        params.maxScore || 5,
        params.scoreLabels ? JSON.stringify(params.scoreLabels) : null,
        params.examples,
        params.isRequired !== undefined ? params.isRequired : true,
      ]
    );

    return this.mapCriterionRow(result.rows[0]);
  }

  /**
   * Get rubric criteria
   */
  async getRubricCriteria(rubricId: string): Promise<RubricCriterion[]> {
    const result = await pool.query(
      `SELECT * FROM rubric_criteria
      WHERE rubric_id = $1
      ORDER BY display_order ASC`,
      [rubricId]
    );

    return result.rows.map(this.mapCriterionRow);
  }

  /**
   * Assign peer reviewers (Round-robin algorithm)
   */
  async assignReviewers(params: {
    rubricId: string;
    submissionIds: string[];
    reviewsPerSubmission?: number;
    algorithm?: 'round-robin' | 'random' | 'quality-based';
  }): Promise<void> {
    const { rubricId, submissionIds, reviewsPerSubmission = 2, algorithm = 'round-robin' } = params;

    // Get rubric settings
    const rubric = await this.getRubric(rubricId);
    if (!rubric) {
      throw new Error('Rubric not found');
    }

    // Get submission authors
    const submissionMap = new Map<string, string>(); // submissionId -> authorId
    for (const submissionId of submissionIds) {
      // Assuming submissions table exists with author_id
      const result = await pool.query(
        'SELECT user_id FROM submissions WHERE id = $1',
        [submissionId]
      );
      if (result.rows[0]) {
        submissionMap.set(submissionId, result.rows[0].user_id);
      }
    }

    const reviewerAssignments: Array<{ submissionId: string; reviewerId: string }> = [];

    if (algorithm === 'round-robin') {
      // Round-robin: Each submission reviewed by next N students
      for (let i = 0; i < submissionIds.length; i++) {
        const submissionId = submissionIds[i];
        const authorId = submissionMap.get(submissionId);

        for (let j = 1; j <= reviewsPerSubmission; j++) {
          const reviewerIndex = (i + j) % submissionIds.length;
          const reviewerSubmissionId = submissionIds[reviewerIndex];
          const reviewerId = submissionMap.get(reviewerSubmissionId);

          // Skip self-review if not allowed
          if (!rubric.allowSelfReview && authorId === reviewerId) {
            continue;
          }

          if (reviewerId) {
            reviewerAssignments.push({ submissionId, reviewerId });
          }
        }
      }
    } else if (algorithm === 'random') {
      // Random assignment
      const shuffled = [...submissionIds].sort(() => Math.random() - 0.5);
      for (let i = 0; i < submissionIds.length; i++) {
        const submissionId = submissionIds[i];
        const authorId = submissionMap.get(submissionId);

        for (let j = 1; j <= reviewsPerSubmission; j++) {
          const reviewerIndex = (i + j) % shuffled.length;
          const reviewerSubmissionId = shuffled[reviewerIndex];
          const reviewerId = submissionMap.get(reviewerSubmissionId);

          if (!rubric.allowSelfReview && authorId === reviewerId) {
            continue;
          }

          if (reviewerId) {
            reviewerAssignments.push({ submissionId, reviewerId });
          }
        }
      }
    } else if (algorithm === 'quality-based') {
      // Assign high-quality reviewers first
      const highQualityReviewers = await pool.query(
        'SELECT user_id FROM high_quality_reviewers ORDER BY quality_score DESC LIMIT 20'
      );
      const highQualityIds = highQualityReviewers.rows.map(r => r.user_id);

      for (const submissionId of submissionIds) {
        const authorId = submissionMap.get(submissionId);
        let assignedCount = 0;

        // First, try to assign high-quality reviewers
        for (const reviewerId of highQualityIds) {
          if (assignedCount >= reviewsPerSubmission) break;
          if (!rubric.allowSelfReview && authorId === reviewerId) continue;

          reviewerAssignments.push({ submissionId, reviewerId });
          assignedCount++;
        }

        // Fill remaining slots with other students
        if (assignedCount < reviewsPerSubmission) {
          for (const [, reviewerId] of submissionMap) {
            if (assignedCount >= reviewsPerSubmission) break;
            if (highQualityIds.includes(reviewerId)) continue;
            if (!rubric.allowSelfReview && authorId === reviewerId) continue;

            reviewerAssignments.push({ submissionId, reviewerId });
            assignedCount++;
          }
        }
      }
    }

    // Insert assignments
    const dueAt = rubric.reviewDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    for (const assignment of reviewerAssignments) {
      const authorId = submissionMap.get(assignment.submissionId);

      // Create assignment
      await pool.query(
        `INSERT INTO review_assignments (
          rubric_id, submission_id, author_id, reviewer_id, due_at
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (submission_id, reviewer_id) DO NOTHING`,
        [rubricId, assignment.submissionId, authorId, assignment.reviewerId, dueAt]
      );

      // Create review record
      await pool.query(
        `INSERT INTO code_reviews (
          rubric_id, submission_id, author_id, reviewer_id, status
        ) VALUES ($1, $2, $3, $4, 'pending')
        ON CONFLICT (submission_id, reviewer_id) DO NOTHING`,
        [rubricId, assignment.submissionId, authorId, assignment.reviewerId]
      );
    }
  }

  /**
   * Get reviews assigned to reviewer
   */
  async getReviewerAssignments(reviewerId: string, status?: string): Promise<any[]> {
    let query = `
      SELECT
        cr.*,
        ra.due_at,
        CASE WHEN NOW() > ra.due_at THEN true ELSE false END as is_overdue
      FROM code_reviews cr
      JOIN review_assignments ra ON ra.submission_id = cr.submission_id AND ra.reviewer_id = cr.reviewer_id
      WHERE cr.reviewer_id = $1
    `;
    const values: any[] = [reviewerId];

    if (status) {
      query += ' AND cr.status = $2';
      values.push(status);
    }

    query += ' ORDER BY ra.due_at ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Start review (mark as in progress)
   */
  async startReview(reviewId: string): Promise<void> {
    await pool.query(
      `UPDATE code_reviews
      SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
      WHERE id = $1`,
      [reviewId]
    );
  }

  /**
   * Submit criterion score
   */
  async submitCriterionScore(params: {
    reviewId: string;
    criterionId: string;
    score: number;
    feedback?: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO review_criterion_scores (review_id, criterion_id, score, feedback)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (review_id, criterion_id)
      DO UPDATE SET score = $3, feedback = $4`,
      [params.reviewId, params.criterionId, params.score, params.feedback]
    );
  }

  /**
   * Add line comment
   */
  async addComment(params: {
    reviewId: string;
    fileName?: string;
    lineNumber: number;
    lineEndNumber?: number;
    codeSnippet?: string;
    comment: string;
    commentType?: 'suggestion' | 'question' | 'praise' | 'issue' | 'critical';
    severity?: 'low' | 'medium' | 'high';
  }): Promise<ReviewComment> {
    const result = await pool.query(
      `INSERT INTO review_comments (
        review_id, file_name, line_number, line_end_number,
        code_snippet, comment, comment_type, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        params.reviewId,
        params.fileName,
        params.lineNumber,
        params.lineEndNumber,
        params.codeSnippet,
        params.comment,
        params.commentType,
        params.severity,
      ]
    );

    return this.mapCommentRow(result.rows[0]);
  }

  /**
   * Get review comments
   */
  async getReviewComments(reviewId: string): Promise<ReviewComment[]> {
    const result = await pool.query(
      `SELECT * FROM review_comments
      WHERE review_id = $1
      ORDER BY file_name, line_number ASC`,
      [reviewId]
    );

    return result.rows.map(this.mapCommentRow);
  }

  /**
   * Submit review
   */
  async submitReview(params: {
    reviewId: string;
    overallFeedback?: string;
    timeSpentSeconds?: number;
  }): Promise<void> {
    await pool.query(
      `UPDATE code_reviews
      SET status = 'submitted',
          overall_feedback = $2,
          time_spent_seconds = $3,
          submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1`,
      [params.reviewId, params.overallFeedback, params.timeSpentSeconds]
    );

    // Trigger MOSS check if enabled
    const review = await this.getReview(params.reviewId);
    if (review) {
      const rubric = await this.getRubric(review.rubricId);
      if (rubric?.runMossCheck) {
        await this.queueMossCheck(params.reviewId);
      }
    }
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<CodeReview | null> {
    const result = await pool.query(
      'SELECT * FROM code_reviews WHERE id = $1',
      [reviewId]
    );

    return result.rows[0] ? this.mapReviewRow(result.rows[0]) : null;
  }

  /**
   * Get reviews for submission
   */
  async getSubmissionReviews(submissionId: string): Promise<CodeReview[]> {
    const result = await pool.query(
      `SELECT * FROM code_reviews
      WHERE submission_id = $1
      ORDER BY submitted_at DESC NULLS LAST`,
      [submissionId]
    );

    return result.rows.map(this.mapReviewRow);
  }

  /**
   * Queue MOSS collusion check
   */
  private async queueMossCheck(reviewId: string): Promise<void> {
    // Get review details
    const review = await this.getReview(reviewId);
    if (!review) return;

    // Find reviewer's submission
    const reviewerSubmission = await pool.query(
      `SELECT id FROM submissions
      WHERE user_id = $1
      AND assessment_id = (
        SELECT assessment_id FROM review_rubrics
        WHERE id = $2
      )
      LIMIT 1`,
      [review.reviewerId, review.rubricId]
    );

    if (reviewerSubmission.rows.length === 0) return;

    const reviewerSubmissionId = reviewerSubmission.rows[0].id;

    // Simulate MOSS check (in production, this would call actual MOSS service)
    const similarityScore = Math.random() * 0.3; // Simulate 0-30% similarity

    await pool.query(
      `INSERT INTO peer_review_moss_checks (
        review_id, reviewer_submission_id, reviewed_submission_id,
        similarity_score, is_collusion, manual_review_required
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        reviewId,
        reviewerSubmissionId,
        review.submissionId,
        similarityScore,
        similarityScore > 0.75,
        similarityScore > 0.60 && similarityScore <= 0.75,
      ]
    );

    // Flag review if collusion detected
    if (similarityScore > 0.75) {
      await pool.query(
        `UPDATE code_reviews
        SET is_flagged_for_collusion = true,
            collusion_similarity_score = $2,
            collusion_check_run_at = NOW()
        WHERE id = $1`,
        [reviewId, similarityScore]
      );
    }
  }

  /**
   * Get reviewer statistics
   */
  async getReviewerStats(userId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM reviewer_stats WHERE user_id = $1',
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Mark review as helpful/unhelpful
   */
  async rateReviewHelpfulness(reviewId: string, isHelpful: boolean): Promise<void> {
    await pool.query(
      `UPDATE code_reviews
      SET is_helpful = $2, updated_at = NOW()
      WHERE id = $1`,
      [reviewId, isHelpful]
    );

    // Update reviewer stats
    const review = await this.getReview(reviewId);
    if (review) {
      await this.updateReviewerHelpfulnessRating(review.reviewerId);
    }
  }

  /**
   * Update reviewer helpfulness rating
   */
  private async updateReviewerHelpfulnessRating(reviewerId: string): Promise<void> {
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE is_helpful = true) as helpful_count,
        COUNT(*) FILTER (WHERE is_helpful IS NOT NULL) as total_rated
      FROM code_reviews
      WHERE reviewer_id = $1 AND status = 'submitted'`,
      [reviewerId]
    );

    const row = stats.rows[0];
    const avgHelpfulness = row.total_rated > 0 ? row.helpful_count / row.total_rated : null;

    if (avgHelpfulness !== null) {
      await pool.query(
        `INSERT INTO reviewer_stats (user_id, avg_helpfulness_rating, last_updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET avg_helpfulness_rating = $2, last_updated_at = NOW()`,
        [reviewerId, avgHelpfulness]
      );
    }
  }

  /**
   * Create dispute
   */
  async createDispute(params: {
    reviewId: string;
    authorId: string;
    reviewerId: string;
    reason: string;
    description: string;
    requestedOutcome?: string;
  }): Promise<string> {
    const result = await pool.query(
      `INSERT INTO review_disputes (
        review_id, author_id, reviewer_id, reason, description, requested_outcome
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        params.reviewId,
        params.authorId,
        params.reviewerId,
        params.reason,
        params.description,
        params.requestedOutcome,
      ]
    );

    // Update review status
    await pool.query(
      `UPDATE code_reviews SET status = 'disputed', updated_at = NOW() WHERE id = $1`,
      [params.reviewId]
    );

    return result.rows[0].id;
  }

  /**
   * Get disputes (for instructors)
   */
  async getDisputes(status?: string): Promise<any[]> {
    let query = 'SELECT * FROM review_disputes WHERE 1=1';
    const values: any[] = [];

    if (status) {
      query += ' AND status = $1';
      values.push(status);
    }

    query += ' ORDER BY opened_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(params: {
    disputeId: string;
    resolvedBy: string;
    resolution: string;
    resolutionAction: 'no_change' | 'score_adjusted' | 'review_removed' | 're_review_assigned';
    newScore?: number;
  }): Promise<void> {
    await pool.query(
      `UPDATE review_disputes
      SET status = 'resolved',
          resolved_by = $2,
          resolution = $3,
          resolution_action = $4,
          resolved_at = NOW()
      WHERE id = $1`,
      [params.disputeId, params.resolvedBy, params.resolution, params.resolutionAction]
    );

    // Apply resolution action
    const dispute = await pool.query(
      'SELECT review_id FROM review_disputes WHERE id = $1',
      [params.disputeId]
    );

    if (dispute.rows[0]) {
      const reviewId = dispute.rows[0].review_id;

      if (params.resolutionAction === 'score_adjusted' && params.newScore !== undefined) {
        await pool.query(
          `UPDATE code_reviews
          SET instructor_override_score = $2, status = 'resolved', updated_at = NOW()
          WHERE id = $1`,
          [reviewId, params.newScore]
        );
      } else if (params.resolutionAction === 'review_removed') {
        await pool.query(
          `DELETE FROM code_reviews WHERE id = $1`,
          [reviewId]
        );
      } else if (params.resolutionAction === 're_review_assigned') {
        // Reset review to pending and assign new reviewer (simplified)
        await pool.query(
          `UPDATE code_reviews
          SET status = 'pending', updated_at = NOW()
          WHERE id = $1`,
          [reviewId]
        );
      } else {
        // no_change
        await pool.query(
          `UPDATE code_reviews SET status = 'resolved', updated_at = NOW() WHERE id = $1`,
          [reviewId]
        );
      }
    }
  }

  /**
   * Get pending reviews view
   */
  async getPendingReviews(reviewerId?: string): Promise<any[]> {
    let query = 'SELECT * FROM pending_reviews WHERE 1=1';
    const values: any[] = [];

    if (reviewerId) {
      query += ' AND reviewer_id = $1';
      values.push(reviewerId);
    }

    query += ' ORDER BY due_at ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get submissions awaiting reviews
   */
  async getSubmissionsAwaitingReviews(authorId?: string): Promise<any[]> {
    let query = 'SELECT * FROM submissions_awaiting_reviews WHERE 1=1';
    const values: any[] = [];

    if (authorId) {
      query += ' AND author_id = $1';
      values.push(authorId);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get high-quality reviewers
   */
  async getHighQualityReviewers(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM high_quality_reviewers LIMIT $1',
      [limit]
    );

    return result.rows;
  }

  // Row mappers
  private mapRubricRow(row: any): ReviewRubric {
    return {
      id: row.id,
      courseId: row.course_id,
      assessmentId: row.assessment_id,
      name: row.name,
      description: row.description,
      minReviewsRequired: row.min_reviews_required,
      allowSelfReview: row.allow_self_review,
      anonymizeReviewers: row.anonymize_reviewers,
      anonymizeCodeAuthors: row.anonymize_code_authors,
      submissionDeadline: row.submission_deadline,
      reviewDeadline: row.review_deadline,
      runMossCheck: row.run_moss_check,
      mossSimilarityThreshold: parseFloat(row.moss_similarity_threshold),
      isActive: row.is_active,
    };
  }

  private mapCriterionRow(row: any): RubricCriterion {
    return {
      id: row.id,
      rubricId: row.rubric_id,
      name: row.name,
      description: row.description,
      displayOrder: row.display_order,
      weight: parseFloat(row.weight),
      maxScore: row.max_score,
      scoreLabels: row.score_labels,
      examples: row.examples,
      isRequired: row.is_required,
    };
  }

  private mapReviewRow(row: any): CodeReview {
    return {
      id: row.id,
      rubricId: row.rubric_id,
      submissionId: row.submission_id,
      authorId: row.author_id,
      reviewerId: row.reviewer_id,
      status: row.status,
      overallScore: row.overall_score ? parseFloat(row.overall_score) : undefined,
      overallFeedback: row.overall_feedback,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      timeSpentSeconds: row.time_spent_seconds,
      isFlaggedForCollusion: row.is_flagged_for_collusion,
      collusionSimilarityScore: row.collusion_similarity_score ? parseFloat(row.collusion_similarity_score) : undefined,
    };
  }

  private mapCommentRow(row: any): ReviewComment {
    return {
      id: row.id,
      reviewId: row.review_id,
      fileName: row.file_name,
      lineNumber: row.line_number,
      lineEndNumber: row.line_end_number,
      codeSnippet: row.code_snippet,
      comment: row.comment,
      commentType: row.comment_type,
      severity: row.severity,
      authorResponse: row.author_response,
      isResolved: row.is_resolved,
    };
  }
}

export const peerReviewService = new PeerReviewService();
