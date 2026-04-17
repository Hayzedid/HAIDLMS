import { Request, Response } from 'express';
import { ProctoringServiceEnhanced } from '../services/proctoring.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProctoringController');

export class ProctoringControllerEnhanced {
  private proctoringService: ProctoringServiceEnhanced;

  constructor(pool: Pool) {
    this.proctoringService = new ProctoringServiceEnhanced(pool);
  }

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);
    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });
    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = await this.proctoringService.createProctoringSessionWithValidation(req.body);
      res.status(201).json({ id: sessionId, message: 'Proctoring session created' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create proctoring session');
    }
  };

  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, assessment_id, status, proctoring_mode } = req.query;
      const sessions = await this.proctoringService.getProctoringSessionsWithMetrics({
        user_id: user_id as string,
        assessment_id: assessment_id as string,
        status: status as string,
        proctoring_mode: proctoring_mode as string
      });
      res.json({ sessions, count: sessions.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get proctoring sessions');
    }
  };

  getSessionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const session = await this.proctoringService.getSessionByIdWithValidation(session_id);
      res.json(session);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get proctoring session');
    }
  };

  updateSessionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }
      await this.proctoringService.updateSessionStatusWithValidation(session_id, status);
      res.json({ message: 'Session status updated', session_id, status });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update session status');
    }
  };

  recordViolation = async (req: Request, res: Response): Promise<void> => {
    try {
      const violationId = await this.proctoringService.recordViolationWithValidation(req.body);
      res.status(201).json({ id: violationId, message: 'Violation recorded' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record violation');
    }
  };

  getViolations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const result = await this.proctoringService.getViolationsWithSummary(session_id);
      res.json(result);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get violations');
    }
  };

  recordFaceCapture = async (req: Request, res: Response): Promise<void> => {
    try {
      const captureId = await this.proctoringService.recordFaceCaptureWithValidation(req.body);
      res.status(201).json({ id: captureId, message: 'Face capture recorded' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record face capture');
    }
  };

  getFaceCaptures = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const { limit } = req.query;
      const captures = await this.proctoringService.getFaceCaptures(
        session_id,
        limit ? parseInt(limit as string) : undefined
      );
      res.json({ session_id, captures, count: captures.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get face captures');
    }
  };

  verifyIdentity = async (req: Request, res: Response): Promise<void> => {
    try {
      const verificationId = await this.proctoringService.verifyIdentityWithValidation(req.body);
      res.status(201).json({ id: verificationId, message: 'Identity verification initiated' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Verify identity');
    }
  };

  updateVerificationResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { verification_id } = req.params;
      const { is_verified, confidence } = req.body;
      if (is_verified === undefined || confidence === undefined) {
        res.status(400).json({ error: 'is_verified and confidence are required' });
        return;
      }
      await this.proctoringService.updateVerificationResultWithValidation(
        verification_id,
        is_verified,
        confidence
      );
      res.json({ message: 'Verification result updated', verification_id, is_verified });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update verification result');
    }
  };

  checkPlagiarism = async (req: Request, res: Response): Promise<void> => {
    try {
      const checkId = await this.proctoringService.checkPlagiarismWithValidation(req.body);
      res.status(201).json({ id: checkId, message: 'Plagiarism check initiated' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Check plagiarism');
    }
  };

  updatePlagiarismResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { check_id } = req.params;
      const { similarity_percent, is_plagiarized, matched_sources } = req.body;
      if (similarity_percent === undefined || is_plagiarized === undefined) {
        res.status(400).json({ error: 'similarity_percent and is_plagiarized are required' });
        return;
      }
      await this.proctoringService.updatePlagiarismResultWithValidation(
        check_id,
        similarity_percent,
        is_plagiarized,
        matched_sources
      );
      res.json({ message: 'Plagiarism result updated', check_id, is_plagiarized });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update plagiarism result');
    }
  };

  getPlagiarismChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { submission_id, user_id, is_plagiarized } = req.query;
      const checks = await this.proctoringService.getPlagiarismChecksWithDetails({
        submission_id: submission_id as string,
        user_id: user_id as string,
        is_plagiarized: is_plagiarized ? is_plagiarized === 'true' : undefined
      });
      res.json({ checks, count: checks.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get plagiarism checks');
    }
  };

  getHighRiskSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.proctoringService.getHighRiskSessionsWithPriority();
      res.json({ high_risk_sessions: sessions, count: sessions.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get high-risk sessions');
    }
  };

  recordBrowserLockdown = async (req: Request, res: Response): Promise<void> => {
    try {
      const lockdownId = await this.proctoringService.recordBrowserLockdownWithValidation(req.body);
      res.status(201).json({ id: lockdownId, message: 'Browser lockdown recorded' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record browser lockdown');
    }
  };

  updateLockdownHeartbeat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lockdown_id } = req.params;
      await this.proctoringService.updateLockdownHeartbeatWithMonitoring(lockdown_id);
      res.json({ message: 'Lockdown heartbeat updated', lockdown_id });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update lockdown heartbeat');
    }
  };

  proctoringHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.proctoringService.getProctoringHealthCheck();
      res.json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Proctoring health check');
    }
  };
}
