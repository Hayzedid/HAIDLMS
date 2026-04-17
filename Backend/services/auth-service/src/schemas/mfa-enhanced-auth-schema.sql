-- Multi-Factor Authentication & Enhanced Security Schema

-- ========================================
-- 1. MFA SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS mfa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- MFA Configuration
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_enforced BOOLEAN DEFAULT false, -- Admin-enforced MFA
  mfa_methods TEXT[] DEFAULT '{}', -- ['totp', 'sms', 'email', 'webauthn']
  primary_method VARCHAR(20) DEFAULT 'totp', -- Primary MFA method

  -- TOTP Settings
  totp_secret VARCHAR(255), -- Base32 encoded secret
  totp_backup_codes TEXT[], -- Array of backup codes (hashed)
  totp_last_used_at TIMESTAMP,

  -- SMS Settings
  sms_phone_number VARCHAR(20),
  sms_phone_verified BOOLEAN DEFAULT false,
  sms_last_sent_at TIMESTAMP,

  -- Email Settings
  email_verified BOOLEAN DEFAULT false,
  email_last_sent_at TIMESTAMP,

  -- Recovery
  recovery_codes_generated_at TIMESTAMP,
  recovery_codes_remaining INTEGER DEFAULT 10,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_mfa_settings_user ON mfa_settings(user_id);
CREATE INDEX idx_mfa_settings_enabled ON mfa_settings(mfa_enabled);

-- ========================================
-- 2. WEBAUTHN / FIDO2 CREDENTIALS
-- ========================================

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Credential Details
  credential_id VARCHAR(255) NOT NULL UNIQUE, -- Base64URL encoded credential ID
  public_key TEXT NOT NULL, -- Public key in PEM format
  counter BIGINT DEFAULT 0, -- Sign counter for replay protection

  -- Device Information
  device_name VARCHAR(100), -- User-friendly name (e.g., "YubiKey 5 NFC")
  device_type VARCHAR(50), -- 'platform' (TouchID/Windows Hello) or 'cross-platform' (YubiKey)
  aaguid UUID, -- Authenticator Attestation GUID

  -- Attestation
  attestation_format VARCHAR(50), -- 'packed', 'fido-u2f', 'none'
  attestation_cert TEXT, -- Certificate chain (if available)

  -- Usage Tracking
  last_used_at TIMESTAMP,
  times_used INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Primary authenticator

  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webauthn_user ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_active ON webauthn_credentials(user_id, is_active);

-- ========================================
-- 3. TRUSTED DEVICES
-- ========================================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device Fingerprint
  device_fingerprint VARCHAR(255) NOT NULL, -- SHA-256 hash of device properties
  device_name VARCHAR(100), -- User-assigned name (e.g., "My MacBook Pro")

  -- Device Details
  user_agent TEXT,
  os_name VARCHAR(50),
  os_version VARCHAR(50),
  browser_name VARCHAR(50),
  browser_version VARCHAR(50),
  device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'

  -- Network Information
  ip_address_first INET, -- IP when first registered
  ip_address_last INET, -- Most recent IP
  country_code VARCHAR(5),
  city VARCHAR(100),

  -- Trust Status
  is_trusted BOOLEAN DEFAULT false,
  trust_expires_at TIMESTAMP, -- Revoke trust after 30 days
  trust_level VARCHAR(20) DEFAULT 'partial', -- 'partial', 'full', 'revoked'

  -- Usage Tracking
  last_used_at TIMESTAMP DEFAULT NOW(),
  times_used INTEGER DEFAULT 1,
  mfa_skipped_count INTEGER DEFAULT 0, -- How many times MFA was skipped on this device

  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_active ON trusted_devices(user_id, is_active, is_trusted);

-- ========================================
-- 4. ACTIVE SESSIONS (Single Session Enforcement)
-- ========================================

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session Tokens
  session_token VARCHAR(255) NOT NULL UNIQUE, -- JWT or session ID
  refresh_token VARCHAR(255) UNIQUE,

  -- Device & Location
  device_id UUID REFERENCES trusted_devices(id) ON DELETE SET NULL,
  device_fingerprint VARCHAR(255),
  ip_address INET,
  country_code VARCHAR(5),
  city VARCHAR(100),
  user_agent TEXT,

  -- Session Metadata
  login_method VARCHAR(50), -- 'password', 'oauth', 'sso'
  mfa_verified BOOLEAN DEFAULT false,
  mfa_method VARCHAR(20), -- Method used for MFA

  -- Tracking
  last_activity_at TIMESTAMP DEFAULT NOW(),
  idle_time_seconds INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  logged_out_at TIMESTAMP,
  expired_at TIMESTAMP,
  force_logout BOOLEAN DEFAULT false, -- Admin force logout

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX idx_active_sessions_active ON active_sessions(user_id, is_active);

-- ========================================
-- 5. MFA VERIFICATION ATTEMPTS
-- ========================================

CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt Details
  mfa_method VARCHAR(20) NOT NULL, -- 'totp', 'sms', 'email', 'webauthn', 'backup_code'
  code_entered VARCHAR(255), -- Hashed code/token
  is_successful BOOLEAN DEFAULT false,

  -- Context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),

  -- Rate Limiting
  attempt_number INTEGER, -- Sequential attempt count for this session
  lockout_until TIMESTAMP, -- Temporary lockout if too many failures

  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mfa_attempts_user ON mfa_verification_attempts(user_id);
