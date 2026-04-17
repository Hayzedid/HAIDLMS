-- Advanced Monitoring & Observability Schema
-- Metrics, traces, health checks, alerts, and performance monitoring

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE metric_type AS ENUM ('counter', 'gauge', 'histogram', 'summary');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'suppressed');
CREATE TYPE health_status AS ENUM ('healthy', 'degraded', 'unhealthy', 'unknown');
CREATE TYPE trace_status AS ENUM ('ok', 'error', 'timeout');

-- ========================================
-- 2. METRICS
-- ========================================

CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metric Identity
  metric_name VARCHAR(255) NOT NULL,
  metric_type metric_type NOT NULL,

  -- Labels (for dimensions)
  labels JSONB DEFAULT '{}',

  -- Value
  value NUMERIC NOT NULL,

  -- Unit
  unit VARCHAR(50), -- 'ms', 'bytes', 'requests', 'percent', etc.

  -- Context
  service_name VARCHAR(100) DEFAULT 'course-service',
  instance_id VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'production',

  -- Timestamp
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_type ON metrics(metric_type);
CREATE INDEX idx_metrics_service ON metrics(service_name);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX idx_metrics_labels ON metrics USING GIN(labels);

-- ========================================
-- 3. DISTRIBUTED TRACES
-- ========================================

CREATE TABLE IF NOT EXISTS traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Trace Identity
  trace_id VARCHAR(255) NOT NULL,
  span_id VARCHAR(255) NOT NULL UNIQUE,
  parent_span_id VARCHAR(255),

  -- Operation
  operation_name VARCHAR(255) NOT NULL,
  service_name VARCHAR(100) DEFAULT 'course-service',

  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INTEGER,

  -- Status
  status trace_status DEFAULT 'ok',
  status_message TEXT,

  -- Tags (metadata)
  tags JSONB DEFAULT '{}',

  -- Logs
  logs JSONB, -- Array of log entries within this span

  -- HTTP Context (if applicable)
  http_method VARCHAR(10),
  http_url VARCHAR(1000),
  http_status_code INTEGER,

  -- Error Information
  error_message TEXT,
  error_stack TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_traces_trace_id ON traces(trace_id);
CREATE INDEX idx_traces_span_id ON traces(span_id);
CREATE INDEX idx_traces_parent ON traces(parent_span_id);
CREATE INDEX idx_traces_operation ON traces(operation_name);
CREATE INDEX idx_traces_service ON traces(service_name);
CREATE INDEX idx_traces_start ON traces(start_time DESC);
CREATE INDEX idx_traces_status ON traces(status);
CREATE INDEX idx_traces_tags ON traces USING GIN(tags);

-- ========================================
-- 4. HEALTH CHECKS
-- ========================================

CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Component
  component_name VARCHAR(100) NOT NULL,
  component_type VARCHAR(50), -- 'database', 'cache', 'api', 'service', etc.

  -- Health Status
  status health_status NOT NULL,
  response_time_ms INTEGER,

  -- Details
  details JSONB, -- Component-specific health details
  error_message TEXT,

  -- Check Metadata
  check_timestamp TIMESTAMP DEFAULT NOW(),
  next_check_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_component ON health_checks(component_name);
CREATE INDEX idx_health_status ON health_checks(status);
CREATE INDEX idx_health_timestamp ON health_checks(check_timestamp DESC);

-- ========================================
-- 5. ALERTS
-- ========================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Alert Identity
  alert_name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(100) NOT NULL, -- 'threshold', 'anomaly', 'error_rate', etc.

  -- Severity
  severity alert_severity NOT NULL,

  -- Status
  status alert_status DEFAULT 'active',

  -- Description
  summary VARCHAR(500) NOT NULL,
  description TEXT,

  -- Source
  source_service VARCHAR(100) DEFAULT 'course-service',
  source_component VARCHAR(100),

  -- Context
  labels JSONB DEFAULT '{}',
  annotations JSONB DEFAULT '{}',

  -- Triggered By
  metric_name VARCHAR(255),
  metric_value NUMERIC,
  threshold_value NUMERIC,

  -- Timeline
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,

  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_channels TEXT[], -- ['email', 'slack', 'pagerduty']

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_name ON alerts(alert_name);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_service ON alerts(source_service);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at DESC);
CREATE INDEX idx_alerts_labels ON alerts USING GIN(labels);

