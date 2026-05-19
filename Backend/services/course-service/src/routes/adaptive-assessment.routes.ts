import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { AdaptiveAssessmentController } from '../controllers/adaptive-assessment.controller';

const router = Router();
const controller = new AdaptiveAssessmentController();

// Configuration routes
router.post('/config', authenticate, controller.createConfig);
router.get('/config/:assessmentId', authenticate, controller.getConfig);

// Session routes
router.post('/:assessmentId/start', authenticate, controller.startSession);
router.get('/sessions/:sessionId', authenticate, controller.getSession);
router.get('/sessions/:sessionId/next-question', authenticate, controller.getNextQuestion);
router.post('/sessions/:sessionId/submit-response', authenticate, controller.submitResponse);
router.post('/sessions/:sessionId/complete', authenticate, controller.completeSession);
router.get('/sessions/:sessionId/statistics', authenticate, controller.getSessionStats);

// User history
router.get('/users/:userId/assessments/:assessmentId/history', authenticate, controller.getUserAbilityHistory);

export default router;
