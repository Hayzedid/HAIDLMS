import express from 'express';
import { peerReviewController } from '../controllers/peer-review.controller';

const router = express.Router();

/**
 * Peer Code Review Routes
 * All routes require authentication (add auth middleware)
 */

/**
 * @route   POST /api/peer-review/rubrics
 * @desc    Create review rubric
 * @access  Private (Instructor, Admin)
 * @body    { courseId, assessmentId, name, description, minReviewsRequired, allowSelfReview, anonymizeReviewers, anonymizeCodeAuthors, submissionDeadline, reviewDeadline, runMossCheck, mossSimilarityThreshold }
 */
router.post('/rubrics', peerReviewController.createRubric.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/rubrics/:rubricId
 * @desc    Get rubric by ID
 * @access  Private (Student - Enrolled, Instructor, Admin)
 */
router.get('/rubrics/:rubricId', peerReviewController.getRubric.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/courses/:courseId/rubrics
 * @desc    Get rubrics for course
 * @access  Private (Student - Enrolled, Instructor, Admin)
 */
router.get('/courses/:courseId/rubrics', peerReviewController.getCourseRubrics.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/rubrics/:rubricId/criteria
 * @desc    Create rubric criterion
 * @access  Private (Instructor, Admin)
 * @body    { name, description, displayOrder, weight, maxScore, scoreLabels, examples, isRequired }
 */
router.post('/rubrics/:rubricId/criteria', peerReviewController.createCriterion.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/rubrics/:rubricId/criteria
 * @desc    Get rubric criteria
 * @access  Private (Student - Enrolled, Instructor, Admin)
 */
router.get('/rubrics/:rubricId/criteria', peerReviewController.getRubricCriteria.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/rubrics/:rubricId/assign
 * @desc    Assign peer reviewers for submissions
 * @access  Private (Instructor, Admin)
 * @body    { submissionIds, reviewsPerSubmission, algorithm }
 */
router.post('/rubrics/:rubricId/assign', peerReviewController.assignReviewers.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/reviewers/:reviewerId/assignments
 * @desc    Get reviewer assignments
 * @access  Private (Student - Owner, Instructor, Admin)
 * @query   status (optional)
 */
router.get('/reviewers/:reviewerId/assignments', peerReviewController.getReviewerAssignments.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/start
 * @desc    Start review (mark as in progress)
 * @access  Private (Student - Reviewer)
 */
router.post('/reviews/:reviewId/start', peerReviewController.startReview.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/scores
 * @desc    Submit criterion score
 * @access  Private (Student - Reviewer)
 * @body    { criterionId, score, feedback }
 */
router.post('/reviews/:reviewId/scores', peerReviewController.submitCriterionScore.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/comments
 * @desc    Add line comment
 * @access  Private (Student - Reviewer)
 * @body    { fileName, lineNumber, lineEndNumber, codeSnippet, comment, commentType, severity }
 */
router.post('/reviews/:reviewId/comments', peerReviewController.addComment.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/reviews/:reviewId/comments
 * @desc    Get review comments
 * @access  Private (Student - Reviewer/Author, Instructor, Admin)
 */
router.get('/reviews/:reviewId/comments', peerReviewController.getReviewComments.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/submit
 * @desc    Submit review
 * @access  Private (Student - Reviewer)
 * @body    { overallFeedback, timeSpentSeconds }
 */
router.post('/reviews/:reviewId/submit', peerReviewController.submitReview.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/reviews/:reviewId
 * @desc    Get review by ID
 * @access  Private (Student - Reviewer/Author, Instructor, Admin)
 */
router.get('/reviews/:reviewId', peerReviewController.getReview.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/submissions/:submissionId/reviews
 * @desc    Get reviews for submission
 * @access  Private (Student - Author, Instructor, Admin)
 */
router.get('/submissions/:submissionId/reviews', peerReviewController.getSubmissionReviews.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/reviewers/:userId/stats
 * @desc    Get reviewer statistics
 * @access  Private (Student - Owner, Instructor, Admin)
 */
router.get('/reviewers/:userId/stats', peerReviewController.getReviewerStats.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/rate
 * @desc    Rate review helpfulness
 * @access  Private (Student - Author)
 * @body    { isHelpful }
 */
router.post('/reviews/:reviewId/rate', peerReviewController.rateReviewHelpfulness.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/reviews/:reviewId/dispute
 * @desc    Create dispute
 * @access  Private (Student - Author)
 * @body    { authorId, reviewerId, reason, description, requestedOutcome }
 */
router.post('/reviews/:reviewId/dispute', peerReviewController.createDispute.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/disputes
 * @desc    Get disputes
 * @access  Private (Instructor, Admin)
 * @query   status (optional)
 */
router.get('/disputes', peerReviewController.getDisputes.bind(peerReviewController));

/**
 * @route   POST /api/peer-review/disputes/:disputeId/resolve
 * @desc    Resolve dispute
 * @access  Private (Instructor, Admin)
 * @body    { resolvedBy, resolution, resolutionAction, newScore }
 */
router.post('/disputes/:disputeId/resolve', peerReviewController.resolveDispute.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/pending-reviews
 * @desc    Get pending reviews
 * @access  Private (Student, Instructor, Admin)
 * @query   reviewerId (optional)
 */
router.get('/pending-reviews', peerReviewController.getPendingReviews.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/awaiting-reviews
 * @desc    Get submissions awaiting reviews
 * @access  Private (Student, Instructor, Admin)
 * @query   authorId (optional)
 */
router.get('/awaiting-reviews', peerReviewController.getSubmissionsAwaitingReviews.bind(peerReviewController));

/**
 * @route   GET /api/peer-review/high-quality-reviewers
 * @desc    Get high-quality reviewers
 * @access  Private (Instructor, Admin)
 * @query   limit (optional, default: 20)
 */
router.get('/high-quality-reviewers', peerReviewController.getHighQualityReviewers.bind(peerReviewController));

export default router;
