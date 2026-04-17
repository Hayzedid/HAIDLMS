-- Webhooks & Event System Schema
-- External webhook integrations and internal event bus

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE webhook_event_type AS ENUM (
  'course.created', 'course.updated', 'course.deleted', 'course.published',
  'enrollment.created', 'enrollment.completed', 'enrollment.cancelled',
  'lesson.completed', 'module.completed',
  'assessment.submitted', 'assessment.graded',
  'certificate.issued',
  'badge.earned',
  'payment.succeeded', 'payment.failed', 'payment.refunded',
  'subscription.created', 'subscription.cancelled', 'subscription.renewed',
  'user.created', 'user.updated', 'user.deleted',
  'forum.thread.created', 'forum.reply.created',
  'review.created', 'review.updated'
);

CREATE TYPE webhook_status AS ENUM ('active', 'inactive', 'suspended', 'failed');
CREATE TYPE delivery_status AS ENUM ('pending', 'sending', 'success', 'failed', 'retrying');
CREATE TYPE event_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ========================================
-- 2. WEBHOOK ENDPOINTS
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Endpoint Details
  url VARCHAR(1000) NOT NULL,
  description TEXT,

  -- Authentication
  secret_key VARCHAR(255) NOT NULL, -- HMAC signature key
  auth_header VARCHAR(500), -- Optional custom auth header

  -- Event Subscription
  subscribed_events webhook_event_type[] NOT NULL DEFAULT '{}',

  -- Status
  status webhook_status DEFAULT 'active',
  is_enabled BOOLEAN DEFAULT true,

  -- Rate Limiting
  max_requests_per_minute INTEGER DEFAULT 60,

  -- Retry Configuration
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_endpoints_user ON webhook_endpoints(user_id);
CREATE INDEX idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX idx_webhook_endpoints_status ON webhook_endpoints(status);
CREATE INDEX idx_webhook_endpoints_enabled ON webhook_endpoints(is_enabled);

-- ========================================
-- 3. WEBHOOK EVENTS (Event Log)
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event Details
  event_type webhook_event_type NOT NULL,
  event_version VARCHAR(20) DEFAULT '1.0',

  -- Event Data
  payload JSONB NOT NULL,

  -- Source Information
  source_service VARCHAR(100) DEFAULT 'course-service',
  source_entity_type VARCHAR(100), -- e.g., 'course', 'enrollment'
  source_entity_id UUID,

  -- User Context
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Processing Status
  status event_status DEFAULT 'pending',
  processed_at TIMESTAMP,
  error_message TEXT,

  -- Idempotency
  idempotency_key VARCHAR(255) UNIQUE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_source_entity ON webhook_events(source_entity_type, source_entity_id);
CREATE INDEX idx_webhook_events_triggered_by ON webhook_events(triggered_by);
CREATE INDEX idx_webhook_events_idempotency ON webhook_events(idempotency_key);

