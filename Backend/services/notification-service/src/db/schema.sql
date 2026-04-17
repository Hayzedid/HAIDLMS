-- TechLearn Notification Service Schema

-- ── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE notification_channel AS ENUM ('email', 'slack', 'in_app', 'push', 'sms');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE notification_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled');
CREATE TYPE notification_type AS ENUM (
  'course_enrollment',
  'lesson_completed',
  'assignment_due',
  'certificate_issued',
  'comment_reply',
  'course_update',
  'announcement',
  'review_reminder',
  'spaced_repetition',
  'payment_success',
  'payment_failed',
  'system_alert'
);

-- ── Notification Templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL UNIQUE,
  type              notification_type NOT NULL,
  channel           notification_channel NOT NULL,

  -- Template content (Handlebars syntax)
  subject_template  TEXT,  -- For email/push
  body_template     TEXT NOT NULL,

  -- Metadata
  variables         JSONB,  -- Expected variables: [{name, description, required}]
  default_priority  notification_priority NOT NULL DEFAULT 'normal',

  -- Versioning
  version           INT NOT NULL DEFAULT 1,
  is_active         BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(name, version)
);

-- ── Notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,  -- Recipient

  -- Classification
  type              notification_type NOT NULL,
  channel           notification_channel NOT NULL,
  priority          notification_priority NOT NULL DEFAULT 'normal',

  -- Content
  subject           VARCHAR(500),
  body              TEXT NOT NULL,
  action_url        VARCHAR(1000),  -- Deep link or web URL
  metadata          JSONB,  -- Additional data (course_id, lesson_id, etc.)

  -- Template info (if used)
  template_id       UUID REFERENCES notification_templates(id),
  template_variables JSONB,

  -- Delivery status
  status            notification_status NOT NULL DEFAULT 'pending',
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  failed_at         TIMESTAMPTZ,
  failure_reason    TEXT,

  -- In-app specific
  read_at           TIMESTAMPTZ,
  clicked_at        TIMESTAMPTZ,

  -- Retry logic
  retry_count       INT NOT NULL DEFAULT 0,
  max_retries       INT NOT NULL DEFAULT 3,
  next_retry_at     TIMESTAMPTZ,

  -- Scheduling
  scheduled_for     TIMESTAMPTZ,  -- Null = send immediately
  expires_at        TIMESTAMPTZ,  -- Optional expiry

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notification Preferences ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,

  -- Channel preferences
  email_enabled     BOOLEAN NOT NULL DEFAULT true,
  slack_enabled     BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled    BOOLEAN NOT NULL DEFAULT true,
  push_enabled      BOOLEAN NOT NULL DEFAULT true,
  sms_enabled       BOOLEAN NOT NULL DEFAULT false,

  -- Type-specific preferences (JSONB for flexibility)
  -- Format: {type: {email: true, slack: false, in_app: true, ...}}
  type_preferences  JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Delivery settings
  email_digest      BOOLEAN NOT NULL DEFAULT false,  -- Bundle emails
  digest_frequency  VARCHAR(20) DEFAULT 'daily',  -- 'daily', 'weekly'
  quiet_hours_start TIME,  -- E.g., '22:00:00'
  quiet_hours_end   TIME,  -- E.g., '08:00:00'
  timezone          VARCHAR(50) DEFAULT 'UTC',

  -- Integrations
  slack_webhook_url VARCHAR(500),
  slack_channel     VARCHAR(100),
  push_tokens       JSONB,  -- Array of device tokens
  phone_number      VARCHAR(20),  -- For SMS

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ── Notification Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID REFERENCES notifications(id) ON DELETE CASCADE,

  -- Event tracking
  event             VARCHAR(50) NOT NULL,  -- 'queued', 'sent', 'delivered', 'opened', 'clicked', 'failed'
  channel           notification_channel NOT NULL,

  -- Details
  provider          VARCHAR(100),  -- 'sendgrid', 'slack', 'fcm', etc.
  provider_id       VARCHAR(255),  -- External tracking ID
  response_data     JSONB,
  error_message     TEXT,

  -- Metadata
  ip_address        INET,
  user_agent        TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Spaced Repetition Schedule ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spaced_repetition_schedule (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  content_id        UUID NOT NULL,  -- Lesson, module, or course ID
  content_type      VARCHAR(50) NOT NULL,  -- 'lesson', 'module', 'course'

  -- Learning metrics (SM-2 Algorithm)
  easiness_factor   DECIMAL(3,2) NOT NULL DEFAULT 2.5,  -- E-Factor (1.3 - 2.5)
  repetition_number INT NOT NULL DEFAULT 0,  -- n
  interval_days     INT NOT NULL DEFAULT 1,  -- I(n)

  -- Review tracking
  last_reviewed_at  TIMESTAMPTZ,
  next_review_at    TIMESTAMPTZ NOT NULL,
  review_count      INT NOT NULL DEFAULT 0,

  -- Quality responses (history)
  quality_history   JSONB,  -- [{date, quality: 0-5, interval}]

  -- Status
  is_active         BOOLEAN NOT NULL DEFAULT true,
  paused_until      TIMESTAMPTZ,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, content_id, content_type)
);

