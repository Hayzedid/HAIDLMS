-- ============================================================================
-- ADVANCED REPORTING & EXPORT SCHEMA
-- ============================================================================
-- Custom report builder, pre-built templates, organization-wide analytics,
-- export capabilities (PDF, Excel, CSV), and scheduled report delivery
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- REPORT TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'enrollment', 'progress', 'engagement', 'financial', 'custom'

  -- Template type
  template_type VARCHAR(50) DEFAULT 'custom', -- 'predefined', 'custom', 'system'
  is_public BOOLEAN DEFAULT false,

  -- Ownership
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Report configuration
  data_source VARCHAR(100) NOT NULL, -- 'courses', 'enrollments', 'users', 'analytics', etc.
  query_config JSONB, -- SQL query template or configuration

  -- Filters configuration
  available_filters JSONB, -- [{field: 'courseId', type: 'select', label: 'Course', options: [...]}]
  default_filters JSONB, -- Default filter values

  -- Columns configuration
  columns JSONB NOT NULL, -- [{field: 'userName', label: 'User Name', type: 'text', visible: true, sortable: true}]
  default_sort JSONB, -- {field: 'createdAt', direction: 'desc'}

  -- Aggregations
  aggregations JSONB, -- [{field: 'completionRate', function: 'avg', label: 'Average Completion'}]
  grouping JSONB, -- [{field: 'courseId', label: 'Course'}]

  -- Visualization
  chart_config JSONB, -- {type: 'bar', xAxis: 'courseName', yAxis: 'completionRate'}

  -- Export options
  allowed_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv'],
  page_orientation VARCHAR(20) DEFAULT 'portrait', -- 'portrait', 'landscape'

  -- Permissions
  required_role VARCHAR(50), -- Minimum role required to run this report

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Metadata
  tags TEXT[],
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_report_templates_organization ON report_templates(organization_id);
CREATE INDEX idx_report_templates_public ON report_templates(is_public);

-- ============================================================================
-- CUSTOM REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report identification
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template or custom
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Report configuration (overrides template if exists)
  data_source VARCHAR(100) NOT NULL,
  query_config JSONB,
  columns JSONB NOT NULL,
  filters JSONB, -- Applied filter values
  sort JSONB,
  aggregations JSONB,
  grouping JSONB,
  chart_config JSONB,

  -- Execution settings
  limit_rows INTEGER DEFAULT 1000,
  include_charts BOOLEAN DEFAULT true,

  -- Access control
  is_private BOOLEAN DEFAULT true,
  shared_with UUID[], -- Array of user IDs

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_organization ON custom_reports(organization_id);
CREATE INDEX idx_custom_reports_template ON custom_reports(template_id);

-- ============================================================================
-- REPORT EXECUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report reference
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,

  -- Execution details
  executed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  execution_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'api'

  -- Parameters used
  filters JSONB,
  date_range JSONB, -- {from: '2026-01-01', to: '2026-12-31'}

  -- Results
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  row_count INTEGER,
  execution_time_ms INTEGER, -- Execution time in milliseconds

  -- File outputs
  export_format VARCHAR(20), -- 'pdf', 'excel', 'csv', 'json'
  file_url TEXT,
  file_size BIGINT, -- in bytes
  file_expires_at TIMESTAMP,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_executions_report ON report_executions(report_id);
CREATE INDEX idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX idx_report_executions_status ON report_executions(status);
CREATE INDEX idx_report_executions_started ON report_executions(started_at);

-- ============================================================================
-- SCHEDULED REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report reference
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,

  -- Schedule details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Schedule configuration
  frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'custom'
  cron_expression VARCHAR(100), -- For custom schedules
  timezone VARCHAR(100) DEFAULT 'UTC',

  -- Time settings
  time_of_day TIME, -- When to run (e.g., '09:00')
  day_of_week INTEGER, -- 0-6 for weekly reports
  day_of_month INTEGER, -- 1-31 for monthly reports

  -- Date range settings
  date_range_type VARCHAR(50) DEFAULT 'relative', -- 'relative', 'fixed'
  relative_period VARCHAR(50), -- 'last_7_days', 'last_month', 'last_quarter', 'year_to_date'
  fixed_start_date DATE,
  fixed_end_date DATE,

  -- Export settings
  export_format VARCHAR(20) DEFAULT 'pdf',
  include_charts BOOLEAN DEFAULT true,

  -- Delivery settings
  delivery_method VARCHAR(50) DEFAULT 'email', -- 'email', 'storage', 'both'
  recipients TEXT[], -- Array of email addresses
  email_subject VARCHAR(255),
  email_body TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  last_execution_id UUID REFERENCES report_executions(id) ON DELETE SET NULL,

  -- Statistics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_report ON scheduled_reports(report_id);
