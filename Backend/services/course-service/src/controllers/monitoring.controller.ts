import { Request, Response } from 'express';
import { MonitoringService } from '../services/monitoring.service';
import { Pool } from 'pg';

export class MonitoringController {
  private monitoringService: MonitoringService;

  constructor(pool: Pool) {
    this.monitoringService = new MonitoringService(pool);
  }

  // ========================================
  // METRICS
  // ========================================

  recordMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      const { metric_name, metric_type, value, unit, tags, dimensions } = req.body;

      if (!metric_name || !metric_type || value === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const metricId = await this.monitoringService.recordMetric({
        metric_name,
        metric_type,
        value,
        unit,
        tags,
        dimensions
      });

      res.status(201).json({ id: metricId, message: 'Metric recorded successfully' });
    } catch (error) {
      console.error('Error recording metric:', error);
      res.status(500).json({ error: 'Failed to record metric' });
    }
  };

  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        metric_name,
        metric_type,
        start_time,
        end_time,
        tags,
        limit,
        offset
      } = req.query;

      const metrics = await this.monitoringService.getMetrics({
        metric_name: metric_name as string,
        metric_type: metric_type as string,
        start_time: start_time ? new Date(start_time as string) : undefined,
        end_time: end_time ? new Date(end_time as string) : undefined,
        tags: tags ? JSON.parse(tags as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({ metrics, count: metrics.length });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  };

  getMetricAggregates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { metric_name } = req.params;
      const { aggregation, start_time, end_time, interval } = req.query;

      if (!aggregation || !start_time || !end_time) {
        res.status(400).json({ error: 'Missing required query parameters' });
        return;
      }

      const aggregates = await this.monitoringService.getMetricAggregates(
        metric_name,
        aggregation as string,
        new Date(start_time as string),
        new Date(end_time as string),
        interval as string
      );

      res.json({ metric_name, aggregation, aggregates });
    } catch (error) {
      console.error('Error fetching metric aggregates:', error);
      res.status(500).json({ error: 'Failed to fetch aggregates' });
    }
  };

  deleteOldMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { days } = req.body;

      if (!days || days < 1) {
        res.status(400).json({ error: 'Invalid days parameter' });
        return;
      }

      const deletedCount = await this.monitoringService.deleteOldMetrics(days);

      res.json({ message: 'Old metrics deleted', deleted_count: deletedCount });
    } catch (error) {
      console.error('Error deleting old metrics:', error);
      res.status(500).json({ error: 'Failed to delete metrics' });
    }
  };

  // ========================================
  // TRACES
  // ========================================

  createTrace = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        trace_id,
        span_id,
        parent_span_id,
        operation_name,
        service_name,
        start_time,
        end_time,
        tags,
        logs
      } = req.body;

      if (!trace_id || !span_id || !operation_name || !service_name || !start_time || !end_time) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const traceId = await this.monitoringService.createTrace({
        trace_id,
        span_id,
        parent_span_id,
        operation_name,
        service_name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        tags,
        logs
      });

      res.status(201).json({ id: traceId, message: 'Trace created successfully' });
    } catch (error) {
      console.error('Error creating trace:', error);
      res.status(500).json({ error: 'Failed to create trace' });
    }
  };

  getTraces = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        trace_id,
        service_name,
        operation_name,
        min_duration_ms,
        start_time,
        end_time,
        limit
      } = req.query;

      const traces = await this.monitoringService.getTraces({
        trace_id: trace_id as string,
        service_name: service_name as string,
        operation_name: operation_name as string,
        min_duration_ms: min_duration_ms ? parseInt(min_duration_ms as string) : undefined,
        start_time: start_time ? new Date(start_time as string) : undefined,
        end_time: end_time ? new Date(end_time as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ traces, count: traces.length });
    } catch (error) {
      console.error('Error fetching traces:', error);
      res.status(500).json({ error: 'Failed to fetch traces' });
    }
  };

  getTraceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trace_id } = req.params;

      const traces = await this.monitoringService.getTraceById(trace_id);

      if (traces.length === 0) {
        res.status(404).json({ error: 'Trace not found' });
        return;
      }

      res.json({ trace_id, spans: traces });
    } catch (error) {
      console.error('Error fetching trace:', error);
      res.status(500).json({ error: 'Failed to fetch trace' });
    }
  };

  // ========================================
  // HEALTH CHECKS
  // ========================================

  recordHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        service_name,
        endpoint_url,
        status,
        response_time_ms,
        status_code,
        error_message,
        dependencies
      } = req.body;

      if (!service_name || !endpoint_url || !status || response_time_ms === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const healthCheckId = await this.monitoringService.recordHealthCheck({
        service_name,
        endpoint_url,
        status,
        response_time_ms,
        status_code,
        error_message,
        dependencies
      });

      res.status(201).json({ id: healthCheckId, message: 'Health check recorded' });
    } catch (error) {
      console.error('Error recording health check:', error);
      res.status(500).json({ error: 'Failed to record health check' });
    }
  };

  getHealthChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { service_name } = req.query;

      const healthChecks = await this.monitoringService.getHealthChecks(service_name as string);

      res.json({ health_checks: healthChecks, count: healthChecks.length });
    } catch (error) {
      console.error('Error fetching health checks:', error);
      res.status(500).json({ error: 'Failed to fetch health checks' });
    }
  };

  getSystemHealthOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const overview = await this.monitoringService.getSystemHealthOverview();

      res.json({ system_health: overview });
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  };

  // ========================================
  // ALERTS
  // ========================================

  createAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        alert_name,
        alert_rule_id,
        severity,
        message,
        details,
        affected_service
      } = req.body;

      if (!alert_name || !severity || !message) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const alertId = await this.monitoringService.createAlert({
        alert_name,
        alert_rule_id,
        severity,
        message,
        details,
        affected_service
      });

      res.status(201).json({ id: alertId, message: 'Alert created successfully' });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  };

  getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { severity, status, start_time, limit } = req.query;

      const alerts = await this.monitoringService.getAlerts({
        severity: severity as string,
        status: status as string,
        start_time: start_time ? new Date(start_time as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ alerts, count: alerts.length });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  };

  acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alert_id } = req.params;
      const { acknowledged_by } = req.body;

      if (!acknowledged_by) {
        res.status(400).json({ error: 'acknowledged_by is required' });
        return;
      }

      await this.monitoringService.acknowledgeAlert(alert_id, acknowledged_by);

      res.json({ message: 'Alert acknowledged successfully' });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  };

  resolveAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alert_id } = req.params;
      const { resolved_by, resolution_notes } = req.body;

      if (!resolved_by) {
        res.status(400).json({ error: 'resolved_by is required' });
        return;
      }

      await this.monitoringService.resolveAlert(alert_id, resolved_by, resolution_notes);

      res.json({ message: 'Alert resolved successfully' });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  };

  getActiveAlertsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.monitoringService.getActiveAlertsSummary();

      res.json({ active_alerts: summary });
    } catch (error) {
      console.error('Error fetching active alerts summary:', error);
      res.status(500).json({ error: 'Failed to fetch alerts summary' });
    }
  };

  // ========================================
  // ALERT RULES
  // ========================================

  createAlertRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        rule_name,
        rule_description,
        metric_name,
        condition,
        threshold,
        severity,
        notification_channels
      } = req.body;

      if (!rule_name || !metric_name || !condition || threshold === undefined || !severity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const ruleId = await this.monitoringService.createAlertRule({
        rule_name,
        rule_description,
        metric_name,
        condition,
        threshold,
        severity,
        notification_channels
      });

      res.status(201).json({ id: ruleId, message: 'Alert rule created successfully' });
    } catch (error) {
      console.error('Error creating alert rule:', error);
      res.status(500).json({ error: 'Failed to create alert rule' });
    }
  };

  getAlertRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { is_enabled } = req.query;

      const rules = await this.monitoringService.getAlertRules(
        is_enabled !== undefined ? is_enabled === 'true' : undefined
      );

      res.json({ rules, count: rules.length });
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      res.status(500).json({ error: 'Failed to fetch alert rules' });
    }
  };

  updateAlertRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rule_id } = req.params;
      const updates = req.body;

      await this.monitoringService.updateAlertRule(rule_id, updates);

      res.json({ message: 'Alert rule updated successfully' });
    } catch (error) {
      console.error('Error updating alert rule:', error);
      res.status(500).json({ error: 'Failed to update alert rule' });
    }
  };

  deleteAlertRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rule_id } = req.params;

      await this.monitoringService.deleteAlertRule(rule_id);

      res.json({ message: 'Alert rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      res.status(500).json({ error: 'Failed to delete alert rule' });
    }
  };

  // ========================================
  // PERFORMANCE & ERRORS
  // ========================================

  recordPerformanceProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        endpoint,
        method,
        response_time_ms,
        status_code,
        user_id,
        query_count,
        cache_hit
      } = req.body;

      if (!endpoint || !method || response_time_ms === undefined || !status_code) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const profileId = await this.monitoringService.recordPerformanceProfile({
        endpoint,
        method,
        response_time_ms,
        status_code,
        user_id,
        query_count,
        cache_hit
      });

      res.status(201).json({ id: profileId, message: 'Performance profile recorded' });
    } catch (error) {
      console.error('Error recording performance profile:', error);
      res.status(500).json({ error: 'Failed to record performance profile' });
    }
  };

  getSlowQueries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { min_duration_ms, limit } = req.query;

      const slowQueries = await this.monitoringService.getSlowQueries(
        min_duration_ms ? parseInt(min_duration_ms as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );

      res.json({ slow_queries: slowQueries, count: slowQueries.length });
    } catch (error) {
      console.error('Error fetching slow queries:', error);
      res.status(500).json({ error: 'Failed to fetch slow queries' });
    }
  };

  recordError = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        error_type,
        error_message,
        stack_trace,
        endpoint,
        user_id,
        request_data
      } = req.body;

      if (!error_type || !error_message) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const errorId = await this.monitoringService.recordError({
        error_type,
        error_message,
        stack_trace,
        endpoint,
        user_id,
        request_data
      });

      res.status(201).json({ id: errorId, message: 'Error recorded successfully' });
    } catch (error) {
      console.error('Error recording error:', error);
      res.status(500).json({ error: 'Failed to record error' });
    }
  };

  getErrorRateByEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const errorRates = await this.monitoringService.getErrorRateByEndpoint();

      res.json({ error_rates: errorRates });
    } catch (error) {
      console.error('Error fetching error rates:', error);
      res.status(500).json({ error: 'Failed to fetch error rates' });
    }
  };

  // ========================================
  // SLI/SLO & ANOMALIES
  // ========================================

  recordSLIMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sli_name, sli_type, value, target, is_good } = req.body;

      if (!sli_name || !sli_type || value === undefined || target === undefined || is_good === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const sliId = await this.monitoringService.recordSLIMetric({
        sli_name,
        sli_type,
        value,
        target,
        is_good
      });

      res.status(201).json({ id: sliId, message: 'SLI metric recorded' });
    } catch (error) {
      console.error('Error recording SLI metric:', error);
      res.status(500).json({ error: 'Failed to record SLI metric' });
    }
  };

  getSLOCompliance = async (req: Request, res: Response): Promise<void> => {
    try {
      const compliance = await this.monitoringService.getSLOCompliance();

      res.json({ slo_compliance: compliance });
    } catch (error) {
      console.error('Error fetching SLO compliance:', error);
      res.status(500).json({ error: 'Failed to fetch SLO compliance' });
    }
  };

  recordAnomaly = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        anomaly_type,
        metric_name,
        expected_value,
        actual_value,
        severity,
        description
      } = req.body;

      if (!anomaly_type || !metric_name || expected_value === undefined || actual_value === undefined || !severity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const anomalyId = await this.monitoringService.recordAnomaly({
        anomaly_type,
        metric_name,
        expected_value,
        actual_value,
        severity,
        description
      });

      res.status(201).json({ id: anomalyId, message: 'Anomaly recorded' });
    } catch (error) {
      console.error('Error recording anomaly:', error);
      res.status(500).json({ error: 'Failed to record anomaly' });
    }
  };

  getAnomalies = async (req: Request, res: Response): Promise<void> => {
    try {
      const { severity, start_time, limit } = req.query;

      const anomalies = await this.monitoringService.getAnomalies({
        severity: severity as string,
        start_time: start_time ? new Date(start_time as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ anomalies, count: anomalies.length });
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      res.status(500).json({ error: 'Failed to fetch anomalies' });
    }
  };
}
