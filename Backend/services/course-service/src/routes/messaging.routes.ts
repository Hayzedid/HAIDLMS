import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Direct messaging and chat system endpoints
 */

// All messaging routes require authentication
router.use(authenticate);

// ========================================
// CONVERSATIONS
// ========================================

/**
 * @swagger
 * /api/messaging/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - participantIds
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [direct, group]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/conversations', messagingController.createConversation.bind(messagingController));

/**
 * @swagger
 * /api/messaging/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [direct, group]
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
 *         description: Conversations retrieved successfully
 */
router.get('/conversations', messagingController.getUserConversations.bind(messagingController));

/**
 * @swagger
 * /api/messaging/conversations/direct/{recipientId}:
 *   get:
 *     summary: Get or create direct conversation with user
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved/created successfully
 */
router.get(
  '/conversations/direct/:recipientId',
  messagingController.getOrCreateDirectConversation.bind(messagingController)
);

/**
 * @swagger
 * /api/messaging/conversations/{id}:
 *   get:
 *     summary: Get conversation details
 *     tags: [Messaging]
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
 *         description: Conversation retrieved successfully
 */
router.get('/conversations/:id', messagingController.getConversation.bind(messagingController));

/**
 * @swagger
 * /api/messaging/conversations/{id}:
 *   put:
 *     summary: Update conversation
 *     tags: [Messaging]
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
 *         description: Conversation updated successfully
 */
router.put('/conversations/:id', messagingController.updateConversation.bind(messagingController));

router.post('/conversations/:id/archive', messagingController.archiveConversation.bind(messagingController));
router.post('/conversations/:id/unarchive', messagingController.unarchiveConversation.bind(messagingController));

// ========================================
// PARTICIPANTS
// ========================================

router.post('/conversations/:id/participants', messagingController.addParticipants.bind(messagingController));
router.delete('/conversations/:id/participants/:userId', messagingController.removeParticipant.bind(messagingController));
router.get('/conversations/:id/participants', messagingController.getParticipants.bind(messagingController));
router.put('/conversations/:id/participants/:userId', messagingController.updateParticipant.bind(messagingController));

// ========================================
// MESSAGES
// ========================================

/**
 * @swagger
 * /api/messaging/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               contentType:
 *                 type: string
 *               parentMessageId:
 *                 type: string
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post(
  '/conversations/:conversationId/messages',
  messagingController.sendMessage.bind(messagingController)
);

/**
 * @swagger
 * /api/messaging/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation messages
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: beforeMessageId
 *         schema:
 *           type: string
 *       - in: query
 *         name: afterMessageId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/conversations/:conversationId/messages',
  messagingController.getMessages.bind(messagingController)
);

router.get('/messages/:id', messagingController.getMessage.bind(messagingController));
router.put('/messages/:id', messagingController.updateMessage.bind(messagingController));
router.delete('/messages/:id', messagingController.deleteMessage.bind(messagingController));

router.get('/messages/:messageId/thread', messagingController.getThreadMessages.bind(messagingController));

// ========================================
// READ RECEIPTS & UNREAD
// ========================================

/**
 * @swagger
 * /api/messaging/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark conversation as read
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.post(
  '/conversations/:conversationId/read',
  messagingController.markConversationRead.bind(messagingController)
);

/**
 * @swagger
 * /api/messaging/unread-count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', messagingController.getUnreadCount.bind(messagingController));

router.get('/messages/:messageId/receipts', messagingController.getMessageReadReceipts.bind(messagingController));

// ========================================
// REACTIONS
// ========================================

/**
 * @swagger
 * /api/messaging/messages/{messageId}/reactions:
 *   post:
 *     summary: Add reaction to message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
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
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reaction added successfully
 */
router.post('/messages/:messageId/reactions', messagingController.addReaction.bind(messagingController));
router.delete('/messages/:messageId/reactions/:emoji', messagingController.removeReaction.bind(messagingController));
router.get('/messages/:messageId/reactions', messagingController.getMessageReactions.bind(messagingController));

// ========================================
// TYPING INDICATORS
// ========================================

/**
 * @swagger
 * /api/messaging/conversations/{conversationId}/typing:
 *   post:
 *     summary: Set typing indicator
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
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
 *               - isTyping
 *             properties:
 *               isTyping:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Typing indicator updated
 */
router.post(
  '/conversations/:conversationId/typing',
  messagingController.setTypingIndicator.bind(messagingController)
);

router.get(
  '/conversations/:conversationId/typing',
  messagingController.getTypingIndicators.bind(messagingController)
);

// ========================================
// ATTACHMENTS
// ========================================

router.get(
  '/conversations/:conversationId/attachments',
  messagingController.getConversationAttachments.bind(messagingController)
);

// ========================================
// SEARCH
// ========================================

/**
 * @swagger
 * /api/messaging/search:
 *   get:
 *     summary: Search messages
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', messagingController.searchMessages.bind(messagingController));

// ========================================
// BLOCKING
// ========================================

/**
 * @swagger
 * /api/messaging/block/{blockedUserId}:
 *   post:
 *     summary: Block a user
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blockedUserId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User blocked successfully
 */
router.post('/block/:blockedUserId', messagingController.blockUser.bind(messagingController));
router.delete('/block/:blockedUserId', messagingController.unblockUser.bind(messagingController));
router.get('/blocked', messagingController.getBlockedUsers.bind(messagingController));

// ========================================
// CONVERSATION SETTINGS
// ========================================

router.get(
  '/conversations/:conversationId/settings',
  messagingController.getConversationSettings.bind(messagingController)
);

router.put(
  '/conversations/:conversationId/settings',
  messagingController.updateConversationSettings.bind(messagingController)
);

// ========================================
// STATISTICS
// ========================================

router.get(
  '/conversations/:conversationId/stats',
  messagingController.getConversationStats.bind(messagingController)
);

export default router;
