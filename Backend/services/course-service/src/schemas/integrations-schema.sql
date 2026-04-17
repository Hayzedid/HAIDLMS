-- ============================================================================
-- ADVANCED INTEGRATIONS SCHEMA
-- ============================================================================
-- This schema manages third-party integrations including LMS, SSO, calendars,
-- video conferencing, and external APIs with health monitoring and sync management.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE integration_type AS ENUM (
  'lms',
  'sso',
  'calendar',
  'video_conferencing',
  'messaging',
  'crm',
  'payment',
  'analytics',
  'storage',
  'email',
  'webhook',
  'custom'
);

CREATE TYPE integration_provider AS ENUM (
  -- LMS
  'canvas',
  'moodle',
  'blackboard',
  'brightspace',
  'schoology',
  -- SSO
  'saml',
  'oauth2',
  'oidc',
  'google_oauth',
  'microsoft_oauth',
  'github_oauth',
  -- Calendar
  'google_calendar',
  'outlook_calendar',
  'apple_calendar',
  'ical',
  -- Video
  'zoom',
  'microsoft_teams',
  'google_meet',
  'webex',
  -- Messaging
  'slack',
  'discord',
  'telegram',
  -- Other
  'salesforce',
  'hubspot',
  'stripe',
  'paypal',
  'aws_s3',
  'sendgrid',
  'custom'
);

CREATE TYPE integration_status AS ENUM (
  'active',
  'inactive',
  'error',
  'disconnected',
  'pending',
  'suspended'
);

CREATE TYPE sync_direction AS ENUM (
  'inbound',
  'outbound',
  'bidirectional'
);

CREATE TYPE sync_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'partial',
  'cancelled'
);

CREATE TYPE webhook_event_type AS ENUM (
  'user_created',
  'user_updated',
  'user_deleted',
  'enrollment_created',
  'enrollment_completed',
  'course_created',
  'course_updated',
  'progress_updated',
  'certificate_issued',
  'payment_received',
  'assessment_submitted',
  'custom'
);

CREATE TYPE health_status AS ENUM (
  'healthy',
  'degraded',
  'unhealthy',
  'unknown'
);

-- ============================================================================
-- INTEGRATION PROVIDERS
-- ============================================================================

CREATE TABLE integration_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider Details
  name VARCHAR(255) NOT NULL,
  integration_type integration_type NOT NULL,
  provider_type integration_provider NOT NULL,

  -- Configuration
  version VARCHAR(50),
  base_url TEXT,
  documentation_url TEXT,
  icon_url TEXT,

  -- Capabilities
  supports_sso BOOLEAN DEFAULT false,
  supports_sync BOOLEAN DEFAULT false,
  supports_webhooks BOOLEAN DEFAULT false,
  supports_gradebook BOOLEAN DEFAULT false,
  sync_direction sync_direction,

  -- Requirements
  required_scopes TEXT[],
  required_credentials TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  -- Metadata
  description TEXT,
  tags TEXT[],
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_providers_type ON integration_providers(integration_type, is_active);
CREATE INDEX idx_integration_providers_provider ON integration_providers(provider_type);

-- ============================================================================
-- ORGANIZATION INTEGRATIONS
-- ============================================================================

CREATE TABLE organization_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  provider_id UUID REFERENCES integration_providers(id) ON DELETE CASCADE,

  -- Integration Details
  integration_name VARCHAR(255),
  status integration_status DEFAULT 'pending',

  -- Configuration
  config JSONB, -- provider-specific configuration
  custom_fields JSONB,

  -- Connection Details
  connected_at TIMESTAMPTZ,
  connected_by UUID,
  disconnected_at TIMESTAMPTZ,
  disconnected_by UUID,
  last_sync_at TIMESTAMPTZ,

  -- Features Enabled
  enable_sso BOOLEAN DEFAULT false,
  enable_sync BOOLEAN DEFAULT false,
  enable_webhooks BOOLEAN DEFAULT false,

  -- Auto-sync Settings
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,
  next_sync_at TIMESTAMPTZ,

  -- Error Tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,

  -- Health Check
  health_status health_status DEFAULT 'unknown',
  last_health_check_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_provider UNIQUE(organization_id, provider_id)
);