-- ========================================
-- 6. ALERT RULES
-- ========================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Rule Identity
  rule_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,

  -- Condition
  metric_name VARCHAR(255) NOT NULL,
  condition_operator VARCHAR(20) NOT NULL, -- '>', '<', '>=', '<=', '==', '!='
  threshold_value NUMERIC NOT NULL,

  -- Evaluation
  evaluation_window_seconds INTEGER DEFAULT 300, -- 5 minutes
  evaluation_frequency_seconds INTEGER DEFAULT 60, -- Check every minute

  -- Alert Configuration
  alert_severity alert_severity DEFAULT 'warning',
  alert_summary VARCHAR(500) NOT NULL,
  alert_description TEXT,

  -- Notification
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  notification_cooldown_minutes INTEGER DEFAULT 60,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_evaluated_at TIMESTAMP,
  last_triggered_at TIMESTAMP,

  -- Metadata
  labels JSONB DEFAULT '{}',
  metadata JSONB,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_name ON alert_rules(rule_name);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(is_enabled);
CREATE INDEX idx_alert_rules_metric ON alert_rules(metric_name);

-- ========================================
-- 7. PERFORMANCE PROFILES
-- ========================================

CREATE TABLE IF NOT EXISTS performance_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Profile Identity
  profile_name VARCHAR(255) NOT NULL,
  profile_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'io', 'network'

  -- Profile Data
  profile_data JSONB NOT NULL, -- Actual profiling data

  -- Context
  service_name VARCHAR(100) DEFAULT 'course-service',
  instance_id VARCHAR(255),

  -- Duration
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL,

  -- Statistics
  sample_count INTEGER,
  stack_depth_max INTEGER,

  -- Metadata
  tags JSONB DEFAULT '{}',
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_perf_profiles_name ON performance_profiles(profile_name);
CREATE INDEX idx_perf_profiles_type ON performance_profiles(profile_type);
CREATE INDEX idx_perf_profiles_service ON performance_profiles(service_name);
CREATE INDEX idx_perf_profiles_start ON performance_profiles(start_time DESC);

-- ========================================
-- 8. SLOW QUERIES
-- ========================================

CREATE TABLE IF NOT EXISTS slow_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Query
  query_text TEXT NOT NULL,
  query_hash VARCHAR(64), -- MD5 hash for grouping

  -- Execution
  execution_time_ms INTEGER NOT NULL,
  rows_examined INTEGER,
  rows_returned INTEGER,

  -- Context
  endpoint VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Query Plan
  query_plan JSONB,

  -- Timestamp
  executed_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_slow_queries_hash ON slow_queries(query_hash);
CREATE INDEX idx_slow_queries_time ON slow_queries(execution_time_ms DESC);
CREATE INDEX idx_slow_queries_executed ON slow_queries(executed_at DESC);
CREATE INDEX idx_slow_queries_endpoint ON slow_queries(endpoint);

-- ========================================
-- 9. ERROR TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS error_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Error Identity
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  error_hash VARCHAR(64), -- Hash for grouping similar errors

  -- Stack Trace
  error_stack TEXT,

  -- Context
  service_name VARCHAR(100) DEFAULT 'course-service',
  endpoint VARCHAR(255),
  http_method VARCHAR(10),
  http_status_code INTEGER,

  -- User Context
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),

  -- Request Context
  request_headers JSONB,
  request_body JSONB,
  request_params JSONB,

  -- Environment
  environment VARCHAR(50) DEFAULT 'production',
  instance_id VARCHAR(255),

  -- Count (for grouping)
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_tracking_type ON error_tracking(error_type);
CREATE INDEX idx_error_tracking_hash ON error_tracking(error_hash);
CREATE INDEX idx_error_tracking_service ON error_tracking(service_name);
CREATE INDEX idx_error_tracking_endpoint ON error_tracking(endpoint);
CREATE INDEX idx_error_tracking_last_seen ON error_tracking(last_seen_at DESC);
CREATE INDEX idx_error_tracking_resolved ON error_tracking(is_resolved);

