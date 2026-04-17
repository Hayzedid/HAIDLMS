import pool from '../db/pool';

interface JobQueue {
  queueName: string;
  description?: string;
  maxConcurrentJobs?: number;
  rateLimitPerMinute?: number;
  defaultTimeoutSeconds?: number;
  defaultRetryLimit?: number;
  defaultRetryDelaySeconds?: number;
  priorityEnabled?: boolean;
  fifoMode?: boolean;
  metadata?: any;
}

interface JobDefinition {
  jobType: string;
  jobName: string;
  description?: string;
  queueId: string;
  handlerFunction: string;
  handlerModule?: string;
  defaultPriority?: string;
  defaultTimeoutSeconds?: number;
  defaultRetryLimit?: number;
  retryStrategy?: string;
  inputSchema?: any;
  metadata?: any;
}

interface EnqueueJobInput {
  jobType: string;
  jobData: any;
  priority?: string;
  scheduledAt?: Date;
  delaySeconds?: number;
  dependsOnJobIds?: string[];
  tags?: string[];
  metadata?: any;
  createdBy?: string;
}

interface JobSchedule {
  scheduleName: string;
  description?: string;
  jobDefinitionId: string;
  jobData?: any;
  frequency: string;
  cronExpression?: string;
  intervalSeconds?: number;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  validFrom?: Date;
  validUntil?: Date;
  createdBy?: string;
}

interface Worker {
  workerName: string;
  workerHost: string;
  workerPid?: number;
  workerVersion?: string;
  queueIds: string[];
  maxConcurrentJobs?: number;
  heartbeatIntervalSeconds?: number;
  metadata?: any;
}

class QueueService {
  // ==================== JOB QUEUES ====================

  async createQueue(data: JobQueue) {
    const result = await pool.query(
      `INSERT INTO job_queues (
        queue_name, description, max_concurrent_jobs,
        rate_limit_per_minute, default_timeout_seconds,
        default_retry_limit, default_retry_delay_seconds,
        priority_enabled, fifo_mode, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.queueName,
        data.description || null,
        data.maxConcurrentJobs || 10,
        data.rateLimitPerMinute || 0,
        data.defaultTimeoutSeconds || 300,
        data.defaultRetryLimit || 3,
        data.defaultRetryDelaySeconds || 60,
        data.priorityEnabled !== undefined ? data.priorityEnabled : true,
        data.fifoMode || false,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );

    return result.rows[0];
  }

  async getQueues() {
    const result = await pool.query(
      `SELECT * FROM job_queues ORDER BY queue_name`
    );

    return result.rows;
  }

  async getQueue(queueId: string) {
    const result = await pool.query(
      `SELECT * FROM job_queues WHERE id = $1`,
      [queueId]
    );

    return result.rows[0] || null;
  }

  async getQueueByName(queueName: string) {
    const result = await pool.query(
      `SELECT * FROM job_queues WHERE queue_name = $1`,
      [queueName]
    );

    return result.rows[0] || null;
  }

  async updateQueue(queueId: string, updates: Partial<JobQueue>) {
    const fields: string[] = [];
    const values: any[] = [queueId];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return this.getQueue(queueId);
    }

    fields.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE job_queues
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteQueue(queueId: string) {
    await pool.query(
      `DELETE FROM job_queues WHERE id = $1`,
      [queueId]
    );
  }

  async pauseQueue(queueId: string) {
    const result = await pool.query(
      `UPDATE job_queues
       SET status = 'paused', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [queueId]
    );

    return result.rows[0] || null;
  }

