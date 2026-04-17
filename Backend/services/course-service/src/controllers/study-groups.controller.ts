import { Request, Response } from 'express';
import { studyGroupsService } from '../services/study-groups.service';

export class StudyGroupsController {
  // ========================================
  // STUDY GROUPS
  // ========================================

  async createStudyGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        name,
        description,
        courseId,
        groupType,
        isPrivate,
        requiresApproval,
        maxMembers,
        learningGoals,
        focusAreas,
        targetCompletionDate,
        meetingSchedule,
        tags
      } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }

      const group = await studyGroupsService.createStudyGroup({
        name,
        description,
        courseId,
        createdBy: userId,
        groupType,
        isPrivate,
        requiresApproval,
        maxMembers,
        learningGoals,
        focusAreas,
        targetCompletionDate,
        meetingSchedule,
        tags
      });

      res.status(201).json({ success: true, data: group });
    } catch (error: any) {
      console.error('[createStudyGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create study group' });
    }
  }

  async getStudyGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const group = await studyGroupsService.getStudyGroup(id);

      if (!group) {
        res.status(404).json({ success: false, message: 'Study group not found' });
        return;
      }

      res.json({ success: true, data: group });
    } catch (error: any) {
      console.error('[getStudyGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get study group' });
    }
  }

  async listStudyGroups(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, groupType, status, isPrivate, search, limit, offset } = req.query;

      const filters: any = {};
      if (courseId) filters.courseId = courseId as string;
      if (groupType) filters.groupType = groupType as string;
      if (status) filters.status = status as string;
      if (isPrivate !== undefined) filters.isPrivate = isPrivate === 'true';
      if (search) filters.search = search as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await studyGroupsService.listStudyGroups(filters);
      res.json({ success: true, data: result.groups, total: result.total });
    } catch (error: any) {
      console.error('[listStudyGroups] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list study groups' });
    }
  }

  async updateStudyGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updates = req.body;
      const group = await studyGroupsService.updateStudyGroup(id, updates);

      res.json({ success: true, data: group });
    } catch (error: any) {
      console.error('[updateStudyGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update study group' });
    }
  }

  async deleteStudyGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await studyGroupsService.deleteStudyGroup(id);
      res.json({ success: true, message: 'Study group deleted successfully' });
    } catch (error: any) {
      console.error('[deleteStudyGroup] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete study group' });
    }
  }

  // ========================================
  // MEMBERS
  // ========================================

  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { userId, role, status } = req.body;

      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      const member = await studyGroupsService.addMember(
        groupId,
        userId,
        role || 'member',
        status || 'active'
      );

      res.status(201).json({ success: true, data: member });
    } catch (error: any) {
      console.error('[addMember] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to add member' });
    }
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      await studyGroupsService.removeMember(groupId, userId);
      res.json({ success: true, message: 'Member removed successfully' });
    } catch (error: any) {
      console.error('[removeMember] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove member' });
    }
  }

  async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      const updates = req.body;
      const member = await studyGroupsService.updateMember(groupId, userId, updates);
      res.json({ success: true, data: member });
    } catch (error: any) {
      console.error('[updateMember] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update member' });
    }
  }

  async listMembers(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { role, status } = req.query;

      const filters: any = { groupId };
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;

      const members = await studyGroupsService.listMembers(filters);
      res.json({ success: true, data: members });
    } catch (error: any) {
      console.error('[listMembers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list members' });
    }
  }

  async inviteMember(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { userIds, message } = req.body;
      const invitedBy = (req as any).user?.userId;

      if (!invitedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ success: false, message: 'User IDs are required' });
        return;
      }

      await studyGroupsService.inviteMembers(groupId, userIds, invitedBy, message);
      res.json({ success: true, message: 'Invitations sent successfully' });
    } catch (error: any) {
      console.error('[inviteMember] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to invite members' });
    }
  }

  // ========================================
  // SESSIONS
  // ========================================

  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        title,
        description,
        sessionType,
        scheduledStartTime,
        scheduledEndTime,
        meetingLink,
        meetingPassword,
        location,
        maxAttendees,
        agenda,
        tags
      } = req.body;

      if (!title || !scheduledStartTime || !scheduledEndTime) {
        res.status(400).json({ success: false, message: 'Title and scheduled times are required' });
        return;
      }

      const session = await studyGroupsService.createSession({
        groupId,
        title,
        description,
        sessionType,
        scheduledStartTime,
        scheduledEndTime,
        createdBy: userId,
        meetingLink,
        meetingPassword,
        location,
        maxAttendees,
        agenda,
        tags
      });

      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      console.error('[createSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create session' });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await studyGroupsService.getSession(sessionId);

      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }

      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[getSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get session' });
    }
  }

  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { sessionType, status, fromDate, toDate, limit, offset } = req.query;

      const filters: any = { groupId };
      if (sessionType) filters.sessionType = sessionType as string;
      if (status) filters.status = status as string;
      if (fromDate) filters.fromDate = fromDate as string;
      if (toDate) filters.toDate = toDate as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const sessions = await studyGroupsService.listSessions(filters);
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      console.error('[listSessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list sessions' });
    }
  }

  async updateSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      const session = await studyGroupsService.updateSession(sessionId, updates);
      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[updateSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update session' });
    }
  }

  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      await studyGroupsService.deleteSession(sessionId);
      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error: any) {
      console.error('[deleteSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete session' });
    }
  }

  async rsvpSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?.userId;
      const { rsvpStatus } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!rsvpStatus) {
        res.status(400).json({ success: false, message: 'RSVP status is required' });
        return;
      }

      const attendance = await studyGroupsService.rsvpSession(sessionId, userId, rsvpStatus);
      res.json({ success: true, data: attendance });
    } catch (error: any) {
      console.error('[rsvpSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to RSVP' });
    }
  }

  async checkInSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const attendance = await studyGroupsService.checkInSession(sessionId, userId);
      res.json({ success: true, data: attendance });
    } catch (error: any) {
      console.error('[checkInSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check in' });
    }
  }

  async getSessionAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const attendance = await studyGroupsService.getSessionAttendance(sessionId);
      res.json({ success: true, data: attendance });
    } catch (error: any) {
      console.error('[getSessionAttendance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get attendance' });
    }
  }

  // ========================================
  // RESOURCES
  // ========================================

  async createResource(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { title, description, resourceType, url, fileUrl, fileName, fileSize, tags } = req.body;

      if (!title || !resourceType) {
        res.status(400).json({ success: false, message: 'Title and resource type are required' });
        return;
      }

      const resource = await studyGroupsService.createResource({
        groupId,
        uploadedBy: userId,
        title,
        description,
        resourceType,
        url,
        fileUrl,
        fileName,
        fileSize,
        tags
      });

      res.status(201).json({ success: true, data: resource });
    } catch (error: any) {
      console.error('[createResource] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create resource' });
    }
  }

  async listResources(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { resourceType, limit, offset } = req.query;

      const filters: any = { groupId };
      if (resourceType) filters.resourceType = resourceType as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const resources = await studyGroupsService.listResources(filters);
      res.json({ success: true, data: resources });
    } catch (error: any) {
      console.error('[listResources] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list resources' });
    }
  }

  async updateResource(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;
      const updates = req.body;
      const resource = await studyGroupsService.updateResource(resourceId, updates);
      res.json({ success: true, data: resource });
    } catch (error: any) {
      console.error('[updateResource] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update resource' });
    }
  }

  async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      const { resourceId } = req.params;
      await studyGroupsService.deleteResource(resourceId);
      res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (error: any) {
      console.error('[deleteResource] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete resource' });
    }
  }

  // ========================================
  // COLLABORATIVE NOTES
  // ========================================

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { title, content, sessionId, tags } = req.body;

      if (!title || !content) {
        res.status(400).json({ success: false, message: 'Title and content are required' });
        return;
      }

      const note = await studyGroupsService.createNote({
        groupId,
        title,
        content,
        createdBy: userId,
        lastEditedBy: userId,
        sessionId,
        tags
      });

      res.status(201).json({ success: true, data: note });
    } catch (error: any) {
      console.error('[createNote] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create note' });
    }
  }

  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { content, editSummary } = req.body;

      if (!content) {
        res.status(400).json({ success: false, message: 'Content is required' });
        return;
      }

      const note = await studyGroupsService.updateNote(noteId, userId, content, editSummary);
      res.json({ success: true, data: note });
    } catch (error: any) {
      console.error('[updateNote] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update note' });
    }
  }

  async listNotes(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { sessionId, limit, offset } = req.query;

      const filters: any = { groupId };
      if (sessionId) filters.sessionId = sessionId as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const notes = await studyGroupsService.listNotes(filters);
      res.json({ success: true, data: notes });
    } catch (error: any) {
      console.error('[listNotes] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list notes' });
    }
  }

  async getNoteHistory(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const history = await studyGroupsService.getNoteHistory(noteId);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getNoteHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get note history' });
    }
  }

  // ========================================
  // TASKS
  // ========================================

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { title, description, assignedTo, dueDate, priority, tags } = req.body;

      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const task = await studyGroupsService.createTask({
        groupId,
        title,
        description,
        assignedTo,
        assignedBy: userId,
        dueDate,
        priority,
        tags
      });

      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      console.error('[createTask] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create task' });
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      const task = await studyGroupsService.updateTask(taskId, updates);
      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('[updateTask] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update task' });
    }
  }

  async completeTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const task = await studyGroupsService.completeTask(taskId, userId);
      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('[completeTask] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to complete task' });
    }
  }

  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { assignedTo, status, priority, limit, offset } = req.query;

      const filters: any = { groupId };
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (status) filters.status = status as string;
      if (priority) filters.priority = priority as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const tasks = await studyGroupsService.listTasks(filters);
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('[listTasks] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list tasks' });
    }
  }

  // ========================================
  // ACCOUNTABILITY PARTNERS
  // ========================================

  async createAccountabilityPartnership(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { partnerId, groupId, goals, checkInFrequency } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!partnerId) {
        res.status(400).json({ success: false, message: 'Partner ID is required' });
        return;
      }

      const partnership = await studyGroupsService.createAccountabilityPartnership({
        user1Id: userId,
        user2Id: partnerId,
        groupId,
        goals,
        checkInFrequency
      });

      res.status(201).json({ success: true, data: partnership });
    } catch (error: any) {
      console.error('[createAccountabilityPartnership] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create partnership' });
    }
  }

  async listAccountabilityPartnerships(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { groupId, status } = req.query;

      const filters: any = { userId };
      if (groupId) filters.groupId = groupId as string;
      if (status) filters.status = status as string;

      const partnerships = await studyGroupsService.listAccountabilityPartnerships(filters);
      res.json({ success: true, data: partnerships });
    } catch (error: any) {
      console.error('[listAccountabilityPartnerships] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list partnerships' });
    }
  }

  // ========================================
  // STUDY LOGS
  // ========================================

  async createStudyLog(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { groupId, sessionId, studyDate, durationMinutes, topicsCovered, notes, moodRating } = req.body;

      if (!studyDate || !durationMinutes) {
        res.status(400).json({ success: false, message: 'Study date and duration are required' });
        return;
      }

      const log = await studyGroupsService.createStudyLog({
        userId,
        groupId,
        sessionId,
        studyDate,
        durationMinutes,
        topicsCovered,
        notes,
        moodRating
      });

      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      console.error('[createStudyLog] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create study log' });
    }
  }

  async listStudyLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { groupId, fromDate, toDate, limit, offset } = req.query;

      const filters: any = { userId };
      if (groupId) filters.groupId = groupId as string;
      if (fromDate) filters.fromDate = fromDate as string;
      if (toDate) filters.toDate = toDate as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const logs = await studyGroupsService.listStudyLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[listStudyLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list study logs' });
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async aggregateAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const { date } = req.body;

      await studyGroupsService.aggregateAnalytics(groupId, date);
      res.json({ success: true, message: 'Analytics aggregated successfully' });
    } catch (error: any) {
      console.error('[aggregateAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to aggregate analytics' });
    }
  }

  async getGroupStats(req: Request, res: Response): Promise<void> {
    try {
      const { groupId } = req.params;
      const stats = await studyGroupsService.getGroupStats(groupId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getGroupStats] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get group stats' });
    }
  }

  async getMemberActivity(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, userId } = req.params;
      const activity = await studyGroupsService.getMemberActivity(groupId, userId);
      res.json({ success: true, data: activity });
    } catch (error: any) {
      console.error('[getMemberActivity] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get member activity' });
    }
  }
}

export const studyGroupsController = new StudyGroupsController();
