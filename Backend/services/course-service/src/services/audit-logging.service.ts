import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LogAuditEventParams {
  eventType: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action: string;
  description?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: string;
  isSensitive?: boolean;
  category?: string;
  requestMethod?: string;
  requestPath?: string;
  requestBody?: any;
  responseStatus?: number;
}

interface LogSecurityEventParams {
  eventType: string;
  threatLevel: string;
  userId?: string;
  description: string;
  ipAddress: string;
  isBlocked?: boolean;
  details?: any;
  userAgent?: string;
  detectionMethod?: string;
  confidenceScore?: number;
  actionTaken?: string;
}

interface LogDataAccessParams {
  userId: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  dataSensitivity?: string;
  containsPii?: boolean;
  accessMethod?: string;
  ipAddress?: string;
  sessionId?: string;
  recordsAccessed?: number;
  wasSuccessful?: boolean;
  failureReason?: string;
}

interface LogComplianceEventParams {
  regulation: string;
  requirement: string;
  eventType: string;
  description: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  isCompliant: boolean;
  violations?: any[];
  evidence?: any;
}

interface LogSystemEventParams {
  eventType: string;
  severity?: string;
  component?: string;
  message: string;
  stackTrace?: string;
  errorCode?: string;
  durationMs?: number;
  metadata?: any;
}

// ============================================================================
// AUDIT LOGGING SERVICE
// ============================================================================

export class AuditLoggingService {
  // ========================================
  // AUDIT LOGS
  // ========================================

  async logAuditEvent(params: LogAuditEventParams): Promise<string> {
    const {
      eventType,
      actorId,
      entityType,
      entityId,
      action,
      description,
      changes,
      metadata,
      ipAddress,
      userAgent,
      sessionId,
      severity = 'info',
      isSensitive = false,
      category,
      requestMethod,
      requestPath,
      requestBody,
      responseStatus
    } = params;

    const result = await pool.query(
      `INSERT INTO audit_logs (
        event_type,
        severity,
        category,
        actor_id,
        entity_type,
        entity_id,
        action,
        description,
        changes,
        metadata,
        ip_address,
        user_agent,
        session_id,
        request_method,
        request_path,
        request_body,
        response_status,
        is_sensitive
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id`,
      [
        eventType,
        severity,
        category,
        actorId,
        entityType,
        entityId,
        action,
        description,
        changes ? JSON.stringify(changes) : null,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
        sessionId,
        requestMethod,
        requestPath,
        requestBody ? JSON.stringify(requestBody) : null,
        responseStatus,
        isSensitive
      ]
    );

    // Update audit trail if entity is specified
    if (entityType && entityId) {
      await this.updateAuditTrail(entityType, entityId, actorId, action, changes);
    }

    return result.rows[0].id;
  }

