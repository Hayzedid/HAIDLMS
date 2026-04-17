-- Enterprise & Organization Management Schema
-- Multi-tenancy system for enterprise customers

-- ========================================
-- 1. ORGANIZATIONS (TENANTS)
-- ========================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
  type VARCHAR(50) DEFAULT 'enterprise', -- 'enterprise', 'educational', 'government', 'nonprofit'

  -- Contact Info
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  website VARCHAR(500),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),

  -- Settings
  timezone VARCHAR(100) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'USD',

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'trial', 'inactive'
  trial_ends_at TIMESTAMP,
  subscription_tier VARCHAR(50) DEFAULT 'basic', -- 'basic', 'professional', 'enterprise', 'custom'

  -- License Management
  max_users INTEGER DEFAULT 50,
  max_courses INTEGER,
  max_storage_gb INTEGER DEFAULT 100,

  -- Features Enabled
  features_enabled JSONB DEFAULT '[]', -- ['sso', 'api_access', 'white_label', 'custom_domain']

  -- Metadata
  metadata JSONB, -- Custom fields

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created ON organizations(created_at DESC);

-- ========================================
-- 2. ORGANIZATION SETTINGS & BRANDING
-- ========================================

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Branding
  logo_url VARCHAR(500),
  logo_dark_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',

  -- Custom Domain
  custom_domain VARCHAR(255),
  custom_domain_verified BOOLEAN DEFAULT false,
  custom_domain_verified_at TIMESTAMP,

  -- Email Branding
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  email_logo_url VARCHAR(500),
  email_footer_text TEXT,

  -- Authentication Settings
  sso_enabled BOOLEAN DEFAULT false,
  sso_provider VARCHAR(50), -- 'saml', 'oauth', 'openid'
  sso_config JSONB,
  force_sso BOOLEAN DEFAULT false,
  allow_signup BOOLEAN DEFAULT true,
  email_domains TEXT[], -- Allowed email domains for auto-join

  -- Security Settings
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_special BOOLEAN DEFAULT true,
  mfa_required BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 480,

  -- Content Settings
  default_course_visibility VARCHAR(20) DEFAULT 'organization', -- 'public', 'organization', 'private'
  content_approval_required BOOLEAN DEFAULT false,

  -- Notification Settings
  notification_preferences JSONB DEFAULT '{}',

  -- Integration Settings
  integrations JSONB DEFAULT '{}', -- {'slack': {...}, 'teams': {...}}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_org_settings_org ON organization_settings(organization_id);

-- ========================================
-- 3. DEPARTMENTS & TEAMS
-- ========================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Hierarchy
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50), -- Department code (e.g., 'ENG', 'SALES')

  -- Manager
  manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Settings
  budget_allocated DECIMAL(12,2),
  cost_center VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_manager ON departments(manager_user_id);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Leader
  team_leader_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Settings
  max_members INTEGER,
  is_private BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_teams_dept ON teams(department_id);
CREATE INDEX idx_teams_leader ON teams(team_leader_id);

-- ========================================
-- 4. USER-ORGANIZATION RELATIONSHIPS
-- ========================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role in Organization
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'manager', 'member'

  -- Department & Team
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Employment Info
  employee_id VARCHAR(100),
  job_title VARCHAR(255),
  job_level VARCHAR(50),
  hire_date DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invitation_accepted_at TIMESTAMP,

  -- Permissions
  permissions TEXT[], -- ['manage_users', 'manage_courses', 'view_analytics']

  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_dept ON organization_members(department_id);
CREATE INDEX idx_org_members_team ON organization_members(team_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role VARCHAR(50) DEFAULT 'member', -- 'leader', 'member'

  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ========================================
-- 5. LICENSE MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- License Info
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) NOT NULL, -- 'user_based', 'concurrent', 'course_based'

  -- Allocation
  total_seats INTEGER NOT NULL,
  seats_used INTEGER DEFAULT 0,

  -- Validity
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Features
  features_included TEXT[], -- ['all_courses', 'certifications', 'api_access']

  -- Billing
  purchase_order_number VARCHAR(100),
  cost DECIMAL(12,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_licenses_org ON licenses(organization_id);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_validity ON licenses(valid_from, valid_until);

CREATE TABLE IF NOT EXISTS license_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,

  UNIQUE(license_id, user_id)
);

