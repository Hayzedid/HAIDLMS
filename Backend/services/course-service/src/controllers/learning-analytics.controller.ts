import { Request, Response } from 'express';
import { learningAnalyticsService } from '../services/learning-analytics.service';

export class LearningAnalyticsController {
  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { deviceType, browser, platform, ipAddress } = req.body;

      const session = await learningAnalyticsService.startSession({
        userId,
        deviceType,
        browser,
        platform,
        ipAddress: ipAddress || req.ip
      });

      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[startSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start session' });
    }
  }

  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      await learningAnalyticsService.endSession(sessionId);

      res.json({ success: true, message: 'Session ended' });
    } catch (error: any) {
      console.error('[endSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to end session' });
    }
  }

  async logActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { sessionId, activityAction, contentType, contentId, contentTitle, metadata } = req.body;

      if (!sessionId || !activityAction || !contentType || !contentId) {
        res.status(400).json({
          success: false,
          message: 'sessionId, activityAction, contentType, and contentId are required'
        });
        return;
      }

      const activity = await learningAnalyticsService.logActivity({
        sessionId,
        userId,
        activityAction,
        contentType,
        contentId,
        contentTitle,
        metadata
      });

      res.json({ success: true, data: activity });
    } catch (error: any) {
      console.error('[logActivity] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to log activity' });
    }
  }

  async getSessionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await learningAnalyticsService.getSessionDetails(sessionId);

      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[getSessionDetails] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get session details' });
    }
  }

  async getMySessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const sessions = await learningAnalyticsService.getUserSessions(userId, limit);

      res.json({ success: true, data: sessions });
    } catch (error: any) {
      console.error('[getMySessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get sessions' });
    }
  }

  // ========================================
  // LEARNING METRICS
  // ========================================

  async getMyLearningMetrics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const metrics = await learningAnalyticsService.getLearningMetrics(userId, days);

      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getMyLearningMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning metrics' });
    }
  }

  async getMyLearningSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const summary = await learningAnalyticsService.getUserLearningSummary(userId);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getMyLearningSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning summary' });
    }
  }

  async getActiveLearners(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const learners = await learningAnalyticsService.getActiveLearners(days, limit);

      res.json({ success: true, data: learners });
    } catch (error: any) {
      console.error('[getActiveLearners] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active learners' });
    }
  }

  async getTopPerformers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const performers = await learningAnalyticsService.getTopPerformingLearners(limit);

      res.json({ success: true, data: performers });
    } catch (error: any) {
      console.error('[getTopPerformers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get top performers' });
    }
  }

  // ========================================
  // CONTENT INTERACTIONS
  // ========================================

  async updateContentInteraction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { contentType, contentId, timeSpentSeconds, completed, score, success } = req.body;

      if (!contentType || !contentId) {
        res.status(400).json({ success: false, message: 'contentType and contentId are required' });
        return;
      }

      await learningAnalyticsService.updateContentInteraction({
        userId,
        contentType,
        contentId,
        timeSpentSeconds,
        completed,
        score,
        success
      });

      res.json({ success: true, message: 'Content interaction updated' });
    } catch (error: any) {
      console.error('[updateContentInteraction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update content interaction' });
    }
  }

  async getContentInteraction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { contentType, contentId } = req.params;
      const interaction = await learningAnalyticsService.getContentInteraction(userId, contentType, contentId);

      res.json({ success: true, data: interaction });
    } catch (error: any) {
      console.error('[getContentInteraction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get content interaction' });
    }
  }

  async getMyContentInteractions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const interactions = await learningAnalyticsService.getUserContentInteractions(userId, limit);

      res.json({ success: true, data: interactions });
    } catch (error: any) {
      console.error('[getMyContentInteractions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get content interactions' });
    }
  }

  // ========================================
  // SKILL MASTERY
  // ========================================

  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      const { skillName, skillCategory, description, parentSkillId } = req.body;

      if (!skillName) {
        res.status(400).json({ success: false, message: 'skillName is required' });
        return;
      }

      const skill = await learningAnalyticsService.createSkill({
        skillName,
        skillCategory,
        description,
        parentSkillId
      });

      res.json({ success: true, data: skill });
    } catch (error: any) {
      console.error('[createSkill] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create skill' });
    }
  }

  async listSkills(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const skills = await learningAnalyticsService.listSkills(category);

      res.json({ success: true, data: skills });
    } catch (error: any) {
      console.error('[listSkills] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list skills' });
    }
  }

  async updateSkillMastery(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { skillId, success, confidenceDelta } = req.body;

      if (!skillId || success === undefined) {
        res.status(400).json({ success: false, message: 'skillId and success are required' });
        return;
      }

      await learningAnalyticsService.updateSkillMastery({
        userId,
        skillId,
        success,
        confidenceDelta
      });

      res.json({ success: true, message: 'Skill mastery updated' });
    } catch (error: any) {
      console.error('[updateSkillMastery] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update skill mastery' });
    }
  }

  async getMySkillMastery(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const skills = await learningAnalyticsService.getUserSkillMastery(userId);
      res.json({ success: true, data: skills });
    } catch (error: any) {
      console.error('[getMySkillMastery] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get skill mastery' });
    }
  }

  // ========================================
  // LEARNING VELOCITY
  // ========================================

  async getMyLearningVelocity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 12;
      const velocity = await learningAnalyticsService.getLearningVelocity(userId, weeks);

      res.json({ success: true, data: velocity });
    } catch (error: any) {
      console.error('[getMyLearningVelocity] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning velocity' });
    }
  }

  // ========================================
  // PERFORMANCE TRENDS
  // ========================================

  async getMyPerformanceTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const courseId = req.query.courseId as string;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const trends = await learningAnalyticsService.getPerformanceTrends(userId, courseId, days);
      res.json({ success: true, data: trends });
    } catch (error: any) {
      console.error('[getMyPerformanceTrends] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get performance trends' });
    }
  }

  // ========================================
  // LEARNING GOALS
  // ========================================

  async createLearningGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        goalTitle,
        goalDescription,
        goalType,
        targetValue,
        targetUnit,
        targetDate,
        reminderEnabled,
        reminderFrequency
      } = req.body;

      if (!goalTitle || !goalType || targetValue === undefined || !targetUnit) {
        res.status(400).json({
          success: false,
          message: 'goalTitle, goalType, targetValue, and targetUnit are required'
        });
        return;
      }

      const goal = await learningAnalyticsService.createLearningGoal({
        userId,
        goalTitle,
        goalDescription,
        goalType,
        targetValue,
        targetUnit,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        reminderEnabled,
        reminderFrequency
      });

      res.json({ success: true, data: goal });
    } catch (error: any) {
      console.error('[createLearningGoal] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create learning goal' });
    }
  }

  async updateLearningGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { goalId } = req.params;
      const { currentValue, isAchieved, goalTitle, targetDate } = req.body;

      const goal = await learningAnalyticsService.updateLearningGoal({
        goalId,
        userId,
        currentValue,
        isAchieved,
        goalTitle,
        targetDate: targetDate ? new Date(targetDate) : undefined
      });

      res.json({ success: true, data: goal });
    } catch (error: any) {
      console.error('[updateLearningGoal] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update learning goal' });
    }
  }

  async getMyLearningGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const includeAchieved = req.query.includeAchieved === 'true';
      const goals = await learningAnalyticsService.getUserLearningGoals(userId, includeAchieved);

      res.json({ success: true, data: goals });
    } catch (error: any) {
      console.error('[getMyLearningGoals] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning goals' });
    }
  }

  async deleteLearningGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { goalId } = req.params;
      await learningAnalyticsService.deleteLearningGoal(goalId, userId);

      res.json({ success: true, message: 'Learning goal deleted' });
    } catch (error: any) {
      console.error('[deleteLearningGoal] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete learning goal' });
    }
  }

  // ========================================
  // TIME TRACKING
  // ========================================

  async startTimeTracking(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { contentType, contentId } = req.body;

      if (!contentType || !contentId) {
        res.status(400).json({ success: false, message: 'contentType and contentId are required' });
        return;
      }

      const tracking = await learningAnalyticsService.startTimeTracking(userId, contentType, contentId);
      res.json({ success: true, data: tracking });
    } catch (error: any) {
      console.error('[startTimeTracking] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start time tracking' });
    }
  }

  async endTimeTracking(req: Request, res: Response): Promise<void> {
    try {
      const { trackingId } = req.params;
      const { completionPercentage } = req.body;

      await learningAnalyticsService.endTimeTracking(trackingId, completionPercentage);
      res.json({ success: true, message: 'Time tracking ended' });
    } catch (error: any) {
      console.error('[endTimeTracking] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to end time tracking' });
    }
  }

  async getMyTimeTracking(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const contentType = req.query.contentType as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const tracking = await learningAnalyticsService.getUserTimeTracking(userId, contentType, limit);
      res.json({ success: true, data: tracking });
    } catch (error: any) {
      console.error('[getMyTimeTracking] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get time tracking' });
    }
  }

  // ========================================
  // LEARNING PATTERNS
  // ========================================

  async analyzeMyLearningPatterns(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const patterns = await learningAnalyticsService.analyzeLearningPatterns(userId);
      res.json({ success: true, data: patterns });
    } catch (error: any) {
      console.error('[analyzeMyLearningPatterns] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to analyze learning patterns' });
    }
  }

  async getMyLearningPatterns(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const patterns = await learningAnalyticsService.getLearningPatterns(userId);
      res.json({ success: true, data: patterns });
    } catch (error: any) {
      console.error('[getMyLearningPatterns] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get learning patterns' });
    }
  }

  // ========================================
  // COMPREHENSIVE ANALYTICS
  // ========================================

  async getMyComprehensiveAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const analytics = await learningAnalyticsService.getComprehensiveUserAnalytics(userId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getMyComprehensiveAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get comprehensive analytics' });
    }
  }
}

export const learningAnalyticsController = new LearningAnalyticsController();
