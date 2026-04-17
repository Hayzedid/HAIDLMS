import { Router } from 'express';
import { careerOutcomeController } from '../controllers/career-outcome.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

// ========================================
// CAREER OUTCOMES
// ========================================

/**
 * Report a career outcome
 * POST /api/career-outcomes
 */
router.post('/', authenticate, careerOutcomeController.createOutcome.bind(careerOutcomeController));

/**
 * Get outcome by ID
 * GET /api/career-outcomes/:id
 */
router.get('/:id', authenticate, careerOutcomeController.getOutcome.bind(careerOutcomeController));

/**
 * Get current user's outcomes
 * GET /api/career-outcomes/my-outcomes
 */
router.get('/my-outcomes', authenticate, careerOutcomeController.getMyOutcomes.bind(careerOutcomeController));

/**
 * Get user outcomes by user ID
 * GET /api/career-outcomes/user/:userId
 */
router.get('/user/:userId', authenticate, careerOutcomeController.getUserOutcomes.bind(careerOutcomeController));

/**
 * Update an outcome
 * PUT /api/career-outcomes/:id
 */
router.put('/:id', authenticate, careerOutcomeController.updateOutcome.bind(careerOutcomeController));

/**
 * Delete an outcome
 * DELETE /api/career-outcomes/:id
 */
router.delete('/:id', authenticate, careerOutcomeController.deleteOutcome.bind(careerOutcomeController));

// ========================================
// ADMIN/HR: OUTCOME VERIFICATION
// ========================================

/**
 * Verify an outcome (Admin/HR only)
 * POST /api/career-outcomes/:id/verify
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize('admin', 'hr_manager', 'instructor'),
  careerOutcomeController.verifyOutcome.bind(careerOutcomeController)
);

/**
 * Reject an outcome (Admin/HR only)
 * POST /api/career-outcomes/:id/reject
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('admin', 'hr_manager', 'instructor'),
  careerOutcomeController.rejectOutcome.bind(careerOutcomeController)
);

// ========================================
// PUBLIC: OUTCOME STATISTICS
// ========================================

/**
 * Get outcome statistics for a course
 * GET /api/career-outcomes/course/:courseId/stats
 */
router.get('/course/:courseId/stats', careerOutcomeController.getCourseStats.bind(careerOutcomeController));

/**
 * Get recent verified outcomes
 * GET /api/career-outcomes/recent
 */
router.get('/recent', careerOutcomeController.getRecentOutcomes.bind(careerOutcomeController));

/**
 * Get outcomes by type
 * GET /api/career-outcomes/by-type/:type
 */
router.get('/by-type/:type', careerOutcomeController.getOutcomesByType.bind(careerOutcomeController));

// ========================================
// JOB BOARD
// ========================================

/**
 * Get job postings
 * GET /api/career-outcomes/jobs
 */
router.get('/jobs', careerOutcomeController.getJobPostings.bind(careerOutcomeController));

/**
 * Get recommended jobs based on user's skills
 * GET /api/career-outcomes/jobs/recommended
 */
router.get('/jobs/recommended', authenticate, careerOutcomeController.getRecommendedJobs.bind(careerOutcomeController));

/**
 * Get job posting by ID
 * GET /api/career-outcomes/jobs/:id
 */
router.get('/jobs/:id', careerOutcomeController.getJobPosting.bind(careerOutcomeController));

/**
 * Apply to a job posting
 * POST /api/career-outcomes/jobs/:id/apply
 */
router.post('/jobs/:id/apply', authenticate, careerOutcomeController.applyToJob.bind(careerOutcomeController));

/**
 * Get current user's job applications
 * GET /api/career-outcomes/my-applications
 */
router.get('/my-applications', authenticate, careerOutcomeController.getMyApplications.bind(careerOutcomeController));

// ========================================
// ORGANIZATION ROI (HR/Admin only)
// ========================================

/**
 * Calculate organization ROI for a period
 * POST /api/career-outcomes/roi/calculate
 */
router.post(
  '/roi/calculate',
  authenticate,
  authorize('admin', 'hr_manager'),
  careerOutcomeController.calculateROI.bind(careerOutcomeController)
);

/**
 * Get organization ROI history
 * GET /api/career-outcomes/roi/:organizationId/history
 */
router.get(
  '/roi/:organizationId/history',
  authenticate,
  authorize('admin', 'hr_manager'),
  careerOutcomeController.getROIHistory.bind(careerOutcomeController)
);

/**
 * Update organization ROI metrics
 * PUT /api/career-outcomes/roi/:id
 */
router.put(
  '/roi/:id',
  authenticate,
  authorize('admin', 'hr_manager'),
  careerOutcomeController.updateROI.bind(careerOutcomeController)
);

// ========================================
// SALARY BENCHMARKS
// ========================================

/**
 * Get salary benchmark
 * GET /api/career-outcomes/salary-benchmark
 */
router.get('/salary-benchmark', careerOutcomeController.getSalaryBenchmark.bind(careerOutcomeController));

export default router;
