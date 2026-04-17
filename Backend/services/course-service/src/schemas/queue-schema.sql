-- Queue & Background Jobs System Schema
-- Job queues, workers, schedules, and execution management

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE job_status AS ENUM (
  'pending', 'queued', 'processing', 'completed',
  'failed', 'cancelled', 'retrying', 'timeout'
);

CREATE TYPE job_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE queue_status AS ENUM ('active', 'paused', 'disabled');

CREATE TYPE worker_status AS ENUM ('idle', 'busy', 'offline', 'error');

CREATE TYPE schedule_frequency AS ENUM (
  'once', 'minutely', 'hourly', 'daily',
  'weekly', 'monthly', 'custom'
);

-- ========================================
-- 2. JOB QUEUES
-- ========================================

CREATE TABLE IF NOT EXISTS job_queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Queue Identity
  queue_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Configuration
  max_concurrent_jobs INTEGER DEFAULT 10,
  rate_limit_per_minute INTEGER DEFAULT 0, -- 0 = no limit
  default_timeout_seconds INTEGER DEFAULT 300,
  default_retry_limit INTEGER DEFAULT 3,
  default_retry_delay_seconds INTEGER DEFAULT 60,

  -- Priority Settings
  priority_enabled BOOLEAN DEFAULT true,
  fifo_mode BOOLEAN DEFAULT false, -- First-in-first-out

  -- Status
  status queue_status DEFAULT 'active',
  is_enabled BOOLEAN DEFAULT true,

  -- Statistics
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_queues_name ON job_queues(queue_name);
CREATE INDEX idx_job_queues_status ON job_queues(status);
CREATE INDEX idx_job_queues_enabled ON job_queues(is_enabled);

-- ========================================
-- 3. JOB DEFINITIONS
-- ========================================

CREATE TABLE IF NOT EXISTS job_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job Identity
  job_type VARCHAR(100) NOT NULL UNIQUE,
  job_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Queue Assignment
  queue_id UUID NOT NULL REFERENCES job_queues(id) ON DELETE CASCADE,

  -- Handler
  handler_function VARCHAR(255) NOT NULL, -- Function/module to execute
  handler_module VARCHAR(255), -- Module path

  -- Default Configuration
  default_priority job_priority DEFAULT 'normal',
  default_timeout_seconds INTEGER DEFAULT 300,
  default_retry_limit INTEGER DEFAULT 3,
  retry_strategy VARCHAR(50) DEFAULT 'exponential', -- 'fixed', 'exponential', 'linear'

  -- Input Schema (for validation)
  input_schema JSONB, -- JSON schema for job data validation

  -- Status
  is_enabled BOOLEAN DEFAULT true,

  -- Statistics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_defs_type ON job_definitions(job_type);
CREATE INDEX idx_job_defs_queue ON job_definitions(queue_id);
CREATE INDEX idx_job_defs_enabled ON job_definitions(is_enabled);

-- ========================================
-- 4. JOBS
-- ========================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job Definition
  job_definition_id UUID NOT NULL REFERENCES job_definitions(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES job_queues(id) ON DELETE CASCADE,

  -- Job Data
  job_type VARCHAR(100) NOT NULL,
  job_data JSONB NOT NULL,

  -- Priority & Scheduling
  priority job_priority DEFAULT 'normal',
  scheduled_at TIMESTAMP DEFAULT NOW(),
  delay_until TIMESTAMP, -- Delay execution until this time

  -- Status
  status job_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0, -- 0-100
  progress_message TEXT,

  -- Execution
  worker_id UUID, -- Reference to worker that picked up the job
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Timing
  timeout_seconds INTEGER DEFAULT 300,
  execution_time_ms INTEGER,

  -- Retry Configuration
  retry_limit INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 60,
  next_retry_at TIMESTAMP,

  -- Results
  result JSONB,
  error_message TEXT,
  error_stack TEXT,
  error_code VARCHAR(50),

  -- Dependencies
  depends_on_job_ids UUID[], -- Jobs that must complete before this job runs
  dependent_jobs UUID[], -- Jobs waiting for this job

  -- Metadata
  metadata JSONB,
  tags TEXT[], -- For filtering and grouping

  -- Created By
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_definition ON jobs(job_definition_id);
CREATE INDEX idx_jobs_queue ON jobs(queue_id);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_at);
CREATE INDEX idx_jobs_delay_until ON jobs(delay_until);
CREATE INDEX idx_jobs_worker ON jobs(worker_id);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_retry ON jobs(next_retry_at) WHERE status = 'retrying';

