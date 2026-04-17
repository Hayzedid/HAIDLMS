-- ============================================================================
-- HAIDLMS: INVOICING & FINANCIAL TRACKING SCHEMA
-- ============================================================================
-- This schema handles invoice generation, receipts, revenue tracking,
-- tax management, and financial reporting
-- ============================================================================

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,

  -- Customer
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Invoice type
  invoice_type VARCHAR(50) NOT NULL, -- course_purchase, subscription, bulk_order, custom

  -- Related entities
  course_id UUID REFERENCES courses(id),
  enrollment_id UUID REFERENCES enrollments(id),
  subscription_id UUID REFERENCES subscriptions(id),
  bulk_order_id UUID REFERENCES bulk_enrollment_orders(id),
  transaction_id UUID REFERENCES payment_transactions(id),

  -- Amounts
  subtotal NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Tax details
  tax_rate NUMERIC(5, 2),
  tax_type VARCHAR(50), -- vat, gst, sales_tax
  tax_jurisdiction VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, canceled, void
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid, refunded

  -- Dates
  invoice_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  sent_at TIMESTAMP,
  canceled_at TIMESTAMP,

  -- Billing details
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Files
  pdf_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due ON invoices(due_date);
CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);

-- ============================================================================
-- INVOICE LINE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Item details
  description TEXT NOT NULL,
  item_type VARCHAR(50), -- course, subscription, addon, discount, tax

  -- Related entities
  course_id UUID REFERENCES courses(id),
  subscription_id UUID REFERENCES subscriptions(id),

  -- Pricing
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================================================
-- RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(100) UNIQUE NOT NULL,

  -- Invoice and transaction
  invoice_id UUID REFERENCES invoices(id),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),

  -- Customer
  user_id UUID NOT NULL REFERENCES users(id),

  -- Amount received
  amount_received NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Payment details
  payment_method VARCHAR(50),
  payment_date TIMESTAMP DEFAULT NOW(),

  -- Receipt details
  issued_to_name VARCHAR(255),
  issued_to_email VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Files
  pdf_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_invoice ON receipts(invoice_id);
CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipts_date ON receipts(payment_date DESC);

-- ============================================================================
-- TAX CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tax details
  tax_name VARCHAR(100) NOT NULL,
  tax_type VARCHAR(50) NOT NULL, -- vat, gst, sales_tax, income_tax
  tax_rate NUMERIC(5, 2) NOT NULL, -- Percentage

  -- Jurisdiction
  country_code VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  state_province VARCHAR(100),
  city VARCHAR(100),

  -- Applicability
  applies_to VARCHAR(50) DEFAULT 'all', -- all, digital_goods, services, courses
  is_compound BOOLEAN DEFAULT false, -- Compound tax (calculated on top of other taxes)

  -- Status
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_country ON tax_rates(country_code);
CREATE INDEX idx_tax_rates_active ON tax_rates(is_active);
CREATE INDEX idx_tax_rates_effective ON tax_rates(effective_from, effective_until);

-- ============================================================================
-- INSTRUCTOR PAYOUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS instructor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_number VARCHAR(100) UNIQUE NOT NULL,

  -- Instructor
  instructor_id UUID NOT NULL REFERENCES users(id),

  -- Payout period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Amounts
  gross_revenue NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL,
  processing_fee NUMERIC(10, 2) DEFAULT 0,
  tax_withheld NUMERIC(10, 2) DEFAULT 0,
  adjustments NUMERIC(10, 2) DEFAULT 0,
  net_payout NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, paid, failed, canceled
  payout_method VARCHAR(50), -- bank_transfer, paypal, stripe

  -- Provider details
  provider_payout_id VARCHAR(255),

  -- Dates
  initiated_at TIMESTAMP,
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Failure details
  failure_reason TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instructor_payouts_instructor ON instructor_payouts(instructor_id);
CREATE INDEX idx_instructor_payouts_status ON instructor_payouts(status);
CREATE INDEX idx_instructor_payouts_period ON instructor_payouts(period_start, period_end);
CREATE INDEX idx_instructor_payouts_paid ON instructor_payouts(paid_at DESC);

-- ============================================================================
-- PAYOUT TRANSACTIONS
-- ============================================================================

-- Link individual transactions to instructor payouts
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id UUID NOT NULL REFERENCES instructor_payouts(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id),

  -- Transaction details
  course_id UUID REFERENCES courses(id),
  student_id UUID REFERENCES users(id),

  -- Revenue split
  transaction_amount NUMERIC(10, 2) NOT NULL,
  instructor_share NUMERIC(10, 2) NOT NULL,
  platform_share NUMERIC(10, 2) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payout_transactions_payout ON payout_transactions(payout_id);
