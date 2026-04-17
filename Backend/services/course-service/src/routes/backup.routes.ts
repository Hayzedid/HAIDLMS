import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Backup & Recovery
 *   description: Backup management, disaster recovery, and data import/export
 */

// BACKUP CONFIGURATIONS
/**
 * @swagger
 * /api/backup/configurations:
 *   post:
 *     summary: Create backup configuration
 *     tags: [Backup & Recovery]
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
 *               backupType:
 *                 type: string
 *                 enum: [full, incremental, differential, snapshot]
 *               frequency:
 *                 type: string
 *                 enum: [hourly, daily, weekly, monthly, custom]
 *               scheduleCron:
 *                 type: string
 *               retentionDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/configurations', authenticate, backupController.createBackupConfiguration.bind(backupController));

/**
 * @swagger
 * /api/backup/configurations:
 *   get:
 *     summary: List backup configurations
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 */
router.get('/configurations', authenticate, backupController.listBackupConfigurations.bind(backupController));

/**
 * @swagger
 * /api/backup/configurations/{configId}:
 *   get:
 *     summary: Get backup configuration
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 */
router.get('/configurations/:configId', authenticate, backupController.getBackupConfiguration.bind(backupController));

/**
 * @swagger
 * /api/backup/configurations/{configId}:
 *   patch:
 *     summary: Update backup configuration
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.patch('/configurations/:configId', authenticate, backupController.updateBackupConfiguration.bind(backupController));

/**
 * @swagger
 * /api/backup/configurations/{configId}:
 *   delete:
 *     summary: Delete backup configuration
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/configurations/:configId', authenticate, backupController.deleteBackupConfiguration.bind(backupController));

/**
 * @swagger
 * /api/backup/configurations/{configId}/next-run:
 *   get:
 *     summary: Calculate next backup run time
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Next run time calculated successfully
 */
router.get('/configurations/:configId/next-run', authenticate, backupController.calculateNextBackupRun.bind(backupController));

// BACKUP JOBS
/**
 * @swagger
 * /api/backup/jobs:
 *   post:
 *     summary: Create backup job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *               - backupType
 *             properties:
 *               configId:
 *                 type: string
 *               jobName:
 *                 type: string
 *               backupType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Backup job created successfully
 */
router.post('/jobs', authenticate, backupController.createBackupJob.bind(backupController));

/**
 * @swagger
 * /api/backup/jobs:
 *   get:
 *     summary: List backup jobs
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: configId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Backup jobs retrieved successfully
 */
router.get('/jobs', authenticate, backupController.listBackupJobs.bind(backupController));

/**
 * @swagger
 * /api/backup/jobs/{jobId}:
 *   get:
 *     summary: Get backup job
 *     tags: [Backup & Recovery]
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
 *         description: Backup job retrieved successfully
 */
router.get('/jobs/:jobId', authenticate, backupController.getBackupJob.bind(backupController));

/**
 * @swagger
 * /api/backup/jobs/{jobId}:
 *   patch:
 *     summary: Update backup job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Backup job updated successfully
 */
router.patch('/jobs/:jobId', authenticate, backupController.updateBackupJob.bind(backupController));

/**
 * @swagger
 * /api/backup/jobs/{jobId}/retry:
 *   post:
 *     summary: Retry backup job
 *     tags: [Backup & Recovery]
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
 *         description: Backup job retried successfully
 */
router.post('/jobs/:jobId/retry', authenticate, backupController.retryBackupJob.bind(backupController));

/**
 * @swagger
 * /api/backup/summary:
 *   get:
 *     summary: Get backup summary
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 */
router.get('/summary', authenticate, backupController.getBackupSummary.bind(backupController));

/**
 * @swagger
 * /api/backup/recent:
 *   get:
 *     summary: Get recent backups
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent backups retrieved successfully
 */
router.get('/recent', authenticate, backupController.getRecentBackups.bind(backupController));

/**
 * @swagger
 * /api/backup/health:
 *   get:
 *     summary: Get backup health status
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 */
router.get('/health', authenticate, backupController.getBackupHealthStatus.bind(backupController));

// RESTORE JOBS
/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     summary: Create restore job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restoreName
 *               - restoreType
 *             properties:
 *               backupJobId:
 *                 type: string
 *               recoveryPointId:
 *                 type: string
 *               restoreName:
 *                 type: string
 *               restoreType:
 *                 type: string
 *               targetDatabase:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restore job created successfully
 */
router.post('/restore', authenticate, backupController.createRestoreJob.bind(backupController));

/**
 * @swagger
 * /api/backup/restore:
 *   get:
 *     summary: List restore jobs
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: backupJobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Restore jobs retrieved successfully
 */
router.get('/restore', authenticate, backupController.listRestoreJobs.bind(backupController));

