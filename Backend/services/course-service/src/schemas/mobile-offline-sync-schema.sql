-- Mobile App Backend & Offline Sync Schema
-- Offline-first architecture, delta sync, push notifications, conflict resolution

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web', 'desktop');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed', 'conflict');
CREATE TYPE sync_operation AS ENUM ('create', 'update', 'delete', 'bulk');
CREATE TYPE conflict_resolution AS ENUM ('server_wins', 'client_wins', 'manual', 'merge', 'last_write_wins');
CREATE TYPE push_notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'clicked');
CREATE TYPE sync_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE offline_resource_type AS ENUM ('course', 'lesson', 'video', 'document', 'assessment', 'discussion');

-- ========================================
-- 2. MOBILE DEVICES
-- ========================================

CREATE TABLE IF NOT EXISTS mobile_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device Identity
  device_id VARCHAR(255) NOT NULL UNIQUE, -- Unique device identifier
  device_name VARCHAR(255),
  device_platform device_platform NOT NULL,

  -- Device Details
  os_version VARCHAR(100),
  app_version VARCHAR(50),
  app_build_number VARCHAR(50),

  -- Device Hardware
  device_model VARCHAR(100),
  screen_resolution VARCHAR(50),
  memory_mb INTEGER,
  storage_available_mb BIGINT,

  -- Push Notifications
  push_token VARCHAR(500), -- FCM/APNs token
  push_enabled BOOLEAN DEFAULT true,
  push_token_updated_at TIMESTAMP,

  -- Network
  network_type VARCHAR(50), -- 'wifi', '4g', '5g', 'ethernet'
  is_metered_connection BOOLEAN DEFAULT false,

  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  wifi_only_sync BOOLEAN DEFAULT false,
  background_sync_enabled BOOLEAN DEFAULT true,
  max_download_size_mb INTEGER DEFAULT 100,

  -- Last Activity
  last_active_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  last_ip_address VARCHAR(45),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_registered BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB,

  registered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON mobile_devices(user_id);
CREATE INDEX idx_devices_device_id ON mobile_devices(device_id);
CREATE INDEX idx_devices_platform ON mobile_devices(device_platform);
CREATE INDEX idx_devices_active ON mobile_devices(is_active);
CREATE INDEX idx_devices_push_token ON mobile_devices(push_token);

-- ========================================
-- 3. SYNC QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Sync Operation
  operation sync_operation NOT NULL,
  entity_type VARCHAR(100) NOT NULL, -- 'course', 'lesson', 'progress', etc.
  entity_id UUID NOT NULL,

  -- Data
  data_payload JSONB NOT NULL,
  data_hash VARCHAR(64), -- SHA-256 hash for deduplication

  -- Version Control
  client_version BIGINT NOT NULL, -- Client's version number
  server_version BIGINT, -- Server's version number

  -- Status
  status sync_status DEFAULT 'pending',
  priority sync_priority DEFAULT 'normal',

  -- Processing
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,

  -- Conflict
  has_conflict BOOLEAN DEFAULT false,
  conflict_data JSONB,
  conflict_resolution conflict_resolution,
  resolved_at TIMESTAMP,

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,

  -- Error
  error_message TEXT,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_sync_queue_device ON sync_queue(device_id);
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX idx_sync_queue_hash ON sync_queue(data_hash);
CREATE INDEX idx_sync_queue_priority ON sync_queue(priority DESC, created_at ASC);

-- ========================================
-- 4. SYNC CHECKPOINTS
-- ========================================

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Entity Type
  entity_type VARCHAR(100) NOT NULL,

  -- Checkpoint
  last_sync_version BIGINT NOT NULL DEFAULT 0,
  last_sync_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Sync Statistics
  total_items_synced INTEGER DEFAULT 0,
  sync_count INTEGER DEFAULT 0,

  -- Status
  is_full_sync_needed BOOLEAN DEFAULT false,

  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_device_entity UNIQUE (device_id, entity_type)
);

CREATE INDEX idx_checkpoints_device ON sync_checkpoints(device_id);
CREATE INDEX idx_checkpoints_entity ON sync_checkpoints(entity_type);

-- ========================================
-- 5. OFFLINE DOWNLOADS
-- ========================================