CREATE INDEX idx_license_assignments_license ON license_assignments(license_id);
CREATE INDEX idx_license_assignments_user ON license_assignments(user_id);

-- ========================================
-- 6. ORGANIZATION-COURSE RELATIONSHIPS
-- ========================================

CREATE TABLE IF NOT EXISTS organization_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Access Control
  access_type VARCHAR(50) DEFAULT 'licensed', -- 'licensed', 'purchased', 'trial', 'custom'
  is_mandatory BOOLEAN DEFAULT false,

  -- Customization
  custom_title VARCHAR(500),
  custom_description TEXT,
  custom_prerequisites TEXT[],

  -- Completion Requirements
  required_for_departments TEXT[], -- Department IDs
  required_for_job_levels TEXT[],
  completion_deadline DATE,

  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  visible_to_departments TEXT[], -- Empty = all departments
  visible_to_teams TEXT[],

  -- Enrollment
  auto_enroll BOOLEAN DEFAULT false,
  enrollment_approval_required BOOLEAN DEFAULT false,

  -- Tracking
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,

  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, course_id)
);

CREATE INDEX idx_org_courses_org ON organization_courses(organization_id);
CREATE INDEX idx_org_courses_course ON organization_courses(course_id);
CREATE INDEX idx_org_courses_mandatory ON organization_courses(is_mandatory);

-- ========================================
-- 7. ORGANIZATION INVITATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Invitation Token
  token VARCHAR(255) UNIQUE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'cancelled'
  expires_at TIMESTAMP NOT NULL,

  -- Tracking
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status);

-- ========================================
-- 8. ORGANIZATION ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS organization_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- User Metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,

  -- Course Metrics
  total_enrollments INTEGER DEFAULT 0,
  active_enrollments INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,
  avg_completion_rate DECIMAL(5,2) DEFAULT 0,

  -- Engagement Metrics
  total_logins INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  avg_time_per_user_minutes INTEGER DEFAULT 0,

  -- Content Metrics
  lessons_completed INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,
  avg_assessment_score DECIMAL(5,2) DEFAULT 0,

  -- Certification Metrics
  certificates_issued INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,

  -- Collaboration Metrics
  forum_posts INTEGER DEFAULT 0,
  peer_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, date)
);

CREATE INDEX idx_org_analytics_org ON organization_analytics(organization_id);
CREATE INDEX idx_org_analytics_date ON organization_analytics(date DESC);

-- ========================================
-- 9. ORGANIZATION AUDIT LOG
-- ========================================

CREATE TABLE IF NOT EXISTS organization_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- Action
  action VARCHAR(100) NOT NULL, -- 'user.added', 'course.assigned', 'settings.updated'
  entity_type VARCHAR(50), -- 'user', 'course', 'department', 'team'
  entity_id VARCHAR(255),

  -- Details
  description TEXT,
  changes JSONB, -- Before/after values
  metadata JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_org_audit_org ON organization_audit_log(organization_id);
CREATE INDEX idx_org_audit_user ON organization_audit_log(user_id);
CREATE INDEX idx_org_audit_action ON organization_audit_log(action);
CREATE INDEX idx_org_audit_created ON organization_audit_log(created_at DESC);

-- ========================================
-- 10. VIEWS
-- ========================================

