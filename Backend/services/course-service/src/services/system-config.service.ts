import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateSettingParams {
  key: string;
  value: string;
  dataType?: string;
  scope?: string;
  scopeId?: string;
  category?: string;
  label?: string;
  description?: string;
  isSensitive?: boolean;
  createdBy: string;
}

interface CreateFeatureFlagParams {
  name: string;
  key: string;
  description?: string;
  status?: string;
  rolloutStrategy?: string;
  rolloutPercentage?: number;
  targetOrganizations?: string[];
  targetUsers?: string[];
  createdBy: string;
}

interface CreateTemplateParams {
  name: string;
  templateType: string;
  templateFormat?: string;
  subject?: string;
  body: string;
  locale?: string;
  availableVariables?: string[];
  scope?: string;
  scopeId?: string;
  createdBy: string;
}

interface CreateMaintenanceWindowParams {
  title: string;
  description?: string;
  maintenanceType?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  affectedServices?: string[];
  notifyUsers?: boolean;
  notificationMessage?: string;
  createdBy: string;
}

interface CreateBrandingParams {
  organizationId?: string;
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  createdBy: string;
}

// ============================================================================
// SYSTEM CONFIG SERVICE
// ============================================================================

export class SystemConfigService {
  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  async createSetting(params: CreateSettingParams): Promise<any> {
    const {
      key,
      value,
      dataType,
      scope,
      scopeId,
      category,
      label,
      description,
      isSensitive,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO system_settings (
        key, value, data_type, scope, scope_id, category, label,
        description, is_sensitive, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [key, value, dataType, scope, scopeId, category, label, description, isSensitive, createdBy]
    );

    return result.rows[0];
  }

  async getSetting(key: string, scope?: string, scopeId?: string): Promise<any> {
    let query = `SELECT * FROM system_settings WHERE key = $1 AND is_active = true`;
    const params: any[] = [key];

    if (scope) {
      query += ` AND scope = $2`;
      params.push(scope);
    }

    if (scopeId) {
      query += ` AND scope_id = $3`;
      params.push(scopeId);
    }

    query += ` ORDER BY scope DESC LIMIT 1`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getSettingValue(key: string, scope?: string, scopeId?: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT get_setting_value($1, $2, $3) as value`,
      [key, scope || 'global', scopeId]
    );

    return result.rows[0]?.value || null;
  }

  async listSettings(filters: any = {}): Promise<any[]> {
    const { category, scope, limit = 100 } = filters;

    let query = `SELECT * FROM system_settings WHERE is_active = true`;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (scope) {
      query += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    query += ` ORDER BY category, key LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateSetting(settingId: string, value: string, updatedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE system_settings
      SET value = $2, updated_by = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [settingId, value, updatedBy]
    );

    return result.rows[0];
  }

  async deleteSetting(settingId: string): Promise<void> {
    await pool.query(
      `UPDATE system_settings SET is_active = false WHERE id = $1`,
      [settingId]
    );
  }

  async getSettingsOverview(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM system_settings_overview`);
    return result.rows;
  }

  // ========================================
  // FEATURE FLAGS
  // ========================================

  async createFeatureFlag(params: CreateFeatureFlagParams): Promise<any> {
    const {
      name,
      key,
      description,
      status,
      rolloutStrategy,
      rolloutPercentage,
      targetOrganizations,
      targetUsers,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO feature_flags (
        name, key, description, status, rollout_strategy, rollout_percentage,
        target_organizations, target_users, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name,
        key,
        description,
        status,
        rolloutStrategy,
        rolloutPercentage,
        targetOrganizations,
        targetUsers,
        createdBy
      ]
    );

    return result.rows[0];
  }

  async getFeatureFlag(flagId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM feature_flags WHERE id = $1`,
      [flagId]
    );
    return result.rows[0];
  }

  async getFeatureFlagByKey(key: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM feature_flags WHERE key = $1`,
      [key]
    );
    return result.rows[0];
  }

  async listFeatureFlags(filters: any = {}): Promise<any[]> {
    const { status, limit = 100 } = filters;

    let query = `SELECT * FROM feature_flags WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY name LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateFeatureFlag(flagId: string, updates: any, updatedBy: string): Promise<any> {
    const { status, rolloutStrategy, rolloutPercentage, targetOrganizations, targetUsers } = updates;

    const result = await pool.query(
      `UPDATE feature_flags
      SET status = COALESCE($2, status),
          rollout_strategy = COALESCE($3, rollout_strategy),
          rollout_percentage = COALESCE($4, rollout_percentage),
          target_organizations = COALESCE($5, target_organizations),
          target_users = COALESCE($6, target_users),
          updated_by = $7,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [flagId, status, rolloutStrategy, rolloutPercentage, targetOrganizations, targetUsers, updatedBy]
    );

    return result.rows[0];
  }

  async isFeatureEnabled(
    featureKey: string,
    userId?: string,
    organizationId?: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT is_feature_enabled($1, $2, $3) as is_enabled`,
      [featureKey, userId, organizationId]
    );

    // Log usage
    const flag = await this.getFeatureFlagByKey(featureKey);
    if (flag) {
      await pool.query(
        `INSERT INTO feature_flag_usage (
          feature_flag_id, user_id, organization_id, was_enabled
        ) VALUES ($1, $2, $3, $4)`,
        [flag.id, userId, organizationId, result.rows[0]?.is_enabled || false]
      );
    }

    return result.rows[0]?.is_enabled || false;
  }

  async createFeatureFlagOverride(
    flagId: string,
    overrideType: string,
    targetId: string,
    isEnabled: boolean,
    createdBy: string,
    reason?: string
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO feature_flag_overrides (
        feature_flag_id, override_type, target_id, is_enabled, reason, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (feature_flag_id, override_type, target_id) DO UPDATE
      SET is_enabled = $4, reason = $5, created_by = $6
      RETURNING *`,
      [flagId, overrideType, targetId, isEnabled, reason, createdBy]
    );

    return result.rows[0];
  }

  async getActiveFeatureFlags(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM active_feature_flags`);
    return result.rows;
  }

  // ========================================
  // TEMPLATES
  // ========================================

  async createTemplate(params: CreateTemplateParams): Promise<any> {
    const {
      name,
      templateType,
      templateFormat,
      subject,
      body,
      locale,
      availableVariables,
      scope,
      scopeId,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO templates (
        name, template_type, template_format, subject, body, locale,
        available_variables, scope, scope_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [name, templateType, templateFormat, subject, body, locale, availableVariables, scope, scopeId, createdBy]
    );

    return result.rows[0];
  }

  async getTemplate(templateId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM templates WHERE id = $1`,
      [templateId]
    );
    return result.rows[0];
  }

  async getDefaultTemplate(templateType: string, locale: string = 'en'): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM templates
      WHERE template_type = $1
        AND locale = $2
        AND is_default = true
        AND is_active = true
      LIMIT 1`,
      [templateType, locale]
    );

    return result.rows[0];
  }

  async listTemplates(filters: any = {}): Promise<any[]> {
    const { templateType, locale, scope, limit = 50 } = filters;

    let query = `SELECT * FROM templates WHERE is_active = true`;
    const params: any[] = [];
    let paramIndex = 1;

    if (templateType) {
      query += ` AND template_type = $${paramIndex}`;
      params.push(templateType);
      paramIndex++;
    }

    if (locale) {
      query += ` AND locale = $${paramIndex}`;
      params.push(locale);
      paramIndex++;
    }

    if (scope) {
      query += ` AND scope = $${paramIndex}`;
      params.push(scope);
      paramIndex++;
    }

    query += ` ORDER BY template_type, name LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateTemplate(templateId: string, updates: any, updatedBy: string): Promise<any> {
    const { subject, body, isDefault } = updates;

    const result = await pool.query(
      `UPDATE templates
      SET subject = COALESCE($2, subject),
          body = COALESCE($3, body),
          is_default = COALESCE($4, is_default),
          updated_by = $5,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [templateId, subject, body, isDefault, updatedBy]
    );

    return result.rows[0];
  }

  async getTemplateStatistics(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM template_statistics`);
    return result.rows;
  }

  // ========================================
  // MAINTENANCE WINDOWS
  // ========================================

  async createMaintenanceWindow(params: CreateMaintenanceWindowParams): Promise<any> {
    const {
      title,
      description,
      maintenanceType,
      scheduledStart,
      scheduledEnd,
      affectedServices,
      notifyUsers,
      notificationMessage,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO maintenance_windows (
        title, description, maintenance_type, scheduled_start, scheduled_end,
        affected_services, notify_users, notification_message, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        title,
        description,
        maintenanceType,
        scheduledStart,
        scheduledEnd,
        affectedServices,
        notifyUsers,
        notificationMessage,
        createdBy
      ]
    );

    return result.rows[0];
  }

  async getMaintenanceWindow(windowId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM maintenance_windows WHERE id = $1`,
      [windowId]
    );
    return result.rows[0];
  }

