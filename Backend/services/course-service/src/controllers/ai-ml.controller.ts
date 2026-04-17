import { Request, Response } from 'express';
import { aimlService } from '../services/ai-ml.service';

export class AIMLController {
  // ========================================
  // ML MODEL MANAGEMENT
  // ========================================

  async createMLModel(req: Request, res: Response): Promise<void> {
    try {
      const trainedBy = (req as any).user?.userId;
      const model = await aimlService.createMLModel({
        ...req.body,
        trainedBy
      });

      res.status(201).json({ success: true, data: model });
    } catch (error: any) {
      console.error('[createMLModel] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create ML model' });
    }
  }

  async getMLModel(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const model = await aimlService.getMLModel(modelId);

      if (!model) {
        res.status(404).json({ success: false, message: 'Model not found' });
        return;
      }

      res.json({ success: true, data: model });
    } catch (error: any) {
      console.error('[getMLModel] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get ML model' });
    }
  }

  async listMLModels(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        modelType: req.query.modelType as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const models = await aimlService.listMLModels(filters);
      res.json({ success: true, data: models });
    } catch (error: any) {
      console.error('[listMLModels] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list ML models' });
    }
  }

  async updateMLModelStatus(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const { status, metrics } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'Status is required' });
        return;
      }

      const model = await aimlService.updateMLModelStatus(modelId, status, metrics);
      res.json({ success: true, data: model });
    } catch (error: any) {
      console.error('[updateMLModelStatus] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update model status' });
    }
  }

  async deployMLModel(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const { modelPath, artifactUrl } = req.body;

      if (!modelPath) {
        res.status(400).json({ success: false, message: 'Model path is required' });
        return;
      }

      const model = await aimlService.deployMLModel(modelId, modelPath, artifactUrl);
      res.json({ success: true, data: model });
    } catch (error: any) {
      console.error('[deployMLModel] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to deploy model' });
    }
  }

  async getActiveMLModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await aimlService.getActiveMLModels();
      res.json({ success: true, data: models });
    } catch (error: any) {
      console.error('[getActiveMLModels] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active models' });
    }
  }

  // ========================================
  // AI RECOMMENDATIONS
  // ========================================

  async createRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const recommendation = await aimlService.createRecommendation(req.body);
      res.status(201).json({ success: true, data: recommendation });
    } catch (error: any) {
      console.error('[createRecommendation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create recommendation' });
    }
  }

  async getMyRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const recommendationType = req.query.type as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const recommendations = await aimlService.getUserRecommendations(
        userId,
        recommendationType,
        limit
      );

      res.json({ success: true, data: recommendations });
    } catch (error: any) {
      console.error('[getMyRecommendations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get recommendations' });
    }
  }

  async recordRecommendationClick(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      await aimlService.recordRecommendationClick(recommendationId);

      res.json({ success: true, message: 'Click recorded' });
    } catch (error: any) {
      console.error('[recordRecommendationClick] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record click' });
    }
  }

  async recordRecommendationConversion(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      const { conversionValue } = req.body;

      await aimlService.recordRecommendationConversion(recommendationId, conversionValue);
      res.json({ success: true, message: 'Conversion recorded' });
    } catch (error: any) {
      console.error('[recordRecommendationConversion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record conversion' });
    }
  }

  async dismissRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;
      await aimlService.dismissRecommendation(recommendationId);

      res.json({ success: true, message: 'Recommendation dismissed' });
    } catch (error: any) {
      console.error('[dismissRecommendation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to dismiss recommendation' });
    }
  }

  async recordRecommendationFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { recommendationId } = req.params;
      const { feedbackType, rating, feedbackText } = req.body;

      if (!feedbackType) {
        res.status(400).json({ success: false, message: 'Feedback type is required' });
        return;
      }

      const feedbackId = await aimlService.recordRecommendationFeedback(
        recommendationId,
        userId,
        feedbackType,
        rating,
        feedbackText
      );

      res.json({ success: true, data: { feedbackId } });
    } catch (error: any) {
      console.error('[recordRecommendationFeedback] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record feedback' });
    }
  }

  async getRecommendationPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performance = await aimlService.getRecommendationPerformance();
      res.json({ success: true, data: performance });
    } catch (error: any) {
      console.error('[getRecommendationPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get performance metrics' });
    }
  }

  // ========================================
  // CONTENT ANALYSIS
  // ========================================

  async analyzeContent(req: Request, res: Response): Promise<void> {
    try {
      const analysis = await aimlService.analyzeContent(req.body);
      res.status(201).json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[analyzeContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to analyze content' });
    }
  }

  async getContentAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const analysis = await aimlService.getContentAnalysis(contentType, contentId);

      if (!analysis) {
        res.status(404).json({ success: false, message: 'Analysis not found' });
        return;
      }

      res.json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[getContentAnalysis] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get content analysis' });
    }
  }

  async needsContentAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const maxAgeDays = req.query.maxAgeDays
        ? parseInt(req.query.maxAgeDays as string, 10)
        : 30;

      const needsAnalysis = await aimlService.needsContentAnalysis(
        contentType,
        contentId,
        maxAgeDays
      );

      res.json({ success: true, data: { needsAnalysis } });
    } catch (error: any) {
      console.error('[needsContentAnalysis] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check analysis status' });
    }
  }

  async getContentQualitySummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await aimlService.getContentQualitySummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getContentQualitySummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get quality summary' });
    }
  }

  async getContentByQuality(req: Request, res: Response): Promise<void> {
    try {
      const { qualityStatus } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const content = await aimlService.getContentByQuality(qualityStatus, limit);
      res.json({ success: true, data: content });
    } catch (error: any) {
      console.error('[getContentByQuality] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get content by quality' });
    }
  }

  // ========================================
  // LEARNING PATH OPTIMIZATION
  // ========================================

  async createOptimizedPath(req: Request, res: Response): Promise<void> {
    try {
      const path = await aimlService.createOptimizedPath(req.body);
      res.status(201).json({ success: true, data: path });
    } catch (error: any) {
      console.error('[createOptimizedPath] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create optimized path' });
    }
  }

  async getMyLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const activeOnly = req.query.activeOnly !== 'false';
      const paths = await aimlService.getUserLearningPaths(userId, activeOnly);

      res.json({ success: true, data: paths });
    } catch (error: any) {
      console.error('[getMyLearningPaths] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning paths' });
    }
  }

  async acceptLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { pathId } = req.params;
      const path = await aimlService.acceptLearningPath(pathId);

      res.json({ success: true, data: path });
    } catch (error: any) {
      console.error('[acceptLearningPath] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to accept learning path' });
    }
  }

  async updatePathProgress(req: Request, res: Response): Promise<void> {
    try {
      const { pathId } = req.params;
      const { progressPercentage } = req.body;

      if (progressPercentage === undefined) {
        res.status(400).json({ success: false, message: 'Progress percentage is required' });
        return;
      }

      const path = await aimlService.updatePathProgress(pathId, progressPercentage);
      res.json({ success: true, data: path });
    } catch (error: any) {
      console.error('[updatePathProgress] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update path progress' });
    }
  }

  // ========================================
  // SKILL GAP ANALYSIS
  // ========================================

  async createSkillGapAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const analysis = await aimlService.createSkillGapAnalysis(req.body);
      res.status(201).json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[createSkillGapAnalysis] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create skill gap analysis' });
    }
  }

  async getMySkillGaps(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const gaps = await aimlService.getUserSkillGaps(userId, limit);

      res.json({ success: true, data: gaps });
    } catch (error: any) {
      console.error('[getMySkillGaps] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get skill gaps' });
    }
  }

  async getSkillGapsByRole(req: Request, res: Response): Promise<void> {
    try {
      const { targetRole } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const gaps = await aimlService.getSkillGapsByRole(targetRole, limit);
      res.json({ success: true, data: gaps });
    } catch (error: any) {
      console.error('[getSkillGapsByRole] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get skill gaps by role' });
    }
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  async createPrediction(req: Request, res: Response): Promise<void> {
    try {
      const prediction = await aimlService.createPrediction(req.body);
      res.status(201).json({ success: true, data: prediction });
    } catch (error: any) {
      console.error('[createPrediction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create prediction' });
    }
  }

  async getMyPredictions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const predictionType = req.query.type as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const predictions = await aimlService.getUserPredictions(userId, predictionType, limit);
      res.json({ success: true, data: predictions });
    } catch (error: any) {
      console.error('[getMyPredictions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get predictions' });
    }
  }

  async getAtRiskUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await aimlService.getAtRiskUsers();
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[getAtRiskUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get at-risk users' });
    }
  }

  async recordActualOutcome(req: Request, res: Response): Promise<void> {
    try {
      const { predictionId } = req.params;
      const { actualValue, actualCategory } = req.body;

      await aimlService.recordActualOutcome(predictionId, actualValue, actualCategory);
      res.json({ success: true, message: 'Actual outcome recorded' });
    } catch (error: any) {
      console.error('[recordActualOutcome] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record outcome' });
    }
  }

  async cleanupExpiredPredictions(req: Request, res: Response): Promise<void> {
    try {
      const count = await aimlService.cleanupExpiredPredictions();
      res.json({ success: true, data: { cleanedCount: count } });
    } catch (error: any) {
      console.error('[cleanupExpiredPredictions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to cleanup predictions' });
    }
  }

  // ========================================
  // TRAINING DATA
  // ========================================

  async addTrainingData(req: Request, res: Response): Promise<void> {
    try {
      const data = await aimlService.addTrainingData(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('[addTrainingData] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to add training data' });
    }
  }

  async getTrainingData(req: Request, res: Response): Promise<void> {
    try {
      const modelType = req.query.modelType as string;
      const validated = req.query.validated === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;

      if (!modelType) {
        res.status(400).json({ success: false, message: 'Model type is required' });
        return;
      }

      const data = await aimlService.getTrainingData(modelType, validated, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[getTrainingData] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get training data' });
    }
  }

  async validateTrainingData(req: Request, res: Response): Promise<void> {
    try {
      const validatedBy = (req as any).user?.userId;
      if (!validatedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { dataId } = req.params;
      const { validationScore } = req.body;

      if (validationScore === undefined) {
        res.status(400).json({ success: false, message: 'Validation score is required' });
        return;
      }

      await aimlService.validateTrainingData(dataId, validatedBy, validationScore);
      res.json({ success: true, message: 'Training data validated' });
    } catch (error: any) {
      console.error('[validateTrainingData] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to validate training data' });
    }
  }

  // ========================================
  // MODEL PERFORMANCE
  // ========================================

  async logModelPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, periodStart, periodEnd, metrics } = req.body;

      if (!modelId || !periodStart || !periodEnd || !metrics) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const log = await aimlService.logModelPerformance(
        modelId,
        new Date(periodStart),
        new Date(periodEnd),
        metrics
      );

      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      console.error('[logModelPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to log performance' });
    }
  }

  async getModelPerformanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await aimlService.getModelPerformanceSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getModelPerformanceSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get performance summary' });
    }
  }

  async calculateRecommendationEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const effectiveness = await aimlService.calculateRecommendationEffectiveness(modelId, days);
      res.json({ success: true, data: effectiveness });
    } catch (error: any) {
      console.error('[calculateRecommendationEffectiveness] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to calculate effectiveness' });
    }
  }

  // ========================================
  // FEATURE IMPORTANCE
  // ========================================

  async recordFeatureImportance(req: Request, res: Response): Promise<void> {
    try {
      const { modelId, featureName, importanceScore, rank, featureCategory } = req.body;

      if (!modelId || !featureName || importanceScore === undefined || rank === undefined) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const feature = await aimlService.recordFeatureImportance(
        modelId,
        featureName,
        importanceScore,
        rank,
        featureCategory
      );

      res.status(201).json({ success: true, data: feature });
    } catch (error: any) {
      console.error('[recordFeatureImportance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record feature importance' });
    }
  }

  async getFeatureImportance(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const features = await aimlService.getFeatureImportance(modelId);

      res.json({ success: true, data: features });
    } catch (error: any) {
      console.error('[getFeatureImportance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get feature importance' });
    }
  }

  // ========================================
  // AI INSIGHTS
  // ========================================

  async createAIInsight(req: Request, res: Response): Promise<void> {
    try {
      const insight = await aimlService.createAIInsight(req.body);
      res.status(201).json({ success: true, data: insight });
    } catch (error: any) {
      console.error('[createAIInsight] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create insight' });
    }
  }

  async getAIInsights(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        scopeType: req.query.scopeType as string,
        scopeId: req.query.scopeId as string,
        status: req.query.status as string,
        priority: req.query.priority ? parseInt(req.query.priority as string, 10) : undefined,
        targetAudience: req.query.targetAudience as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const insights = await aimlService.getAIInsights(filters);
      res.json({ success: true, data: insights });
    } catch (error: any) {
      console.error('[getAIInsights] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get insights' });
    }
  }

  async actOnInsight(req: Request, res: Response): Promise<void> {
    try {
      const actedBy = (req as any).user?.userId;
      if (!actedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { insightId } = req.params;
      const { actionTaken, actionOutcome } = req.body;

      if (!actionTaken) {
        res.status(400).json({ success: false, message: 'Action taken is required' });
        return;
      }

      const insight = await aimlService.actOnInsight(insightId, actedBy, actionTaken, actionOutcome);
      res.json({ success: true, data: insight });
    } catch (error: any) {
      console.error('[actOnInsight] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to act on insight' });
    }
  }

  async dismissInsight(req: Request, res: Response): Promise<void> {
    try {
      const { insightId } = req.params;
      await aimlService.dismissInsight(insightId);

      res.json({ success: true, message: 'Insight dismissed' });
    } catch (error: any) {
      console.error('[dismissInsight] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to dismiss insight' });
    }
  }
}

export const aimlController = new AIMLController();