CREATE INDEX idx_org_integrations_org ON organization_integrations(organization_id, status);
CREATE INDEX idx_org_integrations_provider ON organization_integrations(provider_id);
CREATE INDEX idx_org_integrations_status ON organization_integrations(status);
CREATE INDEX idx_org_integrations_next_sync ON organization_integrations(next_sync_at)
  WHERE auto_sync_enabled = true AND status = 'active';

-- ============================================================================
-- OAUTH CREDENTIALS
-- ============================================================================

CREATE TABLE oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- OAuth Details
  provider_type integration_provider NOT NULL,

  -- Tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',

  -- Token Expiration
  expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,

  -- Scopes
  granted_scopes TEXT[],

  -- OAuth Flow Details
  auth_code TEXT,
  state VARCHAR(255),
  redirect_uri TEXT,

  -- Status
  is_valid BOOLEAN DEFAULT true,
  last_refreshed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_creds_integration ON oauth_credentials(integration_id);
CREATE INDEX idx_oauth_creds_expires ON oauth_credentials(expires_at) WHERE is_valid = true;

-- ============================================================================
-- SSO CONFIGURATIONS
-- ============================================================================

CREATE TABLE sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- SSO Type
  sso_type integration_provider NOT NULL, -- saml, oauth2, oidc

  -- SAML Settings
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_certificate TEXT,
  saml_logout_url TEXT,

  -- OAuth/OIDC Settings
  client_id TEXT,
  client_secret TEXT,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  userinfo_endpoint TEXT,
  jwks_uri TEXT,

  -- Attribute Mapping
  attribute_mapping JSONB, -- {email: 'mail', firstName: 'givenName', ...}

  -- Settings
  auto_provision_users BOOLEAN DEFAULT true,
  default_role VARCHAR(50),
  allowed_domains TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_sso UNIQUE(organization_id, integration_id)
);

CREATE INDEX idx_sso_config_org ON sso_configurations(organization_id, is_active);
CREATE INDEX idx_sso_config_integration ON sso_configurations(integration_id);

-- ============================================================================
-- LMS INTEGRATIONS (LTI)
-- ============================================================================

CREATE TABLE lms_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- LTI Configuration
  lti_version VARCHAR(20), -- 1.1, 1.3
  consumer_key TEXT,
  shared_secret TEXT,

  -- LTI 1.3 Settings
  deployment_id TEXT,
  platform_id TEXT,
  client_id TEXT,
  auth_login_url TEXT,
  auth_token_url TEXT,
  key_set_url TEXT,

  -- Deep Linking
  supports_deep_linking BOOLEAN DEFAULT false,
  deep_linking_url TEXT,

  -- Grade Passback
  supports_grade_passback BOOLEAN DEFAULT false,
  outcomes_service_url TEXT,

  -- Content Items
  supports_content_items BOOLEAN DEFAULT false,

  -- Settings
  custom_parameters JSONB,
  launch_presentation_target VARCHAR(50), -- iframe, window, popup

  -- Sync Configuration
  sync_courses BOOLEAN DEFAULT true,
  sync_enrollments BOOLEAN DEFAULT true,
  sync_grades BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lms_integrations_integration ON lms_integrations(integration_id);

-- ============================================================================
-- CALENDAR INTEGRATIONS
-- ============================================================================

CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Calendar Details
  calendar_id TEXT NOT NULL,
  calendar_name VARCHAR(255),
  timezone VARCHAR(100),

  -- Settings
  sync_enabled BOOLEAN DEFAULT true,
  auto_create_events BOOLEAN DEFAULT true,
  event_reminder_minutes INTEGER DEFAULT 15,

  -- Sync Preferences
  sync_live_classes BOOLEAN DEFAULT true,
  sync_deadlines BOOLEAN DEFAULT true,
  sync_office_hours BOOLEAN DEFAULT false,

  -- OAuth
  oauth_credential_id UUID REFERENCES oauth_credentials(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_calendar UNIQUE(user_id, integration_id, calendar_id)
);

CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id, is_active);
CREATE INDEX idx_calendar_integrations_integration ON calendar_integrations(integration_id);

-- ============================================================================
-- VIDEO CONFERENCING INTEGRATIONS
-- ============================================================================

CREATE TABLE video_conference_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Provider Settings
  api_key TEXT,
  api_secret TEXT,

  -- Meeting Defaults
  default_duration_minutes INTEGER DEFAULT 60,
  default_settings JSONB, -- {waiting_room: true, recording: false, ...}

  -- Features
  supports_recording BOOLEAN DEFAULT true,
  supports_breakout_rooms BOOLEAN DEFAULT false,
  supports_polling BOOLEAN DEFAULT false,
  max_participants INTEGER,

  -- Webhooks
  webhook_secret TEXT,
  webhook_events TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_conf_integration ON video_conference_integrations(integration_id);

-- ============================================================================
-- SYNC JOBS
-- ============================================================================

CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Job Details
  job_type VARCHAR(100) NOT NULL, -- full_sync, incremental, user_sync, course_sync
  direction sync_direction DEFAULT 'bidirectional',
  status sync_status DEFAULT 'pending',

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Progress
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,

  -- Results
  result_summary JSONB,
  error_details JSONB,

  -- Configuration
  sync_config JSONB,
  filters JSONB,

  -- Triggered By
  triggered_by VARCHAR(50), -- schedule, manual, webhook, auto
  triggered_by_user_id UUID,

  -- Next Job
  next_job_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_integration ON sync_jobs(integration_id, created_at DESC);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_scheduled ON sync_jobs(scheduled_at) WHERE status = 'pending';

-- ============================================================================
-- SYNC ITEMS
-- ============================================================================

CREATE TABLE sync_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sync_jobs(id) ON DELETE CASCADE,

  -- Item Details
  entity_type VARCHAR(50) NOT NULL, -- user, course, enrollment, grade
  entity_id UUID,
  external_id TEXT,

  -- Status
  status sync_status DEFAULT 'pending',

  -- Processing
  attempts INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,

  -- Data
  source_data JSONB,
  transformed_data JSONB,

  -- Result
  result VARCHAR(50), -- created, updated, skipped, failed
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_items_job ON sync_items(job_id, status);
CREATE INDEX idx_sync_items_entity ON sync_items(entity_type, entity_id);
CREATE INDEX idx_sync_items_external ON sync_items(external_id);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Webhook Configuration
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,

  -- Events
  events webhook_event_type[],

  -- Settings
  is_active BOOLEAN DEFAULT true,
  verify_ssl BOOLEAN DEFAULT true,
  timeout_seconds INTEGER DEFAULT 30,
  retry_count INTEGER DEFAULT 3,

  -- Headers
  custom_headers JSONB,

  -- Filters
  filters JSONB, -- {course_id: [...], user_role: [...]}

  -- Status
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  -- Health
  health_status health_status DEFAULT 'unknown',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_integration ON webhooks(integration_id, is_active);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- ============================================================================
-- WEBHOOK DELIVERIES
-- ============================================================================

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Event Details
  event_type webhook_event_type NOT NULL,
  event_id UUID,

  -- Request
  request_url TEXT NOT NULL,
  request_method VARCHAR(10) DEFAULT 'POST',
  request_headers JSONB,
  request_body JSONB,

  -- Response
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Status
  status VARCHAR(50), -- pending, sent, failed, retrying
  attempts INTEGER DEFAULT 0,

  -- Timing
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Error
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type, event_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at)
  WHERE status = 'retrying';

-- ============================================================================
-- INTEGRATION EVENTS
-- ============================================================================

CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50), -- auth, sync, webhook, api_call, error
  severity VARCHAR(20), -- info, warning, error, critical

  -- Description
  title VARCHAR(255),
  message TEXT,

  -- Related Entities
  related_entity_type VARCHAR(50),
  related_entity_id UUID,

  -- Data
  event_data JSONB,
  error_details JSONB,

  -- Context
  user_id UUID,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_events_integration ON integration_events(integration_id, created_at DESC);
