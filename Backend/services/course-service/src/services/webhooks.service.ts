import pool from '../db/pool';
import crypto from 'crypto';

interface WebhookEndpoint {
  userId?: string;
  organizationId?: string;
  url: string;
  description?: string;
  subscribedEvents: string[];
  maxRequestsPerMinute?: number;
  maxRetries?: number;
  retryDelaySeconds?: number;
  metadata?: any;
}

interface WebhookEvent {
  eventType: string;
  payload: any;
  sourceEntityType?: string;
  sourceEntityId?: string;
  triggeredBy?: string;
  idempotencyKey?: string;
}

interface WebhookDeliveryFilters {
  webhookEndpointId?: string;
  webhookEventId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface EventSubscription {
  subscriberType: string;
  subscriberId?: string;
  eventTypes: string[];
  entityTypeFilter?: string;
  filterConditions?: any;
  priority?: number;
}

interface EventHandler {
  handlerName: string;
  handlerType: string;
  description?: string;
  eventTypes: string[];
  handlerFunction: string;
  timeoutSeconds?: number;
}

class WebhooksService {
  // ==================== WEBHOOK ENDPOINTS ====================

  async createWebhookEndpoint(data: WebhookEndpoint) {
    const secretKey = this.generateSecretKey();

    const result = await pool.query(
      `INSERT INTO webhook_endpoints (
        user_id, organization_id, url, description,
        subscribed_events, secret_key,
        max_requests_per_minute, max_retries, retry_delay_seconds,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *, secret_key AS webhook_secret`,
      [
        data.userId || null,
        data.organizationId || null,
        data.url,
        data.description || null,
        data.subscribedEvents,
        secretKey,
        data.maxRequestsPerMinute || 60,
        data.maxRetries || 3,
        data.retryDelaySeconds || 60,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );

    return result.rows[0];
  }

  async getWebhookEndpoints(userId?: string, organizationId?: string) {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      conditions.push(`user_id = $${paramCount}`);
      values.push(userId);
    }

    if (organizationId) {
      paramCount++;
      conditions.push(`organization_id = $${paramCount}`);
      values.push(organizationId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
        id, user_id, organization_id, url, description,
        subscribed_events, status, is_enabled,
        max_requests_per_minute, max_retries, retry_delay_seconds,
        total_deliveries, successful_deliveries, failed_deliveries,
        last_delivery_at, last_success_at, last_failure_at,
        metadata, created_at, updated_at
       FROM webhook_endpoints
       ${whereClause}
       ORDER BY created_at DESC`,
      values
    );

    return result.rows;
  }

  async getWebhookEndpoint(endpointId: string) {
    const result = await pool.query(
      `SELECT * FROM webhook_endpoints WHERE id = $1`,
      [endpointId]
    );

    return result.rows[0] || null;
  }

  async updateWebhookEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>) {
    const fields: string[] = [];
    const values: any[] = [endpointId];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return this.getWebhookEndpoint(endpointId);
    }

    fields.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE webhook_endpoints
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteWebhookEndpoint(endpointId: string) {
    await pool.query(
      `DELETE FROM webhook_endpoints WHERE id = $1`,
      [endpointId]
    );
  }

  async enableWebhookEndpoint(endpointId: string) {
    const result = await pool.query(
      `UPDATE webhook_endpoints
       SET is_enabled = true, status = 'active', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [endpointId]
    );

    return result.rows[0] || null;
  }

  async disableWebhookEndpoint(endpointId: string) {
    const result = await pool.query(
      `UPDATE webhook_endpoints
       SET is_enabled = false, status = 'inactive', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [endpointId]
    );

    return result.rows[0] || null;
  }

  async rotateWebhookSecret(endpointId: string) {
    const newSecret = this.generateSecretKey();

    const result = await pool.query(
      `UPDATE webhook_endpoints
       SET secret_key = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *, secret_key AS webhook_secret`,
      [endpointId, newSecret]
    );

    return result.rows[0] || null;
  }

  async getWebhookEndpointHealth() {
    const result = await pool.query(
      `SELECT * FROM webhook_endpoint_health ORDER BY success_rate ASC`
    );

    return result.rows;
  }

  // ==================== WEBHOOK EVENTS ====================

  async publishEvent(data: WebhookEvent) {
    const result = await pool.query(
      `SELECT publish_event($1, $2, $3, $4, $5, $6) AS event_id`,
      [
        data.eventType,
        JSON.stringify(data.payload),
        data.sourceEntityType || null,
        data.sourceEntityId || null,
        data.triggeredBy || null,
        data.idempotencyKey || null
      ]
    );

    return result.rows[0].event_id;
  }

  async getWebhookEvents(filters: {
    eventType?: string;
    status?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.eventType) {
      paramCount++;
      conditions.push(`event_type = $${paramCount}`);
      values.push(filters.eventType);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    if (filters.sourceEntityType) {
      paramCount++;
      conditions.push(`source_entity_type = $${paramCount}`);
      values.push(filters.sourceEntityType);
    }

    if (filters.sourceEntityId) {
      paramCount++;
      conditions.push(`source_entity_id = $${paramCount}`);
      values.push(filters.sourceEntityId);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await pool.query(
      `SELECT * FROM webhook_events
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...values, limit, offset]
    );

    return result.rows;
  }

