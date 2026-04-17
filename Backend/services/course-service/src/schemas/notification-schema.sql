-- Notification System Schema
-- Email and in-app notifications with preferences and templates

-- ========================================
-- 1. NOTIFICATION PREFERENCES
-- ========================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Email Preferences
  email_enabled BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest', 'never'

  -- Course Notifications
  course_announcements BOOLEAN DEFAULT true,
  course_updates BOOLEAN DEFAULT true,
  new_lesson_available BOOLEAN DEFAULT true,
  assignment_deadline BOOLEAN DEFAULT true,
  grade_released BOOLEAN DEFAULT true,

  -- Forum Notifications
  forum_reply_to_thread BOOLEAN DEFAULT true,
  forum_reply_to_comment BOOLEAN DEFAULT true,
  forum_mention BOOLEAN DEFAULT true,
  forum_thread_followed BOOLEAN DEFAULT true,
  forum_answer_accepted BOOLEAN DEFAULT true,

  -- Social Notifications
  peer_review_received BOOLEAN DEFAULT true,
  peer_review_completed BOOLEAN DEFAULT true,
  badge_earned BOOLEAN DEFAULT true,
  certificate_issued BOOLEAN DEFAULT true,
  portfolio_endorsement BOOLEAN DEFAULT true,

  -- Engagement Notifications
  inactivity_reminder BOOLEAN DEFAULT true,
  course_recommendation BOOLEAN DEFAULT true,
  progress_milestone BOOLEAN DEFAULT true,
  leaderboard_ranking BOOLEAN DEFAULT false,

  -- Admin Notifications
  system_announcements BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- ========================================
-- 2. NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- 'course_announcement', 'forum_reply', 'badge_earned', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Action/Link
  action_url VARCHAR(500), -- Where to redirect when clicked
  action_text VARCHAR(100), -- e.g., "View Thread", "Check Grade"

  -- Related Entities
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  related_thread_id UUID REFERENCES discussion_threads(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who triggered the notification
  metadata JSONB, -- Additional context

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,

  -- Delivery
  delivered_via VARCHAR(20) DEFAULT 'in_app', -- 'in_app', 'email', 'both'
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,

  -- Expiry
  expires_at TIMESTAMP, -- Auto-archive after this date

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_course ON notifications(related_course_id);

-- ========================================
-- 3. NOTIFICATION TEMPLATES
-- ========================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template Identity
  template_key VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template Content
  subject_template TEXT NOT NULL, -- Email subject / notification title
  body_template TEXT NOT NULL, -- Supports variables like {{user_name}}, {{course_title}}
  html_template TEXT, -- HTML version for email

  -- Template Variables
  required_variables TEXT[], -- ['user_name', 'course_title', 'deadline_date']

  -- Settings
  is_active BOOLEAN DEFAULT true,
  default_priority VARCHAR(20) DEFAULT 'normal',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);

-- ========================================
-- 4. EMAIL QUEUE
-- ========================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Recipient
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Email Content
  subject VARCHAR(500) NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,

  -- Template
  template_key VARCHAR(100) REFERENCES notification_templates(template_key) ON DELETE SET NULL,
  template_variables JSONB,

  -- Related Notification
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed', 'bounced'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,

  -- Tracking
  tracking_id VARCHAR(100) UNIQUE,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,

  -- Scheduling
  scheduled_for TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_queue_user ON email_queue(user_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_created ON email_queue(created_at DESC);

-- ========================================
-- 5. NOTIFICATION BATCHES (for digests)
-- ========================================

CREATE TABLE IF NOT EXISTS notification_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Batch Details
  batch_type VARCHAR(20) NOT NULL, -- 'daily_digest', 'weekly_digest'
  notification_ids UUID[] NOT NULL,
  notification_count INTEGER NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,

  -- Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_batches_user ON notification_batches(user_id);
CREATE INDEX idx_notification_batches_status ON notification_batches(status);

-- ========================================
-- 6. NOTIFICATION SUBSCRIPTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Subscription Type
  subscription_type VARCHAR(50) NOT NULL, -- 'thread_follow', 'course_watch', 'user_follow'

  -- Related Entity
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  followed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Preferences
  notify_on_new_reply BOOLEAN DEFAULT true,
  notify_on_update BOOLEAN DEFAULT true,

  subscribed_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_subscription UNIQUE (user_id, subscription_type, thread_id, course_id, followed_user_id)
);

CREATE INDEX idx_notification_subs_user ON notification_subscriptions(user_id);
CREATE INDEX idx_notification_subs_thread ON notification_subscriptions(thread_id);
CREATE INDEX idx_notification_subs_course ON notification_subscriptions(course_id);

-- ========================================
-- 7. TRIGGERS
-- ========================================

-- Trigger: Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- Trigger: Mark notification as read when read_at is set
CREATE OR REPLACE FUNCTION mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.is_read := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_notification_read
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION mark_notification_read();

-- Trigger: Send forum reply notifications
CREATE OR REPLACE FUNCTION send_forum_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_title VARCHAR(500);
  v_author_name VARCHAR(255);
  v_followers RECORD;