CREATE INDEX idx_mfa_attempts_user_time ON mfa_verification_attempts(user_id, attempted_at DESC);

-- ========================================
-- 6. EXAM SESSION SECURITY (IP Tracking)
-- ========================================

CREATE TABLE IF NOT EXISTS exam_session_security (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

  -- IP Tracking
  ip_address_start INET NOT NULL,
  ip_address_changes JSONB DEFAULT '[]', -- [{timestamp, old_ip, new_ip, reason}]
  ip_changes_count INTEGER DEFAULT 0,

  -- Location Tracking
  country_code_start VARCHAR(5),
  country_code_current VARCHAR(5),
  location_changes INTEGER DEFAULT 0,

  -- Device Consistency
  device_fingerprint_start VARCHAR(255),
  device_fingerprint_changes INTEGER DEFAULT 0,

  -- Flags
  ip_violation BOOLEAN DEFAULT false,
  location_violation BOOLEAN DEFAULT false,
  device_violation BOOLEAN DEFAULT false,
  flagged_for_review BOOLEAN DEFAULT false,

  -- Timestamps
  exam_started_at TIMESTAMP DEFAULT NOW(),
  exam_ended_at TIMESTAMP,
  total_duration_seconds INTEGER
);

CREATE INDEX idx_exam_security_user ON exam_session_security(user_id);
CREATE INDEX idx_exam_security_assessment ON exam_session_security(assessment_id);
CREATE INDEX idx_exam_security_flagged ON exam_session_security(flagged_for_review);

-- ========================================
-- 7. SECURITY AUDIT LOG
-- ========================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'mfa_enabled', 'mfa_failed', etc.
  event_category VARCHAR(50), -- 'authentication', 'authorization', 'account_change'
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'

  -- Context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  country_code VARCHAR(5),

  -- Details
  event_details JSONB,
  error_message TEXT,

  -- Status
  was_successful BOOLEAN,
  action_taken TEXT, -- What action was taken in response (if any)

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_severity ON security_audit_log(severity, created_at DESC);
CREATE INDEX idx_security_audit_time ON security_audit_log(created_at DESC);

-- ========================================
-- 8. TRIGGERS & FUNCTIONS
-- ========================================

-- Trigger: Auto-expire inactive sessions
CREATE OR REPLACE FUNCTION expire_inactive_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_activity_at < NOW() - INTERVAL '30 minutes' THEN
    NEW.is_active := false;
    NEW.expired_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_sessions
BEFORE UPDATE ON active_sessions
FOR EACH ROW
EXECUTE FUNCTION expire_inactive_sessions();

-- Function: Enforce single active session
CREATE OR REPLACE FUNCTION enforce_single_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Deactivate all other sessions for this user
  UPDATE active_sessions
  SET is_active = false, logged_out_at = NOW(), force_logout = true
  WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_session
AFTER INSERT ON active_sessions
FOR EACH ROW
EXECUTE FUNCTION enforce_single_session();

-- Function: Log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_category VARCHAR,
  p_severity VARCHAR,
  p_ip_address INET,
  p_was_successful BOOLEAN,
  p_event_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, event_type, event_category, severity,
    ip_address, was_successful, event_details
  ) VALUES (
    p_user_id, p_event_type, p_event_category, p_severity,
    p_ip_address, p_was_successful, p_event_details
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. VIEWS FOR MONITORING
-- ========================================

-- View: Users with MFA enabled
CREATE OR REPLACE VIEW users_mfa_status AS
SELECT
  u.id AS user_id,
  u.email,
  u.role,
  m.mfa_enabled,
  m.mfa_enforced,
  m.mfa_methods,
  m.primary_method,
  COUNT(DISTINCT w.id) AS webauthn_devices_count,
  COUNT(DISTINCT d.id) AS trusted_devices_count,
  m.updated_at AS mfa_last_updated
FROM users u
LEFT JOIN mfa_settings m ON u.id = m.user_id
LEFT JOIN webauthn_credentials w ON u.id = w.user_id AND w.is_active = true
LEFT JOIN trusted_devices d ON u.id = d.user_id AND d.is_active = true
GROUP BY u.id, u.email, u.role, m.mfa_enabled, m.mfa_enforced,
         m.mfa_methods, m.primary_method, m.updated_at;

-- View: Active sessions summary
CREATE OR REPLACE VIEW active_sessions_summary AS
SELECT
  user_id,
  COUNT(*) AS total_active_sessions,
  MAX(last_activity_at) AS most_recent_activity,
  array_agg(DISTINCT country_code) AS countries,
  array_agg(DISTINCT ip_address::TEXT) AS ip_addresses
FROM active_sessions
WHERE is_active = true
GROUP BY user_id;

-- View: Security incidents
CREATE OR REPLACE VIEW security_incidents AS
SELECT *
FROM security_audit_log
WHERE severity IN ('warning', 'critical') AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

COMMENT ON SCHEMA public IS 'Enhanced Authentication & MFA System - Multi-factor authentication, device trust, and session management';
