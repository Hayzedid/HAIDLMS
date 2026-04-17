-- ============================================================================
-- ADMIN DASHBOARD & SUPER ADMIN SCHEMA
-- ============================================================================
-- This schema manages admin dashboard, system monitoring, and super admin features.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE system_health_status AS ENUM (
  'healthy',
  'degraded',
  'critical',
  'down'
);

CREATE TYPE metric_type AS ENUM (
  'counter',
  'gauge',
  'histogram',
  'summary'
);

CREATE TYPE alert_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

CREATE TYPE admin_action_type AS ENUM (
  'user_management',
  'system_config',
  'data_management',
  'security',
  'content_moderation'
);

CREATE TYPE announcement_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- ============================================================================
-- SYSTEM METRICS
-- ============================================================================

CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metric Details
  metric_name VARCHAR(255) NOT NULL,
  metric_type metric_type NOT NULL,
  metric_value DECIMAL(20,4) NOT NULL,
  metric_unit VARCHAR(50), -- count, bytes, ms, percentage

  -- Dimensions
  service_name VARCHAR(100),
  host_name VARCHAR(255),
  environment VARCHAR(50), -- development, staging, production
  region VARCHAR(100),

  -- Labels
  labels JSONB, -- {"endpoint": "/api/courses", "method": "GET"}

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_service ON system_metrics(service_name);
CREATE INDEX idx_system_metrics_time ON system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_labels ON system_metrics USING GIN(labels);

-- ============================================================================
-- SYSTEM HEALTH
-- ============================================================================

CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Component Details
  component_name VARCHAR(255) NOT NULL,
  component_type VARCHAR(100), -- database, api, cache, storage

  -- Health Status
  status system_health_status NOT NULL,
  is_healthy BOOLEAN DEFAULT true,

  -- Check Results
  response_time_ms INTEGER,
  error_message TEXT,
  error_details JSONB,

  -- Checks Performed
  checks_performed JSONB, -- {"database": "ok", "redis": "fail"}

  -- Metadata
  version VARCHAR(50),
  uptime_seconds BIGINT,
  last_restart_at TIMESTAMPTZ,

  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_checks_component ON system_health_checks(component_name);
CREATE INDEX idx_health_checks_status ON system_health_checks(status);
CREATE INDEX idx_health_checks_time ON system_health_checks(checked_at DESC);

-- ============================================================================
-- RESOURCE USAGE
-- ============================================================================

CREATE TABLE resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource Details
  resource_type VARCHAR(100) NOT NULL, -- cpu, memory, disk, network, database_connections
  resource_name VARCHAR(255),

  -- Usage Metrics
  current_value DECIMAL(20,4),
  max_value DECIMAL(20,4),
  usage_percentage DECIMAL(5,2),

  -- Breakdown
  usage_details JSONB, -- {"by_service": {"api": 30, "worker": 20}}

  -- Thresholds
  warning_threshold DECIMAL(5,2) DEFAULT 75,
  critical_threshold DECIMAL(5,2) DEFAULT 90,
  is_above_warning BOOLEAN DEFAULT false,
  is_above_critical BOOLEAN DEFAULT false,

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resource_usage_type ON resource_usage(resource_type);
CREATE INDEX idx_resource_usage_time ON resource_usage(recorded_at DESC);
CREATE INDEX idx_resource_usage_alerts ON resource_usage(is_above_critical, is_above_warning);

-- ============================================================================
-- ERROR LOGS
-- ============================================================================

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Error Details
  error_code VARCHAR(100),
  error_message TEXT NOT NULL,
  error_type VARCHAR(100), -- Exception type

  -- Stack Trace
  stack_trace TEXT,
  error_context JSONB, -- Additional context

  -- Location
  service_name VARCHAR(100),
  endpoint VARCHAR(500),
  method VARCHAR(10),
  file_path VARCHAR(500),
  line_number INTEGER,

  -- Request Info
  request_id VARCHAR(255),
  user_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Severity
  severity alert_severity DEFAULT 'error',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,

  -- Occurrence
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_service ON error_logs(service_name);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_time ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(is_resolved);
CREATE INDEX idx_error_logs_user ON error_logs(user_id);

