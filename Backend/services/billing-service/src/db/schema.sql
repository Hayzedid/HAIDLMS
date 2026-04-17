-- Billing Service Database Schema
-- Multi-gateway payment processing, subscriptions, and revenue management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE payment_gateway AS ENUM ('stripe', 'paystack', 'flutterwave');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'paused', 'trialing', 'incomplete', 'incomplete_expired');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', 'lifetime');
CREATE TYPE transaction_type AS ENUM ('payment', 'refund', 'subscription', 'purchase');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR');

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(12,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  billing_cycle billing_cycle NOT NULL,

  -- Trial
  trial_days INTEGER DEFAULT 0,

  -- Features
  features JSONB DEFAULT '[]',

  -- Limits
  max_courses INTEGER,
  max_storage_gb INTEGER,
  max_students INTEGER,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_billing_cycle ON subscription_plans(billing_cycle);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),

  -- Status
  status subscription_status DEFAULT 'active',

  -- Billing
  gateway payment_gateway NOT NULL,
  gateway_subscription_id VARCHAR(255),
  gateway_customer_id VARCHAR(255),

  -- Pricing
  amount DECIMAL(12,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  billing_cycle billing_cycle NOT NULL,

  -- Dates
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Payment
  default_payment_method_id UUID,

  -- Auto-renewal
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_gateway ON subscriptions(gateway);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_gateway_subscription ON subscriptions(gateway_subscription_id);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- Gateway details
  gateway payment_gateway NOT NULL,
  gateway_payment_method_id VARCHAR(255) NOT NULL,
  gateway_customer_id VARCHAR(255),

  -- Card details (for display)
  type VARCHAR(50), -- card, bank_account, mobile_money
  brand VARCHAR(50), -- visa, mastercard, etc.
  last4 VARCHAR(4),
  exp_month INTEGER,
  exp_year INTEGER,

  -- Billing details
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB,

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_gateway ON payment_methods(gateway);
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = true;

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- Transaction details
  type transaction_type NOT NULL,
  status payment_status DEFAULT 'pending',

  -- Gateway
  gateway payment_gateway NOT NULL,
  gateway_transaction_id VARCHAR(255),
  gateway_customer_id VARCHAR(255),

  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  fee DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2),

  -- Related entities
  subscription_id UUID REFERENCES subscriptions(id),
  invoice_id UUID,
  course_id UUID,
  payment_method_id UUID REFERENCES payment_methods(id),

  -- Payment details
  description TEXT,

  -- Refund
  refunded_amount DECIMAL(12,2) DEFAULT 0,
  refund_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway ON transactions(gateway);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_subscription ON transactions(subscription_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_gateway_transaction ON transactions(gateway_transaction_id);

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status invoice_status DEFAULT 'draft',

  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency currency_code DEFAULT 'USD',

  -- Payment
  gateway payment_gateway,
  gateway_invoice_id VARCHAR(255),
  paid_amount DECIMAL(12,2) DEFAULT 0,

  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Line items
  line_items JSONB DEFAULT '[]',

  -- Customer details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_address JSONB,

  -- Notes
  notes TEXT,

  -- PDF
  pdf_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================================================
-- COUPONS
-- ============================================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  description TEXT,

  -- Discount
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,

  -- Restrictions
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,

  -- Minimum amount
  minimum_amount DECIMAL(12,2),

  -- Applicable to
  applicable_plans JSONB DEFAULT '[]', -- array of plan IDs
  applicable_courses JSONB DEFAULT '[]', -- array of course IDs

  -- Dates
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_expires ON coupons(expires_at);

-- ============================================================================
-- COUPON REDEMPTIONS
-- ============================================================================

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES transactions(id),

  discount_amount DECIMAL(12,2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_transaction ON coupon_redemptions(transaction_id);

-- ============================================================================
-- REFUNDS
-- ============================================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  user_id UUID NOT NULL,

  -- Refund details
  amount DECIMAL(12,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  reason TEXT,

  -- Gateway
  gateway payment_gateway NOT NULL,
  gateway_refund_id VARCHAR(255),

  -- Status
  status payment_status DEFAULT 'pending',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_gateway ON refunds(gateway);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway payment_gateway NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_id VARCHAR(255),

  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,

  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_gateway ON webhook_events(gateway);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- ============================================================================
-- REVENUE ANALYTICS
-- ============================================================================

CREATE TABLE revenue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,

  -- Revenue
  total_revenue DECIMAL(12,2) DEFAULT 0,
  subscription_revenue DECIMAL(12,2) DEFAULT 0,
  course_purchase_revenue DECIMAL(12,2) DEFAULT 0,

  -- Counts
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  new_purchases INTEGER DEFAULT 0,

  -- Refunds
  refunded_amount DECIMAL(12,2) DEFAULT 0,
  refund_count INTEGER DEFAULT 0,

  -- Fees
  gateway_fees DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,

  -- MRR (Monthly Recurring Revenue)
  mrr DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_revenue_analytics_date ON revenue_analytics(date DESC);

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Active subscriptions summary
CREATE MATERIALIZED VIEW mv_active_subscriptions AS
SELECT
  s.plan_id,
  sp.name as plan_name,
  s.billing_cycle,
  COUNT(*) as subscriber_count,
  SUM(s.amount) as total_revenue,
  AVG(s.amount) as avg_revenue
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
GROUP BY s.plan_id, sp.name, s.billing_cycle;

CREATE UNIQUE INDEX idx_mv_active_subs ON mv_active_subscriptions(plan_id, billing_cycle);

-- Revenue by gateway
CREATE MATERIALIZED VIEW mv_revenue_by_gateway AS
SELECT
  gateway,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  SUM(fee) as total_fees,
  SUM(net_amount) as total_net
FROM transactions
WHERE status = 'succeeded'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY gateway;

CREATE UNIQUE INDEX idx_mv_revenue_gateway ON mv_revenue_by_gateway(gateway);

-- Top customers by revenue
CREATE MATERIALIZED VIEW mv_top_customers AS
SELECT
  user_id,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_transaction,
  MAX(created_at) as last_transaction_at
FROM transactions
WHERE status = 'succeeded'
GROUP BY user_id
ORDER BY total_spent DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_customers ON mv_top_customers(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate net amount on transaction insert
CREATE OR REPLACE FUNCTION calculate_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_amount = NEW.amount - COALESCE(NEW.fee, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_transaction_net
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_net_amount();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10) := 'INV';
  year VARCHAR(4) := TO_CHAR(NOW(), 'YYYY');
  month VARCHAR(2) := TO_CHAR(NOW(), 'MM');
  sequence INTEGER;
  invoice_num VARCHAR(50);
BEGIN
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS INTEGER)), 0) + 1
  INTO sequence
  FROM invoices
  WHERE invoice_number LIKE prefix || '-' || year || month || '%';

  invoice_num := prefix || '-' || year || month || '-' || LPAD(sequence::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Calculate subscription MRR
CREATE OR REPLACE FUNCTION calculate_mrr(
  p_amount DECIMAL,
  p_billing_cycle billing_cycle
)
RETURNS DECIMAL AS $$
BEGIN
  CASE p_billing_cycle
    WHEN 'monthly' THEN RETURN p_amount;
    WHEN 'yearly' THEN RETURN p_amount / 12;
    WHEN 'lifetime' THEN RETURN 0;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Check if coupon is valid
CREATE OR REPLACE FUNCTION is_coupon_valid(
  p_coupon_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_coupon RECORD;
  v_user_uses INTEGER;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;

  -- Check if coupon exists and is active
  IF v_coupon.id IS NULL OR v_coupon.is_active = false THEN
    RETURN false;
  END IF;

  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN false;
  END IF;

  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
    RETURN false;
  END IF;

  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
    RETURN false;
  END IF;

  -- Check per-user limit
  SELECT COUNT(*) INTO v_user_uses
  FROM coupon_redemptions
  WHERE coupon_id = p_coupon_id AND user_id = p_user_id;

  IF v_coupon.max_uses_per_user IS NOT NULL AND v_user_uses >= v_coupon.max_uses_per_user THEN
    RETURN false;
  END IF;

  -- Check minimum amount
  IF v_coupon.minimum_amount IS NOT NULL AND p_amount < v_coupon.minimum_amount THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Calculate discount amount
CREATE OR REPLACE FUNCTION calculate_discount(
  p_coupon_id UUID,
  p_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;

  IF v_coupon.id IS NULL THEN
    RETURN 0;
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_amount * (v_coupon.discount_value / 100);
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  -- Discount cannot exceed amount
  IF v_discount > p_amount THEN
    v_discount := p_amount;
  END IF;

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_billing_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_subscriptions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_by_gateway;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_customers;
END;
$$ LANGUAGE plpgsql;
