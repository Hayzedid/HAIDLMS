import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { reportingController } from '../controllers/reporting.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reporting
 *   description: Advanced reporting, analytics, and export endpoints
 */

// All reporting routes require authentication
router.use(authenticate);

// ========================================
// REPORT TEMPLATES
// ========================================

/**
 * @swagger
 * /api/reporting/templates:
 *   post:
 *     summary: Create a report template
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dataSource
 *               - columns
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [enrollment, progress, engagement, financial, custom]
 *               dataSource:
 *                 type: string
 *               columns:
 *                 type: array
 *               isPublic:
 *                 type: boolean
 *               allowedFormats:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [pdf, excel, csv, json]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Report template created successfully
 */
router.post('/templates', reportingController.createReportTemplate.bind(reportingController));

/**
 * @swagger
 * /api/reporting/templates:
 *   get:
 *     summary: List report templates
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Report templates retrieved successfully
 */
router.get('/templates', reportingController.listReportTemplates.bind(reportingController));

/**
 * @swagger
 * /api/reporting/templates/popular:
 *   get:
 *     summary: Get popular report templates
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Popular templates retrieved successfully
 */
router.get('/templates/popular', reportingController.getPopularTemplates.bind(reportingController));

/**
 * @swagger
 * /api/reporting/templates/{id}:
 *   get:
 *     summary: Get report template details
 *     tags: [Reporting]
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
 *         description: Report template retrieved successfully
 */
router.get('/templates/:id', reportingController.getReportTemplate.bind(reportingController));

/**
 * @swagger
 * /api/reporting/templates/{id}:
 *   put:
 *     summary: Update report template
 *     tags: [Reporting]
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
 *         description: Report template updated successfully
 */
router.put('/templates/:id', reportingController.updateReportTemplate.bind(reportingController));

router.delete('/templates/:id', reportingController.deleteReportTemplate.bind(reportingController));

// ========================================
// CUSTOM REPORTS
// ========================================

/**
 * @swagger
 * /api/reporting/reports:
 *   post:
 *     summary: Create a custom report
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dataSource
 *               - columns
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               templateId:
 *                 type: string
 *               dataSource:
 *                 type: string
 *               columns:
 *                 type: array
 *               filters:
 *                 type: object
 *               isPrivate:
 *                 type: boolean
 *               sharedWith:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Custom report created successfully
 */
router.post('/reports', reportingController.createCustomReport.bind(reportingController));

/**
 * @swagger
 * /api/reporting/reports:
 *   get:
 *     summary: List custom reports
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: string
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
 *         description: Custom reports retrieved successfully
 */
router.get('/reports', reportingController.listCustomReports.bind(reportingController));

/**
 * @swagger
 * /api/reporting/reports/{id}:
 *   get:
 *     summary: Get custom report details
 *     tags: [Reporting]
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
 *         description: Custom report retrieved successfully
 */
router.get('/reports/:id', reportingController.getCustomReport.bind(reportingController));

router.put('/reports/:id', reportingController.updateCustomReport.bind(reportingController));
router.delete('/reports/:id', reportingController.deleteCustomReport.bind(reportingController));

// ========================================
// REPORT EXECUTIONS
// ========================================

/**
 * @swagger
 * /api/reporting/execute:
 *   post:
 *     summary: Execute a report
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               filters:
 *                 type: object
 *               dateRange:
 *                 type: object
 *               exportFormat:
 *                 type: string
 *                 enum: [pdf, excel, csv, json]
 *     responses:
 *       201:
 *         description: Report execution started successfully
 */
router.post('/execute', reportingController.executeReport.bind(reportingController));

/**
 * @swagger
 * /api/reporting/executions:
 *   get:
 *     summary: List report executions
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportId
 *         schema:
 *           type: string
 *       - in: query
 *         name: executedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [running, completed, failed, cancelled]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report executions retrieved successfully
 */
router.get('/executions', reportingController.listReportExecutions.bind(reportingController));

/**
 * @swagger
 * /api/reporting/executions/{executionId}:
 *   get:
 *     summary: Get report execution details
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report execution retrieved successfully
 */
router.get('/executions/:executionId', reportingController.getReportExecution.bind(reportingController));

router.post('/executions/:executionId/complete', reportingController.completeReportExecution.bind(reportingController));

// ========================================
// SCHEDULED REPORTS
// ========================================

