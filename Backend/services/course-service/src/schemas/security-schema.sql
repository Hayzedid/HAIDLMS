-- ============================================================================
-- SECURITY FEATURES SCHEMA
-- ============================================================================
-- 2FA/MFA, password policies, session management, and security controls

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE mfa_method AS ENUM (
  'totp',
  'sms',
  'email',
  'backup_codes'
);

CREATE TYPE session_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'suspicious'
);

CREATE TYPE security_alert_type AS ENUM (
  'suspicious_login',
  'password_change',
  'mfa_disabled',
  'unusual_activity',
  'brute_force_attempt',
  'account_locked',
  'data_export',
  'permission_escalation'
);

CREATE TYPE ip_rule_action AS ENUM (
  'allow',
  'block',
  'challenge'
);

-- ────────────────────────────────────────────────────────────────────────────
-- PASSWORD POLICIES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Password requirements
  min_length INTEGER DEFAULT 8,
  max_length INTEGER DEFAULT 128,
  require_uppercase BOOLEAN DEFAULT true,
  require_lowercase BOOLEAN DEFAULT true,
  require_numbers BOOLEAN DEFAULT true,
  require_special_chars BOOLEAN DEFAULT true,
  special_chars_list VARCHAR(50) DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',

  -- Password restrictions
  prevent_common_passwords BOOLEAN DEFAULT true,
  prevent_user_info BOOLEAN DEFAULT true, -- Prevent using name, email parts
  prevent_repeated_chars BOOLEAN DEFAULT true,
  max_repeated_chars INTEGER DEFAULT 3,

  -- Password lifecycle
  max_age_days INTEGER DEFAULT 90, -- Force password change after N days
  min_age_hours INTEGER DEFAULT 24, -- Prevent rapid password changes
  history_count INTEGER DEFAULT 5, -- Remember last N passwords

  -- Lockout policy
  max_failed_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  reset_failed_attempts_after_minutes INTEGER DEFAULT 60,

  -- Metadata
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

CREATE INDEX idx_password_policies_org ON password_policies(organization_id);

-- Insert default policy
INSERT INTO password_policies (is_default)
VALUES (true)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- PASSWORD HISTORY
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  password_hash TEXT NOT NULL,
  changed_by UUID REFERENCES users(id), -- NULL if self-changed
  change_reason VARCHAR(100), -- e.g., 'expired', 'forgot', 'admin_reset', 'user_change'

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_history_user ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- PASSWORD RESET TOKENS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  token VARCHAR(255) NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT false,

  -- Request context
  requested_ip INET,
  requested_user_agent TEXT,

  -- Usage context
  used_ip INET,
  used_user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ────────────────────────────────────────────────────────────────────────────
-- MULTI-FACTOR AUTHENTICATION
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- MFA status
  is_enabled BOOLEAN DEFAULT false,
  is_enforced BOOLEAN DEFAULT false, -- Organization-level enforcement
  primary_method mfa_method DEFAULT 'totp',

  -- TOTP settings
  totp_secret VARCHAR(255),
  totp_verified_at TIMESTAMPTZ,

  -- SMS settings
  phone_number VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,

  -- Email settings
  email_verified BOOLEAN DEFAULT false,

  -- Backup codes
  backup_codes_generated_at TIMESTAMPTZ,
  backup_codes_count INTEGER DEFAULT 0,

  -- Recovery
  recovery_email VARCHAR(255),
  recovery_email_verified BOOLEAN DEFAULT false,

  -- Metadata
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_mfa_settings_user ON mfa_settings(user_id);
CREATE INDEX idx_mfa_settings_enabled ON mfa_settings(is_enabled) WHERE is_enabled = true;

-- ────────────────────────────────────────────────────────────────────────────
-- MFA BACKUP CODES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  code_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_ip INET,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfa_backup_codes_user ON mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_backup_codes_hash ON mfa_backup_codes(code_hash);