BEGIN
  -- Get thread details
  SELECT title INTO v_thread_title FROM discussion_threads WHERE id = NEW.thread_id;
  SELECT full_name INTO v_author_name FROM users WHERE id = NEW.author_id;

  -- Notify thread followers
  FOR v_followers IN
    SELECT tf.user_id, np.forum_reply_to_thread, np.email_enabled
    FROM thread_followers tf
    JOIN notification_preferences np ON tf.user_id = np.user_id
    WHERE tf.thread_id = NEW.thread_id
      AND tf.user_id != NEW.author_id -- Don't notify the author
      AND tf.notify_on_reply = true
      AND np.forum_reply_to_thread = true
  LOOP
    INSERT INTO notifications (
      user_id, notification_type, title, message,
      action_url, action_text, related_thread_id, related_user_id,
      delivered_via
    ) VALUES (
      v_followers.user_id,
      'forum_reply',
      'New reply to "' || v_thread_title || '"',
      v_author_name || ' replied to a thread you are following.',
      '/forum/thread/' || NEW.thread_id,
      'View Reply',
      NEW.thread_id,
      NEW.author_id,
      CASE WHEN v_followers.email_enabled THEN 'both' ELSE 'in_app' END
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_send_forum_reply_notification
AFTER INSERT ON thread_replies
FOR EACH ROW
WHEN (NEW.is_deleted = false)
EXECUTE FUNCTION send_forum_reply_notification();

-- Trigger: Send badge earned notification
CREATE OR REPLACE FUNCTION send_badge_earned_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_badge_name VARCHAR(255);
BEGIN
  -- Get badge name
  SELECT name INTO v_badge_name FROM badge_classes WHERE id = NEW.badge_class_id;

  -- Send notification
  INSERT INTO notifications (
    user_id, notification_type, title, message,
    action_url, action_text, priority, delivered_via
  )
  SELECT
    NEW.recipient_id,
    'badge_earned',
    'You earned a badge!',
    'Congratulations! You earned the "' || v_badge_name || '" badge.',
    '/badges/' || NEW.badge_hash,
    'View Badge',
    'high',
    CASE WHEN np.email_enabled THEN 'both' ELSE 'in_app' END
  FROM notification_preferences np
  WHERE np.user_id = NEW.recipient_id
    AND np.badge_earned = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This assumes badge_assertions table exists
-- CREATE TRIGGER trigger_send_badge_earned_notification
-- AFTER INSERT ON badge_assertions
-- FOR EACH ROW
-- WHEN (NEW.is_revoked = false)
-- EXECUTE FUNCTION send_badge_earned_notification();

-- ========================================
-- 8. VIEWS
-- ========================================

-- View: Unread notification count per user
CREATE OR REPLACE VIEW unread_notification_counts AS
SELECT
  user_id,
  COUNT(*) AS unread_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_count,
  MAX(created_at) AS latest_notification_at
FROM notifications
WHERE is_read = false
  AND is_archived = false
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY user_id;

-- View: Recent notifications
CREATE OR REPLACE VIEW recent_notifications AS
SELECT
  n.*,
  u.full_name AS related_user_name,
  u.avatar_url AS related_user_avatar,
  c.title AS related_course_title
FROM notifications n
LEFT JOIN users u ON n.related_user_id = u.id
LEFT JOIN courses c ON n.related_course_id = c.id
WHERE n.is_archived = false
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.created_at DESC;

-- ========================================
-- 9. FUNCTIONS
-- ========================================

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_action_url VARCHAR DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal',
  p_related_course_id UUID DEFAULT NULL,
  p_related_thread_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Check if notification type is enabled
  IF NOT v_prefs.email_enabled THEN
    RETURN NULL;
  END IF;

  -- Create notification
  INSERT INTO notifications (
    user_id, notification_type, title, message,
    action_url, priority, related_course_id, related_thread_id,
    delivered_via
  ) VALUES (
    p_user_id, p_type, p_title, p_message,
    p_action_url, p_priority, p_related_course_id, p_related_thread_id,
    CASE WHEN v_prefs.email_enabled THEN 'both' ELSE 'in_app' END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id
    AND is_read = false
    AND is_archived = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications(p_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_archived = true, archived_at = NOW()
  WHERE is_read = true
    AND created_at < NOW() - (p_days || ' days')::INTERVAL
    AND is_archived = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get pending emails for digest
CREATE OR REPLACE FUNCTION get_digest_notifications(
  p_user_id UUID,
  p_digest_type VARCHAR
)
RETURNS TABLE(
  notification_id UUID,
  notification_type VARCHAR,
  title VARCHAR,
  message TEXT,
  created_at TIMESTAMP
) AS $$
DECLARE
  v_period_start TIMESTAMP;
BEGIN
  -- Determine period
  IF p_digest_type = 'daily_digest' THEN
    v_period_start := NOW() - INTERVAL '1 day';
  ELSIF p_digest_type = 'weekly_digest' THEN
    v_period_start := NOW() - INTERVAL '7 days';
  ELSE
    v_period_start := NOW() - INTERVAL '1 day';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.notification_type,
    n.title,
    n.message,
    n.created_at
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND n.created_at >= v_period_start
    AND n.email_sent = false
    AND n.is_archived = false
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Notification System - Email and in-app notifications with preferences';
