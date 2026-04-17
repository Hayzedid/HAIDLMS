import { Router } from 'express';
import {
  listTemplates,
  getTemplate,
  getTemplatesByType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  testTemplate,
  getTemplateStats,
} from '../controllers/template.controller';
import { authenticateToken, requireInstructor } from '../middleware/auth.middleware';

const router = Router();

// Protected endpoints (require authentication)
router.use(authenticateToken);

router.get('/', listTemplates);
router.get('/type/:type', getTemplatesByType);
router.get('/:id', getTemplate);
router.get('/:id/stats', getTemplateStats);

// Instructor/Admin endpoints
router.use(requireInstructor);

router.post('/', createTemplate);
router.patch('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/test', testTemplate);

export default router;
