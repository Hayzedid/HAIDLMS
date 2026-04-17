import { Request, Response } from 'express';
import { careerOutcomeService } from '../services/career-outcome.service';

export class CareerOutcomeController {
  // ========================================
  // CAREER OUTCOMES
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes:
   *   post:
   *     summary: Report a career outcome
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - outcomeType
   *               - outcomeDate
   *             properties:
   *               courseId:
   *                 type: string
   *               outcomeType:
   *                 type: string
   *                 enum: [hired, promoted, role_change, salary_increase, started_business, other]
   *               newJobTitle:
   *                 type: string
   *               newCompany:
   *                 type: string
   *               outcomeDate:
   *                 type: string
   *                 format: date
   *     responses:
   *       201:
   *         description: Outcome reported successfully
   */
  async createOutcome(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const outcomeData = {
        ...req.body,
        userId,
      };

      const outcome = await careerOutcomeService.createOutcome(outcomeData);

      res.status(201).json({
        success: true,
        data: outcome,
        message: 'Career outcome reported successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create outcome',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/{id}:
   *   get:
   *     summary: Get outcome by ID
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Outcome retrieved successfully
   */
  async getOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const outcome = await careerOutcomeService.getOutcome(id);

      res.status(200).json({
        success: true,
        data: outcome,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Outcome not found',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/user/{userId}:
   *   get:
   *     summary: Get all outcomes for a user
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Outcomes retrieved successfully
   */
  async getUserOutcomes(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requestingUserId = (req as any).user.id;

      // Users can only view their own outcomes unless they're admin/HR
      if (userId !== requestingUserId && !['admin', 'hr_manager'].includes((req as any).user.role)) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view these outcomes',
        });
        return;
      }

      const outcomes = await careerOutcomeService.getUserOutcomes(userId);

      res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get outcomes',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/my-outcomes:
   *   get:
   *     summary: Get current user's outcomes
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Outcomes retrieved successfully
   */
  async getMyOutcomes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const outcomes = await careerOutcomeService.getUserOutcomes(userId);

      res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get outcomes',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/{id}:
   *   put:
   *     summary: Update an outcome
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Outcome updated successfully
   */
  async updateOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const outcome = await careerOutcomeService.updateOutcome(id, userId, updates);

      res.status(200).json({
        success: true,
        data: outcome,
        message: 'Outcome updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update outcome',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/{id}:
   *   delete:
   *     summary: Delete an outcome
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Outcome deleted successfully
   */
  async deleteOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await careerOutcomeService.deleteOutcome(id, userId);

      res.status(200).json({
        success: true,
        message: 'Outcome deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete outcome',
      });
    }
  }

  // ========================================
  // ADMIN/HR: OUTCOME VERIFICATION
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes/{id}/verify:
   *   post:
   *     summary: Verify an outcome (Admin/HR only)
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - verificationMethod
   *             properties:
   *               verificationMethod:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Outcome verified successfully
   */
  async verifyOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const verifierId = (req as any).user.id;
      const { verificationMethod, notes } = req.body;

      const outcome = await careerOutcomeService.verifyOutcome(
        id,
        verifierId,
        verificationMethod,
        notes
      );

      res.status(200).json({
        success: true,
        data: outcome,
        message: 'Outcome verified successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify outcome',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/{id}/reject:
   *   post:
   *     summary: Reject an outcome (Admin/HR only)
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Outcome rejected successfully
   */
  async rejectOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const verifierId = (req as any).user.id;
      const { reason } = req.body;

      const outcome = await careerOutcomeService.rejectOutcome(id, verifierId, reason);

      res.status(200).json({
        success: true,
        data: outcome,
        message: 'Outcome rejected',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject outcome',
      });
    }
  }

  // ========================================
  // PUBLIC: OUTCOME STATISTICS
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes/course/{courseId}/stats:
   *   get:
   *     summary: Get outcome statistics for a course
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getCourseStats(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const [stats, outcomes] = await Promise.all([
        careerOutcomeService.getCourseOutcomeStats(courseId),
        careerOutcomeService.getCourseOutcomes(courseId, true),
      ]);

      res.status(200).json({
        success: true,
        data: {
          stats,
          recentOutcomes: outcomes.slice(0, 10),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get stats',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/recent:
   *   get:
   *     summary: Get recent verified outcomes
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Recent outcomes retrieved successfully
   */
  async getRecentOutcomes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const outcomes = await careerOutcomeService.getRecentVerifiedOutcomes(limit);

      res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get outcomes',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/by-type/{type}:
   *   get:
   *     summary: Get outcomes by type
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Outcomes retrieved successfully
   */
  async getOutcomesByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const outcomes = await careerOutcomeService.getOutcomesByType(type, limit);

      res.status(200).json({
        success: true,
        data: outcomes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get outcomes',
      });
    }
  }

  // ========================================
  // JOB BOARD
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes/jobs:
   *   get:
   *     summary: Get job postings
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: query
   *         name: skills
   *         schema:
   *           type: string
   *       - in: query
   *         name: experienceLevel
   *         schema:
   *           type: string
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *       - in: query
   *         name: remoteOnly
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Job postings retrieved successfully
   */
  async getJobPostings(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        experienceLevel: req.query.experienceLevel as string,
        location: req.query.location as string,
        remoteOnly: req.query.remoteOnly === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const jobs = await careerOutcomeService.getJobPostings(filters);

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get job postings',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/jobs/{id}:
   *   get:
   *     summary: Get job posting by ID
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Job posting retrieved successfully
   */
  async getJobPosting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const job = await careerOutcomeService.getJobPosting(id);

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Job posting not found',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/jobs/recommended:
   *   get:
   *     summary: Get recommended jobs based on user's skills
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Recommended jobs retrieved successfully
   */
  async getRecommendedJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const jobs = await careerOutcomeService.getRecommendedJobs(userId, limit);

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recommended jobs',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/jobs/{id}/apply:
   *   post:
   *     summary: Apply to a job posting
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               matchedSkills:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Application submitted successfully
   */
  async applyToJob(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { matchedSkills } = req.body;

      const application = await careerOutcomeService.applyToJob(
        userId,
        id,
        matchedSkills || []
      );

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application submitted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to apply to job',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/my-applications:
   *   get:
   *     summary: Get current user's job applications
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Applications retrieved successfully
   */
  async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const applications = await careerOutcomeService.getUserApplications(userId);

      res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get applications',
      });
    }
  }

  // ========================================
  // ORGANIZATION ROI (HR/Admin only)
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes/roi/calculate:
   *   post:
   *     summary: Calculate organization ROI for a period
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - organizationId
   *               - startDate
   *               - endDate
   *             properties:
   *               organizationId:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *     responses:
   *       200:
   *         description: ROI calculated successfully
   */
  async calculateROI(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, startDate, endDate } = req.body;

      const roi = await careerOutcomeService.calculateOrganizationROI(
        organizationId,
        new Date(startDate),
        new Date(endDate)
      );

      res.status(200).json({
        success: true,
        data: roi,
        message: 'ROI calculated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate ROI',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/roi/{organizationId}/history:
   *   get:
   *     summary: Get organization ROI history
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: ROI history retrieved successfully
   */
  async getROIHistory(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;

      const history = await careerOutcomeService.getOrganizationROIHistory(organizationId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get ROI history',
      });
    }
  }

  /**
   * @swagger
   * /api/career-outcomes/roi/{id}:
   *   put:
   *     summary: Update organization ROI metrics
   *     tags: [Career Outcomes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: ROI updated successfully
   */
  async updateROI(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const roi = await careerOutcomeService.updateOrganizationROI(id, updates);

      res.status(200).json({
        success: true,
        data: roi,
        message: 'ROI updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update ROI',
      });
    }
  }

  // ========================================
  // SALARY BENCHMARKS
  // ========================================

  /**
   * @swagger
   * /api/career-outcomes/salary-benchmark:
   *   get:
   *     summary: Get salary benchmark
   *     tags: [Career Outcomes]
   *     parameters:
   *       - in: query
   *         name: jobTitle
   *         schema:
   *           type: string
   *       - in: query
   *         name: jobLevel
   *         schema:
   *           type: string
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Salary benchmark retrieved successfully
   */
  async getSalaryBenchmark(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        jobTitle: req.query.jobTitle as string,
        jobLevel: req.query.jobLevel as string,
        industry: req.query.industry as string,
        location: req.query.location as string,
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
      };

      const benchmark = await careerOutcomeService.getSalaryBenchmark(filters);

      if (!benchmark) {
        res.status(404).json({
          success: false,
          message: 'No salary benchmark found for the given criteria',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: benchmark,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get salary benchmark',
      });
    }
  }
}

export const careerOutcomeController = new CareerOutcomeController();
