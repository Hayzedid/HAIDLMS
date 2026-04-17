-- ============================================================================
-- HAIDLMS: SUBSCRIPTION MANAGEMENT SCHEMA
-- ============================================================================
-- This schema handles subscription plans, billing cycles, recurring payments,
-- plan changes, trial periods, and cancellation management
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plan details
  plan_name VARCHAR(100) NOT NULL,
  plan_code VARCHAR(50) UNIQUE NOT NULL, -- basic_monthly, pro_yearly, etc.
  description TEXT,

  -- Pricing
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_interval VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
  billing_interval_count INTEGER DEFAULT 1, -- Every N intervals

  -- Trial
  trial_period_days INTEGER DEFAULT 0,
  has_trial BOOLEAN DEFAULT false,

  -- Plan limits and features
  features JSONB DEFAULT '[]', -- Array of features
  max_courses INTEGER, -- Null = unlimited
  max_students INTEGER, -- For organizations
  max_storage_gb INTEGER,
  priority_support BOOLEAN DEFAULT false,

  -- Access level
  access_type VARCHAR(50) DEFAULT 'platform', -- platform, course, organization
  course_ids UUID[], -- If access_type = 'course'
  organization_id UUID REFERENCES organizations(id),

  -- Provider integration
  provider_plan_id VARCHAR(255), -- Stripe price ID, PayPal plan ID

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true, -- Show on pricing page
  is_recommended BOOLEAN DEFAULT false,

  -- Display order
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_org ON subscription_plans(organization_id);

