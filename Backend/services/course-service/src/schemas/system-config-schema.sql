-- ============================================================================
-- SYSTEM CONFIGURATION SCHEMA
-- ============================================================================
-- This schema manages system-wide configuration including feature flags,
-- environment settings, maintenance mode, templates, and branding.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE config_scope AS ENUM (
  'global',
  'organization',
  'user'
);

CREATE TYPE config_data_type AS ENUM (
  'string',
  'number',
  'boolean',
  'json',
  'array'
);

CREATE TYPE feature_status AS ENUM (
  'enabled',
  'disabled',
  'beta',
  'deprecated',
  'testing'
);

CREATE TYPE rollout_strategy AS ENUM (
  'all',
  'percentage',
  'whitelist',
  'organization',
  'user_attribute'
);

CREATE TYPE template_type AS ENUM (
  'email',
  'sms',
  'push_notification',
  'in_app_notification',
  'pdf',
  'certificate'
);

CREATE TYPE template_format AS ENUM (
  'html',
  'text',
  'markdown',
  'handlebars',
  'liquid'
);

CREATE TYPE maintenance_type AS ENUM (
  'full',
  'partial',
  'read_only',
  'scheduled'
);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting Details
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  data_type config_data_type DEFAULT 'string',

  -- Scope
  scope config_scope DEFAULT 'global',
  scope_id UUID, -- organization_id or user_id

  -- Metadata
  category VARCHAR(100),
  label VARCHAR(255),
  description TEXT,
  default_value TEXT,

  -- Validation
  is_required BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  validation_rules JSONB,
  allowed_values TEXT[],

  -- Override
  can_override BOOLEAN DEFAULT true,
  is_overridden BOOLEAN DEFAULT false,
  overridden_from UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_scope ON system_settings(scope, scope_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Feature Details
  name VARCHAR(255) NOT NULL UNIQUE,
  key VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status feature_status DEFAULT 'disabled',

  -- Rollout Configuration
  rollout_strategy rollout_strategy DEFAULT 'all',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Target Criteria
  target_organizations UUID[],
  target_users UUID[],
  target_user_attributes JSONB, -- {role: ['admin', 'instructor'], plan: 'premium'}

  -- Timing
  enabled_from TIMESTAMPTZ,
  enabled_until TIMESTAMPTZ,

  -- Dependencies
  depends_on UUID[], -- other feature flag IDs
  conflicts_with UUID[],

  -- Metadata
  tags TEXT[],
  owner_team VARCHAR(100),
  documentation_url TEXT,

  -- Tracking
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,

  -- Version Control
  version INTEGER DEFAULT 1,
  previous_version_id UUID,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_status ON feature_flags(status);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_rollout ON feature_flags(rollout_strategy, rollout_percentage);

-- ============================================================================
-- FEATURE FLAG OVERRIDES
-- ============================================================================

CREATE TABLE feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Override Target
  override_type VARCHAR(50) NOT NULL, -- organization, user, session
  target_id UUID NOT NULL,

  -- Override Value
  is_enabled BOOLEAN NOT NULL,

  -- Metadata
  reason TEXT,
  notes TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_feature_override UNIQUE(feature_flag_id, override_type, target_id)
);

CREATE INDEX idx_feature_overrides_flag ON feature_flag_overrides(feature_flag_id);
CREATE INDEX idx_feature_overrides_target ON feature_flag_overrides(override_type, target_id);

-- ============================================================================
-- FEATURE FLAG USAGE
-- ============================================================================

CREATE TABLE feature_flag_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Usage Details
  user_id UUID,
  organization_id UUID,
  session_id UUID,

  -- Result
  was_enabled BOOLEAN NOT NULL,
  evaluation_reason VARCHAR(100), -- rollout_percentage, whitelist, override, default

  -- Context
  context JSONB,
  user_agent TEXT,
  ip_address INET,

  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_usage_flag ON feature_flag_usage(feature_flag_id, checked_at DESC);
CREATE INDEX idx_feature_usage_user ON feature_flag_usage(user_id);
CREATE INDEX idx_feature_usage_org ON feature_flag_usage(organization_id);

-- ============================================================================
-- ENVIRONMENT CONFIGURATIONS
-- ============================================================================

CREATE TABLE environment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Environment
  environment VARCHAR(50) NOT NULL, -- production, staging, development

  -- Configuration
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT,
  data_type config_data_type DEFAULT 'string',

  -- Metadata
  category VARCHAR(100),
  description TEXT,
  is_secret BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_env_config UNIQUE(environment, config_key)
);

CREATE INDEX idx_env_configs_env ON environment_configs(environment, is_active);
CREATE INDEX idx_env_configs_key ON environment_configs(config_key);

-- ============================================================================
-- MAINTENANCE MODE
-- ============================================================================

CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Maintenance Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_type maintenance_type DEFAULT 'full',

  -- Timing
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,

  -- Affected Services
  affected_services TEXT[],
  allowed_ips INET[],

  -- Notifications
  notify_users BOOLEAN DEFAULT true,
  notification_message TEXT,
  display_banner BOOLEAN DEFAULT true,
  banner_message TEXT,

  -- Bypass
  bypass_tokens TEXT[],

  -- Metadata
  created_by UUID,
  cancelled_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_schedule ON maintenance_windows(scheduled_start, scheduled_end);
CREATE INDEX idx_maintenance_active ON maintenance_windows(is_active) WHERE is_active = true;

-- ============================================================================
-- RATE LIMIT CONFIGURATIONS
-- ============================================================================

CREATE TABLE rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule Details
  name VARCHAR(255) NOT NULL,
  endpoint_pattern TEXT NOT NULL,

  -- Limits
  requests_per_second INTEGER,
  requests_per_minute INTEGER,
  requests_per_hour INTEGER,
  requests_per_day INTEGER,

  -- Scope
  scope config_scope DEFAULT 'global',
  scope_id UUID,

  -- Bypass
  bypass_roles TEXT[],
  bypass_ips INET[],
  whitelisted_users UUID[],

  -- Response
  block_duration_seconds INTEGER DEFAULT 300,
  custom_error_message TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_endpoint ON rate_limit_configs(endpoint_pattern);
CREATE INDEX idx_rate_limits_scope ON rate_limit_configs(scope, scope_id);
CREATE INDEX idx_rate_limits_priority ON rate_limit_configs(priority DESC);

-- ============================================================================
-- TEMPLATES
-- ============================================================================

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Details
  name VARCHAR(255) NOT NULL,
  template_type template_type NOT NULL,
  template_format template_format DEFAULT 'html',

  -- Content
  subject TEXT, -- for email templates
  body TEXT NOT NULL,

  -- Localization
  locale VARCHAR(10) DEFAULT 'en',

  -- Variables
  available_variables TEXT[],
  sample_data JSONB,

  -- Styling
  styles JSONB,
  layout_id UUID,

  -- Version
  version INTEGER DEFAULT 1,
  is_default BOOLEAN DEFAULT false,
  previous_version_id UUID,

  -- Scope
  scope config_scope DEFAULT 'global',
  scope_id UUID,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,

  -- Testing
  test_mode BOOLEAN DEFAULT false,

  -- Metadata
  tags TEXT[],
  notes TEXT,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_type ON templates(template_type, is_active);
CREATE INDEX idx_templates_scope ON templates(scope, scope_id);
CREATE INDEX idx_templates_locale ON templates(locale);
CREATE INDEX idx_templates_default ON templates(template_type, is_default) WHERE is_default = true;

-- ============================================================================
-- BRANDING CONFIGURATIONS
-- ============================================================================

CREATE TABLE branding_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,

  -- Brand Identity
  brand_name VARCHAR(255),
  logo_url TEXT,
  favicon_url TEXT,

  -- Colors
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  text_color VARCHAR(7),

  -- Typography
  font_family VARCHAR(255),
  heading_font VARCHAR(255),
  font_url TEXT,

  -- Custom CSS
  custom_css TEXT,
  custom_js TEXT,

  -- Email Branding
  email_header_image TEXT,
  email_footer_text TEXT,

  -- Domain
  custom_domain VARCHAR(255),
  subdomain VARCHAR(255),

  -- Social Media
  social_links JSONB,

  -- Legal
  terms_url TEXT,
  privacy_url TEXT,
  support_email VARCHAR(255),
  support_phone VARCHAR(50),

  -- White Labeling
  hide_powered_by BOOLEAN DEFAULT false,
  custom_footer TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_branding UNIQUE(organization_id)
);