CREATE TABLE IF NOT EXISTS offline_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device & User
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Resource
  resource_type offline_resource_type NOT NULL,
  resource_id UUID NOT NULL,
  resource_title VARCHAR(500),

  -- Download Details
  file_url VARCHAR(1000),
  file_size_bytes BIGINT,
  downloaded_bytes BIGINT DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed', 'paused'
  progress_percent INTEGER DEFAULT 0,

  -- Storage
  local_file_path VARCHAR(1000),
  storage_used_bytes BIGINT,

  -- Quality
  video_quality VARCHAR(20), -- For video resources
  compression_level VARCHAR(20), -- 'high', 'medium', 'low'

  -- Timing
  requested_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- Auto-delete after expiry

  -- Error
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_downloads_device ON offline_downloads(device_id);
CREATE INDEX idx_downloads_user ON offline_downloads(user_id);
CREATE INDEX idx_downloads_resource ON offline_downloads(resource_type, resource_id);
CREATE INDEX idx_downloads_status ON offline_downloads(status);
CREATE INDEX idx_downloads_expires ON offline_downloads(expires_at);

-- ========================================
-- 6. PUSH NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Target
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES mobile_devices(id) ON DELETE CASCADE,

  -- Notification Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_url VARCHAR(1000),

  -- Action
  action_url VARCHAR(1000),
  action_type VARCHAR(50), -- 'open_course', 'open_lesson', 'open_discussion', etc.
  action_data JSONB,

  -- Badge
  badge_count INTEGER,

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'

  -- Status
  status push_notification_status DEFAULT 'pending',

  -- Delivery
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  clicked_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Error
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Expiry
  expires_at TIMESTAMP,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_user ON push_notifications(user_id);
CREATE INDEX idx_push_device ON push_notifications(device_id);
CREATE INDEX idx_push_status ON push_notifications(status);
CREATE INDEX idx_push_created ON push_notifications(created_at DESC);

-- ========================================
-- 7. CONFLICT RESOLUTION
-- ========================================

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Sync Reference
  sync_queue_id UUID REFERENCES sync_queue(id) ON DELETE CASCADE,

  -- Device & User
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Entity
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,

  -- Conflict Data
  client_data JSONB NOT NULL,
  server_data JSONB NOT NULL,
  client_version BIGINT NOT NULL,
  server_version BIGINT NOT NULL,

  -- Resolution
  resolution_strategy conflict_resolution,
  resolved_data JSONB,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,

  -- Status
  is_resolved BOOLEAN DEFAULT false,

  -- Timestamps
  detected_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_conflicts_device ON sync_conflicts(device_id);
CREATE INDEX idx_conflicts_entity ON sync_conflicts(entity_type, entity_id);
CREATE INDEX idx_conflicts_resolved ON sync_conflicts(is_resolved);

-- ========================================
-- 8. DELTA CHANGES LOG
-- ========================================

CREATE TABLE IF NOT EXISTS delta_changes_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Entity
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,

  -- Change
  change_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  version_number BIGINT NOT NULL,

  -- Change Data
  field_changes JSONB, -- Map of changed fields
  full_data JSONB, -- Complete entity snapshot

  -- User & Device
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id UUID REFERENCES mobile_devices(id) ON DELETE SET NULL,

  -- Timestamp
  changed_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_delta_entity ON delta_changes_log(entity_type, entity_id);
CREATE INDEX idx_delta_version ON delta_changes_log(version_number DESC);
CREATE INDEX idx_delta_changed ON delta_changes_log(changed_at DESC);

-- ========================================
-- 9. BANDWIDTH MONITORING
-- ========================================

CREATE TABLE IF NOT EXISTS bandwidth_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device & User
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Usage Details
  bytes_uploaded BIGINT DEFAULT 0,
  bytes_downloaded BIGINT DEFAULT 0,
  total_bytes BIGINT GENERATED ALWAYS AS (bytes_uploaded + bytes_downloaded) STORED,

  -- Resource Type
  resource_type VARCHAR(100), -- 'video', 'document', 'sync', etc.

  -- Network Type
  network_type VARCHAR(50), -- 'wifi', '4g', '5g'

  -- Time Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bandwidth_device ON bandwidth_usage(device_id);
CREATE INDEX idx_bandwidth_user ON bandwidth_usage(user_id);
CREATE INDEX idx_bandwidth_period ON bandwidth_usage(period_start, period_end);

-- ========================================
-- 10. BACKGROUND SYNC JOBS
-- ========================================