-- ────────────────────────────────────────────────────────────────────────────
-- MFA VERIFICATION LOG
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mfa_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  method mfa_method NOT NULL,
  was_successful BOOLEAN NOT NULL,
  failure_reason VARCHAR(200),

  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfa_verifications_user ON mfa_verifications(user_id);
CREATE INDEX idx_mfa_verifications_created_at ON mfa_verifications(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- USER SESSIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token VARCHAR(255) UNIQUE,

  -- Device information
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Location
  country_code VARCHAR(2),
  city VARCHAR(100),

  -- Status
  status session_status DEFAULT 'active',
  is_current BOOLEAN DEFAULT false,

  -- Activity tracking
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  activity_count INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revoke_reason VARCHAR(200)
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);

-- ────────────────────────────────────────────────────────────────────────────
-- IP WHITELIST/BLACKLIST
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ip_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User-specific rule

  -- IP configuration
  ip_address INET,
  ip_range CIDR,
  country_code VARCHAR(2),

  -- Rule
  action ip_rule_action NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority = evaluated first

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Usage tracking
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,

  -- Temporal rules
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_rules_org ON ip_rules(organization_id);
CREATE INDEX idx_ip_rules_user ON ip_rules(user_id);
CREATE INDEX idx_ip_rules_ip_address ON ip_rules(ip_address);
CREATE INDEX idx_ip_rules_action ON ip_rules(action);
CREATE INDEX idx_ip_rules_priority ON ip_rules(priority DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- TRUSTED DEVICES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),

  ip_address INET,
  last_used_ip INET,

  is_trusted BOOLEAN DEFAULT true,
  trust_expires_at TIMESTAMPTZ,

  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_trusted ON trusted_devices(is_trusted) WHERE is_trusted = true;