CREATE INDEX idx_payout_transactions_transaction ON payout_transactions(transaction_id);
CREATE INDEX idx_payout_transactions_instructor ON payout_transactions(transaction_id, payout_id);

-- ============================================================================
-- REVENUE SHARING RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_sharing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Applicability
  rule_name VARCHAR(100) NOT NULL,
  applies_to VARCHAR(50) DEFAULT 'all', -- all, specific_course, specific_instructor, organization

  -- Specific targets
  course_id UUID REFERENCES courses(id),
  instructor_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),

  -- Revenue split (percentages)
  instructor_percentage NUMERIC(5, 2) DEFAULT 70.00,
  platform_percentage NUMERIC(5, 2) DEFAULT 30.00,

  -- Tiered pricing (optional)
  has_tiered_split BOOLEAN DEFAULT false,
  tier_thresholds JSONB, -- [{threshold: 1000, instructor_pct: 75}, ...]

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules are evaluated first

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_sharing_course ON revenue_sharing_rules(course_id);
CREATE INDEX idx_revenue_sharing_instructor ON revenue_sharing_rules(instructor_id);
CREATE INDEX idx_revenue_sharing_org ON revenue_sharing_rules(organization_id);
CREATE INDEX idx_revenue_sharing_active ON revenue_sharing_rules(is_active);

-- ============================================================================
-- FINANCIAL REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(100) UNIQUE NOT NULL,

  -- Report details
  report_type VARCHAR(50) NOT NULL, -- revenue, expenses, profit_loss, tax, payout
  report_period VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, yearly, custom

  -- Period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Organization (if applicable)
  organization_id UUID REFERENCES organizations(id),

  -- Report data
  report_data JSONB NOT NULL,

  -- Summary
  total_revenue NUMERIC(10, 2),
  total_expenses NUMERIC(10, 2),
  net_profit NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'generated', -- generated, reviewed, approved, published

  -- Files
  pdf_url TEXT,
  csv_url TEXT,

  -- Audit
  generated_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_period ON financial_reports(period_start, period_end);
CREATE INDEX idx_financial_reports_org ON financial_reports(organization_id);
CREATE INDEX idx_financial_reports_created ON financial_reports(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  DATE_TRUNC('day', pt.completed_at) as date,
  COUNT(*) as transaction_count,
  SUM(pt.amount) as gross_revenue,
  SUM(pt.platform_fee) as platform_fees,
  SUM(pt.payment_processing_fee) as processing_fees,
  SUM(pt.instructor_payout) as instructor_payouts,
  SUM(pt.net_amount) as net_revenue,
  pt.currency
FROM payment_transactions pt
WHERE pt.status = 'succeeded'
  AND pt.completed_at IS NOT NULL
GROUP BY DATE_TRUNC('day', pt.completed_at), pt.currency
ORDER BY date DESC;

-- Outstanding invoices view
CREATE OR REPLACE VIEW outstanding_invoices AS
SELECT
  i.*,
  u.email as customer_email,
  CURRENT_DATE - i.due_date::date as days_overdue
FROM invoices i
JOIN users u ON i.user_id = u.id
WHERE i.payment_status IN ('unpaid', 'partial')
  AND i.status NOT IN ('canceled', 'void')
  AND i.due_date < NOW();

-- Pending payouts view
CREATE OR REPLACE VIEW pending_instructor_payouts AS
SELECT
  ip.*,
  u.email as instructor_email,
  u.first_name || ' ' || u.last_name as instructor_name
FROM instructor_payouts ip
JOIN users u ON ip.instructor_id = u.id
WHERE ip.status IN ('pending', 'processing');

-- Course revenue view
CREATE OR REPLACE VIEW course_revenue_summary AS
SELECT
  c.id as course_id,
  c.title as course_title,
  c.instructor_id,
  COUNT(DISTINCT pt.id) as total_sales,
  SUM(pt.amount) as total_revenue,
  AVG(pt.amount) as average_sale_price,
  MAX(pt.completed_at) as last_sale_date
FROM courses c
LEFT JOIN payment_transactions pt ON c.id = pt.course_id AND pt.status = 'succeeded'
GROUP BY c.id, c.title, c.instructor_id;

-- Instructor earnings view
CREATE OR REPLACE VIEW instructor_earnings AS
SELECT
  u.id as instructor_id,
  u.email,
  u.first_name || ' ' || u.last_name as instructor_name,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT pt.id) as total_sales,
  SUM(pt.amount) as gross_revenue,
  SUM(pt.instructor_payout) as total_earnings,
  SUM(pt.platform_fee) as platform_fees
