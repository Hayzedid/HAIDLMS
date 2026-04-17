-- ============================================================================
-- CERTIFICATES & CREDENTIALS SCHEMA
-- ============================================================================
-- Certificate templates, generation, verification, and digital credentials
-- with blockchain support and exportable formats
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CERTIFICATE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template type
  template_type VARCHAR(50) DEFAULT 'completion', -- 'completion', 'achievement', 'participation', 'excellence', 'custom'

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Design
  layout JSONB NOT NULL, -- Template layout configuration
  background_image_url TEXT,
  border_style VARCHAR(50), -- 'classic', 'modern', 'minimal', 'ornate', 'custom'
  color_scheme JSONB, -- {primary: '#color1', secondary: '#color2', text: '#color3'}

  -- Text configuration
  title_text VARCHAR(255) DEFAULT 'Certificate of Completion',
  body_template TEXT, -- Template with placeholders: {student_name}, {course_name}, {completion_date}, etc.
  footer_text TEXT,

  -- Logos and signatures
  organization_logo_url TEXT,
  signature_images TEXT[], -- Array of signature image URLs
  signatory_names TEXT[], -- Array of signatory names
  signatory_titles TEXT[], -- Array of signatory titles

  -- Dimensions (for PDF generation)
  page_size VARCHAR(20) DEFAULT 'A4', -- 'A4', 'Letter', 'Custom'
  orientation VARCHAR(20) DEFAULT 'landscape', -- 'landscape', 'portrait'
  width_px INTEGER,
  height_px INTEGER,

  -- Credentials
  include_qr_code BOOLEAN DEFAULT true,
  include_verification_url BOOLEAN DEFAULT true,
  include_credential_id BOOLEAN DEFAULT true,

  -- Blockchain
  enable_blockchain BOOLEAN DEFAULT false,
  blockchain_network VARCHAR(50), -- 'ethereum', 'polygon', 'solana', etc.

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_templates_created_by ON certificate_templates(created_by);
CREATE INDEX idx_certificate_templates_organization ON certificate_templates(organization_id);
CREATE INDEX idx_certificate_templates_type ON certificate_templates(template_type);
CREATE INDEX idx_certificate_templates_active ON certificate_templates(is_active);

-- ============================================================================
-- CERTIFICATE CRITERIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,

  -- Criteria type
  criteria_type VARCHAR(50) NOT NULL, -- 'course_completion', 'assessment_score', 'grade_average', 'attendance', 'custom'

  -- Requirements
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- Thresholds
  minimum_score NUMERIC(5,2), -- For assessments
  minimum_grade NUMERIC(5,2), -- For overall grade
  minimum_attendance_percentage NUMERIC(5,2), -- For attendance
  required_modules UUID[], -- Array of module IDs that must be completed

  -- Custom criteria
  custom_rule JSONB, -- Custom logic for awarding certificate

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_criteria_template ON certificate_criteria(template_id);
CREATE INDEX idx_certificate_criteria_course ON certificate_criteria(course_id);

-- ============================================================================
-- ISSUED CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS issued_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE RESTRICT,

  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL, -- Stored in case user account is deleted
  recipient_email VARCHAR(255),

  -- Course/Achievement
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- Certificate details
  certificate_number VARCHAR(100) UNIQUE NOT NULL, -- Human-readable certificate number
  credential_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- For verification

  -- Issue details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE, -- NULL if never expires
  is_active BOOLEAN DEFAULT true,

  -- Achievement data
  course_name VARCHAR(255),
  completion_date DATE,
  final_grade NUMERIC(5,2),
  final_score NUMERIC(10,2),
  hours_completed NUMERIC(8,2),
  skills_earned TEXT[],

  -- Custom fields
  custom_fields JSONB, -- Additional certificate-specific data

  -- PDF generation
  pdf_url TEXT, -- URL to generated PDF
  pdf_generated_at TIMESTAMP,

  -- Verification
  verification_url TEXT,
  verification_code VARCHAR(50) UNIQUE,
  qr_code_url TEXT,

  -- Blockchain
  blockchain_hash VARCHAR(255), -- Transaction hash
  blockchain_url TEXT, -- Link to blockchain explorer
  blockchain_verified BOOLEAN DEFAULT false,
  blockchain_verified_at TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'issued', -- 'issued', 'revoked', 'suspended', 'expired'
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revocation_reason TEXT,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  public_url TEXT, -- Shareable public URL
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_issued_certificates_template ON issued_certificates(template_id);
CREATE INDEX idx_issued_certificates_user ON issued_certificates(user_id);
CREATE INDEX idx_issued_certificates_course ON issued_certificates(course_id);
CREATE INDEX idx_issued_certificates_credential ON issued_certificates(credential_id);
CREATE INDEX idx_issued_certificates_number ON issued_certificates(certificate_number);
CREATE INDEX idx_issued_certificates_verification ON issued_certificates(verification_code);
CREATE INDEX idx_issued_certificates_status ON issued_certificates(status);
CREATE INDEX idx_issued_certificates_issue_date ON issued_certificates(issue_date);