-- Composite index for job picking
CREATE INDEX idx_jobs_pickup ON jobs(queue_id, status, priority DESC, scheduled_at)
WHERE status IN ('pending', 'queued') AND (delay_until IS NULL OR delay_until <= NOW());

-- ========================================
-- 5. JOB SCHEDULES (Recurring Jobs)
-- ========================================

CREATE TABLE IF NOT EXISTS job_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Schedule Identity
  schedule_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,

  -- Job Definition
  job_definition_id UUID NOT NULL REFERENCES job_definitions(id) ON DELETE CASCADE,
  job_data JSONB, -- Default data for scheduled jobs

  -- Schedule Configuration
  frequency schedule_frequency NOT NULL,
  cron_expression VARCHAR(100), -- For custom schedules
  interval_seconds INTEGER, -- For 'custom' frequency

  -- Time Window
  start_time TIME, -- Daily start time
  end_time TIME, -- Daily end time
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Validity Period
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,

  -- Execution Tracking
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  last_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  -- Error Handling
  max_missed_runs INTEGER DEFAULT 3, -- Disable after this many missed runs
  missed_runs INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_schedules_name ON job_schedules(schedule_name);
CREATE INDEX idx_job_schedules_def ON job_schedules(job_definition_id);
CREATE INDEX idx_job_schedules_enabled ON job_schedules(is_enabled);
CREATE INDEX idx_job_schedules_next_run ON job_schedules(next_run_at) WHERE is_enabled = true;

-- ========================================
-- 6. WORKERS
-- ========================================

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Worker Identity
  worker_name VARCHAR(255) NOT NULL,
  worker_host VARCHAR(255) NOT NULL,
  worker_pid INTEGER,
  worker_version VARCHAR(50),

  -- Queue Assignment
  queue_ids UUID[] NOT NULL, -- Queues this worker can process

  -- Capacity
  max_concurrent_jobs INTEGER DEFAULT 1,
  current_jobs INTEGER DEFAULT 0,

  -- Status
  status worker_status DEFAULT 'idle',
  is_healthy BOOLEAN DEFAULT true,

  -- Heartbeat
  last_heartbeat_at TIMESTAMP DEFAULT NOW(),
  heartbeat_interval_seconds INTEGER DEFAULT 30,

  -- Statistics
  total_jobs_processed INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,

  -- Current Job
  current_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,

  started_at TIMESTAMP DEFAULT NOW(),
  stopped_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workers_name ON workers(worker_name);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_healthy ON workers(is_healthy);
CREATE INDEX idx_workers_heartbeat ON workers(last_heartbeat_at);
CREATE INDEX idx_workers_queues ON workers USING GIN(queue_ids);

-- ========================================
-- 7. JOB LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job Reference
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Log Details
  log_level VARCHAR(20) NOT NULL, -- 'debug', 'info', 'warning', 'error'
  log_message TEXT NOT NULL,
  log_data JSONB,

  -- Context
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  execution_step VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_logs_job ON job_logs(job_id);
CREATE INDEX idx_job_logs_level ON job_logs(log_level);
CREATE INDEX idx_job_logs_created ON job_logs(created_at DESC);

-- ========================================
-- 8. JOB METRICS
-- ========================================

CREATE TABLE IF NOT EXISTS job_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Aggregation Level
  job_type VARCHAR(100),
  queue_id UUID REFERENCES job_queues(id) ON DELETE CASCADE,

  -- Counts
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  cancelled_jobs INTEGER DEFAULT 0,
  timeout_jobs INTEGER DEFAULT 0,

  -- Timing Metrics
  avg_execution_time_ms INTEGER,
  min_execution_time_ms INTEGER,
  max_execution_time_ms INTEGER,
  p50_execution_time_ms INTEGER, -- Median
  p95_execution_time_ms INTEGER,
  p99_execution_time_ms INTEGER,

  -- Queue Metrics
  avg_queue_time_ms INTEGER, -- Time from created to started
  max_queue_time_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_metrics_period ON job_metrics(period_start, period_end);
CREATE INDEX idx_job_metrics_type ON job_metrics(job_type);
CREATE INDEX idx_job_metrics_queue ON job_metrics(queue_id);

-- ========================================
-- 9. DEAD LETTER QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Original Job
  original_job_id UUID,
  job_type VARCHAR(100) NOT NULL,
  job_data JSONB NOT NULL,
  queue_id UUID REFERENCES job_queues(id) ON DELETE SET NULL,

  -- Failure Details
  failure_reason TEXT NOT NULL,
  final_error_message TEXT,
  final_error_stack TEXT,
  retry_count INTEGER,

  -- Timeline
  original_created_at TIMESTAMP,
  failed_at TIMESTAMP DEFAULT NOW(),

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,

  -- Replay
  replayed_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dlq_job ON dead_letter_queue(original_job_id);
