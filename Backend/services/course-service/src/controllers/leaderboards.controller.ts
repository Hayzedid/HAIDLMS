import { Request, Response } from 'express';
import { leaderboardsService } from '../services/leaderboards.service';

export class LeaderboardsController {
  // ========================================
  // LEADERBOARDS
  // ========================================

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const {
        leaderboardType = 'points',
        scopeType = 'global',
        courseId,
        organizationId,
        timePeriod = 'all_time',
        limit,
        offset
      } = req.query;

      const result = await leaderboardsService.getLeaderboard({
        leaderboardType: leaderboardType as string,
        scopeType: scopeType as string,
        courseId: courseId as string,
        organizationId: organizationId as string,
        timePeriod: timePeriod as string,
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[getLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get leaderboard' });
    }
  }

  async getGlobalPointsLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const leaderboard = await leaderboardsService.getGlobalPointsLeaderboard(limit);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getGlobalPointsLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get points leaderboard' });
    }
  }

  async getGlobalXPLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const leaderboard = await leaderboardsService.getGlobalXPLeaderboard(limit);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getGlobalXPLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get XP leaderboard' });
    }
  }

  async getGlobalStreakLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const leaderboard = await leaderboardsService.getGlobalStreakLeaderboard(limit);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getGlobalStreakLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get streak leaderboard' });
    }
  }

  async getCourseLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const leaderboard = await leaderboardsService.getCourseCompletionLeaderboard(courseId, limit);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getCourseLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course leaderboard' });
    }
  }

  async getMyRankings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const positions = await leaderboardsService.getUserLeaderboardPositions(userId);
      res.json({ success: true, data: positions });
    } catch (error: any) {
      console.error('[getMyRankings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get rankings' });
    }
  }

  // ========================================
  // PRIVACY SETTINGS
  // ========================================

  async getMyPrivacySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const settings = await leaderboardsService.getUserPrivacySettings(userId);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error('[getMyPrivacySettings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get privacy settings' });
    }
  }

  async updateMyPrivacySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const settings = await leaderboardsService.updatePrivacySettings(userId, req.body);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error('[updateMyPrivacySettings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update privacy settings' });
    }
  }

  // ========================================
  // COMPETITIONS
  // ========================================

  async listCompetitions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        competitionType: req.query.competitionType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const competitions = await leaderboardsService.listCompetitions(filters);
      res.json({ success: true, data: competitions });
    } catch (error: any) {
      console.error('[listCompetitions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list competitions' });
    }
  }

  async getActiveCompetitions(req: Request, res: Response): Promise<void> {
    try {
      const competitions = await leaderboardsService.getActiveCompetitions();
      res.json({ success: true, data: competitions });
    } catch (error: any) {
      console.error('[getActiveCompetitions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active competitions' });
    }
  }

  async getCompetition(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const competition = await leaderboardsService.getCompetition(id);

      if (!competition) {
        res.status(404).json({ success: false, message: 'Competition not found' });
        return;
      }

      res.json({ success: true, data: competition });
    } catch (error: any) {
      console.error('[getCompetition] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get competition' });
    }
  }

  async joinCompetition(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { competitionId } = req.params;
      const participant = await leaderboardsService.joinCompetition(userId, competitionId);

      res.status(201).json({ success: true, data: participant });
    } catch (error: any) {
      console.error('[joinCompetition] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to join competition' });
    }
  }

  async getCompetitionLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { competitionId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const participants = await leaderboardsService.getCompetitionParticipants(competitionId, limit);
      res.json({ success: true, data: participants });
    } catch (error: any) {
      console.error('[getCompetitionLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get competition leaderboard' });
    }
  }

  async withdrawFromCompetition(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { competitionId } = req.params;
      await leaderboardsService.withdrawFromCompetition(userId, competitionId);

      res.json({ success: true, message: 'Withdrawn from competition' });
    } catch (error: any) {
      console.error('[withdrawFromCompetition] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to withdraw from competition' });
    }
  }

  async getMyCompetitions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string;
      const competitions = await leaderboardsService.getUserCompetitions(userId, status);

      res.json({ success: true, data: competitions });
    } catch (error: any) {
      console.error('[getMyCompetitions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user competitions' });
    }
  }
}

export const leaderboardsController = new LeaderboardsController();
