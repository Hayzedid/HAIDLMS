import { Request, Response } from 'express';
import { messagingService } from '../services/messaging.service';

export class MessagingController {
  // ========================================
  // CONVERSATIONS
  // ========================================

  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type, title, description, participantIds } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'participantIds is required and must be a non-empty array',
        });
        return;
      }

      // Add creator to participants if not already included
      const allParticipants = participantIds.includes(userId)
        ? participantIds
        : [userId, ...participantIds];

      const conversation = await messagingService.createConversation({
        type,
        title,
        description,
        createdBy: userId,
        participantIds: allParticipants,
      });

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
        error: error.message,
      });
    }
  }

  async getOrCreateDirectConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { recipientId } = req.params;

      // Check if trying to message self
      if (userId === recipientId) {
        res.status(400).json({
          success: false,
          message: 'Cannot create conversation with yourself',
        });
        return;
      }

      // Check if users are blocked
      const isBlocked = await messagingService.isUserBlocked(userId, recipientId);
      if (isBlocked) {
        res.status(403).json({
          success: false,
          message: 'Cannot create conversation with blocked user',
        });
        return;
      }

      const conversation = await messagingService.getOrCreateDirectConversation(
        userId,
        recipientId
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      console.error('Error getting/creating direct conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get/create conversation',
        error: error.message,
      });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const conversation = await messagingService.getConversation(id, userId);

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message,
      });
    }
  }

  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { type, limit, offset } = req.query;

      const result = await messagingService.getUserConversations(userId, {
        type: type as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result.conversations,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message,
      });
    }
  }

  async updateConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, avatarUrl } = req.body;

      const conversation = await messagingService.updateConversation(id, {
        title,
        description,
        avatarUrl,
      });

      res.json({
        success: true,
        message: 'Conversation updated successfully',
        data: conversation,
      });
    } catch (error: any) {
      console.error('Error updating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update conversation',
        error: error.message,
      });
    }
  }

  async archiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await messagingService.archiveConversation(id);

      res.json({
        success: true,
        message: 'Conversation archived successfully',
      });
    } catch (error: any) {
      console.error('Error archiving conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive conversation',
        error: error.message,
      });
    }
  }

  async unarchiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await messagingService.unarchiveConversation(id);

      res.json({
        success: true,
        message: 'Conversation unarchived successfully',
      });
    } catch (error: any) {
      console.error('Error unarchiving conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unarchive conversation',
        error: error.message,
      });
    }
  }

  // ========================================
  // PARTICIPANTS
  // ========================================

  async addParticipants(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'userIds is required and must be a non-empty array',
        });
        return;
      }

      await messagingService.addParticipants(id, userIds, userId);

      res.json({
        success: true,
        message: 'Participants added successfully',
      });
    } catch (error: any) {
      console.error('Error adding participants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add participants',
        error: error.message,
      });
    }
  }

  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      await messagingService.removeParticipant(id, userId);

      res.json({
        success: true,
        message: 'Participant removed successfully',
      });
    } catch (error: any) {
      console.error('Error removing participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove participant',
        error: error.message,
      });
    }
  }

  async getParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const participants = await messagingService.getParticipants(id);

      res.json({
        success: true,
        data: participants,
      });
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch participants',
        error: error.message,
      });
    }
  }

  async updateParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { role, isMuted, mutedUntil } = req.body;

      const participant = await messagingService.updateParticipant(id, userId, {
        role,
        isMuted,
        mutedUntil,
      });

      res.json({
        success: true,
        message: 'Participant updated successfully',
        data: participant,
      });
    } catch (error: any) {
      console.error('Error updating participant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update participant',
        error: error.message,
      });
    }
  }

  // ========================================
  // MESSAGES
  // ========================================

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { content, contentType, parentMessageId, mentions, attachments, metadata } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required',
        });
        return;
      }

      const message = await messagingService.sendMessage({
        conversationId,
        senderId: userId,
        content,
        contentType,
        parentMessageId,
        mentions,
        attachments,
        metadata,
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message,
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  async getMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const message = await messagingService.getMessage(id);

      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Message not found',
        });
        return;
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      console.error('Error fetching message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch message',
        error: error.message,
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { beforeMessageId, afterMessageId, limit } = req.query;

      const messages = await messagingService.getMessages(conversationId, {
        beforeMessageId: beforeMessageId as string,
        afterMessageId: afterMessageId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message,
      });
    }
  }

  async updateMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message content is required',
        });
        return;
      }

      const message = await messagingService.updateMessage(id, userId, content);

      res.json({
        success: true,
        message: 'Message updated successfully',
        data: message,
      });
    } catch (error: any) {
      console.error('Error updating message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update message',
        error: error.message,
      });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await messagingService.deleteMessage(id, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: error.message,
      });
    }
  }

  async getThreadMessages(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const messages = await messagingService.getThreadMessages(messageId);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      console.error('Error fetching thread messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch thread messages',
        error: error.message,
      });
    }
  }

  // ========================================
  // READ RECEIPTS & UNREAD
  // ========================================

  async markConversationRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      const count = await messagingService.markConversationRead(conversationId, userId);

      res.json({
        success: true,
        message: `${count} message(s) marked as read`,
        count,
      });
    } catch (error: any) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark conversation as read',
        error: error.message,
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await messagingService.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message,
      });
    }
  }

  async getMessageReadReceipts(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const receipts = await messagingService.getMessageReadReceipts(messageId);

      res.json({
        success: true,
        data: receipts,
      });
    } catch (error: any) {
      console.error('Error fetching read receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch read receipts',
        error: error.message,
      });
    }
  }

  // ========================================
  // REACTIONS
  // ========================================

  async addReaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        res.status(400).json({
          success: false,
          message: 'emoji is required',
        });
        return;
      }

      await messagingService.addReaction(messageId, userId, emoji);

      res.json({
        success: true,
        message: 'Reaction added successfully',
      });
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add reaction',
        error: error.message,
      });
    }
  }

  async removeReaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageId, emoji } = req.params;

      await messagingService.removeReaction(messageId, userId, emoji);

      res.json({
        success: true,
        message: 'Reaction removed successfully',
      });
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove reaction',
        error: error.message,
      });
    }
  }

  async getMessageReactions(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const reactions = await messagingService.getMessageReactions(messageId);

      res.json({
        success: true,
        data: reactions,
      });
    } catch (error: any) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reactions',
        error: error.message,
      });
    }
  }

  // ========================================
  // TYPING INDICATORS
  // ========================================

  async setTypingIndicator(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { isTyping } = req.body;

      await messagingService.setTypingIndicator(conversationId, userId, isTyping);

      res.json({
        success: true,
        message: 'Typing indicator updated',
      });
    } catch (error: any) {
      console.error('Error setting typing indicator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set typing indicator',
        error: error.message,
      });
    }
  }

  async getTypingIndicators(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const indicators = await messagingService.getTypingIndicators(conversationId);

      res.json({
        success: true,
        data: indicators,
      });
    } catch (error: any) {
      console.error('Error fetching typing indicators:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch typing indicators',
        error: error.message,
      });
    }
  }

  // ========================================
  // ATTACHMENTS
  // ========================================

  async getConversationAttachments(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { fileType } = req.query;

      const attachments = await messagingService.getConversationAttachments(
        conversationId,
        fileType as string
      );

      res.json({
        success: true,
        data: attachments,
      });
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attachments',
        error: error.message,
      });
    }
  }

  // ========================================
  // SEARCH
  // ========================================

  async searchMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { query, conversationId, limit } = req.query;

      if (!query || (query as string).trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'query parameter is required',
        });
        return;
      }

      const messages = await messagingService.searchMessages(
        userId,
        query as string,
        conversationId as string,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      console.error('Error searching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search messages',
        error: error.message,
      });
    }
  }

  // ========================================
  // BLOCKING
  // ========================================

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { blockedUserId } = req.params;
      const { reason } = req.body;

      await messagingService.blockUser(userId, blockedUserId, reason);

      res.json({
        success: true,
        message: 'User blocked successfully',
      });
    } catch (error: any) {
      console.error('Error blocking user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to block user',
        error: error.message,
      });
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { blockedUserId } = req.params;

      await messagingService.unblockUser(userId, blockedUserId);

      res.json({
        success: true,
        message: 'User unblocked successfully',
      });
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unblock user',
        error: error.message,
      });
    }
  }

  async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const blockedUsers = await messagingService.getBlockedUsers(userId);

      res.json({
        success: true,
        data: blockedUsers,
      });
    } catch (error: any) {
      console.error('Error fetching blocked users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blocked users',
        error: error.message,
      });
    }
  }

  // ========================================
  // CONVERSATION SETTINGS
  // ========================================

  async getConversationSettings(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const settings = await messagingService.getConversationSettings(conversationId);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Error fetching conversation settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation settings',
        error: error.message,
      });
    }
  }

  async updateConversationSettings(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const settings = await messagingService.updateConversationSettings(
        conversationId,
        req.body
      );

      res.json({
        success: true,
        message: 'Conversation settings updated successfully',
        data: settings,
      });
    } catch (error: any) {
      console.error('Error updating conversation settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update conversation settings',
        error: error.message,
      });
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getConversationStats(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const stats = await messagingService.getConversationStats(conversationId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching conversation stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation stats',
        error: error.message,
      });
    }
  }
}

export const messagingController = new MessagingController();