-- ============================================================================
-- USER SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User and plan
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Provider details
  provider VARCHAR(50) NOT NULL, -- stripe, paypal
  provider_subscription_id VARCHAR(255) UNIQUE, -- Stripe subscription ID
  provider_customer_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, trialing, active, past_due, canceled, expired, paused

  -- Dates
  start_date TIMESTAMP DEFAULT NOW(),
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  paused_at TIMESTAMP,

  -- Cancel details
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_reason VARCHAR(100),
  cancellation_feedback TEXT,
  canceled_by UUID REFERENCES users(id),

  -- Billing
  billing_cycle_anchor TIMESTAMP,
  next_billing_date TIMESTAMP,
  last_payment_date TIMESTAMP,
  last_payment_amount NUMERIC(10, 2),

  -- Payment method
  payment_method_id UUID REFERENCES payment_methods(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_provider ON subscriptions(provider_subscription_id);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- ============================================================================
-- SUBSCRIPTION ITEMS
-- ============================================================================

-- Individual items within a subscription (for metered billing or add-ons)
CREATE TABLE IF NOT EXISTS subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Item details
  item_type VARCHAR(50) NOT NULL, -- base, addon, metered
  description TEXT,

  -- Pricing
  price NUMERIC(10, 2),
  quantity INTEGER DEFAULT 1,

  -- Provider details
  provider_item_id VARCHAR(255),

  -- Metered usage (if applicable)
  is_metered BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_items_subscription ON subscription_items(subscription_id);

-- ============================================================================
-- SUBSCRIPTION HISTORY
-- ============================================================================

-- Track all subscription changes and events
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(50) NOT NULL, -- created, upgraded, downgraded, renewed, canceled, paused, resumed, expired
  event_description TEXT,

  -- From/To states (for changes)
  previous_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  -- Actor
  performed_by UUID REFERENCES users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_event ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created ON subscription_history(created_at DESC);

-- ============================================================================
-- SUBSCRIPTION INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,

  -- Subscription
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Provider details
  provider_invoice_id VARCHAR(255),

  -- Amounts
  subtotal NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  amount_due NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, past_due, uncollectible, void

  -- Dates
  invoice_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  period_start TIMESTAMP,
  period_end TIMESTAMP,

  -- Payment
  transaction_id UUID REFERENCES payment_transactions(id),
  payment_method_id UUID REFERENCES payment_methods(id),

  -- Invoice details
  line_items JSONB DEFAULT '[]',
  notes TEXT,

  -- Files
  invoice_pdf_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_user ON subscription_invoices(user_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_due ON subscription_invoices(due_date);

-- ============================================================================
-- SUBSCRIPTION CHANGES
-- ============================================================================

-- Track plan upgrades, downgrades, and modifications
CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Change details
  change_type VARCHAR(50) NOT NULL, -- upgrade, downgrade, switch
  from_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  to_plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Timing
  change_timing VARCHAR(50) DEFAULT 'immediate', -- immediate, end_of_period
  scheduled_for TIMESTAMP,
  applied_at TIMESTAMP,

  -- Pricing
  proration_amount NUMERIC(10, 2),
  proration_type VARCHAR(50), -- credit, charge, none

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, canceled, failed

  -- Actor
  requested_by UUID NOT NULL REFERENCES users(id),

  -- Reason
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_changes_subscription ON subscription_changes(subscription_id);
CREATE INDEX idx_subscription_changes_scheduled ON subscription_changes(scheduled_for);
CREATE INDEX idx_subscription_changes_status ON subscription_changes(status);

-- ============================================================================
-- SUBSCRIPTION USAGE TRACKING
-- ============================================================================

-- Track usage for metered billing or limits
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  subscription_item_id UUID REFERENCES subscription_items(id),

  -- Usage details
  usage_type VARCHAR(50) NOT NULL, -- storage, api_calls, students, courses, etc.
  usage_amount NUMERIC(10, 2) NOT NULL,
  usage_unit VARCHAR(50), -- GB, calls, users, etc.

  -- Billing period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);

-- ============================================================================
-- SUBSCRIPTION NOTIFICATIONS
-- ============================================================================

-- Track subscription-related notifications sent to users
CREATE TABLE IF NOT EXISTS subscription_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- trial_ending, renewal_upcoming, payment_failed, canceled, etc.
  notification_channel VARCHAR(50) NOT NULL, -- email, in_app, sms

  -- Status
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,

  -- Content
  subject VARCHAR(255),
  message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_notifications_subscription ON subscription_notifications(subscription_id);
CREATE INDEX idx_subscription_notifications_type ON subscription_notifications(notification_type);
CREATE INDEX idx_subscription_notifications_sent ON subscription_notifications(sent_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active subscriptions view
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  s.*,
  sp.plan_name,
  sp.billing_interval,
  sp.price as plan_price,
  u.email as user_email,
  CASE
    WHEN s.status = 'trialing' THEN s.trial_end
    ELSE s.current_period_end
  END as expiration_date
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing', 'past_due');

-- Subscriptions expiring soon
CREATE OR REPLACE VIEW subscriptions_expiring_soon AS
SELECT
  s.*,
  sp.plan_name,
  u.email as user_email
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing')
  AND s.next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Subscription revenue view
CREATE OR REPLACE VIEW subscription_revenue AS
SELECT
  DATE_TRUNC('month', si.invoice_date) as month,
  COUNT(DISTINCT si.subscription_id) as subscription_count,
  SUM(si.total_amount) as total_revenue,
  AVG(si.total_amount) as average_invoice,
  sp.plan_name,
  sp.billing_interval
FROM subscription_invoices si
JOIN subscriptions s ON si.subscription_id = s.id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE si.status = 'paid'
GROUP BY DATE_TRUNC('month', si.invoice_date), sp.plan_name, sp.billing_interval
ORDER BY month DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_counter INTEGER;
  v_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');

  SELECT COUNT(*) + 1 INTO v_counter
  FROM subscription_invoices
  WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE);

  v_number := 'INV-' || v_year || v_month || '-' || LPAD(v_counter::TEXT, 5, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Cancel subscription at period end
CREATE OR REPLACE FUNCTION cancel_subscription_at_period_end(
  p_subscription_id UUID,
  p_reason VARCHAR,
  p_feedback TEXT,
  p_canceled_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET cancel_at_period_end = true,
      cancellation_reason = p_reason,
      cancellation_feedback = p_feedback,
      canceled_by = p_canceled_by,
      updated_at = NOW()
  WHERE id = p_subscription_id
    AND status IN ('active', 'trialing');

  IF FOUND THEN
    INSERT INTO subscription_history (
      subscription_id, event_type, event_description,
      previous_status, new_status, performed_by
    ) VALUES (
      p_subscription_id, 'cancel_scheduled', 'Subscription will be canceled at period end',
      'active', 'cancel_scheduled', p_canceled_by
    );

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Cancel subscription immediately
CREATE OR REPLACE FUNCTION cancel_subscription_immediately(
  p_subscription_id UUID,
  p_reason VARCHAR,
  p_feedback TEXT,
  p_canceled_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'canceled',
      canceled_at = NOW(),
      ended_at = NOW(),
      cancellation_reason = p_reason,
      cancellation_feedback = p_feedback,
      canceled_by = p_canceled_by,
      updated_at = NOW()
  WHERE id = p_subscription_id
    AND status IN ('active', 'trialing', 'past_due');

  IF FOUND THEN
    INSERT INTO subscription_history (
      subscription_id, event_type, event_description,
      previous_status, new_status, performed_by
    ) VALUES (
      p_subscription_id, 'canceled', 'Subscription canceled immediately',
      'active', 'canceled', p_canceled_by
    );

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Resume canceled subscription
CREATE OR REPLACE FUNCTION resume_subscription(
  p_subscription_id UUID,
  p_resumed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription FROM subscriptions WHERE id = p_subscription_id;

  IF v_subscription.cancel_at_period_end = true AND v_subscription.status IN ('active', 'trialing') THEN
    UPDATE subscriptions
    SET cancel_at_period_end = false,
        cancellation_reason = NULL,
        cancellation_feedback = NULL,
        updated_at = NOW()
    WHERE id = p_subscription_id;

    INSERT INTO subscription_history (
      subscription_id, event_type, event_description,
      previous_status, new_status, performed_by
    ) VALUES (
      p_subscription_id, 'resumed', 'Subscription cancellation reversed',
      v_subscription.status, v_subscription.status, p_resumed_by
    );

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

CREATE TRIGGER subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

CREATE TRIGGER subscription_invoices_updated
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- Track subscription status changes
CREATE OR REPLACE FUNCTION track_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO subscription_history (
      subscription_id, event_type, event_description,
      previous_status, new_status
    ) VALUES (
      NEW.id, 'status_changed',
      'Subscription status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status, NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_status_tracker
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_subscription_status_change();

-- Track subscription plan changes
CREATE OR REPLACE FUNCTION track_subscription_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    INSERT INTO subscription_history (
      subscription_id, event_type, event_description,
      previous_plan_id, new_plan_id
    ) VALUES (
      NEW.id, 'plan_changed', 'Subscription plan changed',
      OLD.plan_id, NEW.plan_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plan_tracker
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.plan_id IS DISTINCT FROM NEW.plan_id)
  EXECUTE FUNCTION track_subscription_plan_change();
