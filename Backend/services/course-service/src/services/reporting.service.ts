import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateReportTemplateParams {
  name: string;
  description?: string;
  category?: string;
  templateType?: string;
  isPublic?: boolean;
  createdBy: string;
  organizationId?: string;
  dataSource: string;
  queryConfig?: any;
  availableFilters?: any;
  defaultFilters?: any;
  columns: any;
  defaultSort?: any;
  aggregations?: any;
  grouping?: any;
  chartConfig?: any;
  allowedFormats?: string[];
  pageOrientation?: string;
  requiredRole?: string;
  tags?: string[];
}

interface CreateCustomReportParams {
  name: string;
  description?: string;
  templateId?: string;
  createdBy: string;
  organizationId?: string;
  dataSource: string;
  queryConfig?: any;
  columns: any;
  filters?: any;
  sort?: any;
  aggregations?: any;
  grouping?: any;
  chartConfig?: any;
  limitRows?: number;
  includeCharts?: boolean;
  isPrivate?: boolean;
  sharedWith?: string[];
  tags?: string[];
}

interface ExecuteReportParams {
  reportId?: string;
  templateId?: string;
  executedBy: string;
  executionType?: string;
  filters?: any;
  dateRange?: any;
  exportFormat?: string;
}

interface CreateScheduledReportParams {
  reportId?: string;
  templateId?: string;
  name: string;
  description?: string;
  createdBy: string;
  organizationId?: string;
  frequency: string;
  cronExpression?: string;
  timezone?: string;
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  dateRangeType?: string;
  relativePeriod?: string;
  fixedStartDate?: string;
  fixedEndDate?: string;
  exportFormat?: string;
  includeCharts?: boolean;
  deliveryMethod?: string;
  recipients?: string[];
  emailSubject?: string;
  emailBody?: string;
}

// ============================================================================
// REPORTING SERVICE
// ============================================================================

export class ReportingService {
  // ========================================
  // REPORT TEMPLATES
  // ========================================

  async createReportTemplate(params: CreateReportTemplateParams): Promise<any> {
    const {
      name,
      description,
      category,
      templateType = 'custom',
      isPublic = false,
      createdBy,
      organizationId,
      dataSource,
      queryConfig,
      availableFilters,
      defaultFilters,
      columns,
      defaultSort,
      aggregations,
      grouping,
      chartConfig,
      allowedFormats = ['pdf', 'excel', 'csv'],
      pageOrientation = 'portrait',
      requiredRole,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO report_templates (
        name, description, category, template_type, is_public, created_by, organization_id,
        data_source, query_config, available_filters, default_filters, columns,
        default_sort, aggregations, grouping, chart_config, allowed_formats,
        page_orientation, required_role, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        name, description, category, templateType, isPublic, createdBy, organizationId || null,
        dataSource, queryConfig ? JSON.stringify(queryConfig) : null,
        availableFilters ? JSON.stringify(availableFilters) : null,
        defaultFilters ? JSON.stringify(defaultFilters) : null,
        JSON.stringify(columns), defaultSort ? JSON.stringify(defaultSort) : null,
        aggregations ? JSON.stringify(aggregations) : null,
        grouping ? JSON.stringify(grouping) : null,
        chartConfig ? JSON.stringify(chartConfig) : null,
        allowedFormats, pageOrientation, requiredRole, tags || []
      ]
    );

    return result.rows[0];
  }

  async getReportTemplate(templateId: string): Promise<any> {
    const result = await pool.query(
      `SELECT rt.*, u.name as creator_name
      FROM report_templates rt
      LEFT JOIN users u ON rt.created_by = u.id
      WHERE rt.id = $1`,
      [templateId]
    );

    return result.rows[0];
  }