/**
 * @swagger
 * /api/backup/restore/{restoreId}:
 *   get:
 *     summary: Get restore job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restoreId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restore job retrieved successfully
 */
router.get('/restore/:restoreId', authenticate, backupController.getRestoreJob.bind(backupController));

/**
 * @swagger
 * /api/backup/restore/{restoreId}:
 *   patch:
 *     summary: Update restore job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restoreId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Restore job updated successfully
 */
router.patch('/restore/:restoreId', authenticate, backupController.updateRestoreJob.bind(backupController));

/**
 * @swagger
 * /api/backup/restore/{restoreId}/approve:
 *   post:
 *     summary: Approve restore job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restoreId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restore job approved successfully
 */
router.post('/restore/:restoreId/approve', authenticate, backupController.approveRestoreJob.bind(backupController));

// RECOVERY POINTS
/**
 * @swagger
 * /api/backup/recovery-points:
 *   post:
 *     summary: Create recovery point
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupJobId
 *               - pointName
 *               - pointTimestamp
 *             properties:
 *               backupJobId:
 *                 type: string
 *               pointName:
 *                 type: string
 *               pointTimestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Recovery point created successfully
 */
router.post('/recovery-points', authenticate, backupController.createRecoveryPoint.bind(backupController));

/**
 * @swagger
 * /api/backup/recovery-points:
 *   get:
 *     summary: List recovery points
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: backupJobId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recovery points retrieved successfully
 */
router.get('/recovery-points', authenticate, backupController.listRecoveryPoints.bind(backupController));

/**
 * @swagger
 * /api/backup/recovery-points/{pointId}:
 *   get:
 *     summary: Get recovery point
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recovery point retrieved successfully
 */
router.get('/recovery-points/:pointId', authenticate, backupController.getRecoveryPoint.bind(backupController));

/**
 * @swagger
 * /api/backup/recovery-points/{pointId}/test:
 *   post:
 *     summary: Test recovery point
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
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
 *               - testNotes
 *             properties:
 *               testNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recovery point tested successfully
 */
router.post('/recovery-points/:pointId/test', authenticate, backupController.testRecoveryPoint.bind(backupController));

/**
 * @swagger
 * /api/backup/recovery-points/{pointId}/invalidate:
 *   post:
 *     summary: Invalidate recovery point
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recovery point invalidated successfully
 */
router.post('/recovery-points/:pointId/invalidate', authenticate, backupController.invalidateRecoveryPoint.bind(backupController));

// DISASTER RECOVERY PLANS
/**
 * @swagger
 * /api/backup/dr-plans:
 *   post:
 *     summary: Create DR plan
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planName
 *             properties:
 *               planName:
 *                 type: string
 *               description:
 *                 type: string
 *               recoveryTimeObjectiveHours:
 *                 type: integer
 *     responses:
 *       201:
 *         description: DR plan created successfully
 */