CREATE INDEX idx_scheduled_reports_template ON scheduled_reports(template_id);
CREATE INDEX idx_scheduled_reports_created_by ON scheduled_reports(created_by);
CREATE INDEX idx_scheduled_reports_organization ON scheduled_reports(organization_id);
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active);

-- ============================================================================
-- REPORT SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Report reference
  execution_id UUID NOT NULL REFERENCES report_executions(id) ON DELETE CASCADE,

  -- Snapshot data
  data JSONB NOT NULL, -- The actual report data
  metadata JSONB, -- Additional metadata about the snapshot

  -- Statistics
  total_rows INTEGER,
  aggregated_values JSONB, -- Pre-computed aggregations

  -- Versioning
  snapshot_date DATE NOT NULL,
  snapshot_version INTEGER DEFAULT 1,

  -- Retention
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_snapshots_execution ON report_snapshots(execution_id);
CREATE INDEX idx_report_snapshots_date ON report_snapshots(snapshot_date);

-- ============================================================================
-- DASHBOARD WIDGETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Widget details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  widget_type VARCHAR(50) NOT NULL, -- 'chart', 'metric', 'table', 'gauge', 'progress'

  -- Data source
  data_source VARCHAR(100) NOT NULL,
  query_config JSONB NOT NULL,
  refresh_interval INTEGER DEFAULT 300, -- in seconds

  -- Visualization
  chart_type VARCHAR(50), -- 'line', 'bar', 'pie', 'doughnut', 'area', 'scatter'
  chart_config JSONB,
  color_scheme VARCHAR(50),

  -- Display settings
  size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'xlarge'
  position JSONB, -- {x: 0, y: 0, width: 6, height: 4}

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Access
  is_public BOOLEAN DEFAULT false,

  -- Cache
  cached_data JSONB,
  cache_updated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboard_widgets_created_by ON dashboard_widgets(created_by);
CREATE INDEX idx_dashboard_widgets_organization ON dashboard_widgets(organization_id);

-- ============================================================================
-- DASHBOARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dashboard details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  dashboard_type VARCHAR(50) DEFAULT 'custom', -- 'system', 'organization', 'custom'

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Layout
  layout JSONB, -- Grid layout configuration
  theme VARCHAR(50) DEFAULT 'light', -- 'light', 'dark'

  -- Widgets
  widget_ids UUID[], -- Array of dashboard_widget IDs

  -- Access control
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[], -- Array of user IDs

  -- Settings
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval INTEGER DEFAULT 300, -- in seconds

  -- Usage
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_dashboards_organization ON dashboards(organization_id);
CREATE INDEX idx_dashboards_public ON dashboards(is_public);

-- ============================================================================
-- ANALYTICS METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metric identification
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50), -- 'enrollment', 'completion', 'engagement', 'revenue'

  -- Dimensions
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Time dimension
  date DATE NOT NULL,
  hour INTEGER, -- 0-23 for hourly metrics
  week INTEGER, -- Week of year
  month INTEGER, -- 1-12
  quarter INTEGER, -- 1-4
  year INTEGER,

  -- Metric values
  value NUMERIC,
  value_int INTEGER,
  value_text TEXT,
  value_json JSONB,

  -- Metadata
  tags JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);
CREATE INDEX idx_analytics_metrics_category ON analytics_metrics(metric_category);
CREATE INDEX idx_analytics_metrics_date ON analytics_metrics(date);
CREATE INDEX idx_analytics_metrics_organization ON analytics_metrics(organization_id);
CREATE INDEX idx_analytics_metrics_course ON analytics_metrics(course_id);
CREATE INDEX idx_analytics_metrics_user ON analytics_metrics(user_id);

-- ============================================================================
-- REPORT SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Subscription details
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,

  -- Delivery preferences
  delivery_method VARCHAR(50) DEFAULT 'email', -- 'email', 'notification', 'both'
  email_address VARCHAR(255),

  -- Frequency
  frequency VARCHAR(50) DEFAULT 'on_completion', -- 'on_completion', 'daily_digest', 'weekly_digest'

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, report_id, scheduled_report_id)
);

CREATE INDEX idx_report_subscriptions_user ON report_subscriptions(user_id);
CREATE INDEX idx_report_subscriptions_report ON report_subscriptions(report_id);
CREATE INDEX idx_report_subscriptions_scheduled ON report_subscriptions(scheduled_report_id);

-- ============================================================================
-- EXPORT JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job details
  job_type VARCHAR(50) NOT NULL, -- 'report', 'data_export', 'backup'
  export_format VARCHAR(20) NOT NULL, -- 'pdf', 'excel', 'csv', 'json'

  -- Source
  source_type VARCHAR(50), -- 'report', 'query', 'table'
  source_id UUID,
  query_config JSONB,

  -- User
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100

  -- Output
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_expires_at TIMESTAMP,

  -- Processing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_time_ms INTEGER,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