-- ============================================================================
-- PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request Details
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  service_name VARCHAR(100),

  -- Timing
  response_time_ms INTEGER NOT NULL,
  database_time_ms INTEGER,
  cache_time_ms INTEGER,
  external_api_time_ms INTEGER,

  -- Status
  status_code INTEGER,
  is_success BOOLEAN DEFAULT true,
  is_cached BOOLEAN DEFAULT false,

  -- Volume
  request_count INTEGER DEFAULT 1,
  error_count INTEGER DEFAULT 0,

  -- Resources
  memory_used_mb DECIMAL(10,2),
  cpu_time_ms INTEGER,

  -- Percentiles (for aggregated data)
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,

  -- Time Window
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perf_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX idx_perf_metrics_service ON performance_metrics(service_name);
CREATE INDEX idx_perf_metrics_time ON performance_metrics(created_at DESC);
CREATE INDEX idx_perf_metrics_slow ON performance_metrics(response_time_ms DESC);

-- ============================================================================
-- ADMIN ACTIONS
-- ============================================================================

CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin Details
  admin_id UUID NOT NULL,
  admin_email VARCHAR(255),
  admin_role VARCHAR(100),

  -- Action Details
  action_type admin_action_type NOT NULL,
  action VARCHAR(255) NOT NULL,
  description TEXT,

  -- Target
  target_type VARCHAR(100), -- user, course, system_config
  target_id UUID,
  target_identifier VARCHAR(255),

  -- Changes
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  notes TEXT,

  -- Impact
  affected_users_count INTEGER,
  affected_resources_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_time ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);

-- ============================================================================
-- SYSTEM ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Announcement Details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  announcement_type VARCHAR(50), -- maintenance, feature, alert, update

  -- Priority
  priority announcement_priority DEFAULT 'normal',
  is_urgent BOOLEAN DEFAULT false,

  -- Targeting
  target_audience VARCHAR(50), -- all, admins, instructors, students
  target_organizations UUID[],
  target_users UUID[],

  -- Display
  show_banner BOOLEAN DEFAULT true,
  show_notification BOOLEAN DEFAULT true,
  dismissible BOOLEAN DEFAULT true,

  -- Styling
  banner_color VARCHAR(50),
  icon VARCHAR(100),

  -- Scheduling
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Links
  action_url VARCHAR(500),
  action_label VARCHAR(100),

  -- Tracking
  views_count INTEGER DEFAULT 0,
  dismissals_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_active ON system_announcements(is_active, start_at, end_at);
CREATE INDEX idx_announcements_priority ON system_announcements(priority DESC);
CREATE INDEX idx_announcements_time ON system_announcements(start_at DESC);

-- ============================================================================
-- ANNOUNCEMENT INTERACTIONS
-- ============================================================================

CREATE TABLE announcement_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES system_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Interaction
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_interactions_announcement ON announcement_interactions(announcement_id);
CREATE INDEX idx_announcement_interactions_user ON announcement_interactions(user_id);

-- ============================================================================
-- TENANT MANAGEMENT (Multi-tenancy)
-- ============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant Details
  tenant_name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,

  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Plan & Limits
  plan_type VARCHAR(50), -- free, starter, professional, enterprise
  max_users INTEGER,
  max_courses INTEGER,
  max_storage_gb INTEGER,

  -- Current Usage
  current_users_count INTEGER DEFAULT 0,
  current_courses_count INTEGER DEFAULT 0,
  current_storage_gb DECIMAL(10,2) DEFAULT 0,

  -- Features
  enabled_features TEXT[],
  custom_domain VARCHAR(255),
  custom_branding JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,

  -- Billing
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  trial_ends_at TIMESTAMPTZ,
  next_billing_date DATE,

  -- Metadata
  settings JSONB,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = true;
CREATE INDEX idx_tenants_plan ON tenants(plan_type);