router.post('/dr-plans', authenticate, backupController.createDRPlan.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-plans:
 *   get:
 *     summary: List DR plans
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: DR plans retrieved successfully
 */
router.get('/dr-plans', authenticate, backupController.listDRPlans.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-plans/{planId}:
 *   get:
 *     summary: Get DR plan
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DR plan retrieved successfully
 */
router.get('/dr-plans/:planId', authenticate, backupController.getDRPlan.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-plans/{planId}:
 *   patch:
 *     summary: Update DR plan
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: DR plan updated successfully
 */
router.patch('/dr-plans/:planId', authenticate, backupController.updateDRPlan.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-plans/{planId}/approve:
 *   post:
 *     summary: Approve DR plan
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DR plan approved successfully
 */
router.post('/dr-plans/:planId/approve', authenticate, backupController.approveDRPlan.bind(backupController));

// DR EXECUTIONS
/**
 * @swagger
 * /api/backup/dr-executions:
 *   post:
 *     summary: Create DR execution
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - executionName
 *               - executionType
 *             properties:
 *               planId:
 *                 type: string
 *               executionName:
 *                 type: string
 *               executionType:
 *                 type: string
 *     responses:
 *       201:
 *         description: DR execution created successfully
 */
router.post('/dr-executions', authenticate, backupController.createDRExecution.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-executions/{executionId}:
 *   patch:
 *     summary: Update DR execution
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: DR execution updated successfully
 */
router.patch('/dr-executions/:executionId', authenticate, backupController.updateDRExecution.bind(backupController));

/**
 * @swagger
 * /api/backup/dr-executions:
 *   get:
 *     summary: List DR executions
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DR executions retrieved successfully
 */
router.get('/dr-executions', authenticate, backupController.listDRExecutions.bind(backupController));

// EXPORT JOBS
/**
 * @swagger
 * /api/backup/export:
 *   post:
 *     summary: Create export job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exportName
 *               - exportFormat
 *               - tables
 *             properties:
 *               exportName:
 *                 type: string
 *               exportFormat:
 *                 type: string
 *                 enum: [json, csv, excel, sql, xml]
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Export job created successfully
 */
router.post('/export', authenticate, backupController.createExportJob.bind(backupController));

/**
 * @swagger
 * /api/backup/export:
 *   get:
 *     summary: List export jobs
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requestedBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export jobs retrieved successfully
 */
router.get('/export', authenticate, backupController.listExportJobs.bind(backupController));

/**
 * @swagger
 * /api/backup/export/{exportId}:
 *   get:
 *     summary: Get export job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export job retrieved successfully
 */
router.get('/export/:exportId', authenticate, backupController.getExportJob.bind(backupController));

/**
 * @swagger
 * /api/backup/export/{exportId}:
 *   patch:
 *     summary: Update export job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Export job updated successfully
 */
router.patch('/export/:exportId', authenticate, backupController.updateExportJob.bind(backupController));

// IMPORT JOBS
/**
 * @swagger
 * /api/backup/import:
 *   post:
 *     summary: Create import job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - importName
 *               - importFormat
 *               - sourceFilePath
 *               - targetTable
 *             properties:
 *               importName:
 *                 type: string
 *               importFormat:
 *                 type: string
 *               sourceFilePath:
 *                 type: string
 *               targetTable:
 *                 type: string
 *     responses:
 *       201:
 *         description: Import job created successfully
 */
router.post('/import', authenticate, backupController.createImportJob.bind(backupController));

/**
 * @swagger
 * /api/backup/import:
 *   get:
 *     summary: List import jobs
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requestedBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import jobs retrieved successfully
 */
router.get('/import', authenticate, backupController.listImportJobs.bind(backupController));

/**
 * @swagger
 * /api/backup/import/{importId}:
 *   get:
 *     summary: Get import job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import job retrieved successfully
 */
router.get('/import/:importId', authenticate, backupController.getImportJob.bind(backupController));

/**
 * @swagger
 * /api/backup/import/{importId}:
 *   patch:
 *     summary: Update import job
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: importId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Import job updated successfully
 */
router.patch('/import/:importId', authenticate, backupController.updateImportJob.bind(backupController));

// BACKUP VERIFICATION
/**
 * @swagger
 * /api/backup/verifications:
 *   post:
 *     summary: Create backup verification
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupJobId
 *               - verificationType
 *             properties:
 *               backupJobId:
 *                 type: string
 *               verificationType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Verification created successfully
 */
router.post('/verifications', authenticate, backupController.createVerification.bind(backupController));

/**
 * @swagger
 * /api/backup/verifications:
 *   get:
 *     summary: List backup verifications
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: backupJobId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verifications retrieved successfully
 */
router.get('/verifications', authenticate, backupController.listVerifications.bind(backupController));

// STORAGE LOCATIONS
/**
 * @swagger
 * /api/backup/storage:
 *   post:
 *     summary: Create storage location
 *     tags: [Backup & Recovery]
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
 *               - provider
 *             properties:
 *               name:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [local, s3, azure_blob, google_cloud, ftp, sftp]
 *     responses:
 *       201:
 *         description: Storage location created successfully
 */
router.post('/storage', authenticate, backupController.createStorageLocation.bind(backupController));

/**
 * @swagger
 * /api/backup/storage:
 *   get:
 *     summary: List storage locations
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Storage locations retrieved successfully
 */
router.get('/storage', authenticate, backupController.listStorageLocations.bind(backupController));

/**
 * @swagger
 * /api/backup/storage/{locationId}:
 *   get:
 *     summary: Get storage location
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Storage location retrieved successfully
 */
router.get('/storage/:locationId', authenticate, backupController.getStorageLocation.bind(backupController));

/**
 * @swagger
 * /api/backup/storage/{locationId}:
 *   patch:
 *     summary: Update storage location
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Storage location updated successfully
 */
router.patch('/storage/:locationId', authenticate, backupController.updateStorageLocation.bind(backupController));

// UTILITY ENDPOINTS
/**
 * @swagger
 * /api/backup/configurations/{configId}/cleanup:
 *   post:
 *     summary: Cleanup old backups
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Old backups cleaned up successfully
 */
router.post('/configurations/:configId/cleanup', authenticate, backupController.cleanupOldBackups.bind(backupController));

/**
 * @swagger
 * /api/backup/jobs/{backupId}/restorable:
 *   get:
 *     summary: Check if backup is restorable
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restorable status checked successfully
 */
router.get('/jobs/:backupId/restorable', authenticate, backupController.isBackupRestorable.bind(backupController));

/**
 * @swagger
 * /api/backup/audit-log:
 *   get:
 *     summary: Get backup audit log
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 */
router.get('/audit-log', authenticate, backupController.getBackupAuditLog.bind(backupController));

export default router;
