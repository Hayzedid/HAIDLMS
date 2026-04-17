-- ============================================================================
-- HAIDLMS: COURSE PRICING & ENROLLMENT SCHEMA
-- ============================================================================
-- This schema handles course pricing, discount codes, coupons, bulk purchasing,
-- and enrollment workflows with payment verification
-- ============================================================================

-- ============================================================================
-- COURSE PRICING
-- ============================================================================

-- Course pricing configuration
CREATE TABLE IF NOT EXISTS course_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Pricing model
  pricing_model VARCHAR(50) NOT NULL DEFAULT 'one_time', -- one_time, subscription, tiered, free, freemium

  -- One-time pricing
  base_price NUMERIC(10, 2) DEFAULT 0,
  sale_price NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Subscription pricing (if applicable)
  subscription_price NUMERIC(10, 2),
  subscription_interval VARCHAR(20), -- monthly, quarterly, yearly
  trial_period_days INTEGER DEFAULT 0,

  -- Tiered pricing (if applicable)
  has_tiered_pricing BOOLEAN DEFAULT false,

  -- Free/Freemium settings
  is_free BOOLEAN DEFAULT false,
  is_freemium BOOLEAN DEFAULT false, -- Free content with paid upgrades

  -- Pricing status
  is_active BOOLEAN DEFAULT true,
  is_on_sale BOOLEAN DEFAULT false,
  sale_start_date TIMESTAMP,
  sale_end_date TIMESTAMP,

  -- Limits and access
  lifetime_access BOOLEAN DEFAULT true,
  access_duration_days INTEGER, -- If not lifetime, duration in days

  -- Metadata
  compare_at_price NUMERIC(10, 2), -- Original price for showing discounts
  pricing_description TEXT,
  tax_inclusive BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_course_pricing_course ON course_pricing(course_id);
CREATE INDEX idx_course_pricing_model ON course_pricing(pricing_model);
CREATE INDEX idx_course_pricing_free ON course_pricing(is_free);

-- ============================================================================
-- PRICING TIERS
-- ============================================================================

-- Tiered pricing options (Basic, Pro, Enterprise)
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_pricing_id UUID NOT NULL REFERENCES course_pricing(id) ON DELETE CASCADE,

  -- Tier details
  tier_name VARCHAR(100) NOT NULL, -- Basic, Pro, Premium, Enterprise
  tier_level INTEGER NOT NULL, -- 1, 2, 3 (for ordering)

  -- Price
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Subscription (if applicable)
  subscription_price NUMERIC(10, 2),
  subscription_interval VARCHAR(20),

  -- Features included
  features JSONB DEFAULT '[]', -- Array of feature descriptions
  modules_included INTEGER, -- Number of modules accessible
  projects_included INTEGER,
  support_level VARCHAR(50), -- basic, priority, dedicated

  -- Limits
  max_enrollments INTEGER, -- Null = unlimited

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_most_popular BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_tiers_pricing ON pricing_tiers(course_pricing_id);
CREATE INDEX idx_pricing_tiers_level ON pricing_tiers(tier_level);

-- ============================================================================
-- DISCOUNT CODES & COUPONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Discount details
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value NUMERIC(10, 2) NOT NULL, -- 20 for 20%, or $20 for fixed

  -- Applicability
  applies_to VARCHAR(50) DEFAULT 'all', -- all, specific_courses, specific_categories
  course_ids UUID[], -- Specific courses if applies_to = 'specific_courses'
  category_ids UUID[], -- Specific categories

  -- Usage limits
  max_uses INTEGER, -- Null = unlimited
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- Validity
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,

  -- Minimum purchase
  minimum_purchase_amount NUMERIC(10, 2) DEFAULT 0,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX idx_discount_codes_validity ON discount_codes(valid_from, valid_until);

-- Discount code usage tracking
CREATE TABLE IF NOT EXISTS discount_code_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Usage details
  course_id UUID REFERENCES courses(id),
  enrollment_id UUID REFERENCES enrollments(id),
  transaction_id UUID REFERENCES payment_transactions(id),

  -- Discount applied
  original_price NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  final_price NUMERIC(10, 2) NOT NULL,

  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discount_uses_code ON discount_code_uses(discount_code_id);