-- ────────────────────────────────────────────────────────────────────────────
-- SECURITY ALERTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  alert_type security_alert_type NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,

  -- Alert status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),

  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES user_sessions(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alerts_unread ON security_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- SECURITY QUESTIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_questions_active ON security_questions(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS user_security_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES security_questions(id) ON DELETE CASCADE,

  answer_hash TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_security_answers_user ON user_security_answers(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- RATE LIMITING
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifier
  identifier_type VARCHAR(50) NOT NULL, -- 'user', 'ip', 'api_key'
  identifier_value VARCHAR(255) NOT NULL,

  -- Endpoint/action
  endpoint VARCHAR(255) NOT NULL,
  action VARCHAR(100),

  -- Rate limit configuration
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,

  -- Current state
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_request_at TIMESTAMPTZ DEFAULT NOW(),

  -- Blocking
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(identifier_type, identifier_value, endpoint)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier_type, identifier_value);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(is_blocked) WHERE is_blocked = true;

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Check if user can change password (respects min_age_hours)
CREATE OR REPLACE FUNCTION can_change_password(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_min_age_hours INTEGER;
  v_last_changed TIMESTAMPTZ;
BEGIN
  -- Get policy
  SELECT pp.min_age_hours INTO v_min_age_hours
  FROM password_policies pp
  LEFT JOIN users u ON pp.organization_id = u.organization_id
  WHERE u.id = p_user_id OR pp.is_default = true
  ORDER BY pp.organization_id NULLS LAST
  LIMIT 1;

  -- Get last password change
  SELECT created_at INTO v_last_changed
  FROM password_history
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if enough time has passed
  IF v_last_changed IS NULL THEN
    RETURN true;
  END IF;

  RETURN (NOW() - v_last_changed) >= (v_min_age_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Check if password is in history
CREATE OR REPLACE FUNCTION is_password_in_history(
  p_user_id UUID,
  p_password_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_history_count INTEGER;
BEGIN
  -- Get history count from policy
  SELECT pp.history_count INTO v_history_count
  FROM password_policies pp
  LEFT JOIN users u ON pp.organization_id = u.organization_id
  WHERE u.id = p_user_id OR pp.is_default = true
  ORDER BY pp.organization_id NULLS LAST
  LIMIT 1;

  -- Check if password exists in recent history
  RETURN EXISTS (
    SELECT 1
    FROM password_history
    WHERE user_id = p_user_id
      AND password_hash = p_password_hash
    ORDER BY created_at DESC
    LIMIT v_history_count
  );
END;
$$ LANGUAGE plpgsql;

-- Create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_user_id UUID,
  p_alert_type security_alert_type,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO security_alerts (
    user_id,
    alert_type,
    severity,
    title,
    message,
    details,
    ip_address
  ) VALUES (
    p_user_id,
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_details,
    p_ip_address
  ) RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Check IP rule
CREATE OR REPLACE FUNCTION check_ip_rule(
  p_ip_address INET,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS ip_rule_action AS $$
DECLARE
  v_action ip_rule_action;
BEGIN
  -- Check rules in priority order
  SELECT action INTO v_action
  FROM ip_rules
  WHERE is_active = true
    AND (
      ip_address = p_ip_address
      OR ip_range >>= p_ip_address
    )
    AND (user_id = p_user_id OR user_id IS NULL)
    AND (organization_id = p_organization_id OR organization_id IS NULL)
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;

  -- Update match count
  IF v_action IS NOT NULL THEN
    UPDATE ip_rules
    SET match_count = match_count + 1, last_matched_at = NOW()
    WHERE ip_address = p_ip_address OR ip_range >>= p_ip_address;
  END IF;

  RETURN COALESCE(v_action, 'allow');
END;
$$ LANGUAGE plpgsql;

-- Revoke all user sessions except current
CREATE OR REPLACE FUNCTION revoke_other_sessions(
  p_user_id UUID,
  p_current_session_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET status = 'revoked', revoked_at = NOW()
  WHERE user_id = p_user_id
    AND id != p_current_session_id
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired password reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at <= NOW() AND is_used = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- Active sessions overview
CREATE OR REPLACE VIEW active_sessions_overview AS
SELECT
  us.id,
  us.user_id,
  u.name as user_name,
  u.email as user_email,
  us.device_name,
  us.device_type,
  us.browser,
  us.os,
  us.ip_address,
  us.country_code,
  us.city,
  us.started_at,
  us.last_activity_at,
  us.expires_at,
  us.is_current,
  (us.expires_at - NOW()) as time_until_expiry
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.status = 'active'
ORDER BY us.last_activity_at DESC;

-- Security alerts summary
CREATE OR REPLACE VIEW security_alerts_summary AS
SELECT
  user_id,
  u.name as user_name,
  u.email as user_email,
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count,
  MAX(created_at) as latest_alert_at
FROM security_alerts sa
JOIN users u ON sa.user_id = u.id
WHERE sa.created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, u.name, u.email
ORDER BY unread_count DESC, critical_count DESC;

-- MFA adoption statistics
CREATE OR REPLACE VIEW mfa_adoption_stats AS
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ms.user_id) FILTER (WHERE ms.is_enabled = true) as mfa_enabled_users,
  COUNT(DISTINCT ms.user_id) FILTER (WHERE ms.is_enforced = true) as mfa_enforced_users,
  ROUND(
    100.0 * COUNT(DISTINCT ms.user_id) FILTER (WHERE ms.is_enabled = true) / NULLIF(COUNT(DISTINCT u.id), 0),
    2
  ) as adoption_percentage
FROM users u
LEFT JOIN mfa_settings ms ON u.id = ms.user_id;

-- Password policy compliance
CREATE OR REPLACE VIEW password_policy_compliance AS
SELECT
  u.id as user_id,
  u.name,
  u.email,
  ph.created_at as last_password_change,
  pp.max_age_days,
  (NOW() - ph.created_at) > (pp.max_age_days || ' days')::INTERVAL as is_expired,
  pp.max_age_days - EXTRACT(DAY FROM (NOW() - ph.created_at)) as days_until_expiry
FROM users u
LEFT JOIN password_history ph ON u.id = ph.user_id
LEFT JOIN password_policies pp ON u.organization_id = pp.organization_id OR pp.is_default = true
WHERE ph.id = (
  SELECT id FROM password_history
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY days_until_expiry ASC;