CREATE INDEX idx_integration_events_category ON integration_events(event_category, severity);
CREATE INDEX idx_integration_events_type ON integration_events(event_type);

-- ============================================================================
-- INTEGRATION HEALTH CHECKS
-- ============================================================================

CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Check Details
  check_type VARCHAR(50), -- connectivity, auth, api, sync
  status health_status NOT NULL,

  -- Metrics
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4),
  success_rate DECIMAL(5,4),

  -- Results
  checks_passed INTEGER,
  checks_failed INTEGER,
  check_details JSONB,

  -- Issues
  issues TEXT[],
  warnings TEXT[],

  -- Timing
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  next_check_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_checks_integration ON integration_health_checks(integration_id, checked_at DESC);
CREATE INDEX idx_health_checks_status ON integration_health_checks(status);
CREATE INDEX idx_health_checks_next ON integration_health_checks(next_check_at);

-- ============================================================================
-- API RATE LIMITS
-- ============================================================================

CREATE TABLE integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES organization_integrations(id) ON DELETE CASCADE,

  -- Rate Limit Configuration
  requests_per_minute INTEGER,
  requests_per_hour INTEGER,
  requests_per_day INTEGER,

  -- Current Usage
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,

  -- Reset Times
  minute_resets_at TIMESTAMPTZ,
  hour_resets_at TIMESTAMPTZ,
  day_resets_at TIMESTAMPTZ,

  -- Throttling
  is_throttled BOOLEAN DEFAULT false,
  throttled_until TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_integration ON integration_rate_limits(integration_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active Integrations Overview
CREATE VIEW active_integrations_overview AS
SELECT
  oi.id,
  oi.organization_id,
  oi.integration_name,
  ip.name as provider_name,
  ip.integration_type,
  ip.provider_type,
  oi.status,
  oi.health_status,
  oi.connected_at,
  oi.last_sync_at,
  oi.error_count,
  COUNT(DISTINCT sj.id) as total_sync_jobs,
  COUNT(DISTINCT w.id) as total_webhooks
FROM organization_integrations oi
JOIN integration_providers ip ON ip.id = oi.provider_id
LEFT JOIN sync_jobs sj ON sj.integration_id = oi.id
LEFT JOIN webhooks w ON w.integration_id = oi.id AND w.is_active = true
WHERE oi.status = 'active'
GROUP BY oi.id, oi.organization_id, oi.integration_name, ip.name,
         ip.integration_type, ip.provider_type, oi.status, oi.health_status,
         oi.connected_at, oi.last_sync_at, oi.error_count;

-- Integration Health Summary
CREATE VIEW integration_health_summary AS
SELECT
  oi.id as integration_id,
  oi.organization_id,
  oi.integration_name,
  oi.health_status,
  ihc.status as latest_check_status,
  ihc.checked_at as last_checked_at,
  ihc.response_time_ms,
  ihc.error_rate,
  ihc.success_rate,
  ihc.issues,
  ihc.warnings
FROM organization_integrations oi
LEFT JOIN LATERAL (
  SELECT *
  FROM integration_health_checks
  WHERE integration_id = oi.id
  ORDER BY checked_at DESC
  LIMIT 1
) ihc ON true
WHERE oi.status = 'active';

-- Sync Job Statistics
CREATE VIEW sync_job_statistics AS
SELECT
  sj.integration_id,
  sj.job_type,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN sj.status = 'completed' THEN 1 END) as completed_jobs,
  COUNT(CASE WHEN sj.status = 'failed' THEN 1 END) as failed_jobs,
  AVG(sj.duration_seconds) as avg_duration_seconds,
  SUM(sj.processed_items) as total_items_processed,
  SUM(sj.success_count) as total_successes,
  SUM(sj.error_count) as total_errors
FROM sync_jobs sj
WHERE sj.created_at > NOW() - INTERVAL '30 days'
GROUP BY sj.integration_id, sj.job_type;

