-- ============================================================================
-- BACKUP & RECOVERY SCHEMA
-- ============================================================================
-- This schema manages automated backups, disaster recovery, data exports,
-- and system recovery procedures.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE backup_type AS ENUM (
  'full',
  'incremental',
  'differential',
  'snapshot'
);

CREATE TYPE backup_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
  'verifying',
  'verified'
);

CREATE TYPE storage_provider AS ENUM (
  'local',
  's3',
  'azure_blob',
  'google_cloud',
  'ftp',
  'sftp'
);

CREATE TYPE backup_frequency AS ENUM (
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'custom'
);

CREATE TYPE recovery_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
  'testing'
);

CREATE TYPE export_format AS ENUM (
  'json',
  'csv',
  'excel',
  'sql',
  'xml'
);

-- ============================================================================
-- BACKUP CONFIGURATIONS
-- ============================================================================

CREATE TABLE backup_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Config Details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Backup Settings
  backup_type backup_type DEFAULT 'full',
  frequency backup_frequency DEFAULT 'daily',
  schedule_cron VARCHAR(100), -- e.g., '0 2 * * *' for 2 AM daily

  -- Scope
  include_tables TEXT[], -- Tables to backup
  exclude_tables TEXT[], -- Tables to exclude
  include_data BOOLEAN DEFAULT true,
  include_schema BOOLEAN DEFAULT true,

  -- Storage
  storage_provider storage_provider DEFAULT 'local',
  storage_location TEXT, -- Path or bucket name
  storage_credentials JSONB, -- Encrypted credentials

  -- Compression & Encryption
  compression_enabled BOOLEAN DEFAULT true,
  compression_algorithm VARCHAR(50) DEFAULT 'gzip', -- gzip, bzip2, zstd
  encryption_enabled BOOLEAN DEFAULT true,
  encryption_algorithm VARCHAR(50) DEFAULT 'AES-256',

  -- Retention Policy
  retention_days INTEGER DEFAULT 30,
  max_backups INTEGER, -- Maximum number of backups to keep
  delete_old_backups BOOLEAN DEFAULT true,

  -- Verification
  auto_verify BOOLEAN DEFAULT true,
  verify_checksum BOOLEAN DEFAULT true,

  -- Notifications
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notification_emails TEXT[],

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_configs_enabled ON backup_configurations(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_backup_configs_next_run ON backup_configurations(next_run_at) WHERE is_enabled = true;

-- ============================================================================
-- BACKUP JOBS
-- ============================================================================

CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES backup_configurations(id) ON DELETE SET NULL,

  -- Job Details
  job_name VARCHAR(255),
  backup_type backup_type NOT NULL,
  status backup_status DEFAULT 'pending',

  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Storage
  storage_provider storage_provider,
  storage_location TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,

  -- Backup Metadata
  tables_included TEXT[],
  row_counts JSONB, -- {"users": 1000, "courses": 50}
  checksum VARCHAR(255),
  compression_ratio DECIMAL(5,2),

  -- Encryption
  is_encrypted BOOLEAN DEFAULT false,
  encryption_algorithm VARCHAR(50),
  encryption_key_id VARCHAR(255), -- Reference to key management service

  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0,
  current_table VARCHAR(255),
  rows_processed BIGINT,
  total_rows BIGINT,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_checksum VARCHAR(255),

  -- Metadata
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_jobs_config ON backup_jobs(config_id);
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_date ON backup_jobs(created_at DESC);
CREATE INDEX idx_backup_jobs_type ON backup_jobs(backup_type);

-- ============================================================================
-- INCREMENTAL BACKUP TRACKING
-- ============================================================================

CREATE TABLE incremental_backup_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Chain Details
  base_backup_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,
  chain_name VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_incremental_at TIMESTAMPTZ
);

CREATE TABLE incremental_backup_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES incremental_backup_chains(id) ON DELETE CASCADE,
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,

  -- Link Details
  sequence_number INTEGER NOT NULL,
  parent_backup_id UUID REFERENCES backup_jobs(id),

  -- Change Tracking
  tables_changed TEXT[],
  rows_added JSONB,
  rows_updated JSONB,
  rows_deleted JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chain_id, sequence_number)
);

