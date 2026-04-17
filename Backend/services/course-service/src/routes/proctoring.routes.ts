import { Router } from 'express';
import { ProctoringController } from '../controllers/proctoring.controller';
import { Pool } from 'pg';

export const createProctoringRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new ProctoringController(pool);

  // Proctoring Sessions
  router.post('/sessions', controller.createSession);
  router.get('/sessions', controller.getSessions);
  router.put('/sessions/:session_id/status', controller.updateSessionStatus);

  // Violations
  router.post('/violations', controller.recordViolation);
  router.get('/violations/:session_id', controller.getViolations);

  // Face Recognition
  router.post('/face/capture', controller.recordFaceCapture);

  // Identity Verification
  router.post('/identity/verify', controller.verifyIdentity);

  // Plagiarism Detection
  router.post('/plagiarism/check', controller.checkPlagiarism);
  router.get('/plagiarism/checks', controller.getPlagiarismChecks);

  // Risk Assessment
  router.get('/risk/high-risk-sessions', controller.getHighRiskSessions);

  // Browser Lockdown
  router.post('/lockdown', controller.recordBrowserLockdown);

  return router;
};