-- ============================================================================
-- CERTIFICATE SHARES
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  certificate_id UUID NOT NULL REFERENCES issued_certificates(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Share details
  platform VARCHAR(50), -- 'linkedin', 'twitter', 'facebook', 'email', 'link'
  share_url TEXT,

  -- Tracking
  share_date TIMESTAMP DEFAULT NOW(),
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_shares_certificate ON certificate_shares(certificate_id);
CREATE INDEX idx_certificate_shares_shared_by ON certificate_shares(shared_by);
CREATE INDEX idx_certificate_shares_platform ON certificate_shares(platform);

-- ============================================================================
-- CERTIFICATE VERIFICATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  certificate_id UUID REFERENCES issued_certificates(id) ON DELETE SET NULL,
  credential_id UUID,
  verification_code VARCHAR(50),

  -- Verification details
  verified_at TIMESTAMP DEFAULT NOW(),
  verification_method VARCHAR(50), -- 'qr_code', 'url', 'api', 'manual'

  -- Result
  verification_result VARCHAR(50), -- 'valid', 'invalid', 'revoked', 'expired', 'not_found'

  -- Request details
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- Verifier (if logged in)
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_certificate_verification_log_certificate ON certificate_verification_log(certificate_id);
CREATE INDEX idx_certificate_verification_log_credential ON certificate_verification_log(credential_id);
CREATE INDEX idx_certificate_verification_log_verified_at ON certificate_verification_log(verified_at);

-- ============================================================================
-- DIGITAL BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS digital_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Badge information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  badge_type VARCHAR(50) DEFAULT 'achievement', -- 'achievement', 'skill', 'milestone', 'participation', 'custom'

  -- Visual
  image_url TEXT NOT NULL,
  icon_url TEXT,
  color VARCHAR(20),

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Criteria for earning
  criteria_description TEXT NOT NULL,
  earning_criteria JSONB, -- Structured criteria

  -- Associated content
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  skill_tags TEXT[],

  -- Rarity/Value
  rarity VARCHAR(50), -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  points_value INTEGER DEFAULT 0, -- Gamification points

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_stackable BOOLEAN DEFAULT false, -- Can earn multiple times
  max_earners INTEGER, -- NULL for unlimited

  -- Statistics
  total_earned INTEGER DEFAULT 0,
  total_unique_earners INTEGER DEFAULT 0,

  -- Open Badges 2.0 specification
  open_badge_id VARCHAR(255) UNIQUE,
  issuer_url TEXT,
  criteria_url TEXT,

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_digital_badges_created_by ON digital_badges(created_by);
CREATE INDEX idx_digital_badges_organization ON digital_badges(organization_id);
CREATE INDEX idx_digital_badges_type ON digital_badges(badge_type);
CREATE INDEX idx_digital_badges_course ON digital_badges(course_id);
CREATE INDEX idx_digital_badges_active ON digital_badges(is_active);

-- ============================================================================
-- BADGE AWARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  badge_id UUID NOT NULL REFERENCES digital_badges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Award details
  awarded_at TIMESTAMP DEFAULT NOW(),
  awarded_by UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if auto-awarded
  award_reason TEXT,

  -- Context
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  certificate_id UUID REFERENCES issued_certificates(id) ON DELETE SET NULL,

  -- Evidence
  evidence_url TEXT,
  evidence_description TEXT,

  -- Verification
  verification_code VARCHAR(50) UNIQUE,

  -- Display
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Status
  is_visible BOOLEAN DEFAULT true,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revocation_reason TEXT,

  -- Open Badges
  assertion_url TEXT,
  baked_image_url TEXT, -- Image with badge data embedded

  -- Sharing
  shared_on_profile BOOLEAN DEFAULT true,
  share_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badge_awards_badge ON badge_awards(badge_id);
CREATE INDEX idx_badge_awards_user ON badge_awards(user_id);
CREATE INDEX idx_badge_awards_awarded_at ON badge_awards(awarded_at);
CREATE INDEX idx_badge_awards_course ON badge_awards(course_id);
CREATE UNIQUE INDEX idx_badge_awards_unique ON badge_awards(badge_id, user_id, awarded_at) WHERE is_revoked = false;

-- ============================================================================
-- CREDENTIAL WALLETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS credential_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Wallet settings
  is_public BOOLEAN DEFAULT false,
  public_url_slug VARCHAR(100) UNIQUE,

  -- Display preferences
  featured_certificates UUID[], -- Array of certificate IDs
  featured_badges UUID[], -- Array of badge IDs
  display_order JSONB, -- Custom ordering

  -- Sharing
  share_with_employers BOOLEAN DEFAULT false,
  share_with_educators BOOLEAN DEFAULT false,

  -- Statistics
  total_certificates INTEGER DEFAULT 0,
  total_badges INTEGER DEFAULT 0,
  total_skills INTEGER DEFAULT 0,
  total_hours_learned NUMERIC(10,2) DEFAULT 0,

  -- Profile
  bio TEXT,
  headline VARCHAR(255),
  website_url TEXT,
  linkedin_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_credential_wallets_user ON credential_wallets(user_id);
CREATE INDEX idx_credential_wallets_public_url ON credential_wallets(public_url_slug);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active certificates view
CREATE OR REPLACE VIEW active_certificates AS
SELECT
  ic.*,
  u.name as recipient_name_current,
  u.email as recipient_email_current,
  ct.name as template_name,
  c.title as course_title
FROM issued_certificates ic
JOIN users u ON ic.user_id = u.id
JOIN certificate_templates ct ON ic.template_id = ct.id
LEFT JOIN courses c ON ic.course_id = c.id
WHERE ic.status = 'issued'
  AND ic.is_active = true
  AND (ic.expiration_date IS NULL OR ic.expiration_date > CURRENT_DATE);

-- Badge leaderboard view
CREATE OR REPLACE VIEW badge_leaderboard AS
SELECT
  u.id as user_id,
  u.name as user_name,
  u.email,
  COUNT(DISTINCT ba.id) as total_badges,
  SUM(db.points_value) as total_points,
  COUNT(DISTINCT ba.id) FILTER (WHERE db.rarity = 'legendary') as legendary_badges,
  COUNT(DISTINCT ba.id) FILTER (WHERE db.rarity = 'epic') as epic_badges,
  COUNT(DISTINCT ba.id) FILTER (WHERE db.rarity = 'rare') as rare_badges
FROM users u
LEFT JOIN badge_awards ba ON u.id = ba.user_id AND ba.is_revoked = false
LEFT JOIN digital_badges db ON ba.badge_id = db.id
GROUP BY u.id, u.name, u.email
ORDER BY total_points DESC, total_badges DESC;

-- Certificate issuance summary
CREATE OR REPLACE VIEW certificate_issuance_summary AS
SELECT
  ct.id as template_id,
  ct.name as template_name,
  ct.template_type,
  COUNT(DISTINCT ic.id) as total_issued,
  COUNT(DISTINCT ic.user_id) as unique_recipients,
  COUNT(DISTINCT ic.id) FILTER (WHERE ic.status = 'issued') as active_certificates,
  COUNT(DISTINCT ic.id) FILTER (WHERE ic.status = 'revoked') as revoked_certificates,
  MAX(ic.issue_date) as last_issued_date
FROM certificate_templates ct
LEFT JOIN issued_certificates ic ON ct.id = ic.template_id
GROUP BY ct.id, ct.name, ct.template_type;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(
  p_prefix VARCHAR DEFAULT 'CERT'
)
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_counter INTEGER;
  v_number VARCHAR(100);
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get next counter for this year
  SELECT COUNT(*) + 1 INTO v_counter
  FROM issued_certificates
  WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Format: PREFIX-YYYY-000001
  v_number := p_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 6, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check certificate eligibility
CREATE OR REPLACE FUNCTION check_certificate_eligibility(
  p_user_id UUID,
  p_template_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_criteria RECORD;
  v_eligible BOOLEAN := true;
BEGIN
  -- Check all criteria for this template
  FOR v_criteria IN
    SELECT * FROM certificate_criteria WHERE template_id = p_template_id
  LOOP
    -- Check course completion
    IF v_criteria.criteria_type = 'course_completion' AND v_criteria.course_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM enrollments
        WHERE user_id = p_user_id
          AND course_id = v_criteria.course_id
          AND status = 'completed'
      ) THEN
        v_eligible := false;
        EXIT;
      END IF;
    END IF;

    -- Check minimum score
    IF v_criteria.criteria_type = 'assessment_score' AND v_criteria.minimum_score IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM assessment_attempts
        WHERE user_id = p_user_id
          AND assessment_id = v_criteria.assessment_id
          AND percentage >= v_criteria.minimum_score
          AND status = 'graded'
      ) THEN
        v_eligible := false;
        EXIT;
      END IF;
    END IF;

    -- Check minimum grade
    IF v_criteria.criteria_type = 'grade_average' AND v_criteria.minimum_grade IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM student_grades
        WHERE user_id = p_user_id
          AND course_id = v_criteria.course_id
          AND percentage >= v_criteria.minimum_grade
      ) THEN
        v_eligible := false;
        EXIT;
      END IF;
    END IF;
  END LOOP;

  RETURN v_eligible;
