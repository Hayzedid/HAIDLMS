import { Request, Response } from 'express';
import { plagiarismService } from '../services/plagiarism.service';
import { mossService } from '../services/moss.service';

/**
 * Plagiarism Detection Controller
 * Handles code plagiarism detection, MOSS integration, and reporting
 */

export class PlagiarismController {
  /**
   * Submit code for plagiarism check
   * POST /api/plagiarism/submit
   */
  async submitCode(req: Request, res: Response): Promise<void> {
    try {
      const { userId, assessmentId, problemId, language, code, fileName } = req.body;

      if (!userId || !assessmentId || !problemId || !language || !code) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const submission = await plagiarismService.submitCode({
        userId,
        assessmentId,
        problemId,
        language,
        code,
        fileName: fileName || `submission_${userId}.${language}`,
      });

      res.status(201).json({
        success: true,
        data: submission,
        message: 'Code submitted successfully. Plagiarism check initiated.',
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Submit code error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit code',
      });
    }
  }

  /**
   * Get submission details
   * GET /api/plagiarism/submissions/:submissionId
   */
  async getSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      const submission = await plagiarismService.getSubmission(submissionId);

      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found',
        });
        return;
      }

      res.json({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get submission',
      });
    }
  }

  /**
   * Get user submissions
   * GET /api/plagiarism/submissions/user/:userId?assessmentId=xxx
   */
  async getUserSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { assessmentId } = req.query;

      const submissions = await plagiarismService.getUserSubmissions(
        userId,
        assessmentId as string | undefined
      );

      res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get user submissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user submissions',
      });
    }
  }

  /**
   * Get flagged submissions (for instructors)
   * GET /api/plagiarism/flagged?limit=100
   */
  async getFlaggedSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const submissions = await plagiarismService.getFlaggedSubmissions(limit);

      res.json({
        success: true,
        data: submissions,
        count: submissions.length,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get flagged submissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get flagged submissions',
      });
    }
  }

  /**
   * Get plagiarism matches for a submission
   * GET /api/plagiarism/matches/:submissionId
   */
  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      const matches = await plagiarismService.getMatches(submissionId);

      res.json({
        success: true,
        data: matches,
        count: matches.length,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get matches error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get matches',
      });
    }
  }

  /**
   * Trigger MOSS plagiarism check for assessment
   * POST /api/plagiarism/moss/check
   */
  async triggerMossCheck(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId, problemId } = req.body;

      if (!assessmentId || !problemId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: assessmentId, problemId',
        });
        return;
      }

      // Trigger MOSS check asynchronously
      mossService.checkAssessmentPlagiarism(assessmentId, problemId).catch((error) => {
        console.error('[PlagiarismController] MOSS check failed:', error);
      });

      res.json({
        success: true,
        message: 'MOSS plagiarism check initiated. This may take several minutes.',
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Trigger MOSS check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to trigger MOSS check',
      });
    }
  }

  /**
   * Get MOSS report URL
   * GET /api/plagiarism/moss/report/:submissionId
   */
  async getMossReport(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      const reportUrl = await mossService.getMossReportUrl(submissionId);

      if (!reportUrl) {
        res.status(404).json({
          success: false,
          error: 'MOSS report not found for this submission',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          reportUrl,
        },
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get MOSS report error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get MOSS report',
      });
    }
  }

  /**
   * Update submission review
   * PATCH /api/plagiarism/submissions/:submissionId/review
   */
  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { reviewedBy, reviewNotes, plagiarismStatus } = req.body;

      if (!reviewedBy || !reviewNotes) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: reviewedBy, reviewNotes',
        });
        return;
      }

      await plagiarismService.updateReview(submissionId, {
        reviewedBy,
        reviewNotes,
        plagiarismStatus,
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Update review error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update review',
      });
    }
  }

  /**
   * Get plagiarism statistics for assessment
   * GET /api/plagiarism/stats/assessment/:assessmentId
   */
  async getAssessmentStats(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const stats = await this.calculateAssessmentStats(assessmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get assessment stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get assessment stats',
      });
    }
  }

  /**
   * Get plagiarism statistics for course
   * GET /api/plagiarism/stats/course/:courseId
   */
  async getCourseStats(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const stats = await this.calculateCourseStats(courseId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[PlagiarismController] Get course stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course stats',
      });
    }
  }

  /**
   * Calculate assessment-level plagiarism statistics
   */
  private async calculateAssessmentStats(assessmentId: string): Promise<any> {
    const { pool } = require('../db/pool');

    const result = await pool.query(
      `SELECT
        COUNT(*)::INTEGER as total_submissions,
        COUNT(*) FILTER (WHERE is_flagged = true)::INTEGER as flagged_submissions,
        COUNT(*) FILTER (WHERE plagiarism_status = 'plagiarized')::INTEGER as confirmed_plagiarism,
        COUNT(*) FILTER (WHERE plagiarism_status = 'suspicious')::INTEGER as suspicious_submissions,
        COUNT(*) FILTER (WHERE plagiarism_status = 'clean')::INTEGER as clean_submissions,
        AVG(similarity_score)::DECIMAL(5,4) as avg_similarity_score,
        MAX(similarity_score)::DECIMAL(5,4) as max_similarity_score
       FROM code_submissions
       WHERE assessment_id = $1`,
      [assessmentId]
    );

    const matchesResult = await pool.query(
      `SELECT COUNT(DISTINCT pm.id)::INTEGER as total_matches
       FROM plagiarism_matches pm
       JOIN code_submissions cs ON cs.id = pm.submission1_id
       WHERE cs.assessment_id = $1`,
      [assessmentId]
    );

    return {
      ...result.rows[0],
      total_matches: matchesResult.rows[0].total_matches,
      plagiarism_rate:
        result.rows[0].total_submissions > 0
          ? (
              (result.rows[0].confirmed_plagiarism / result.rows[0].total_submissions) *
              100
            ).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Calculate course-level plagiarism statistics
   */
  private async calculateCourseStats(courseId: string): Promise<any> {
    const { pool } = require('../db/pool');

    // Note: This requires joining with assessments table which should have course_id
    // For now, return placeholder
    return {
      message: 'Course-level stats require assessment-to-course mapping',
    };
  }
}

export const plagiarismController = new PlagiarismController();
