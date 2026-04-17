import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateRoleParams {
  name: string;
  slug: string;
  description?: string;
  parentRoleId?: string;
  scope?: string;
  organizationId?: string;
  isPublic?: boolean;
  createdBy: string;
}

interface CreatePermissionParams {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
  category?: string;
  conditions?: any;
  isDangerous?: boolean;
}

interface AssignRoleParams {
  userId: string;
  roleId: string;
  scopeType?: string;
  scopeId?: string;
  startsAt?: string;
  expiresAt?: string;
  assignedBy: string;
  notes?: string;
}

interface GrantPermissionParams {
  userId: string;
  permissionId: string;
  isGranted?: boolean;
  scopeType?: string;
  scopeId?: string;
  startsAt?: string;
  expiresAt?: string;
  grantedBy: string;
  reason?: string;
}

// ============================================================================
// RBAC SERVICE
// ============================================================================

export class RBACService {
  // ========================================
  // ROLES
  // ========================================

  async createRole(params: CreateRoleParams): Promise<any> {
    const {
      name,
      slug,
      description,
      parentRoleId,
      scope = 'custom',
      organizationId,
      isPublic = false,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO roles (
        name, slug, description, parent_role_id, scope,
        organization_id, is_public, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, slug, description, parentRoleId, scope, organizationId, isPublic, createdBy]
    );

    return result.rows[0];
  }

  async getRole(roleId: string): Promise<any> {
    const result = await pool.query(
      `SELECT r.*, u.name as created_by_name,
        pr.name as parent_role_name,
        r.permissions_count
      FROM roles r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN roles pr ON r.parent_role_id = pr.id
      WHERE r.id = $1`,
      [roleId]
    );

    return result.rows[0];
  }