  async getWebhookEvent(eventId: string) {
    const result = await pool.query(
      `SELECT * FROM webhook_events WHERE id = $1`,
      [eventId]
    );

    return result.rows[0] || null;
  }

  async getRecentWebhookEvents(limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM recent_webhook_events LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // ==================== WEBHOOK DELIVERIES ====================

  async getWebhookDeliveries(filters: WebhookDeliveryFilters) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.webhookEndpointId) {
      paramCount++;
      conditions.push(`webhook_endpoint_id = $${paramCount}`);
      values.push(filters.webhookEndpointId);
    }

    if (filters.webhookEventId) {
      paramCount++;
      conditions.push(`webhook_event_id = $${paramCount}`);
      values.push(filters.webhookEventId);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await pool.query(
      `SELECT * FROM webhook_deliveries
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...values, limit, offset]
    );

    return result.rows;
  }

  async getWebhookDelivery(deliveryId: string) {
    const result = await pool.query(
      `SELECT * FROM webhook_deliveries WHERE id = $1`,
      [deliveryId]
    );

    return result.rows[0] || null;
  }

  async getPendingDeliveries(limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM get_pending_webhook_deliveries($1)`,
      [limit]
    );

    return result.rows;
  }

  async markDeliveryAsSuccess(deliveryId: string, response: {
    statusCode: number;
    headers?: any;
    body?: string;
    responseTimeMs: number;
  }) {
    const result = await pool.query(
      `UPDATE webhook_deliveries
       SET
         status = 'success',
         response_status_code = $2,
         response_headers = $3,
         response_body = $4,
         response_time_ms = $5,
         completed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        deliveryId,
        response.statusCode,
        response.headers ? JSON.stringify(response.headers) : null,
        response.body || null,
        response.responseTimeMs
      ]
    );

    return result.rows[0] || null;
  }

  async markDeliveryAsFailed(deliveryId: string, error: {
    statusCode?: number;
    errorMessage: string;
    errorCode?: string;
    responseTimeMs?: number;
  }) {
    const result = await pool.query(
      `UPDATE webhook_deliveries
       SET
         status = 'failed',
         response_status_code = $2,
         error_message = $3,
         error_code = $4,
         response_time_ms = $5,
         attempt_number = attempt_number + 1,
         completed_at = NOW(),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        deliveryId,
        error.statusCode || null,
        error.errorMessage,
        error.errorCode || null,
        error.responseTimeMs || null
      ]
    );

    return result.rows[0] || null;
  }

  async getFailedDeliveries(limit: number = 100) {
    const result = await pool.query(
      `SELECT * FROM failed_webhook_deliveries LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  async retryDelivery(deliveryId: string) {
    const result = await pool.query(
      `UPDATE webhook_deliveries
       SET
         status = 'pending',
         next_retry_at = NULL,
         scheduled_at = NOW(),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [deliveryId]
    );

    return result.rows[0] || null;
  }

