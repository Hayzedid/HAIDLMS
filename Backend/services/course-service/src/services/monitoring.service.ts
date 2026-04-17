import { Pool } from 'pg';

interface Metric {
  id: string;
  metric_name: string;
  metric_type: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

interface Trace {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  service_name: string;
  duration_ms: number;
  status: string;
  tags: Record<string, any>;
}

interface HealthCheck {
  id: string;
  service_name: string;
  status: string;
  response_time_ms: number;
  last_check_at: Date;
}

interface Alert {
  id: string;
  alert_name: string;
  severity: string;
  status: string;
  message: string;
  triggered_at: Date;
}

interface AlertRule {
  id: string;
  rule_name: string;
  metric_name: string;
  condition: string;
  threshold: number;
  is_enabled: boolean;
}

export class MonitoringService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // METRICS
  // ========================================

  async recordMetric(data: {
    metric_name: string;
    metric_type: string;
    value: number;
    unit?: string;
    tags?: Record<string, string>;
    dimensions?: Record<string, string>;
  }): Promise<string> {
    const query = `
      SELECT record_metric($1, $2, $3, $4, $5, $6) as metric_id
    `;

    const result = await this.pool.query(query, [
      data.metric_name,
      data.metric_type,
      data.value,
      data.unit || null,
      JSON.stringify(data.tags || {}),
      JSON.stringify(data.dimensions || {})
    ]);

    return result.rows[0].metric_id;
  }

  async getMetrics(filters: {
    metric_name?: string;
    metric_type?: string;
    start_time?: Date;
    end_time?: Date;
    tags?: Record<string, string>;
    limit?: number;
    offset?: number;
  }): Promise<Metric[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.metric_name) {
      conditions.push(`metric_name = $${paramIndex++}`);
      values.push(filters.metric_name);
    }

    if (filters.metric_type) {
      conditions.push(`metric_type = $${paramIndex++}`);
      values.push(filters.metric_type);
    }

