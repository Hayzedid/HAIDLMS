-- ============================================================================
-- HAIDLMS: PAYMENT GATEWAY INTEGRATION SCHEMA
-- ============================================================================
-- This schema handles payment processing, gateway integration, and transaction
-- management for course purchases, subscriptions, and other financial operations.
-- Supports multiple payment providers (Stripe, PayPal, etc.)
-- ============================================================================

-- ============================================================================
-- PAYMENT PROVIDERS
-- ============================================================================

-- Payment Gateway Configurations
CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name VARCHAR(50) NOT NULL, -- stripe, paypal, square, authorize_net
  display_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_test_mode BOOLEAN DEFAULT true,

  -- API Configuration
  api_key_public TEXT, -- Encrypted in production
  api_key_secret TEXT, -- Encrypted in production
  webhook_secret TEXT, -- Encrypted in production
  merchant_id VARCHAR(255),

  -- Provider-specific settings
  config JSONB DEFAULT '{}', -- Additional provider-specific configuration

  -- Supported features
  supports_subscriptions BOOLEAN DEFAULT false,
  supports_refunds BOOLEAN DEFAULT false,
  supports_partial_refunds BOOLEAN DEFAULT false,
  supports_disputes BOOLEAN DEFAULT false,

  -- Organization level (for multi-tenant)
  organization_id UUID REFERENCES organizations(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payment_providers_org ON payment_providers(organization_id);
CREATE INDEX idx_payment_providers_active ON payment_providers(is_active);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

-- Stored payment methods for users
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES payment_providers(id),

  -- Payment method type
  method_type VARCHAR(50) NOT NULL, -- card, bank_account, paypal, apple_pay, google_pay

  -- Provider-specific identifiers
  provider_payment_method_id VARCHAR(255) NOT NULL, -- Stripe payment method ID, PayPal billing agreement ID
  provider_customer_id VARCHAR(255), -- Stripe customer ID, PayPal payer ID

  -- Card details (if applicable) - stored by provider, we keep metadata
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50), -- visa, mastercard, amex, discover
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_fingerprint VARCHAR(255), -- For duplicate detection

  -- Bank account details (if applicable)
  bank_name VARCHAR(100),
  bank_account_last4 VARCHAR(4),
  bank_account_type VARCHAR(20), -- checking, savings

  -- PayPal details
  paypal_email VARCHAR(255),
  paypal_payer_id VARCHAR(255),

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, failed, removed

  -- Metadata
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB, -- {line1, line2, city, state, postal_code, country}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);
CREATE INDEX idx_payment_methods_provider_id ON payment_methods(provider_payment_method_id);

-- ============================================================================
-- PAYMENT TRANSACTIONS
-- ============================================================================

-- Payment intents and transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number VARCHAR(100) UNIQUE NOT NULL, -- TXN-2026-000001

  -- User and provider
  user_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  payment_method_id UUID REFERENCES payment_methods(id),

  -- Provider identifiers
  provider_transaction_id VARCHAR(255), -- Stripe payment intent ID, PayPal order ID
  provider_charge_id VARCHAR(255), -- Stripe charge ID
  provider_customer_id VARCHAR(255),

  -- Transaction type
  transaction_type VARCHAR(50) NOT NULL, -- purchase, subscription, refund, payout, adjustment

  -- Related entities
  course_id UUID REFERENCES courses(id),
  enrollment_id UUID REFERENCES enrollments(id),
  subscription_id UUID REFERENCES subscriptions(id),
  invoice_id UUID REFERENCES invoices(id),

  -- Amount details
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Fee breakdown
  platform_fee NUMERIC(10, 2) DEFAULT 0,
  payment_processing_fee NUMERIC(10, 2) DEFAULT 0,
  instructor_payout NUMERIC(10, 2),
  net_amount NUMERIC(10, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled, refunded
  failure_code VARCHAR(100),
  failure_message TEXT,

  -- Payment details
  payment_method_type VARCHAR(50), -- card, bank_account, paypal
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50),

  -- Dates
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  refunded_at TIMESTAMP,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  receipt_url TEXT,
  receipt_number VARCHAR(100),

  -- Idempotency and tracking
  idempotency_key VARCHAR(255) UNIQUE,
  client_ip VARCHAR(50),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_course ON payment_transactions(course_id);
