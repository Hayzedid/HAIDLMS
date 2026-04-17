-- ============================================================================
-- AUDIT LOGGING SCHEMA
-- ============================================================================
-- Comprehensive audit trail for compliance, security, and debugging

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE audit_event_type AS ENUM (
  'user_login',
  'user_logout',
  'user_created',
  'user_updated',
  'user_deleted',
  'password_changed',
  'password_reset',
  'email_verified',
  'role_assigned',
  'role_revoked',
  'permission_granted',
  'permission_revoked',
  'course_created',
  'course_updated',
  'course_deleted',
  'course_published',
  'course_unpublished',
  'enrollment_created',
  'enrollment_completed',
  'assessment_submitted',
  'grade_assigned',
  'certificate_issued',
  'payment_processed',
  'payment_refunded',
  'subscription_started',
  'subscription_cancelled',
  'data_exported',
  'data_imported',
  'settings_changed',
  'impersonation_started',
  'impersonation_ended',
  'security_alert',
  'api_key_created',
  'api_key_revoked',
  'file_uploaded',
  'file_deleted',
  'report_generated',
  'bulk_operation'
);

CREATE TYPE audit_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

CREATE TYPE entity_type AS ENUM (
  'user',
  'course',
  'module',
  'lesson',
  'enrollment',
  'assessment',
  'certificate',
  'payment',
  'subscription',
  'role',
  'permission',
  'organization',
  'report',
  'setting'
);

-- ────────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  event_type audit_event_type NOT NULL,
  severity audit_severity DEFAULT 'info',
  category VARCHAR(50), -- e.g., 'security', 'data', 'access'

  -- Actor (who performed the action)
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255),
  actor_email VARCHAR(255),
  actor_role VARCHAR(100),

  -- Target (what was acted upon)
  entity_type entity_type,
  entity_id UUID,
  entity_name VARCHAR(500),

  -- Action details
  action VARCHAR(100) NOT NULL,
  description TEXT,

  -- Changes (before/after snapshots)
  changes JSONB, -- { "before": {...}, "after": {...} }
  metadata JSONB, -- Additional context

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  session_id VARCHAR(100),
  request_method VARCHAR(10),
  request_path TEXT,
  request_body JSONB,
  response_status INTEGER,

  -- Geolocation
  country_code VARCHAR(2),
  city VARCHAR(100),

  -- Compliance flags
  is_sensitive BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 365,

  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);