CREATE INDEX idx_incremental_links_chain ON incremental_backup_links(chain_id);
CREATE INDEX idx_incremental_links_backup ON incremental_backup_links(backup_job_id);

-- ============================================================================
-- RECOVERY POINTS
-- ============================================================================

CREATE TABLE recovery_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,

  -- Point Details
  point_name VARCHAR(255) NOT NULL,
  description TEXT,
  point_timestamp TIMESTAMPTZ NOT NULL,

  -- Scope
  database_state JSONB, -- Snapshot of DB metadata at this point
  transaction_log_position VARCHAR(255),

  -- Recovery Metadata
  can_recover_to_point BOOLEAN DEFAULT true,
  requires_base_backup BOOLEAN DEFAULT false,
  base_backup_id UUID REFERENCES backup_jobs(id),

  -- Testing
  last_tested_at TIMESTAMPTZ,
  test_success BOOLEAN,
  test_notes TEXT,

  -- Status
  is_valid BOOLEAN DEFAULT true,
  invalidated_at TIMESTAMPTZ,
  invalidation_reason TEXT,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recovery_points_backup ON recovery_points(backup_job_id);
CREATE INDEX idx_recovery_points_timestamp ON recovery_points(point_timestamp DESC);
CREATE INDEX idx_recovery_points_valid ON recovery_points(is_valid) WHERE is_valid = true;

-- ============================================================================
-- RESTORE JOBS
-- ============================================================================

CREATE TABLE restore_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID REFERENCES backup_jobs(id),
  recovery_point_id UUID REFERENCES recovery_points(id),

  -- Restore Details
  restore_name VARCHAR(255),
  restore_type VARCHAR(50), -- full, selective, point_in_time
  status recovery_status DEFAULT 'pending',

  -- Target
  target_database VARCHAR(255),
  target_schema VARCHAR(255),
  overwrite_existing BOOLEAN DEFAULT false,

  -- Scope
  tables_to_restore TEXT[],
  restore_data BOOLEAN DEFAULT true,
  restore_schema BOOLEAN DEFAULT true,
  restore_indexes BOOLEAN DEFAULT true,

  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Progress
  progress_percentage INTEGER DEFAULT 0,
  current_table VARCHAR(255),
  rows_restored BIGINT,
  total_rows BIGINT,

  -- Validation
  pre_restore_checks JSONB,
  post_restore_checks JSONB,
  validation_passed BOOLEAN,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  initiated_by UUID,
  approved_by UUID, -- For production restores requiring approval
  approval_required BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restore_jobs_backup ON restore_jobs(backup_job_id);
CREATE INDEX idx_restore_jobs_status ON restore_jobs(status);
CREATE INDEX idx_restore_jobs_date ON restore_jobs(created_at DESC);

-- ============================================================================
-- DISASTER RECOVERY PLANS
-- ============================================================================

CREATE TABLE disaster_recovery_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan Details
  plan_name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50),

  -- Objectives
  recovery_time_objective_hours INTEGER, -- RTO: Max downtime
  recovery_point_objective_hours INTEGER, -- RPO: Max data loss

  -- Procedures
  pre_recovery_steps JSONB, -- [{step: 1, action: "Notify stakeholders"}]
  recovery_steps JSONB,
  post_recovery_steps JSONB,
  rollback_steps JSONB,

  -- Resources
  required_personnel TEXT[],
  required_systems TEXT[],
  backup_config_ids UUID[],

  -- Testing
  test_frequency VARCHAR(50), -- quarterly, annually
  last_test_date DATE,
  next_test_date DATE,
  test_results JSONB,

  -- Documentation
  runbook_url TEXT,
  contact_list JSONB, -- Emergency contacts
  escalation_matrix JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dr_plans_active ON disaster_recovery_plans(is_active) WHERE is_active = true;

-- ============================================================================
-- DISASTER RECOVERY EXECUTIONS
-- ============================================================================