-- ============================================================================
-- TENANT USAGE TRACKING
-- ============================================================================

CREATE TABLE tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- User Metrics
  active_users_count INTEGER DEFAULT 0,
  new_users_count INTEGER DEFAULT 0,
  total_users_count INTEGER DEFAULT 0,

  -- Course Metrics
  active_courses_count INTEGER DEFAULT 0,
  new_courses_count INTEGER DEFAULT 0,
  total_courses_count INTEGER DEFAULT 0,

  -- Activity Metrics
  total_logins INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,

  -- Storage
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,

  -- Engagement
  avg_session_duration_minutes INTEGER,
  total_learning_time_minutes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, date)
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_date ON tenant_usage(date DESC);

-- ============================================================================
-- ADMIN QUICK ACTIONS
-- ============================================================================

CREATE TABLE admin_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action Details
  action_name VARCHAR(255) NOT NULL,
  action_label VARCHAR(255) NOT NULL,
  description TEXT,

  -- Target
  target_endpoint VARCHAR(500) NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',

  -- Permissions
  required_role VARCHAR(100),
  required_permissions TEXT[],

  -- Display
  icon VARCHAR(100),
  color VARCHAR(50),
  display_order INTEGER DEFAULT 0,

  -- Confirmation
  requires_confirmation BOOLEAN DEFAULT true,
  confirmation_message TEXT,

  -- Parameters
  parameters JSONB, -- Required/optional parameters

  -- Status
  is_visible BOOLEAN DEFAULT true,
  is_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quick_actions_visible ON admin_quick_actions(is_visible, is_enabled, display_order);

-- ============================================================================
-- DASHBOARD WIDGETS
-- ============================================================================

CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Widget Details
  widget_name VARCHAR(255) NOT NULL,
  widget_type VARCHAR(100) NOT NULL, -- chart, stat, table, list, alert
  title VARCHAR(255),
  description TEXT,

  -- Data Source
  data_source VARCHAR(255) NOT NULL, -- SQL query or endpoint
  refresh_interval_seconds INTEGER DEFAULT 300,

  -- Configuration
  config JSONB, -- Chart type, columns, filters, etc.

  -- Layout
  grid_position JSONB, -- {"x": 0, "y": 0, "w": 6, "h": 4}
  default_size VARCHAR(50), -- small, medium, large, full

  -- Permissions
  visible_to_roles TEXT[],

  -- Status
  is_visible BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(is_visible);
CREATE INDEX idx_dashboard_widgets_default ON dashboard_widgets(is_default);

-- ============================================================================
-- USER DASHBOARD PREFERENCES
-- ============================================================================

CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Widget Layout
  widget_layout JSONB, -- Array of widgets with positions

  -- Display Preferences
  theme VARCHAR(50) DEFAULT 'light', -- light, dark, auto
  compact_mode BOOLEAN DEFAULT false,
  show_tooltips BOOLEAN DEFAULT true,

  -- Dashboard Settings
  default_time_range VARCHAR(50) DEFAULT '7d', -- 1d, 7d, 30d, 90d
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval_seconds INTEGER DEFAULT 60,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_dashboard_prefs_user ON user_dashboard_preferences(user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- System Health Overview
CREATE VIEW system_health_overview AS
SELECT
  component_name,
  component_type,
  status,
  response_time_ms,
  MAX(checked_at) as last_checked_at
FROM system_health_checks
WHERE checked_at > NOW() - INTERVAL '5 minutes'
GROUP BY component_name, component_type, status, response_time_ms
ORDER BY
  CASE status
    WHEN 'down' THEN 1
    WHEN 'critical' THEN 2
    WHEN 'degraded' THEN 3
    WHEN 'healthy' THEN 4
  END;

-- Real-time System Metrics
CREATE VIEW realtime_system_metrics AS
SELECT
  metric_name,
  metric_type,
  AVG(metric_value) as avg_value,
  MAX(metric_value) as max_value,
  MIN(metric_value) as min_value,
  service_name,
  MAX(recorded_at) as last_recorded_at
FROM system_metrics
WHERE recorded_at > NOW() - INTERVAL '5 minutes'
GROUP BY metric_name, metric_type, service_name;

-- Top Errors
CREATE VIEW top_errors AS
SELECT
  error_code,
  error_message,
  service_name,
  severity,
  COUNT(*) as occurrence_count,
  MAX(last_occurred_at) as most_recent_at
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND is_resolved = false
GROUP BY error_code, error_message, service_name, severity
ORDER BY occurrence_count DESC
LIMIT 50;

-- Tenant Overview
CREATE VIEW tenant_overview AS
SELECT
  t.id,
  t.tenant_name,
  t.plan_type,
  t.current_users_count,
  t.current_courses_count,
  t.current_storage_gb,
  t.is_active,
  t.is_suspended,
  COALESCE(tu.active_users_count, 0) as active_users_today,
  COALESCE(tu.total_api_calls, 0) as api_calls_today
FROM tenants t
LEFT JOIN tenant_usage tu ON tu.tenant_id = t.id AND tu.date = CURRENT_DATE;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate system health score
CREATE OR REPLACE FUNCTION calculate_system_health_score()
RETURNS DECIMAL AS $$
DECLARE
  v_total_components INTEGER;
  v_healthy_components INTEGER;
  v_score DECIMAL;
BEGIN
  SELECT COUNT(*) INTO v_total_components
  FROM (
    SELECT DISTINCT component_name
    FROM system_health_checks
    WHERE checked_at > NOW() - INTERVAL '5 minutes'
  ) sub;

  SELECT COUNT(*) INTO v_healthy_components
  FROM (
    SELECT DISTINCT component_name
    FROM system_health_checks
    WHERE checked_at > NOW() - INTERVAL '5 minutes'
      AND status = 'healthy'
  ) sub;

  IF v_total_components = 0 THEN
    RETURN 0;
  END IF;

  v_score = (v_healthy_components::DECIMAL / v_total_components) * 100;
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Get tenant resource usage percentage
CREATE OR REPLACE FUNCTION get_tenant_usage_percentage(p_tenant_id UUID)
RETURNS TABLE(
  users_percentage DECIMAL,
  courses_percentage DECIMAL,
  storage_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN max_users > 0
      THEN ROUND((current_users_count::DECIMAL / max_users) * 100, 2)
      ELSE 0
    END as users_percentage,
    CASE WHEN max_courses > 0
      THEN ROUND((current_courses_count::DECIMAL / max_courses) * 100, 2)
      ELSE 0
    END as courses_percentage,
    CASE WHEN max_storage_gb > 0
      THEN ROUND((current_storage_gb::DECIMAL / max_storage_gb) * 100, 2)
      ELSE 0
    END as storage_percentage
  FROM tenants
  WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Log admin action
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- This can be customized to automatically log certain admin actions
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_update_timestamp
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_timestamp();

CREATE TRIGGER announcements_update_timestamp
  BEFORE UPDATE ON system_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_metrics IS 'Real-time system performance metrics';
COMMENT ON TABLE system_health_checks IS 'System component health status';
COMMENT ON TABLE resource_usage IS 'Resource utilization tracking';
COMMENT ON TABLE error_logs IS 'Application error logs and tracking';
COMMENT ON TABLE performance_metrics IS 'API and endpoint performance metrics';
COMMENT ON TABLE admin_actions IS 'Admin user action audit trail';
COMMENT ON TABLE system_announcements IS 'System-wide announcements and alerts';
COMMENT ON TABLE tenants IS 'Multi-tenant organization management';
COMMENT ON TABLE tenant_usage IS 'Tenant resource usage tracking';
COMMENT ON TABLE admin_quick_actions IS 'Admin dashboard quick actions';
COMMENT ON TABLE dashboard_widgets IS 'Dashboard widget configurations';
COMMENT ON TABLE user_dashboard_preferences IS 'User dashboard layout preferences';