END;
$$ LANGUAGE plpgsql;

-- Function to revoke certificate
CREATE OR REPLACE FUNCTION revoke_certificate(
  p_certificate_id UUID,
  p_revoked_by UUID,
  p_reason TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE issued_certificates
  SET status = 'revoked',
      is_active = false,
      revoked_at = NOW(),
      revoked_by = p_revoked_by,
      revocation_reason = p_reason
  WHERE id = p_certificate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update wallet statistics
CREATE OR REPLACE FUNCTION update_wallet_statistics(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE credential_wallets
  SET total_certificates = (
        SELECT COUNT(*) FROM issued_certificates
        WHERE user_id = p_user_id AND status = 'issued' AND is_active = true
      ),
      total_badges = (
        SELECT COUNT(*) FROM badge_awards
        WHERE user_id = p_user_id AND is_revoked = false
      ),
      total_hours_learned = (
        SELECT COALESCE(SUM(hours_completed), 0)
        FROM issued_certificates
        WHERE user_id = p_user_id AND status = 'issued'
      )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_certificates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_timestamp();

CREATE TRIGGER issued_certificates_updated_at
  BEFORE UPDATE ON issued_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_timestamp();

CREATE TRIGGER digital_badges_updated_at
  BEFORE UPDATE ON digital_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_timestamp();

CREATE TRIGGER badge_awards_updated_at
  BEFORE UPDATE ON badge_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_timestamp();

-- Update template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE certificate_templates
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issued_certificates_increment_usage
  AFTER INSERT ON issued_certificates
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- Update badge statistics
CREATE OR REPLACE FUNCTION update_badge_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE digital_badges
  SET total_earned = (
        SELECT COUNT(*) FROM badge_awards WHERE badge_id = NEW.badge_id
      ),
      total_unique_earners = (
        SELECT COUNT(DISTINCT user_id) FROM badge_awards WHERE badge_id = NEW.badge_id
      )
  WHERE id = NEW.badge_id;

  -- Update wallet statistics
  PERFORM update_wallet_statistics(NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER badge_awards_update_statistics
  AFTER INSERT ON badge_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_statistics();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE certificate_templates IS 'Reusable certificate templates with design and layout';
COMMENT ON TABLE certificate_criteria IS 'Criteria that must be met to earn a certificate';
COMMENT ON TABLE issued_certificates IS 'Certificates issued to users';
COMMENT ON TABLE certificate_shares IS 'Social media shares of certificates';
COMMENT ON TABLE certificate_verification_log IS 'Log of certificate verification attempts';
COMMENT ON TABLE digital_badges IS 'Digital badge definitions';
COMMENT ON TABLE badge_awards IS 'Badges awarded to users';
COMMENT ON TABLE credential_wallets IS 'User credential portfolios';