CREATE INDEX idx_dlq_type ON dead_letter_queue(job_type);
CREATE INDEX idx_dlq_queue ON dead_letter_queue(queue_id);
CREATE INDEX idx_dlq_resolved ON dead_letter_queue(is_resolved);
CREATE INDEX idx_dlq_failed ON dead_letter_queue(failed_at DESC);

-- ========================================
-- 10. FUNCTIONS
-- ========================================

-- Function: Enqueue job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type VARCHAR,
  p_job_data JSONB,
  p_priority job_priority DEFAULT 'normal',
  p_scheduled_at TIMESTAMP DEFAULT NOW(),
  p_delay_seconds INTEGER DEFAULT 0,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_job_def RECORD;
  v_delay_until TIMESTAMP;
BEGIN
  -- Get job definition
  SELECT * INTO v_job_def
  FROM job_definitions
  WHERE job_type = p_job_type AND is_enabled = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job type % not found or disabled', p_job_type;
  END IF;

  -- Calculate delay
  IF p_delay_seconds > 0 THEN
    v_delay_until := NOW() + (p_delay_seconds || ' seconds')::INTERVAL;
  END IF;

  -- Create job
  INSERT INTO jobs (
    job_definition_id, queue_id, job_type, job_data,
    priority, scheduled_at, delay_until,
    timeout_seconds, retry_limit, retry_delay_seconds,
    status, created_by
  ) VALUES (
    v_job_def.id,
    v_job_def.queue_id,
    p_job_type,
    p_job_data,
    COALESCE(p_priority, v_job_def.default_priority),
    p_scheduled_at,
    v_delay_until,
    v_job_def.default_timeout_seconds,
    v_job_def.default_retry_limit,
    60,
    CASE WHEN v_delay_until IS NULL THEN 'queued'::job_status ELSE 'pending'::job_status END,
    p_created_by
  )
  RETURNING id INTO v_job_id;

  -- Update queue statistics
  UPDATE job_queues
  SET total_jobs = total_jobs + 1,
      active_jobs = active_jobs + 1,
      updated_at = NOW()
  WHERE id = v_job_def.queue_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Pick next job for worker
CREATE OR REPLACE FUNCTION pick_next_job(
  p_worker_id UUID,
  p_queue_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Find next available job with row locking
  SELECT id INTO v_job_id
  FROM jobs
  WHERE queue_id = ANY(p_queue_ids)
    AND status IN ('queued', 'pending')
    AND (delay_until IS NULL OR delay_until <= NOW())
    AND (depends_on_job_ids IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(depends_on_job_ids) dep_id
      WHERE NOT EXISTS (
        SELECT 1 FROM jobs WHERE id = dep_id AND status = 'completed'
      )
    ))
  ORDER BY priority DESC, scheduled_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NOT NULL THEN
    -- Claim the job
    UPDATE jobs
    SET
      status = 'processing',
      worker_id = p_worker_id,
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = v_job_id;
  END IF;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete job
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_queue_id UUID;
  v_job_def_id UUID;
BEGIN
  -- Update job
  UPDATE jobs
  SET
    status = 'completed',
    completed_at = NOW(),
    result = p_result,
    execution_time_ms = p_execution_time_ms,
    progress = 100,
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING queue_id, job_definition_id INTO v_queue_id, v_job_def_id;

  -- Update statistics
  UPDATE job_queues
  SET
    completed_jobs = completed_jobs + 1,
    active_jobs = active_jobs - 1,
    updated_at = NOW()
  WHERE id = v_queue_id;

  UPDATE job_definitions
  SET
    total_executions = total_executions + 1,
    successful_executions = successful_executions + 1,
    updated_at = NOW()
  WHERE id = v_job_def_id;

  -- Trigger dependent jobs
  UPDATE jobs
  SET status = 'queued', updated_at = NOW()
  WHERE status = 'pending'
    AND p_job_id = ANY(depends_on_job_ids);
END;
$$ LANGUAGE plpgsql;

-- Function: Fail job
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_error_code VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_job RECORD;
  v_should_retry BOOLEAN;
