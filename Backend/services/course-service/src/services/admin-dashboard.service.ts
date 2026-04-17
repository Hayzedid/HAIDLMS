import pool from '../db/pool';

export class AdminDashboardService {
  // SYSTEM METRICS
  async recordSystemMetric(data: any): Promise<any> {
    const {
      metricName, metricType, metricValue, metricUnit, serviceName,
      hostName, environment, region, labels
    } = data;

    const result = await pool.query(
      `INSERT INTO system_metrics (
        metric_name, metric_type, metric_value, metric_unit, service_name,
        host_name, environment, region, labels, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [metricName, metricType, metricValue, metricUnit, serviceName, hostName, environment, region, labels]
    );

    return result.rows[0];
  }

  async getSystemMetrics(filters: any = {}): Promise<any[]> {
    const { metricName, serviceName, startTime, endTime, limit = 100 } = filters;
    let query = `SELECT * FROM system_metrics WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (metricName) {
      query += ` AND metric_name = $${paramIndex}`;
      params.push(metricName);
      paramIndex++;
    }

    if (serviceName) {
      query += ` AND service_name = $${paramIndex}`;
      params.push(serviceName);
      paramIndex++;
    }

    if (startTime) {
      query += ` AND recorded_at >= $${paramIndex}`;
      params.push(startTime);
      paramIndex++;
    }

    if (endTime) {
      query += ` AND recorded_at <= $${paramIndex}`;
      params.push(endTime);
      paramIndex++;
    }

    query += ` ORDER BY recorded_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getRealtimeSystemMetrics(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM realtime_system_metrics`);
    return result.rows;
  }

  // SYSTEM HEALTH
  async recordHealthCheck(data: any): Promise<any> {
    const {
      componentName, componentType, status, isHealthy, responseTimeMs,
      errorMessage, errorDetails, checksPerformed, version, uptimeSeconds
    } = data;

    const result = await pool.query(
      `INSERT INTO system_health_checks (
        component_name, component_type, status, is_healthy, response_time_ms,
        error_message, error_details, checks_performed, version, uptime_seconds, checked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        componentName, componentType, status, isHealthy, responseTimeMs,
        errorMessage, errorDetails, checksPerformed, version, uptimeSeconds
      ]
    );

    return result.rows[0];
  }

  async getSystemHealthOverview(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM system_health_overview`);
    return result.rows;
  }

  async getSystemHealthScore(): Promise<number> {
    const result = await pool.query(`SELECT calculate_system_health_score() as score`);
    return result.rows[0]?.score || 0;
  }