-- ── Notification Queue Stats ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_queue_stats (
  date              DATE NOT NULL,
  channel           notification_channel NOT NULL,
  type              notification_type NOT NULL,

  -- Counts
  total_queued      INT NOT NULL DEFAULT 0,
  total_sent        INT NOT NULL DEFAULT 0,
  total_delivered   INT NOT NULL DEFAULT 0,
  total_failed      INT NOT NULL DEFAULT 0,
  total_opened      INT NOT NULL DEFAULT 0,  -- In-app/email
  total_clicked     INT NOT NULL DEFAULT 0,

  -- Performance
  avg_delivery_time_ms INT,
  max_delivery_time_ms INT,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (date, channel, type)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_next_retry ON notifications(next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE channel = 'in_app' AND read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Notification Preferences
CREATE INDEX idx_preferences_user_id ON notification_preferences(user_id);

-- Notification Logs
CREATE INDEX idx_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX idx_logs_event ON notification_logs(event);
CREATE INDEX idx_logs_created_at ON notification_logs(created_at DESC);

-- Spaced Repetition
CREATE INDEX idx_spaced_rep_user_id ON spaced_repetition_schedule(user_id);
CREATE INDEX idx_spaced_rep_next_review ON spaced_repetition_schedule(next_review_at) WHERE is_active = true;
CREATE INDEX idx_spaced_rep_content ON spaced_repetition_schedule(content_id, content_type);

-- Templates
CREATE INDEX idx_templates_type ON notification_templates(type);
CREATE INDEX idx_templates_channel ON notification_templates(channel);
CREATE INDEX idx_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- ── Triggers ───────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaced_rep_updated_at BEFORE UPDATE ON spaced_repetition_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aggregate notification statistics
CREATE OR REPLACE FUNCTION aggregate_notification_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('sent', 'delivered', 'failed') THEN
    INSERT INTO notification_queue_stats (
      date, channel, type,
      total_queued, total_sent, total_delivered, total_failed
    )
    VALUES (
      CURRENT_DATE,
      NEW.channel,
      NEW.type,
      1,
      CASE WHEN NEW.status = 'sent' OR NEW.status = 'delivered' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, channel, type) DO UPDATE SET
      total_queued = notification_queue_stats.total_queued + 1,
      total_sent = notification_queue_stats.total_sent + CASE WHEN NEW.status = 'sent' OR NEW.status = 'delivered' THEN 1 ELSE 0 END,
      total_delivered = notification_queue_stats.total_delivered + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
      total_failed = notification_queue_stats.total_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aggregate_notification_stats_trigger
AFTER UPDATE ON notifications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION aggregate_notification_stats();
