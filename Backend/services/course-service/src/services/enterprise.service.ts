import pool from '../db/pool';
import crypto from 'crypto';

interface Organization {
  name: string;
  slug: string;
  type?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  subscriptionTier?: string;
  maxUsers?: number;
  maxCourses?: number;
  maxStorageGb?: number;
  featuresEnabled?: string[];
  metadata?: any;
}

interface OrganizationSettings {
  organizationId: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  ssoEnabled?: boolean;
  ssoProvider?: string;
  ssoConfig?: any;
  forceSso?: boolean;
  allowSignup?: boolean;
  emailDomains?: string[];
  mfaRequired?: boolean;
  [key: string]: any;
}

interface Department {
  organizationId: string;
  name: string;
  description?: string;
  code?: string;
  parentDepartmentId?: string;
  managerUserId?: string;
  budgetAllocated?: number;
  costCenter?: string;
}

interface Team {
  organizationId: string;
  departmentId?: string;
  name: string;
  description?: string;
  teamLeaderId?: string;
  maxMembers?: number;
  isPrivate?: boolean;
}

interface License {
  organizationId: string;
  licenseType: string;
  totalSeats: number;
  validFrom: Date;
  validUntil: Date;
  featuresIncluded?: string[];
  purchaseOrderNumber?: string;
  cost?: number;
}

export class EnterpriseService {
  // ========================================
  // ORGANIZATIONS
  // ========================================