-- Webhook Performance
CREATE VIEW webhook_performance AS
SELECT
  w.id as webhook_id,
  w.name,
  w.integration_id,
  w.health_status,
  COUNT(wd.id) as total_deliveries,
  COUNT(CASE WHEN wd.response_status >= 200 AND wd.response_status < 300 THEN 1 END) as successful_deliveries,
  COUNT(CASE WHEN wd.response_status >= 400 THEN 1 END) as failed_deliveries,
  AVG(wd.response_time_ms) as avg_response_time_ms,
  MAX(wd.sent_at) as last_delivery_at
FROM webhooks w
LEFT JOIN webhook_deliveries wd ON wd.webhook_id = w.id
  AND wd.created_at > NOW() - INTERVAL '7 days'
WHERE w.is_active = true
GROUP BY w.id, w.name, w.integration_id, w.health_status;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if integration is healthy
CREATE OR REPLACE FUNCTION is_integration_healthy(p_integration_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_health_status health_status;
  v_error_count INTEGER;
BEGIN
  SELECT health_status, error_count
  INTO v_health_status, v_error_count
  FROM organization_integrations
  WHERE id = p_integration_id;

  IF v_health_status = 'healthy' AND v_error_count < 5 THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to record integration error
CREATE OR REPLACE FUNCTION record_integration_error(
  p_integration_id UUID,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE organization_integrations
  SET error_count = error_count + 1,
      last_error = p_error_message,
      last_error_at = NOW(),
      health_status = CASE
        WHEN error_count + 1 >= 10 THEN 'unhealthy'::health_status
        WHEN error_count + 1 >= 5 THEN 'degraded'::health_status
        ELSE health_status
      END
  WHERE id = p_integration_id;

  -- Log the event
  INSERT INTO integration_events (
    integration_id,
    event_type,
    event_category,
    severity,
    message,
    error_details
  ) VALUES (
    p_integration_id,
    'integration_error',
    'error',
    'error',
    p_error_message,
    p_error_details
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reset error count
CREATE OR REPLACE FUNCTION reset_integration_errors(p_integration_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE organization_integrations
  SET error_count = 0,
      last_error = NULL,
      last_error_at = NULL,
      health_status = 'healthy'
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule next sync
CREATE OR REPLACE FUNCTION schedule_next_sync(p_integration_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_interval_minutes INTEGER;
  v_next_sync TIMESTAMPTZ;
BEGIN
  SELECT sync_interval_minutes INTO v_interval_minutes
  FROM organization_integrations
  WHERE id = p_integration_id;

  v_next_sync := NOW() + (v_interval_minutes || ' minutes')::INTERVAL;

  UPDATE organization_integrations
  SET next_sync_at = v_next_sync
  WHERE id = p_integration_id;

  RETURN v_next_sync;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update organization_integrations timestamp
CREATE OR REPLACE FUNCTION update_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_integrations_update_timestamp
  BEFORE UPDATE ON organization_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_timestamp();

-- Record sync completion
CREATE OR REPLACE FUNCTION record_sync_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE organization_integrations
    SET last_sync_at = NOW(),
        error_count = 0
    WHERE id = NEW.integration_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_jobs_record_completion
  AFTER UPDATE ON sync_jobs
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION record_sync_completion();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE integration_providers IS 'Available integration providers and their capabilities';
COMMENT ON TABLE organization_integrations IS 'Active integrations for organizations';
COMMENT ON TABLE oauth_credentials IS 'OAuth tokens for authenticated integrations';
COMMENT ON TABLE sso_configurations IS 'SSO provider configurations';
COMMENT ON TABLE lms_integrations IS 'LMS/LTI integration settings';
COMMENT ON TABLE calendar_integrations IS 'User calendar integrations';
COMMENT ON TABLE video_conference_integrations IS 'Video conferencing provider settings';
COMMENT ON TABLE sync_jobs IS 'Data synchronization jobs';
COMMENT ON TABLE webhooks IS 'Outbound webhook configurations';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and results';
COMMENT ON TABLE integration_events IS 'Integration activity and error log';
COMMENT ON TABLE integration_health_checks IS 'Integration health monitoring';
