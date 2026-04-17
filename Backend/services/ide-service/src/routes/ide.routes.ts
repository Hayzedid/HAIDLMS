import { Router } from 'express';
import {
  executeCode,
  executeCodeStream,
  submitCode,
  getSubmission,
  listSubmissions,
  getTemplate,
  runTests,
} from '../controllers/execution.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/ide/execute
 * @desc    Execute code in sandbox (non-graded)
 * @access  Private
 */
router.post('/execute', executeCode);

/**
 * @route   POST /api/ide/execute-stream
 * @desc    Execute code with real-time streaming output
 * @access  Private
 * @note    Client must connect to /ws/execution?executionId=<id> WebSocket first
 */
router.post('/execute-stream', executeCodeStream);

/**
 * @route   POST /api/ide/submit
 * @desc    Submit code for grading
 * @access  Private
 */
router.post('/submit', submitCode);

/**
 * @route   POST /api/ide/test
 * @desc    Run visible tests without submitting
 * @access  Private
 */
router.post('/test', runTests);

/**
 * @route   GET /api/ide/submissions/:id
 * @desc    Get submission details
 * @access  Private (own submissions only)
 */
router.get('/submissions/:id', getSubmission);

/**
 * @route   GET /api/ide/submissions
 * @desc    List submissions for a lesson
 * @query   lessonId (required)
 * @access  Private (own submissions only)
 */
router.get('/submissions', listSubmissions);

/**
 * @route   GET /api/ide/templates/:lessonId/:language
 * @desc    Get code template for a lesson
 * @access  Private
 */
router.get('/templates/:lessonId/:language', getTemplate);

export default router;
