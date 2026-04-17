import { Request, Response } from 'express';
import { queueService } from '../services/queue.service';

export class QueueController {
  // ==================== JOB QUEUES ====================

  async createQueue(req: Request, res: Response): Promise<void> {
    try {
      const queue = await queueService.createQueue(req.body);

      res.status(201).json({
        success: true,
        data: queue,
        message: 'Queue created successfully'
      });
    } catch (error: any) {
      console.error('[createQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getQueues(req: Request, res: Response): Promise<void> {
    try {
      const queues = await queueService.getQueues();

      res.json({
        success: true,
        data: queues
      });
    } catch (error: any) {
      console.error('[getQueues] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;

      const queue = await queueService.getQueue(queueId);

      if (!queue) {
        res.status(404).json({
          success: false,
          message: 'Queue not found'
        });
        return;
      }

      res.json({
        success: true,
        data: queue
      });
    } catch (error: any) {
      console.error('[getQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;

      const queue = await queueService.updateQueue(queueId, req.body);

      res.json({
        success: true,
        data: queue,
        message: 'Queue updated successfully'
      });
    } catch (error: any) {
      console.error('[updateQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;

      await queueService.deleteQueue(queueId);

      res.json({
        success: true,
        message: 'Queue deleted successfully'
      });
    } catch (error: any) {
      console.error('[deleteQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async pauseQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;

      const queue = await queueService.pauseQueue(queueId);

      res.json({
        success: true,
        data: queue,
        message: 'Queue paused'
      });
    } catch (error: any) {
      console.error('[pauseQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async resumeQueue(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.params;

      const queue = await queueService.resumeQueue(queueId);

      res.json({
        success: true,
        data: queue,
        message: 'Queue resumed'
      });
    } catch (error: any) {
      console.error('[resumeQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getQueueStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.query;

      const stats = await queueService.getQueueStatistics(queueId as string);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[getQueueStatistics] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== JOB DEFINITIONS ====================

  async createJobDefinition(req: Request, res: Response): Promise<void> {
    try {
      const definition = await queueService.createJobDefinition(req.body);

      res.status(201).json({
        success: true,
        data: definition,
        message: 'Job definition created successfully'
      });
    } catch (error: any) {
      console.error('[createJobDefinition] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const { queueId } = req.query;

      const definitions = await queueService.getJobDefinitions(queueId as string);

      res.json({
        success: true,
        data: definitions
      });
    } catch (error: any) {
      console.error('[getJobDefinitions] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobDefinition(req: Request, res: Response): Promise<void> {
    try {
      const { definitionId } = req.params;

      const definition = await queueService.getJobDefinition(definitionId);

      if (!definition) {
        res.status(404).json({
          success: false,
          message: 'Job definition not found'
        });
        return;
      }

      res.json({
        success: true,
        data: definition
      });
    } catch (error: any) {
      console.error('[getJobDefinition] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateJobDefinition(req: Request, res: Response): Promise<void> {
    try {
      const { definitionId } = req.params;

      const definition = await queueService.updateJobDefinition(definitionId, req.body);

      res.json({
        success: true,
        data: definition,
        message: 'Job definition updated successfully'
      });
    } catch (error: any) {
      console.error('[updateJobDefinition] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteJobDefinition(req: Request, res: Response): Promise<void> {
    try {
      const { definitionId } = req.params;

      await queueService.deleteJobDefinition(definitionId);

      res.json({
        success: true,
        message: 'Job definition deleted successfully'
      });
    } catch (error: any) {
      console.error('[deleteJobDefinition] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== JOBS ====================

  async enqueueJob(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { jobType, jobData, priority, scheduledAt, delaySeconds, dependsOnJobIds, tags, metadata } = req.body;

      if (!jobType || !jobData) {
        res.status(400).json({
          success: false,
          message: 'jobType and jobData are required'
        });
        return;
      }

      const jobId = await queueService.enqueueJob({
        jobType,
        jobData,
        priority,
        scheduledAt,
        delaySeconds,
        dependsOnJobIds,
        tags,
        metadata,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: { jobId },
        message: 'Job enqueued successfully'
      });
    } catch (error: any) {
      console.error('[enqueueJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobs(req: Request, res: Response): Promise<void> {
    try {
      const { queueId, jobType, status, createdBy, tags, limit, offset } = req.query;

      const jobs = await queueService.getJobs({
        queueId: queueId as string,
        jobType: jobType as string,
        status: status as string,
        createdBy: createdBy as string,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      });

      res.json({
        success: true,
        data: jobs
      });
    } catch (error: any) {
      console.error('[getJobs] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await queueService.getJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found'
        });
        return;
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error: any) {
      console.error('[getJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async cancelJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await queueService.cancelJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found or cannot be cancelled'
        });
        return;
      }

      res.json({
        success: true,
        data: job,
        message: 'Job cancelled successfully'
      });
    } catch (error: any) {
      console.error('[cancelJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async retryJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await queueService.retryJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found or cannot be retried'
        });
        return;
      }

      res.json({
        success: true,
        data: job,
        message: 'Job retry scheduled'
      });
    } catch (error: any) {
      console.error('[retryJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobLogs(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const logs = await queueService.getJobLogs(jobId, limit);

      res.json({
        success: true,
        data: logs
      });
    } catch (error: any) {
      console.error('[getJobLogs] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async cleanupOldJobs(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const count = await queueService.cleanupOldJobs(days);

      res.json({
        success: true,
        data: { count },
        message: `Cleaned up ${count} old jobs`
      });
    } catch (error: any) {
      console.error('[cleanupOldJobs] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== JOB SCHEDULES ====================

  async createJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const schedule = await queueService.createJobSchedule({
        ...req.body,
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Job schedule created successfully'
      });
    } catch (error: any) {
      console.error('[createJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await queueService.getJobSchedules();

      res.json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('[getJobSchedules] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const schedule = await queueService.getJobSchedule(scheduleId);

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Job schedule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      console.error('[getJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const schedule = await queueService.updateJobSchedule(scheduleId, req.body);

      res.json({
        success: true,
        data: schedule,
        message: 'Job schedule updated successfully'
      });
    } catch (error: any) {
      console.error('[updateJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      await queueService.deleteJobSchedule(scheduleId);

      res.json({
        success: true,
        message: 'Job schedule deleted successfully'
      });
    } catch (error: any) {
      console.error('[deleteJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async enableJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const schedule = await queueService.enableJobSchedule(scheduleId);

      res.json({
        success: true,
        data: schedule,
        message: 'Job schedule enabled'
      });
    } catch (error: any) {
      console.error('[enableJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async disableJobSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const schedule = await queueService.disableJobSchedule(scheduleId);

      res.json({
        success: true,
        data: schedule,
        message: 'Job schedule disabled'
      });
    } catch (error: any) {
      console.error('[disableJobSchedule] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== WORKERS ====================

  async registerWorker(req: Request, res: Response): Promise<void> {
    try {
      const worker = await queueService.registerWorker(req.body);

      res.status(201).json({
        success: true,
        data: worker,
        message: 'Worker registered successfully'
      });
    } catch (error: any) {
      console.error('[registerWorker] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWorkers(req: Request, res: Response): Promise<void> {
    try {
      const workers = await queueService.getWorkers();

      res.json({
        success: true,
        data: workers
      });
    } catch (error: any) {
      console.error('[getWorkers] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWorker(req: Request, res: Response): Promise<void> {
    try {
      const { workerId } = req.params;

      const worker = await queueService.getWorker(workerId);

      if (!worker) {
        res.status(404).json({
          success: false,
          message: 'Worker not found'
        });
        return;
      }

      res.json({
        success: true,
        data: worker
      });
    } catch (error: any) {
      console.error('[getWorker] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateWorkerHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { workerId } = req.params;

      const worker = await queueService.updateWorkerHeartbeat(workerId);

      res.json({
        success: true,
        data: worker
      });
    } catch (error: any) {
      console.error('[updateWorkerHeartbeat] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async unregisterWorker(req: Request, res: Response): Promise<void> {
    try {
      const { workerId } = req.params;

      const worker = await queueService.unregisterWorker(workerId);

      res.json({
        success: true,
        data: worker,
        message: 'Worker unregistered successfully'
      });
    } catch (error: any) {
      console.error('[unregisterWorker] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWorkerHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await queueService.getWorkerHealth();

      res.json({
        success: true,
        data: health
      });
    } catch (error: any) {
      console.error('[getWorkerHealth] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== DEAD LETTER QUEUE ====================

  async getDeadLetterQueue(req: Request, res: Response): Promise<void> {
    try {
      const { jobType, queueId, isResolved, limit } = req.query;

      const dlq = await queueService.getDeadLetterQueue({
        jobType: jobType as string,
        queueId: queueId as string,
        isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.json({
        success: true,
        data: dlq
      });
    } catch (error: any) {
      console.error('[getDeadLetterQueue] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async resolveDeadLetterJob(req: Request, res: Response): Promise<void> {
    try {
      const { dlqId } = req.params;
      const userId = (req as any).user?.userId;
      const { resolutionNote } = req.body;

      const dlqJob = await queueService.resolveDeadLetterJob(dlqId, userId, resolutionNote);

      res.json({
        success: true,
        data: dlqJob,
        message: 'Dead letter job resolved'
      });
    } catch (error: any) {
      console.error('[resolveDeadLetterJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async replayDeadLetterJob(req: Request, res: Response): Promise<void> {
    try {
      const { dlqId } = req.params;

      const jobId = await queueService.replayDeadLetterJob(dlqId);

      res.json({
        success: true,
        data: { jobId },
        message: 'Dead letter job replayed'
      });
    } catch (error: any) {
      console.error('[replayDeadLetterJob] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== STATISTICS ====================

  async getJobStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { queueId, jobType, startDate, endDate } = req.query;

      const stats = await queueService.getJobStatistics({
        queueId: queueId as string,
        jobType: jobType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[getJobStatistics] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFailedJobsSummary(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const summary = await queueService.getFailedJobsSummary(limit);

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      console.error('[getFailedJobsSummary] Error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const queueController = new QueueController();