-- ========================================
-- 10. SLI/SLO TRACKING (Service Level Indicators/Objectives)
-- ========================================

CREATE TABLE IF NOT EXISTS sli_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- SLI Identity
  sli_name VARCHAR(255) NOT NULL,
  sli_type VARCHAR(50) NOT NULL, -- 'availability', 'latency', 'error_rate', 'throughput'

  -- Measurement Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,

  -- Latency Metrics (if applicable)
  avg_latency_ms NUMERIC,
  p50_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  p99_latency_ms NUMERIC,

  -- Calculated SLI
  sli_value NUMERIC NOT NULL, -- As percentage or value
  slo_target NUMERIC NOT NULL, -- Target value
  slo_met BOOLEAN NOT NULL, -- Whether SLO was met

  -- Error Budget
  error_budget_remaining NUMERIC,

  -- Context
  service_name VARCHAR(100) DEFAULT 'course-service',
  environment VARCHAR(50) DEFAULT 'production',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sli_name ON sli_metrics(sli_name);
CREATE INDEX idx_sli_type ON sli_metrics(sli_type);
CREATE INDEX idx_sli_period ON sli_metrics(period_start, period_end);
CREATE INDEX idx_sli_service ON sli_metrics(service_name);
CREATE INDEX idx_sli_met ON sli_metrics(slo_met);

-- ========================================
-- 11. ANOMALY DETECTION
-- ========================================

CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Anomaly Identity
  anomaly_type VARCHAR(100) NOT NULL, -- 'spike', 'drop', 'outlier', 'pattern_break'
  metric_name VARCHAR(255) NOT NULL,

  -- Detection
  detected_at TIMESTAMP DEFAULT NOW(),
  severity alert_severity DEFAULT 'warning',

  -- Values
  expected_value NUMERIC,
  actual_value NUMERIC,
  deviation_percent NUMERIC,

  -- Time Window
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,

  -- Context
  service_name VARCHAR(100) DEFAULT 'course-service',
  labels JSONB DEFAULT '{}',

  -- Analysis
  detection_algorithm VARCHAR(100), -- 'statistical', 'ml', 'threshold'
  confidence_score NUMERIC, -- 0-100

  -- Status
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_anomalies_type ON anomalies(anomaly_type);
CREATE INDEX idx_anomalies_metric ON anomalies(metric_name);
CREATE INDEX idx_anomalies_detected ON anomalies(detected_at DESC);
CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_anomalies_acknowledged ON anomalies(is_acknowledged);

-- ========================================
-- 12. FUNCTIONS
-- ========================================

