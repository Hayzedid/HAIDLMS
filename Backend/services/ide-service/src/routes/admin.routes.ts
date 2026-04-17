import { Router } from 'express';
import {
  createTestCase,
  getTestCases,
  updateTestCase,
  deleteTestCase,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  getExecutionStats,
} from '../controllers/admin.controller';
import { authenticateToken, requireInstructor } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and instructor role
router.use(authenticateToken);
router.use(requireInstructor);

// ── Test Cases ─────────────────────────────────────────────────────────────

/**
 * @route   POST /api/ide/admin/test-cases
 * @desc    Create test case for a lesson
 * @access  Instructor, Admin
 */
router.post('/test-cases', createTestCase);

/**
 * @route   GET /api/ide/admin/test-cases/:lessonId
 * @desc    Get all test cases for a lesson
 * @access  Instructor, Admin
 */
router.get('/test-cases/:lessonId', getTestCases);

/**
 * @route   PATCH /api/ide/admin/test-cases/:id
 * @desc    Update test case
 * @access  Instructor, Admin
 */
router.patch('/test-cases/:id', updateTestCase);

/**
 * @route   DELETE /api/ide/admin/test-cases/:id
 * @desc    Delete test case
 * @access  Instructor, Admin
 */
router.delete('/test-cases/:id', deleteTestCase);

// ── Templates ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/ide/admin/templates
 * @desc    Create code template for a lesson
 * @access  Instructor, Admin
 */
router.post('/templates', createTemplate);

/**
 * @route   GET /api/ide/admin/templates/:lessonId
 * @desc    Get all templates for a lesson
 * @access  Instructor, Admin
 */
router.get('/templates/:lessonId', getTemplates);

/**
 * @route   PATCH /api/ide/admin/templates/:id
 * @desc    Update template
 * @access  Instructor, Admin
 */
router.patch('/templates/:id', updateTemplate);

/**
 * @route   DELETE /api/ide/admin/templates/:id
 * @desc    Delete template
 * @access  Instructor, Admin
 */
router.delete('/templates/:id', deleteTemplate);

// ── Statistics ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/ide/admin/stats
 * @desc    Get execution statistics
 * @query   startDate, endDate (optional)
 * @access  Instructor, Admin
 */
router.get('/stats', getExecutionStats);

export default router;