CREATE TABLE IF NOT EXISTS background_sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Device
  device_id UUID NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Job Details
  job_type VARCHAR(100) NOT NULL, -- 'sync_progress', 'sync_courses', 'download_videos', etc.
  job_name VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress_percent INTEGER DEFAULT 0,

  -- Timing
  scheduled_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Results
  items_processed INTEGER DEFAULT 0,
  bytes_transferred BIGINT DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Error
  error_message TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bg_jobs_device ON background_sync_jobs(device_id);
CREATE INDEX idx_bg_jobs_status ON background_sync_jobs(status);
CREATE INDEX idx_bg_jobs_scheduled ON background_sync_jobs(scheduled_at);

-- ========================================
-- 11. APP FEATURE FLAGS
-- ========================================

CREATE TABLE IF NOT EXISTS app_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Feature Identity
  feature_key VARCHAR(100) NOT NULL UNIQUE,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,

  -- Status
  is_enabled BOOLEAN DEFAULT false,

  -- Rollout
  rollout_percent INTEGER DEFAULT 0, -- 0-100
  target_platforms device_platform[],
  min_app_version VARCHAR(50),
  max_app_version VARCHAR(50),

  -- Targeting
  target_user_ids UUID[], -- Specific users
  target_user_roles VARCHAR(50)[], -- User roles

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON app_feature_flags(feature_key);
CREATE INDEX idx_feature_flags_enabled ON app_feature_flags(is_enabled);

-- ========================================
-- 12. FUNCTIONS
-- ========================================