FROM users u
JOIN courses c ON u.id = c.instructor_id
LEFT JOIN payment_transactions pt ON c.id = pt.course_id AND pt.status = 'succeeded'
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number_v2(
  p_prefix VARCHAR DEFAULT 'INV'
)
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
  FROM invoices
  WHERE EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE);

  v_number := p_prefix || '-' || v_year || v_month || '-' || LPAD(v_counter::TEXT, 5, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_counter INTEGER;
  v_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COUNT(*) + 1 INTO v_counter
  FROM receipts
  WHERE EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);

  v_number := 'RCP-' || v_year || '-' || LPAD(v_counter::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Generate payout number
CREATE OR REPLACE FUNCTION generate_payout_number()
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
  FROM instructor_payouts
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);

  v_number := 'PAYOUT-' || v_year || v_month || '-' || LPAD(v_counter::TEXT, 5, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Calculate applicable tax
CREATE OR REPLACE FUNCTION calculate_tax(
  p_amount NUMERIC,
  p_country_code VARCHAR,
  p_state_province VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  tax_amount NUMERIC,
  tax_rate NUMERIC,
  tax_type VARCHAR,
  tax_name VARCHAR
) AS $$
DECLARE
  v_tax_rate RECORD;
  v_tax_amount NUMERIC := 0;
BEGIN
  -- Find applicable tax rate
  SELECT * INTO v_tax_rate
  FROM tax_rates
  WHERE country_code = p_country_code
    AND (state_province IS NULL OR state_province = p_state_province)
    AND is_active = true
    AND (effective_from IS NULL OR effective_from <= NOW())
    AND (effective_until IS NULL OR effective_until >= NOW())
  ORDER BY state_province DESC NULLS LAST
  LIMIT 1;

  IF v_tax_rate.id IS NOT NULL THEN
    v_tax_amount := ROUND(p_amount * v_tax_rate.tax_rate / 100, 2);

    RETURN QUERY SELECT v_tax_amount, v_tax_rate.tax_rate, v_tax_rate.tax_type, v_tax_rate.tax_name;
  ELSE
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, NULL::VARCHAR, NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Calculate instructor payout for transaction
CREATE OR REPLACE FUNCTION calculate_instructor_share(
  p_transaction_amount NUMERIC,
  p_course_id UUID,
  p_instructor_id UUID
)
RETURNS TABLE(
  instructor_share NUMERIC,
  platform_share NUMERIC,
  instructor_percentage NUMERIC,
  platform_percentage NUMERIC
) AS $$
DECLARE
  v_rule RECORD;
  v_instructor_pct NUMERIC;
  v_platform_pct NUMERIC;
  v_instructor_amt NUMERIC;
  v_platform_amt NUMERIC;
BEGIN
  -- Find applicable revenue sharing rule
  SELECT * INTO v_rule
  FROM revenue_sharing_rules
  WHERE is_active = true
    AND (
      (applies_to = 'specific_course' AND course_id = p_course_id) OR
      (applies_to = 'specific_instructor' AND instructor_id = p_instructor_id) OR
      (applies_to = 'all')
    )
  ORDER BY priority DESC, created_at DESC
  LIMIT 1;

  IF v_rule.id IS NOT NULL THEN
    v_instructor_pct := v_rule.instructor_percentage;
    v_platform_pct := v_rule.platform_percentage;
  ELSE
    -- Default split
    v_instructor_pct := 70.00;
    v_platform_pct := 30.00;
  END IF;

  v_instructor_amt := ROUND(p_transaction_amount * v_instructor_pct / 100, 2);
  v_platform_amt := p_transaction_amount - v_instructor_amt;

  RETURN QUERY SELECT v_instructor_amt, v_platform_amt, v_instructor_pct, v_platform_pct;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_timestamp();

CREATE TRIGGER instructor_payouts_updated
  BEFORE UPDATE ON instructor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_timestamp();

-- Auto-generate receipt when invoice is paid
CREATE OR REPLACE FUNCTION generate_receipt_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_receipt_number VARCHAR(100);
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    v_receipt_number := generate_receipt_number();

    INSERT INTO receipts (
      receipt_number, invoice_id, transaction_id, user_id,
      amount_received, currency, issued_to_name, issued_to_email
    ) VALUES (
      v_receipt_number, NEW.id, NEW.transaction_id, NEW.user_id,
      NEW.total_amount, NEW.currency, NEW.billing_name, NEW.billing_email
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_paid_receipt
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid'))
  EXECUTE FUNCTION generate_receipt_on_payment();
