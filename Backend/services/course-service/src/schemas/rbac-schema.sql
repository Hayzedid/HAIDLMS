-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- ============================================================================
-- Comprehensive role and permission management with inheritance and scoping

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE permission_resource AS ENUM (
  'users',
  'courses',
  'modules',
  'lessons',
  'assessments',
  'enrollments',
  'reviews',
  'forums',
  'messages',
  'certificates',
  'payments',
  'subscriptions',
  'reports',
  'analytics',
  'settings',
  'roles',
  'permissions',
  'organizations'
);

CREATE TYPE permission_action AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'list',
  'publish',
  'unpublish',
  'approve',
  'reject',
  'export',
  'import',
  'manage',
  'moderate',
  'impersonate'
);

CREATE TYPE role_scope AS ENUM (
  'system',      -- System-wide role
  'organization', -- Organization-level role
  'course',      -- Course-specific role
  'custom'       -- Custom scope
);

CREATE TYPE assignment_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'pending'
);

-- ────────────────────────────────────────────────────────────────────────────
-- ROLES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Role hierarchy
  parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0, -- Hierarchy level (0 = highest)

  -- Scope
  scope role_scope DEFAULT 'custom',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- System flags
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  is_default BOOLEAN DEFAULT false, -- Assigned to new users
  is_public BOOLEAN DEFAULT false, -- Can be self-assigned

  -- Permissions summary
  permissions_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_roles_slug ON roles(slug);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);
CREATE INDEX idx_roles_scope ON roles(scope);
CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_roles_system ON roles(is_system_role) WHERE is_system_role = true;

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,

  -- Permission details
  resource permission_resource NOT NULL,
  action permission_action NOT NULL,

  -- Constraints
  conditions JSONB, -- Additional conditions (e.g., { "own_only": true, "status": "published" })

  -- Categorization
  category VARCHAR(50), -- e.g., 'content', 'admin', 'financial'
  is_dangerous BOOLEAN DEFAULT false, -- Requires extra confirmation

  -- Metadata
  is_system_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource, action)
);

CREATE INDEX idx_permissions_slug ON permissions(slug);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_category ON permissions(category);

-- ────────────────────────────────────────────────────────────────────────────
-- ROLE-PERMISSION ASSIGNMENTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Permission customization
  custom_conditions JSONB, -- Override or extend permission conditions

  -- Metadata
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ────────────────────────────────────────────────────────────────────────────
-- USER-ROLE ASSIGNMENTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

  -- Assignment scope
  scope_type VARCHAR(50), -- e.g., 'global', 'organization', 'course'
  scope_id UUID, -- Reference to organization, course, etc.

  -- Time-based assignment
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Status
  status assignment_status DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revoke_reason TEXT,

  -- Metadata
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(user_id, role_id, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_status ON user_roles(status);
CREATE INDEX idx_user_roles_scope ON user_roles(scope_type, scope_id);
CREATE INDEX idx_user_roles_expiry ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSION GRANTS (Direct user permissions, bypassing roles)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Grant or deny
  is_granted BOOLEAN DEFAULT true, -- false = explicit denial

  -- Scope
  scope_type VARCHAR(50),
  scope_id UUID,

  -- Time-based grant
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Metadata
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,

  UNIQUE(user_id, permission_id, scope_type, scope_id)
);

CREATE INDEX idx_permission_grants_user ON permission_grants(user_id);
CREATE INDEX idx_permission_grants_permission ON permission_grants(permission_id);
CREATE INDEX idx_permission_grants_scope ON permission_grants(scope_type, scope_id);

-- ────────────────────────────────────────────────────────────────────────────
-- ROLE HIERARCHY (Materialized path for efficient queries)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_hierarchy (
  ancestor_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  descendant_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL,

  PRIMARY KEY (ancestor_role_id, descendant_role_id)
);

CREATE INDEX idx_role_hierarchy_ancestor ON role_hierarchy(ancestor_role_id);
CREATE INDEX idx_role_hierarchy_descendant ON role_hierarchy(descendant_role_id);

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSION CACHE (For performance optimization)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_permission_cache (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_slug VARCHAR(200) NOT NULL,
  scope_type VARCHAR(50),
  scope_id UUID,

  -- Cache metadata
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',

  PRIMARY KEY (user_id, permission_slug, scope_type, scope_id)
);