BEGIN
  -- Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = p_job_id;

  -- Check if should retry
  v_should_retry := v_job.retry_count < v_job.retry_limit;

  IF v_should_retry THEN
    -- Schedule retry
    UPDATE jobs
    SET
      status = 'retrying',
      retry_count = retry_count + 1,
      next_retry_at = NOW() + (retry_delay_seconds || ' seconds')::INTERVAL,
      error_message = p_error_message,
      error_stack = p_error_stack,
      error_code = p_error_code,
      updated_at = NOW()
    WHERE id = p_job_id;
  ELSE
    -- Move to failed
    UPDATE jobs
    SET
      status = 'failed',
      completed_at = NOW(),
      error_message = p_error_message,
      error_stack = p_error_stack,
      error_code = p_error_code,
      updated_at = NOW()
    WHERE id = p_job_id;

    -- Add to dead letter queue
    INSERT INTO dead_letter_queue (
      original_job_id, job_type, job_data, queue_id,
      failure_reason, final_error_message, final_error_stack,
      retry_count, original_created_at
    ) VALUES (
      v_job.id, v_job.job_type, v_job.job_data, v_job.queue_id,
      'Max retries exceeded', p_error_message, p_error_stack,
      v_job.retry_count, v_job.created_at
    );

    -- Update queue statistics
    UPDATE job_queues
    SET
      failed_jobs = failed_jobs + 1,
      active_jobs = active_jobs - 1,
      updated_at = NOW()
    WHERE id = v_job.queue_id;

    -- Update job definition statistics
    UPDATE job_definitions
    SET
      total_executions = total_executions + 1,
      failed_executions = failed_executions + 1,
      updated_at = NOW()
    WHERE id = v_job.job_definition_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM jobs
  WHERE status = 'completed'
    AND completed_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 11. TRIGGERS
-- ========================================

-- Trigger: Update queue active jobs count
CREATE OR REPLACE FUNCTION update_queue_active_jobs()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status IN ('completed', 'failed', 'cancelled') AND OLD.status NOT IN ('completed', 'failed', 'cancelled') THEN
      UPDATE job_queues
      SET active_jobs = GREATEST(active_jobs - 1, 0)
      WHERE id = NEW.queue_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_queue_active_jobs
AFTER UPDATE ON jobs
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_queue_active_jobs();

-- Trigger: Update worker heartbeat
CREATE OR REPLACE FUNCTION update_worker_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_heartbeat_at := NOW();
  NEW.updated_at := NOW();

  -- Check if worker is healthy based on heartbeat
  IF NEW.last_heartbeat_at < NOW() - (NEW.heartbeat_interval_seconds * 3 || ' seconds')::INTERVAL THEN
    NEW.is_healthy := false;
    NEW.status := 'offline';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_worker_heartbeat
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_worker_heartbeat();

-- ========================================
-- 12. VIEWS
-- ========================================

-- View: Queue statistics
CREATE OR REPLACE VIEW queue_statistics AS
SELECT
  q.id,
  q.queue_name,
  q.status,
  q.total_jobs,
  q.completed_jobs,
  q.failed_jobs,
  q.active_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'queued') AS queued_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'processing') AS processing_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'pending') AS pending_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'retrying') AS retrying_jobs,
  AVG(j.execution_time_ms) FILTER (WHERE j.status = 'completed') AS avg_execution_time_ms,
  MAX(j.created_at) AS last_job_at
FROM job_queues q
LEFT JOIN jobs j ON q.id = j.queue_id AND j.created_at > NOW() - INTERVAL '24 hours'
GROUP BY q.id, q.queue_name, q.status, q.total_jobs, q.completed_jobs, q.failed_jobs, q.active_jobs;

-- View: Worker health
CREATE OR REPLACE VIEW worker_health AS
SELECT
  w.id,
  w.worker_name,
  w.worker_host,
  w.status,
  w.is_healthy,
  w.current_jobs,
  w.max_concurrent_jobs,
  w.total_jobs_processed,
  w.successful_jobs,
  w.failed_jobs,
  w.last_heartbeat_at,
  CASE
    WHEN w.last_heartbeat_at > NOW() - INTERVAL '1 minute' THEN 'healthy'
    WHEN w.last_heartbeat_at > NOW() - INTERVAL '5 minutes' THEN 'degraded'
    ELSE 'unhealthy'
  END AS health_status,
  NOW() - w.last_heartbeat_at AS time_since_last_heartbeat
FROM workers w;

-- View: Failed jobs summary
CREATE OR REPLACE VIEW failed_jobs_summary AS
SELECT
  j.id,
  j.job_type,
  j.status,
  j.error_message,
  j.error_code,
  j.retry_count,
  j.retry_limit,
  j.next_retry_at,
  j.created_at,
  j.started_at,
  j.completed_at,
  q.queue_name
FROM jobs j
JOIN job_queues q ON j.queue_id = q.id
WHERE j.status IN ('failed', 'retrying')
ORDER BY j.created_at DESC;

COMMENT ON SCHEMA public IS 'Queue & Background Jobs System - Job queues, workers, and execution management';