CREATE TABLE dr_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES disaster_recovery_plans(id),

  -- Execution Details
  execution_name VARCHAR(255),
  execution_type VARCHAR(50), -- test, real, drill
  status recovery_status DEFAULT 'pending',

  -- Incident
  incident_type VARCHAR(100), -- data_loss, corruption, ransomware, hardware_failure
  incident_description TEXT,
  incident_detected_at TIMESTAMPTZ,

  -- Timeline
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  downtime_minutes INTEGER,

  -- Progress Tracking
  current_step INTEGER,
  total_steps INTEGER,
  step_details JSONB,

  -- Results
  success BOOLEAN,
  data_recovered BOOLEAN,
  data_loss_hours DECIMAL(10,2),
  lessons_learned TEXT,

  -- Team
  incident_commander UUID,
  team_members UUID[],
  communication_log JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dr_executions_plan ON dr_executions(plan_id);
CREATE INDEX idx_dr_executions_status ON dr_executions(status);
CREATE INDEX idx_dr_executions_date ON dr_executions(created_at DESC);

-- ============================================================================
-- DATA EXPORT JOBS
-- ============================================================================

CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Export Details
  export_name VARCHAR(255),
  export_format export_format,
  status backup_status DEFAULT 'pending',

  -- Scope
  tables TEXT[],
  filters JSONB, -- {"users": {"created_at": ">= 2024-01-01"}}
  include_relationships BOOLEAN DEFAULT false,

  -- Options
  include_headers BOOLEAN DEFAULT true,
  delimiter VARCHAR(10) DEFAULT ',',
  encoding VARCHAR(50) DEFAULT 'UTF-8',
  date_format VARCHAR(50),

  -- Output
  file_path TEXT,
  file_size_bytes BIGINT,
  row_count BIGINT,
  download_url TEXT,
  expires_at TIMESTAMPTZ,

  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Error Handling
  error_message TEXT,

  requested_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_jobs_user ON export_jobs(requested_by);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_date ON export_jobs(created_at DESC);

-- ============================================================================
-- DATA IMPORT JOBS
-- ============================================================================

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Import Details
  import_name VARCHAR(255),
  import_format export_format,
  status backup_status DEFAULT 'pending',

  -- Source
  source_file_path TEXT,
  source_file_size_bytes BIGINT,

  -- Target
  target_table VARCHAR(255),
  import_mode VARCHAR(50), -- insert, update, upsert, replace

  -- Options
  has_headers BOOLEAN DEFAULT true,
  delimiter VARCHAR(10) DEFAULT ',',
  encoding VARCHAR(50) DEFAULT 'UTF-8',
  skip_rows INTEGER DEFAULT 0,
  column_mapping JSONB, -- {"csv_col": "db_col"}

  -- Validation
  validate_before_import BOOLEAN DEFAULT true,
  validation_errors JSONB,
  dry_run BOOLEAN DEFAULT false,

  -- Progress
  total_rows BIGINT,
  processed_rows BIGINT,
  successful_rows BIGINT,
  failed_rows BIGINT,
  skipped_rows BIGINT,

  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,
  continue_on_error BOOLEAN DEFAULT false,

  requested_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_user ON import_jobs(requested_by);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_date ON import_jobs(created_at DESC);

-- ============================================================================
-- BACKUP VERIFICATION RESULTS
-- ============================================================================

CREATE TABLE backup_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE CASCADE,

  -- Verification Details
  verification_type VARCHAR(50), -- checksum, integrity, restore_test
  status backup_status DEFAULT 'pending',

  -- Checks Performed
  checksum_valid BOOLEAN,
  file_accessible BOOLEAN,
  metadata_valid BOOLEAN,
  can_decompress BOOLEAN,
  can_decrypt BOOLEAN,

  -- Test Restore (if applicable)
  test_restore_performed BOOLEAN DEFAULT false,
  test_restore_success BOOLEAN,
  test_restore_duration_seconds INTEGER,
  sample_tables_restored TEXT[],

  -- Results
  overall_result VARCHAR(50), -- passed, failed, warning
  issues_found JSONB,
  recommendations TEXT,

  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_backup ON backup_verifications(backup_job_id);
CREATE INDEX idx_verifications_result ON backup_verifications(overall_result);

-- ============================================================================
-- STORAGE LOCATIONS
-- ============================================================================

