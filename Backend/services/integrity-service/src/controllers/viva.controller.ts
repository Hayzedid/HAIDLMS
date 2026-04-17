import { Request, Response } from 'express';
import { vivaService } from '../services/viva.service';

/**
 * Code Explain / Viva Mode Controller
 * Handles async video explanation requests and submissions
 */

export class VivaController {
  /**
   * Create a viva request for specific student
   * POST /api/viva/requests
   */
  async createVivaRequest(req: Request, res: Response): Promise<void> {
    try {
      const {
        submissionId,
        userId,
        assessmentId,
        problemId,
        selectionType,
        reason,
        instructions,
        deadlineHours,
      } = req.body;

      const requestedBy = req.user?.id || req.body.requestedBy;

      if (!submissionId || !userId || !assessmentId || !problemId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const vivaRequest = await vivaService.createVivaRequest({
        submissionId,
        userId,
        assessmentId,
        problemId,
        requestedBy,
        selectionType: selectionType || 'manual',
        reason,
        instructions,
        deadlineHours,
      });

      res.status(201).json({
        success: true,
        data: vivaRequest,
      });
    } catch (error: any) {
      console.error('[VivaController] Create request error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create viva request',
      });
    }
  }

  /**
   * Random selection of students for viva
   * POST /api/viva/select/random
   */
  async selectRandomStudents(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId, problemId, percentage, instructions, deadlineHours } = req.body;

      const requestedBy = req.user?.id || req.body.requestedBy;

      if (!assessmentId || !problemId || !percentage) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: assessmentId, problemId, percentage',
        });
        return;
      }

      const requests = await vivaService.selectRandomStudentsForViva(
        assessmentId,
        problemId,
        requestedBy,
        percentage,
        instructions,
        deadlineHours
      );

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Random selection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to select random students',
      });
    }
  }

  /**
   * Select flagged submissions for viva
   * POST /api/viva/select/flagged
   */
  async selectFlaggedStudents(req: Request, res: Response): Promise<void> {
    try {
      const {
        assessmentId,
        problemId,
        similarityThreshold,
        instructions,
        deadlineHours,
      } = req.body;

      const requestedBy = req.user?.id || req.body.requestedBy;

      if (!assessmentId || !problemId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: assessmentId, problemId',
        });
        return;
      }

      const requests = await vivaService.selectFlaggedStudentsForViva(
        assessmentId,
        problemId,
        requestedBy,
        similarityThreshold,
        instructions,
        deadlineHours
      );

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Flagged selection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to select flagged students',
      });
    }
  }

  /**
   * Submit video explanation
   * POST /api/viva/requests/:vivaRequestId/submit
   */
  async submitVideoExplanation(req: Request, res: Response): Promise<void> {
    try {
      const { vivaRequestId } = req.params;
      const { videoUrl, videoDurationSeconds, studentNotes } = req.body;

      if (!videoUrl || !videoDurationSeconds) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: videoUrl, videoDurationSeconds',
        });
        return;
      }

      const vivaRequest = await vivaService.submitVideoExplanation({
        vivaRequestId,
        videoUrl,
        videoDurationSeconds,
        studentNotes,
      });

      res.json({
        success: true,
        data: vivaRequest,
        message: 'Video explanation submitted successfully',
      });
    } catch (error: any) {
      console.error('[VivaController] Submit video error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit video explanation',
      });
    }
  }

  /**
   * Review video explanation
   * POST /api/viva/requests/:vivaRequestId/review
   */
  async reviewVideoExplanation(req: Request, res: Response): Promise<void> {
    try {
      const { vivaRequestId } = req.params;
      const {
        explanationScore,
        comprehensionLevel,
        reviewNotes,
        authenticityVerified,
        requiresResubmit,
      } = req.body;

      const reviewedBy = req.user?.id || req.body.reviewedBy;

      if (!explanationScore || !comprehensionLevel || !reviewNotes) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: explanationScore, comprehensionLevel, reviewNotes',
        });
        return;
      }

      const vivaRequest = await vivaService.reviewVideoExplanation({
        vivaRequestId,
        reviewedBy,
        explanationScore,
        comprehensionLevel,
        reviewNotes,
        authenticityVerified: authenticityVerified ?? false,
        requiresResubmit,
      });

      res.json({
        success: true,
        data: vivaRequest,
        message: 'Review completed successfully',
      });
    } catch (error: any) {
      console.error('[VivaController] Review video error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to review video explanation',
      });
    }
  }

  /**
   * Get viva request by ID
   * GET /api/viva/requests/:id
   */
  async getVivaRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vivaRequest = await vivaService.getVivaRequest(id);

      if (!vivaRequest) {
        res.status(404).json({
          success: false,
          error: 'Viva request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: vivaRequest,
      });
    } catch (error: any) {
      console.error('[VivaController] Get request error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get viva request',
      });
    }
  }

  /**
   * Get pending viva requests for student
   * GET /api/viva/student/pending
   */
  async getStudentPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const requests = await vivaService.getPendingRequestsForStudent(userId);

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Get pending requests error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending requests',
      });
    }
  }

  /**
   * Get overdue viva requests for student
   * GET /api/viva/student/overdue
   */
  async getStudentOverdueRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.query.userId as string;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const requests = await vivaService.getOverdueRequestsForStudent(userId);

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Get overdue requests error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overdue requests',
      });
    }
  }

  /**
   * Get vivas needing review (instructor view)
   * GET /api/viva/instructor/pending-review
   */
  async getInstructorPendingReviews(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id || req.query.instructorId as string;

      if (!instructorId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const requests = await vivaService.getVivasNeedingReview(instructorId, limit);

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Get pending reviews error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending reviews',
      });
    }
  }

  /**
   * Get all viva requests for assessment
   * GET /api/viva/assessment/:assessmentId
   */
  async getAssessmentVivaRequests(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { status } = req.query;

      const requests = await vivaService.getVivaRequestsForAssessment(
        assessmentId,
        status as string
      );

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error: any) {
      console.error('[VivaController] Get assessment requests error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get assessment requests',
      });
    }
  }

  /**
   * Get viva statistics for assessment
   * GET /api/viva/assessment/:assessmentId/stats
   */
  async getAssessmentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const stats = await vivaService.getVivaStatistics(assessmentId);

      if (!stats) {
        res.json({
          success: true,
          data: {
            assessmentId,
            totalRequests: 0,
            totalSubmitted: 0,
            totalGraded: 0,
            totalExpired: 0,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[VivaController] Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get statistics',
      });
    }
  }

  /**
   * Waive viva requirement
   * POST /api/viva/requests/:vivaRequestId/waive
   */
  async waiveVivaRequest(req: Request, res: Response): Promise<void> {
    try {
      const { vivaRequestId } = req.params;
      const { reason } = req.body;

      const reviewedBy = req.user?.id || req.body.reviewedBy;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: reason',
        });
        return;
      }

      await vivaService.waiveVivaRequest(vivaRequestId, reviewedBy, reason);

      res.json({
        success: true,
        message: 'Viva requirement waived',
      });
    } catch (error: any) {
      console.error('[VivaController] Waive request error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to waive viva request',
      });
    }
  }

  /**
   * Mark expired viva requests (cron job)
   * POST /api/viva/maintenance/mark-expired
   */
  async markExpiredRequests(req: Request, res: Response): Promise<void> {
    try {
      const count = await vivaService.markExpiredRequests();

      res.json({
        success: true,
        message: `Marked ${count} requests as expired`,
        count,
      });
    } catch (error: any) {
      console.error('[VivaController] Mark expired error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark expired requests',
      });
    }
  }
}

export const vivaController = new VivaController();