-- ========================================
-- 4. WEBHOOK DELIVERIES
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,

  -- Delivery Details
  delivery_url VARCHAR(1000) NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',

  -- Request
  request_headers JSONB,
  request_body JSONB NOT NULL,
  signature VARCHAR(500), -- HMAC signature

  -- Response
  response_status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Status
  status delivery_status DEFAULT 'pending',
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,

  -- Timing
  scheduled_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  next_retry_at TIMESTAMP,

  -- Error Tracking
  error_message TEXT,
  error_code VARCHAR(50),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(webhook_event_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_scheduled ON webhook_deliveries(scheduled_at);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- ========================================
-- 5. EVENT SUBSCRIPTIONS (Internal)
-- ========================================

CREATE TABLE IF NOT EXISTS event_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Subscriber
  subscriber_type VARCHAR(50) NOT NULL, -- 'webhook', 'service', 'function'
  subscriber_id UUID, -- Reference to webhook_endpoint or other handler

  -- Event Filter
  event_types webhook_event_type[] NOT NULL,
  entity_type_filter VARCHAR(100), -- Optional entity type filter

  -- Conditions (JSONPath or SQL-like conditions)
  filter_conditions JSONB, -- e.g., {"payload.course_id": "abc-123"}

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority processed first

  -- Statistics
  events_received INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_subs_type ON event_subscriptions(subscriber_type);
CREATE INDEX idx_event_subs_active ON event_subscriptions(is_active);
CREATE INDEX idx_event_subs_priority ON event_subscriptions(priority DESC);

-- ========================================
-- 6. EVENT HANDLERS (Internal Processing)
-- ========================================

CREATE TABLE IF NOT EXISTS event_handlers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Handler Identity
  handler_name VARCHAR(100) NOT NULL UNIQUE,
  handler_type VARCHAR(50) NOT NULL, -- 'async', 'sync', 'batch'
  description TEXT,

  -- Event Configuration
  event_types webhook_event_type[] NOT NULL,

  -- Execution
  handler_function VARCHAR(255), -- Function/module path
  timeout_seconds INTEGER DEFAULT 30,

  -- Status
  is_enabled BOOLEAN DEFAULT true,

  -- Statistics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_execution_time_ms INTEGER,
  last_execution_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_handlers_name ON event_handlers(handler_name);
CREATE INDEX idx_event_handlers_enabled ON event_handlers(is_enabled);

-- ========================================
-- 7. EVENT HANDLER EXECUTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS event_handler_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  handler_id UUID NOT NULL REFERENCES event_handlers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,

  -- Execution Details
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  execution_time_ms INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed'
  result JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Retry
  attempt_number INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_handler_execs_handler ON event_handler_executions(handler_id);
CREATE INDEX idx_handler_execs_event ON event_handler_executions(event_id);
CREATE INDEX idx_handler_execs_status ON event_handler_executions(status);
CREATE INDEX idx_handler_execs_started ON event_handler_executions(started_at DESC);

-- ========================================
-- 8. WEBHOOK SIGNING KEYS
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_signing_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,

  -- Key Details
  key_name VARCHAR(100) NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL, -- Encrypted
  algorithm VARCHAR(50) DEFAULT 'HMAC-SHA256',

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,

  -- Usage
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_signing_keys_endpoint ON webhook_signing_keys(webhook_endpoint_id);
CREATE INDEX idx_signing_keys_active ON webhook_signing_keys(is_active);

-- ========================================
-- 9. WEBHOOK LOGS (Audit Trail)
-- ========================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  webhook_endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
  webhook_delivery_id UUID REFERENCES webhook_deliveries(id) ON DELETE SET NULL,

  -- Log Details
  log_level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
  log_message TEXT NOT NULL,
  log_data JSONB,

  -- Context
  action VARCHAR(100), -- 'endpoint.created', 'delivery.sent', 'delivery.failed'
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(webhook_endpoint_id);
CREATE INDEX idx_webhook_logs_delivery ON webhook_logs(webhook_delivery_id);
CREATE INDEX idx_webhook_logs_level ON webhook_logs(log_level);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- ========================================
-- 10. EVENT REPLAY QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS event_replay_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Replay Details
  event_ids UUID[] NOT NULL,
  webhook_endpoint_ids UUID[], -- If null, replay to all applicable endpoints

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  -- Progress
  total_events INTEGER NOT NULL,
  processed_events INTEGER DEFAULT 0,
  successful_events INTEGER DEFAULT 0,
  failed_events INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Requester
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_replay_queue_status ON event_replay_queue(status);
CREATE INDEX idx_replay_queue_requested ON event_replay_queue(requested_by);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Create and publish event
CREATE OR REPLACE FUNCTION publish_event(
  p_event_type webhook_event_type,
  p_payload JSONB,
  p_source_entity_type VARCHAR DEFAULT NULL,
  p_source_entity_id UUID DEFAULT NULL,
  p_triggered_by UUID DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Create event
  INSERT INTO webhook_events (
    event_type, payload, source_entity_type, source_entity_id,
    triggered_by, idempotency_key
  ) VALUES (
    p_event_type, p_payload, p_source_entity_type, p_source_entity_id,
    p_triggered_by, p_idempotency_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_event_id;

  -- If event was created (not duplicate), schedule deliveries
  IF v_event_id IS NOT NULL THEN
    INSERT INTO webhook_deliveries (
      webhook_endpoint_id, webhook_event_id, delivery_url, request_body
    )
    SELECT
      we.id,
      v_event_id,
      we.url,
      jsonb_build_object(
        'id', v_event_id,
        'event_type', p_event_type,
        'payload', p_payload,
        'created_at', NOW()
      )
    FROM webhook_endpoints we
    WHERE we.is_enabled = true
      AND we.status = 'active'
      AND p_event_type = ANY(we.subscribed_events);
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get pending deliveries
CREATE OR REPLACE FUNCTION get_pending_webhook_deliveries(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(
  delivery_id UUID,
  endpoint_id UUID,
  event_id UUID,
  delivery_url VARCHAR,
  request_body JSONB,
  attempt_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.id,
    wd.webhook_endpoint_id,
    wd.webhook_event_id,
    wd.delivery_url,
    wd.request_body,
    wd.attempt_number
  FROM webhook_deliveries wd
  WHERE (wd.status = 'pending' OR wd.status = 'retrying')
    AND (wd.scheduled_at <= NOW() OR wd.next_retry_at <= NOW())
    AND wd.attempt_number <= wd.max_attempts
  ORDER BY wd.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Update endpoint statistics
CREATE OR REPLACE FUNCTION update_webhook_endpoint_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE webhook_endpoints
    SET
      total_deliveries = total_deliveries + 1,
      successful_deliveries = successful_deliveries + 1,
      last_delivery_at = NEW.completed_at,
      last_success_at = NEW.completed_at,
      status = 'active'
    WHERE id = NEW.webhook_endpoint_id;
  ELSIF NEW.status = 'failed' AND NEW.attempt_number >= NEW.max_attempts THEN
    UPDATE webhook_endpoints
    SET
      total_deliveries = total_deliveries + 1,
      failed_deliveries = failed_deliveries + 1,
      last_delivery_at = NEW.completed_at,
      last_failure_at = NEW.completed_at,
      status = CASE
        WHEN failed_deliveries + 1 >= 10 THEN 'suspended'::webhook_status
        ELSE status
      END
    WHERE id = NEW.webhook_endpoint_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhook_stats
AFTER UPDATE OF status ON webhook_deliveries
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION update_webhook_endpoint_stats();

-- Function: Schedule retry for failed delivery
CREATE OR REPLACE FUNCTION schedule_webhook_retry()
RETURNS TRIGGER AS $$
DECLARE
  v_retry_delay INTEGER;
BEGIN
  IF NEW.status = 'failed' AND NEW.attempt_number < NEW.max_attempts THEN
    -- Calculate exponential backoff: 60s, 120s, 240s, etc.
    SELECT retry_delay_seconds INTO v_retry_delay
    FROM webhook_endpoints
    WHERE id = NEW.webhook_endpoint_id;

    v_retry_delay := v_retry_delay * POWER(2, NEW.attempt_number - 1);

    -- Schedule retry
    UPDATE webhook_deliveries
    SET
      status = 'retrying',
      next_retry_at = NOW() + (v_retry_delay || ' seconds')::INTERVAL,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_webhook_retry
AFTER UPDATE OF status ON webhook_deliveries
FOR EACH ROW
WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
EXECUTE FUNCTION schedule_webhook_retry();

-- ========================================
-- 12. VIEWS
-- ========================================

-- View: Webhook endpoint health
CREATE OR REPLACE VIEW webhook_endpoint_health AS
SELECT
  we.id,
  we.url,
  we.status,
  we.total_deliveries,
  we.successful_deliveries,
  we.failed_deliveries,
  CASE
    WHEN we.total_deliveries = 0 THEN 0
    ELSE ROUND((we.successful_deliveries::NUMERIC / we.total_deliveries::NUMERIC) * 100, 2)
  END AS success_rate,
  we.last_delivery_at,
  we.last_success_at,
  we.last_failure_at,
  CASE
    WHEN we.last_success_at IS NULL THEN 'never_succeeded'
    WHEN we.last_failure_at > we.last_success_at THEN 'failing'
    WHEN NOW() - we.last_success_at > INTERVAL '1 day' THEN 'stale'
    ELSE 'healthy'
  END AS health_status
FROM webhook_endpoints we;

-- View: Recent webhook events
CREATE OR REPLACE VIEW recent_webhook_events AS
SELECT
  we.id,
  we.event_type,
  we.status,
  we.source_entity_type,
  we.source_entity_id,
  u.full_name AS triggered_by_name,
  (SELECT COUNT(*) FROM webhook_deliveries wd WHERE wd.webhook_event_id = we.id) AS delivery_count,
  (SELECT COUNT(*) FROM webhook_deliveries wd WHERE wd.webhook_event_id = we.id AND wd.status = 'success') AS successful_deliveries,
  we.created_at
FROM webhook_events we
LEFT JOIN users u ON we.triggered_by = u.id
ORDER BY we.created_at DESC
LIMIT 1000;

-- View: Failed webhook deliveries
CREATE OR REPLACE VIEW failed_webhook_deliveries AS
SELECT
  wd.id,
  wd.webhook_endpoint_id,
  we.url AS endpoint_url,
  wd.webhook_event_id,
  wev.event_type,
  wd.attempt_number,
  wd.max_attempts,
  wd.error_message,
  wd.response_status_code,
  wd.completed_at,
  wd.next_retry_at
FROM webhook_deliveries wd
JOIN webhook_endpoints we ON wd.webhook_endpoint_id = we.id
JOIN webhook_events wev ON wd.webhook_event_id = wev.id
WHERE wd.status IN ('failed', 'retrying')
ORDER BY wd.created_at DESC;

COMMENT ON SCHEMA public IS 'Webhooks & Event System - External webhooks and internal event bus';
