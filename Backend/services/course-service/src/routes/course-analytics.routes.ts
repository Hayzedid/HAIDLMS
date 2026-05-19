import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { courseAnalyticsController } from '../controllers/course-analytics.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Course Analytics
 *   description: Course-level analytics and performance metrics
 */

// ========================================
// COURSE METRICS
// ========================================

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/metrics:
 *   get:
 *     summary: Get course metrics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Course metrics retrieved successfully
 */
router.get('/courses/:courseId/metrics', courseAnalyticsController.getCourseMetrics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/metrics/all:
 *   get:
 *     summary: Get all courses metrics for a date
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All courses metrics retrieved successfully
 */
router.get('/courses/metrics/all', courseAnalyticsController.getAllCoursesMetrics.bind(courseAnalyticsController));

// ========================================
// ENROLLMENT TRENDS
// ========================================

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/enrollment-trends:
 *   get:
 *     summary: Get enrollment trends for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Enrollment trends retrieved successfully
 */
router.get('/courses/:courseId/enrollment-trends', courseAnalyticsController.getEnrollmentTrends.bind(courseAnalyticsController));

// ========================================
// COURSE COMPLETION
// ========================================

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/completion:
 *   get:
 *     summary: Get course completion analytics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completion analytics retrieved successfully
 */
router.get('/courses/:courseId/completion', courseAnalyticsController.getCourseCompletionAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/performance/overview:
 *   get:
 *     summary: Get course performance overview
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance overview retrieved successfully
 */
router.get('/courses/performance/overview', courseAnalyticsController.getCoursePerformanceOverview.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/top-performing:
 *   get:
 *     summary: Get top performing courses
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Top performing courses retrieved successfully
 */
router.get('/courses/top-performing', courseAnalyticsController.getTopPerformingCourses.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/needing-attention:
 *   get:
 *     summary: Get courses needing attention
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Courses needing attention retrieved successfully
 */
router.get('/courses/needing-attention', courseAnalyticsController.getCoursesNeedingAttention.bind(courseAnalyticsController));

// ========================================
// MODULE ANALYTICS
// ========================================

/**
 * @swagger
 * /api/course-analytics/modules/{moduleId}/analytics:
 *   get:
 *     summary: Get module analytics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module analytics retrieved successfully
 */
router.get('/modules/:moduleId/analytics', courseAnalyticsController.getModuleAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/modules/analytics:
 *   get:
 *     summary: Get all modules analytics for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course modules analytics retrieved successfully
 */
router.get('/courses/:courseId/modules/analytics', courseAnalyticsController.getCourseModulesAnalytics.bind(courseAnalyticsController));

// ========================================
// LESSON ANALYTICS
// ========================================

/**
 * @swagger
 * /api/course-analytics/lessons/{lessonId}/analytics:
 *   get:
 *     summary: Get lesson analytics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson analytics retrieved successfully
 */
router.get('/lessons/:lessonId/analytics', courseAnalyticsController.getLessonAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/modules/{moduleId}/lessons/analytics:
 *   get:
 *     summary: Get all lessons analytics for a module
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module lessons analytics retrieved successfully
 */
router.get('/modules/:moduleId/lessons/analytics', courseAnalyticsController.getModuleLessonsAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/lessons/top-viewed:
 *   get:
 *     summary: Get top viewed lessons for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top viewed lessons retrieved successfully
 */
router.get('/courses/:courseId/lessons/top-viewed', courseAnalyticsController.getTopViewedLessons.bind(courseAnalyticsController));

// ========================================
// ASSESSMENT ANALYTICS
// ========================================

/**
 * @swagger
 * /api/course-analytics/assessments/{assessmentId}/analytics:
 *   get:
 *     summary: Get assessment analytics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assessment analytics retrieved successfully
 */
router.get('/assessments/:assessmentId/analytics', courseAnalyticsController.getAssessmentAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/assessments/analytics:
 *   get:
 *     summary: Get all assessments analytics for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course assessments analytics retrieved successfully
 */
router.get('/courses/:courseId/assessments/analytics', courseAnalyticsController.getCourseAssessmentsAnalytics.bind(courseAnalyticsController));

// ========================================
// DROPOUT ANALYSIS
// ========================================

/**
 * @swagger
 * /api/course-analytics/dropouts:
 *   post:
 *     summary: Record a course dropout
 *     tags: [Course Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - enrollmentId
 *               - progressPercentage
 *             properties:
 *               courseId:
 *                 type: string
 *               enrollmentId:
 *                 type: string
 *               progressPercentage:
 *                 type: integer
 *               lastLessonId:
 *                 type: string
 *               lastModuleId:
 *                 type: string
 *               dropoutReason:
 *                 type: string
 *                 enum: [too_difficult, time_constraints, not_relevant, technical_issues, poor_quality, completed_elsewhere, lost_interest, unknown]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dropout recorded successfully
 */
router.post('/dropouts', authenticate, courseAnalyticsController.recordDropout.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/dropouts:
 *   get:
 *     summary: Get course dropouts
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Course dropouts retrieved successfully
 */
router.get('/courses/:courseId/dropouts', courseAnalyticsController.getCourseDropouts.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/dropouts/analysis:
 *   get:
 *     summary: Get dropout analysis for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dropout analysis retrieved successfully
 */
router.get('/courses/:courseId/dropouts/analysis', courseAnalyticsController.getDropoutAnalysis.bind(courseAnalyticsController));

// ========================================
// INSTRUCTOR ANALYTICS
// ========================================

/**
 * @swagger
 * /api/course-analytics/instructors/me/analytics:
 *   get:
 *     summary: Get my instructor analytics
 *     tags: [Course Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor analytics retrieved successfully
 */
router.get('/instructors/me/analytics', authenticate, courseAnalyticsController.getMyInstructorAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/instructors/{instructorId}/analytics:
 *   get:
 *     summary: Get instructor analytics
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor analytics retrieved successfully
 */
router.get('/instructors/:instructorId/analytics', courseAnalyticsController.getInstructorAnalytics.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/instructors/top:
 *   get:
 *     summary: Get top instructors
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Top instructors retrieved successfully
 */
router.get('/instructors/top', courseAnalyticsController.getTopInstructors.bind(courseAnalyticsController));

// ========================================
// CONTENT EFFECTIVENESS
// ========================================

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/content/needs-improvement:
 *   get:
 *     summary: Get content needing improvement
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content needing improvement retrieved successfully
 */
router.get('/courses/:courseId/content/needs-improvement', courseAnalyticsController.getContentNeedingImprovement.bind(courseAnalyticsController));

// ========================================
// COHORT ANALYSIS
// ========================================

/**
 * @swagger
 * /api/course-analytics/cohorts:
 *   post:
 *     summary: Create a cohort
 *     tags: [Course Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - cohortName
 *               - cohortStartDate
 *               - cohortEndDate
 *             properties:
 *               courseId:
 *                 type: string
 *               cohortName:
 *                 type: string
 *               cohortStartDate:
 *                 type: string
 *                 format: date
 *               cohortEndDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cohort created successfully
 */
router.post('/cohorts', authenticate, courseAnalyticsController.createCohort.bind(courseAnalyticsController));

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/cohorts:
 *   get:
 *     summary: Get course cohorts
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course cohorts retrieved successfully
 */
router.get('/courses/:courseId/cohorts', courseAnalyticsController.getCourseCohorts.bind(courseAnalyticsController));

// ========================================
// POPULAR CONTENT
// ========================================

/**
 * @swagger
 * /api/course-analytics/courses/{courseId}/popular-content:
 *   get:
 *     summary: Get popular content for a course
 *     tags: [Course Analytics]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Popular content retrieved successfully
 */
router.get('/courses/:courseId/popular-content', courseAnalyticsController.getPopularContent.bind(courseAnalyticsController));

export default router;