-- Function: Record metric
CREATE OR REPLACE FUNCTION record_metric(
  p_metric_name VARCHAR,
  p_metric_type metric_type,
  p_value NUMERIC,
  p_labels JSONB DEFAULT '{}',
  p_unit VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO metrics (
    metric_name, metric_type, value, labels, unit
  ) VALUES (
    p_metric_name, p_metric_type, p_value, p_labels, p_unit
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get metric aggregates
CREATE OR REPLACE FUNCTION get_metric_aggregates(
  p_metric_name VARCHAR,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP
)
RETURNS TABLE(
  count_value BIGINT,
  sum_value NUMERIC,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  p50_value NUMERIC,
  p95_value NUMERIC,
  p99_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    SUM(m.value),
    AVG(m.value),
    MIN(m.value),
    MAX(m.value),
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY m.value),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.value),
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY m.value)
  FROM metrics m
  WHERE m.metric_name = p_metric_name
    AND m.timestamp BETWEEN p_start_time AND p_end_time;
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger alert
CREATE OR REPLACE FUNCTION trigger_alert(
  p_alert_name VARCHAR,
  p_severity alert_severity,
  p_summary VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metric_name VARCHAR DEFAULT NULL,
  p_metric_value NUMERIC DEFAULT NULL,
  p_labels JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO alerts (
    alert_name, alert_type, severity, status,
    summary, description, metric_name, metric_value,
    labels, triggered_at
  ) VALUES (
    p_alert_name, 'threshold', p_severity, 'active',
    p_summary, p_description, p_metric_name, p_metric_value,
    p_labels, NOW()
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup old metrics
CREATE OR REPLACE FUNCTION cleanup_old_metrics(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM metrics
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Cleanup old traces
CREATE OR REPLACE FUNCTION cleanup_old_traces(p_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM traces
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 13. TRIGGERS
-- ========================================

-- Trigger: Auto-resolve stale alerts
CREATE OR REPLACE FUNCTION auto_resolve_stale_alerts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE alerts
  SET status = 'resolved',
      resolved_at = NOW(),
      resolution_note = 'Auto-resolved: no activity for 24 hours'
  WHERE status = 'active'
    AND triggered_at < NOW() - INTERVAL '24 hours';

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run this check periodically (can be triggered by a cron job)
-- CREATE TRIGGER trigger_auto_resolve_stale_alerts
-- AFTER INSERT ON alerts
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION auto_resolve_stale_alerts();

-- ========================================
-- 14. VIEWS
-- ========================================

-- View: Active alerts summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT
  severity,
  COUNT(*) AS alert_count,
  MAX(triggered_at) AS latest_trigger,
  string_agg(DISTINCT source_service, ', ') AS affected_services
FROM alerts
WHERE status = 'active'
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warning' THEN 3
    WHEN 'info' THEN 4
  END;

-- View: System health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT
  component_name,
  component_type,
  status,
  response_time_ms,
  check_timestamp,
  error_message
FROM health_checks hc1
WHERE check_timestamp = (
  SELECT MAX(check_timestamp)
  FROM health_checks hc2
  WHERE hc2.component_name = hc1.component_name
)
ORDER BY
  CASE status
    WHEN 'unhealthy' THEN 1
    WHEN 'degraded' THEN 2
    WHEN 'unknown' THEN 3
    WHEN 'healthy' THEN 4
  END,
  component_name;

-- View: Error rate by endpoint
CREATE OR REPLACE VIEW error_rate_by_endpoint AS
SELECT
  endpoint,
  COUNT(*) AS error_count,
  COUNT(DISTINCT error_hash) AS unique_errors,
  MAX(last_seen_at) AS latest_error,
  array_agg(DISTINCT error_type ORDER BY error_type) AS error_types
FROM error_tracking
WHERE last_seen_at > NOW() - INTERVAL '24 hours'
  AND is_resolved = false
GROUP BY endpoint
ORDER BY error_count DESC;

-- View: SLO compliance
CREATE OR REPLACE VIEW slo_compliance AS
SELECT
  sli_name,
  sli_type,
  COUNT(*) AS total_periods,
  COUNT(*) FILTER (WHERE slo_met = true) AS periods_met,
  ROUND((COUNT(*) FILTER (WHERE slo_met = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) AS compliance_percentage,
  AVG(sli_value) AS avg_sli_value,
  AVG(slo_target) AS avg_slo_target,
  MAX(period_end) AS last_measured
FROM sli_metrics
WHERE period_start > NOW() - INTERVAL '30 days'
GROUP BY sli_name, sli_type
ORDER BY compliance_percentage ASC;

-- View: Top slow queries
CREATE OR REPLACE VIEW top_slow_queries AS
SELECT
  query_hash,
  COUNT(*) AS occurrence_count,
  AVG(execution_time_ms)::INTEGER AS avg_execution_time_ms,
  MAX(execution_time_ms) AS max_execution_time_ms,
  MAX(executed_at) AS last_executed,
  (array_agg(query_text ORDER BY executed_at DESC))[1] AS sample_query
FROM slow_queries
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY query_hash
ORDER BY avg_execution_time_ms DESC
LIMIT 50;

COMMENT ON SCHEMA public IS 'Advanced Monitoring & Observability - Metrics, traces, health checks, and alerts';
