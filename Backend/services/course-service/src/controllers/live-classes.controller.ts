import { Request, Response } from 'express';
import { liveClassesService } from '../services/live-classes.service';

export class LiveClassesController {
  // ========================================
  // LIVE CLASSES
  // ========================================

  async createLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = (req as any).user?.userId;
      if (!instructorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        courseId,
        moduleId,
        title,
        description,
        classType,
        scheduledStartTime,
        scheduledEndTime,
        timezone,
        isRecurring,
        recurrencePattern,
        accessType,
        requiresApproval,
        maxParticipants,
        password,
        meetingProvider,
        meetingUrl,
        meetingId,
        meetingPassword,
        enableRecording,
        enableChat,
        enableScreenSharing,
        enableWhiteboard,
        enableBreakoutRooms,
        enablePolls,
        enableQa,
        enableHandRaise,
        tags,
        attachments
      } = req.body;

      if (!title || !scheduledStartTime || !scheduledEndTime) {
        res.status(400).json({ success: false, message: 'Title and scheduled times are required' });
        return;
      }

      const liveClass = await liveClassesService.createLiveClass({
        courseId,
        moduleId,
        instructorId,
        title,
        description,
        classType,
        scheduledStartTime,
        scheduledEndTime,
        timezone,
        isRecurring,
        recurrencePattern,
        accessType,
        requiresApproval,
        maxParticipants,
        password,
        meetingProvider,
        meetingUrl,
        meetingId,
        meetingPassword,
        enableRecording,
        enableChat,
        enableScreenSharing,
        enableWhiteboard,
        enableBreakoutRooms,
        enablePolls,
        enableQa,
        enableHandRaise,
        tags,
        attachments
      });