CREATE INDEX idx_discount_uses_user ON discount_code_uses(user_id);
CREATE INDEX idx_discount_uses_course ON discount_code_uses(course_id);

-- ============================================================================
-- BULK PURCHASE DISCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Bulk tiers
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER, -- Null = no upper limit

  -- Discount
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_per_seat, fixed_total
  discount_value NUMERIC(10, 2) NOT NULL,

  -- Pricing
  price_per_seat NUMERIC(10, 2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Validity
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_pricing_course ON bulk_pricing(course_id);
CREATE INDEX idx_bulk_pricing_org ON bulk_pricing(organization_id);

-- ============================================================================
-- ENROLLMENT PAYMENTS
-- ============================================================================

-- Link enrollments to payments
CREATE TABLE IF NOT EXISTS enrollment_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES payment_transactions(id),

  -- Pricing details at time of enrollment
  pricing_model VARCHAR(50) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  final_price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Discount applied
  discount_code_id UUID REFERENCES discount_codes(id),
  bulk_pricing_id UUID REFERENCES bulk_pricing(id),

  -- Payment status
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(50),

  -- Access
  access_granted BOOLEAN DEFAULT false,
  access_granted_at TIMESTAMP,
  access_expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrollment_payments_enrollment ON enrollment_payments(enrollment_id);
CREATE INDEX idx_enrollment_payments_transaction ON enrollment_payments(transaction_id);
CREATE INDEX idx_enrollment_payments_status ON enrollment_payments(payment_status);

-- ============================================================================
-- BULK ENROLLMENTS
-- ============================================================================

-- Bulk enrollment orders (for organizations)
CREATE TABLE IF NOT EXISTS bulk_enrollment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,

  -- Purchaser
  organization_id UUID REFERENCES organizations(id),
  purchased_by UUID NOT NULL REFERENCES users(id),

  -- Course details
  course_id UUID NOT NULL REFERENCES courses(id),
  quantity INTEGER NOT NULL,

  -- Pricing
  price_per_seat NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  final_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Discount applied
  discount_code_id UUID REFERENCES discount_codes(id),
  bulk_pricing_id UUID REFERENCES bulk_pricing(id),

  -- Payment
  transaction_id UUID REFERENCES payment_transactions(id),
  payment_status VARCHAR(50) DEFAULT 'pending',

  -- Seat assignments
  seats_assigned INTEGER DEFAULT 0,
  seats_remaining INTEGER,

  -- Status
  order_status VARCHAR(50) DEFAULT 'active', -- active, completed, canceled, expired

  -- Validity
  valid_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_orders_org ON bulk_enrollment_orders(organization_id);
CREATE INDEX idx_bulk_orders_course ON bulk_enrollment_orders(course_id);
CREATE INDEX idx_bulk_orders_status ON bulk_enrollment_orders(order_status);

-- Bulk enrollment seat assignments
CREATE TABLE IF NOT EXISTS bulk_enrollment_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bulk_order_id UUID NOT NULL REFERENCES bulk_enrollment_orders(id) ON DELETE CASCADE,

  -- Seat assignment
  assigned_to_email VARCHAR(255),
  assigned_to_user_id UUID REFERENCES users(id),
  enrollment_id UUID REFERENCES enrollments(id),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, invited, accepted, revoked
  invitation_sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  revoked_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_seats_order ON bulk_enrollment_seats(bulk_order_id);
CREATE INDEX idx_bulk_seats_user ON bulk_enrollment_seats(assigned_to_user_id);
CREATE INDEX idx_bulk_seats_status ON bulk_enrollment_seats(status);

-- ============================================================================
-- GIFT ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_code VARCHAR(100) UNIQUE NOT NULL,

  -- Course
  course_id UUID NOT NULL REFERENCES courses(id),

  -- Purchaser
  purchased_by UUID NOT NULL REFERENCES users(id),
  transaction_id UUID REFERENCES payment_transactions(id),

  -- Recipient
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_user_id UUID REFERENCES users(id),
  enrollment_id UUID REFERENCES enrollments(id),

  -- Gift details
  personal_message TEXT,
  gift_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, redeemed, expired, refunded
  sent_at TIMESTAMP,
  redeemed_at TIMESTAMP,

  -- Validity
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gift_enrollments_code ON gift_enrollments(gift_code);
CREATE INDEX idx_gift_enrollments_recipient ON gift_enrollments(recipient_email);
CREATE INDEX idx_gift_enrollments_status ON gift_enrollments(status);

-- ============================================================================
-- PRICING ANALYTICS
-- ============================================================================

-- Price change history for analytics
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_pricing_id UUID NOT NULL REFERENCES course_pricing(id),

  -- Price snapshot
  base_price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  pricing_model VARCHAR(50),

  -- Metadata
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_history_course ON pricing_history(course_pricing_id);
CREATE INDEX idx_pricing_history_created ON pricing_history(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active course pricing view
CREATE OR REPLACE VIEW active_course_pricing AS
SELECT
  cp.*,
  c.title as course_title,
  c.instructor_id,
  CASE
    WHEN cp.is_on_sale AND cp.sale_price IS NOT NULL AND
         NOW() BETWEEN COALESCE(cp.sale_start_date, NOW()) AND COALESCE(cp.sale_end_date, NOW() + INTERVAL '100 years')
    THEN cp.sale_price
    ELSE cp.base_price
  END as current_price,
  CASE
    WHEN cp.is_on_sale AND cp.sale_price IS NOT NULL AND
         NOW() BETWEEN COALESCE(cp.sale_start_date, NOW()) AND COALESCE(cp.sale_end_date, NOW() + INTERVAL '100 years')
    THEN ROUND(((cp.base_price - cp.sale_price) / cp.base_price * 100), 2)
    ELSE 0
  END as discount_percentage
FROM course_pricing cp
JOIN courses c ON cp.course_id = c.id
WHERE cp.is_active = true;

-- Active discount codes view
CREATE OR REPLACE VIEW active_discount_codes AS
SELECT
  dc.*,
  dc.max_uses - dc.current_uses as remaining_uses
FROM discount_codes dc
WHERE dc.is_active = true
  AND (dc.valid_from IS NULL OR dc.valid_from <= NOW())
  AND (dc.valid_until IS NULL OR dc.valid_until >= NOW())
  AND (dc.max_uses IS NULL OR dc.current_uses < dc.max_uses);

-- Revenue by course view
CREATE OR REPLACE VIEW revenue_by_course AS
SELECT
  c.id as course_id,
  c.title as course_title,
  COUNT(DISTINCT ep.id) as total_enrollments,
  SUM(ep.final_price) as total_revenue,
  AVG(ep.final_price) as average_price,
  SUM(ep.discount_amount) as total_discounts,
  COUNT(DISTINCT ep.discount_code_id) as discount_uses
FROM courses c
LEFT JOIN enrollment_payments ep ON c.id = (
  SELECT e.course_id FROM enrollments e WHERE e.id = ep.enrollment_id
)
WHERE ep.payment_status = 'completed'
GROUP BY c.id, c.title;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate final price with discount
CREATE OR REPLACE FUNCTION calculate_final_price(
  p_base_price NUMERIC,
  p_discount_type VARCHAR,
  p_discount_value NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_final_price NUMERIC;
BEGIN
  IF p_discount_type = 'percentage' THEN
    v_final_price := p_base_price * (1 - (p_discount_value / 100));
  ELSIF p_discount_type = 'fixed_amount' THEN
    v_final_price := p_base_price - p_discount_value;
  ELSE
    v_final_price := p_base_price;
  END IF;

  -- Ensure price is never negative
  IF v_final_price < 0 THEN
    v_final_price := 0;
  END IF;

  RETURN ROUND(v_final_price, 2);
END;
$$ LANGUAGE plpgsql;

-- Validate discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code VARCHAR,
  p_user_id UUID,
  p_course_id UUID,
  p_purchase_amount NUMERIC
)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_code_id UUID,
  discount_type VARCHAR,
  discount_value NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_code RECORD;
  v_uses_by_user INTEGER;
BEGIN
  -- Get discount code
  SELECT * INTO v_code FROM discount_codes WHERE code = p_code;

  -- Check if code exists
  IF v_code.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, NULL::NUMERIC, 'Invalid discount code';
    RETURN;
  END IF;

  -- Check if active
  IF NOT v_code.is_active THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'Discount code is inactive';
    RETURN;
  END IF;

  -- Check validity dates
  IF v_code.valid_from IS NOT NULL AND NOW() < v_code.valid_from THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'Discount code not yet valid';
    RETURN;
  END IF;

  IF v_code.valid_until IS NOT NULL AND NOW() > v_code.valid_until THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'Discount code has expired';
    RETURN;
  END IF;

  -- Check max uses
  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'Discount code has reached maximum uses';
    RETURN;
  END IF;

  -- Check max uses per user
  SELECT COUNT(*) INTO v_uses_by_user
  FROM discount_code_uses
  WHERE discount_code_id = v_code.id AND user_id = p_user_id;

  IF v_code.max_uses_per_user IS NOT NULL AND v_uses_by_user >= v_code.max_uses_per_user THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'You have already used this discount code';
    RETURN;
  END IF;

  -- Check minimum purchase amount
  IF p_purchase_amount < v_code.minimum_purchase_amount THEN
    RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value,
      'Purchase amount does not meet minimum requirement';
    RETURN;
  END IF;

  -- Check course applicability
  IF v_code.applies_to = 'specific_courses' AND p_course_id IS NOT NULL THEN
    IF NOT (p_course_id = ANY(v_code.course_ids)) THEN
      RETURN QUERY SELECT false, v_code.id, v_code.discount_type, v_code.discount_value, 'Discount code not applicable to this course';
      RETURN;
    END IF;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, v_code.id, v_code.discount_type, v_code.discount_value, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Generate bulk order number
CREATE OR REPLACE FUNCTION generate_bulk_order_number()
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_counter INTEGER;
  v_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COUNT(*) + 1 INTO v_counter
  FROM bulk_enrollment_orders
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

  v_number := 'BULK-' || v_year || '-' || LPAD(v_counter::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_pricing_updated
  BEFORE UPDATE ON course_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_timestamp();

CREATE TRIGGER discount_codes_updated
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_timestamp();

-- Track pricing changes in history
CREATE OR REPLACE FUNCTION track_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.base_price != NEW.base_price OR
     OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
     OLD.pricing_model != NEW.pricing_model THEN

    INSERT INTO pricing_history (
      course_pricing_id, base_price, sale_price, pricing_model
    ) VALUES (
      NEW.id, NEW.base_price, NEW.sale_price, NEW.pricing_model
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_history_tracker
  AFTER UPDATE ON course_pricing
  FOR EACH ROW
  EXECUTE FUNCTION track_pricing_changes();

-- Update discount code usage count
CREATE OR REPLACE FUNCTION increment_discount_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.discount_code_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discount_code_used
  AFTER INSERT ON discount_code_uses
  FOR EACH ROW
  EXECUTE FUNCTION increment_discount_usage();

-- Update bulk order seat counts
CREATE OR REPLACE FUNCTION update_bulk_seat_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE bulk_enrollment_orders
    SET seats_assigned = seats_assigned + 1,
        seats_remaining = seats_remaining - 1
    WHERE id = NEW.bulk_order_id;
  ELSIF OLD.status = 'accepted' AND NEW.status = 'revoked' THEN
    UPDATE bulk_enrollment_orders
    SET seats_assigned = seats_assigned - 1,
        seats_remaining = seats_remaining + 1
    WHERE id = NEW.bulk_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bulk_seat_status_updated
  AFTER INSERT OR UPDATE ON bulk_enrollment_seats
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_seat_counts();