CREATE INDEX idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_provider_txn ON payment_transactions(provider_transaction_id);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- ============================================================================
-- REFUNDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_number VARCHAR(100) UNIQUE NOT NULL, -- REF-2026-000001

  -- Original transaction
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),

  -- Provider identifiers
  provider_refund_id VARCHAR(255),

  -- Refund details
  refund_amount NUMERIC(10, 2) NOT NULL,
  refund_reason VARCHAR(50), -- customer_request, duplicate, fraudulent, course_canceled
  refund_type VARCHAR(50) DEFAULT 'full', -- full, partial

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled
  failure_reason TEXT,

  -- Request info
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  -- Dates
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,

  -- Notes
  customer_note TEXT,
  admin_note TEXT,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_refunds_transaction ON payment_refunds(transaction_id);
CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX idx_payment_refunds_requested ON payment_refunds(requested_at DESC);

-- ============================================================================
-- PAYMENT WEBHOOKS
-- ============================================================================

-- Webhook events from payment providers
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES payment_providers(id),

  -- Webhook details
  provider_event_id VARCHAR(255) UNIQUE, -- Stripe event ID
  event_type VARCHAR(100) NOT NULL, -- payment_intent.succeeded, charge.refunded, etc.

  -- Payload
  payload JSONB NOT NULL,

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, processed, failed, ignored
  processing_attempts INTEGER DEFAULT 0,
  last_processing_attempt TIMESTAMP,

  -- Related entities (populated during processing)
  transaction_id UUID REFERENCES payment_transactions(id),
  user_id UUID REFERENCES users(id),

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Request details
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_webhooks_provider ON payment_webhooks(provider_id);
CREATE INDEX idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_provider_event ON payment_webhooks(provider_event_id);
CREATE INDEX idx_payment_webhooks_received ON payment_webhooks(received_at DESC);

-- ============================================================================
-- PAYMENT DISPUTES
-- ============================================================================