  // ==================== EVENT SUBSCRIPTIONS ====================

  async createEventSubscription(data: EventSubscription) {
    const result = await pool.query(
      `INSERT INTO event_subscriptions (
        subscriber_type, subscriber_id, event_types,
        entity_type_filter, filter_conditions, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.subscriberType,
        data.subscriberId || null,
        data.eventTypes,
        data.entityTypeFilter || null,
        data.filterConditions ? JSON.stringify(data.filterConditions) : null,
        data.priority || 0
      ]
    );

    return result.rows[0];
  }

  async getEventSubscriptions(subscriberType?: string) {
    const query = subscriberType
      ? `SELECT * FROM event_subscriptions WHERE subscriber_type = $1 AND is_active = true ORDER BY priority DESC`
      : `SELECT * FROM event_subscriptions WHERE is_active = true ORDER BY priority DESC`;

    const params = subscriberType ? [subscriberType] : [];
    const result = await pool.query(query, params);

    return result.rows;
  }

  async deleteEventSubscription(subscriptionId: string) {
    await pool.query(
      `DELETE FROM event_subscriptions WHERE id = $1`,
      [subscriptionId]
    );
  }

  // ==================== EVENT HANDLERS ====================

  async createEventHandler(data: EventHandler) {
    const result = await pool.query(
      `INSERT INTO event_handlers (
        handler_name, handler_type, description,
        event_types, handler_function, timeout_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.handlerName,
        data.handlerType,
        data.description || null,
        data.eventTypes,
        data.handlerFunction,
        data.timeoutSeconds || 30
      ]
    );

    return result.rows[0];
  }

  async getEventHandlers(eventType?: string) {
    const query = eventType
      ? `SELECT * FROM event_handlers WHERE $1 = ANY(event_types) AND is_enabled = true`
      : `SELECT * FROM event_handlers WHERE is_enabled = true`;

    const params = eventType ? [eventType] : [];
    const result = await pool.query(query, params);

    return result.rows;
  }

  async executeEventHandler(handlerId: string, eventId: string) {
    const result = await pool.query(
      `INSERT INTO event_handler_executions (
        handler_id, event_id, started_at
      ) VALUES ($1, $2, NOW())
      RETURNING *`,
      [handlerId, eventId]
    );

    return result.rows[0];
  }

  async recordHandlerExecution(executionId: string, result: {
    status: string;
    executionTimeMs: number;
    result?: any;
    errorMessage?: string;
    errorStack?: string;
  }) {
    const queryResult = await pool.query(
      `UPDATE event_handler_executions
       SET
         status = $2,
         execution_time_ms = $3,
         result = $4,
         error_message = $5,
         error_stack = $6,
         completed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        executionId,
        result.status,
        result.executionTimeMs,
        result.result ? JSON.stringify(result.result) : null,
        result.errorMessage || null,
        result.errorStack || null
      ]
    );

    // Update handler statistics
    await pool.query(
      `UPDATE event_handlers
       SET
         total_executions = total_executions + 1,
         successful_executions = successful_executions + CASE WHEN $2 = 'success' THEN 1 ELSE 0 END,
         failed_executions = failed_executions + CASE WHEN $2 = 'failed' THEN 1 ELSE 0 END,
         last_execution_at = NOW()
       WHERE id = (SELECT handler_id FROM event_handler_executions WHERE id = $1)`,
      [executionId, result.status]
    );

    return queryResult.rows[0] || null;
  }

  // ==================== WEBHOOK LOGS ====================

  async logWebhookAction(data: {
    webhookEndpointId?: string;
    webhookDeliveryId?: string;
    logLevel: string;
    logMessage: string;
    logData?: any;
    action?: string;
    actorUserId?: string;
  }) {
    await pool.query(
      `INSERT INTO webhook_logs (
        webhook_endpoint_id, webhook_delivery_id,
        log_level, log_message, log_data,
        action, actor_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.webhookEndpointId || null,
        data.webhookDeliveryId || null,
        data.logLevel,
        data.logMessage,
        data.logData ? JSON.stringify(data.logData) : null,
        data.action || null,
        data.actorUserId || null
      ]
    );
  }