  async resumeQueue(queueId: string) {
    const result = await pool.query(
      `UPDATE job_queues
       SET status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [queueId]
    );

    return result.rows[0] || null;
  }

  async getQueueStatistics(queueId?: string) {
    const query = queueId
      ? `SELECT * FROM queue_statistics WHERE id = $1`
      : `SELECT * FROM queue_statistics`;

    const params = queueId ? [queueId] : [];
    const result = await pool.query(query, params);

    return queueId ? result.rows[0] || null : result.rows;
  }

  // ==================== JOB DEFINITIONS ====================

  async createJobDefinition(data: JobDefinition) {
    const result = await pool.query(
      `INSERT INTO job_definitions (
        job_type, job_name, description, queue_id,
        handler_function, handler_module,
        default_priority, default_timeout_seconds,
        default_retry_limit, retry_strategy,
        input_schema, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.jobType,
        data.jobName,
        data.description || null,
        data.queueId,
        data.handlerFunction,
        data.handlerModule || null,
        data.defaultPriority || 'normal',
        data.defaultTimeoutSeconds || 300,
        data.defaultRetryLimit || 3,
        data.retryStrategy || 'exponential',
        data.inputSchema ? JSON.stringify(data.inputSchema) : null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );

    return result.rows[0];
  }

  async getJobDefinitions(queueId?: string) {
    const query = queueId
      ? `SELECT * FROM job_definitions WHERE queue_id = $1 ORDER BY job_name`
      : `SELECT * FROM job_definitions ORDER BY job_name`;

    const params = queueId ? [queueId] : [];
    const result = await pool.query(query, params);

    return result.rows;
  }

  async getJobDefinition(jobDefinitionId: string) {
    const result = await pool.query(
      `SELECT * FROM job_definitions WHERE id = $1`,
      [jobDefinitionId]
    );

    return result.rows[0] || null;
  }

  async getJobDefinitionByType(jobType: string) {
    const result = await pool.query(
      `SELECT * FROM job_definitions WHERE job_type = $1`,
      [jobType]
    );

    return result.rows[0] || null;
  }

  async updateJobDefinition(jobDefinitionId: string, updates: Partial<JobDefinition>) {
    const fields: string[] = [];
    const values: any[] = [jobDefinitionId];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return this.getJobDefinition(jobDefinitionId);
    }

    fields.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE job_definitions
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteJobDefinition(jobDefinitionId: string) {
    await pool.query(
      `DELETE FROM job_definitions WHERE id = $1`,
      [jobDefinitionId]
    );
  }

  // ==================== JOBS ====================

  async enqueueJob(data: EnqueueJobInput) {
    const result = await pool.query(
      `SELECT enqueue_job($1, $2, $3, $4, $5, $6) AS job_id`,
      [
        data.jobType,
        JSON.stringify(data.jobData),
        data.priority || 'normal',
        data.scheduledAt || new Date(),
        data.delaySeconds || 0,
        data.createdBy || null
      ]
    );

    const jobId = result.rows[0].job_id;

    // Update job with additional fields
    if (data.dependsOnJobIds || data.tags || data.metadata) {
      await pool.query(
        `UPDATE jobs
         SET depends_on_job_ids = $2,
             tags = $3,
             metadata = $4
         WHERE id = $1`,
        [
          jobId,
          data.dependsOnJobIds || null,
          data.tags || null,
          data.metadata ? JSON.stringify(data.metadata) : null
        ]
      );
    }

    return jobId;
  }

  async getJobs(filters: {
    queueId?: string;
    jobType?: string;
    status?: string;
    createdBy?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.queueId) {
      paramCount++;
      conditions.push(`queue_id = $${paramCount}`);
      values.push(filters.queueId);
    }

    if (filters.jobType) {
      paramCount++;
      conditions.push(`job_type = $${paramCount}`);
      values.push(filters.jobType);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    if (filters.createdBy) {
      paramCount++;
      conditions.push(`created_by = $${paramCount}`);
      values.push(filters.createdBy);
    }

    if (filters.tags && filters.tags.length > 0) {
      paramCount++;
      conditions.push(`tags && $${paramCount}`);
      values.push(filters.tags);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await pool.query(
      `SELECT * FROM jobs
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...values, limit, offset]
    );

    return result.rows;
  }

  async getJob(jobId: string) {
    const result = await pool.query(
      `SELECT * FROM jobs WHERE id = $1`,
      [jobId]
    );

    return result.rows[0] || null;
  }

  async updateJobProgress(jobId: string, progress: number, progressMessage?: string) {
    const result = await pool.query(
      `UPDATE jobs
       SET progress = $2,
           progress_message = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [jobId, progress, progressMessage || null]
    );

    return result.rows[0] || null;
  }

  async completeJob(jobId: string, result: any, executionTimeMs?: number) {
    await pool.query(
      `SELECT complete_job($1, $2, $3)`,
      [jobId, result ? JSON.stringify(result) : null, executionTimeMs || null]
    );
  }

  async failJob(jobId: string, errorMessage: string, errorStack?: string, errorCode?: string) {
    await pool.query(
      `SELECT fail_job($1, $2, $3, $4)`,
      [jobId, errorMessage, errorStack || null, errorCode || null]
    );
  }

  async cancelJob(jobId: string) {
    const result = await pool.query(
      `UPDATE jobs
       SET status = 'cancelled',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'queued')
       RETURNING *`,
      [jobId]
    );

    return result.rows[0] || null;
  }

  async retryJob(jobId: string) {
    const result = await pool.query(
      `UPDATE jobs
       SET status = 'queued',
           retry_count = 0,
           next_retry_at = NULL,
           error_message = NULL,
           error_stack = NULL,
           error_code = NULL,
           updated_at = NOW()
       WHERE id = $1 AND status IN ('failed', 'retrying')
       RETURNING *`,
      [jobId]
    );

    return result.rows[0] || null;
  }

  async pickNextJob(workerId: string, queueIds: string[]) {
    const result = await pool.query(
      `SELECT pick_next_job($1, $2) AS job_id`,
      [workerId, queueIds]
    );

    return result.rows[0].job_id;
  }

  async cleanupOldJobs(days: number = 30) {
    const result = await pool.query(
      `SELECT cleanup_old_jobs($1) AS count`,
      [days]
    );

    return result.rows[0].count;
  }

  // ==================== JOB SCHEDULES ====================

  async createJobSchedule(data: JobSchedule) {
    const result = await pool.query(
      `INSERT INTO job_schedules (
        schedule_name, description, job_definition_id,
        job_data, frequency, cron_expression,
        interval_seconds, start_time, end_time,
        timezone, valid_from, valid_until, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.scheduleName,
        data.description || null,
        data.jobDefinitionId,
        data.jobData ? JSON.stringify(data.jobData) : null,
        data.frequency,
        data.cronExpression || null,
        data.intervalSeconds || null,
        data.startTime || null,
        data.endTime || null,
        data.timezone || 'UTC',
        data.validFrom || new Date(),
        data.validUntil || null,
        data.createdBy || null
      ]
    );

    return result.rows[0];
  }

  async getJobSchedules() {
    const result = await pool.query(
      `SELECT * FROM job_schedules ORDER BY schedule_name`
    );

    return result.rows;
  }

  async getJobSchedule(scheduleId: string) {
    const result = await pool.query(
      `SELECT * FROM job_schedules WHERE id = $1`,
      [scheduleId]
    );

    return result.rows[0] || null;
  }

  async updateJobSchedule(scheduleId: string, updates: Partial<JobSchedule>) {
    const fields: string[] = [];
    const values: any[] = [scheduleId];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(typeof value === 'object' && !(value instanceof Date) ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return this.getJobSchedule(scheduleId);
    }

    fields.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE job_schedules
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteJobSchedule(scheduleId: string) {
    await pool.query(
      `DELETE FROM job_schedules WHERE id = $1`,
      [scheduleId]
    );
  }

  async enableJobSchedule(scheduleId: string) {
    const result = await pool.query(
      `UPDATE job_schedules
       SET is_enabled = true, is_paused = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [scheduleId]
    );

    return result.rows[0] || null;
  }

  async disableJobSchedule(scheduleId: string) {
    const result = await pool.query(
      `UPDATE job_schedules
       SET is_enabled = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [scheduleId]
    );

    return result.rows[0] || null;
  }

  async getDueSchedules() {
    const result = await pool.query(
      `SELECT * FROM job_schedules
       WHERE is_enabled = true
         AND is_paused = false
         AND (next_run_at IS NULL OR next_run_at <= NOW())
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
       ORDER BY next_run_at ASC NULLS FIRST`
    );

    return result.rows;
  }

  async updateScheduleLastRun(scheduleId: string, jobId: string, nextRunAt?: Date) {
    const result = await pool.query(
      `UPDATE job_schedules
       SET last_run_at = NOW(),
           last_job_id = $2,
           next_run_at = $3,
           total_runs = total_runs + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [scheduleId, jobId, nextRunAt || null]
    );

    return result.rows[0] || null;
  }

  // ==================== WORKERS ====================

  async registerWorker(data: Worker) {
    const result = await pool.query(
      `INSERT INTO workers (
        worker_name, worker_host, worker_pid,
        worker_version, queue_ids, max_concurrent_jobs,
        heartbeat_interval_seconds, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.workerName,
        data.workerHost,
        data.workerPid || null,
        data.workerVersion || null,
        data.queueIds,
        data.maxConcurrentJobs || 1,
        data.heartbeatIntervalSeconds || 30,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );

    return result.rows[0];
  }

  async getWorkers() {
    const result = await pool.query(
      `SELECT * FROM workers ORDER BY worker_name`
    );

    return result.rows;
  }

  async getWorker(workerId: string) {
    const result = await pool.query(
      `SELECT * FROM workers WHERE id = $1`,
      [workerId]
    );

    return result.rows[0] || null;
  }

  async updateWorkerHeartbeat(workerId: string) {
    const result = await pool.query(
      `UPDATE workers
       SET last_heartbeat_at = NOW(),
           is_healthy = true,
           status = CASE
             WHEN current_jobs > 0 THEN 'busy'::worker_status
             ELSE 'idle'::worker_status
           END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [workerId]
    );

    return result.rows[0] || null;
  }

  async updateWorkerStatus(workerId: string, status: string, currentJobs?: number) {
    const result = await pool.query(
      `UPDATE workers
       SET status = $2,
           current_jobs = COALESCE($3, current_jobs),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [workerId, status, currentJobs || null]
    );

    return result.rows[0] || null;
  }

  async unregisterWorker(workerId: string) {
    const result = await pool.query(
      `UPDATE workers
       SET status = 'offline',
           stopped_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [workerId]
    );

    return result.rows[0] || null;
  }

  async getWorkerHealth() {
    const result = await pool.query(
      `SELECT * FROM worker_health ORDER BY health_status, worker_name`
    );

    return result.rows;
  }

  // ==================== JOB LOGS ====================

  async logJob(jobId: string, logLevel: string, logMessage: string, logData?: any, workerId?: string, executionStep?: string) {
    await pool.query(
      `INSERT INTO job_logs (
        job_id, log_level, log_message, log_data,
        worker_id, execution_step
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        jobId,
        logLevel,
        logMessage,
        logData ? JSON.stringify(logData) : null,
        workerId || null,
        executionStep || null
      ]
    );
  }

  async getJobLogs(jobId: string, limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM job_logs
       WHERE job_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [jobId, limit]
    );

    return result.rows;
  }

  // ==================== DEAD LETTER QUEUE ====================

  async getDeadLetterQueue(filters: {
    jobType?: string;
    queueId?: string;
    isResolved?: boolean;
    limit?: number;
  } = {}) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.jobType) {
      paramCount++;
      conditions.push(`job_type = $${paramCount}`);
      values.push(filters.jobType);
    }

    if (filters.queueId) {
      paramCount++;
      conditions.push(`queue_id = $${paramCount}`);
      values.push(filters.queueId);
    }

    if (filters.isResolved !== undefined) {
      paramCount++;
      conditions.push(`is_resolved = $${paramCount}`);
      values.push(filters.isResolved);
    }

    const limit = filters.limit || 100;

    const result = await pool.query(
      `SELECT * FROM dead_letter_queue
       WHERE ${conditions.join(' AND ')}
       ORDER BY failed_at DESC
       LIMIT $${paramCount + 1}`,
      [...values, limit]
    );

    return result.rows;
  }

  async resolveDeadLetterJob(dlqId: string, resolvedBy: string, resolutionNote?: string) {
    const result = await pool.query(
      `UPDATE dead_letter_queue
       SET is_resolved = true,
           resolved_at = NOW(),
           resolved_by = $2,
           resolution_note = $3
       WHERE id = $1
       RETURNING *`,
      [dlqId, resolvedBy, resolutionNote || null]
    );

    return result.rows[0] || null;
  }

  async replayDeadLetterJob(dlqId: string) {
    const dlqJob = await pool.query(
      `SELECT * FROM dead_letter_queue WHERE id = $1`,
      [dlqId]
    );

    if (dlqJob.rows.length === 0) {
      throw new Error('Dead letter job not found');
    }

    const job = dlqJob.rows[0];

    // Enqueue new job
    const jobId = await this.enqueueJob({
      jobType: job.job_type,
      jobData: job.job_data
    });

    // Update DLQ record
    await pool.query(
      `UPDATE dead_letter_queue
       SET replayed_job_id = $2
       WHERE id = $1`,
      [dlqId, jobId]
    );

    return jobId;
  }

  // ==================== STATISTICS ====================

  async getJobStatistics(filters: {
    queueId?: string;
    jobType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.queueId) {
      paramCount++;
      conditions.push(`queue_id = $${paramCount}`);
      values.push(filters.queueId);
    }

    if (filters.jobType) {
      paramCount++;
      conditions.push(`job_type = $${paramCount}`);
      values.push(filters.jobType);
    }

    if (filters.startDate) {
      paramCount++;
      conditions.push(`created_at >= $${paramCount}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      conditions.push(`created_at <= $${paramCount}`);
      values.push(filters.endDate);
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_jobs,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_jobs,
        COUNT(*) FILTER (WHERE status = 'processing') AS processing_jobs,
        COUNT(*) FILTER (WHERE status = 'queued') AS queued_jobs,
        AVG(execution_time_ms) FILTER (WHERE execution_time_ms IS NOT NULL) AS avg_execution_time_ms,
        MAX(execution_time_ms) AS max_execution_time_ms,
        MIN(execution_time_ms) FILTER (WHERE execution_time_ms IS NOT NULL) AS min_execution_time_ms
       FROM jobs
       WHERE ${conditions.join(' AND ')}`,
      values
    );

    return result.rows[0];
  }

  async getFailedJobsSummary(limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM failed_jobs_summary LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

export const queueService = new QueueService();
