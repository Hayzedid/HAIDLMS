import { Request, Response } from 'express';
import { gamificationService } from '../services/gamification.service';

export class GamificationController {
  // ========================================
  // POINTS & XP
  // ========================================

  async getMyPoints(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const points = await gamificationService.getUserPoints(userId);
      res.json({ success: true, data: points });
    } catch (error: any) {
      console.error('[getMyPoints] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user points' });
    }
  }

  async getPointTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await gamificationService.getPointTransactions(userId, limit, offset);
      res.json({ success: true, data: result.transactions, total: result.total });
    } catch (error: any) {
      console.error('[getPointTransactions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get point transactions' });
    }
  }

  async getLevels(req: Request, res: Response): Promise<void> {
    try {
      const levels = await gamificationService.getLevelDefinitions();
      res.json({ success: true, data: levels });
    } catch (error: any) {
      console.error('[getLevels] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get levels' });
    }
  }

  // ========================================
  // ACHIEVEMENTS
  // ========================================

  async listAchievements(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        difficulty: req.query.difficulty as string,
        isActive: req.query.isActive === 'false' ? false : true,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const achievements = await gamificationService.listAchievements(filters);
      res.json({ success: true, data: achievements });
    } catch (error: any) {
      console.error('[listAchievements] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list achievements' });
    }
  }

  async getAchievement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const achievement = await gamificationService.getAchievement(id);

      if (!achievement) {
        res.status(404).json({ success: false, message: 'Achievement not found' });
        return;
      }

      res.json({ success: true, data: achievement });
    } catch (error: any) {
      console.error('[getAchievement] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get achievement' });
    }
  }

  async getMyAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const achievements = await gamificationService.getUserAchievements(userId);
      res.json({ success: true, data: achievements });
    } catch (error: any) {
      console.error('[getMyAchievements] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user achievements' });
    }
  }

  async updateAchievementProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { achievementId } = req.params;
      const { progress } = req.body;

      if (progress === undefined) {
        res.status(400).json({ success: false, message: 'Progress is required' });
        return;
      }

      const result = await gamificationService.updateAchievementProgress(userId, achievementId, progress);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[updateAchievementProgress] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update achievement progress' });
    }
  }

  // ========================================
  // REWARDS
  // ========================================

  async listRewards(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        rewardType: req.query.rewardType as string,
        isActive: req.query.isActive === 'false' ? false : true,
        minPoints: req.query.minPoints ? parseInt(req.query.minPoints as string, 10) : undefined,
        maxPoints: req.query.maxPoints ? parseInt(req.query.maxPoints as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const rewards = await gamificationService.listRewards(filters);
      res.json({ success: true, data: rewards });
    } catch (error: any) {
      console.error('[listRewards] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list rewards' });
    }
  }

  async getReward(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reward = await gamificationService.getReward(id);

      if (!reward) {
        res.status(404).json({ success: false, message: 'Reward not found' });
        return;
      }

      res.json({ success: true, data: reward });
    } catch (error: any) {
      console.error('[getReward] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get reward' });
    }
  }

  async redeemReward(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { rewardId } = req.params;
      const redemption = await gamificationService.redeemReward(userId, rewardId);

      res.status(201).json({ success: true, data: redemption });
    } catch (error: any) {
      console.error('[redeemReward] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to redeem reward' });
    }
  }

  async getMyRedemptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await gamificationService.getUserRedemptions(userId, limit, offset);
      res.json({ success: true, data: result.redemptions, total: result.total });
    } catch (error: any) {
      console.error('[getMyRedemptions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get redemptions' });
    }
  }

  // ========================================
  // QUESTS
  // ========================================

  async listQuests(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        questType: req.query.questType as string,
        difficulty: req.query.difficulty as string,
        isActive: req.query.isActive === 'false' ? false : true,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const quests = await gamificationService.listQuests(filters);
      res.json({ success: true, data: quests });
    } catch (error: any) {
      console.error('[listQuests] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list quests' });
    }
  }

  async getQuest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quest = await gamificationService.getQuest(id);

      if (!quest) {
        res.status(404).json({ success: false, message: 'Quest not found' });
        return;
      }

      res.json({ success: true, data: quest });
    } catch (error: any) {
      console.error('[getQuest] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get quest' });
    }
  }

  async startQuest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { questId } = req.params;
      const userQuest = await gamificationService.startQuest(userId, questId);

      res.status(201).json({ success: true, data: userQuest });
    } catch (error: any) {
      console.error('[startQuest] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start quest' });
    }
  }

  async getMyQuests(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string;
      const quests = await gamificationService.getUserQuests(userId, status);

      res.json({ success: true, data: quests });
    } catch (error: any) {
      console.error('[getMyQuests] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user quests' });
    }
  }

  async updateQuestProgress(req: Request, res: Response): Promise<void> {
    try {
      const { userQuestId } = req.params;
      const { completedObjectives } = req.body;

      if (!completedObjectives || !Array.isArray(completedObjectives)) {
        res.status(400).json({ success: false, message: 'Completed objectives array is required' });
        return;
      }

      const result = await gamificationService.updateQuestProgress(userQuestId, completedObjectives);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[updateQuestProgress] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update quest progress' });
    }
  }

  // ========================================
  // POWER-UPS
  // ========================================

  async listPowerUps(req: Request, res: Response): Promise<void> {
    try {
      const powerUps = await gamificationService.listPowerUps();
      res.json({ success: true, data: powerUps });
    } catch (error: any) {
      console.error('[listPowerUps] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list power-ups' });
    }
  }

  async activatePowerUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { powerUpId } = req.params;
      const activation = await gamificationService.activatePowerUp(userId, powerUpId);

      res.status(201).json({ success: true, data: activation });
    } catch (error: any) {
      console.error('[activatePowerUp] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to activate power-up' });
    }
  }

  async getMyActivePowerUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const powerUps = await gamificationService.getUserActivePowerUps(userId);
      res.json({ success: true, data: powerUps });
    } catch (error: any) {
      console.error('[getMyActivePowerUps] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active power-ups' });
    }
  }
}

export const gamificationController = new GamificationController();