  async getAuditLogs(filters: any = {}): Promise<{ logs: any[]; total: number }> {
    const {
      actorId,
      entityType,
      entityId,
      eventType,
      severity,
      category,
      startDate,
      endDate,
      isSensitive,
      search,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT *
      FROM audit_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (actorId) {
      query += ` AND actor_id = $${paramIndex}`;
      params.push(actorId);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    if (entityId) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND occurred_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND occurred_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (isSensitive !== undefined) {
      query += ` AND is_sensitive = $${paramIndex}`;
      params.push(isSensitive);
      paramIndex++;
    }

    if (search) {
      query += ` AND (description ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');

    query += ` ORDER BY occurred_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async getAuditLog(logId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [logId]
    );

    return result.rows[0];
  }

  async getEntityAuditSummary(entityType: string, entityId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM get_entity_audit_summary($1, $2)`,
      [entityType, entityId]
    );

    return result.rows[0];
  }

  // ========================================
  // SECURITY EVENTS
  // ========================================

  async logSecurityEvent(params: LogSecurityEventParams): Promise<string> {
    const {
      eventType,
      threatLevel,
      userId,
      description,
      ipAddress,
      isBlocked = false,
      details,
      userAgent,
      detectionMethod,
      confidenceScore,
      actionTaken
    } = params;

    const result = await pool.query(
      `INSERT INTO security_events (
        event_type,
        threat_level,
        is_blocked,
        user_id,
        description,
        details,
        ip_address,
        user_agent,
        detection_method,
        confidence_score,
        action_taken
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        eventType,
        threatLevel,
        isBlocked,
        userId,
        description,
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
        detectionMethod,
        confidenceScore,
        actionTaken
      ]
    );

    return result.rows[0].id;
  }

  async getSecurityEvents(filters: any = {}): Promise<any[]> {
    const {
      userId,
      eventType,
      threatLevel,
      isBlocked,
      startDate,
      endDate,
      limit = 100
    } = filters;

    let query = `SELECT * FROM security_events WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (threatLevel) {
      query += ` AND threat_level = $${paramIndex}`;
      params.push(threatLevel);
      paramIndex++;
    }

    if (isBlocked !== undefined) {
      query += ` AND is_blocked = $${paramIndex}`;
      params.push(isBlocked);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async respondToSecurityEvent(
    eventId: string,
    respondedBy: string,
    actionTaken: string,
    resolutionNotes: string
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE security_events
      SET
        action_taken = $2,
        responded_at = NOW(),
        responded_by = $3,
        resolution_notes = $4
      WHERE id = $1
      RETURNING *`,
      [eventId, actionTaken, respondedBy, resolutionNotes]
    );

    return result.rows[0];
  }

  async getRecentSecurityAlerts(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM recent_security_alerts LIMIT 50`);
    return result.rows;
  }

  // ========================================
  // DATA ACCESS LOGS
  // ========================================

  async logDataAccess(params: LogDataAccessParams): Promise<string> {
    const {
      userId,
      resourceType,
      resourceId,
      action,
      dataSensitivity = 'internal',
      containsPii = false,
      accessMethod = 'api',
      ipAddress,
      sessionId,
      recordsAccessed = 1,
      wasSuccessful = true,
      failureReason
    } = params;

    // Get user details
    const userResult = await pool.query(
      `SELECT email, role FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    const result = await pool.query(
      `INSERT INTO data_access_logs (
        user_id,
        user_email,
        user_role,
        resource_type,
        resource_id,
        action,
        data_sensitivity,
        contains_pii,
        access_method,
        ip_address,
        session_id,
        records_accessed,
        was_successful,
        failure_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        userId,
        user?.email,
        user?.role,
        resourceType,
        resourceId,
        action,
        dataSensitivity,
        containsPii,
        accessMethod,
        ipAddress,
        sessionId,
        recordsAccessed,
        wasSuccessful,
        failureReason
      ]
    );

    return result.rows[0].id;
  }

  async getDataAccessLogs(filters: any = {}): Promise<any[]> {
    const {
      userId,
      resourceType,
      resourceId,
      action,
      containsPii,
      startDate,
      endDate,
      limit = 100
    } = filters;

    let query = `SELECT * FROM data_access_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (resourceType) {
      query += ` AND resource_type = $${paramIndex}`;
      params.push(resourceType);
      paramIndex++;
    }

    if (resourceId) {
      query += ` AND resource_id = $${paramIndex}`;
      params.push(resourceId);
      paramIndex++;
    }

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (containsPii !== undefined) {
      query += ` AND contains_pii = $${paramIndex}`;
      params.push(containsPii);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getSensitiveDataAccessSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM sensitive_data_access LIMIT 100`);
    return result.rows;
  }

  // ========================================
  // COMPLIANCE LOGS
  // ========================================

  async logComplianceEvent(params: LogComplianceEventParams): Promise<string> {
    const {
      regulation,
      requirement,
      eventType,
      description,
      userId,
      entityType,
      entityId,
      isCompliant,
      violations = [],
      evidence
    } = params;

    const result = await pool.query(
      `INSERT INTO compliance_logs (
        regulation,
        requirement,
        event_type,
        description,
        user_id,
        entity_type,
        entity_id,
        is_compliant,
        violations,
        evidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        regulation,
        requirement,
        eventType,
        description,
        userId,
        entityType,
        entityId,
        isCompliant,
        JSON.stringify(violations),
        evidence ? JSON.stringify(evidence) : null
      ]
    );

    return result.rows[0].id;
  }

  async getComplianceLogs(filters: any = {}): Promise<any[]> {
    const {
      regulation,
      userId,
      isCompliant,
      reviewed,
      limit = 100
    } = filters;

    let query = `SELECT * FROM compliance_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (regulation) {
      query += ` AND regulation = $${paramIndex}`;
      params.push(regulation);
      paramIndex++;
    }

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (isCompliant !== undefined) {
      query += ` AND is_compliant = $${paramIndex}`;
      params.push(isCompliant);
      paramIndex++;
    }

    if (reviewed !== undefined) {
      if (reviewed) {
        query += ` AND reviewed_at IS NOT NULL`;
      } else {
        query += ` AND reviewed_at IS NULL`;
      }
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async reviewComplianceLog(
    logId: string,
    reviewedBy: string,
    reviewNotes: string
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE compliance_logs
      SET
        reviewed_by = $2,
        reviewed_at = NOW(),
        review_notes = $3
      WHERE id = $1
      RETURNING *`,
      [logId, reviewedBy, reviewNotes]
    );

    return result.rows[0];
  }

  async getComplianceViolations(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM compliance_violations LIMIT 100`);
    return result.rows;
  }

  // ========================================
  // SYSTEM EVENTS
  // ========================================

  async logSystemEvent(params: LogSystemEventParams): Promise<string> {
    const {
      eventType,
      severity = 'info',
      component,
      message,
      stackTrace,
      errorCode,
      durationMs,
      metadata
    } = params;

    const result = await pool.query(
      `INSERT INTO system_events (
        event_type,
        severity,
        component,
        message,
        stack_trace,
        error_code,
        duration_ms,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        eventType,
        severity,
        component,
        message,
        stackTrace,
        errorCode,
        durationMs,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return result.rows[0].id;
  }

  async getSystemEvents(filters: any = {}): Promise<any[]> {
    const {
      eventType,
      severity,
      component,
      startDate,
      endDate,
      limit = 100
    } = filters;

    let query = `SELECT * FROM system_events WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (component) {
      query += ` AND component = $${paramIndex}`;
      params.push(component);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getCriticalSystemEvents(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM critical_system_events LIMIT 100`);
    return result.rows;
  }

  // ========================================
  // AUDIT TRAILS
  // ========================================

  async updateAuditTrail(
    entityType: string,
    entityId: string,
    actorId: string | undefined,
    action: string,
    changes: any
  ): Promise<void> {
    await pool.query(
      `INSERT INTO audit_trails (
        entity_type,
        entity_id,
        change_count,
        first_changed_at,
        last_changed_at,
        changes,
        created_by,
        last_modified_by,
        total_modifications
      ) VALUES ($1, $2, 1, NOW(), NOW(), ARRAY[$3::jsonb], $4, $4, 1)
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        change_count = audit_trails.change_count + 1,
        last_changed_at = NOW(),
        changes = audit_trails.changes || $3::jsonb,
        last_modified_by = $4,
        total_modifications = audit_trails.total_modifications + 1,
        updated_at = NOW()`,
      [
        entityType,
        entityId,
        JSON.stringify({
          timestamp: new Date(),
          actor_id: actorId,
          action,
          changes
        }),
        actorId
      ]
    );
  }

  async getAuditTrail(entityType: string, entityId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM audit_trails WHERE entity_type = $1 AND entity_id = $2`,
      [entityType, entityId]
    );

    return result.rows[0];
  }

  // ========================================
  // STATISTICS & REPORTS
  // ========================================

  async getUserActivitySummary(userId?: string): Promise<any[]> {
    let query = `SELECT * FROM user_activity_summary`;
    const params: any[] = [];

    if (userId) {
      query += ` WHERE actor_id = $1`;
      params.push(userId);
    }

    query += ` LIMIT 100`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAuditStatistics(days: number = 30): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM audit_statistics WHERE date >= NOW() - INTERVAL '${days} days' ORDER BY date DESC`
    );
    return result.rows;
  }

  // ========================================
  // MAINTENANCE
  // ========================================

  async cleanupAuditLogs(): Promise<number> {
    const result = await pool.query(`SELECT cleanup_audit_logs()`);
    return result.rows[0]?.cleanup_audit_logs || 0;
  }

  async exportAuditLogs(filters: any = {}): Promise<any[]> {
    const { logs } = await this.getAuditLogs({ ...filters, limit: 10000 });
    return logs;
  }
}

export const auditLoggingService = new AuditLoggingService();