CREATE TABLE storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  provider storage_provider NOT NULL,

  -- Connection
  endpoint_url TEXT,
  region VARCHAR(100),
  bucket_name VARCHAR(255),
  path_prefix VARCHAR(500),

  -- Credentials (encrypted)
  access_key TEXT,
  secret_key TEXT,
  credentials JSONB,

  -- Settings
  use_ssl BOOLEAN DEFAULT true,
  port INTEGER,
  timeout_seconds INTEGER DEFAULT 300,

  -- Capacity
  total_capacity_gb BIGINT,
  used_capacity_gb BIGINT,
  available_capacity_gb BIGINT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMPTZ,
  health_status VARCHAR(50), -- healthy, degraded, failed

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_storage_locations_provider ON storage_locations(provider);
CREATE INDEX idx_storage_locations_active ON storage_locations(is_active) WHERE is_active = true;

-- ============================================================================
-- BACKUP AUDIT LOG
-- ============================================================================

CREATE TABLE backup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- backup_started, backup_completed, restore_initiated
  entity_type VARCHAR(50), -- backup_job, restore_job, config
  entity_id UUID,

  -- Actor
  user_id UUID,
  ip_address INET,

  -- Details
  action VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,

  -- Result
  success BOOLEAN,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_audit_event ON backup_audit_log(event_type);
