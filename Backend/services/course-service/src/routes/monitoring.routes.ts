import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoring.controller';
import { Pool } from 'pg';

export const createMonitoringRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new MonitoringController(pool);

  /**
   * @swagger
   * /api/monitoring/metrics:
   *   post:
   *     summary: Record a metric
   *     tags: [Monitoring - Metrics]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - metric_name
   *               - metric_type
   *               - value
   *             properties:
   *               metric_name:
   *                 type: string
   *                 example: "api_response_time"
   *               metric_type:
   *                 type: string
   *                 enum: [counter, gauge, histogram, summary]
   *                 example: "histogram"
   *               value:
   *                 type: number
   *                 example: 125.5
   *               unit:
   *                 type: string
   *                 example: "milliseconds"
   *               tags:
   *                 type: object
   *                 example: { "endpoint": "/api/courses", "method": "GET" }
   *               dimensions:
   *                 type: object
   *                 example: { "region": "us-east-1" }
   *     responses:
   *       201:
   *         description: Metric recorded successfully
   *       400:
   *         description: Invalid request
   */
  router.post('/metrics', controller.recordMetric);

  /**
   * @swagger
   * /api/monitoring/metrics:
   *   get:
   *     summary: Get metrics
   *     tags: [Monitoring - Metrics]
   *     parameters:
   *       - in: query
   *         name: metric_name
   *         schema:
   *           type: string
   *       - in: query
   *         name: metric_type
   *         schema:
   *           type: string
   *       - in: query
   *         name: start_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: end_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: tags
   *         schema:
   *           type: string
   *           description: JSON string of tags
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: List of metrics
   */
  router.get('/metrics', controller.getMetrics);

  /**
   * @swagger
   * /api/monitoring/metrics/{metric_name}/aggregates:
   *   get:
   *     summary: Get metric aggregates
   *     tags: [Monitoring - Metrics]
   *     parameters:
   *       - in: path
   *         name: metric_name
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: aggregation
   *         required: true
   *         schema:
   *           type: string
   *           enum: [avg, sum, min, max, count, p50, p95, p99]
   *       - in: query
   *         name: start_time
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: end_time
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: interval
   *         schema:
   *           type: string
   *           example: "1 hour"
   *     responses:
   *       200:
   *         description: Metric aggregates
   */
  router.get('/metrics/:metric_name/aggregates', controller.getMetricAggregates);

  /**
   * @swagger
   * /api/monitoring/metrics/cleanup:
   *   post:
   *     summary: Delete old metrics
   *     tags: [Monitoring - Metrics]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - days
   *             properties:
   *               days:
   *                 type: integer
   *                 example: 90
   *     responses:
   *       200:
   *         description: Old metrics deleted
   */
  router.post('/metrics/cleanup', controller.deleteOldMetrics);

  /**
   * @swagger
   * /api/monitoring/traces:
   *   post:
   *     summary: Create a trace
   *     tags: [Monitoring - Traces]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - trace_id
   *               - span_id
   *               - operation_name
   *               - service_name
   *               - start_time
   *               - end_time
   *             properties:
   *               trace_id:
   *                 type: string
   *                 example: "abc123"
   *               span_id:
   *                 type: string
   *                 example: "span456"
   *               parent_span_id:
   *                 type: string
   *               operation_name:
   *                 type: string
   *                 example: "GET /api/courses"
   *               service_name:
   *                 type: string
   *                 example: "course-service"
   *               start_time:
   *                 type: string
   *                 format: date-time
   *               end_time:
   *                 type: string
   *                 format: date-time
   *               tags:
   *                 type: object
   *               logs:
   *                 type: array
   *     responses:
   *       201:
   *         description: Trace created successfully
   */
  router.post('/traces', controller.createTrace);

  /**
   * @swagger
   * /api/monitoring/traces:
   *   get:
   *     summary: Get traces
   *     tags: [Monitoring - Traces]
   *     parameters:
   *       - in: query
   *         name: trace_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: service_name
   *         schema:
   *           type: string
   *       - in: query
   *         name: operation_name
   *         schema:
   *           type: string
   *       - in: query
   *         name: min_duration_ms
   *         schema:
   *           type: integer
   *       - in: query
   *         name: start_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: end_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: List of traces
   */
  router.get('/traces', controller.getTraces);

  /**
   * @swagger
   * /api/monitoring/traces/{trace_id}:
   *   get:
   *     summary: Get trace by ID
   *     tags: [Monitoring - Traces]
   *     parameters:
   *       - in: path
   *         name: trace_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Trace details with all spans
   *       404:
   *         description: Trace not found
   */
  router.get('/traces/:trace_id', controller.getTraceById);

  /**
   * @swagger
   * /api/monitoring/health-checks:
   *   post:
   *     summary: Record a health check
   *     tags: [Monitoring - Health]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - service_name
   *               - endpoint_url
   *               - status
   *               - response_time_ms
   *             properties:
   *               service_name:
   *                 type: string
   *                 example: "database"
   *               endpoint_url:
   *                 type: string
   *                 example: "/health"
   *               status:
   *                 type: string
   *                 enum: [healthy, degraded, unhealthy]
   *                 example: "healthy"
   *               response_time_ms:
   *                 type: number
   *                 example: 50
   *               status_code:
   *                 type: integer
   *                 example: 200
   *               error_message:
   *                 type: string
   *               dependencies:
   *                 type: object
   *     responses:
   *       201:
   *         description: Health check recorded
   */
  router.post('/health-checks', controller.recordHealthCheck);

  /**
   * @swagger
   * /api/monitoring/health-checks:
   *   get:
   *     summary: Get health checks
   *     tags: [Monitoring - Health]
   *     parameters:
   *       - in: query
   *         name: service_name
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of health checks
   */
  router.get('/health-checks', controller.getHealthChecks);

  /**
   * @swagger
   * /api/monitoring/health/overview:
   *   get:
   *     summary: Get system health overview
   *     tags: [Monitoring - Health]
   *     responses:
   *       200:
   *         description: System health overview
   */
  router.get('/health/overview', controller.getSystemHealthOverview);

  /**
   * @swagger
   * /api/monitoring/alerts:
   *   post:
   *     summary: Create an alert
   *     tags: [Monitoring - Alerts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - alert_name
   *               - severity
   *               - message
   *             properties:
   *               alert_name:
   *                 type: string
   *                 example: "High CPU Usage"
   *               alert_rule_id:
   *                 type: string
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *                 example: "high"
   *               message:
   *                 type: string
   *                 example: "CPU usage exceeded 90%"
   *               details:
   *                 type: object
   *               affected_service:
   *                 type: string
   *     responses:
   *       201:
   *         description: Alert created successfully
   */
  router.post('/alerts', controller.createAlert);

  /**
   * @swagger
   * /api/monitoring/alerts:
   *   get:
   *     summary: Get alerts
   *     tags: [Monitoring - Alerts]
   *     parameters:
   *       - in: query
   *         name: severity
   *         schema:
   *           type: string
   *           enum: [low, medium, high, critical]
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, acknowledged, resolved]
   *       - in: query
   *         name: start_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: List of alerts
   */
  router.get('/alerts', controller.getAlerts);

  /**
   * @swagger
   * /api/monitoring/alerts/{alert_id}/acknowledge:
   *   post:
   *     summary: Acknowledge an alert
   *     tags: [Monitoring - Alerts]
   *     parameters:
   *       - in: path
   *         name: alert_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - acknowledged_by
   *             properties:
   *               acknowledged_by:
   *                 type: string
   *     responses:
   *       200:
   *         description: Alert acknowledged
   */
  router.post('/alerts/:alert_id/acknowledge', controller.acknowledgeAlert);

  /**
   * @swagger
   * /api/monitoring/alerts/{alert_id}/resolve:
   *   post:
   *     summary: Resolve an alert
   *     tags: [Monitoring - Alerts]
   *     parameters:
   *       - in: path
   *         name: alert_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - resolved_by
   *             properties:
   *               resolved_by:
   *                 type: string
   *               resolution_notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Alert resolved
   */
  router.post('/alerts/:alert_id/resolve', controller.resolveAlert);

  /**
   * @swagger
   * /api/monitoring/alerts/summary:
   *   get:
   *     summary: Get active alerts summary
   *     tags: [Monitoring - Alerts]
   *     responses:
   *       200:
   *         description: Active alerts summary
   */
  router.get('/alerts/summary', controller.getActiveAlertsSummary);

  /**
   * @swagger
   * /api/monitoring/alert-rules:
   *   post:
   *     summary: Create an alert rule
   *     tags: [Monitoring - Alert Rules]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rule_name
   *               - metric_name
   *               - condition
   *               - threshold
   *               - severity
   *             properties:
   *               rule_name:
   *                 type: string
   *                 example: "High Response Time Alert"
   *               rule_description:
   *                 type: string
   *               metric_name:
   *                 type: string
   *                 example: "api_response_time"
   *               condition:
   *                 type: string
   *                 enum: [greater_than, less_than, equals, not_equals]
   *                 example: "greater_than"
   *               threshold:
   *                 type: number
   *                 example: 1000
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *                 example: "high"
   *               notification_channels:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Alert rule created
   */
  router.post('/alert-rules', controller.createAlertRule);

  /**
   * @swagger
   * /api/monitoring/alert-rules:
   *   get:
   *     summary: Get alert rules
   *     tags: [Monitoring - Alert Rules]
   *     parameters:
   *       - in: query
   *         name: is_enabled
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of alert rules
   */
  router.get('/alert-rules', controller.getAlertRules);

  /**
   * @swagger
   * /api/monitoring/alert-rules/{rule_id}:
   *   put:
   *     summary: Update an alert rule
   *     tags: [Monitoring - Alert Rules]
   *     parameters:
   *       - in: path
   *         name: rule_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               rule_name:
   *                 type: string
   *               condition:
   *                 type: string
   *               threshold:
   *                 type: number
   *               is_enabled:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Alert rule updated
   */
  router.put('/alert-rules/:rule_id', controller.updateAlertRule);

  /**
   * @swagger
   * /api/monitoring/alert-rules/{rule_id}:
   *   delete:
   *     summary: Delete an alert rule
   *     tags: [Monitoring - Alert Rules]
   *     parameters:
   *       - in: path
   *         name: rule_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Alert rule deleted
   */
  router.delete('/alert-rules/:rule_id', controller.deleteAlertRule);

  /**
   * @swagger
   * /api/monitoring/performance:
   *   post:
   *     summary: Record performance profile
   *     tags: [Monitoring - Performance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - endpoint
   *               - method
   *               - response_time_ms
   *               - status_code
   *             properties:
   *               endpoint:
   *                 type: string
   *               method:
   *                 type: string
   *               response_time_ms:
   *                 type: number
   *               status_code:
   *                 type: integer
   *               user_id:
   *                 type: string
   *               query_count:
   *                 type: integer
   *               cache_hit:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Performance profile recorded
   */
  router.post('/performance', controller.recordPerformanceProfile);

  /**
   * @swagger
   * /api/monitoring/slow-queries:
   *   get:
   *     summary: Get slow queries
   *     tags: [Monitoring - Performance]
   *     parameters:
   *       - in: query
   *         name: min_duration_ms
   *         schema:
   *           type: integer
   *           default: 1000
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: List of slow queries
   */
  router.get('/slow-queries', controller.getSlowQueries);

  /**
   * @swagger
   * /api/monitoring/errors:
   *   post:
   *     summary: Record an error
   *     tags: [Monitoring - Errors]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - error_type
   *               - error_message
   *             properties:
   *               error_type:
   *                 type: string
   *               error_message:
   *                 type: string
   *               stack_trace:
   *                 type: string
   *               endpoint:
   *                 type: string
   *               user_id:
   *                 type: string
   *               request_data:
   *                 type: object
   *     responses:
   *       201:
   *         description: Error recorded
   */
  router.post('/errors', controller.recordError);

  /**
   * @swagger
   * /api/monitoring/errors/rates:
   *   get:
   *     summary: Get error rates by endpoint
   *     tags: [Monitoring - Errors]
   *     responses:
   *       200:
   *         description: Error rates by endpoint
   */
  router.get('/errors/rates', controller.getErrorRateByEndpoint);

  /**
   * @swagger
   * /api/monitoring/sli:
   *   post:
   *     summary: Record SLI metric
   *     tags: [Monitoring - SLI/SLO]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sli_name
   *               - sli_type
   *               - value
   *               - target
   *               - is_good
   *             properties:
   *               sli_name:
   *                 type: string
   *               sli_type:
   *                 type: string
   *                 enum: [availability, latency, error_rate, throughput]
   *               value:
   *                 type: number
   *               target:
   *                 type: number
   *               is_good:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: SLI metric recorded
   */
  router.post('/sli', controller.recordSLIMetric);

  /**
   * @swagger
   * /api/monitoring/slo/compliance:
   *   get:
   *     summary: Get SLO compliance
   *     tags: [Monitoring - SLI/SLO]
   *     responses:
   *       200:
   *         description: SLO compliance data
   */
  router.get('/slo/compliance', controller.getSLOCompliance);

  /**
   * @swagger
   * /api/monitoring/anomalies:
   *   post:
   *     summary: Record an anomaly
   *     tags: [Monitoring - Anomalies]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - anomaly_type
   *               - metric_name
   *               - expected_value
   *               - actual_value
   *               - severity
   *             properties:
   *               anomaly_type:
   *                 type: string
   *                 enum: [spike, drop, trend_change, outlier]
   *               metric_name:
   *                 type: string
   *               expected_value:
   *                 type: number
   *               actual_value:
   *                 type: number
   *               severity:
   *                 type: string
   *                 enum: [low, medium, high, critical]
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Anomaly recorded
   */
  router.post('/anomalies', controller.recordAnomaly);

  /**
   * @swagger
   * /api/monitoring/anomalies:
   *   get:
   *     summary: Get anomalies
   *     tags: [Monitoring - Anomalies]
   *     parameters:
   *       - in: query
   *         name: severity
   *         schema:
   *           type: string
   *           enum: [low, medium, high, critical]
   *       - in: query
   *         name: start_time
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: List of anomalies
   */
  router.get('/anomalies', controller.getAnomalies);

  return router;
};