  async createOrganization(org: Organization): Promise<any> {
    const query = `
      INSERT INTO organizations (
        name, slug, type, contact_email, contact_phone, website,
        timezone, locale, currency, subscription_tier, max_users,
        max_courses, max_storage_gb, features_enabled, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      org.name,
      org.slug,
      org.type || 'enterprise',
      org.contactEmail,
      org.contactPhone,
      org.website,
      org.timezone || 'UTC',
      org.locale || 'en',
      org.currency || 'USD',
      org.subscriptionTier || 'basic',
      org.maxUsers || 50,
      org.maxCourses,
      org.maxStorageGb || 100,
      JSON.stringify(org.featuresEnabled || []),
      org.metadata ? JSON.stringify(org.metadata) : null,
    ];

    const result = await pool.query(query, values);
    const organization = result.rows[0];

    // Create default organization settings
    await this.createOrganizationSettings({ organizationId: organization.id });

    return organization;
  }

  async getOrganization(organizationId: string): Promise<any> {
    const query = `
      SELECT * FROM organization_dashboard
      WHERE organization_id = $1
    `;

    const result = await pool.query(query, [organizationId]);
    return result.rows[0] || null;
  }

  async getOrganizationBySlug(slug: string): Promise<any> {
    const query = 'SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [slug]);
    return result.rows[0] || null;
  }

  async listOrganizations(filters: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ organizations: any[]; total: number }> {
    let query = `
      SELECT * FROM organization_dashboard
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      organizations: result.rows,
      total,
    };
  }

  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (snakeKey === 'features_enabled' || snakeKey === 'metadata') {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(organizationId);

    const query = `
      UPDATE organizations
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    await pool.query(
      'UPDATE organizations SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [organizationId]
    );
  }

  // ========================================
  // ORGANIZATION SETTINGS
  // ========================================

  async createOrganizationSettings(settings: OrganizationSettings): Promise<any> {
    const query = `
      INSERT INTO organization_settings (organization_id)
      VALUES ($1)
      ON CONFLICT (organization_id) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [settings.organizationId]);
    return result.rows[0];
  }

  async getOrganizationSettings(organizationId: string): Promise<any> {
    const query = 'SELECT * FROM organization_settings WHERE organization_id = $1';
    const result = await pool.query(query, [organizationId]);
    return result.rows[0] || null;
  }

  async updateOrganizationSettings(
    organizationId: string,
    updates: Partial<OrganizationSettings>
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'organizationId') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (['sso_config', 'notification_preferences', 'integrations'].includes(snakeKey)) {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else if (snakeKey === 'email_domains') {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(Array.isArray(value) ? value : [value]);
        } else {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(organizationId);

    const query = `
      UPDATE organization_settings
      SET ${fields.join(', ')}
      WHERE organization_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // DEPARTMENTS
  // ========================================

  async createDepartment(dept: Department): Promise<any> {
    const query = `
      INSERT INTO departments (
        organization_id, parent_department_id, name, description, code,
        manager_user_id, budget_allocated, cost_center
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      dept.organizationId,
      dept.parentDepartmentId,
      dept.name,
      dept.description,
      dept.code,
      dept.managerUserId,
      dept.budgetAllocated,
      dept.costCenter,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getDepartment(departmentId: string): Promise<any> {
    const query = `
      SELECT d.*, ds.* FROM departments d
      JOIN department_statistics ds ON d.id = ds.department_id
      WHERE d.id = $1
    `;

    const result = await pool.query(query, [departmentId]);
    return result.rows[0] || null;
  }

  async listDepartments(
    organizationId: string,
    includeInactive: boolean = false
  ): Promise<any[]> {
    let query = `
      SELECT * FROM department_statistics
      WHERE organization_id = $1
    `;

    if (!includeInactive) {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  async updateDepartment(departmentId: string, updates: Partial<Department>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(departmentId);

    const query = `
      UPDATE departments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteDepartment(departmentId: string): Promise<void> {
    await pool.query(
      'UPDATE departments SET is_active = false, updated_at = NOW() WHERE id = $1',
      [departmentId]
    );
  }

  // ========================================
  // TEAMS
  // ========================================

  async createTeam(team: Team): Promise<any> {
    const query = `
      INSERT INTO teams (
        organization_id, department_id, name, description,
        team_leader_id, max_members, is_private
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      team.organizationId,
      team.departmentId,
      team.name,
      team.description,
      team.teamLeaderId,
      team.maxMembers,
      team.isPrivate || false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getTeam(teamId: string): Promise<any> {
    const query = `
      SELECT t.*, ts.* FROM teams t
      JOIN team_statistics ts ON t.id = ts.team_id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [teamId]);
    return result.rows[0] || null;
  }

  async listTeams(organizationId: string, departmentId?: string): Promise<any[]> {
    let query = `
      SELECT * FROM team_statistics
      WHERE organization_id = $1
    `;

    const values: any[] = [organizationId];

    if (departmentId) {
      query += ' AND department_id = $2';
      values.push(departmentId);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(teamId);

    const query = `
      UPDATE teams
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteTeam(teamId: string): Promise<void> {
    await pool.query(
      'UPDATE teams SET is_active = false, updated_at = NOW() WHERE id = $1',
      [teamId]
    );
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<void> {
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [teamId, userId, role]
    );
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [
      teamId,
      userId,
    ]);
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    const query = `
      SELECT tm.*, u.full_name, u.email, u.avatar_url
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at ASC
    `;

    const result = await pool.query(query, [teamId]);
    return result.rows;
  }

  // ========================================
  // ORGANIZATION MEMBERS
  // ========================================

  async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: string = 'member',
    departmentId?: string,
    teamId?: string,
    employeeInfo?: any
  ): Promise<any> {
    const query = `
      INSERT INTO organization_members (
        organization_id, user_id, role, department_id, team_id,
        employee_id, job_title, job_level, hire_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET
        role = EXCLUDED.role,
        department_id = EXCLUDED.department_id,
        team_id = EXCLUDED.team_id,
        status = 'active',
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      organizationId,
      userId,
      role,
      departmentId,
      teamId,
      employeeInfo?.employeeId,
      employeeInfo?.jobTitle,
      employeeInfo?.jobLevel,
      employeeInfo?.hireDate,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE organization_members SET status = $1, left_at = NOW(), updated_at = NOW() WHERE organization_id = $2 AND user_id = $3',
      ['inactive', organizationId, userId]
    );
  }

  async getOrganizationMembers(
    organizationId: string,
    filters: {
      role?: string;
      departmentId?: string;
      teamId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ members: any[]; total: number }> {
    let query = `
      SELECT om.*, u.full_name, u.email, u.avatar_url,
             d.name AS department_name, t.name AS team_name
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      LEFT JOIN departments d ON om.department_id = d.id
      LEFT JOIN teams t ON om.team_id = t.id
      WHERE om.organization_id = $1
    `;

    const values: any[] = [organizationId];
    let paramCount = 2;

    if (filters.role) {
      query += ` AND om.role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.departmentId) {
      query += ` AND om.department_id = $${paramCount}`;
      values.push(filters.departmentId);
      paramCount++;
    }

    if (filters.teamId) {
      query += ` AND om.team_id = $${paramCount}`;
      values.push(filters.teamId);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND om.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query += ` ORDER BY u.full_name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      members: result.rows,
      total,
    };
  }

  async updateOrganizationMember(
    organizationId: string,
    userId: string,
    updates: {
      role?: string;
      departmentId?: string;
      teamId?: string;
      employeeId?: string;
      jobTitle?: string;
      jobLevel?: string;
      permissions?: string[];
    }
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(organizationId, userId);

    const query = `
      UPDATE organization_members
      SET ${fields.join(', ')}
      WHERE organization_id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // LICENSES
  // ========================================

  async createLicense(license: License): Promise<any> {
    const licenseKey = this.generateLicenseKey();

    const query = `
      INSERT INTO licenses (
        organization_id, license_key, license_type, total_seats,
        valid_from, valid_until, features_included,
        purchase_order_number, cost
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      license.organizationId,
      licenseKey,
      license.licenseType,
      license.totalSeats,
      license.validFrom,
      license.validUntil,
      license.featuresIncluded || [],
      license.purchaseOrderNumber,
      license.cost,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getLicenses(organizationId: string, activeOnly: boolean = false): Promise<any[]> {
    let query = `
      SELECT * FROM licenses
      WHERE organization_id = $1
    `;

    if (activeOnly) {
      query += ' AND is_active = true AND NOW() BETWEEN valid_from AND valid_until';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  async assignLicense(
    licenseId: string,
    userId: string,
    assignedBy: string
  ): Promise<any> {
    // Check if license has available seats
    const licenseQuery = 'SELECT total_seats, seats_used FROM licenses WHERE id = $1';
    const licenseResult = await pool.query(licenseQuery, [licenseId]);
    const license = licenseResult.rows[0];

    if (license.seats_used >= license.total_seats) {
      throw new Error('No available seats for this license');
    }

    const query = `
      INSERT INTO license_assignments (license_id, user_id, assigned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (license_id, user_id) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [licenseId, userId, assignedBy]);
    return result.rows[0];
  }

  async revokeLicense(licenseId: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE license_assignments SET revoked_at = NOW() WHERE license_id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [licenseId, userId]
    );
  }

  async checkLicenseAvailability(organizationId: string): Promise<boolean> {
    const query = 'SELECT check_license_availability($1) AS available';
    const result = await pool.query(query, [organizationId]);
    return result.rows[0].available;
  }

  // ========================================
  // ORGANIZATION COURSES
  // ========================================

  async addCourseToOrganization(
    organizationId: string,
    courseId: string,
    options: {
      accessType?: string;
      isMandatory?: boolean;
      customTitle?: string;
      customDescription?: string;
      requiredForDepartments?: string[];
      visibleToDepartments?: string[];
      autoEnroll?: boolean;
      addedBy?: string;
    } = {}
  ): Promise<any> {
    const query = `
      INSERT INTO organization_courses (
        organization_id, course_id, access_type, is_mandatory,
        custom_title, custom_description, required_for_departments,
        visible_to_departments, auto_enroll, added_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (organization_id, course_id) DO NOTHING
      RETURNING *
    `;

    const values = [
      organizationId,
      courseId,
      options.accessType || 'licensed',
      options.isMandatory || false,
      options.customTitle,
      options.customDescription,
      options.requiredForDepartments || [],
      options.visibleToDepartments || [],
      options.autoEnroll || false,
      options.addedBy,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async removeCourseFromOrganization(organizationId: string, courseId: string): Promise<void> {
    await pool.query(
      'DELETE FROM organization_courses WHERE organization_id = $1 AND course_id = $2',
      [organizationId, courseId]
    );
  }

  async getOrganizationCourses(
    organizationId: string,
    filters: {
      isMandatory?: boolean;
      isVisible?: boolean;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT oc.*, c.title, c.description, c.thumbnail_url, c.duration_minutes,
             c.difficulty_level, c.instructor_id
      FROM organization_courses oc
      JOIN courses c ON oc.course_id = c.id
      WHERE oc.organization_id = $1
    `;

    const values: any[] = [organizationId];
    let paramCount = 2;

    if (filters.isMandatory !== undefined) {
      query += ` AND oc.is_mandatory = $${paramCount}`;
      values.push(filters.isMandatory);
      paramCount++;
    }

    if (filters.isVisible !== undefined) {
      query += ` AND oc.is_visible = $${paramCount}`;
      values.push(filters.isVisible);
      paramCount++;
    }

    query += ' ORDER BY c.title ASC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // INVITATIONS
  // ========================================

  async createInvitation(
    organizationId: string,
    email: string,
    role: string,
    invitedBy: string,
    options: {
      departmentId?: string;
      teamId?: string;
      expiresInDays?: number;
    } = {}
  ): Promise<any> {
    const token = this.generateInvitationToken();
    const expiresInDays = options.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO organization_invitations (
        organization_id, email, role, department_id, team_id,
        token, expires_at, invited_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      organizationId,
      email,
      role,
      options.departmentId,
      options.teamId,
      token,
      expiresAt,
      invitedBy,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async acceptInvitation(token: string, userId: string): Promise<any> {
    const query = `
      UPDATE organization_invitations
      SET status = 'accepted', accepted_by = $2, accepted_at = NOW(), updated_at = NOW()
      WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [token, userId]);
    const invitation = result.rows[0];

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Add user to organization
    await this.addOrganizationMember(
      invitation.organization_id,
      userId,
      invitation.role,
      invitation.department_id,
      invitation.team_id
    );

    return invitation;
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    await pool.query(
      "UPDATE organization_invitations SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [invitationId]
    );
  }

  async getOrganizationInvitations(
    organizationId: string,
    status?: string
  ): Promise<any[]> {
    let query = `
      SELECT * FROM organization_invitations
      WHERE organization_id = $1
    `;

    const values: any[] = [organizationId];

    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async aggregateOrganizationAnalytics(
    organizationId: string,
    date: Date = new Date()
  ): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    await pool.query('SELECT aggregate_organization_analytics($1, $2)', [organizationId, dateStr]);
  }

  async getOrganizationAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = `
      SELECT * FROM organization_analytics
      WHERE organization_id = $1
    `;

    const values: any[] = [organizationId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getAuditLog(
    organizationId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ logs: any[]; total: number }> {
    let query = `
      SELECT * FROM organization_audit_log
      WHERE organization_id = $1
    `;

    const values: any[] = [organizationId];
    let paramCount = 2;

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(filters.userId);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }

    if (filters.entityType) {
      query += ` AND entity_type = $${paramCount}`;
      values.push(filters.entityType);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return {
      logs: result.rows,
      total,
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  async isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
    const query = 'SELECT is_organization_admin($1, $2) AS is_admin';
    const result = await pool.query(query, [userId, organizationId]);
    return result.rows[0].is_admin;
  }

  async getUserOrganization(userId: string): Promise<any> {
    const query = 'SELECT * FROM get_user_organization($1)';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return segments.join('-');
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const enterpriseService = new EnterpriseService();
