import { Request, Response } from 'express';
import { AdaptiveAssessmentService } from '../services/adaptive-assessment.service';
import { pool } from '../config/db';

const adaptiveService = new AdaptiveAssessmentService(pool);

export class AdaptiveAssessmentController {
  // Create adaptive assessment configuration
  async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await adaptiveService.createAdaptiveConfig(req.body);
      res.status(201).json({
        success: true,
        message: 'Adaptive configuration created successfully',
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create adaptive configuration',
      });
    }
  }

  // Get adaptive configuration
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const config = await adaptiveService.getAdaptiveConfig(assessmentId);

      if (!config) {
        res.status(404).json({
          success: false,
          message: 'Adaptive configuration not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get adaptive configuration',
      });
    }
  }

  // Start adaptive session
  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { userId } = req.body;

      const session = await adaptiveService.startAdaptiveSession(assessmentId, userId);

      res.status(201).json({
        success: true,
        message: 'Adaptive session started',
        data: session,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start adaptive session',
      });
    }
  }

  // Get session details
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const session = await adaptiveService.getSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get session',
      });
    }
  }

  // Get next question
  async getNextQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const question = await adaptiveService.getNextQuestion(sessionId);

      if (!question) {
        res.status(200).json({
          success: true,
          message: 'No more questions available or session complete',
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get next question',
      });
    }
  }

  // Submit question response
  async submitResponse(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const response = req.body;

      const result = await adaptiveService.submitQuestionResponse(sessionId, response);

      res.status(200).json({
        success: true,
        message: 'Response submitted successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit response',
      });
    }
  }

  // Complete session
  async completeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      await adaptiveService.completeSession(sessionId);

      const session = await adaptiveService.getSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Session completed successfully',
        data: session,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete session',
      });
    }
  }

  // Get session statistics
  async getSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const stats = await adaptiveService.getSessionStatistics(sessionId);

      if (!stats) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get session statistics',
      });
    }
  }

  // Get user ability history
  async getUserAbilityHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId, assessmentId } = req.params;
      const history = await adaptiveService.getUserAbilityHistory(userId, assessmentId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get ability history',
      });
    }
  }
}
