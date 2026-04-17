-- ============================================================================
-- USER MANAGEMENT SCHEMA
-- ============================================================================
-- Comprehensive user management, bulk operations, impersonation, and data export

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'deleted',
  'pending_verification'
);

CREATE TYPE account_action_type AS ENUM (
  'activate',
  'deactivate',
  'suspend',
  'delete',
  'reset_password',
  'unlock',
  'verify_email',
  'change_role'
);

CREATE TYPE impersonation_reason AS ENUM (
  'support',
  'debugging',
  'training',
  'compliance_check',
  'emergency_access'
);

CREATE TYPE export_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed'
);

-- ────────────────────────────────────────────────────────────────────────────
-- USER PROFILES (Extended user information)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Account status
  status user_status NOT NULL DEFAULT 'active',
  status_reason TEXT,
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES users(id),

  -- Contact information
  phone_number VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,
  secondary_email VARCHAR(255),
  secondary_email_verified BOOLEAN DEFAULT false,

  -- Profile details
  bio TEXT,
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  country VARCHAR(2),
  city VARCHAR(100),

  -- Professional information
  job_title VARCHAR(200),
  company VARCHAR(200),
  industry VARCHAR(100),
  years_of_experience INTEGER,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,

  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,

  -- Privacy settings
  profile_visibility VARCHAR(20) DEFAULT 'public', -- public, private, connections_only
  show_activity BOOLEAN DEFAULT true,
  show_progress BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,

  -- Account metadata
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login_at TIMESTAMPTZ,
  account_locked_until TIMESTAMPTZ,

  -- Activity tracking
  courses_completed INTEGER DEFAULT 0,
  total_learning_time_minutes INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_last_login ON user_profiles(last_login_at);

-- ────────────────────────────────────────────────────────────────────────────
-- USER TAGS (For organizing and categorizing users)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(name, organization_id)
);

CREATE INDEX idx_user_tags_org ON user_tags(organization_id);

CREATE TABLE IF NOT EXISTS user_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES user_tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tag_id)
);

CREATE INDEX idx_user_tag_assignments_user ON user_tag_assignments(user_id);
CREATE INDEX idx_user_tag_assignments_tag ON user_tag_assignments(tag_id);

-- ────────────────────────────────────────────────────────────────────────────
-- BULK OPERATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type account_action_type NOT NULL,
  initiated_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Target users
  target_user_ids UUID[] NOT NULL,
  total_users INTEGER NOT NULL,

  -- Operation details
  reason TEXT,
  parameters JSONB, -- Additional parameters for the operation

  -- Execution tracking
  status export_status DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  errors JSONB, -- Array of error messages

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulk_operations_initiated_by ON bulk_operations(initiated_by);
CREATE INDEX idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX idx_bulk_operations_created_at ON bulk_operations(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- USER IMPERSONATION LOG
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL REFERENCES users(id),
  impersonated_user_id UUID NOT NULL REFERENCES users(id),

  -- Session details
  reason impersonation_reason NOT NULL,
  justification TEXT NOT NULL,
  ticket_number VARCHAR(50), -- Support ticket reference

  -- Session tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Activity during impersonation
  actions_performed INTEGER DEFAULT 0,
  pages_visited TEXT[],
  ip_address INET,
  user_agent TEXT,

  -- Authorization
  approved_by UUID REFERENCES users(id),
  approval_timestamp TIMESTAMPTZ
);

