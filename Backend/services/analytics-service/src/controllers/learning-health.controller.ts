import { Request, Response } from 'express';
import { learningHealthService } from '../services/learning-health.service';

/**
 * Learning Health Dashboard Controller
 * Provides endpoints for health score visualization and at-risk learner detection
 */

export class LearningHealthController {
  /**
   * Get composite health score for a user
   * GET /api/learning-health/users/:userId/courses/:courseId/health-score
   */
  async getUserHealthScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;

      const healthData = await learningHealthService.calculateCompositeHealthScore(userId, courseId);

      res.json({
        success: true,
        data: healthData,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get user health score error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get health score',
      });
    }
  }

  /**
   * Get at-risk learners for a course
   * GET /api/learning-health/courses/:courseId/at-risk-learners
   */
  async getAtRiskLearners(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { riskLevel } = req.query;

      let learners = await learningHealthService.getAtRiskLearners(courseId);

      // Filter by risk level if specified
      if (riskLevel && typeof riskLevel === 'string') {
        learners = learners.filter(l => l.riskLevel === riskLevel);
      }

      res.json({
        success: true,
        data: learners,
        count: learners.length,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get at-risk learners error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get at-risk learners',
      });
    }
  }

  /**
   * Generate instructor nudge for a specific learner
   * GET /api/learning-health/users/:userId/courses/:courseId/instructor-nudge
   */
  async generateInstructorNudge(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;

      const nudge = await learningHealthService.generateInstructorNudge(userId, courseId);

      if (!nudge) {
        res.json({
          success: true,
          data: null,
          message: 'No intervention recommended for this learner',
        });
        return;
      }

      res.json({
        success: true,
        data: nudge,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Generate instructor nudge error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate instructor nudge',
      });
    }
  }

  /**
   * Update health score for a user
   * POST /api/learning-health/users/:userId/courses/:courseId/update-health-score
   */
  async updateHealthScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;

      await learningHealthService.updateUserHealthScore(userId, courseId);

      res.json({
        success: true,
        message: 'Health score updated successfully',
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Update health score error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update health score',
      });
    }
  }

  /**
   * Get dashboard summary for instructor
   * GET /api/learning-health/courses/:courseId/dashboard-summary
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const summary = await learningHealthService.getDashboardSummary(courseId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get dashboard summary error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dashboard summary',
      });
    }
  }

  /**
   * Batch update health scores for all learners in a course
   * POST /api/learning-health/courses/:courseId/batch-update
   */
  async batchUpdateHealthScores(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      // Get all enrolled users
      const { pool } = await import('../db/pool');
      const result = await pool.query(
        `SELECT DISTINCT user_id FROM user_learning_metrics WHERE course_id = $1`,
        [courseId]
      );

      const userIds = result.rows.map(row => row.user_id);

      // Update health scores in parallel (max 10 at a time)
      const batchSize = 10;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const promises = batch.map(userId =>
          learningHealthService.updateUserHealthScore(userId, courseId)
            .then(() => { updated++; })
            .catch((err) => {
              console.error(`Failed to update health score for user ${userId}:`, err);
              failed++;
            })
        );
        await Promise.all(promises);
      }

      res.json({
        success: true,
        data: {
          totalUsers: userIds.length,
          updated,
          failed,
        },
        message: `Updated ${updated} health scores successfully`,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Batch update health scores error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to batch update health scores',
      });
    }
  }

  /**
   * Get health score trends for a user
   * GET /api/learning-health/users/:userId/courses/:courseId/trends
   */
  async getHealthScoreTrends(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const { days } = req.query;

      const daysToFetch = parseInt(days as string) || 30;

      // For now, return current health score
      // In production, you'd store historical health scores in a separate table
      const currentHealth = await learningHealthService.calculateCompositeHealthScore(userId, courseId);

      res.json({
        success: true,
        data: {
          current: currentHealth,
          historical: [], // Would contain historical data points
          message: 'Historical trends coming soon',
        },
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get health score trends error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get health score trends',
      });
    }
  }

  /**
   * Get component breakdown for a user
   * GET /api/learning-health/users/:userId/courses/:courseId/component-breakdown
   */
  async getComponentBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;

      const healthData = await learningHealthService.calculateCompositeHealthScore(userId, courseId);

      // Extract just the components
      const breakdown = healthData.components.map(c => ({
        name: c.name,
        score: c.score,
        weight: c.weight,
        status: c.status,
        weightedScore: c.score * c.weight,
      }));

      res.json({
        success: true,
        data: {
          overallScore: healthData.overallScore,
          components: breakdown,
          riskLevel: healthData.riskLevel,
        },
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get component breakdown error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get component breakdown',
      });
    }
  }

  /**
   * Get intervention recommendations for course
   * GET /api/learning-health/courses/:courseId/interventions
   */
  async getInterventionRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const atRiskLearners = await learningHealthService.getAtRiskLearners(courseId);

      // Generate nudges for top at-risk learners
      const interventions = [];
      for (const learner of atRiskLearners.slice(0, 20)) {
        const nudge = await learningHealthService.generateInstructorNudge(learner.userId, courseId);
        if (nudge) {
          interventions.push(nudge);
        }
      }

      // Sort by priority
      interventions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      });

      res.json({
        success: true,
        data: interventions,
        count: interventions.length,
      });
    } catch (error: any) {
      console.error('[LearningHealthController] Get intervention recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get intervention recommendations',
      });
    }
  }
}

export const learningHealthController = new LearningHealthController();
