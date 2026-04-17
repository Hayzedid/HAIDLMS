import express from 'express';
import { plagiarismController } from '../controllers/plagiarism.controller';

const router = express.Router();

/**
 * Plagiarism Detection Routes
 * All routes require authentication (add auth middleware in index.ts)
 */

/**
 * @route   POST /api/plagiarism/submit
 * @desc    Submit code for plagiarism check
 * @access  Private (Student, Instructor)
 * @body    { userId, assessmentId, problemId, language, code, fileName? }
 */
router.post('/submit', plagiarismController.submitCode.bind(plagiarismController));

/**
 * @route   GET /api/plagiarism/submissions/:submissionId
 * @desc    Get submission details by ID
 * @access  Private (Owner, Instructor, Admin)
 */
router.get(
  '/submissions/:submissionId',
  plagiarismController.getSubmission.bind(plagiarismController)
);

/**
 * @route   GET /api/plagiarism/submissions/user/:userId
 * @desc    Get all submissions for a user (optionally filter by assessment)
 * @access  Private (Owner, Instructor, Admin)
 * @query   assessmentId (optional)
 */
router.get(
  '/submissions/user/:userId',
  plagiarismController.getUserSubmissions.bind(plagiarismController)
);

/**
 * @route   GET /api/plagiarism/flagged
 * @desc    Get all flagged submissions (for instructors)
 * @access  Private (Instructor, Admin)
 * @query   limit (optional, default: 100)
 */
router.get('/flagged', plagiarismController.getFlaggedSubmissions.bind(plagiarismController));

/**
 * @route   GET /api/plagiarism/matches/:submissionId
 * @desc    Get all plagiarism matches for a submission
 * @access  Private (Owner, Instructor, Admin)
 */
router.get('/matches/:submissionId', plagiarismController.getMatches.bind(plagiarismController));

/**
 * @route   POST /api/plagiarism/moss/check
 * @desc    Trigger MOSS plagiarism check for an assessment
 * @access  Private (Instructor, Admin)
 * @body    { assessmentId, problemId }
 */
router.post('/moss/check', plagiarismController.triggerMossCheck.bind(plagiarismController));

/**
 * @route   GET /api/plagiarism/moss/report/:submissionId
 * @desc    Get MOSS report URL for a submission
 * @access  Private (Instructor, Admin)
 */
router.get('/moss/report/:submissionId', plagiarismController.getMossReport.bind(plagiarismController));

/**
 * @route   PATCH /api/plagiarism/submissions/:submissionId/review
 * @desc    Update instructor review for a submission
 * @access  Private (Instructor, Admin)
 * @body    { reviewedBy, reviewNotes, plagiarismStatus? }
 */
router.patch(
  '/submissions/:submissionId/review',
  plagiarismController.updateReview.bind(plagiarismController)
);

/**
 * @route   GET /api/plagiarism/stats/assessment/:assessmentId
 * @desc    Get plagiarism statistics for an assessment
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/stats/assessment/:assessmentId',
  plagiarismController.getAssessmentStats.bind(plagiarismController)
);

/**
 * @route   GET /api/plagiarism/stats/course/:courseId
 * @desc    Get plagiarism statistics for a course
 * @access  Private (Instructor, Admin)
 */
router.get(
  '/stats/course/:courseId',
  plagiarismController.getCourseStats.bind(plagiarismController)
);

export default router;
