import { Request, Response } from 'express';
import { userManagementService } from '../services/user-management.service';

export class UserManagementController {
  // ========================================
  // USER PROFILES
  // ========================================

  async createUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await userManagementService.createUserProfile({
        userId,
        ...req.body
      });

      res.status(201).json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[createUserProfile] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create profile' });
    }
  }

  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await userManagementService.getUserProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[getMyProfile] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get profile' });
    }
  }

  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const profile = await userManagementService.getUserProfile(userId);

      if (!profile) {
        res.status(404).json({ success: false, message: 'User profile not found' });
        return;
      }

      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[getUserProfile] Error:', error);
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

      const profile = await userManagementService.updateUserProfile(userId, req.body);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[updateMyProfile] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId } = req.params;
      const { status, reason } = req.body;

      if (!status || !reason) {
        res.status(400).json({ success: false, message: 'Status and reason are required' });
        return;
      }

      const profile = await userManagementService.updateUserStatus(userId, status, reason, adminId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      console.error('[updateUserStatus] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update user status' });
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        organizationId: req.query.organizationId as string,
        country: req.query.country as string,
        minLoginCount: req.query.minLoginCount ? parseInt(req.query.minLoginCount as string, 10) : undefined,
        lastLoginAfter: req.query.lastLoginAfter as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const result = await userManagementService.searchUsers(filters);
      res.json({ success: true, data: result.users, total: result.total });
    } catch (error: any) {
      console.error('[searchUsers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to search users' });
    }
  }

  async getUsersRequiringAttention(req: Request, res: Response): Promise<void> {
    try {
      const users = await userManagementService.getUsersRequiringAttention();
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[getUsersRequiringAttention] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get users' });
    }
  }

  async recordLogin(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const ipAddress = req.ip;
      await userManagementService.recordLogin(userId, ipAddress);

      res.json({ success: true, message: 'Login recorded' });
    } catch (error: any) {
      console.error('[recordLogin] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record login' });
    }
  }

  // ========================================
  // BULK OPERATIONS
  // ========================================

  async createBulkOperation(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { operationType, targetUserIds, reason, organizationId, parameters } = req.body;

      if (!operationType || !targetUserIds || targetUserIds.length === 0) {
        res.status(400).json({ success: false, message: 'Operation type and target user IDs are required' });
        return;
      }

      const operation = await userManagementService.createBulkOperation({
        operationType,
        initiatedBy: adminId,
        organizationId,
        targetUserIds,
        reason,
        parameters
      });

      res.status(201).json({ success: true, data: operation });
    } catch (error: any) {
      console.error('[createBulkOperation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create bulk operation' });
    }
  }

  async executeBulkOperation(req: Request, res: Response): Promise<void> {
    try {
      const { operationId } = req.params;
      const operation = await userManagementService.executeBulkOperation(operationId);

      res.json({ success: true, data: operation });
    } catch (error: any) {
      console.error('[executeBulkOperation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to execute bulk operation' });
    }
  }

  async getBulkOperation(req: Request, res: Response): Promise<void> {
    try {
      const { operationId } = req.params;
      const operation = await userManagementService.getBulkOperation(operationId);

      if (!operation) {
        res.status(404).json({ success: false, message: 'Bulk operation not found' });
        return;
      }

      res.json({ success: true, data: operation });
    } catch (error: any) {
      console.error('[getBulkOperation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get bulk operation' });
    }
  }

  async listBulkOperations(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        initiatedBy: req.query.initiatedBy as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const operations = await userManagementService.listBulkOperations(filters);
      res.json({ success: true, data: operations });
    } catch (error: any) {
      console.error('[listBulkOperations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list bulk operations' });
    }
  }

  // ========================================
  // IMPERSONATION
  // ========================================

  async startImpersonation(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { impersonatedUserId, reason, justification, ticketNumber } = req.body;

      if (!impersonatedUserId || !reason || !justification) {
        res.status(400).json({
          success: false,
          message: 'Impersonated user ID, reason, and justification are required'
        });
        return;
      }

      const sessionId = await userManagementService.startImpersonation({
        impersonatorId: adminId,
        impersonatedUserId,
        reason,
        justification,
        ticketNumber,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({ success: true, data: { sessionId } });
    } catch (error: any) {
      console.error('[startImpersonation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start impersonation' });
    }
  }

  async endImpersonation(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { actionsPerformed, pagesVisited } = req.body;

      await userManagementService.endImpersonation(
        sessionId,
        actionsPerformed || 0,
        pagesVisited || []
      );

      res.json({ success: true, message: 'Impersonation session ended' });
    } catch (error: any) {
      console.error('[endImpersonation] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to end impersonation' });
    }
  }

  async getImpersonationSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await userManagementService.getImpersonationSession(sessionId);

      if (!session) {
        res.status(404).json({ success: false, message: 'Impersonation session not found' });
        return;
      }

      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[getImpersonationSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get impersonation session' });
    }
  }

  async listImpersonationSessions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        impersonatorId: req.query.impersonatorId as string,
        impersonatedUserId: req.query.impersonatedUserId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const sessions = await userManagementService.listImpersonationSessions(filters);
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      console.error('[listImpersonationSessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list impersonation sessions' });
    }
  }

  // ========================================
  // USER DATA EXPORTS
  // ========================================

  async createUserDataExport(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = (req as any).user?.userId;
      if (!requesterId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, exportType, includeSections, format, isGdprRequest } = req.body;

      if (!exportType) {
        res.status(400).json({ success: false, message: 'Export type is required' });
        return;
      }

      const exportJob = await userManagementService.createUserDataExport({
        userId: userId || requesterId,
        requestedBy: requesterId,
        exportType,
        includeSections,
        format,
        isGdprRequest
      });

      res.status(201).json({ success: true, data: exportJob });
    } catch (error: any) {
      console.error('[createUserDataExport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create export' });
    }
  }

  async getUserDataExport(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const exportJob = await userManagementService.getUserDataExport(exportId);

      if (!exportJob) {
        res.status(404).json({ success: false, message: 'Export not found' });
        return;
      }

      res.json({ success: true, data: exportJob });
    } catch (error: any) {
      console.error('[getUserDataExport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get export' });
    }
  }

  async listMyDataExports(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const exports = await userManagementService.listUserDataExports(userId);
      res.json({ success: true, data: exports });
    } catch (error: any) {
      console.error('[listMyDataExports] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list exports' });
    }
  }

  async downloadDataExport(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      await userManagementService.trackExportDownload(exportId);

      res.json({ success: true, message: 'Download tracked' });
    } catch (error: any) {
      console.error('[downloadDataExport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to track download' });
    }
  }

  // ========================================
  // USER TAGS
  // ========================================

  async createUserTag(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, description, color, organizationId } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: 'Tag name is required' });
        return;
      }

      const tag = await userManagementService.createUserTag(name, description, color, organizationId, adminId);
      res.status(201).json({ success: true, data: tag });
    } catch (error: any) {
      console.error('[createUserTag] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create tag' });
    }
  }

  async assignTagToUser(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId, tagId } = req.params;
      const assignment = await userManagementService.assignTagToUser(userId, tagId, adminId);

      res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
      console.error('[assignTagToUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to assign tag' });
    }
  }

  async removeTagFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tagId } = req.params;
      await userManagementService.removeTagFromUser(userId, tagId);

      res.json({ success: true, message: 'Tag removed from user' });
    } catch (error: any) {
      console.error('[removeTagFromUser] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove tag' });
    }
  }

  async getUserTags(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const tags = await userManagementService.getUserTags(userId);

      res.json({ success: true, data: tags });
    } catch (error: any) {
      console.error('[getUserTags] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user tags' });
    }
  }

  async listUserTags(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;
      const tags = await userManagementService.listUserTags(organizationId);

      res.json({ success: true, data: tags });
    } catch (error: any) {
      console.error('[listUserTags] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list tags' });
    }
  }

  // ========================================
  // USER NOTES
  // ========================================

  async createUserNote(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userId } = req.params;
      const { subject, content, category, isFlagged } = req.body;

      if (!content) {
        res.status(400).json({ success: false, message: 'Content is required' });
        return;
      }

      const note = await userManagementService.createUserNote(
        userId,
        adminId,
        subject,
        content,
        category,
        isFlagged
      );

      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      console.error('[createUserNote] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create note' });
    }
  }

  async getUserNotes(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const notes = await userManagementService.getUserNotes(userId);

      res.json({ success: true, data: notes });
    } catch (error: any) {
      console.error('[getUserNotes] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get notes' });
    }
  }

  async updateUserNote(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const note = await userManagementService.updateUserNote(noteId, req.body);

      res.json({ success: true, data: note });
    } catch (error: any) {
      console.error('[updateUserNote] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update note' });
    }
  }

  async deleteUserNote(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      await userManagementService.deleteUserNote(noteId);

      res.json({ success: true, message: 'Note deleted' });
    } catch (error: any) {
      console.error('[deleteUserNote] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete note' });
    }
  }

  // ========================================
  // USER GROUPS
  // ========================================

  async createUserGroup(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, description, organizationId, isDynamic, dynamicCriteria } = req.body;

      if (!name || !organizationId) {
        res.status(400).json({ success: false, message: 'Name and organization ID are required' });
        return;
      }

      const group = await userManagementService.createUserGroup(
        name,
        description,
        organizationId,
        adminId,
        isDynamic,
        dynamicCriteria
      );

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      console.error('[createUserGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create group' });
    }
  }

  async addUserToGroup(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { groupId, userId } = req.params;
      const membership = await userManagementService.addUserToGroup(groupId, userId, adminId);

      res.status(201).json({ success: true, data: membership });
    } catch (error: any) {
      console.error('[addUserToGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to add user to group' });
    }
  }

  async removeUserFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      await userManagementService.removeUserFromGroup(groupId, userId);

      res.json({ success: true, message: 'User removed from group' });
    } catch (error: any) {
      console.error('[removeUserFromGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove user from group' });
    }
  }

  async getGroupMembers(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const members = await userManagementService.getGroupMembers(groupId);

      res.json({ success: true, data: members });
    } catch (error: any) {
      console.error('[getGroupMembers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get group members' });
    }
  }

  async listUserGroups(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;
      const groups = await userManagementService.listUserGroups(organizationId);

      res.json({ success: true, data: groups });
    } catch (error: any) {
      console.error('[listUserGroups] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list groups' });
    }
  }

  // ========================================
  // ACCOUNT ACTIONS & STATISTICS
  // ========================================

  async getAccountActions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const actions = await userManagementService.getAccountActions(userId, limit);
      res.json({ success: true, data: actions });
    } catch (error: any) {
      console.error('[getAccountActions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get account actions' });
    }
  }

  async getUserActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const summary = await userManagementService.getUserActivitySummary(userId);

      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getUserActivitySummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get activity summary' });
    }
  }

  async getActiveUsersSummary(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const users = await userManagementService.getActiveUsersSummary(limit);

      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[getActiveUsersSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active users summary' });
    }
  }
}

export const userManagementController = new UserManagementController();
