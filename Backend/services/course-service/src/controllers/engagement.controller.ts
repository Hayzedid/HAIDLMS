import { Request, Response } from 'express';
import { engagementService } from '../services/engagement.service';

export class EngagementController {
  // ========================================
  // USER PROFILES
  // ========================================

  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await engagementService.getUserProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[getMyProfile] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get profile' });
    }
  }

  async getUserProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await engagementService.getUserProfile(userId);

      // Check if profile is public
      if (!profile.is_public) {
        const currentUserId = (req as any).user?.userId;
        if (currentUserId !== userId) {
          res.status(403).json({ success: false, message: 'Profile is private' });
          return;
        }
      }

      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[getUserProfileById] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get profile' });
    }
  }

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await engagementService.updateProfile({ userId, ...req.body });
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[updateMyProfile] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
    }
  }

  async updateMyProfileSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await engagementService.updateProfileSettings({ userId, ...req.body });
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[updateMyProfileSettings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
    }
  }

  // ========================================
  // FOLLOWS
  // ========================================

  async followUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        res.status(400).json({ success: false, message: 'targetUserId is required' });
        return;
      }

      const result = await engagementService.followUser(userId, targetUserId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[followUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to follow user' });
    }
  }

  async unfollowUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        res.status(400).json({ success: false, message: 'targetUserId is required' });
        return;
      }

      const result = await engagementService.unfollowUser(userId, targetUserId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[unfollowUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to unfollow user' });
    }
  }

  async getMyFollowers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const followers = await engagementService.getFollowers(userId, limit);

      res.json({ success: true, data: followers });
    } catch (error: any) {
      console.error('[getMyFollowers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get followers' });
    }
  }

  async getMyFollowing(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const following = await engagementService.getFollowing(userId, limit);

      res.json({ success: true, data: following });
    } catch (error: any) {
      console.error('[getMyFollowing] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get following' });
    }
  }

  async getUserFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const followers = await engagementService.getFollowers(userId, limit);

      res.json({ success: true, data: followers });
    } catch (error: any) {
      console.error('[getUserFollowers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get followers' });
    }
  }

  async getUserFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const following = await engagementService.getFollowing(userId, limit);

      res.json({ success: true, data: following });
    } catch (error: any) {
      console.error('[getUserFollowing] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get following' });
    }
  }

  // ========================================
  // ENGAGEMENT ACTIVITIES
  // ========================================

  async likeContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetType, targetId } = req.body;
      if (!targetType || !targetId) {
        res.status(400).json({ success: false, message: 'targetType and targetId are required' });
        return;
      }

      const result = await engagementService.recordEngagement({
        userId,
        engagementType: 'like',
        targetType,
        targetId
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[likeContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to like content' });
    }
  }

  async unlikeContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetType, targetId } = req.body;
      if (!targetType || !targetId) {
        res.status(400).json({ success: false, message: 'targetType and targetId are required' });
        return;
      }

      await engagementService.removeEngagement(userId, 'like', targetType, targetId);
      res.json({ success: true, message: 'Content unliked' });
    } catch (error: any) {
      console.error('[unlikeContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to unlike content' });
    }
  }

  async getEngagementStats(req: Request, res: Response): Promise<void> {
    try {
      const { targetType, targetId } = req.params;
      const stats = await engagementService.getEngagementStats(targetType, targetId);

      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getEngagementStats] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get engagement stats' });
    }
  }

  // ========================================
  // KUDOS
  // ========================================

  async sendKudos(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { recipientId, kudosType, message, relatedType, relatedId, isPublic } = req.body;

      if (!recipientId || !kudosType) {
        res.status(400).json({ success: false, message: 'recipientId and kudosType are required' });
        return;
      }

      const kudos = await engagementService.sendKudos({
        senderId: userId,
        recipientId,
        kudosType,
        message,
        relatedType,
        relatedId,
        isPublic
      });

      res.json({ success: true, data: kudos });
    } catch (error: any) {
      console.error('[sendKudos] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send kudos' });
    }
  }

  async getMyReceivedKudos(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const kudos = await engagementService.getReceivedKudos(userId, limit);

      res.json({ success: true, data: kudos });
    } catch (error: any) {
      console.error('[getMyReceivedKudos] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get kudos' });
    }
  }

  async getMySentKudos(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const kudos = await engagementService.getSentKudos(userId, limit);

      res.json({ success: true, data: kudos });
    } catch (error: any) {
      console.error('[getMySentKudos] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get kudos' });
    }
  }

  // ========================================
  // CONTENT SHARING
  // ========================================

  async shareContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetType, targetId, platform, shareUrl, shareMessage } = req.body;

      if (!targetType || !targetId || !platform) {
        res.status(400).json({ success: false, message: 'targetType, targetId, and platform are required' });
        return;
      }

      const share = await engagementService.shareContent({
        userId,
        targetType,
        targetId,
        platform,
        shareUrl,
        shareMessage
      });

      res.json({ success: true, data: share });
    } catch (error: any) {
      console.error('[shareContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to share content' });
    }
  }

  async getMyShares(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const shares = await engagementService.getUserShares(userId, limit);

      res.json({ success: true, data: shares });
    } catch (error: any) {
      console.error('[getMyShares] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get shares' });
    }
  }

  // ========================================
  // BOOKMARKS
  // ========================================

  async bookmarkContent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetType, targetId, folderName, notes } = req.body;

      if (!targetType || !targetId) {
        res.status(400).json({ success: false, message: 'targetType and targetId are required' });
        return;
      }

      const bookmark = await engagementService.bookmarkContent({
        userId,
        targetType,
        targetId,
        folderName,
        notes
      });

      res.json({ success: true, data: bookmark });
    } catch (error: any) {
      console.error('[bookmarkContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to bookmark content' });
    }
  }

  async removeBookmark(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { targetType, targetId } = req.params;
      await engagementService.removeBookmark(userId, targetType, targetId);

      res.json({ success: true, message: 'Bookmark removed' });
    } catch (error: any) {
      console.error('[removeBookmark] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove bookmark' });
    }
  }

  async getMyBookmarks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const folderName = req.query.folder as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const bookmarks = await engagementService.getUserBookmarks(userId, folderName, limit);

      res.json({ success: true, data: bookmarks });
    } catch (error: any) {
      console.error('[getMyBookmarks] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get bookmarks' });
    }
  }

  async getMyBookmarkFolders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const folders = await engagementService.getBookmarkFolders(userId);
      res.json({ success: true, data: folders });
    } catch (error: any) {
      console.error('[getMyBookmarkFolders] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get folders' });
    }
  }

  // ========================================
  // ACTIVITY FEED
  // ========================================

  async getMyActivityFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const feed = await engagementService.getUserActivityFeed(userId, limit);

      res.json({ success: true, data: feed });
    } catch (error: any) {
      console.error('[getMyActivityFeed] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get activity feed' });
    }
  }

  async getPublicActivityFeed(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const feed = await engagementService.getPublicActivityFeed(limit);

      res.json({ success: true, data: feed });
    } catch (error: any) {
      console.error('[getPublicActivityFeed] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get activity feed' });
    }
  }

  // ========================================
  // ENGAGEMENT SCORES
  // ========================================

  async getMyEngagementScore(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const score = await engagementService.getUserEngagementScore(userId);
      res.json({ success: true, data: score });
    } catch (error: any) {
      console.error('[getMyEngagementScore] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get engagement score' });
    }
  }

  async refreshMyEngagementScore(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const score = await engagementService.calculateEngagementScore(userId);
      res.json({ success: true, data: { score } });
    } catch (error: any) {
      console.error('[refreshMyEngagementScore] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to refresh engagement score' });
    }
  }

  async getTopEngagedUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const users = await engagementService.getTopEngagedUsers(limit);

      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[getTopEngagedUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get top engaged users' });
    }
  }

  // ========================================
  // ENGAGEMENT ANALYTICS
  // ========================================

  async getMyEngagementAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const analytics = await engagementService.getEngagementAnalytics(userId, days);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getMyEngagementAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get engagement analytics' });
    }
  }

  async getTrendingContent(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const trending = await engagementService.getTrendingContent(limit);

      res.json({ success: true, data: trending });
    } catch (error: any) {
      console.error('[getTrendingContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get trending content' });
    }
  }
}

export const engagementController = new EngagementController();
