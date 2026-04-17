import express from 'express';
import { aiTutorController } from '../controllers/ai-tutor.controller';

const router = express.Router();

/**
 * AI Socratic Tutor Routes
 * All routes require authentication (add auth middleware)
 */

/**
 * @route   POST /api/ai-tutor/sessions/start
 * @desc    Start new AI tutor chat session
 * @access  Private (Student)
 * @body    { courseId, lessonId, assessmentId, problemId, contextType, studentCodeContext }
 */
router.post('/sessions/start', aiTutorController.startChatSession.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/sessions/:sessionId/messages
 * @desc    Send message to AI tutor
 * @access  Private (Student - Owner)
 * @body    { content, codeSnippet }
 */
router.post('/sessions/:sessionId/messages', aiTutorController.sendMessage.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/sessions/:sessionId/end
 * @desc    End chat session
 * @access  Private (Student - Owner)
 */
router.post('/sessions/:sessionId/end', aiTutorController.endChatSession.bind(aiTutorController));

/**
 * @route   GET /api/ai-tutor/sessions/:sessionId
 * @desc    Get session history with all messages
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/sessions/:sessionId', aiTutorController.getSession.bind(aiTutorController));

/**
 * @route   GET /api/ai-tutor/sessions/user/:userId
 * @desc    Get user's active sessions
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/sessions/user/:userId', aiTutorController.getUserSessions.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/error-explanation
 * @desc    Get AI explanation for error (explain-only, no fixes)
 * @access  Private (Student)
 * @body    { sessionId, errorMessage, studentCode, language, lineNumber }
 */
router.post('/error-explanation', aiTutorController.explainError.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/error-explanation/:explanationId/feedback
 * @desc    Mark error explanation as helpful/not helpful
 * @access  Private (Student - Owner)
 * @body    { wasHelpful, resolvedIndependently }
 */
router.post('/error-explanation/:explanationId/feedback', aiTutorController.feedbackOnExplanation.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/challenges/generate
 * @desc    Generate "What if?" extension challenge
 * @access  Private (Student)
 * @body    { sessionId, baseProblemId, studentCode, language }
 */
router.post('/challenges/generate', aiTutorController.generateChallenge.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/challenges/:challengeId/accept
 * @desc    Accept extension challenge
 * @access  Private (Student - Owner)
 */
router.post('/challenges/:challengeId/accept', aiTutorController.acceptChallenge.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/challenges/:challengeId/submit
 * @desc    Submit challenge solution
 * @access  Private (Student - Owner)
 * @body    { solution }
 */
router.post('/challenges/:challengeId/submit', aiTutorController.submitChallengeSolution.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/concept-check
 * @desc    Generate Socratic concept check question
 * @access  Private (Instructor, Admin)
 * @body    { sessionId, conceptName, context }
 */
router.post('/concept-check', aiTutorController.generateConceptCheck.bind(aiTutorController));

/**
 * @route   POST /api/ai-tutor/concept-check/:checkId/answer
 * @desc    Answer concept check question
 * @access  Private (Student)
 * @body    { answer }
 */
router.post('/concept-check/:checkId/answer', aiTutorController.answerConceptCheck.bind(aiTutorController));

/**
 * @route   GET /api/ai-tutor/learning-patterns/:userId
 * @desc    Get AI-derived learning patterns for student
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/learning-patterns/:userId', aiTutorController.getLearningPatterns.bind(aiTutorController));

/**
 * @route   GET /api/ai-tutor/stats/:userId
 * @desc    Get AI usage statistics for student
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/stats/:userId', aiTutorController.getUsageStats.bind(aiTutorController));

/**
 * @route   GET /api/ai-tutor/safety-logs
 * @desc    Get safety violation logs (code generation attempts, cheating)
 * @access  Private (Instructor, Admin)
 * @query   userId, severity, limit
 */
router.get('/safety-logs', aiTutorController.getSafetyLogs.bind(aiTutorController));

export default router;
