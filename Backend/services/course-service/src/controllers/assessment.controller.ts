import { Request, Response } from 'express';
import { assessmentService } from '../services/assessment.service';

export class AssessmentController {
  // ========================================
  // ASSESSMENTS
  // ========================================

  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const assessment = await assessmentService.createAssessment(params);
      res.status(201).json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('[createAssessment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create assessment' });
    }
  }

  async getAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assessment = await assessmentService.getAssessment(id);

      if (!assessment) {
        res.status(404).json({ success: false, message: 'Assessment not found' });
        return;
      }

      res.json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('[getAssessment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get assessment' });
    }
  }

  async listAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, moduleId, lessonId, assessmentType, status, createdBy, limit, offset } = req.query;

      const filters: any = {};
      if (courseId) filters.courseId = courseId as string;
      if (moduleId) filters.moduleId = moduleId as string;
      if (lessonId) filters.lessonId = lessonId as string;
      if (assessmentType) filters.assessmentType = assessmentType as string;
      if (status) filters.status = status as string;
      if (createdBy) filters.createdBy = createdBy as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await assessmentService.listAssessments(filters);
      res.json({ success: true, data: result.assessments, total: result.total });
    } catch (error: any) {
      console.error('[listAssessments] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list assessments' });
    }
  }

  async updateAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const assessment = await assessmentService.updateAssessment(id, updates);
      res.json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('[updateAssessment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update assessment' });
    }
  }

  async deleteAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await assessmentService.deleteAssessment(id);
      res.json({ success: true, message: 'Assessment deleted successfully' });
    } catch (error: any) {
      console.error('[deleteAssessment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete assessment' });
    }
  }

  async publishAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assessment = await assessmentService.publishAssessment(id);
      res.json({ success: true, data: assessment });
    } catch (error: any) {
      console.error('[publishAssessment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to publish assessment' });
    }
  }

  async getAssessmentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const summary = await assessmentService.getAssessmentSummary(id);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getAssessmentSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get assessment summary' });
    }
  }

  // ========================================
  // QUESTIONS
  // ========================================

  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body;

      if (!params.questionText || !params.questionType) {
        res.status(400).json({ success: false, message: 'Question text and type are required' });
        return;
      }

      const question = await assessmentService.createQuestion(params);
      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      console.error('[createQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create question' });
    }
  }

  async getQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const question = await assessmentService.getQuestion(questionId);

      if (!question) {
        res.status(404).json({ success: false, message: 'Question not found' });
        return;
      }

      res.json({ success: true, data: question });
    } catch (error: any) {
      console.error('[getQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get question' });
    }
  }

  async listQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const questions = await assessmentService.listQuestions(assessmentId);
      res.json({ success: true, data: questions });
    } catch (error: any) {
      console.error('[listQuestions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list questions' });
    }
  }

  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const updates = req.body;
      const question = await assessmentService.updateQuestion(questionId, updates);
      res.json({ success: true, data: question });
    } catch (error: any) {
      console.error('[updateQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update question' });
    }
  }

  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      await assessmentService.deleteQuestion(questionId);
      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error: any) {
      console.error('[deleteQuestion] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete question' });
    }
  }

  // ========================================
  // QUESTION OPTIONS
  // ========================================

  async createQuestionOption(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const params = { ...req.body, questionId };

      if (!params.optionText) {
        res.status(400).json({ success: false, message: 'Option text is required' });
        return;
      }

      const option = await assessmentService.createQuestionOption(params);
      res.status(201).json({ success: true, data: option });
    } catch (error: any) {
      console.error('[createQuestionOption] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create question option' });
    }
  }

  async listQuestionOptions(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const options = await assessmentService.listQuestionOptions(questionId);
      res.json({ success: true, data: options });
    } catch (error: any) {
      console.error('[listQuestionOptions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list question options' });
    }
  }

  async deleteQuestionOption(req: Request, res: Response): Promise<void> {
    try {
      const { optionId } = req.params;
      await assessmentService.deleteQuestionOption(optionId);
      res.json({ success: true, message: 'Question option deleted successfully' });
    } catch (error: any) {
      console.error('[deleteQuestionOption] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete question option' });
    }
  }

  // ========================================
  // ASSESSMENT ATTEMPTS
  // ========================================

  async startAttempt(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const attempt = await assessmentService.startAttempt(assessmentId, userId);
      res.status(201).json({ success: true, data: attempt });
    } catch (error: any) {
      console.error('[startAttempt] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to start attempt' });
    }
  }

  async getAttempt(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await assessmentService.getAttempt(attemptId);

      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found' });
        return;
      }

      res.json({ success: true, data: attempt });
    } catch (error: any) {
      console.error('[getAttempt] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get attempt' });
    }
  }

  async listUserAttempts(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const attempts = await assessmentService.listUserAttempts(assessmentId, userId);
      res.json({ success: true, data: attempts });
    } catch (error: any) {
      console.error('[listUserAttempts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list user attempts' });
    }
  }

  async listAllAttempts(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { status, limit, offset } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const attempts = await assessmentService.listAllAttempts(assessmentId, filters);
      res.json({ success: true, data: attempts });
    } catch (error: any) {
      console.error('[listAllAttempts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list all attempts' });
    }
  }

  async submitAttempt(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await assessmentService.submitAttempt(attemptId);
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      console.error('[submitAttempt] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to submit attempt' });
    }
  }

  // ========================================
  // ANSWERS
  // ========================================

  async saveAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, questionId } = req.params;
      const params = { ...req.body, attemptId, questionId };

      const answer = await assessmentService.saveAnswer(params);
      res.json({ success: true, data: answer });
    } catch (error: any) {
      console.error('[saveAnswer] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to save answer' });
    }
  }

  async getAttemptAnswers(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const answers = await assessmentService.getAttemptAnswers(attemptId);
      res.json({ success: true, data: answers });
    } catch (error: any) {
      console.error('[getAttemptAnswers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get attempt answers' });
    }
  }

  // ========================================
  // GRADING
  // ========================================

  async manualGradeAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { answerId } = req.params;
      const userId = (req as any).user?.userId;
      const { pointsEarned, feedback } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (pointsEarned === undefined) {
        res.status(400).json({ success: false, message: 'Points earned is required' });
        return;
      }

      const answer = await assessmentService.manualGradeAnswer(answerId, pointsEarned, feedback, userId);
      res.json({ success: true, data: answer });
    } catch (error: any) {
      console.error('[manualGradeAnswer] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to grade answer' });
    }
  }

  async completeGrading(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const userId = (req as any).user?.userId;
      const { instructorFeedback } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const attempt = await assessmentService.completeGrading(attemptId, userId, instructorFeedback);
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      console.error('[completeGrading] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to complete grading' });
    }
  }

  // ========================================
  // PROCTORING
  // ========================================

  async logProctoringEvent(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { eventType, eventData, severity } = req.body;

      if (!eventType) {
        res.status(400).json({ success: false, message: 'Event type is required' });
        return;
      }

      const event = await assessmentService.logProctoringEvent(attemptId, eventType, eventData, severity);
      res.json({ success: true, data: event });
    } catch (error: any) {
      console.error('[logProctoringEvent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to log proctoring event' });
    }
  }

  async getProctoringEvents(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const events = await assessmentService.getProctoringEvents(attemptId);
      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('[getProctoringEvents] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get proctoring events' });
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getQuestionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { questionId } = req.params;
      const analytics = await assessmentService.getQuestionAnalytics(questionId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getQuestionAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get question analytics' });
    }
  }

  async getAssessmentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const analytics = await assessmentService.getAssessmentAnalytics(assessmentId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getAssessmentAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get assessment analytics' });
    }
  }
}

export const assessmentController = new AssessmentController();