-- Partial index for sensitive data
CREATE INDEX idx_audit_logs_sensitive ON audit_logs(is_sensitive) WHERE is_sensitive = true;

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_actor_date ON audit_logs(actor_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_entity_date ON audit_logs(entity_type, entity_id, occurred_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- SECURITY EVENTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event classification
  event_type VARCHAR(100) NOT NULL,
  threat_level VARCHAR(20), -- low, medium, high, critical
  is_blocked BOOLEAN DEFAULT false,

  -- User context
  user_id UUID REFERENCES users(id),
  username VARCHAR(255),
  email VARCHAR(255),

  -- Event details
  description TEXT NOT NULL,
  details JSONB,

  -- Network context
  ip_address INET NOT NULL,
  user_agent TEXT,
  country_code VARCHAR(2),

  -- Detection
  detection_method VARCHAR(50), -- e.g., 'rate_limit', 'pattern_match', 'ml_model'
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00

  -- Response
  action_taken VARCHAR(50), -- e.g., 'blocked', 'throttled', 'alerted', 'logged'
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_threat_level ON security_events(threat_level);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);

-- ────────────────────────────────────────────────────────────────────────────
-- DATA ACCESS LOGS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User context
  user_id UUID NOT NULL REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(100),

  -- Access details
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- read, write, delete, export

  -- Data classification
  data_sensitivity VARCHAR(20), -- public, internal, confidential, restricted
  contains_pii BOOLEAN DEFAULT false,

  -- Access context
  access_method VARCHAR(50), -- api, ui, export, bulk
  ip_address INET,
  session_id VARCHAR(100),

  -- Results
  records_accessed INTEGER,
  was_successful BOOLEAN DEFAULT true,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_access_logs_user ON data_access_logs(user_id);
CREATE INDEX idx_data_access_logs_resource ON data_access_logs(resource_type, resource_id);
CREATE INDEX idx_data_access_logs_created_at ON data_access_logs(created_at DESC);
CREATE INDEX idx_data_access_logs_pii ON data_access_logs(contains_pii) WHERE contains_pii = true;

-- ────────────────────────────────────────────────────────────────────────────
-- COMPLIANCE LOGS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Compliance context
  regulation VARCHAR(50) NOT NULL, -- GDPR, HIPAA, SOC2, etc.
  requirement VARCHAR(200) NOT NULL,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  description TEXT,

  -- User/Entity involved
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id UUID,

  -- Compliance status
  is_compliant BOOLEAN NOT NULL,
  violations JSONB, -- Array of violation details

  -- Evidence
  evidence JSONB,
  documentation_url TEXT,

  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_logs_regulation ON compliance_logs(regulation);
CREATE INDEX idx_compliance_logs_user ON compliance_logs(user_id);
CREATE INDEX idx_compliance_logs_compliant ON compliance_logs(is_compliant);
CREATE INDEX idx_compliance_logs_created_at ON compliance_logs(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- SYSTEM EVENTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event classification
  event_type VARCHAR(100) NOT NULL,
  severity audit_severity DEFAULT 'info',
  component VARCHAR(100), -- e.g., 'database', 'api', 'worker', 'scheduler'

  -- Event details
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_code VARCHAR(50),

  -- System context
  host_name VARCHAR(255),
  process_id INTEGER,
  thread_id VARCHAR(50),

  -- Metrics
  duration_ms INTEGER,
  memory_usage_mb INTEGER,
  cpu_usage_percent DECIMAL(5, 2),

  -- Additional data
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_events_severity ON system_events(severity);
CREATE INDEX idx_system_events_component ON system_events(component);
CREATE INDEX idx_system_events_created_at ON system_events(created_at DESC);
CREATE INDEX idx_system_events_error ON system_events(error_code) WHERE error_code IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- AUDIT TRAILS (Aggregated view of entity changes)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity tracking
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Change summary
  change_count INTEGER DEFAULT 0,
  first_changed_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,

  -- Change history
  changes JSONB[], -- Array of change objects

  -- Activity summary
  created_by UUID REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  total_modifications INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_audit_trails_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX idx_audit_trails_last_changed ON audit_trails(last_changed_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type audit_event_type,
  p_actor_id UUID,
  p_entity_type entity_type,
  p_entity_id UUID,
  p_action VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_severity audit_severity DEFAULT 'info',
  p_is_sensitive BOOLEAN DEFAULT false
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_actor_name VARCHAR(255);
  v_actor_email VARCHAR(255);
BEGIN
  -- Get actor details
  IF p_actor_id IS NOT NULL THEN
    SELECT name, email INTO v_actor_name, v_actor_email
    FROM users WHERE id = p_actor_id;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    event_type,
    severity,
    actor_id,
    actor_name,
    actor_email,
    entity_type,
    entity_id,
    action,
    description,
    changes,
    metadata,
    ip_address,
    is_sensitive
  ) VALUES (
    p_event_type,
    p_severity,
    p_actor_id,
    v_actor_name,
    v_actor_email,
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    p_changes,
    p_metadata,
    p_ip_address,
    p_is_sensitive
  ) RETURNING id INTO v_log_id;

  -- Update audit trail
  INSERT INTO audit_trails (
    entity_type,
    entity_id,
    change_count,
    first_changed_at,
    last_changed_at,
    changes,
    created_by,
    last_modified_by,
    total_modifications
  ) VALUES (
    p_entity_type,
    p_entity_id,
    1,
    NOW(),
    NOW(),
    ARRAY[jsonb_build_object(
      'timestamp', NOW(),
      'actor_id', p_actor_id,
      'action', p_action,
      'changes', p_changes
    )],
    p_actor_id,
    p_actor_id,
    1
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    change_count = audit_trails.change_count + 1,
    last_changed_at = NOW(),
    changes = audit_trails.changes || jsonb_build_object(
      'timestamp', NOW(),
      'actor_id', p_actor_id,
      'action', p_action,
      'changes', p_changes
    ),
    last_modified_by = p_actor_id,
    total_modifications = audit_trails.total_modifications + 1,
    updated_at = NOW();

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Log security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR,
  p_threat_level VARCHAR,
  p_user_id UUID,
  p_description TEXT,
  p_ip_address INET,
  p_is_blocked BOOLEAN DEFAULT false,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_username VARCHAR(255);
  v_email VARCHAR(255);
BEGIN
  -- Get user details if provided
  IF p_user_id IS NOT NULL THEN
    SELECT name, email INTO v_username, v_email
    FROM users WHERE id = p_user_id;
  END IF;

  INSERT INTO security_events (
    event_type,
    threat_level,
    is_blocked,
    user_id,
    username,
    email,
    description,
    details,
    ip_address
  ) VALUES (
    p_event_type,
    p_threat_level,
    p_is_blocked,
    p_user_id,
    v_username,
    v_email,
    p_description,
    p_details,
    p_ip_address
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE occurred_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Get audit summary for entity
CREATE OR REPLACE FUNCTION get_entity_audit_summary(
  p_entity_type entity_type,
  p_entity_id UUID
) RETURNS TABLE (
  total_events BIGINT,
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ,
  unique_actors BIGINT,
  event_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_events,
    MIN(occurred_at) as first_event,
    MAX(occurred_at) as last_event,
    COUNT(DISTINCT actor_id) as unique_actors,
    jsonb_agg(DISTINCT event_type) as event_types
  FROM audit_logs
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- Recent security alerts
CREATE OR REPLACE VIEW recent_security_alerts AS
SELECT
  se.*,
  u.name as user_name
FROM security_events se
LEFT JOIN users u ON se.user_id = u.id
WHERE se.threat_level IN ('high', 'critical')
  AND se.created_at > NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

-- Compliance violations
CREATE OR REPLACE VIEW compliance_violations AS
SELECT
  cl.*,
  u.name as user_name,
  u.email as user_email
FROM compliance_logs cl
LEFT JOIN users u ON cl.user_id = u.id
WHERE cl.is_compliant = false
  AND cl.reviewed_at IS NULL
ORDER BY cl.created_at DESC;

-- High-severity system events
CREATE OR REPLACE VIEW critical_system_events AS
SELECT *
FROM system_events
WHERE severity IN ('error', 'critical')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  actor_id,
  actor_name,
  actor_email,
  COUNT(*) as total_actions,
  COUNT(DISTINCT DATE(occurred_at)) as active_days,
  MIN(occurred_at) as first_action,
  MAX(occurred_at) as last_action,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_actions,
  COUNT(*) FILTER (WHERE severity = 'error') as error_actions,
  COUNT(DISTINCT entity_id) as unique_entities_accessed
FROM audit_logs
WHERE occurred_at > NOW() - INTERVAL '30 days'
  AND actor_id IS NOT NULL
GROUP BY actor_id, actor_name, actor_email
ORDER BY total_actions DESC;

-- Sensitive data access summary
CREATE OR REPLACE VIEW sensitive_data_access AS
SELECT
  dal.user_id,
  u.name as user_name,
  u.email as user_email,
  dal.resource_type,
  COUNT(*) as access_count,
  MAX(dal.created_at) as last_access,
  COUNT(*) FILTER (WHERE dal.contains_pii = true) as pii_access_count
FROM data_access_logs dal
JOIN users u ON dal.user_id = u.id
WHERE dal.created_at > NOW() - INTERVAL '30 days'
GROUP BY dal.user_id, u.name, u.email, dal.resource_type
ORDER BY access_count DESC;

-- Audit log statistics
CREATE OR REPLACE VIEW audit_statistics AS
SELECT
  DATE(occurred_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT actor_id) as unique_actors,
  COUNT(DISTINCT entity_id) as unique_entities,
  COUNT(*) FILTER (WHERE severity = 'info') as info_count,
  COUNT(*) FILTER (WHERE severity = 'warning') as warning_count,
  COUNT(*) FILTER (WHERE severity = 'error') as error_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE is_sensitive = true) as sensitive_count
FROM audit_logs
WHERE occurred_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(occurred_at)
ORDER BY date DESC;
