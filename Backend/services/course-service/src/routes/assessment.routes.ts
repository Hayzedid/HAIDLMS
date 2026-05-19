import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { assessmentController } from '../controllers/assessment.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assessments
 *   description: Quiz and assessment management endpoints
 */

// All assessment routes require authentication
router.use(authenticate);

// ========================================
// ASSESSMENTS
// ========================================

/**
 * @swagger
 * /api/assessments:
 *   post:
 *     summary: Create an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               lessonId:
 *                 type: string
 *               assessmentType:
 *                 type: string
 *                 enum: [quiz, test, exam, assignment, practice]
 *               timeLimitMinutes:
 *                 type: integer
 *               maxAttempts:
 *                 type: integer
 *               shuffleQuestions:
 *                 type: boolean
 *               shuffleOptions:
 *                 type: boolean
 *               passingScore:
 *                 type: number
 *               enableProctoring:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Assessment created successfully
 */
router.post('/', assessmentController.createAssessment.bind(assessmentController));

/**
 * @swagger
 * /api/assessments:
 *   get:
 *     summary: List assessments
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: lessonId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assessmentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assessments retrieved successfully
 */
router.get('/', assessmentController.listAssessments.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{id}:
 *   get:
 *     summary: Get assessment details
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment retrieved successfully
 */
router.get('/:id', assessmentController.getAssessment.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{id}:
 *   put:
 *     summary: Update assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Assessment updated successfully
 */
router.put('/:id', assessmentController.updateAssessment.bind(assessmentController));

router.delete('/:id', assessmentController.deleteAssessment.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{id}/publish:
 *   post:
 *     summary: Publish assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment published successfully
 */
router.post('/:id/publish', assessmentController.publishAssessment.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{id}/summary:
 *   get:
 *     summary: Get assessment summary with statistics
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment summary retrieved successfully
 */
router.get('/:id/summary', assessmentController.getAssessmentSummary.bind(assessmentController));

// ========================================
// QUESTIONS
// ========================================

/**
 * @swagger
 * /api/assessments/questions:
 *   post:
 *     summary: Create a question
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - questionType
 *             properties:
 *               assessmentId:
 *                 type: string
 *               questionText:
 *                 type: string
 *               questionType:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer, essay, fill_blank, matching, code]
 *               points:
 *                 type: number
 *               difficultyLevel:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               correctAnswer:
 *                 type: string
 *               hint:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question created successfully
 */
router.post('/questions', assessmentController.createQuestion.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{assessmentId}/questions:
 *   get:
 *     summary: List questions for an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 */
router.get('/:assessmentId/questions', assessmentController.listQuestions.bind(assessmentController));

router.get('/questions/:questionId', assessmentController.getQuestion.bind(assessmentController));
router.put('/questions/:questionId', assessmentController.updateQuestion.bind(assessmentController));
router.delete('/questions/:questionId', assessmentController.deleteQuestion.bind(assessmentController));

// ========================================
// QUESTION OPTIONS
// ========================================

/**
 * @swagger
 * /api/assessments/questions/{questionId}/options:
 *   post:
 *     summary: Add option to a multiple choice question
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - optionText
 *               - orderIndex
 *             properties:
 *               optionText:
 *                 type: string
 *               orderIndex:
 *                 type: integer
 *               isCorrect:
 *                 type: boolean
 *               feedback:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question option created successfully
 */
router.post('/questions/:questionId/options', assessmentController.createQuestionOption.bind(assessmentController));

router.get('/questions/:questionId/options', assessmentController.listQuestionOptions.bind(assessmentController));
router.delete('/options/:optionId', assessmentController.deleteQuestionOption.bind(assessmentController));

// ========================================
// ATTEMPTS
// ========================================

/**
 * @swagger
 * /api/assessments/{assessmentId}/attempts:
 *   post:
 *     summary: Start an assessment attempt
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Assessment attempt started successfully
 */
router.post('/:assessmentId/attempts', assessmentController.startAttempt.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{assessmentId}/attempts/mine:
 *   get:
 *     summary: Get my attempts for this assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User attempts retrieved successfully
 */
router.get('/:assessmentId/attempts/mine', assessmentController.listUserAttempts.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/{assessmentId}/attempts:
 *   get:
 *     summary: List all attempts for an assessment (instructor)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_progress, submitted, graded, abandoned]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attempts retrieved successfully
 */
router.get('/:assessmentId/attempts', assessmentController.listAllAttempts.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/attempts/{attemptId}:
 *   get:
 *     summary: Get attempt details
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt retrieved successfully
 */
router.get('/attempts/:attemptId', assessmentController.getAttempt.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/attempts/{attemptId}/submit:
 *   post:
 *     summary: Submit assessment attempt
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt submitted successfully
 */
router.post('/attempts/:attemptId/submit', assessmentController.submitAttempt.bind(assessmentController));

// ========================================
// ANSWERS
// ========================================

/**
 * @swagger
 * /api/assessments/attempts/{attemptId}/questions/{questionId}/answer:
 *   post:
 *     summary: Save answer to a question
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answerText:
 *                 type: string
 *               selectedOptionId:
 *                 type: string
 *               selectedOptionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               codeAnswer:
 *                 type: string
 *               timeSpentSeconds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Answer saved successfully
 */
router.post('/attempts/:attemptId/questions/:questionId/answer', assessmentController.saveAnswer.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/attempts/{attemptId}/answers:
 *   get:
 *     summary: Get all answers for an attempt
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
 */
router.get('/attempts/:attemptId/answers', assessmentController.getAttemptAnswers.bind(assessmentController));

// ========================================
// GRADING
// ========================================

/**
 * @swagger
 * /api/assessments/answers/{answerId}/grade:
 *   post:
 *     summary: Manually grade an answer
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pointsEarned
 *             properties:
 *               pointsEarned:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer graded successfully
 */
router.post('/answers/:answerId/grade', assessmentController.manualGradeAnswer.bind(assessmentController));

/**
 * @swagger
 * /api/assessments/attempts/{attemptId}/complete-grading:
 *   post:
 *     summary: Complete grading for an attempt
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instructorFeedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grading completed successfully
 */
router.post('/attempts/:attemptId/complete-grading', assessmentController.completeGrading.bind(assessmentController));

// ========================================
// PROCTORING
// ========================================

router.post('/attempts/:attemptId/proctoring', assessmentController.logProctoringEvent.bind(assessmentController));
router.get('/attempts/:attemptId/proctoring', assessmentController.getProctoringEvents.bind(assessmentController));

// ========================================
// ANALYTICS
// ========================================

/**
 * @swagger
 * /api/assessments/{assessmentId}/analytics:
 *   get:
 *     summary: Get assessment analytics
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/:assessmentId/analytics', assessmentController.getAssessmentAnalytics.bind(assessmentController));

router.get('/questions/:questionId/analytics', assessmentController.getQuestionAnalytics.bind(assessmentController));

export default router;
