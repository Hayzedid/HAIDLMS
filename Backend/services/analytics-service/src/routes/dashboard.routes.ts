import { Router } from 'express';
import { authenticateToken, requireInstructor, requireAdmin } from '../middleware/auth.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

/**
 * @route GET /api/dashboard/student
 * @desc Get student dashboard
 * @access Protected (Student)
 */
router.get('/student', authenticateToken, dashboardController.getStudentDashboard);

/**
 * @route GET /api/dashboard/instructor
 * @desc Get instructor dashboard
 * @access Protected (Instructor)
 */
router.get('/instructor', authenticateToken, requireInstructor, dashboardController.getInstructorDashboard);

/**
 * @route GET /api/dashboard/admin
 * @desc Get admin dashboard
 * @access Protected (Admin)
 */
router.get('/admin', authenticateToken, requireAdmin, dashboardController.getAdminDashboard);

/**
 * @route GET /api/dashboard/timeseries
 * @desc Get time series data
 * @access Protected (Admin)
 */
router.get('/timeseries', authenticateToken, requireAdmin, dashboardController.getTimeSeriesData);

/**
 * @route GET /api/dashboard/comparison
 * @desc Get comparison data
 * @access Protected (Admin)
 */
router.get('/comparison', authenticateToken, requireAdmin, dashboardController.getComparisonData);

export default router;