-- View: Organization Dashboard
CREATE OR REPLACE VIEW organization_dashboard AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.status,
  COUNT(DISTINCT om.user_id) AS total_members,
  COUNT(DISTINCT om.user_id) FILTER (WHERE om.status = 'active') AS active_members,
  COUNT(DISTINCT d.id) AS total_departments,
  COUNT(DISTINCT t.id) AS total_teams,
  COUNT(DISTINCT oc.course_id) AS total_courses,
  COUNT(DISTINCT e.id) AS total_enrollments,
  COUNT(DISTINCT e.id) FILTER (WHERE e.completed = true) AS completed_enrollments,
  ROUND(
    COUNT(DISTINCT e.id) FILTER (WHERE e.completed = true)::NUMERIC /
    NULLIF(COUNT(DISTINCT e.id), 0) * 100,
    2
  ) AS completion_rate,
  l.total_seats,
  l.seats_used,
  o.max_storage_gb,
  o.trial_ends_at,
  o.created_at
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN departments d ON o.id = d.organization_id AND d.is_active = true
LEFT JOIN teams t ON o.id = t.organization_id AND t.is_active = true
LEFT JOIN organization_courses oc ON o.id = oc.organization_id
LEFT JOIN enrollments e ON om.user_id = e.user_id AND oc.course_id = e.course_id
LEFT JOIN (
  SELECT organization_id, SUM(total_seats) AS total_seats, SUM(seats_used) AS seats_used
  FROM licenses
  WHERE is_active = true AND NOW() BETWEEN valid_from AND valid_until
  GROUP BY organization_id
) l ON o.id = l.organization_id
GROUP BY o.id, o.name, o.status, o.max_storage_gb, o.trial_ends_at, o.created_at,
         l.total_seats, l.seats_used;

-- View: Department Statistics
CREATE OR REPLACE VIEW department_statistics AS
SELECT
  d.id AS department_id,
  d.organization_id,
  d.name AS department_name,
  COUNT(DISTINCT om.user_id) AS member_count,
  COUNT(DISTINCT om.user_id) FILTER (WHERE om.status = 'active') AS active_member_count,
  COUNT(DISTINCT t.id) AS team_count,
  COUNT(DISTINCT e.id) AS total_enrollments,
  COUNT(DISTINCT e.id) FILTER (WHERE e.completed = true) AS completed_enrollments,
  ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress,
  ROUND(
    COUNT(DISTINCT e.id) FILTER (WHERE e.completed = true)::NUMERIC /
    NULLIF(COUNT(DISTINCT e.id), 0) * 100,
    2
  ) AS completion_rate
FROM departments d
LEFT JOIN organization_members om ON d.id = om.department_id
LEFT JOIN teams t ON d.id = t.department_id AND t.is_active = true
LEFT JOIN enrollments e ON om.user_id = e.user_id
WHERE d.is_active = true
GROUP BY d.id, d.organization_id, d.name;

-- View: Team Statistics
CREATE OR REPLACE VIEW team_statistics AS
SELECT
  t.id AS team_id,
  t.organization_id,
  t.department_id,
  t.name AS team_name,
  COUNT(DISTINCT tm.user_id) AS member_count,
  COUNT(DISTINCT e.id) AS total_enrollments,
  COUNT(DISTINCT e.id) FILTER (WHERE e.completed = true) AS completed_enrollments,
  ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN enrollments e ON tm.user_id = e.user_id
