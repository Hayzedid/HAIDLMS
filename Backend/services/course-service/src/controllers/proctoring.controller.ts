import { Request, Response } from 'express';
import { ProctoringService } from '../services/proctoring.service';
import { Pool } from 'pg';

export class ProctoringController {
  private proctoringService: ProctoringService;

  constructor(pool: Pool) {
    this.proctoringService = new ProctoringService(pool);
  }

  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.createProctoringSession(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create session' });
    }
  };

  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.proctoringService.getProctoringSessions(req.query);
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  };

  updateSessionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const { status } = req.body;
      await this.proctoringService.updateSessionStatus(session_id, status);
      res.json({ message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  };

  recordViolation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.recordViolation(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record violation' });
    }
  };

  getViolations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      const violations = await this.proctoringService.getViolations(session_id);
      res.json({ violations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch violations' });
    }
  };

  recordFaceCapture = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.recordFaceCapture(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record face capture' });
    }
  };

  verifyIdentity = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.verifyIdentity(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify identity' });
    }
  };

  checkPlagiarism = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.checkPlagiarism(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check plagiarism' });
    }
  };

  getPlagiarismChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const checks = await this.proctoringService.getPlagiarismChecks(req.query);
      res.json({ checks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch checks' });
    }
  };

  getHighRiskSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.proctoringService.getHighRiskSessions();
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch high-risk sessions' });
    }
  };

  recordBrowserLockdown = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.proctoringService.recordBrowserLockdown(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record lockdown' });
    }
  };
}