  async getHealthCheckHistory(componentName: string, hours: number = 24): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM system_health_checks
       WHERE component_name = $1 AND checked_at > NOW() - INTERVAL '${hours} hours'
       ORDER BY checked_at DESC`,
      [componentName]
    );
    return result.rows;
  }

  // RESOURCE USAGE
  async recordResourceUsage(data: any): Promise<any> {
    const {
      resourceType, resourceName, currentValue, maxValue, usagePercentage,
      usageDetails, warningThreshold, criticalThreshold
    } = data;

    const isAboveWarning = usagePercentage >= warningThreshold;
    const isAboveCritical = usagePercentage >= criticalThreshold;

    const result = await pool.query(
      `INSERT INTO resource_usage (
        resource_type, resource_name, current_value, max_value, usage_percentage,
        usage_details, warning_threshold, critical_threshold, is_above_warning,
        is_above_critical, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        resourceType, resourceName, currentValue, maxValue, usagePercentage,
        usageDetails, warningThreshold, criticalThreshold, isAboveWarning, isAboveCritical
      ]
    );

    return result.rows[0];
  }

  async getResourceUsage(filters: any = {}): Promise<any[]> {
    const { resourceType, alertsOnly } = filters;
    let query = `SELECT * FROM resource_usage WHERE recorded_at > NOW() - INTERVAL '5 minutes'`;
    const params: any[] = [];

    if (resourceType) {
      query += ` AND resource_type = $1`;
      params.push(resourceType);
    }

    if (alertsOnly) {
      query += ` AND (is_above_warning = true OR is_above_critical = true)`;
    }

    query += ` ORDER BY recorded_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ERROR LOGS
  async logError(data: any): Promise<any> {
    const {
      errorCode, errorMessage, errorType, stackTrace, errorContext, serviceName,
      endpoint, method, filePath, lineNumber, requestId, userId, sessionId,
      ipAddress, userAgent, severity
    } = data;

    // Check if error already exists
    const existing = await pool.query(
      `SELECT * FROM error_logs
       WHERE error_code = $1 AND service_name = $2 AND is_resolved = false
       ORDER BY created_at DESC LIMIT 1`,
      [errorCode, serviceName]
    );

    if (existing.rows.length > 0) {
      // Update occurrence count
      const result = await pool.query(
        `UPDATE error_logs SET
          occurrence_count = occurrence_count + 1,
          last_occurred_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [existing.rows[0].id]
      );
      return result.rows[0];
    }

    // Create new error log
    const result = await pool.query(
      `INSERT INTO error_logs (
        error_code, error_message, error_type, stack_trace, error_context, service_name,
        endpoint, method, file_path, line_number, request_id, user_id, session_id,
        ip_address, user_agent, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        errorCode, errorMessage, errorType, stackTrace, errorContext, serviceName,
        endpoint, method, filePath, lineNumber, requestId, userId, sessionId,
        ipAddress, userAgent, severity
      ]
    );

    return result.rows[0];
  }

  async getErrorLogs(filters: any = {}): Promise<any[]> {
    const { serviceName, severity, resolved, limit = 100 } = filters;
    let query = `SELECT * FROM error_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (serviceName) {
      query += ` AND service_name = $${paramIndex}`;
      params.push(serviceName);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (resolved !== undefined) {
      query += ` AND is_resolved = $${paramIndex}`;
      params.push(resolved);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTopErrors(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM top_errors`);
    return result.rows;
  }

  async resolveError(errorId: string, resolvedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE error_logs SET
        is_resolved = true,
        resolved_at = NOW(),
        resolved_by = $2
      WHERE id = $1
      RETURNING *`,
      [errorId, resolvedBy]
    );

    return result.rows[0];
  }

  // PERFORMANCE METRICS
  async recordPerformanceMetric(data: any): Promise<any> {
    const {
      endpoint, method, serviceName, responseTimeMs, databaseTimeMs, cacheTimeMs,
      externalApiTimeMs, statusCode, isSuccess, isCached, requestCount, errorCount,
      memoryUsedMb, cpuTimeMs
    } = data;

    const result = await pool.query(
      `INSERT INTO performance_metrics (
        endpoint, method, service_name, response_time_ms, database_time_ms, cache_time_ms,
        external_api_time_ms, status_code, is_success, is_cached, request_count, error_count,
        memory_used_mb, cpu_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        endpoint, method, serviceName, responseTimeMs, databaseTimeMs, cacheTimeMs,
        externalApiTimeMs, statusCode, isSuccess, isCached, requestCount, errorCount,
        memoryUsedMb, cpuTimeMs
      ]
    );

    return result.rows[0];
  }

  async getPerformanceMetrics(filters: any = {}): Promise<any[]> {
    const { endpoint, serviceName, limit = 100 } = filters;
    let query = `SELECT * FROM performance_metrics WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (endpoint) {
      query += ` AND endpoint = $${paramIndex}`;
      params.push(endpoint);
      paramIndex++;
    }

    if (serviceName) {
      query += ` AND service_name = $${paramIndex}`;
      params.push(serviceName);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getSlowestEndpoints(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT endpoint, method, AVG(response_time_ms) as avg_response_time,
              MAX(response_time_ms) as max_response_time, COUNT(*) as request_count
       FROM performance_metrics
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY endpoint, method
       ORDER BY avg_response_time DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // ADMIN ACTIONS
  async logAdminAction(data: any): Promise<any> {
    const {
      adminId, adminEmail, adminRole, actionType, action, description,
      targetType, targetId, targetIdentifier, oldValues, newValues, changesSummary,
      success, errorMessage, ipAddress, userAgent, reason, notes,
      affectedUsersCount, affectedResourcesCount
    } = data;

    const result = await pool.query(
      `INSERT INTO admin_actions (
        admin_id, admin_email, admin_role, action_type, action, description,
        target_type, target_id, target_identifier, old_values, new_values, changes_summary,
        success, error_message, ip_address, user_agent, reason, notes,
        affected_users_count, affected_resources_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        adminId, adminEmail, adminRole, actionType, action, description,
        targetType, targetId, targetIdentifier, oldValues, newValues, changesSummary,
        success, errorMessage, ipAddress, userAgent, reason, notes,
        affectedUsersCount, affectedResourcesCount
      ]
    );

    return result.rows[0];
  }

  async getAdminActions(filters: any = {}): Promise<any[]> {
    const { adminId, actionType, targetType, limit = 100 } = filters;
    let query = `SELECT * FROM admin_actions WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (adminId) {
      query += ` AND admin_id = $${paramIndex}`;
      params.push(adminId);
      paramIndex++;
    }

    if (actionType) {
      query += ` AND action_type = $${paramIndex}`;
      params.push(actionType);
      paramIndex++;
    }

    if (targetType) {
      query += ` AND target_type = $${paramIndex}`;
      params.push(targetType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // SYSTEM ANNOUNCEMENTS
  async createAnnouncement(data: any): Promise<any> {
    const {
      title, message, announcementType, priority, isUrgent, targetAudience,
      targetOrganizations, targetUsers, showBanner, showNotification, dismissible,
      bannerColor, icon, startAt, endAt, actionUrl, actionLabel, createdBy
    } = data;

    const result = await pool.query(
      `INSERT INTO system_announcements (
        title, message, announcement_type, priority, is_urgent, target_audience,
        target_organizations, target_users, show_banner, show_notification, dismissible,
        banner_color, icon, start_at, end_at, action_url, action_label, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        title, message, announcementType, priority, isUrgent, targetAudience,
        targetOrganizations, targetUsers, showBanner, showNotification, dismissible,
        bannerColor, icon, startAt, endAt, actionUrl, actionLabel, createdBy
      ]
    );

    return result.rows[0];
  }

  async listAnnouncements(filters: any = {}): Promise<any[]> {
    const { activeOnly, priority } = filters;
    let query = `SELECT * FROM system_announcements WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (activeOnly) {
      query += ` AND is_active = true AND start_at <= NOW() AND (end_at IS NULL OR end_at >= NOW())`;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` ORDER BY priority DESC, start_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAnnouncement(announcementId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM system_announcements WHERE id = $1`,
      [announcementId]
    );
    return result.rows[0];
  }

  async updateAnnouncement(announcementId: string, updates: any): Promise<any> {
    const { title, message, priority, startAt, endAt, isActive } = updates;

    const result = await pool.query(
      `UPDATE system_announcements SET
        title = COALESCE($2, title),
        message = COALESCE($3, message),
        priority = COALESCE($4, priority),
        start_at = COALESCE($5, start_at),
        end_at = COALESCE($6, end_at),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [announcementId, title, message, priority, startAt, endAt, isActive]
    );

    return result.rows[0];
  }

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await pool.query(`DELETE FROM system_announcements WHERE id = $1`, [announcementId]);
  }

  async recordAnnouncementInteraction(announcementId: string, userId: string, interaction: string): Promise<any> {
    const field = interaction === 'view' ? 'viewed' :
                 interaction === 'dismiss' ? 'dismissed' :
                 interaction === 'click' ? 'clicked' : null;

    if (!field) {
      throw new Error('Invalid interaction type');
    }

    const result = await pool.query(
      `INSERT INTO announcement_interactions (announcement_id, user_id, ${field}, ${field}_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (announcement_id, user_id) DO UPDATE SET
         ${field} = true,
         ${field}_at = NOW()
       RETURNING *`,
      [announcementId, userId]
    );

    // Update count
    const countField = interaction === 'view' ? 'views_count' :
                      interaction === 'dismiss' ? 'dismissals_count' :
                      'clicks_count';

    await pool.query(
      `UPDATE system_announcements SET ${countField} = ${countField} + 1 WHERE id = $1`,
      [announcementId]
    );

    return result.rows[0];
  }

  // TENANT MANAGEMENT
  async createTenant(data: any): Promise<any> {
    const {
      tenantName, displayName, slug, contactEmail, contactPhone, planType,
      maxUsers, maxCourses, maxStorageGb, enabledFeatures, customDomain, customBranding
    } = data;

    const result = await pool.query(
      `INSERT INTO tenants (
        tenant_name, display_name, slug, contact_email, contact_phone, plan_type,
        max_users, max_courses, max_storage_gb, enabled_features, custom_domain, custom_branding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        tenantName, displayName, slug, contactEmail, contactPhone, planType,
        maxUsers, maxCourses, maxStorageGb, enabledFeatures, customDomain, customBranding
      ]
    );

    return result.rows[0];
  }

  async listTenants(filters: any = {}): Promise<any[]> {
    const { activeOnly, planType } = filters;
    let query = `SELECT * FROM tenant_overview WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (activeOnly) {
      query += ` AND is_active = true`;
    }

    if (planType) {
      query += ` AND plan_type = $${paramIndex}`;
      params.push(planType);
      paramIndex++;
    }

    query += ` ORDER BY tenant_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTenant(tenantId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);
    return result.rows[0];
  }

  async updateTenant(tenantId: string, updates: any): Promise<any> {
    const {
      displayName, contactEmail, planType, maxUsers, maxCourses, maxStorageGb,
      isActive, isSuspended, suspensionReason
    } = updates;

    const result = await pool.query(
      `UPDATE tenants SET
        display_name = COALESCE($2, display_name),
        contact_email = COALESCE($3, contact_email),
        plan_type = COALESCE($4, plan_type),
        max_users = COALESCE($5, max_users),
        max_courses = COALESCE($6, max_courses),
        max_storage_gb = COALESCE($7, max_storage_gb),
        is_active = COALESCE($8, is_active),
        is_suspended = COALESCE($9, is_suspended),
        suspension_reason = COALESCE($10, suspension_reason),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        tenantId, displayName, contactEmail, planType, maxUsers, maxCourses,
        maxStorageGb, isActive, isSuspended, suspensionReason
      ]
    );

    return result.rows[0];
  }

  async getTenantUsagePercentage(tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM get_tenant_usage_percentage($1)`,
      [tenantId]
    );
    return result.rows[0];
  }

  async recordTenantUsage(tenantId: string, date: string, metrics: any): Promise<any> {
    const {
      activeUsersCount, newUsersCount, totalUsersCount, activeCoursesCount,
      newCoursesCount, totalCoursesCount, totalLogins, totalPageViews,
      totalApiCalls, storageUsedGb, bandwidthUsedGb, avgSessionDurationMinutes,
      totalLearningTimeMinutes
    } = metrics;

    const result = await pool.query(
      `INSERT INTO tenant_usage (
        tenant_id, date, active_users_count, new_users_count, total_users_count,
        active_courses_count, new_courses_count, total_courses_count, total_logins,
        total_page_views, total_api_calls, storage_used_gb, bandwidth_used_gb,
        avg_session_duration_minutes, total_learning_time_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (tenant_id, date) DO UPDATE SET
        active_users_count = $3,
        new_users_count = $4,
        total_users_count = $5,
        active_courses_count = $6,
        new_courses_count = $7,
        total_courses_count = $8,
        total_logins = $9,
        total_page_views = $10,
        total_api_calls = $11,
        storage_used_gb = $12,
        bandwidth_used_gb = $13,
        avg_session_duration_minutes = $14,
        total_learning_time_minutes = $15
      RETURNING *`,
      [
        tenantId, date, activeUsersCount, newUsersCount, totalUsersCount, activeCoursesCount,
        newCoursesCount, totalCoursesCount, totalLogins, totalPageViews, totalApiCalls,
        storageUsedGb, bandwidthUsedGb, avgSessionDurationMinutes, totalLearningTimeMinutes
      ]
    );

    return result.rows[0];
  }

  // DASHBOARD
  async getDashboardSummary(): Promise<any> {
    const [
      healthScore,
      systemHealth,
      resourceUsage,
      topErrors,
      slowestEndpoints,
      recentAdminActions
    ] = await Promise.all([
      this.getSystemHealthScore(),
      this.getSystemHealthOverview(),
      this.getResourceUsage({ alertsOnly: true }),
      this.getTopErrors(),
      this.getSlowestEndpoints(10),
      this.getAdminActions({ limit: 10 })
    ]);

    return {
      healthScore,
      systemHealth,
      resourceUsage,
      topErrors,
      slowestEndpoints,
      recentAdminActions,
      generatedAt: new Date()
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