CREATE INDEX idx_user_permission_cache_user ON user_permission_cache(user_id);
CREATE INDEX idx_user_permission_cache_expires ON user_permission_cache(expires_at);

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSION AUDIT LOG
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  permission_slug VARCHAR(200) NOT NULL,

  -- Check details
  resource permission_resource,
  action permission_action,
  scope_type VARCHAR(50),
  scope_id UUID,

  -- Result
  was_granted BOOLEAN NOT NULL,
  grant_reason TEXT, -- Which role/grant provided the permission
  deny_reason TEXT, -- Why it was denied

  -- Context
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permission_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_log_permission ON permission_audit_log(permission_slug);
CREATE INDEX idx_permission_audit_log_created_at ON permission_audit_log(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Update role hierarchy when roles are added/modified
CREATE OR REPLACE FUNCTION update_role_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing hierarchy for this role
  DELETE FROM role_hierarchy WHERE descendant_role_id = NEW.id;

  -- Insert self-reference
  INSERT INTO role_hierarchy (ancestor_role_id, descendant_role_id, depth)
  VALUES (NEW.id, NEW.id, 0);

  -- Insert parent relationships
  IF NEW.parent_role_id IS NOT NULL THEN
    INSERT INTO role_hierarchy (ancestor_role_id, descendant_role_id, depth)
    SELECT ancestor_role_id, NEW.id, depth + 1
    FROM role_hierarchy
    WHERE descendant_role_id = NEW.parent_role_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_role_hierarchy
AFTER INSERT OR UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_role_hierarchy();

-- Update role permissions count
CREATE OR REPLACE FUNCTION update_role_permissions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE roles SET permissions_count = permissions_count + 1 WHERE id = NEW.role_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE roles SET permissions_count = permissions_count - 1 WHERE id = OLD.role_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_role_permissions_count
AFTER INSERT OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION update_role_permissions_count();

-- Check if user has permission (with caching)
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_slug VARCHAR,
  p_scope_type VARCHAR DEFAULT NULL,
  p_scope_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_cache_valid BOOLEAN;
BEGIN
  -- Check cache first
  SELECT true INTO v_cache_valid
  FROM user_permission_cache
  WHERE user_id = p_user_id
    AND permission_slug = p_permission_slug
    AND (scope_type = p_scope_type OR (scope_type IS NULL AND p_scope_type IS NULL))
    AND (scope_id = p_scope_id OR (scope_id IS NULL AND p_scope_id IS NULL))
    AND expires_at > NOW();

  IF v_cache_valid THEN
    RETURN true;
  END IF;

  -- Check explicit grants/denials first
  SELECT is_granted INTO v_has_permission
  FROM permission_grants pg
  JOIN permissions p ON pg.permission_id = p.id
  WHERE pg.user_id = p_user_id
    AND p.slug = p_permission_slug
    AND (pg.scope_type = p_scope_type OR pg.scope_type IS NULL)
    AND (pg.scope_id = p_scope_id OR pg.scope_id IS NULL)
    AND (pg.starts_at IS NULL OR pg.starts_at <= NOW())
    AND (pg.expires_at IS NULL OR pg.expires_at > NOW())
  ORDER BY pg.scope_type DESC NULLS LAST -- More specific scopes take precedence
  LIMIT 1;

  IF v_has_permission IS NOT NULL THEN
    RETURN v_has_permission;
  END IF;

  -- Check role-based permissions
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.slug = p_permission_slug
      AND ur.status = 'active'
      AND (ur.scope_type = p_scope_type OR ur.scope_type IS NULL)
      AND (ur.scope_id = p_scope_id OR ur.scope_id IS NULL)
      AND (ur.starts_at IS NULL OR ur.starts_at <= NOW())
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  -- Cache the result
  IF v_has_permission THEN
    INSERT INTO user_permission_cache (user_id, permission_slug, scope_type, scope_id)
    VALUES (p_user_id, p_permission_slug, p_scope_type, p_scope_id)
    ON CONFLICT (user_id, permission_slug, scope_type, scope_id)
    DO UPDATE SET cached_at = NOW(), expires_at = NOW() + INTERVAL '1 hour';
  END IF;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_scope_type VARCHAR DEFAULT NULL,
  p_scope_id UUID DEFAULT NULL
) RETURNS TABLE (
  permission_slug VARCHAR,
  permission_name VARCHAR,
  resource permission_resource,
  action permission_action,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.slug,
    p.name,
    p.resource,
    p.action,
    CASE
      WHEN pg.id IS NOT NULL THEN 'direct_grant'
      ELSE 'role:' || r.name
    END as source
  FROM permissions p
  LEFT JOIN permission_grants pg ON p.id = pg.permission_id
    AND pg.user_id = p_user_id
    AND pg.is_granted = true
    AND (pg.starts_at IS NULL OR pg.starts_at <= NOW())
    AND (pg.expires_at IS NULL OR pg.expires_at > NOW())
  LEFT JOIN role_permissions rp ON p.id = rp.permission_id
  LEFT JOIN user_roles ur ON rp.role_id = ur.role_id
    AND ur.user_id = p_user_id
    AND ur.status = 'active'
    AND (ur.starts_at IS NULL OR ur.starts_at <= NOW())
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE (pg.id IS NOT NULL OR ur.id IS NOT NULL)
    AND (p_scope_type IS NULL OR pg.scope_type = p_scope_type OR ur.scope_type = p_scope_type)
    AND (p_scope_id IS NULL OR pg.scope_id = p_scope_id OR ur.scope_id = p_scope_id);
END;
$$ LANGUAGE plpgsql;

-- Expire user role assignments
CREATE OR REPLACE FUNCTION expire_user_roles()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE user_roles
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Clear permission cache for affected users
  DELETE FROM user_permission_cache
  WHERE user_id IN (
    SELECT DISTINCT user_id FROM user_roles WHERE status = 'expired'
  );

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Invalidate user permission cache
CREATE OR REPLACE FUNCTION invalidate_user_permission_cache(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM user_permission_cache WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire permissions trigger
CREATE OR REPLACE FUNCTION auto_invalidate_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM invalidate_user_permission_cache(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM invalidate_user_permission_cache(OLD.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_cache_on_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION auto_invalidate_permission_cache();

CREATE TRIGGER trigger_invalidate_cache_on_permission_grant_change
AFTER INSERT OR UPDATE OR DELETE ON permission_grants
FOR EACH ROW EXECUTE FUNCTION auto_invalidate_permission_cache();

-- Clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_permission_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_permission_cache WHERE expires_at <= NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────────────────────

-- Active role assignments
CREATE OR REPLACE VIEW active_user_roles AS
SELECT
  ur.id,
  ur.user_id,
  u.name as user_name,
  u.email as user_email,
  ur.role_id,
  r.name as role_name,
  r.slug as role_slug,
  ur.scope_type,
  ur.scope_id,
  ur.assigned_at,
  ur.expires_at,
  CASE
    WHEN ur.expires_at IS NOT NULL AND ur.expires_at <= NOW() THEN true
    ELSE false
  END as is_expiring_soon
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.status = 'active'
  AND (ur.starts_at IS NULL OR ur.starts_at <= NOW())
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- Role permissions summary
CREATE OR REPLACE VIEW role_permissions_summary AS
SELECT
  r.id as role_id,
  r.name as role_name,
  r.slug as role_slug,
  COUNT(DISTINCT rp.permission_id) as direct_permissions_count,
  COUNT(DISTINCT ur.user_id) as users_count,
  r.is_system_role,
  r.scope
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.status = 'active'
GROUP BY r.id, r.name, r.slug, r.is_system_role, r.scope;

-- User permissions overview
CREATE OR REPLACE VIEW user_permissions_overview AS
SELECT
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  COUNT(DISTINCT ur.role_id) as roles_count,
  COUNT(DISTINCT pg.permission_id) as direct_permissions_count,
  ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as role_names
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.status = 'active'
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN permission_grants pg ON u.id = pg.user_id AND pg.is_granted = true
GROUP BY u.id, u.name, u.email;