-- Function: Get delta changes since last sync
CREATE OR REPLACE FUNCTION get_delta_changes(
  p_device_id UUID,
  p_entity_type VARCHAR,
  p_since_version BIGINT DEFAULT 0
)
RETURNS TABLE(
  entity_id UUID,
  change_type VARCHAR,
  version_number BIGINT,
  full_data JSONB,
  changed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dcl.entity_id,
    dcl.change_type,
    dcl.version_number,
    dcl.full_data,
    dcl.changed_at
  FROM delta_changes_log dcl
  WHERE dcl.entity_type = p_entity_type
    AND dcl.version_number > p_since_version
    AND (dcl.device_id IS NULL OR dcl.device_id != p_device_id) -- Exclude own changes
  ORDER BY dcl.version_number ASC;
END;
$$ LANGUAGE plpgsql;

-- Function: Update sync checkpoint
CREATE OR REPLACE FUNCTION update_sync_checkpoint(
  p_device_id UUID,
  p_entity_type VARCHAR,
  p_version BIGINT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sync_checkpoints (
    device_id, user_id, entity_type, last_sync_version, last_sync_timestamp, sync_count
  )
  SELECT
    p_device_id,
    md.user_id,
    p_entity_type,
    p_version,
    NOW(),
    1
  FROM mobile_devices md
  WHERE md.id = p_device_id
  ON CONFLICT (device_id, entity_type)
  DO UPDATE SET
    last_sync_version = p_version,
    last_sync_timestamp = NOW(),
    sync_count = sync_checkpoints.sync_count + 1,
    total_items_synced = sync_checkpoints.total_items_synced + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Resolve sync conflict
CREATE OR REPLACE FUNCTION resolve_sync_conflict(
  p_conflict_id UUID,
  p_resolution conflict_resolution,
  p_resolved_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- Get conflict details
  SELECT * INTO v_conflict
  FROM sync_conflicts
  WHERE id = p_conflict_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conflict not found';
  END IF;

  -- Determine resolved data
  UPDATE sync_conflicts
  SET
    resolution_strategy = p_resolution,
    resolved_data = CASE p_resolution
      WHEN 'server_wins' THEN server_data
      WHEN 'client_wins' THEN client_data
      WHEN 'last_write_wins' THEN
        CASE WHEN server_version > client_version THEN server_data ELSE client_data END
      ELSE NULL
    END,
    resolved_by = p_resolved_by,
    resolved_at = NOW(),
    is_resolved = true
  WHERE id = p_conflict_id;

  -- Update sync queue
  UPDATE sync_queue
  SET
    status = 'completed',
    has_conflict = false,
    synced_at = NOW()
  WHERE id = v_conflict.sync_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Send push notification
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title VARCHAR,
  p_body TEXT,
  p_action_type VARCHAR DEFAULT NULL,
  p_action_data JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_device RECORD;
BEGIN
  -- Create notification for each active device
  FOR v_device IN
    SELECT id, push_token
    FROM mobile_devices
    WHERE user_id = p_user_id
      AND is_active = true
      AND push_enabled = true
      AND push_token IS NOT NULL
  LOOP
    INSERT INTO push_notifications (
      user_id, device_id, title, body, action_type, action_data
    ) VALUES (
      p_user_id, v_device.id, p_title, p_body, p_action_type, p_action_data
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Check feature flag
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_feature_key VARCHAR,
  p_user_id UUID,
  p_device_platform device_platform,
  p_app_version VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag RECORD;
  v_user_role VARCHAR;
BEGIN
  SELECT * INTO v_flag
  FROM app_feature_flags
  WHERE feature_key = p_feature_key
    AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check platform
  IF v_flag.target_platforms IS NOT NULL AND
     NOT (p_device_platform = ANY(v_flag.target_platforms)) THEN
    RETURN false;
  END IF;

  -- Check user targeting
  IF v_flag.target_user_ids IS NOT NULL AND
     NOT (p_user_id = ANY(v_flag.target_user_ids)) THEN
    -- Check role targeting
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    IF v_flag.target_user_roles IS NOT NULL AND
       NOT (v_user_role = ANY(v_flag.target_user_roles)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Rollout percentage (simple hash-based)
  IF v_flag.rollout_percent < 100 THEN
    IF (hashtext(p_user_id::TEXT) % 100) >= v_flag.rollout_percent THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup expired downloads
CREATE OR REPLACE FUNCTION cleanup_expired_downloads()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM offline_downloads
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status = 'completed';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 13. VIEWS
-- ========================================

-- View: Device sync status
CREATE OR REPLACE VIEW device_sync_status AS
SELECT
  md.id AS device_id,
  md.device_name,
  md.device_platform,
  md.user_id,
  u.full_name AS user_name,
  md.last_sync_at,
  COUNT(sq.id) AS pending_sync_items,
  COUNT(sc.id) AS unresolved_conflicts,
  md.is_active
FROM mobile_devices md
JOIN users u ON md.user_id = u.id
LEFT JOIN sync_queue sq ON md.id = sq.device_id AND sq.status = 'pending'
LEFT JOIN sync_conflicts sc ON md.id = sc.device_id AND sc.is_resolved = false
GROUP BY md.id, md.device_name, md.device_platform, md.user_id, u.full_name,
         md.last_sync_at, md.is_active;

-- View: Offline content summary
CREATE OR REPLACE VIEW offline_content_summary AS
SELECT
  md.id AS device_id,
  md.device_name,
  md.user_id,
  COUNT(od.id) AS total_downloads,
  COUNT(od.id) FILTER (WHERE od.status = 'completed') AS completed_downloads,
  SUM(od.storage_used_bytes) FILTER (WHERE od.status = 'completed') AS total_storage_used,
  MAX(od.completed_at) AS last_download_at
FROM mobile_devices md
LEFT JOIN offline_downloads od ON md.id = od.device_id
GROUP BY md.id, md.device_name, md.user_id;

-- View: Push notification delivery stats
CREATE OR REPLACE VIEW push_notification_stats AS
SELECT
  DATE(created_at) AS notification_date,
  COUNT(*) AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'clicked') AS clicked,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS delivery_rate,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'clicked')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0) * 100, 2
  ) AS click_through_rate
FROM push_notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY notification_date DESC;

-- View: Bandwidth usage summary
CREATE OR REPLACE VIEW bandwidth_usage_summary AS
SELECT
  md.user_id,
  u.full_name,
  md.device_platform,
  SUM(bu.bytes_uploaded) AS total_uploaded,
  SUM(bu.bytes_downloaded) AS total_downloaded,
  SUM(bu.total_bytes) AS total_bandwidth,
  COUNT(DISTINCT DATE(bu.period_start)) AS active_days
FROM bandwidth_usage bu
JOIN mobile_devices md ON bu.device_id = md.id
JOIN users u ON md.user_id = u.id
WHERE bu.period_start > NOW() - INTERVAL '30 days'
GROUP BY md.user_id, u.full_name, md.device_platform;

COMMENT ON SCHEMA public IS 'Mobile App Backend & Offline Sync - Offline-first, delta sync, push notifications, conflict resolution';