/**
 * @swagger
 * /api/reporting/scheduled:
 *   post:
 *     summary: Create a scheduled report
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - frequency
 *             properties:
 *               reportId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly, custom]
 *               timeOfDay:
 *                 type: string
 *               dayOfWeek:
 *                 type: integer
 *               dayOfMonth:
 *                 type: integer
 *               exportFormat:
 *                 type: string
 *                 enum: [pdf, excel, csv]
 *               deliveryMethod:
 *                 type: string
 *                 enum: [email, storage, both]
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Scheduled report created successfully
 */
router.post('/scheduled', reportingController.createScheduledReport.bind(reportingController));

/**
 * @swagger
 * /api/reporting/scheduled:
 *   get:
 *     summary: List scheduled reports
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scheduled reports retrieved successfully
 */
router.get('/scheduled', reportingController.listScheduledReports.bind(reportingController));

router.get('/scheduled/due', reportingController.getDueScheduledReports.bind(reportingController));

/**
 * @swagger
 * /api/reporting/scheduled/{id}:
 *   get:
 *     summary: Get scheduled report details
 *     tags: [Reporting]
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
 *         description: Scheduled report retrieved successfully
 */
router.get('/scheduled/:id', reportingController.getScheduledReport.bind(reportingController));

router.put('/scheduled/:id', reportingController.updateScheduledReport.bind(reportingController));
router.delete('/scheduled/:id', reportingController.deleteScheduledReport.bind(reportingController));

// ========================================
// DASHBOARDS
// ========================================

/**
 * @swagger
 * /api/reporting/dashboards:
 *   post:
 *     summary: Create a dashboard
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dashboardType:
 *                 type: string
 *                 enum: [system, organization, custom]
 *               layout:
 *                 type: object
 *               widgetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 */
router.post('/dashboards', reportingController.createDashboard.bind(reportingController));

/**
 * @swagger
 * /api/reporting/dashboards:
 *   get:
 *     summary: List dashboards
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboards retrieved successfully
 */
router.get('/dashboards', reportingController.listDashboards.bind(reportingController));

/**
 * @swagger
 * /api/reporting/dashboards/{id}:
 *   get:
 *     summary: Get dashboard details
 *     tags: [Reporting]
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
 *         description: Dashboard retrieved successfully
 */
router.get('/dashboards/:id', reportingController.getDashboard.bind(reportingController));

router.put('/dashboards/:id', reportingController.updateDashboard.bind(reportingController));
router.delete('/dashboards/:id', reportingController.deleteDashboard.bind(reportingController));

// ========================================
// EXPORT JOBS
// ========================================

/**
 * @swagger
 * /api/reporting/export:
 *   post:
 *     summary: Create an export job
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobType
 *               - exportFormat
 *             properties:
 *               jobType:
 *                 type: string
 *                 enum: [report, data_export, backup]
 *               exportFormat:
 *                 type: string
 *                 enum: [pdf, excel, csv, json]
 *               sourceType:
 *                 type: string
 *               sourceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Export job created successfully
 */
router.post('/export', reportingController.createExportJob.bind(reportingController));

/**
 * @swagger
 * /api/reporting/export:
 *   get:
 *     summary: List export jobs
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Export jobs retrieved successfully
 */
router.get('/export', reportingController.listExportJobs.bind(reportingController));

/**
 * @swagger
 * /api/reporting/export/{jobId}:
 *   get:
 *     summary: Get export job details
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export job retrieved successfully
 */
router.get('/export/:jobId', reportingController.getExportJob.bind(reportingController));

router.put('/export/:jobId', reportingController.updateExportJob.bind(reportingController));

// ========================================
// ANALYTICS METRICS
// ========================================

/**
 * @swagger
 * /api/reporting/metrics:
 *   post:
 *     summary: Record an analytics metric
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricName
 *               - date
 *             properties:
 *               metricName:
 *                 type: string
 *               metricCategory:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               userId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               value:
 *                 type: number
 *               valueInt:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Metric recorded successfully
 */
router.post('/metrics', reportingController.recordMetric.bind(reportingController));

/**
 * @swagger
 * /api/reporting/metrics:
 *   get:
 *     summary: Get analytics metrics
 *     tags: [Reporting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metricName
 *         schema:
 *           type: string
 *       - in: query
 *         name: metricCategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', reportingController.getMetrics.bind(reportingController));

export default router;