  async listReportTemplates(filters: any = {}): Promise<{ templates: any[]; total: number }> {
    const { category, isPublic, organizationId, search, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT rt.*, u.name as creator_name
      FROM report_templates rt
      LEFT JOIN users u ON rt.created_by = u.id
      WHERE rt.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND rt.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      query += ` AND rt.is_public = $${paramIndex}`;
      params.push(isPublic);
      paramIndex++;
    }

    if (organizationId) {
      query += ` AND (rt.organization_id = $${paramIndex} OR rt.is_public = true)`;
      params.push(organizationId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (rt.name ILIKE $${paramIndex} OR rt.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT rt.*, u.name as creator_name', 'SELECT COUNT(DISTINCT rt.id) as total');

    query += ` ORDER BY rt.usage_count DESC, rt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      templates: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async updateReportTemplate(templateId: string, updates: any): Promise<any> {
    const allowedFields = [
      'name', 'description', 'category', 'available_filters', 'default_filters',
      'columns', 'default_sort', 'aggregations', 'grouping', 'chart_config',
      'allowed_formats', 'page_orientation', 'is_public', 'is_active', 'tags'
    ];

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

    values.push(templateId);
    const result = await pool.query(
      `UPDATE report_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteReportTemplate(templateId: string): Promise<void> {
    await pool.query(`UPDATE report_templates SET is_active = false WHERE id = $1`, [templateId]);
  }

  async getPopularTemplates(limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM popular_report_templates LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // ========================================
  // CUSTOM REPORTS
  // ========================================

  async createCustomReport(params: CreateCustomReportParams): Promise<any> {
    const {
      name,
      description,
      templateId,
      createdBy,
      organizationId,
      dataSource,
      queryConfig,
      columns,
      filters,
      sort,
      aggregations,
      grouping,
      chartConfig,
      limitRows = 1000,
      includeCharts = true,
      isPrivate = true,
      sharedWith,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO custom_reports (
        name, description, template_id, created_by, organization_id,
        data_source, query_config, columns, filters, sort, aggregations,
        grouping, chart_config, limit_rows, include_charts,
        is_private, shared_with, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name, description, templateId || null, createdBy, organizationId || null,
        dataSource, queryConfig ? JSON.stringify(queryConfig) : null,
        JSON.stringify(columns), filters ? JSON.stringify(filters) : null,
        sort ? JSON.stringify(sort) : null, aggregations ? JSON.stringify(aggregations) : null,
        grouping ? JSON.stringify(grouping) : null, chartConfig ? JSON.stringify(chartConfig) : null,
        limitRows, includeCharts, isPrivate, sharedWith || [], tags || []
      ]
    );

    return result.rows[0];
  }

  async getCustomReport(reportId: string): Promise<any> {
    const result = await pool.query(
      `SELECT cr.*, u.name as creator_name,
        rt.name as template_name
      FROM custom_reports cr
      JOIN users u ON cr.created_by = u.id
      LEFT JOIN report_templates rt ON cr.template_id = rt.id
      WHERE cr.id = $1`,
      [reportId]
    );

    return result.rows[0];
  }

  async listCustomReports(userId: string, filters: any = {}): Promise<{ reports: any[]; total: number }> {
    const { organizationId, templateId, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT cr.*, u.name as creator_name
      FROM custom_reports cr
      JOIN users u ON cr.created_by = u.id
      WHERE (cr.created_by = $1 OR $1 = ANY(cr.shared_with) OR cr.is_private = false)
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (organizationId) {
      query += ` AND cr.organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (templateId) {
      query += ` AND cr.template_id = $${paramIndex}`;
      params.push(templateId);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT cr.*, u.name as creator_name', 'SELECT COUNT(DISTINCT cr.id) as total');

    query += ` ORDER BY cr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      reports: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async updateCustomReport(reportId: string, updates: any): Promise<any> {
    const allowedFields = [
      'name', 'description', 'columns', 'filters', 'sort', 'aggregations',
      'grouping', 'chart_config', 'limit_rows', 'include_charts',
      'is_private', 'shared_with', 'tags'
    ];

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

    values.push(reportId);
    const result = await pool.query(
      `UPDATE custom_reports SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteCustomReport(reportId: string): Promise<void> {
    await pool.query(`DELETE FROM custom_reports WHERE id = $1`, [reportId]);
  }

  // ========================================
  // REPORT EXECUTIONS
  // ========================================

  async executeReport(params: ExecuteReportParams): Promise<any> {
    const {
      reportId,
      templateId,
      executedBy,
      executionType = 'manual',
      filters,
      dateRange,
      exportFormat
    } = params;

    // Start execution
    const executionResult = await pool.query(
      `INSERT INTO report_executions (
        report_id, template_id, executed_by, execution_type,
        filters, date_range, export_format, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'running')
      RETURNING *`,
      [
        reportId || null,
        templateId || null,
        executedBy,
        executionType,
        filters ? JSON.stringify(filters) : null,
        dateRange ? JSON.stringify(dateRange) : null,
        exportFormat
      ]
    );

    const execution = executionResult.rows[0];

    // Increment template usage if template was used
    if (templateId) {
      await pool.query(`SELECT increment_template_usage($1)`, [templateId]);
    }

    return execution;
  }

  async completeReportExecution(executionId: string, results: any): Promise<any> {
    const { rowCount, fileUrl, fileSize, status = 'completed', errorMessage } = results;

    const startTime = await pool.query(
      `SELECT started_at FROM report_executions WHERE id = $1`,
      [executionId]
    );

    const executionTimeMs = startTime.rows[0]
      ? Date.now() - new Date(startTime.rows[0].started_at).getTime()
      : 0;

    const result = await pool.query(
      `UPDATE report_executions
      SET status = $1,
          row_count = $2,
          file_url = $3,
          file_size = $4,
          execution_time_ms = $5,
          error_message = $6,
          completed_at = NOW()
      WHERE id = $7
      RETURNING *`,
      [status, rowCount, fileUrl, fileSize, executionTimeMs, errorMessage, executionId]
    );

    return result.rows[0];
  }

  async getReportExecution(executionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM recent_report_executions WHERE id = $1`,
      [executionId]
    );
    return result.rows[0];
  }

  async listReportExecutions(filters: any = {}): Promise<any[]> {
    const { reportId, executedBy, status, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM recent_report_executions WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (reportId) {
      query += ` AND report_id = $${paramIndex}`;
      params.push(reportId);
      paramIndex++;
    }

    if (executedBy) {
      query += ` AND executed_by = $${paramIndex}`;
      params.push(executedBy);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // SCHEDULED REPORTS
  // ========================================

  async createScheduledReport(params: CreateScheduledReportParams): Promise<any> {
    const {
      reportId,
      templateId,
      name,
      description,
      createdBy,
      organizationId,
      frequency,
      cronExpression,
      timezone = 'UTC',
      timeOfDay,
      dayOfWeek,
      dayOfMonth,
      dateRangeType = 'relative',
      relativePeriod,
      fixedStartDate,
      fixedEndDate,
      exportFormat = 'pdf',
      includeCharts = true,
      deliveryMethod = 'email',
      recipients,
      emailSubject,
      emailBody
    } = params;

    // Calculate next run time
    const nextRunResult = await pool.query(
      `SELECT calculate_next_run_time($1, $2, $3, $4, $5, $6) as next_run`,
      [frequency, timeOfDay, dayOfWeek, dayOfMonth, cronExpression, timezone]
    );

    const nextRunAt = nextRunResult.rows[0].next_run;

    const result = await pool.query(
      `INSERT INTO scheduled_reports (
        report_id, template_id, name, description, created_by, organization_id,
        frequency, cron_expression, timezone, time_of_day, day_of_week, day_of_month,
        date_range_type, relative_period, fixed_start_date, fixed_end_date,
        export_format, include_charts, delivery_method, recipients,
        email_subject, email_body, next_run_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        reportId || null, templateId || null, name, description, createdBy, organizationId || null,
        frequency, cronExpression, timezone, timeOfDay, dayOfWeek, dayOfMonth,
        dateRangeType, relativePeriod, fixedStartDate, fixedEndDate,
        exportFormat, includeCharts, deliveryMethod, recipients || [],
        emailSubject, emailBody, nextRunAt
      ]
    );

    return result.rows[0];
  }

  async getScheduledReport(scheduledReportId: string): Promise<any> {
    const result = await pool.query(
      `SELECT sr.*, cr.name as report_name, u.name as creator_name
      FROM scheduled_reports sr
      LEFT JOIN custom_reports cr ON sr.report_id = cr.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE sr.id = $1`,
      [scheduledReportId]
    );

    return result.rows[0];
  }

  async listScheduledReports(filters: any = {}): Promise<any[]> {
    const { organizationId, isActive, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT sr.*, cr.name as report_name
      FROM scheduled_reports sr
      LEFT JOIN custom_reports cr ON sr.report_id = cr.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (organizationId) {
      query += ` AND sr.organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND sr.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY sr.next_run_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateScheduledReport(scheduledReportId: string, updates: any): Promise<any> {
    const allowedFields = [
      'name', 'description', 'frequency', 'cron_expression', 'timezone',
      'time_of_day', 'day_of_week', 'day_of_month', 'date_range_type',
      'relative_period', 'export_format', 'include_charts', 'delivery_method',
      'recipients', 'email_subject', 'email_body', 'is_active'
    ];

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

    values.push(scheduledReportId);
    const result = await pool.query(
      `UPDATE scheduled_reports SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteScheduledReport(scheduledReportId: string): Promise<void> {
    await pool.query(`DELETE FROM scheduled_reports WHERE id = $1`, [scheduledReportId]);
  }

  async getDueScheduledReports(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM scheduled_reports_due`);
    return result.rows;
  }

  async updateScheduledReportAfterRun(scheduledReportId: string, executionId: string, success: boolean): Promise<void> {
    await pool.query(
      `SELECT update_scheduled_report_after_run($1, $2, $3)`,
      [scheduledReportId, executionId, success]
    );
  }

  // ========================================
  // DASHBOARDS
  // ========================================

  async createDashboard(params: any): Promise<any> {
    const {
      name,
      description,
      dashboardType = 'custom',
      createdBy,
      organizationId,
      layout,
      theme = 'light',
      widgetIds,
      isDefault = false,
      isPublic = false,
      sharedWith,
      autoRefresh = true,
      refreshInterval = 300
    } = params;

    const result = await pool.query(
      `INSERT INTO dashboards (
        name, description, dashboard_type, created_by, organization_id,
        layout, theme, widget_ids, is_default, is_public, shared_with,
        auto_refresh, refresh_interval
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name, description, dashboardType, createdBy, organizationId || null,
        layout ? JSON.stringify(layout) : null, theme, widgetIds || [],
        isDefault, isPublic, sharedWith || [], autoRefresh, refreshInterval
      ]
    );

    return result.rows[0];
  }

  async getDashboard(dashboardId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM dashboards WHERE id = $1`,
      [dashboardId]
    );
    return result.rows[0];
  }

  async listDashboards(userId: string, organizationId?: string): Promise<any[]> {
    let query = `
      SELECT d.*, u.name as creator_name
      FROM dashboards d
      JOIN users u ON d.created_by = u.id
      WHERE (d.created_by = $1 OR $1 = ANY(d.shared_with) OR d.is_public = true)
    `;

    const params: any[] = [userId];

    if (organizationId) {
      query += ` AND d.organization_id = $2`;
      params.push(organizationId);
    }

    query += ` ORDER BY d.is_default DESC, d.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateDashboard(dashboardId: string, updates: any): Promise<any> {
    const allowedFields = [
      'name', 'description', 'layout', 'theme', 'widget_ids',
      'is_public', 'shared_with', 'auto_refresh', 'refresh_interval'
    ];

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

    values.push(dashboardId);
    const result = await pool.query(
      `UPDATE dashboards SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    await pool.query(`DELETE FROM dashboards WHERE id = $1`, [dashboardId]);
  }

  // ========================================
  // EXPORT JOBS
  // ========================================

  async createExportJob(params: any): Promise<any> {
    const {
      jobType,
      exportFormat,
      sourceType,
      sourceId,
      queryConfig,
      requestedBy,
      organizationId
    } = params;

    const result = await pool.query(
      `INSERT INTO export_jobs (
        job_type, export_format, source_type, source_id, query_config,
        requested_by, organization_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued')
      RETURNING *`,
      [
        jobType, exportFormat, sourceType, sourceId,
        queryConfig ? JSON.stringify(queryConfig) : null,
        requestedBy, organizationId || null
      ]
    );

    return result.rows[0];
  }

  async updateExportJob(jobId: string, updates: any): Promise<any> {
    const {
      status,
      progress,
      fileUrl,
      fileName,
      fileSize,
      errorMessage
    } = updates;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      fields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;

      if (status === 'processing' && !updates.started_at) {
        fields.push(`started_at = NOW()`);
      }

      if (status === 'completed' || status === 'failed') {
        fields.push(`completed_at = NOW()`);
      }
    }

    if (progress !== undefined) {
      fields.push(`progress = $${paramIndex}`);
      values.push(progress);
      paramIndex++;
    }

    if (fileUrl) {
      fields.push(`file_url = $${paramIndex}`);
      values.push(fileUrl);
      paramIndex++;
    }

    if (fileName) {
      fields.push(`file_name = $${paramIndex}`);
      values.push(fileName);
      paramIndex++;
    }

    if (fileSize) {
      fields.push(`file_size = $${paramIndex}`);
      values.push(fileSize);
      paramIndex++;
    }

    if (errorMessage) {
      fields.push(`error_message = $${paramIndex}`);
      values.push(errorMessage);
      paramIndex++;
    }

    values.push(jobId);
    const result = await pool.query(
      `UPDATE export_jobs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async getExportJob(jobId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM export_jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0];
  }

  async listExportJobs(requestedBy: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM export_jobs WHERE requested_by = $1 ORDER BY created_at DESC LIMIT $2`,
      [requestedBy, limit]
    );
    return result.rows;
  }

  // ========================================
  // ANALYTICS METRICS
  // ========================================

  async recordMetric(params: any): Promise<any> {
    const {
      metricName,
      metricCategory,
      organizationId,
      courseId,
      userId,
      date,
      hour,
      value,
      valueInt,
      valueText,
      valueJson,
      tags
    } = params;

    const dateObj = new Date(date);

    const result = await pool.query(
      `INSERT INTO analytics_metrics (
        metric_name, metric_category, organization_id, course_id, user_id,
        date, hour, week, month, quarter, year,
        value, value_int, value_text, value_json, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        metricName, metricCategory, organizationId || null, courseId || null, userId || null,
        date, hour,
        Math.ceil((dateObj.getDate() + dateObj.getDay()) / 7), // week
        dateObj.getMonth() + 1, // month
        Math.ceil((dateObj.getMonth() + 1) / 3), // quarter
        dateObj.getFullYear(), // year
        value, valueInt, valueText, valueJson ? JSON.stringify(valueJson) : null,
        tags ? JSON.stringify(tags) : null
      ]
    );

    return result.rows[0];
  }

  async getMetrics(filters: any): Promise<any[]> {
    const {
      metricName,
      metricCategory,
      organizationId,
      courseId,
      fromDate,
      toDate,
      limit = 1000
    } = filters;

    let query = `SELECT * FROM analytics_metrics WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (metricName) {
      query += ` AND metric_name = $${paramIndex}`;
      params.push(metricName);
      paramIndex++;
    }

    if (metricCategory) {
      query += ` AND metric_category = $${paramIndex}`;
      params.push(metricCategory);
      paramIndex++;
    }

    if (organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (fromDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += ` ORDER BY date DESC, hour DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const reportingService = new ReportingService();
