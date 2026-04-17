import { Request, Response } from 'express';
import { recommendationsService } from '../services/recommendations.service';

export class RecommendationsController {
  // ========================================
  // USER PREFERENCES
  // ========================================

  async getMyPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const preferences = await recommendationsService.getUserPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error: any) {
      console.error('[getMyPreferences] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get preferences' });
    }
  }

  async updateMyPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const preferences = await recommendationsService.updateUserPreferences({
        userId,
        ...req.body
      });

      res.json({ success: true, data: preferences });
    } catch (error: any) {
      console.error('[updateMyPreferences] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update preferences' });
    }
  }

  // ========================================
  // COURSE RECOMMENDATIONS
  // ========================================

  async getMyRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const recommendations = await recommendationsService.getUserCourseRecommendations(userId, limit);

      res.json({ success: true, data: recommendations });
    } catch (error: any) {
      console.error('[getMyRecommendations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get recommendations' });
    }
  }

  async generateMyRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const recommendations = await recommendationsService.generateCourseRecommendations(userId, limit);

      res.json({ success: true, data: recommendations });
    } catch (error: any) {
      console.error('[generateMyRecommendations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate recommendations' });
    }
  }

  async trackRecommendationInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const { interactionType } = req.body;

      if (!interactionType) {
        res.status(400).json({ success: false, message: 'interactionType is required' });
        return;
      }

      await recommendationsService.trackRecommendationInteraction(recommendationId, interactionType);
      res.json({ success: true, message: 'Interaction tracked' });
    } catch (error: any) {
      console.error('[trackRecommendationInteraction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to track interaction' });
    }
  }

  async dismissRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { recommendationId } = req.params;
      await recommendationsService.dismissRecommendation(recommendationId, userId);

      res.json({ success: true, message: 'Recommendation dismissed' });
    } catch (error: any) {
      console.error('[dismissRecommendation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to dismiss recommendation' });
    }
  }

  // ========================================
  // LEARNING PATH RECOMMENDATIONS
  // ========================================

  async getMyLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const paths = await recommendationsService.getUserLearningPathRecommendations(userId);
      res.json({ success: true, data: paths });
    } catch (error: any) {
      console.error('[getMyLearningPaths] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning paths' });
    }
  }

  async startLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { pathId } = req.params;
      const path = await recommendationsService.startLearningPath(pathId, userId);

      res.json({ success: true, data: path });
    } catch (error: any) {
      console.error('[startLearningPath] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start learning path' });
    }
  }

  // ========================================
  // SKILL GAP ANALYSIS
  // ========================================

  async analyzeMySkillGap(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetRole, targetSkillLevel } = req.body;

      if (!targetRole) {
        res.status(400).json({ success: false, message: 'targetRole is required' });
        return;
      }

      const analysis = await recommendationsService.analyzeSkillGap({
        userId,
        targetRole,
        targetSkillLevel
      });

      res.json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[analyzeMySkillGap] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to analyze skill gap' });
    }
  }

  async getMySkillGapAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const targetRole = req.query.targetRole as string;
      const analysis = await recommendationsService.getSkillGapAnalysis(userId, targetRole);

      res.json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[getMySkillGapAnalysis] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get skill gap analysis' });
    }
  }

  // ========================================
  // USER SIMILARITY
  // ========================================

  async getSimilarUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const similarUsers = await recommendationsService.getSimilarUsers(userId, limit);

      res.json({ success: true, data: similarUsers });
    } catch (error: any) {
      console.error('[getSimilarUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get similar users' });
    }
  }

  async getCoursesFromSimilarUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const courses = await recommendationsService.getCoursesFromSimilarUsers(userId, limit);

      res.json({ success: true, data: courses });
    } catch (error: any) {
      console.error('[getCoursesFromSimilarUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get courses' });
    }
  }

  // ========================================
  // COURSE SIMILARITY
  // ========================================

  async getSimilarCourses(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const courses = await recommendationsService.getSimilarCourses(courseId, limit);
      res.json({ success: true, data: courses });
    } catch (error: any) {
      console.error('[getSimilarCourses] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get similar courses' });
    }
  }

  // ========================================
  // RECOMMENDATION FEEDBACK
  // ========================================

  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        recommendationId,
        recommendationType,
        feedbackType,
        feedbackRating,
        feedbackText
      } = req.body;

      if (!recommendationId || !recommendationType || !feedbackType) {
        res.status(400).json({
          success: false,
          message: 'recommendationId, recommendationType, and feedbackType are required'
        });
        return;
      }

      const feedback = await recommendationsService.submitRecommendationFeedback({
        userId,
        recommendationId,
        recommendationType,
        feedbackType,
        feedbackRating,
        feedbackText
      });

      res.json({ success: true, data: feedback });
    } catch (error: any) {
      console.error('[submitFeedback] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to submit feedback' });
    }
  }

  async getRecommendationEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const effectiveness = await recommendationsService.getRecommendationEffectiveness();
      res.json({ success: true, data: effectiveness });
    } catch (error: any) {
      console.error('[getRecommendationEffectiveness] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get effectiveness' });
    }
  }

  // ========================================
  // TRENDING COURSES
  // ========================================

  async getTrendingCourses(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const category = req.query.category as string;

      const courses = await recommendationsService.getTrendingCourses(limit, category);
      res.json({ success: true, data: courses });
    } catch (error: any) {
      console.error('[getTrendingCourses] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get trending courses' });
    }
  }

  // ========================================
  // NEXT BEST ACTIONS
  // ========================================

  async getMyNextBestActions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const actions = await recommendationsService.getUserNextBestActions(userId, limit);

      res.json({ success: true, data: actions });
    } catch (error: any) {
      console.error('[getMyNextBestActions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get next best actions' });
    }
  }

  async completeAction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { actionId } = req.params;
      await recommendationsService.completeNextBestAction(actionId, userId);

      res.json({ success: true, message: 'Action completed' });
    } catch (error: any) {
      console.error('[completeAction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to complete action' });
    }
  }

  async dismissAction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { actionId } = req.params;
      await recommendationsService.dismissNextBestAction(actionId, userId);

      res.json({ success: true, message: 'Action dismissed' });
    } catch (error: any) {
      console.error('[dismissAction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to dismiss action' });
    }
  }

  // ========================================
  // COMPREHENSIVE RECOMMENDATIONS
  // ========================================

  async getMyComprehensiveRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const recommendations = await recommendationsService.getComprehensiveRecommendations(userId);
      res.json({ success: true, data: recommendations });
    } catch (error: any) {
      console.error('[getMyComprehensiveRecommendations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get comprehensive recommendations' });
    }
  }

  // ========================================
  // PERFORMANCE
  // ========================================

  async getRecommendationPerformance(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const performance = await recommendationsService.getRecommendationPerformance(days);

      res.json({ success: true, data: performance });
    } catch (error: any) {
      console.error('[getRecommendationPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get performance' });
    }
  }
}

export const recommendationsController = new RecommendationsController();