  async getRoleBySlug(slug: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM roles WHERE slug = $1`,
      [slug]
    );

    return result.rows[0];
  }

  async listRoles(filters: any = {}): Promise<any[]> {
    const { scope, organizationId, isSystemRole, isActive = true, limit = 100 } = filters;

    let query = `SELECT * FROM roles WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (scope) {
      query += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    if (organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (isSystemRole !== undefined) {
      query += ` AND is_system_role = $${paramIndex}`;
      params.push(isSystemRole);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY level ASC, name ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateRole(roleId: string, updates: any): Promise<any> {
    const allowedFields = ['name', 'description', 'is_public', 'is_active'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(roleId);
    const result = await pool.query(
      `UPDATE roles SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteRole(roleId: string): Promise<void> {
    // Check if role is system role
    const role = await this.getRole(roleId);
    if (role?.is_system_role) {
      throw new Error('Cannot delete system role');
    }

    await pool.query(`UPDATE roles SET is_active = false WHERE id = $1`, [roleId]);
  }

  async getRoleHierarchy(roleId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT r.*, rh.depth
      FROM role_hierarchy rh
      JOIN roles r ON rh.descendant_role_id = r.id
      WHERE rh.ancestor_role_id = $1
      ORDER BY rh.depth ASC`,
      [roleId]
    );

    return result.rows;
  }

  // ========================================
  // PERMISSIONS
  // ========================================

  async createPermission(params: CreatePermissionParams): Promise<any> {
    const {
      name,
      slug,
      description,
      resource,
      action,
      category,
      conditions,
      isDangerous = false
    } = params;

    const result = await pool.query(
      `INSERT INTO permissions (
        name, slug, description, resource, action,
        category, conditions, is_dangerous
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        name,
        slug,
        description,
        resource,
        action,
        category,
        conditions ? JSON.stringify(conditions) : null,
        isDangerous
      ]
    );

    return result.rows[0];
  }

  async getPermission(permissionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM permissions WHERE id = $1`,
      [permissionId]
    );

    return result.rows[0];
  }

  async getPermissionBySlug(slug: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM permissions WHERE slug = $1`,
      [slug]
    );

    return result.rows[0];
  }

  async listPermissions(filters: any = {}): Promise<any[]> {
    const { resource, action, category, isDangerous } = filters;

    let query = `SELECT * FROM permissions WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (resource) {
      query += ` AND resource = $${paramIndex}`;
      params.push(resource);
      paramIndex++;
    }

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isDangerous !== undefined) {
      query += ` AND is_dangerous = $${paramIndex}`;
      params.push(isDangerous);
      paramIndex++;
    }

    query += ` ORDER BY resource, action`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updatePermission(permissionId: string, updates: any): Promise<any> {
    const allowedFields = ['name', 'description', 'conditions', 'category'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        let value = updates[key];
        if (snakeKey === 'conditions' && value) {
          value = JSON.stringify(value);
        }
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(permissionId);
    const result = await pool.query(
      `UPDATE permissions SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ========================================

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    assignedBy: string,
    customConditions?: any
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id, assigned_by, custom_conditions)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (role_id, permission_id) DO UPDATE
      SET custom_conditions = EXCLUDED.custom_conditions, assigned_at = NOW()
      RETURNING *`,
      [roleId, permissionId, assignedBy, customConditions ? JSON.stringify(customConditions) : null]
    );

    return result.rows[0];
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await pool.query(
      `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId]
    );
  }

  async getRolePermissions(roleId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.*, rp.custom_conditions, rp.assigned_at,
        u.name as assigned_by_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN users u ON rp.assigned_by = u.id
      WHERE rp.role_id = $1
      ORDER BY p.resource, p.action`,
      [roleId]
    );

    return result.rows;
  }

  async bulkAssignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    assignedBy: string
  ): Promise<void> {
    const values = permissionIds.map((permId, idx) => {
      const baseIdx = idx * 3;
      return `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3})`;
    }).join(', ');

    const params = permissionIds.flatMap(permId => [roleId, permId, assignedBy]);

    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id, assigned_by)
      VALUES ${values}
      ON CONFLICT (role_id, permission_id) DO NOTHING`,
      params
    );
  }

  // ========================================
  // USER-ROLE ASSIGNMENTS
  // ========================================

  async assignRoleToUser(params: AssignRoleParams): Promise<any> {
    const {
      userId,
      roleId,
      scopeType = 'global',
      scopeId,
      startsAt,
      expiresAt,
      assignedBy,
      notes
    } = params;

    const result = await pool.query(
      `INSERT INTO user_roles (
        user_id, role_id, scope_type, scope_id,
        starts_at, expires_at, assigned_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [userId, roleId, scopeType, scopeId, startsAt, expiresAt, assignedBy, notes]
    );

    // Invalidate permission cache
    await this.invalidateUserPermissionCache(userId);

    return result.rows[0];
  }

  async revokeUserRole(
    userRoleId: string,
    revokedBy: string,
    revokeReason: string
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE user_roles
      SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoke_reason = $3
      WHERE id = $1
      RETURNING *`,
      [userRoleId, revokedBy, revokeReason]
    );

    // Invalidate permission cache
    if (result.rows[0]) {
      await this.invalidateUserPermissionCache(result.rows[0].user_id);
    }

    return result.rows[0];
  }

  async getUserRoles(userId: string, includeInactive: boolean = false): Promise<any[]> {
    let query = `
      SELECT ur.*, r.name as role_name, r.slug as role_slug,
        r.description as role_description,
        u.name as assigned_by_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users u ON ur.assigned_by = u.id
      WHERE ur.user_id = $1
    `;

    if (!includeInactive) {
      query += ` AND ur.status = 'active'`;
    }

    query += ` ORDER BY ur.assigned_at DESC`;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async getRoleUsers(roleId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, ur.scope_type, ur.scope_id,
        ur.assigned_at, ur.expires_at, ur.status
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = $1
      ORDER BY ur.assigned_at DESC`,
      [roleId]
    );

    return result.rows;
  }

  // ========================================
  // PERMISSION GRANTS
  // ========================================

  async grantPermissionToUser(params: GrantPermissionParams): Promise<any> {
    const {
      userId,
      permissionId,
      isGranted = true,
      scopeType,
      scopeId,
      startsAt,
      expiresAt,
      grantedBy,
      reason
    } = params;

    const result = await pool.query(
      `INSERT INTO permission_grants (
        user_id, permission_id, is_granted, scope_type, scope_id,
        starts_at, expires_at, granted_by, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, permission_id, scope_type, scope_id)
      DO UPDATE SET
        is_granted = EXCLUDED.is_granted,
        starts_at = EXCLUDED.starts_at,
        expires_at = EXCLUDED.expires_at,
        granted_by = EXCLUDED.granted_by,
        reason = EXCLUDED.reason,
        granted_at = NOW()
      RETURNING *`,
      [userId, permissionId, isGranted, scopeType, scopeId, startsAt, expiresAt, grantedBy, reason]
    );

    // Invalidate permission cache
    await this.invalidateUserPermissionCache(userId);

    return result.rows[0];
  }

  async revokePermissionGrant(userId: string, permissionId: string): Promise<void> {
    await pool.query(
      `DELETE FROM permission_grants WHERE user_id = $1 AND permission_id = $2`,
      [userId, permissionId]
    );

    // Invalidate permission cache
    await this.invalidateUserPermissionCache(userId);
  }

  async getUserPermissionGrants(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT pg.*, p.name as permission_name, p.slug as permission_slug,
        p.resource, p.action,
        u.name as granted_by_name
      FROM permission_grants pg
      JOIN permissions p ON pg.permission_id = p.id
      LEFT JOIN users u ON pg.granted_by = u.id
      WHERE pg.user_id = $1
      ORDER BY pg.granted_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // ========================================
  // PERMISSION CHECKING
  // ========================================

  async userHasPermission(
    userId: string,
    permissionSlug: string,
    scopeType?: string,
    scopeId?: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT user_has_permission($1, $2, $3, $4) as has_permission`,
      [userId, permissionSlug, scopeType, scopeId]
    );

    return result.rows[0]?.has_permission || false;
  }

  async getUserPermissions(
    userId: string,
    scopeType?: string,
    scopeId?: string
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM get_user_permissions($1, $2, $3)`,
      [userId, scopeType, scopeId]
    );

    return result.rows;
  }

  async logPermissionCheck(
    userId: string,
    permissionSlug: string,
    wasGranted: boolean,
    options: any = {}
  ): Promise<void> {
    const {
      resource,
      action,
      scopeType,
      scopeId,
      grantReason,
      denyReason,
      ipAddress,
      userAgent,
      requestPath
    } = options;

    await pool.query(
      `INSERT INTO permission_audit_log (
        user_id, permission_slug, resource, action, scope_type, scope_id,
        was_granted, grant_reason, deny_reason, ip_address, user_agent, request_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userId,
        permissionSlug,
        resource,
        action,
        scopeType,
        scopeId,
        wasGranted,
        grantReason,
        denyReason,
        ipAddress,
        userAgent,
        requestPath
      ]
    );
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  async invalidateUserPermissionCache(userId: string): Promise<void> {
    await pool.query(`SELECT invalidate_user_permission_cache($1)`, [userId]);
  }

  async cleanupPermissionCache(): Promise<number> {
    const result = await pool.query(`SELECT cleanup_permission_cache()`);
    return result.rows[0]?.cleanup_permission_cache || 0;
  }

  // ========================================
  // EXPIRATION & MAINTENANCE
  // ========================================

  async expireUserRoles(): Promise<number> {
    const result = await pool.query(`SELECT expire_user_roles()`);
    return result.rows[0]?.expire_user_roles || 0;
  }

  // ========================================
  // VIEWS & SUMMARIES
  // ========================================

  async getActiveUserRoles(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_user_roles
      ORDER BY assigned_at DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async getRolePermissionsSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM role_permissions_summary ORDER BY users_count DESC`);
    return result.rows;
  }

  async getUserPermissionsOverview(userId?: string): Promise<any[]> {
    let query = `SELECT * FROM user_permissions_overview`;
    const params: any[] = [];

    if (userId) {
      query += ` WHERE user_id = $1`;
      params.push(userId);
    }

    query += ` ORDER BY roles_count DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getPermissionAuditLog(filters: any = {}): Promise<any[]> {
    const { userId, permissionSlug, wasGranted, limit = 100 } = filters;

    let query = `SELECT * FROM permission_audit_log WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (permissionSlug) {
      query += ` AND permission_slug = $${paramIndex}`;
      params.push(permissionSlug);
      paramIndex++;
    }

    if (wasGranted !== undefined) {
      query += ` AND was_granted = $${paramIndex}`;
      params.push(wasGranted);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const rbacService = new RBACService();