      res.status(201).json({ success: true, data: liveClass });
    } catch (error: any) {
      console.error('[createLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create live class' });
    }
  }

  async getLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const liveClass = await liveClassesService.getLiveClass(id);

      if (!liveClass) {
        res.status(404).json({ success: false, message: 'Live class not found' });
        return;
      }

      res.json({ success: true, data: liveClass });
    } catch (error: any) {
      console.error('[getLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get live class' });
    }
  }

  async listLiveClasses(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, instructorId, classType, status, fromDate, toDate, limit, offset } = req.query;

      const filters: any = {};
      if (courseId) filters.courseId = courseId as string;
      if (instructorId) filters.instructorId = instructorId as string;
      if (classType) filters.classType = classType as string;
      if (status) filters.status = status as string;
      if (fromDate) filters.fromDate = fromDate as string;
      if (toDate) filters.toDate = toDate as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await liveClassesService.listLiveClasses(filters);
      res.json({ success: true, data: result.classes, total: result.total });
    } catch (error: any) {
      console.error('[listLiveClasses] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list live classes' });
    }
  }

  async updateLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const liveClass = await liveClassesService.updateLiveClass(id, updates);
      res.json({ success: true, data: liveClass });
    } catch (error: any) {
      console.error('[updateLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update live class' });
    }
  }

  async deleteLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await liveClassesService.deleteLiveClass(id);
      res.json({ success: true, message: 'Live class deleted successfully' });
    } catch (error: any) {
      console.error('[deleteLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete live class' });
    }
  }

  async startLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const liveClass = await liveClassesService.startLiveClass(id);
      res.json({ success: true, data: liveClass });
    } catch (error: any) {
      console.error('[startLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start live class' });
    }
  }

  async endLiveClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const liveClass = await liveClassesService.endLiveClass(id);
      res.json({ success: true, data: liveClass });
    } catch (error: any) {
      console.error('[endLiveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to end live class' });
    }
  }

  async getUpcomingClasses(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const classes = await liveClassesService.getUpcomingClasses(limit);
      res.json({ success: true, data: classes });
    } catch (error: any) {
      console.error('[getUpcomingClasses] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get upcoming classes' });
    }
  }

  // ========================================
  // PARTICIPANTS
  // ========================================

  async registerForClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const participant = await liveClassesService.registerParticipant(classId, userId, 'registered');
      res.status(201).json({ success: true, data: participant });
    } catch (error: any) {
      console.error('[registerForClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to register for class' });
    }
  }

  async updateParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { classId, userId } = req.params;
      const updates = req.body;
      const participant = await liveClassesService.updateParticipant(classId, userId, updates);
      res.json({ success: true, data: participant });
    } catch (error: any) {
      console.error('[updateParticipant] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update participant' });
    }
  }

  async joinClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await liveClassesService.joinClass(classId, userId);
      res.json({ success: true, message: 'Joined class successfully' });
    } catch (error: any) {
      console.error('[joinClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to join class' });
    }
  }

  async leaveClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await liveClassesService.leaveClass(classId, userId);
      res.json({ success: true, message: 'Left class successfully' });
    } catch (error: any) {
      console.error('[leaveClass] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to leave class' });
    }
  }

  async getClassParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const { isPresent, role, registrationStatus } = req.query;

      const filters: any = {};
      if (isPresent !== undefined) filters.isPresent = isPresent === 'true';
      if (role) filters.role = role as string;
      if (registrationStatus) filters.registrationStatus = registrationStatus as string;

      const participants = await liveClassesService.getClassParticipants(classId, filters);
      res.json({ success: true, data: participants });
    } catch (error: any) {
      console.error('[getClassParticipants] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get participants' });
    }
  }

  async getActiveParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const participants = await liveClassesService.getActiveParticipants(classId);
      res.json({ success: true, data: participants });
    } catch (error: any) {
      console.error('[getActiveParticipants] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active participants' });
    }
  }

  // ========================================
  // BREAKOUT ROOMS
  // ========================================

  async createBreakoutRoom(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const { name, roomNumber, description, assignmentMethod, maxParticipants, durationMinutes } = req.body;

      if (!name || roomNumber === undefined) {
        res.status(400).json({ success: false, message: 'Name and room number are required' });
        return;
      }

      const room = await liveClassesService.createBreakoutRoom(classId, name, roomNumber, {
        description,
        assignmentMethod,
        maxParticipants,
        durationMinutes
      });

      res.status(201).json({ success: true, data: room });
    } catch (error: any) {
      console.error('[createBreakoutRoom] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create breakout room' });
    }
  }

  async assignToBreakoutRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { userId, classId } = req.body;
      const assignedBy = (req as any).user?.userId;

      if (!assignedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const assignment = await liveClassesService.assignToBreakoutRoom(roomId, userId, classId, assignedBy);
      res.json({ success: true, data: assignment });
    } catch (error: any) {
      console.error('[assignToBreakoutRoom] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to assign to breakout room' });
    }
  }

  async openBreakoutRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await liveClassesService.openBreakoutRoom(roomId);
      res.json({ success: true, data: room });
    } catch (error: any) {
      console.error('[openBreakoutRoom] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to open breakout room' });
    }
  }

  async closeBreakoutRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await liveClassesService.closeBreakoutRoom(roomId);
      res.json({ success: true, data: room });
    } catch (error: any) {
      console.error('[closeBreakoutRoom] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to close breakout room' });
    }
  }

  async getBreakoutRooms(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const rooms = await liveClassesService.getBreakoutRooms(classId);
      res.json({ success: true, data: rooms });
    } catch (error: any) {
      console.error('[getBreakoutRooms] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get breakout rooms' });
    }
  }

  // ========================================
  // WHITEBOARD
  // ========================================

  async createWhiteboardSession(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;
      const { title, roomId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const session = await liveClassesService.createWhiteboardSession(classId, userId, title, roomId);
      res.status(201).json({ success: true, data: session });
    } catch (error: any) {
      console.error('[createWhiteboardSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create whiteboard session' });
    }
  }

  async updateWhiteboardCanvas(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { canvasData } = req.body;

      const session = await liveClassesService.updateWhiteboardCanvas(sessionId, canvasData);
      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[updateWhiteboardCanvas] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update whiteboard' });
    }
  }

  async getWhiteboardSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await liveClassesService.getWhiteboardSession(sessionId);
      res.json({ success: true, data: session });
    } catch (error: any) {
      console.error('[getWhiteboardSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get whiteboard session' });
    }
  }

  // ========================================
  // CHAT
  // ========================================

  async sendChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;
      const { content, roomId, messageType, isPrivate, recipientId, fileUrl, fileName, fileSize, fileType, replyToId } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!content) {
        res.status(400).json({ success: false, message: 'Content is required' });
        return;
      }

      const message = await liveClassesService.sendChatMessage(classId, userId, content, {
        roomId,
        messageType,
        isPrivate,
        recipientId,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        replyToId
      });

      res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      console.error('[sendChatMessage] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send chat message' });
    }
  }

  async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const { roomId, limit, beforeMessageId } = req.query;

      const messages = await liveClassesService.getChatMessages(classId, {
        roomId: roomId as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        beforeMessageId: beforeMessageId as string
      });

      res.json({ success: true, data: messages });
    } catch (error: any) {
      console.error('[getChatMessages] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get chat messages' });
    }
  }

  async deleteChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await liveClassesService.deleteChatMessage(messageId, userId);
      res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error: any) {
      console.error('[deleteChatMessage] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete message' });
    }
  }

  // ========================================
  // POLLS
  // ========================================

  async createPoll(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;
      const { question, pollType, options, isAnonymous, allowMultipleAnswers, showResultsImmediately } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!question) {
        res.status(400).json({ success: false, message: 'Question is required' });
        return;
      }

      const poll = await liveClassesService.createPoll({
        classId,
        createdBy: userId,
        question,
        pollType,
        options,
        isAnonymous,
        allowMultipleAnswers,
        showResultsImmediately
      });

      res.status(201).json({ success: true, data: poll });
    } catch (error: any) {
      console.error('[createPoll] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create poll' });
    }
  }

  async startPoll(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const poll = await liveClassesService.startPoll(pollId);
      res.json({ success: true, data: poll });
    } catch (error: any) {
      console.error('[startPoll] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start poll' });
    }
  }

  async closePoll(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const poll = await liveClassesService.closePoll(pollId);
      res.json({ success: true, data: poll });
    } catch (error: any) {
      console.error('[closePoll] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to close poll' });
    }
  }

  async submitPollResponse(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const userId = (req as any).user?.userId;
      const response = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await liveClassesService.submitPollResponse(pollId, userId, response);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[submitPollResponse] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to submit poll response' });
    }
  }

  async getPollResults(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const results = await liveClassesService.getPollResults(pollId);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('[getPollResults] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get poll results' });
    }
  }

  // ========================================
  // Q&A
  // ========================================

  async askQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;
      const { question, isAnonymous } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!question) {
        res.status(400).json({ success: false, message: 'Question is required' });
        return;
      }

      const result = await liveClassesService.askQuestion(classId, userId, question, isAnonymous);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('[askQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to ask question' });
    }
  }

  async answerQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const userId = (req as any).user?.userId;
      const { answer } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!answer) {
        res.status(400).json({ success: false, message: 'Answer is required' });
        return;
      }

      const result = await liveClassesService.answerQuestion(questionId, userId, answer);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[answerQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to answer question' });
    }
  }

  async upvoteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await liveClassesService.upvoteQuestion(questionId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[upvoteQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to upvote question' });
    }
  }

  async getClassQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const { status } = req.query;

      const questions = await liveClassesService.getClassQuestions(classId, status as string);
      res.json({ success: true, data: questions });
    } catch (error: any) {
      console.error('[getClassQuestions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get questions' });
    }
  }

  // ========================================
  // HAND RAISES
  // ========================================

  async raiseHand(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await liveClassesService.raiseHand(classId, userId, reason);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[raiseHand] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to raise hand' });
    }
  }

  async lowerHand(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await liveClassesService.lowerHand(classId, userId);
      res.json({ success: true, message: 'Hand lowered successfully' });
    } catch (error: any) {
      console.error('[lowerHand] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to lower hand' });
    }
  }

  async acknowledgeHand(req: Request, res: Response): Promise<void> {
    try {
      const { handRaiseId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await liveClassesService.acknowledgeHand(handRaiseId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[acknowledgeHand] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to acknowledge hand' });
    }
  }

  async getRaisedHands(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const hands = await liveClassesService.getRaisedHands(classId);
      res.json({ success: true, data: hands });
    } catch (error: any) {
      console.error('[getRaisedHands] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get raised hands' });
    }
  }

  // ========================================
  // RECORDINGS
  // ========================================

  async createRecording(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const recordingData = req.body;

      const recording = await liveClassesService.createRecording(classId, recordingData);
      res.status(201).json({ success: true, data: recording });
    } catch (error: any) {
      console.error('[createRecording] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create recording' });
    }
  }

  async getClassRecordings(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const recordings = await liveClassesService.getClassRecordings(classId);
      res.json({ success: true, data: recordings });
    } catch (error: any) {
      console.error('[getClassRecordings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get recordings' });
    }
  }

  async trackRecordingView(req: Request, res: Response): Promise<void> {
    try {
      const { recordingId } = req.params;
      const userId = (req as any).user?.userId;
      const viewData = req.body;

      const view = await liveClassesService.trackRecordingView(recordingId, userId, viewData);
      res.json({ success: true, data: view });
    } catch (error: any) {
      console.error('[trackRecordingView] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to track recording view' });
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getClassAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const analytics = await liveClassesService.getClassAnalytics(classId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getClassAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get analytics' });
    }
  }
}

export const liveClassesController = new LiveClassesController();