CREATE INDEX idx_impersonation_sessions_impersonator ON impersonation_sessions(impersonator_id);
CREATE INDEX idx_impersonation_sessions_impersonated ON impersonation_sessions(impersonated_user_id);
CREATE INDEX idx_impersonation_sessions_started ON impersonation_sessions(started_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- ACCOUNT ACTIONS LOG
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type account_action_type NOT NULL,
  performed_by UUID REFERENCES users(id),

  -- Action details
  reason TEXT,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  changes JSONB, -- Detailed changes made

  -- Context
  ip_address INET,
  user_agent TEXT,
  bulk_operation_id UUID REFERENCES bulk_operations(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_account_actions_user ON account_actions(user_id);
CREATE INDEX idx_account_actions_performed_by ON account_actions(performed_by);
CREATE INDEX idx_account_actions_type ON account_actions(action_type);
CREATE INDEX idx_account_actions_created_at ON account_actions(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- USER DATA EXPORTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),

  -- Export configuration
  export_type VARCHAR(50) NOT NULL, -- full_profile, learning_data, activity_log, etc.
  include_sections TEXT[], -- Which sections to include
  format VARCHAR(20) DEFAULT 'json', -- json, csv, pdf

  -- Processing
  status export_status DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,

  -- Results
  file_url TEXT,
  file_size BIGINT,
  expiry_date TIMESTAMPTZ, -- When the download link expires
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  -- GDPR compliance
  is_gdpr_request BOOLEAN DEFAULT false,

  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_data_exports_user ON user_data_exports(user_id);
CREATE INDEX idx_user_data_exports_requested_by ON user_data_exports(requested_by);
CREATE INDEX idx_user_data_exports_status ON user_data_exports(status);
CREATE INDEX idx_user_data_exports_created_at ON user_data_exports(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- USER NOTES (Admin notes about users)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  -- Note details
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true, -- Visible only to admins
  is_flagged BOOLEAN DEFAULT false, -- Important notes
  category VARCHAR(50), -- support, compliance, billing, etc.

  -- Attachments
  attachments JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_notes_user ON user_notes(user_id);
CREATE INDEX idx_user_notes_created_by ON user_notes(created_by);
CREATE INDEX idx_user_notes_flagged ON user_notes(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_user_notes_created_at ON user_notes(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- USER GROUPS (For bulk management)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Group settings
  is_dynamic BOOLEAN DEFAULT false, -- Auto-updated based on criteria
  dynamic_criteria JSONB, -- Rules for auto-membership

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Statistics
  member_count INTEGER DEFAULT 0
);

CREATE INDEX idx_user_groups_org ON user_groups(organization_id);

CREATE TABLE IF NOT EXISTS user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Membership details
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_auto_added BOOLEAN DEFAULT false, -- Added by dynamic criteria

  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_user_group_members_group ON user_group_members(group_id);
CREATE INDEX idx_user_group_members_user ON user_group_members(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Update user profile status
CREATE OR REPLACE FUNCTION update_user_status(
  p_user_id UUID,
  p_new_status user_status,
  p_reason TEXT,
  p_changed_by UUID
) RETURNS SETOF user_profiles AS $$
BEGIN
  RETURN QUERY
  UPDATE user_profiles
  SET
    status = p_new_status,
    status_reason = p_reason,
    status_changed_at = NOW(),
    status_changed_by = p_changed_by,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Log account action
CREATE OR REPLACE FUNCTION log_account_action(
  p_user_id UUID,
  p_action_type account_action_type,
  p_performed_by UUID,
  p_reason TEXT,
  p_previous_status VARCHAR,
  p_new_status VARCHAR,
  p_changes JSONB
) RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO account_actions (
    user_id,
    action_type,
    performed_by,
    reason,
    previous_status,
    new_status,
    changes
  ) VALUES (
    p_user_id,
    p_action_type,
    p_performed_by,
    p_reason,
    p_previous_status,
    p_new_status,
    p_changes
  ) RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql;

-- Start impersonation session
CREATE OR REPLACE FUNCTION start_impersonation(
  p_impersonator_id UUID,
  p_impersonated_user_id UUID,
  p_reason impersonation_reason,
  p_justification TEXT,
  p_ticket_number VARCHAR,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO impersonation_sessions (
    impersonator_id,
    impersonated_user_id,
    reason,
    justification,
    ticket_number,
    ip_address,
    user_agent
  ) VALUES (
    p_impersonator_id,
    p_impersonated_user_id,
    p_reason,
    p_justification,
    p_ticket_number,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- End impersonation session
CREATE OR REPLACE FUNCTION end_impersonation(
  p_session_id UUID,
  p_actions_performed INTEGER,
  p_pages_visited TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at
  FROM impersonation_sessions
  WHERE id = p_session_id;

  UPDATE impersonation_sessions
  SET
    ended_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_started_at))::INTEGER,
    actions_performed = p_actions_performed,
    pages_visited = p_pages_visited
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Update group member count trigger
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_groups
    SET member_count = member_count - 1
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR DELETE ON user_group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Update user profile timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profile_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_user_profile_timestamp();

-- ────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- Active users summary
CREATE OR REPLACE VIEW active_users_summary AS
SELECT
  up.user_id,
  u.name,
  u.email,
  up.status,
  up.last_login_at,
  up.login_count,
  up.courses_completed,
  up.total_learning_time_minutes,
  up.current_streak_days,
  COUNT(DISTINCT e.id) as active_enrollments
FROM user_profiles up
JOIN users u ON up.user_id = u.id
LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'active'
WHERE up.status = 'active'
GROUP BY up.user_id, u.name, u.email, up.status, up.last_login_at,
         up.login_count, up.courses_completed, up.total_learning_time_minutes, up.current_streak_days;

-- Users requiring attention (locked, suspended, failed logins)
CREATE OR REPLACE VIEW users_requiring_attention AS
SELECT
  up.user_id,
  u.name,
  u.email,
  up.status,
  up.failed_login_attempts,
  up.last_failed_login_at,
  up.account_locked_until,
  up.status_reason
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE
  up.status IN ('suspended', 'inactive')
  OR up.failed_login_attempts >= 3
  OR up.account_locked_until > NOW()
ORDER BY up.last_failed_login_at DESC NULLS LAST;

-- Recent impersonation sessions
CREATE OR REPLACE VIEW recent_impersonations AS
SELECT
  iss.id,
  iss.started_at,
  iss.ended_at,
  iss.duration_seconds,
  imp.name as impersonator_name,
  imp.email as impersonator_email,
  impd.name as impersonated_user_name,
  impd.email as impersonated_user_email,
  iss.reason,
  iss.justification,
  iss.actions_performed
FROM impersonation_sessions iss
JOIN users imp ON iss.impersonator_id = imp.id
JOIN users impd ON iss.impersonated_user_id = impd.id
ORDER BY iss.started_at DESC;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  u.id as user_id,
  u.name,
  u.email,
  up.status,
  up.last_login_at,
  up.login_count,
  COUNT(DISTINCT e.id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_courses,
  up.total_learning_time_minutes,
  up.current_streak_days,
  COALESCE(SUM(p.total_points), 0) as total_points,
  COUNT(DISTINCT n.id) FILTER (WHERE n.created_at > NOW() - INTERVAL '7 days') as notes_last_7_days
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN user_points p ON u.id = p.user_id
LEFT JOIN user_notes n ON u.id = n.user_id
GROUP BY u.id, u.name, u.email, up.status, up.last_login_at,
         up.login_count, up.total_learning_time_minutes, up.current_streak_days;