  async getWebhookLogs(filters: {
    webhookEndpointId?: string;
    webhookDeliveryId?: string;
    logLevel?: string;
    limit?: number;
  }) {
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.webhookEndpointId) {
      paramCount++;
      conditions.push(`webhook_endpoint_id = $${paramCount}`);
      values.push(filters.webhookEndpointId);
    }

    if (filters.webhookDeliveryId) {
      paramCount++;
      conditions.push(`webhook_delivery_id = $${paramCount}`);
      values.push(filters.webhookDeliveryId);
    }

    if (filters.logLevel) {
      paramCount++;
      conditions.push(`log_level = $${paramCount}`);
      values.push(filters.logLevel);
    }

    const limit = filters.limit || 100;

    const result = await pool.query(
      `SELECT * FROM webhook_logs
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1}`,
      [...values, limit]
    );

    return result.rows;
  }

  // ==================== EVENT REPLAY ====================

  async createEventReplay(data: {
    eventIds: string[];
    webhookEndpointIds?: string[];
    requestedBy: string;
    reason?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO event_replay_queue (
        event_ids, webhook_endpoint_ids, total_events,
        requested_by, reason
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.eventIds,
        data.webhookEndpointIds || null,
        data.eventIds.length,
        data.requestedBy,
        data.reason || null
      ]
    );

    return result.rows[0];
  }

  async getEventReplays(requestedBy?: string) {
    const query = requestedBy
      ? `SELECT * FROM event_replay_queue WHERE requested_by = $1 ORDER BY created_at DESC`
      : `SELECT * FROM event_replay_queue ORDER BY created_at DESC`;

    const params = requestedBy ? [requestedBy] : [];
    const result = await pool.query(query, params);

    return result.rows;
  }

  async updateEventReplayProgress(replayId: string, progress: {
    processedEvents: number;
    successfulEvents: number;
    failedEvents: number;
    status?: string;
  }) {
    const result = await pool.query(
      `UPDATE event_replay_queue
       SET
         processed_events = $2,
         successful_events = $3,
         failed_events = $4,
         status = COALESCE($5, status),
         started_at = COALESCE(started_at, NOW()),
         completed_at = CASE WHEN $5 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
       WHERE id = $1
       RETURNING *`,
      [
        replayId,
        progress.processedEvents,
        progress.successfulEvents,
        progress.failedEvents,
        progress.status || null
      ]
    );

    return result.rows[0] || null;
  }

  // ==================== UTILITY METHODS ====================

  private generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateWebhookSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // ==================== STATISTICS ====================

  async getWebhookStatistics(webhookEndpointId?: string) {
    const condition = webhookEndpointId ? `WHERE webhook_endpoint_id = $1` : '';
    const params = webhookEndpointId ? [webhookEndpointId] : [];

    const result = await pool.query(
      `SELECT
        COUNT(*) AS total_deliveries,
        COUNT(*) FILTER (WHERE status = 'success') AS successful_deliveries,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_deliveries,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_deliveries,
        COUNT(*) FILTER (WHERE status = 'retrying') AS retrying_deliveries,
        AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) AS avg_response_time_ms,
        MAX(completed_at) AS last_delivery_at
       FROM webhook_deliveries
       ${condition}`,
      params
    );

    return result.rows[0];
  }

  async getEventStatistics(eventType?: string) {
    const condition = eventType ? `WHERE event_type = $1` : '';
    const params = eventType ? [eventType] : [];

    const result = await pool.query(
      `SELECT
        event_type,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_events,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_events,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_events,
        MAX(created_at) AS last_event_at
       FROM webhook_events
       ${condition}
       GROUP BY event_type
       ORDER BY total_events DESC`,
      params
    );

    return eventType ? result.rows[0] || null : result.rows;
  }
}

export const webhooksService = new WebhooksService();