CREATE INDEX idx_export_jobs_organization ON export_jobs(organization_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created ON export_jobs(created_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Popular report templates
CREATE OR REPLACE VIEW popular_report_templates AS
SELECT
  rt.*,
  u.name as creator_name,
  COUNT(DISTINCT re.id) as execution_count,
  COUNT(DISTINCT re.executed_by) as unique_users,
  MAX(re.started_at) as last_executed_at
FROM report_templates rt
LEFT JOIN users u ON rt.created_by = u.id
LEFT JOIN report_executions re ON rt.id = re.template_id
WHERE rt.is_active = true
GROUP BY rt.id, u.name
ORDER BY execution_count DESC;

-- Scheduled reports due
CREATE OR REPLACE VIEW scheduled_reports_due AS
SELECT
  sr.*,
  cr.name as report_name,
  u.name as creator_name
FROM scheduled_reports sr
LEFT JOIN custom_reports cr ON sr.report_id = cr.id
LEFT JOIN users u ON sr.created_by = u.id
WHERE sr.is_active = true
  AND sr.next_run_at <= NOW() + INTERVAL '5 minutes'
ORDER BY sr.next_run_at;

-- Recent report executions
CREATE OR REPLACE VIEW recent_report_executions AS
SELECT
  re.*,
  COALESCE(cr.name, rt.name) as report_name,
  u.name as executed_by_name,
  u.email as executed_by_email
FROM report_executions re
LEFT JOIN custom_reports cr ON re.report_id = cr.id
LEFT JOIN report_templates rt ON re.template_id = rt.id
JOIN users u ON re.executed_by = u.id
ORDER BY re.started_at DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate next run time for scheduled reports
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_frequency VARCHAR,
  p_time_of_day TIME,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_cron_expression VARCHAR,
  p_timezone VARCHAR
)
RETURNS TIMESTAMP AS $$
DECLARE
  v_next_run TIMESTAMP;
  v_current_time TIMESTAMP;
BEGIN
  v_current_time := NOW();

  CASE p_frequency
    WHEN 'daily' THEN
      v_next_run := (CURRENT_DATE + INTERVAL '1 day' + p_time_of_day::TIME)::TIMESTAMP;

    WHEN 'weekly' THEN
      v_next_run := (CURRENT_DATE + ((p_day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7)::INTEGER + p_time_of_day::TIME)::TIMESTAMP;
      IF v_next_run <= v_current_time THEN
        v_next_run := v_next_run + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      v_next_run := (DATE_TRUNC('month', CURRENT_DATE) + (p_day_of_month - 1) * INTERVAL '1 day' + p_time_of_day::TIME)::TIMESTAMP;
      IF v_next_run <= v_current_time THEN
        v_next_run := (DATE_TRUNC('month', v_next_run) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day' + p_time_of_day::TIME)::TIMESTAMP;
      END IF;

    ELSE
      v_next_run := v_current_time + INTERVAL '1 day';
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE report_templates
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update scheduled report after execution
CREATE OR REPLACE FUNCTION update_scheduled_report_after_run(
  p_scheduled_report_id UUID,
  p_execution_id UUID,
  p_success BOOLEAN
)
RETURNS void AS $$
DECLARE
  v_report RECORD;
BEGIN
  SELECT * INTO v_report FROM scheduled_reports WHERE id = p_scheduled_report_id;

  UPDATE scheduled_reports
  SET last_run_at = NOW(),
      last_execution_id = p_execution_id,
      total_runs = total_runs + 1,
      successful_runs = CASE WHEN p_success THEN successful_runs + 1 ELSE successful_runs END,
      failed_runs = CASE WHEN NOT p_success THEN failed_runs + 1 ELSE failed_runs END,
      next_run_at = calculate_next_run_time(
        v_report.frequency,
        v_report.time_of_day,
        v_report.day_of_week,
        v_report.day_of_month,
        v_report.cron_expression,
        v_report.timezone
      )
  WHERE id = p_scheduled_report_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_reporting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reporting_timestamp();

CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_reporting_timestamp();

-- Increment view count for dashboards
CREATE OR REPLACE FUNCTION increment_dashboard_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dashboards
  SET view_count = view_count + 1,
      last_viewed_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE report_templates IS 'Pre-defined and custom report templates';
COMMENT ON TABLE custom_reports IS 'User-created custom reports';
COMMENT ON TABLE report_executions IS 'Report execution history and results';
COMMENT ON TABLE scheduled_reports IS 'Scheduled report delivery configuration';
COMMENT ON TABLE report_snapshots IS 'Point-in-time report data snapshots';
COMMENT ON TABLE dashboard_widgets IS 'Individual dashboard widget configurations';
COMMENT ON TABLE dashboards IS 'User and organization dashboards';
COMMENT ON TABLE analytics_metrics IS 'Time-series analytics metrics storage';
COMMENT ON TABLE report_subscriptions IS 'User subscriptions to reports';
COMMENT ON TABLE export_jobs IS 'Background export job queue and status';
