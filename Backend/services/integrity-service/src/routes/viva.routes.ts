import express from 'express';
import { vivaController } from '../controllers/viva.controller';

const router = express.Router();

/**
 * Code Explain / Viva Mode Routes
 * All routes require authentication (add auth middleware in index.ts)
 */

/**
 * @route   POST /api/viva/requests
 * @desc    Create a viva request for a specific student
 * @access  Private (Instructor, Admin)
 * @body    { submissionId, userId, assessmentId, problemId, selectionType, reason, instructions, deadlineHours }
 */
router.post('/requests', vivaController.createVivaRequest.bind(vivaController));

/**
 * @route   POST /api/viva/select/random
 * @desc    Randomly select students for viva (e.g., 20% of class)
 * @access  Private (Instructor, Admin)
 * @body    { assessmentId, problemId, percentage, instructions, deadlineHours }
 */
router.post('/select/random', vivaController.selectRandomStudents.bind(vivaController));

/**
 * @route   POST /api/viva/select/flagged
 * @desc    Select flagged submissions for viva (plagiarism suspects)
 * @access  Private (Instructor, Admin)
 * @body    { assessmentId, problemId, similarityThreshold, instructions, deadlineHours }
 */
router.post('/select/flagged', vivaController.selectFlaggedStudents.bind(vivaController));

/**
 * @route   GET /api/viva/requests/:id
 * @desc    Get viva request by ID
 * @access  Private (Owner, Instructor, Admin)
 */
router.get('/requests/:id', vivaController.getVivaRequest.bind(vivaController));

/**
 * @route   POST /api/viva/requests/:vivaRequestId/submit
 * @desc    Submit video explanation for a viva request
 * @access  Private (Student - Owner)
 * @body    { videoUrl, videoDurationSeconds, studentNotes }
 */
router.post(
  '/requests/:vivaRequestId/submit',
  vivaController.submitVideoExplanation.bind(vivaController)
);

/**
 * @route   POST /api/viva/requests/:vivaRequestId/review
 * @desc    Review video explanation (instructor)
 * @access  Private (Instructor, Admin)
 * @body    { explanationScore, comprehensionLevel, reviewNotes, authenticityVerified, requiresResubmit }
 */
router.post(
  '/requests/:vivaRequestId/review',
  vivaController.reviewVideoExplanation.bind(vivaController)
);

/**
 * @route   POST /api/viva/requests/:vivaRequestId/waive
 * @desc    Waive viva requirement
 * @access  Private (Instructor, Admin)
 * @body    { reason }
 */
router.post(
  '/requests/:vivaRequestId/waive',
  vivaController.waiveVivaRequest.bind(vivaController)
);

/**
 * @route   GET /api/viva/student/pending
 * @desc    Get pending viva requests for student
 * @access  Private (Student)
 */
router.get('/student/pending', vivaController.getStudentPendingRequests.bind(vivaController));

/**
 * @route   GET /api/viva/student/overdue
 * @desc    Get overdue viva requests for student
 * @access  Private (Student)
 */
router.get('/student/overdue', vivaController.getStudentOverdueRequests.bind(vivaController));

/**
 * @route   GET /api/viva/instructor/pending-review
 * @desc    Get vivas needing review (instructor view)
 * @access  Private (Instructor, Admin)
 * @query   limit (optional, default: 50)
 */
router.get(
  '/instructor/pending-review',
  vivaController.getInstructorPendingReviews.bind(vivaController)
);

/**
 * @route   GET /api/viva/assessment/:assessmentId
 * @desc    Get all viva requests for an assessment
 * @access  Private (Instructor, Admin)
 * @query   status (optional)
 */
router.get(
  '/assessment/:assessmentId',
  vivaController.getAssessmentVivaRequests.bind(vivaController)
);

/**
 * @route   GET /api/viva/assessment/:assessmentId/stats
 * @desc    Get viva statistics for an assessment
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/assessment/:assessmentId/stats',
  vivaController.getAssessmentStatistics.bind(vivaController)
);

/**
 * @route   POST /api/viva/maintenance/mark-expired
 * @desc    Mark expired viva requests (cron job)
 * @access  Private (System/Admin)
 */
router.post(
  '/maintenance/mark-expired',
  vivaController.markExpiredRequests.bind(vivaController)
);

export default router;
