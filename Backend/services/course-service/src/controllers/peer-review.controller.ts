import { Request, Response } from 'express';
import { peerReviewService } from '../services/peer-review.service';

/**
 * Peer Code Review Controller
 * Handles rubric-based peer review with MOSS collusion detection
 */

export class PeerReviewController {
  /**
   * Create review rubric
   * POST /api/peer-review/rubrics
   */
  async createRubric(req: Request, res: Response): Promise<void> {
    try {
      const {
        courseId,
        assessmentId,
        name,
        description,
        minReviewsRequired,
        allowSelfReview,
        anonymizeReviewers,
        anonymizeCodeAuthors,
        submissionDeadline,
        reviewDeadline,
        runMossCheck,
        mossSimilarityThreshold,
      } = req.body;

      if (!courseId || !name) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: courseId, name',
        });
        return;
      }

      const rubric = await peerReviewService.createRubric({
        courseId,
        assessmentId,
        name,
        description,
        minReviewsRequired,
        allowSelfReview,
        anonymizeReviewers,
        anonymizeCodeAuthors,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
        runMossCheck,
        mossSimilarityThreshold,
      });

      res.status(201).json({
        success: true,
        data: rubric,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Create rubric error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create rubric',
      });
    }
  }

  /**
   * Get rubric by ID
   * GET /api/peer-review/rubrics/:rubricId
   */
  async getRubric(req: Request, res: Response): Promise<void> {
    try {
      const { rubricId } = req.params;

      const rubric = await peerReviewService.getRubric(rubricId);

      if (!rubric) {
        res.status(404).json({
          success: false,
          error: 'Rubric not found',
        });
        return;
      }

      res.json({
        success: true,
        data: rubric,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get rubric error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get rubric',
      });
    }
  }

  /**
   * Get rubrics for course
   * GET /api/peer-review/courses/:courseId/rubrics
   */
  async getCourseRubrics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const rubrics = await peerReviewService.getCourseRubrics(courseId);

      res.json({
        success: true,
        data: rubrics,
        count: rubrics.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get course rubrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course rubrics',
      });
    }
  }

  /**
   * Create rubric criterion
   * POST /api/peer-review/rubrics/:rubricId/criteria
   */
  async createCriterion(req: Request, res: Response): Promise<void> {
    try {
      const { rubricId } = req.params;
      const {
        name,
        description,
        displayOrder,
        weight,
        maxScore,
        scoreLabels,
        examples,
        isRequired,
      } = req.body;

      if (!name || !description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description',
        });
        return;
      }

      const criterion = await peerReviewService.createCriterion({
        rubricId,
        name,
        description,
        displayOrder,
        weight,
        maxScore,
        scoreLabels,
        examples,
        isRequired,
      });

      res.status(201).json({
        success: true,
        data: criterion,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Create criterion error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create criterion',
      });
    }
  }

  /**
   * Get rubric criteria
   * GET /api/peer-review/rubrics/:rubricId/criteria
   */
  async getRubricCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { rubricId } = req.params;

      const criteria = await peerReviewService.getRubricCriteria(rubricId);

      res.json({
        success: true,
        data: criteria,
        count: criteria.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get rubric criteria error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get rubric criteria',
      });
    }
  }

  /**
   * Assign peer reviewers
   * POST /api/peer-review/rubrics/:rubricId/assign
   */
  async assignReviewers(req: Request, res: Response): Promise<void> {
    try {
      const { rubricId } = req.params;
      const { submissionIds, reviewsPerSubmission, algorithm } = req.body;

      if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'submissionIds array is required',
        });
        return;
      }

      await peerReviewService.assignReviewers({
        rubricId,
        submissionIds,
        reviewsPerSubmission,
        algorithm,
      });

      res.json({
        success: true,
        message: `Assigned reviewers for ${submissionIds.length} submissions`,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Assign reviewers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign reviewers',
      });
    }
  }

  /**
   * Get reviewer assignments
   * GET /api/peer-review/reviewers/:reviewerId/assignments
   */
  async getReviewerAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { reviewerId } = req.params;
      const { status } = req.query;

      const assignments = await peerReviewService.getReviewerAssignments(
        reviewerId,
        status as string
      );

      res.json({
        success: true,
        data: assignments,
        count: assignments.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get reviewer assignments error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reviewer assignments',
      });
    }
  }

  /**
   * Start review
   * POST /api/peer-review/reviews/:reviewId/start
   */
  async startReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      await peerReviewService.startReview(reviewId);

      res.json({
        success: true,
        message: 'Review started',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Start review error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start review',
      });
    }
  }

  /**
   * Submit criterion score
   * POST /api/peer-review/reviews/:reviewId/scores
   */
  async submitCriterionScore(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { criterionId, score, feedback } = req.body;

      if (!criterionId || score === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: criterionId, score',
        });
        return;
      }

      await peerReviewService.submitCriterionScore({
        reviewId,
        criterionId,
        score,
        feedback,
      });

      res.json({
        success: true,
        message: 'Criterion score submitted',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Submit criterion score error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit criterion score',
      });
    }
  }

  /**
   * Add line comment
   * POST /api/peer-review/reviews/:reviewId/comments
   */
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const {
        fileName,
        lineNumber,
        lineEndNumber,
        codeSnippet,
        comment,
        commentType,
        severity,
      } = req.body;

      if (lineNumber === undefined || !comment) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: lineNumber, comment',
        });
        return;
      }

      const reviewComment = await peerReviewService.addComment({
        reviewId,
        fileName,
        lineNumber,
        lineEndNumber,
        codeSnippet,
        comment,
        commentType,
        severity,
      });

      res.status(201).json({
        success: true,
        data: reviewComment,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Add comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add comment',
      });
    }
  }

  /**
   * Get review comments
   * GET /api/peer-review/reviews/:reviewId/comments
   */
  async getReviewComments(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      const comments = await peerReviewService.getReviewComments(reviewId);

      res.json({
        success: true,
        data: comments,
        count: comments.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get review comments error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get review comments',
      });
    }
  }

  /**
   * Submit review
   * POST /api/peer-review/reviews/:reviewId/submit
   */
  async submitReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { overallFeedback, timeSpentSeconds } = req.body;

      await peerReviewService.submitReview({
        reviewId,
        overallFeedback,
        timeSpentSeconds,
      });

      res.json({
        success: true,
        message: 'Review submitted successfully',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Submit review error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit review',
      });
    }
  }

  /**
   * Get review by ID
   * GET /api/peer-review/reviews/:reviewId
   */
  async getReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      const review = await peerReviewService.getReview(reviewId);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'Review not found',
        });
        return;
      }

      res.json({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get review error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get review',
      });
    }
  }

  /**
   * Get reviews for submission
   * GET /api/peer-review/submissions/:submissionId/reviews
   */
  async getSubmissionReviews(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      const reviews = await peerReviewService.getSubmissionReviews(submissionId);

      res.json({
        success: true,
        data: reviews,
        count: reviews.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get submission reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get submission reviews',
      });
    }
  }

  /**
   * Get reviewer statistics
   * GET /api/peer-review/reviewers/:userId/stats
   */
  async getReviewerStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await peerReviewService.getReviewerStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get reviewer stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reviewer stats',
      });
    }
  }

  /**
   * Rate review helpfulness
   * POST /api/peer-review/reviews/:reviewId/rate
   */
  async rateReviewHelpfulness(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { isHelpful } = req.body;

      if (isHelpful === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: isHelpful',
        });
        return;
      }

      await peerReviewService.rateReviewHelpfulness(reviewId, isHelpful);

      res.json({
        success: true,
        message: 'Review rated successfully',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Rate review helpfulness error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to rate review helpfulness',
      });
    }
  }

  /**
   * Create dispute
   * POST /api/peer-review/reviews/:reviewId/dispute
   */
  async createDispute(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { authorId, reviewerId, reason, description, requestedOutcome } = req.body;

      if (!authorId || !reviewerId || !reason || !description) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: authorId, reviewerId, reason, description',
        });
        return;
      }

      const disputeId = await peerReviewService.createDispute({
        reviewId,
        authorId,
        reviewerId,
        reason,
        description,
        requestedOutcome,
      });

      res.status(201).json({
        success: true,
        data: { disputeId },
        message: 'Dispute created successfully',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Create dispute error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create dispute',
      });
    }
  }

  /**
   * Get disputes
   * GET /api/peer-review/disputes
   */
  async getDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      const disputes = await peerReviewService.getDisputes(status as string);

      res.json({
        success: true,
        data: disputes,
        count: disputes.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get disputes error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get disputes',
      });
    }
  }

  /**
   * Resolve dispute
   * POST /api/peer-review/disputes/:disputeId/resolve
   */
  async resolveDispute(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const { resolvedBy, resolution, resolutionAction, newScore } = req.body;

      if (!resolvedBy || !resolution || !resolutionAction) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: resolvedBy, resolution, resolutionAction',
        });
        return;
      }

      await peerReviewService.resolveDispute({
        disputeId,
        resolvedBy,
        resolution,
        resolutionAction,
        newScore,
      });

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Resolve dispute error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to resolve dispute',
      });
    }
  }

  /**
   * Get pending reviews
   * GET /api/peer-review/pending-reviews
   */
  async getPendingReviews(req: Request, res: Response): Promise<void> {
    try {
      const { reviewerId } = req.query;

      const reviews = await peerReviewService.getPendingReviews(reviewerId as string);

      res.json({
        success: true,
        data: reviews,
        count: reviews.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get pending reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending reviews',
      });
    }
  }

  /**
   * Get submissions awaiting reviews
   * GET /api/peer-review/awaiting-reviews
   */
  async getSubmissionsAwaitingReviews(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.query;

      const submissions = await peerReviewService.getSubmissionsAwaitingReviews(authorId as string);

      res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get submissions awaiting reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get submissions awaiting reviews',
      });
    }
  }

  /**
   * Get high-quality reviewers
   * GET /api/peer-review/high-quality-reviewers
   */
  async getHighQualityReviewers(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;

      const reviewers = await peerReviewService.getHighQualityReviewers(
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: reviewers,
        count: reviewers.length,
      });
    } catch (error: any) {
      console.error('[PeerReviewController] Get high-quality reviewers error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get high-quality reviewers',
      });
    }
  }
}

export const peerReviewController = new PeerReviewController();