  async listMaintenanceWindows(includeCompleted: boolean = false): Promise<any[]> {
    let query = `SELECT * FROM maintenance_windows WHERE 1=1`;

    if (!includeCompleted) {
      query += ` AND is_completed = false`;
    }

    query += ` ORDER BY scheduled_start DESC`;

    const result = await pool.query(query);
    return result.rows;
  }

  async activateMaintenanceWindow(windowId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE maintenance_windows
      SET is_active = true, actual_start = NOW()
      WHERE id = $1
      RETURNING *`,
      [windowId]
    );

    return result.rows[0];
  }

  async completeMaintenanceWindow(windowId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE maintenance_windows
      SET is_active = false, is_completed = true, actual_end = NOW()
      WHERE id = $1
      RETURNING *`,
      [windowId]
    );

    return result.rows[0];
  }

  async isMaintenanceMode(): Promise<boolean> {
    const result = await pool.query(`SELECT is_maintenance_mode() as is_maintenance`);
    return result.rows[0]?.is_maintenance || false;
  }

  // ========================================
  // RATE LIMITING
  // ========================================

  async createRateLimitConfig(params: any): Promise<any> {
    const {
      name,
      endpointPattern,
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      scope,
      scopeId
    } = params;

    const result = await pool.query(
      `INSERT INTO rate_limit_configs (
        name, endpoint_pattern, requests_per_second, requests_per_minute,
        requests_per_hour, requests_per_day, scope, scope_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, endpointPattern, requestsPerSecond, requestsPerMinute, requestsPerHour, requestsPerDay, scope, scopeId]
    );

    return result.rows[0];
  }

  async getRateLimitConfig(configId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM rate_limit_configs WHERE id = $1`,
      [configId]
    );
    return result.rows[0];
  }

  async listRateLimitConfigs(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM rate_limit_configs WHERE is_active = true ORDER BY priority DESC`
    );
    return result.rows;
  }

  async updateRateLimitConfig(configId: string, updates: any): Promise<any> {
    const {
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      isActive
    } = updates;

    const result = await pool.query(
      `UPDATE rate_limit_configs
      SET requests_per_second = COALESCE($2, requests_per_second),
          requests_per_minute = COALESCE($3, requests_per_minute),
          requests_per_hour = COALESCE($4, requests_per_hour),
          requests_per_day = COALESCE($5, requests_per_day),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [configId, requestsPerSecond, requestsPerMinute, requestsPerHour, requestsPerDay, isActive]
    );

    return result.rows[0];
  }

  // ========================================
  // BRANDING
  // ========================================

  async createBrandingConfig(params: CreateBrandingParams): Promise<any> {
    const {
      organizationId,
      brandName,
      logoUrl,
      primaryColor,
      secondaryColor,
      customDomain,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO branding_configs (
        organization_id, brand_name, logo_url, primary_color, secondary_color,
        custom_domain, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [organizationId, brandName, logoUrl, primaryColor, secondaryColor, customDomain, createdBy]
    );

    return result.rows[0];
  }

  async getBrandingConfig(organizationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM branding_configs WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );
    return result.rows[0];
  }

  async updateBrandingConfig(configId: string, updates: any, updatedBy: string): Promise<any> {
    const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClauses = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
    const values = [configId, ...fields.map(f => updates[f])];
    values.push(updatedBy);

    const result = await pool.query(
      `UPDATE branding_configs
      SET ${setClauses}, updated_by = $${values.length}, updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // CONFIGURATION HISTORY
  // ========================================

  async getConfigHistory(configType: string, configId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM config_history
      WHERE config_type = $1 AND config_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
      [configType, configId, limit]
    );

    return result.rows;
  }
}

export const systemConfigService = new SystemConfigService();