WHERE t.is_active = true
GROUP BY t.id, t.organization_id, t.department_id, t.name;

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Check if user is organization admin
CREATE OR REPLACE FUNCTION is_organization_admin(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(p_user_id UUID)
RETURNS TABLE(
  organization_id UUID,
  organization_name VARCHAR,
  role VARCHAR,
  department_id UUID,
  team_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.organization_id,
    o.name,
    om.role,
    om.department_id,
    om.team_id
  FROM organization_members om
  JOIN organizations o ON om.organization_id = o.id
  WHERE om.user_id = p_user_id
    AND om.status = 'active'
    AND o.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Check license availability
CREATE OR REPLACE FUNCTION check_license_availability(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_seats INTEGER;
BEGIN
  SELECT SUM(total_seats - seats_used) INTO v_available_seats
  FROM licenses
  WHERE organization_id = p_org_id
    AND is_active = true
    AND NOW() BETWEEN valid_from AND valid_until;

  RETURN COALESCE(v_available_seats, 0) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Aggregate organization analytics
CREATE OR REPLACE FUNCTION aggregate_organization_analytics(
  p_org_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO organization_analytics (
    organization_id, date, total_users, active_users, new_users,
    total_enrollments, active_enrollments, completed_enrollments,
    avg_completion_rate, total_logins, total_time_spent_minutes,
    lessons_completed, assessments_completed, certificates_issued, badges_earned
  )
  SELECT
    p_org_id,
    p_date,
    COUNT(DISTINCT om.user_id) AS total_users,
    COUNT(DISTINCT CASE WHEN om.status = 'active' THEN om.user_id END) AS active_users,
    COUNT(DISTINCT CASE WHEN om.joined_at::DATE = p_date THEN om.user_id END) AS new_users,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT CASE WHEN e.last_accessed_at::DATE = p_date THEN e.id END) AS active_enrollments,
    COUNT(DISTINCT CASE WHEN e.completed = true THEN e.id END) AS completed_enrollments,
    ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_completion_rate,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.activity_type = 'login' AND sa.created_at::DATE = p_date) AS total_logins,
    COALESCE(SUM(sa.duration_seconds) FILTER (WHERE sa.created_at::DATE = p_date) / 60, 0) AS total_time_spent_minutes,
    COUNT(DISTINCT lp.id) FILTER (WHERE lp.completed = true AND lp.completed_at::DATE = p_date) AS lessons_completed,
    COUNT(DISTINCT asub.id) FILTER (WHERE asub.submitted_at::DATE = p_date) AS assessments_completed,
    COUNT(DISTINCT c.id) FILTER (WHERE c.issued_at::DATE = p_date) AS certificates_issued,
    COUNT(DISTINCT ba.id) FILTER (WHERE ba.issued_at::DATE = p_date) AS badges_earned
  FROM organization_members om
  LEFT JOIN enrollments e ON om.user_id = e.user_id
  LEFT JOIN student_activities sa ON om.user_id = sa.user_id
  LEFT JOIN lesson_progress lp ON om.user_id = lp.user_id
  LEFT JOIN assessment_submissions asub ON om.user_id = asub.user_id
  LEFT JOIN certificates c ON om.user_id = c.user_id
  LEFT JOIN badge_assertions ba ON om.user_id = ba.recipient_id
  WHERE om.organization_id = p_org_id
  ON CONFLICT (organization_id, date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    total_enrollments = EXCLUDED.total_enrollments,
    active_enrollments = EXCLUDED.active_enrollments,
    completed_enrollments = EXCLUDED.completed_enrollments,
    avg_completion_rate = EXCLUDED.avg_completion_rate,
    total_logins = EXCLUDED.total_logins,
    total_time_spent_minutes = EXCLUDED.total_time_spent_minutes,
    lessons_completed = EXCLUDED.lessons_completed,
    assessments_completed = EXCLUDED.assessments_completed,
    certificates_issued = EXCLUDED.certificates_issued,
    badges_earned = EXCLUDED.badges_earned,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. TRIGGERS
-- ========================================

-- Trigger: Update license seats used
CREATE OR REPLACE FUNCTION update_license_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE licenses
    SET seats_used = seats_used + 1
    WHERE id = NEW.license_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL) THEN
    UPDATE licenses
    SET seats_used = GREATEST(0, seats_used - 1)
    WHERE id = COALESCE(NEW.license_id, OLD.license_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_seats
AFTER INSERT OR UPDATE OR DELETE ON license_assignments
FOR EACH ROW
EXECUTE FUNCTION update_license_seats();

-- Trigger: Log organization changes
CREATE OR REPLACE FUNCTION log_organization_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_audit_log (
    organization_id, action, entity_type, entity_id, description, changes
  ) VALUES (
    NEW.organization_id,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    NEW.id::TEXT,
    'Organization ' || TG_TABLE_NAME || ' ' || lower(TG_OP),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Enterprise Management - Multi-tenancy and organization administration';
