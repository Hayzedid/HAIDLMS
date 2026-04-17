import { Request, Response } from 'express';
import { streaksService } from '../services/streaks.service';

export class StreaksController {
  // ========================================
  // STREAKS
  // ========================================

  async getMyStreak(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const streak = await streaksService.getUserStreak(userId);
      res.json({ success: true, data: streak });
    } catch (error: any) {
      console.error('[getMyStreak] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get streak' });
    }
  }

  async useStreakFreeze(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const streak = await streaksService.useStreakFreeze(userId);
      res.json({ success: true, data: streak, message: 'Streak freeze used successfully' });
    } catch (error: any) {
      console.error('[useStreakFreeze] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to use streak freeze' });
    }
  }

  async getMyStreakHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const history = await streaksService.getStreakHistory(userId, days);

      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getMyStreakHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get streak history' });
    }
  }

  async getStreakLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const leaderboard = await streaksService.getStreakLeaderboard(limit);

      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getStreakLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get streak leaderboard' });
    }
  }

  async getMyStreakStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await streaksService.getUserStreakStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getMyStreakStats] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get streak stats' });
    }
  }

  async updateStreakReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { enabled, reminderTime } = req.body;

      if (enabled === undefined) {
        res.status(400).json({ success: false, message: 'enabled field is required' });
        return;
      }

      await streaksService.updateStreakReminders(userId, enabled, reminderTime);
      res.json({ success: true, message: 'Reminder settings updated' });
    } catch (error: any) {
      console.error('[updateStreakReminders] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update reminder settings' });
    }
  }

  // ========================================
  // MILESTONES
  // ========================================

  async listStreakMilestones(req: Request, res: Response): Promise<void> {
    try {
      const milestones = await streaksService.listStreakMilestones();
      res.json({ success: true, data: milestones });
    } catch (error: any) {
      console.error('[listStreakMilestones] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list streak milestones' });
    }
  }

  async getMyMilestones(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const milestones = await streaksService.getUserMilestones(userId);
      res.json({ success: true, data: milestones });
    } catch (error: any) {
      console.error('[getMyMilestones] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user milestones' });
    }
  }

  // ========================================
  // DAILY CHALLENGES
  // ========================================

  async getMyDailyChallenges(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Auto-assign challenges if none exist for today
      const existing = await streaksService.getUserDailyChallenges(userId);
      if (existing.length === 0) {
        await streaksService.assignDailyChallenges(userId);
      }

      const challenges = await streaksService.getUserDailyChallenges(userId);
      res.json({ success: true, data: challenges });
    } catch (error: any) {
      console.error('[getMyDailyChallenges] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get daily challenges' });
    }
  }

  async skipChallenge(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { challengeId } = req.params;
      await streaksService.skipChallenge(userId, challengeId);

      res.json({ success: true, message: 'Challenge skipped' });
    } catch (error: any) {
      console.error('[skipChallenge] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to skip challenge' });
    }
  }

  async getMyChallengeStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await streaksService.getChallengeStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getMyChallengeStats] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get challenge stats' });
    }
  }

  async listDailyChallenges(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        challengeType: req.query.challengeType as string,
        difficulty: req.query.difficulty as string,
        isActive: req.query.isActive === 'false' ? false : true
      };

      const challenges = await streaksService.listDailyChallenges(filters);
      res.json({ success: true, data: challenges });
    } catch (error: any) {
      console.error('[listDailyChallenges] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list daily challenges' });
    }
  }

  async getActiveChallengesSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await streaksService.getActiveChallengesSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getActiveChallengesSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get challenges summary' });
    }
  }
}

export const streaksController = new StreaksController();
