import { Router } from 'express';
import { forumController } from '../controllers/forum.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

// ========================================
// CATEGORIES
// ========================================

/**
 * Get forum categories
 * GET /api/forum/categories
 */
router.get('/categories', forumController.getCategories.bind(forumController));

/**
 * Create a forum category (Admin/Instructor only)
 * POST /api/forum/categories
 */
router.post(
  '/categories',
  authenticate,
  authorize('admin', 'instructor'),
  forumController.createCategory.bind(forumController)
);

/**
 * Get category statistics
 * GET /api/forum/categories/:id/stats
 */
router.get('/categories/:id/stats', forumController.getCategoryStats.bind(forumController));

// ========================================
// THREADS
// ========================================

/**
 * Get discussion threads
 * GET /api/forum/threads
 */
router.get('/threads', forumController.getThreads.bind(forumController));

/**
 * Create a discussion thread
 * POST /api/forum/threads
 */
router.post('/threads', authenticate, forumController.createThread.bind(forumController));

/**
 * Get thread by ID
 * GET /api/forum/threads/:id
 */
router.get('/threads/:id', forumController.getThread.bind(forumController));

/**
 * Update a thread
 * PUT /api/forum/threads/:id
 */
router.put('/threads/:id', authenticate, forumController.updateThread.bind(forumController));

/**
 * Delete a thread
 * DELETE /api/forum/threads/:id
 */
router.delete('/threads/:id', authenticate, forumController.deleteThread.bind(forumController));

/**
 * Pin/unpin a thread (Instructor/Admin only)
 * POST /api/forum/threads/:id/pin
 */
router.post(
  '/threads/:id/pin',
  authenticate,
  authorize('admin', 'instructor'),
  forumController.pinThread.bind(forumController)
);

/**
 * Lock/unlock a thread (Instructor/Admin only)
 * POST /api/forum/threads/:id/lock
 */
router.post(
  '/threads/:id/lock',
  authenticate,
  authorize('admin', 'instructor'),
  forumController.lockThread.bind(forumController)
);

/**
 * Follow a thread
 * POST /api/forum/threads/:id/follow
 */
router.post('/threads/:id/follow', authenticate, forumController.followThread.bind(forumController));

/**
 * Unfollow a thread
 * POST /api/forum/threads/:id/unfollow
 */
router.post('/threads/:id/unfollow', authenticate, forumController.unfollowThread.bind(forumController));

// ========================================
// REPLIES
// ========================================

/**
 * Create a reply
 * POST /api/forum/threads/:id/replies
 */
router.post('/threads/:id/replies', authenticate, forumController.createReply.bind(forumController));

/**
 * Update a reply
 * PUT /api/forum/replies/:id
 */
router.put('/replies/:id', authenticate, forumController.updateReply.bind(forumController));

/**
 * Delete a reply
 * DELETE /api/forum/replies/:id
 */
router.delete('/replies/:id', authenticate, forumController.deleteReply.bind(forumController));

/**
 * Accept an answer to a question
 * POST /api/forum/threads/:threadId/accept-answer/:replyId
 */
router.post(
  '/threads/:threadId/accept-answer/:replyId',
  authenticate,
  forumController.acceptAnswer.bind(forumController)
);

// ========================================
// VOTING
// ========================================

/**
 * Vote on thread or reply
 * POST /api/forum/:entityType/:id/vote
 */
router.post('/:entityType/:id/vote', authenticate, forumController.vote.bind(forumController));

// ========================================
// FLAGGING & MODERATION
// ========================================

/**
 * Flag content for moderation
 * POST /api/forum/:entityType/:id/flag
 */
router.post('/:entityType/:id/flag', authenticate, forumController.flagContent.bind(forumController));

/**
 * Get flagged content (Moderator only)
 * GET /api/forum/moderation/flagged
 */
router.get(
  '/moderation/flagged',
  authenticate,
  authorize('admin', 'instructor'),
  forumController.getFlaggedContent.bind(forumController)
);

// ========================================
// REPUTATION & LEADERBOARD
// ========================================

/**
 * Get user reputation
 * GET /api/forum/reputation
 */
router.get('/reputation', authenticate, forumController.getReputation.bind(forumController));

/**
 * Get leaderboard
 * GET /api/forum/leaderboard
 */
router.get('/leaderboard', forumController.getLeaderboard.bind(forumController));

// ========================================
// SEARCH & DISCOVERY
// ========================================

/**
 * Search threads
 * GET /api/forum/search
 */
router.get('/search', forumController.searchThreads.bind(forumController));

/**
 * Get unanswered questions
 * GET /api/forum/unanswered
 */
router.get('/unanswered', forumController.getUnansweredQuestions.bind(forumController));

export default router;