CREATE INDEX idx_backup_audit_entity ON backup_audit_log(entity_type, entity_id);
CREATE INDEX idx_backup_audit_user ON backup_audit_log(user_id);
CREATE INDEX idx_backup_audit_date ON backup_audit_log(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Backup Summary
CREATE VIEW backup_summary AS
SELECT
  bc.id as config_id,
  bc.name as config_name,
  bc.is_enabled,
  bc.frequency,
  bc.next_run_at,
  COUNT(bj.id) as total_backups,
  COUNT(CASE WHEN bj.status = 'completed' THEN 1 END) as successful_backups,
  COUNT(CASE WHEN bj.status = 'failed' THEN 1 END) as failed_backups,
  SUM(bj.file_size_bytes) as total_size_bytes,
  MAX(bj.created_at) as last_backup_at,
  AVG(bj.duration_seconds) as avg_duration_seconds
FROM backup_configurations bc
LEFT JOIN backup_jobs bj ON bj.config_id = bc.id
GROUP BY bc.id, bc.name, bc.is_enabled, bc.frequency, bc.next_run_at;

-- Recent Backups
CREATE VIEW recent_backups AS
SELECT
  bj.id,
  bj.job_name,
  bj.backup_type,
  bj.status,
  bj.file_size_bytes,
  bj.duration_seconds,
  bj.is_verified,
  bj.created_at,
  bc.name as config_name
FROM backup_jobs bj
LEFT JOIN backup_configurations bc ON bc.id = bj.config_id
ORDER BY bj.created_at DESC
LIMIT 100;

-- Backup Health Status
CREATE VIEW backup_health_status AS
SELECT
  COUNT(*) FILTER (WHERE is_enabled = true) as active_configs,
  COUNT(*) FILTER (WHERE is_enabled = false) as inactive_configs,
  (
    SELECT COUNT(*)
    FROM backup_jobs
    WHERE status = 'failed'
      AND created_at > NOW() - INTERVAL '24 hours'
  ) as failures_last_24h,
  (
    SELECT COUNT(*)
    FROM backup_jobs
    WHERE status = 'completed'
      AND created_at > NOW() - INTERVAL '24 hours'
  ) as successes_last_24h,
  (
    SELECT SUM(file_size_bytes)
    FROM backup_jobs
    WHERE status = 'completed'
  ) as total_backup_size_bytes,
  (
    SELECT COUNT(*)
    FROM backup_jobs
    WHERE is_verified = false
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '7 days'
  ) as unverified_backups
FROM backup_configurations;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate next run time for a backup configuration
CREATE OR REPLACE FUNCTION calculate_next_backup_run(p_config_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_frequency backup_frequency;
  v_schedule_cron VARCHAR(100);
  v_next_run TIMESTAMPTZ;
BEGIN
  SELECT frequency, schedule_cron INTO v_frequency, v_schedule_cron
  FROM backup_configurations
  WHERE id = p_config_id;

  CASE v_frequency
    WHEN 'hourly' THEN
      v_next_run := NOW() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_next_run := NOW() + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_next_run := NOW() + INTERVAL '7 days';
    WHEN 'monthly' THEN
      v_next_run := NOW() + INTERVAL '1 month';
    ELSE
      v_next_run := NOW() + INTERVAL '1 day'; -- Default
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Get backups due for cleanup based on retention policy
CREATE OR REPLACE FUNCTION get_backups_for_cleanup(p_config_id UUID)
RETURNS TABLE(backup_job_id UUID) AS $$
DECLARE
  v_retention_days INTEGER;
  v_max_backups INTEGER;
BEGIN
  SELECT retention_days, max_backups INTO v_retention_days, v_max_backups
  FROM backup_configurations
  WHERE id = p_config_id;

  -- Get backups older than retention period
  RETURN QUERY
  SELECT id FROM backup_jobs
  WHERE config_id = p_config_id
    AND status = 'completed'
    AND created_at < NOW() - (v_retention_days || ' days')::INTERVAL

  UNION

  -- Get excess backups if max_backups is set
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM backup_jobs
    WHERE config_id = p_config_id
      AND status = 'completed'
  ) sub
  WHERE v_max_backups IS NOT NULL AND rn > v_max_backups;
END;
$$ LANGUAGE plpgsql;

-- Check if backup is restorable
CREATE OR REPLACE FUNCTION is_backup_restorable(p_backup_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status backup_status;
  v_is_verified BOOLEAN;
  v_backup_type backup_type;
  v_base_backup_exists BOOLEAN;
BEGIN
  SELECT status, is_verified, backup_type INTO v_status, v_is_verified, v_backup_type
  FROM backup_jobs
  WHERE id = p_backup_id;

  -- Must be completed and verified
  IF v_status != 'completed' OR NOT v_is_verified THEN
    RETURN false;
  END IF;

  -- If incremental, check if base backup exists
  IF v_backup_type IN ('incremental', 'differential') THEN
    SELECT EXISTS(
      SELECT 1 FROM incremental_backup_chains ibc
      JOIN incremental_backup_links ibl ON ibl.chain_id = ibc.id
      WHERE ibl.backup_job_id = p_backup_id
        AND EXISTS(
          SELECT 1 FROM backup_jobs
          WHERE id = ibc.base_backup_id
            AND status = 'completed'
            AND is_verified = true
        )
    ) INTO v_base_backup_exists;

    RETURN v_base_backup_exists;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_backup_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_configs_update_timestamp
  BEFORE UPDATE ON backup_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_timestamp();

-- Calculate backup duration on completion
CREATE OR REPLACE FUNCTION calculate_backup_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_jobs_calculate_duration
  BEFORE UPDATE ON backup_jobs
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION calculate_backup_duration();

-- Log backup events
CREATE OR REPLACE FUNCTION log_backup_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO backup_audit_log (event_type, entity_type, entity_id, action, new_values, success)
    VALUES ('backup_created', 'backup_job', NEW.id, 'Backup job created', row_to_json(NEW), true);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO backup_audit_log (event_type, entity_type, entity_id, action, old_values, new_values, success)
    VALUES (
      'backup_status_changed',
      'backup_job',
      NEW.id,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      NEW.status = 'completed'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backup_jobs_audit_log
  AFTER INSERT OR UPDATE ON backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_backup_event();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE backup_configurations IS 'Backup schedules and configurations';
COMMENT ON TABLE backup_jobs IS 'Individual backup executions';
COMMENT ON TABLE incremental_backup_chains IS 'Chains of incremental backups';
COMMENT ON TABLE recovery_points IS 'Point-in-time recovery checkpoints';
COMMENT ON TABLE restore_jobs IS 'Database restore operations';
COMMENT ON TABLE disaster_recovery_plans IS 'Disaster recovery procedures and plans';
COMMENT ON TABLE dr_executions IS 'Disaster recovery execution logs';
COMMENT ON TABLE export_jobs IS 'Data export operations';
COMMENT ON TABLE import_jobs IS 'Data import operations';
COMMENT ON TABLE backup_verifications IS 'Backup verification and test results';
COMMENT ON TABLE storage_locations IS 'Cloud and remote storage configurations';
COMMENT ON TABLE backup_audit_log IS 'Audit trail for all backup operations';