CREATE INDEX idx_branding_org ON branding_configs(organization_id);
CREATE INDEX idx_branding_subdomain ON branding_configs(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_branding_domain ON branding_configs(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================================================
-- CONFIGURATION HISTORY
-- ============================================================================

CREATE TABLE config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  config_type VARCHAR(50) NOT NULL, -- system_setting, feature_flag, template, etc.
  config_id UUID NOT NULL,

  -- Change Details
  action VARCHAR(20) NOT NULL, -- created, updated, deleted
  field_name VARCHAR(255),
  old_value TEXT,
  new_value TEXT,

  -- Change Context
  changed_by UUID,
  change_reason TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_history_config ON config_history(config_type, config_id, created_at DESC);
CREATE INDEX idx_config_history_user ON config_history(changed_by);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active Feature Flags Summary
CREATE VIEW active_feature_flags AS
SELECT
  ff.id,
  ff.name,
  ff.key,
  ff.status,
  ff.rollout_strategy,
  ff.rollout_percentage,
  COUNT(DISTINCT ffu.user_id) as unique_users,
  COUNT(DISTINCT ffu.organization_id) as unique_organizations,
  SUM(CASE WHEN ffu.was_enabled THEN 1 ELSE 0 END) as enabled_count,
  COUNT(ffu.id) as total_checks
FROM feature_flags ff
LEFT JOIN feature_flag_usage ffu ON ffu.feature_flag_id = ff.id
  AND ffu.checked_at > NOW() - INTERVAL '7 days'
WHERE ff.status IN ('enabled', 'beta', 'testing')
GROUP BY ff.id, ff.name, ff.key, ff.status, ff.rollout_strategy, ff.rollout_percentage;

-- System Settings Overview
CREATE VIEW system_settings_overview AS
SELECT
  category,
  scope,
  COUNT(*) as setting_count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count,
  COUNT(CASE WHEN is_sensitive THEN 1 END) as sensitive_count,
  COUNT(CASE WHEN is_overridden THEN 1 END) as overridden_count
FROM system_settings
GROUP BY category, scope;

-- Template Statistics
CREATE VIEW template_statistics AS
SELECT
  template_type,
  locale,
  COUNT(*) as total_templates,
  COUNT(CASE WHEN is_active THEN 1 END) as active_templates,
  COUNT(CASE WHEN is_default THEN 1 END) as default_templates,
  COUNT(CASE WHEN is_approved THEN 1 END) as approved_templates
FROM templates
GROUP BY template_type, locale;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if feature is enabled for user
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_feature_key VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_override feature_flag_overrides%ROWTYPE;
  v_random INTEGER;
BEGIN
  -- Get feature flag
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE key = p_feature_key
    AND status IN ('enabled', 'beta', 'testing');

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check timing
  IF v_flag.enabled_from IS NOT NULL AND NOW() < v_flag.enabled_from THEN
    RETURN false;
  END IF;

  IF v_flag.enabled_until IS NOT NULL AND NOW() > v_flag.enabled_until THEN
    RETURN false;
  END IF;

  -- Check user override
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_override
    FROM feature_flag_overrides
    WHERE feature_flag_id = v_flag.id
      AND override_type = 'user'
      AND target_id = p_user_id
      AND (expires_at IS NULL OR expires_at > NOW());

    IF FOUND THEN
      RETURN v_override.is_enabled;
    END IF;
  END IF;

  -- Check organization override
  IF p_organization_id IS NOT NULL THEN
    SELECT * INTO v_override
    FROM feature_flag_overrides
    WHERE feature_flag_id = v_flag.id
      AND override_type = 'organization'
      AND target_id = p_organization_id
      AND (expires_at IS NULL OR expires_at > NOW());

    IF FOUND THEN
      RETURN v_override.is_enabled;
    END IF;
  END IF;

  -- Check rollout strategy
  CASE v_flag.rollout_strategy
    WHEN 'all' THEN
      RETURN true;

    WHEN 'percentage' THEN
      -- Use user_id for consistent hashing
      IF p_user_id IS NOT NULL THEN
        v_random := (hashtext(p_user_id::TEXT) % 100);
        RETURN v_random < v_flag.rollout_percentage;
      END IF;
      RETURN false;

    WHEN 'whitelist' THEN
      IF p_organization_id = ANY(v_flag.target_organizations) THEN
        RETURN true;
      END IF;

      IF p_user_id = ANY(v_flag.target_users) THEN
        RETURN true;
      END IF;

      RETURN false;

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get system setting value
CREATE OR REPLACE FUNCTION get_setting_value(
  p_key VARCHAR,
  p_scope config_scope DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM system_settings
  WHERE key = p_key
    AND scope = p_scope
    AND (p_scope_id IS NULL OR scope_id = p_scope_id)
    AND is_active = true
  ORDER BY scope DESC, created_at DESC
  LIMIT 1;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql;

-- Function to check if system is in maintenance mode
CREATE OR REPLACE FUNCTION is_maintenance_mode() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM maintenance_windows
    WHERE is_active = true
      AND NOW() BETWEEN scheduled_start AND scheduled_end
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_update_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER feature_flags_update_timestamp
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER templates_update_timestamp
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

-- Record configuration history
CREATE OR REPLACE FUNCTION record_config_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO config_history (config_type, config_id, action, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'updated', NEW.updated_by);
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO config_history (config_type, config_id, action, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'created', NEW.created_by);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_history
  AFTER INSERT OR UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION record_config_history();

CREATE TRIGGER feature_flags_history
  AFTER INSERT OR UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION record_config_history();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout and A/B testing';
COMMENT ON TABLE feature_flag_overrides IS 'User/organization specific feature flag overrides';
COMMENT ON TABLE environment_configs IS 'Environment-specific configurations';
COMMENT ON TABLE maintenance_windows IS 'Scheduled maintenance windows';
COMMENT ON TABLE rate_limit_configs IS 'API rate limiting configurations';
COMMENT ON TABLE templates IS 'Email, SMS, and notification templates';
COMMENT ON TABLE branding_configs IS 'Organization branding and white-labeling';
COMMENT ON TABLE config_history IS 'Audit trail for configuration changes';
