-- Advanced Security & Authentication System Schema
-- 2FA/MFA, SSO, passwordless auth, session management, device tracking

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE mfa_method AS ENUM ('totp', 'sms', 'email', 'backup_codes', 'hardware_key');
CREATE TYPE sso_provider AS ENUM ('google', 'microsoft', 'okta', 'auth0', 'saml', 'custom');
CREATE TYPE auth_method AS ENUM ('password', 'passwordless', 'sso', 'magic_link', 'biometric');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked', 'logged_out');
CREATE TYPE security_event_type AS ENUM (
  'login_success', 'login_failed', 'logout', 'password_change',
  'mfa_enabled', 'mfa_disabled', 'suspicious_activity',
  'account_locked', 'account_unlocked', 'password_reset'
);

-- ========================================
-- 2. MFA CONFIGURATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS mfa_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- MFA Status
  is_enabled BOOLEAN DEFAULT false,
  is_enforced BOOLEAN DEFAULT false,

  -- Primary Method
  primary_method mfa_method,

  -- Backup Methods
  backup_methods mfa_method[],

  -- TOTP Settings
  totp_secret VARCHAR(255), -- Encrypted
  totp_verified BOOLEAN DEFAULT false,

  -- Phone for SMS
  phone_number VARCHAR(20), -- Encrypted
  phone_verified BOOLEAN DEFAULT false,

  -- Email for codes
  email_verified BOOLEAN DEFAULT false,

  -- Backup Codes
  backup_codes_hash TEXT[], -- Hashed backup codes
  backup_codes_used INTEGER DEFAULT 0,

  -- Recovery
  recovery_email VARCHAR(255), -- Encrypted

  -- Last Used
  last_used_method mfa_method,
  last_used_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mfa_user ON mfa_configurations(user_id);
CREATE INDEX idx_mfa_enabled ON mfa_configurations(is_enabled);

-- ========================================
-- 3. SSO CONFIGURATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Configuration Identity
  config_name VARCHAR(255) NOT NULL UNIQUE,
  provider sso_provider NOT NULL,

  -- Provider Details
  client_id VARCHAR(500) NOT NULL, -- Encrypted
  client_secret VARCHAR(500), -- Encrypted
  issuer_url VARCHAR(1000),
  authorization_endpoint VARCHAR(1000),
  token_endpoint VARCHAR(1000),
  userinfo_endpoint VARCHAR(1000),

  -- SAML Specific
  saml_entity_id VARCHAR(500),
  saml_sso_url VARCHAR(1000),
  saml_certificate TEXT,

  -- Mapping
  attribute_mapping JSONB, -- Map SSO attributes to user fields

  -- Settings
  is_enabled BOOLEAN DEFAULT true,
  auto_provision BOOLEAN DEFAULT false, -- Auto-create users
  default_role VARCHAR(50) DEFAULT 'student',

  -- Domain Restrictions
  allowed_domains TEXT[],

  -- Statistics
  total_logins INTEGER DEFAULT 0,
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sso_configs_name ON sso_configurations(config_name);
CREATE INDEX idx_sso_configs_provider ON sso_configurations(provider);
CREATE INDEX idx_sso_configs_enabled ON sso_configurations(is_enabled);

-- ========================================
-- 4. SSO IDENTITIES
-- ========================================

CREATE TABLE IF NOT EXISTS sso_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Link
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- SSO Provider
  sso_config_id UUID NOT NULL REFERENCES sso_configurations(id) ON DELETE CASCADE,
  provider sso_provider NOT NULL,

  -- Provider Identity
  provider_user_id VARCHAR(500) NOT NULL,
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),

  -- Tokens
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  id_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP,

  -- Profile Data
  provider_profile JSONB,

  -- Status
  is_linked BOOLEAN DEFAULT true,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_sso_identity UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_sso_identities_user ON sso_identities(user_id);
CREATE INDEX idx_sso_identities_provider ON sso_identities(provider, provider_user_id);
CREATE INDEX idx_sso_identities_config ON sso_identities(sso_config_id);

-- ========================================
-- 5. PASSWORDLESS TOKENS
-- ========================================

CREATE TABLE IF NOT EXISTS passwordless_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Token
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  token_type VARCHAR(50) DEFAULT 'magic_link', -- 'magic_link', 'email_code', 'sms_code'

  -- Expiration
  expires_at TIMESTAMP NOT NULL,

  -- Usage
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_passwordless_token ON passwordless_tokens(token_hash);
CREATE INDEX idx_passwordless_email ON passwordless_tokens(email);
CREATE INDEX idx_passwordless_expires ON passwordless_tokens(expires_at);

-- ========================================
-- 6. USER SESSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session Token
  session_token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255) UNIQUE,

  -- Authentication Method
  auth_method auth_method NOT NULL,

  -- Device Information
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  os_name VARCHAR(100),
  os_version VARCHAR(50),
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),

  -- Location
  ip_address VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  user_agent TEXT,

  -- Status
  status session_status DEFAULT 'active',

  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  logged_out_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_reason TEXT
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token_hash);
CREATE INDEX idx_sessions_refresh ON user_sessions(refresh_token_hash);
CREATE INDEX idx_sessions_status ON user_sessions(status);
CREATE INDEX idx_sessions_device ON user_sessions(device_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ========================================
-- 7. TRUSTED DEVICES
-- ========================================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device Identity
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),

  -- Trust Status
  is_trusted BOOLEAN DEFAULT true,
  trust_expires_at TIMESTAMP,

  -- Location
  last_ip_address VARCHAR(45),
  last_country VARCHAR(100),
  last_city VARCHAR(100),

  -- Usage
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_device_user UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_trusted ON trusted_devices(is_trusted);

