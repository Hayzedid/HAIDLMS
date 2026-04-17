import { Request, Response } from 'express';
import { aiTutorService } from '../services/ai-tutor.service';

/**
 * AI Socratic Tutor Controller
 * Handles requests for AI-powered tutoring with explain-only mode
 */

export class AITutorController {
  /**
   * Start new chat session
   * POST /api/ai-tutor/sessions/start
   */
  async startChatSession(req: Request, res: Response): Promise<void> {
    try {
      const {
        courseId,
        lessonId,
        assessmentId,
        problemId,
        contextType,
        studentCodeContext,
      } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!userId || !contextType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, contextType',
        });
        return;
      }

      const session = await aiTutorService.startChatSession({
        userId,
        courseId,
        lessonId,
        assessmentId,
        problemId,
        contextType,
        studentCodeContext,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('[AITutorController] Start session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start chat session',
      });
    }
  }

  /**
   * Send message to AI tutor
   * POST /api/ai-tutor/sessions/:sessionId/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { content, codeSnippet } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: content',
        });
        return;
      }

      const message = await aiTutorService.sendMessage({
        sessionId,
        userId,
        content,
        codeSnippet,
      });

      res.json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      console.error('[AITutorController] Send message error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * Get error explanation
   * POST /api/ai-tutor/error-explanation
   */
  async explainError(req: Request, res: Response): Promise<void> {
    try {
      const {
        sessionId,
        errorMessage,
        studentCode,
        language,
        lineNumber,
      } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!userId || !errorMessage || !studentCode || !language) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, errorMessage, studentCode, language',
        });
        return;
      }

      const explanation = await aiTutorService.explainError({
        userId,
        sessionId,
        errorMessage,
        studentCode,
        language,
        lineNumber,
      });

      res.json({
        success: true,
        data: explanation,
      });
    } catch (error: any) {
      console.error('[AITutorController] Explain error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate error explanation',
      });
    }
  }

  /**
   * Generate extension challenge
   * POST /api/ai-tutor/challenges/generate
   */
  async generateChallenge(req: Request, res: Response): Promise<void> {
    try {
      const {
        sessionId,
        baseProblemId,
        studentCode,
        language,
      } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!userId || !studentCode || !language) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, studentCode, language',
        });
        return;
      }

      const challenge = await aiTutorService.generateExtensionChallenge({
        userId,
        sessionId,
        baseProblemId,
        studentCode,
        language,
      });

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error: any) {
      console.error('[AITutorController] Generate challenge error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate challenge',
      });
    }
  }

  /**
   * Accept extension challenge
   * POST /api/ai-tutor/challenges/:challengeId/accept
   */
  async acceptChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const userId = req.user?.id || req.body.userId;

      await aiTutorService.acceptChallenge(challengeId, userId);

      res.json({
        success: true,
        message: 'Challenge accepted',
      });
    } catch (error: any) {
      console.error('[AITutorController] Accept challenge error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept challenge',
      });
    }
  }

  /**
   * Submit challenge solution
   * POST /api/ai-tutor/challenges/:challengeId/submit
   */
  async submitChallengeSolution(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const { solution } = req.body;

      const userId = req.user?.id || req.body.userId;

      if (!solution) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: solution',
        });
        return;
      }

      const result = await aiTutorService.submitChallengeSolution({
        challengeId,
        userId,
        solution,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AITutorController] Submit challenge error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit challenge solution',
      });
    }
  }

  /**
   * Generate concept check question
   * POST /api/ai-tutor/concept-check
   */
  async generateConceptCheck(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, conceptName, context } = req.body;

      if (!sessionId || !conceptName || !context) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: sessionId, conceptName, context',
        });
        return;
      }

      const conceptCheck = await aiTutorService.generateConceptCheck({
        sessionId,
        conceptName,
        context,
      });

      res.json({
        success: true,
        data: conceptCheck,
      });
    } catch (error: any) {
      console.error('[AITutorController] Generate concept check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate concept check',
      });
    }
  }

  /**
   * Submit concept check answer
   * POST /api/ai-tutor/concept-check/:checkId/answer
   */
  async answerConceptCheck(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const { answer } = req.body;

      if (!answer) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: answer',
        });
        return;
      }

      const result = await aiTutorService.answerConceptCheck({
        checkId,
        answer,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AITutorController] Answer concept check error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to answer concept check',
      });
    }
  }

  /**
   * End chat session
   * POST /api/ai-tutor/sessions/:sessionId/end
   */
  async endChatSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || req.body.userId;

      await aiTutorService.endChatSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Session ended successfully',
      });
    } catch (error: any) {
      console.error('[AITutorController] End session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to end session',
      });
    }
  }

  /**
   * Get session history
   * GET /api/ai-tutor/sessions/:sessionId
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || req.query.userId as string;

      const session = await aiTutorService.getSession(sessionId, userId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('[AITutorController] Get session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get session',
      });
    }
  }

  /**
   * Get user's active sessions
   * GET /api/ai-tutor/sessions/user/:userId
   */
  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const sessions = await aiTutorService.getUserSessions(userId);

      res.json({
        success: true,
        data: sessions,
        count: sessions.length,
      });
    } catch (error: any) {
      console.error('[AITutorController] Get user sessions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user sessions',
      });
    }
  }

  /**
   * Get user learning patterns
   * GET /api/ai-tutor/learning-patterns/:userId
   */
  async getLearningPatterns(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const patterns = await aiTutorService.getLearningPatterns(userId);

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      console.error('[AITutorController] Get learning patterns error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get learning patterns',
      });
    }
  }

  /**
   * Get usage statistics
   * GET /api/ai-tutor/stats/:userId
   */
  async getUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const stats = await aiTutorService.getUsageStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[AITutorController] Get usage stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get usage stats',
      });
    }
  }

  /**
   * Mark error explanation as helpful/not helpful
   * POST /api/ai-tutor/error-explanation/:explanationId/feedback
   */
  async feedbackOnExplanation(req: Request, res: Response): Promise<void> {
    try {
      const { explanationId } = req.params;
      const { wasHelpful, resolvedIndependently } = req.body;

      await aiTutorService.updateExplanationFeedback({
        explanationId,
        wasHelpful,
        resolvedIndependently,
      });

      res.json({
        success: true,
        message: 'Feedback recorded',
      });
    } catch (error: any) {
      console.error('[AITutorController] Feedback error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record feedback',
      });
    }
  }

  /**
   * Get safety violations (instructor/admin view)
   * GET /api/ai-tutor/safety-logs
   */
  async getSafetyLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId, severity, limit } = req.query;

      const logs = await aiTutorService.getSafetyLogs({
        userId: userId as string,
        severity: severity as string,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      console.error('[AITutorController] Get safety logs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get safety logs',
      });
    }
  }
}

export const aiTutorController = new AITutorController();