    if (filters.start_time) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(filters.start_time);
    }

    if (filters.end_time) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(filters.end_time);
    }

    if (filters.tags) {
      conditions.push(`tags @> $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(filters.tags));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM metrics
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getMetricAggregates(
    metric_name: string,
    aggregation: string,
    start_time: Date,
    end_time: Date,
    interval?: string
  ): Promise<any> {
    const query = `
      SELECT * FROM get_metric_aggregates($1, $2, $3, $4, $5)
    `;

    const result = await this.pool.query(query, [
      metric_name,
      aggregation,
      start_time,
      end_time,
      interval || '1 hour'
    ]);

    return result.rows;
  }

  async deleteOldMetrics(days: number): Promise<number> {
    const query = `SELECT cleanup_old_metrics($1)`;
    const result = await this.pool.query(query, [days]);
    return result.rows[0].cleanup_old_metrics;
  }

  // ========================================
  // TRACES
  // ========================================

  async createTrace(data: {
    trace_id: string;
    span_id: string;
    parent_span_id?: string;
    operation_name: string;
    service_name: string;
    start_time: Date;
    end_time: Date;
    tags?: Record<string, any>;
    logs?: any[];
  }): Promise<string> {
    const duration_ms = data.end_time.getTime() - data.start_time.getTime();

    const query = `
      INSERT INTO traces (
        trace_id, span_id, parent_span_id, operation_name, service_name,
        start_time, end_time, duration_ms, tags, logs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.trace_id,
      data.span_id,
      data.parent_span_id || null,
      data.operation_name,
      data.service_name,
      data.start_time,
      data.end_time,
      duration_ms,
      JSON.stringify(data.tags || {}),
      JSON.stringify(data.logs || [])
    ]);

    return result.rows[0].id;
  }

  async getTraces(filters: {
    trace_id?: string;
    service_name?: string;
    operation_name?: string;
    min_duration_ms?: number;
    start_time?: Date;
    end_time?: Date;
    limit?: number;
  }): Promise<Trace[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.trace_id) {
      conditions.push(`trace_id = $${paramIndex++}`);
      values.push(filters.trace_id);
    }

    if (filters.service_name) {
      conditions.push(`service_name = $${paramIndex++}`);
      values.push(filters.service_name);
    }

    if (filters.operation_name) {
      conditions.push(`operation_name = $${paramIndex++}`);
      values.push(filters.operation_name);
    }

    if (filters.min_duration_ms) {
      conditions.push(`duration_ms >= $${paramIndex++}`);
      values.push(filters.min_duration_ms);
    }

    if (filters.start_time) {
      conditions.push(`start_time >= $${paramIndex++}`);
      values.push(filters.start_time);
    }

    if (filters.end_time) {
      conditions.push(`start_time <= $${paramIndex++}`);
      values.push(filters.end_time);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;

    const query = `
      SELECT * FROM traces
      ${whereClause}
      ORDER BY start_time DESC
      LIMIT $${paramIndex}
    `;

    values.push(limit);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getTraceById(trace_id: string): Promise<Trace[]> {
    const query = `
      SELECT * FROM traces
      WHERE trace_id = $1
      ORDER BY start_time ASC
    `;

    const result = await this.pool.query(query, [trace_id]);
    return result.rows;
  }

  // ========================================
  // HEALTH CHECKS
  // ========================================

  async recordHealthCheck(data: {
    service_name: string;
    endpoint_url: string;
    status: string;
    response_time_ms: number;
    status_code?: number;
    error_message?: string;
    dependencies?: Record<string, string>;
  }): Promise<string> {
    const query = `
      INSERT INTO health_checks (
        service_name, endpoint_url, status, response_time_ms,
        status_code, error_message, dependencies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.service_name,
      data.endpoint_url,
      data.status,
      data.response_time_ms,
      data.status_code || null,
      data.error_message || null,
      JSON.stringify(data.dependencies || {})
    ]);

    return result.rows[0].id;
  }

  async getHealthChecks(service_name?: string): Promise<HealthCheck[]> {
    const query = service_name
      ? `SELECT * FROM health_checks WHERE service_name = $1 ORDER BY last_check_at DESC LIMIT 20`
      : `SELECT * FROM health_checks ORDER BY last_check_at DESC LIMIT 100`;

    const result = service_name
      ? await this.pool.query(query, [service_name])
      : await this.pool.query(query);

    return result.rows;
  }

  async getSystemHealthOverview(): Promise<any> {
    const query = `SELECT * FROM system_health_overview`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ========================================
  // ALERTS
  // ========================================

  async createAlert(data: {
    alert_name: string;
    alert_rule_id?: string;
    severity: string;
    message: string;
    details?: Record<string, any>;
    affected_service?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO alerts (
        alert_name, alert_rule_id, severity, message,
        details, affected_service
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.alert_name,
      data.alert_rule_id || null,
      data.severity,
      data.message,
      JSON.stringify(data.details || {}),
      data.affected_service || null
    ]);

    return result.rows[0].id;
  }

  async getAlerts(filters: {
    severity?: string;
    status?: string;
    start_time?: Date;
    limit?: number;
  }): Promise<Alert[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex++}`);
      values.push(filters.severity);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.start_time) {
      conditions.push(`triggered_at >= $${paramIndex++}`);
      values.push(filters.start_time);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;

    const query = `
      SELECT * FROM alerts
      ${whereClause}
      ORDER BY triggered_at DESC
      LIMIT $${paramIndex}
    `;

    values.push(limit);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async acknowledgeAlert(alert_id: string, acknowledged_by: string): Promise<void> {
    const query = `
      UPDATE alerts
      SET status = 'acknowledged',
          acknowledged_by = $2,
          acknowledged_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [alert_id, acknowledged_by]);
  }

  async resolveAlert(alert_id: string, resolved_by: string, resolution_notes?: string): Promise<void> {
    const query = `
      UPDATE alerts
      SET status = 'resolved',
          resolved_by = $2,
          resolved_at = NOW(),
          resolution_notes = $3
      WHERE id = $1
    `;

    await this.pool.query(query, [alert_id, resolved_by, resolution_notes || null]);
  }

  async getActiveAlertsSummary(): Promise<any> {
    const query = `SELECT * FROM active_alerts_summary`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ========================================
  // ALERT RULES
  // ========================================

  async createAlertRule(data: {
    rule_name: string;
    rule_description?: string;
    metric_name: string;
    condition: string;
    threshold: number;
    severity: string;
    notification_channels?: string[];
  }): Promise<string> {
    const query = `
      INSERT INTO alert_rules (
        rule_name, rule_description, metric_name, condition,
        threshold, severity, notification_channels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.rule_name,
      data.rule_description || null,
      data.metric_name,
      data.condition,
      data.threshold,
      data.severity,
      data.notification_channels || []
    ]);

    return result.rows[0].id;
  }

  async getAlertRules(is_enabled?: boolean): Promise<AlertRule[]> {
    const query = is_enabled !== undefined
      ? `SELECT * FROM alert_rules WHERE is_enabled = $1 ORDER BY created_at DESC`
      : `SELECT * FROM alert_rules ORDER BY created_at DESC`;

    const result = is_enabled !== undefined
      ? await this.pool.query(query, [is_enabled])
      : await this.pool.query(query);

    return result.rows;
  }

  async updateAlertRule(rule_id: string, data: Partial<AlertRule>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.rule_name !== undefined) {
      updates.push(`rule_name = $${paramIndex++}`);
      values.push(data.rule_name);
    }

    if (data.condition !== undefined) {
      updates.push(`condition = $${paramIndex++}`);
      values.push(data.condition);
    }

    if (data.threshold !== undefined) {
      updates.push(`threshold = $${paramIndex++}`);
      values.push(data.threshold);
    }

    if (data.is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(rule_id);

    const query = `
      UPDATE alert_rules
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await this.pool.query(query, values);
  }

  async deleteAlertRule(rule_id: string): Promise<void> {
    const query = `DELETE FROM alert_rules WHERE id = $1`;
    await this.pool.query(query, [rule_id]);
  }

  // ========================================
  // PERFORMANCE PROFILING
  // ========================================

  async recordPerformanceProfile(data: {
    endpoint: string;
    method: string;
    response_time_ms: number;
    status_code: number;
    user_id?: string;
    query_count?: number;
    cache_hit?: boolean;
  }): Promise<string> {
    const query = `
      INSERT INTO performance_profiles (
        endpoint, method, response_time_ms, status_code,
        user_id, query_count, cache_hit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.endpoint,
      data.method,
      data.response_time_ms,
      data.status_code,
      data.user_id || null,
      data.query_count || null,
      data.cache_hit || null
    ]);

    return result.rows[0].id;
  }

  async getSlowQueries(min_duration_ms: number = 1000, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM slow_queries
      WHERE duration_ms >= $1
      ORDER BY duration_ms DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [min_duration_ms, limit]);
    return result.rows;
  }

  // ========================================
  // ERROR TRACKING
  // ========================================

  async recordError(data: {
    error_type: string;
    error_message: string;
    stack_trace?: string;
    endpoint?: string;
    user_id?: string;
    request_data?: Record<string, any>;
  }): Promise<string> {
    const query = `
      INSERT INTO error_tracking (
        error_type, error_message, stack_trace, endpoint,
        user_id, request_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.error_type,
      data.error_message,
      data.stack_trace || null,
      data.endpoint || null,
      data.user_id || null,
      JSON.stringify(data.request_data || {})
    ]);

    return result.rows[0].id;
  }

  async getErrorRateByEndpoint(): Promise<any> {
    const query = `SELECT * FROM error_rate_by_endpoint`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ========================================
  // SLI/SLO METRICS
  // ========================================

  async recordSLIMetric(data: {
    sli_name: string;
    sli_type: string;
    value: number;
    target: number;
    is_good: boolean;
  }): Promise<string> {
    const query = `
      INSERT INTO sli_metrics (
        sli_name, sli_type, value, target, is_good
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.sli_name,
      data.sli_type,
      data.value,
      data.target,
      data.is_good
    ]);

    return result.rows[0].id;
  }

  async getSLOCompliance(): Promise<any> {
    const query = `SELECT * FROM slo_compliance`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  // ========================================
  // ANOMALY DETECTION
  // ========================================

  async recordAnomaly(data: {
    anomaly_type: string;
    metric_name: string;
    expected_value: number;
    actual_value: number;
    severity: string;
    description?: string;
  }): Promise<string> {
    const deviation_percent = ((data.actual_value - data.expected_value) / data.expected_value) * 100;

    const query = `
      INSERT INTO anomalies (
        anomaly_type, metric_name, expected_value, actual_value,
        deviation_percent, severity, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.anomaly_type,
      data.metric_name,
      data.expected_value,
      data.actual_value,
      deviation_percent,
      data.severity,
      data.description || null
    ]);

    return result.rows[0].id;
  }

  async getAnomalies(filters: {
    severity?: string;
    start_time?: Date;
    limit?: number;
  }): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex++}`);
      values.push(filters.severity);
    }

    if (filters.start_time) {
      conditions.push(`detected_at >= $${paramIndex++}`);
      values.push(filters.start_time);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;

    const query = `
      SELECT * FROM anomalies
      ${whereClause}
      ORDER BY detected_at DESC
      LIMIT $${paramIndex}
    `;

    values.push(limit);

    const result = await this.pool.query(query, values);
    return result.rows;
  }
}
