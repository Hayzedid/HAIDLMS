import { Request, Response } from 'express';
import { forumService } from '../services/forum.service';

export class ForumController {
  // ========================================
  // CATEGORIES
  // ========================================

  /**
   * @swagger
   * /api/forum/categories:
   *   get:
   *     summary: Get forum categories
   *     tags: [Forum]
   *     parameters:
   *       - in: query
   *         name: courseId
   *         schema:
   *           type: string
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, organizationId } = req.query;

      const categories = await forumService.getCategories(
        courseId as string,
        organizationId as string
      );

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get categories',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/categories:
   *   post:
   *     summary: Create a forum category (Admin/Instructor only)
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - slug
   *             properties:
   *               courseId:
   *                 type: string
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created successfully
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await forumService.createCategory(req.body);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create category',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/categories/{id}/stats:
   *   get:
   *     summary: Get category statistics
   *     tags: [Forum]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await forumService.getCategoryStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get stats',
      });
    }
  }

  // ========================================
  // THREADS
  // ========================================

  /**
   * @swagger
   * /api/forum/threads:
   *   get:
   *     summary: Get discussion threads
   *     tags: [Forum]
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [recent, popular, unanswered, bounty]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Threads retrieved successfully
   */
  async getThreads(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        authorId: req.query.authorId as string,
        threadType: req.query.threadType as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        isQuestion: req.query.isQuestion === 'true',
        sortBy: req.query.sortBy as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await forumService.getThreads(filters);

      res.status(200).json({
        success: true,
        data: result.threads,
        pagination: {
          total: result.total,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get threads',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}:
   *   get:
   *     summary: Get thread by ID
   *     tags: [Forum]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Thread retrieved successfully
   */
  async getThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const thread = await forumService.getThreadById(id, true);
      const replies = await forumService.getReplies(id);

      // Get user's vote if authenticated
      let userVote = null;
      if ((req as any).user) {
        userVote = await forumService.getUserVote((req as any).user.id, 'thread', id);
      }

      res.status(200).json({
        success: true,
        data: {
          thread,
          replies,
          userVote,
        },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Thread not found',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads:
   *   post:
   *     summary: Create a discussion thread
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - categoryId
   *               - title
   *               - content
   *             properties:
   *               categoryId:
   *                 type: string
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               isQuestion:
   *                 type: boolean
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Thread created successfully
   */
  async createThread(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const threadData = {
        ...req.body,
        authorId: userId,
      };

      const thread = await forumService.createThread(threadData);

      res.status(201).json({
        success: true,
        data: thread,
        message: 'Thread created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create thread',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}:
   *   put:
   *     summary: Update a thread
   *     tags: [Forum]
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
   *         description: Thread updated successfully
   */
  async updateThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const thread = await forumService.updateThread(id, userId, updates);

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update thread',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}:
   *   delete:
   *     summary: Delete a thread
   *     tags: [Forum]
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
   *         description: Thread deleted successfully
   */
  async deleteThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = ['admin', 'instructor'].includes((req as any).user.role);

      await forumService.deleteThread(id, userId, isAdmin);

      res.status(200).json({
        success: true,
        message: 'Thread deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete thread',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}/pin:
   *   post:
   *     summary: Pin/unpin a thread (Instructor/Admin only)
   *     tags: [Forum]
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
   *               isPinned:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Thread pinned/unpinned successfully
   */
  async pinThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isPinned } = req.body;

      await forumService.pinThread(id, isPinned);

      res.status(200).json({
        success: true,
        message: isPinned ? 'Thread pinned' : 'Thread unpinned',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to pin thread',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}/lock:
   *   post:
   *     summary: Lock/unlock a thread (Instructor/Admin only)
   *     tags: [Forum]
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
   *               isLocked:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Thread locked/unlocked successfully
   */
  async lockThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isLocked } = req.body;

      await forumService.lockThread(id, isLocked);

      res.status(200).json({
        success: true,
        message: isLocked ? 'Thread locked' : 'Thread unlocked',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to lock thread',
      });
    }
  }

  // ========================================
  // REPLIES
  // ========================================

  /**
   * @swagger
   * /api/forum/threads/{id}/replies:
   *   post:
   *     summary: Create a reply
   *     tags: [Forum]
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
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *               parentReplyId:
   *                 type: string
   *               isAnswer:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Reply created successfully
   */
  async createReply(req: Request, res: Response): Promise<void> {
    try {
      const { id: threadId } = req.params;
      const userId = (req as any).user.id;

      const replyData = {
        ...req.body,
        threadId,
        authorId: userId,
      };

      const reply = await forumService.createReply(replyData);

      res.status(201).json({
        success: true,
        data: reply,
        message: 'Reply posted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create reply',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/replies/{id}:
   *   put:
   *     summary: Update a reply
   *     tags: [Forum]
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
   *         description: Reply updated successfully
   */
  async updateReply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const reply = await forumService.updateReply(id, userId, updates);

      res.status(200).json({
        success: true,
        data: reply,
        message: 'Reply updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update reply',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/replies/{id}:
   *   delete:
   *     summary: Delete a reply
   *     tags: [Forum]
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
   *         description: Reply deleted successfully
   */
  async deleteReply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const isAdmin = ['admin', 'instructor'].includes((req as any).user.role);

      await forumService.deleteReply(id, userId, isAdmin);

      res.status(200).json({
        success: true,
        message: 'Reply deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete reply',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{threadId}/accept-answer/{replyId}:
   *   post:
   *     summary: Accept an answer to a question
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: threadId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: replyId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Answer accepted successfully
   */
  async acceptAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { threadId, replyId } = req.params;
      const userId = (req as any).user.id;

      await forumService.acceptAnswer(threadId, replyId, userId);

      res.status(200).json({
        success: true,
        message: 'Answer accepted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to accept answer',
      });
    }
  }

  // ========================================
  // VOTING
  // ========================================

  /**
   * @swagger
   * /api/forum/{entityType}/{id}/vote:
   *   post:
   *     summary: Vote on thread or reply
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: entityType
   *         required: true
   *         schema:
   *           type: string
   *           enum: [thread, reply]
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
   *               - voteType
   *             properties:
   *               voteType:
   *                 type: string
   *                 enum: [upvote, downvote]
   *     responses:
   *       200:
   *         description: Vote recorded successfully
   */
  async vote(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, id } = req.params;
      const { voteType } = req.body;
      const userId = (req as any).user.id;

      await forumService.vote(userId, entityType as 'thread' | 'reply', id, voteType);

      res.status(200).json({
        success: true,
        message: 'Vote recorded',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to vote',
      });
    }
  }

  // ========================================
  // FOLLOWING
  // ========================================

  /**
   * @swagger
   * /api/forum/threads/{id}/follow:
   *   post:
   *     summary: Follow a thread
   *     tags: [Forum]
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
   *         description: Thread followed successfully
   */
  async followThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await forumService.followThread(id, userId);

      res.status(200).json({
        success: true,
        message: 'Thread followed',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to follow thread',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/threads/{id}/unfollow:
   *   post:
   *     summary: Unfollow a thread
   *     tags: [Forum]
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
   *         description: Thread unfollowed successfully
   */
  async unfollowThread(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await forumService.unfollowThread(id, userId);

      res.status(200).json({
        success: true,
        message: 'Thread unfollowed',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unfollow thread',
      });
    }
  }

  // ========================================
  // FLAGGING & MODERATION
  // ========================================

  /**
   * @swagger
   * /api/forum/{entityType}/{id}/flag:
   *   post:
   *     summary: Flag content for moderation
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: entityType
   *         required: true
   *         schema:
   *           type: string
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
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Content flagged successfully
   */
  async flagContent(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, id } = req.params;
      const { reason, description } = req.body;
      const userId = (req as any).user.id;

      await forumService.flagContent(
        userId,
        entityType as 'thread' | 'reply',
        id,
        reason,
        description
      );

      res.status(200).json({
        success: true,
        message: 'Content flagged for review',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to flag content',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/moderation/flagged:
   *   get:
   *     summary: Get flagged content (Moderator only)
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Flagged content retrieved successfully
   */
  async getFlaggedContent(req: Request, res: Response): Promise<void> {
    try {
      const flagged = await forumService.getFlaggedContent();

      res.status(200).json({
        success: true,
        data: flagged,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get flagged content',
      });
    }
  }

  // ========================================
  // REPUTATION & LEADERBOARD
  // ========================================

  /**
   * @swagger
   * /api/forum/reputation:
   *   get:
   *     summary: Get user reputation
   *     tags: [Forum]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: courseId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Reputation retrieved successfully
   */
  async getReputation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const courseId = req.query.courseId as string;

      const reputation = await forumService.getUserReputation(userId, courseId);

      res.status(200).json({
        success: true,
        data: reputation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get reputation',
      });
    }
  }

  /**
   * @swagger
   * /api/forum/leaderboard:
   *   get:
   *     summary: Get leaderboard
   *     tags: [Forum]
   *     parameters:
   *       - in: query
   *         name: courseId
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Leaderboard retrieved successfully
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.query.courseId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const leaderboard = await forumService.getLeaderboard(courseId, limit);

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get leaderboard',
      });
    }
  }

  // ========================================
  // SEARCH
  // ========================================

  /**
   * @swagger
   * /api/forum/search:
   *   get:
   *     summary: Search threads
   *     tags: [Forum]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   */
  async searchThreads(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.length < 3) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 3 characters',
        });
        return;
      }

      const filters = {
        categoryId: req.query.categoryId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const results = await forumService.searchThreads(query, filters);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Search failed',
      });
    }
  }

  // ========================================
  // UNANSWERED QUESTIONS
  // ========================================

  /**
   * @swagger
   * /api/forum/unanswered:
   *   get:
   *     summary: Get unanswered questions
   *     tags: [Forum]
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Unanswered questions retrieved successfully
   */
  async getUnansweredQuestions(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.categoryId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const questions = await forumService.getUnansweredQuestions(categoryId, limit);

      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unanswered questions',
      });
    }
  }
}

export const forumController = new ForumController();