-- ========================================
-- 8. SECURITY EVENTS
-- ========================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),

  -- Event
  event_type security_event_type NOT NULL,
  event_description TEXT,

  -- Result
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,

  -- Location
  country VARCHAR(100),
  city VARCHAR(100),

  -- Additional Data
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_ip ON security_events(ip_address);

-- ========================================
-- 9. ACCOUNT SECURITY SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS account_security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Password Policy
  password_last_changed_at TIMESTAMP,
  password_expires_at TIMESTAMP,
  password_history_count INTEGER DEFAULT 5,
  password_history TEXT[], -- Hashed old passwords

  -- Login Security
  max_login_attempts INTEGER DEFAULT 5,
  login_attempts INTEGER DEFAULT 0,
  last_failed_login_at TIMESTAMP,
  account_locked_until TIMESTAMP,

  -- Session Security
  max_concurrent_sessions INTEGER DEFAULT 3,
  session_timeout_minutes INTEGER DEFAULT 60,
  require_mfa BOOLEAN DEFAULT false,

  -- Notifications
  notify_new_device BOOLEAN DEFAULT true,
  notify_password_change BOOLEAN DEFAULT true,
  notify_suspicious_activity BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_settings_user ON account_security_settings(user_id);
CREATE INDEX idx_security_settings_locked ON account_security_settings(account_locked_until);

-- ========================================
-- 10. API KEYS
-- ========================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Key Details
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification

  -- Permissions
  scopes TEXT[], -- API permissions
  allowed_ips TEXT[], -- IP whitelist

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,

  -- Usage
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_reason TEXT
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Record security event
CREATE OR REPLACE FUNCTION record_security_event(
  p_user_id UUID,
  p_event_type security_event_type,
  p_success BOOLEAN DEFAULT true,
  p_ip_address VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    user_id, event_type, success, ip_address, metadata
  ) VALUES (
    p_user_id, p_event_type, p_success, p_ip_address, p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check account lockout
CREATE OR REPLACE FUNCTION check_account_lockout(p_user_id UUID)
RETURNS TABLE(
  is_locked BOOLEAN,
  locked_until TIMESTAMP,
  attempts_remaining INTEGER
) AS $$
DECLARE
  v_settings RECORD;
BEGIN
  SELECT * INTO v_settings
  FROM account_security_settings
  WHERE user_id = p_user_id;

  IF v_settings IS NULL THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMP, 5;
    RETURN;
  END IF;

  IF v_settings.account_locked_until IS NOT NULL AND v_settings.account_locked_until > NOW() THEN
    RETURN QUERY SELECT
      true,
      v_settings.account_locked_until,
      0;
  ELSE
    RETURN QUERY SELECT
      false,
      NULL::TIMESTAMP,
      GREATEST(0, v_settings.max_login_attempts - v_settings.login_attempts);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Record failed login
CREATE OR REPLACE FUNCTION record_failed_login(
  p_user_id UUID,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_settings RECORD;
  v_new_attempts INTEGER;
BEGIN
  -- Get or create settings
  INSERT INTO account_security_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Increment attempts
  UPDATE account_security_settings
  SET
    login_attempts = login_attempts + 1,
    last_failed_login_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_settings;

  -- Lock account if max attempts reached
  IF v_settings.login_attempts >= v_settings.max_login_attempts THEN
    UPDATE account_security_settings
    SET account_locked_until = NOW() + INTERVAL '30 minutes'
    WHERE user_id = p_user_id;
  END IF;

  -- Record security event
  PERFORM record_security_event(
    p_user_id,
    'login_failed',
    false,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Record successful login
CREATE OR REPLACE FUNCTION record_successful_login(
  p_user_id UUID,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Reset login attempts
  UPDATE account_security_settings
  SET login_attempts = 0,
      account_locked_until = NULL
  WHERE user_id = p_user_id;

  -- Record security event
  PERFORM record_security_event(
    p_user_id,
    'login_success',
    true,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Revoke all user sessions
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'User requested'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET
    status = 'revoked',
    revoked_at = NOW(),
    revoked_reason = p_reason
  WHERE user_id = p_user_id
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. TRIGGERS
-- ========================================

-- Trigger: Update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
BEFORE UPDATE ON user_sessions
FOR EACH ROW
WHEN (OLD.last_activity_at IS DISTINCT FROM NEW.last_activity_at)
EXECUTE FUNCTION update_session_activity();

-- ========================================
-- 13. VIEWS
-- ========================================

-- View: Active sessions by user
CREATE OR REPLACE VIEW user_active_sessions AS
SELECT
  us.user_id,
  u.email,
  u.full_name,
  COUNT(*) AS active_session_count,
  MAX(us.last_activity_at) AS last_activity,
  array_agg(
    jsonb_build_object(
      'id', us.id,
      'device_name', us.device_name,
      'ip_address', us.ip_address,
      'last_activity', us.last_activity_at
    )
  ) AS sessions
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.status = 'active'
GROUP BY us.user_id, u.email, u.full_name;

-- View: Security event summary
CREATE OR REPLACE VIEW security_event_summary AS
SELECT
  user_id,
  event_type,
  COUNT(*) AS event_count,
  COUNT(*) FILTER (WHERE success = false) AS failed_count,
  MAX(created_at) AS last_occurrence
FROM security_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, event_type;

-- View: Suspicious activity
CREATE OR REPLACE VIEW suspicious_activities AS
SELECT
  se.user_id,
  u.email,
  se.event_type,
  se.ip_address,
  se.country,
  se.created_at,
  se.failure_reason
FROM security_events se
JOIN users u ON se.user_id = u.id
WHERE se.event_type IN ('login_failed', 'suspicious_activity')
  AND se.created_at > NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

COMMENT ON SCHEMA public IS 'Advanced Security & Authentication - 2FA, SSO, session management, security auditing';
