import { Router } from 'express';
import { queueController } from '../controllers/queue.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Queue
 *   description: Queue and background job management endpoints
 */

// ========================================
// JOB QUEUES
// ========================================

/**
 * @swagger
 * /api/queue/queues:
 *   post:
 *     summary: Create job queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queueName
 *             properties:
 *               queueName:
 *                 type: string
 *               description:
 *                 type: string
 *               maxConcurrentJobs:
 *                 type: integer
 *               rateLimitPerMinute:
 *                 type: integer
 *               defaultTimeoutSeconds:
 *                 type: integer
 *               defaultRetryLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Queue created
 */
router.post('/queues', authenticate, authorizeRoles('admin'), queueController.createQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues:
 *   get:
 *     summary: Get all job queues
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queues retrieved
 */
router.get('/queues', authenticate, queueController.getQueues.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/{queueId}:
 *   get:
 *     summary: Get queue by ID
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue retrieved
 */
router.get('/queues/:queueId', authenticate, queueController.getQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/{queueId}:
 *   put:
 *     summary: Update job queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
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
 *         description: Queue updated
 */
router.put('/queues/:queueId', authenticate, authorizeRoles('admin'), queueController.updateQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/{queueId}:
 *   delete:
 *     summary: Delete job queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue deleted
 */
router.delete('/queues/:queueId', authenticate, authorizeRoles('admin'), queueController.deleteQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/{queueId}/pause:
 *   post:
 *     summary: Pause job queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue paused
 */
router.post('/queues/:queueId/pause', authenticate, authorizeRoles('admin'), queueController.pauseQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/{queueId}/resume:
 *   post:
 *     summary: Resume job queue
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Queue resumed
 */
router.post('/queues/:queueId/resume', authenticate, authorizeRoles('admin'), queueController.resumeQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/queues/statistics:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/queues/stats/all', authenticate, queueController.getQueueStatistics.bind(queueController));

// ========================================
// JOB DEFINITIONS
// ========================================

/**
 * @swagger
 * /api/queue/definitions:
 *   post:
 *     summary: Create job definition
 *     tags: [Queue]
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
 *               - jobName
 *               - queueId
 *               - handlerFunction
 *             properties:
 *               jobType:
 *                 type: string
 *               jobName:
 *                 type: string
 *               queueId:
 *                 type: string
 *               handlerFunction:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job definition created
 */
router.post('/definitions', authenticate, authorizeRoles('admin'), queueController.createJobDefinition.bind(queueController));

/**
 * @swagger
 * /api/queue/definitions:
 *   get:
 *     summary: Get job definitions
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job definitions retrieved
 */
router.get('/definitions', authenticate, queueController.getJobDefinitions.bind(queueController));

/**
 * @swagger
 * /api/queue/definitions/{definitionId}:
 *   get:
 *     summary: Get job definition by ID
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: definitionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job definition retrieved
 */
router.get('/definitions/:definitionId', authenticate, queueController.getJobDefinition.bind(queueController));

/**
 * @swagger
 * /api/queue/definitions/{definitionId}:
 *   put:
 *     summary: Update job definition
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: definitionId
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
 *         description: Job definition updated
 */
router.put('/definitions/:definitionId', authenticate, authorizeRoles('admin'), queueController.updateJobDefinition.bind(queueController));

/**
 * @swagger
 * /api/queue/definitions/{definitionId}:
 *   delete:
 *     summary: Delete job definition
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: definitionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job definition deleted
 */
router.delete('/definitions/:definitionId', authenticate, authorizeRoles('admin'), queueController.deleteJobDefinition.bind(queueController));

// ========================================
// JOBS
// ========================================

/**
 * @swagger
 * /api/queue/jobs:
 *   post:
 *     summary: Enqueue job
 *     tags: [Queue]
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
 *               - jobData
 *             properties:
 *               jobType:
 *                 type: string
 *               jobData:
 *                 type: object
 *               priority:
 *                 type: string
 *               delaySeconds:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Job enqueued
 */
router.post('/jobs', authenticate, queueController.enqueueJob.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs:
 *   get:
 *     summary: Get jobs
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
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
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Jobs retrieved
 */
router.get('/jobs', authenticate, queueController.getJobs.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs/{jobId}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Queue]
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
 *         description: Job retrieved
 */
router.get('/jobs/:jobId', authenticate, queueController.getJob.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs/{jobId}/cancel:
 *   post:
 *     summary: Cancel job
 *     tags: [Queue]
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
 *         description: Job cancelled
 */
router.post('/jobs/:jobId/cancel', authenticate, queueController.cancelJob.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs/{jobId}/retry:
 *   post:
 *     summary: Retry failed job
 *     tags: [Queue]
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
 *         description: Job retry scheduled
 */
router.post('/jobs/:jobId/retry', authenticate, queueController.retryJob.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs/{jobId}/logs:
 *   get:
 *     summary: Get job logs
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job logs retrieved
 */
router.get('/jobs/:jobId/logs', authenticate, queueController.getJobLogs.bind(queueController));

/**
 * @swagger
 * /api/queue/jobs/cleanup:
 *   post:
 *     summary: Cleanup old completed jobs
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Old jobs cleaned up
 */
router.post('/jobs/cleanup/old', authenticate, authorizeRoles('admin'), queueController.cleanupOldJobs.bind(queueController));

// ========================================
// JOB SCHEDULES
// ========================================

/**
 * @swagger
 * /api/queue/schedules:
 *   post:
 *     summary: Create job schedule
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleName
 *               - jobDefinitionId
 *               - frequency
 *             properties:
 *               scheduleName:
 *                 type: string
 *               jobDefinitionId:
 *                 type: string
 *               frequency:
 *                 type: string
 *               cronExpression:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job schedule created
 */
router.post('/schedules', authenticate, authorizeRoles('admin'), queueController.createJobSchedule.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules:
 *   get:
 *     summary: Get job schedules
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job schedules retrieved
 */
router.get('/schedules', authenticate, queueController.getJobSchedules.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules/{scheduleId}:
 *   get:
 *     summary: Get job schedule by ID
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job schedule retrieved
 */
router.get('/schedules/:scheduleId', authenticate, queueController.getJobSchedule.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules/{scheduleId}:
 *   put:
 *     summary: Update job schedule
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
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
 *         description: Job schedule updated
 */
router.put('/schedules/:scheduleId', authenticate, authorizeRoles('admin'), queueController.updateJobSchedule.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete job schedule
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job schedule deleted
 */
router.delete('/schedules/:scheduleId', authenticate, authorizeRoles('admin'), queueController.deleteJobSchedule.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules/{scheduleId}/enable:
 *   post:
 *     summary: Enable job schedule
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job schedule enabled
 */
router.post('/schedules/:scheduleId/enable', authenticate, authorizeRoles('admin'), queueController.enableJobSchedule.bind(queueController));

/**
 * @swagger
 * /api/queue/schedules/{scheduleId}/disable:
 *   post:
 *     summary: Disable job schedule
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job schedule disabled
 */
router.post('/schedules/:scheduleId/disable', authenticate, authorizeRoles('admin'), queueController.disableJobSchedule.bind(queueController));

// ========================================
// WORKERS
// ========================================

/**
 * @swagger
 * /api/queue/workers:
 *   post:
 *     summary: Register worker
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerName
 *               - workerHost
 *               - queueIds
 *             properties:
 *               workerName:
 *                 type: string
 *               workerHost:
 *                 type: string
 *               queueIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Worker registered
 */
router.post('/workers', authenticate, authorizeRoles('admin'), queueController.registerWorker.bind(queueController));

/**
 * @swagger
 * /api/queue/workers:
 *   get:
 *     summary: Get all workers
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workers retrieved
 */
router.get('/workers', authenticate, queueController.getWorkers.bind(queueController));

/**
 * @swagger
 * /api/queue/workers/{workerId}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worker retrieved
 */
router.get('/workers/:workerId', authenticate, queueController.getWorker.bind(queueController));

/**
 * @swagger
 * /api/queue/workers/{workerId}/heartbeat:
 *   post:
 *     summary: Update worker heartbeat
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Heartbeat updated
 */
router.post('/workers/:workerId/heartbeat', authenticate, queueController.updateWorkerHeartbeat.bind(queueController));

/**
 * @swagger
 * /api/queue/workers/{workerId}/unregister:
 *   post:
 *     summary: Unregister worker
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worker unregistered
 */
router.post('/workers/:workerId/unregister', authenticate, authorizeRoles('admin'), queueController.unregisterWorker.bind(queueController));

/**
 * @swagger
 * /api/queue/workers/health:
 *   get:
 *     summary: Get worker health status
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker health retrieved
 */
router.get('/workers/health/all', authenticate, queueController.getWorkerHealth.bind(queueController));

// ========================================
// DEAD LETTER QUEUE
// ========================================

/**
 * @swagger
 * /api/queue/dead-letter:
 *   get:
 *     summary: Get dead letter queue jobs
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isResolved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dead letter queue retrieved
 */
router.get('/dead-letter', authenticate, queueController.getDeadLetterQueue.bind(queueController));

/**
 * @swagger
 * /api/queue/dead-letter/{dlqId}/resolve:
 *   post:
 *     summary: Resolve dead letter job
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dlqId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dead letter job resolved
 */
router.post('/dead-letter/:dlqId/resolve', authenticate, authorizeRoles('admin'), queueController.resolveDeadLetterJob.bind(queueController));

/**
 * @swagger
 * /api/queue/dead-letter/{dlqId}/replay:
 *   post:
 *     summary: Replay dead letter job
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dlqId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dead letter job replayed
 */
router.post('/dead-letter/:dlqId/replay', authenticate, authorizeRoles('admin'), queueController.replayDeadLetterJob.bind(queueController));

// ========================================
// STATISTICS
// ========================================

/**
 * @swagger
 * /api/queue/statistics:
 *   get:
 *     summary: Get job statistics
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
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
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get('/statistics', authenticate, queueController.getJobStatistics.bind(queueController));

/**
 * @swagger
 * /api/queue/statistics/failed:
 *   get:
 *     summary: Get failed jobs summary
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Failed jobs summary retrieved
 */
router.get('/statistics/failed', authenticate, queueController.getFailedJobsSummary.bind(queueController));

export default router;