-- Chargebacks and disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_number VARCHAR(100) UNIQUE NOT NULL, -- DIS-2026-000001

  -- Related transaction
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),

  -- Provider identifiers
  provider_dispute_id VARCHAR(255),

  -- Dispute details
  dispute_reason VARCHAR(100), -- fraudulent, duplicate, product_not_received, unrecognized
  dispute_status VARCHAR(50) DEFAULT 'needs_response', -- needs_response, under_review, won, lost, warning_closed

  -- Amounts
  disputed_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Evidence and response
  evidence_details JSONB DEFAULT '{}',
  evidence_submitted_at TIMESTAMP,
  evidence_due_date TIMESTAMP,

  -- Resolution
  resolved_at TIMESTAMP,
  resolution_reason TEXT,

  -- Tracking
  is_charge_refundable BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_disputes_transaction ON payment_disputes(transaction_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(dispute_status);
CREATE INDEX idx_payment_disputes_provider ON payment_disputes(provider_dispute_id);

-- ============================================================================
-- PAYMENT LOGS
-- ============================================================================

-- Detailed audit log for all payment operations
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Related entities
  transaction_id UUID REFERENCES payment_transactions(id),
  refund_id UUID REFERENCES payment_refunds(id),
  webhook_id UUID REFERENCES payment_webhooks(id),
  user_id UUID REFERENCES users(id),

  -- Log details
  log_level VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical
  event_type VARCHAR(100) NOT NULL, -- payment_initiated, payment_succeeded, webhook_received, etc.
  message TEXT NOT NULL,

  -- Context
  provider_name VARCHAR(50),
  provider_transaction_id VARCHAR(255),

  -- Request/response data
  request_data JSONB,
  response_data JSONB,

  -- Error details
  error_code VARCHAR(100),
  error_message TEXT,

  -- Metadata
  ip_address VARCHAR(50),
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_transaction ON payment_logs(transaction_id);
CREATE INDEX idx_payment_logs_level ON payment_logs(log_level);
CREATE INDEX idx_payment_logs_event ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created ON payment_logs(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number(
  p_prefix VARCHAR DEFAULT 'TXN'
)
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_counter INTEGER;
  v_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COUNT(*) + 1 INTO v_counter
  FROM payment_transactions
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  v_number := p_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Generate refund number
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN generate_transaction_number('REF');
END;
$$ LANGUAGE plpgsql;

-- Generate dispute number
CREATE OR REPLACE FUNCTION generate_dispute_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN generate_transaction_number('DIS');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active payment methods view
CREATE OR REPLACE VIEW active_payment_methods AS
SELECT
  pm.*,
  pp.provider_name,
  pp.display_name as provider_display_name,
  u.email as user_email
FROM payment_methods pm
JOIN payment_providers pp ON pm.provider_id = pp.id
JOIN users u ON pm.user_id = u.id
WHERE pm.status = 'active';

-- Successful transactions view
CREATE OR REPLACE VIEW successful_transactions AS
SELECT
  pt.*,
  pp.provider_name,
  u.email as user_email,
  c.title as course_title
FROM payment_transactions pt
JOIN payment_providers pp ON pt.provider_id = pp.id
JOIN users u ON pt.user_id = u.id
LEFT JOIN courses c ON pt.course_id = c.id
WHERE pt.status = 'succeeded';

-- Pending refunds view
CREATE OR REPLACE VIEW pending_refunds AS
SELECT
  pr.*,
  pt.transaction_number,
  pt.amount as original_amount,
  u.email as requester_email
FROM payment_refunds pr
JOIN payment_transactions pt ON pr.transaction_id = pt.id
LEFT JOIN users u ON pr.requested_by = u.id
WHERE pr.status IN ('pending', 'processing');

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  DATE_TRUNC('day', completed_at) as date,
  currency,
  COUNT(*) as transaction_count,
  SUM(amount) as gross_revenue,
  SUM(platform_fee) as platform_fees,
  SUM(payment_processing_fee) as processing_fees,
  SUM(net_amount) as net_revenue,
  SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as refund_amount
FROM payment_transactions
WHERE status = 'succeeded'
  AND completed_at IS NOT NULL
GROUP BY DATE_TRUNC('day', completed_at), currency
ORDER BY date DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_providers_updated
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

CREATE TRIGGER payment_methods_updated
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

CREATE TRIGGER payment_transactions_updated
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

CREATE TRIGGER payment_refunds_updated
  BEFORE UPDATE ON payment_refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_default
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Update transaction status based on refunds
CREATE OR REPLACE FUNCTION update_transaction_on_refund()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction RECORD;
  v_total_refunded NUMERIC;
BEGIN
  IF NEW.status = 'succeeded' THEN
    -- Get original transaction
    SELECT * INTO v_transaction
    FROM payment_transactions
    WHERE id = NEW.transaction_id;

    -- Calculate total refunded amount
    SELECT COALESCE(SUM(refund_amount), 0) INTO v_total_refunded
    FROM payment_refunds
    WHERE transaction_id = NEW.transaction_id
      AND status = 'succeeded';

    -- Update transaction status if fully refunded
    IF v_total_refunded >= v_transaction.amount THEN
      UPDATE payment_transactions
      SET status = 'refunded',
          refunded_at = NOW()
      WHERE id = NEW.transaction_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_status_updated
  AFTER INSERT OR UPDATE ON payment_refunds
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION update_transaction_on_refund();

-- ============================================================================
-- SAMPLE DATA (Development only)
-- ============================================================================

-- Uncomment for development/testing
/*
-- Sample payment provider (Stripe Test Mode)
INSERT INTO payment_providers (
  provider_name, display_name, is_active, is_test_mode,
  api_key_public, api_key_secret, webhook_secret,
  supports_subscriptions, supports_refunds, supports_partial_refunds
) VALUES (
  'stripe', 'Stripe', true, true,
  'pk_test_xxxxx', 'sk_test_xxxxx', 'whsec_xxxxx',
  true, true, true
);
*/
