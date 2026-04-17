-- Verified Cryptographic Badges System
-- Open Badges 2.0 compliant with RSA signature verification

-- ========================================
-- 1. BADGE CLASSES (Templates)
-- ========================================

CREATE TABLE IF NOT EXISTS badge_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Open Badges 2.0 Required Fields
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL, -- Badge image (SVG/PNG)
  criteria_url VARCHAR(500), -- URL describing how to earn the badge

  -- Issuer Information
  issuer_name VARCHAR(255) DEFAULT 'TechLearn LMS',
  issuer_url VARCHAR(500) DEFAULT 'https://techlearn.com',
  issuer_email VARCHAR(255) DEFAULT 'badges@techlearn.com',

  -- Badge Metadata
  category VARCHAR(50), -- 'completion', 'achievement', 'skill', 'recognition'
  level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
  tags TEXT[], -- ['javascript', 'react', 'web-development']

  -- Course/Assessment Mapping
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- Requirements
  required_score DECIMAL(5,2), -- Minimum score to earn (if applicable)
  required_projects INTEGER DEFAULT 0,
  required_peer_reviews INTEGER DEFAULT 0,

  -- Display
  badge_color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
  icon_name VARCHAR(50), -- For UI rendering
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Publicly visible in portfolio

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badge_classes_course ON badge_classes(course_id);
CREATE INDEX idx_badge_classes_category ON badge_classes(category);
CREATE INDEX idx_badge_classes_active ON badge_classes(is_active);

-- ========================================
-- 2. BADGE ASSERTIONS (Issued Badges)
-- ========================================

CREATE TABLE IF NOT EXISTS badge_assertions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Open Badges 2.0 Required Fields
  badge_class_id UUID NOT NULL REFERENCES badge_classes(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_on TIMESTAMP DEFAULT NOW(),
  expires TIMESTAMP, -- Optional expiration date

  -- Verification
  verification_type VARCHAR(20) DEFAULT 'signed', -- 'signed', 'hosted'
  verification_url VARCHAR(500), -- URL to verification endpoint

  -- Cryptographic Signature
  signature TEXT NOT NULL, -- RSA signature of badge data
  signature_algorithm VARCHAR(50) DEFAULT 'RSA-SHA256',
  public_key_url VARCHAR(500), -- URL to public key for verification

  -- Evidence (Why badge was earned)
  evidence_url VARCHAR(500), -- Link to work/submission
  evidence_description TEXT,
  evidence_narrative TEXT, -- Story of how badge was earned

  -- Achievement Context
  achievement_score DECIMAL(5,2), -- Final score/grade
  achievement_percentile DECIMAL(5,2), -- Ranking among peers
  completion_time_hours INTEGER, -- Time to complete

  -- Metadata
  badge_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of badge content
  baked_image_url VARCHAR(500), -- Image with embedded metadata

  -- LinkedIn Integration
  linkedin_share_url VARCHAR(500),
  linkedin_shared_at TIMESTAMP,
  linkedin_post_id VARCHAR(255),

  -- Status
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,

  -- Privacy
  is_public BOOLEAN DEFAULT true, -- Show in portfolio

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badge_assertions_class ON badge_assertions(badge_class_id);
CREATE INDEX idx_badge_assertions_recipient ON badge_assertions(recipient_id);
CREATE INDEX idx_badge_assertions_hash ON badge_assertions(badge_hash);
CREATE INDEX idx_badge_assertions_public ON badge_assertions(recipient_id, is_public);
CREATE INDEX idx_badge_assertions_revoked ON badge_assertions(is_revoked);

-- ========================================
-- 3. RSA KEY PAIRS
-- ========================================

CREATE TABLE IF NOT EXISTS badge_key_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Key Information
  key_id VARCHAR(100) NOT NULL UNIQUE, -- Short identifier (e.g., 'techlearn-2024-01')
  public_key TEXT NOT NULL, -- PEM encoded public key
  private_key_encrypted TEXT NOT NULL, -- Encrypted PEM private key
  encryption_iv VARCHAR(32), -- Initialization vector for decryption

  -- Key Metadata
  key_algorithm VARCHAR(50) DEFAULT 'RSA',
  key_size INTEGER DEFAULT 2048, -- 2048 or 4096 bits
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Usage Tracking
  badges_signed INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Primary key for new badges
  expires_at TIMESTAMP, -- Key rotation
  revoked_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_badge_keys_key_id ON badge_key_pairs(key_id);
CREATE INDEX idx_badge_keys_active ON badge_key_pairs(is_active, is_primary);

-- ========================================
-- 4. BADGE VERIFICATION LOG
-- ========================================

CREATE TABLE IF NOT EXISTS badge_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Badge Being Verified
  badge_hash VARCHAR(64) NOT NULL,
  badge_assertion_id UUID REFERENCES badge_assertions(id) ON DELETE SET NULL,

  -- Verification Request
  verifier_ip INET,
  verifier_user_agent TEXT,
  verifier_organization VARCHAR(255), -- If they provide it

  -- Verification Result
  is_valid BOOLEAN NOT NULL,
  verification_method VARCHAR(50), -- 'signature', 'hash', 'api'

  -- Error Details (if verification failed)
  error_code VARCHAR(50),
  error_message TEXT,

  -- Metadata
  verification_time_ms INTEGER, -- How long verification took

  verified_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_log_badge ON badge_verification_log(badge_hash);
CREATE INDEX idx_verification_log_assertion ON badge_verification_log(badge_assertion_id);
CREATE INDEX idx_verification_log_time ON badge_verification_log(verified_at DESC);

-- ========================================
-- 5. BADGE SHARING ACTIVITY
-- ========================================

CREATE TABLE IF NOT EXISTS badge_sharing_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_assertion_id UUID NOT NULL REFERENCES badge_assertions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Platform
  platform VARCHAR(50) NOT NULL, -- 'linkedin', 'twitter', 'facebook', 'email', 'portfolio'
  platform_post_id VARCHAR(255), -- External post/share ID
  platform_url VARCHAR(500), -- Link to shared content

  -- Engagement Metrics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,

  -- Status
  is_public BOOLEAN DEFAULT true,

  shared_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP
);

CREATE INDEX idx_badge_sharing_assertion ON badge_sharing_activity(badge_assertion_id);
CREATE INDEX idx_badge_sharing_user ON badge_sharing_activity(user_id);
CREATE INDEX idx_badge_sharing_platform ON badge_sharing_activity(platform);

-- ========================================
-- 6. OPEN BADGES 2.0 COMPLIANCE
-- ========================================

-- Function: Generate Open Badges 2.0 JSON
CREATE OR REPLACE FUNCTION generate_open_badge_json(p_assertion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_assertion badge_assertions%ROWTYPE;
  v_badge_class badge_classes%ROWTYPE;
  v_recipient users%ROWTYPE;
  v_badge_json JSONB;
BEGIN
  -- Get badge data
  SELECT * INTO v_assertion FROM badge_assertions WHERE id = p_assertion_id;
  SELECT * INTO v_badge_class FROM badge_classes WHERE id = v_assertion.badge_class_id;
  SELECT * INTO v_recipient FROM users WHERE id = v_assertion.recipient_id;

  -- Build Open Badges 2.0 JSON
  v_badge_json := jsonb_build_object(
    '@context', 'https://w3id.org/openbadges/v2',
    'type', 'Assertion',
    'id', 'https://techlearn.com/badges/assertions/' || p_assertion_id,
    'badge', jsonb_build_object(
      'type', 'BadgeClass',
      'id', 'https://techlearn.com/badges/classes/' || v_badge_class.id,
      'name', v_badge_class.name,
      'description', v_badge_class.description,
      'image', v_badge_class.image_url,
      'criteria', jsonb_build_object(
        'narrative', v_badge_class.description
      ),
      'issuer', jsonb_build_object(
        'type', 'Profile',
        'id', 'https://techlearn.com/issuer',
        'name', v_badge_class.issuer_name,
        'url', v_badge_class.issuer_url,
        'email', v_badge_class.issuer_email
      )
    ),
    'recipient', jsonb_build_object(
      'type', 'email',
      'hashed', true,
      'identity', 'sha256$' || encode(digest(v_recipient.email, 'sha256'), 'hex')
    ),
    'issuedOn', v_assertion.issued_on,
    'verification', jsonb_build_object(
      'type', v_assertion.verification_type,
      'creator', v_assertion.public_key_url
    ),
    'evidence', CASE
      WHEN v_assertion.evidence_url IS NOT NULL THEN
        jsonb_build_object(
          'id', v_assertion.evidence_url,
          'narrative', v_assertion.evidence_narrative
        )
      ELSE NULL
    END
  );

  RETURN v_badge_json;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. TRIGGERS
-- ========================================

-- Trigger: Update badge_hash on assertion creation
CREATE OR REPLACE FUNCTION generate_badge_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate SHA-256 hash of badge content
  NEW.badge_hash := encode(
    digest(
      NEW.badge_class_id::TEXT ||
      NEW.recipient_id::TEXT ||
      NEW.issued_on::TEXT ||
      COALESCE(NEW.achievement_score::TEXT, ''),
      'sha256'
    ),
    'hex'
  );

  -- Set verification URL
  NEW.verification_url := 'https://techlearn.com/api/badges/verify/' || NEW.badge_hash;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_badge_hash
BEFORE INSERT ON badge_assertions
FOR EACH ROW
EXECUTE FUNCTION generate_badge_hash();

-- Trigger: Update key usage statistics
CREATE OR REPLACE FUNCTION update_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE badge_key_pairs
  SET badges_signed = badges_signed + 1, last_used_at = NOW()
  WHERE is_active = true AND is_primary = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_key_usage
AFTER INSERT ON badge_assertions
FOR EACH ROW
EXECUTE FUNCTION update_key_usage();

-- ========================================
-- 8. VIEWS
-- ========================================

-- View: Public badge portfolio
CREATE OR REPLACE VIEW public_badge_portfolio AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  ba.id AS assertion_id,
  ba.badge_hash,
  bc.name AS badge_name,
  bc.description AS badge_description,
  bc.image_url AS badge_image,
  bc.category,
  bc.level,
  bc.tags,
  ba.issued_on,
  ba.achievement_score,
  ba.achievement_percentile,
  ba.evidence_url,
  ba.verification_url
FROM badge_assertions ba
JOIN badge_classes bc ON ba.badge_class_id = bc.id
JOIN users u ON ba.recipient_id = u.id
WHERE ba.is_public = true
  AND ba.is_revoked = false
  AND bc.is_active = true
ORDER BY ba.issued_on DESC;

-- View: Badge statistics
CREATE OR REPLACE VIEW badge_statistics AS
SELECT
  bc.id AS badge_class_id,
  bc.name AS badge_name,
  bc.category,
  COUNT(ba.id) AS total_issued,
  COUNT(CASE WHEN ba.is_revoked THEN 1 END) AS total_revoked,
  AVG(ba.achievement_score) AS avg_score,
  COUNT(DISTINCT ba.recipient_id) AS unique_recipients,
  COUNT(CASE WHEN ba.linkedin_shared_at IS NOT NULL THEN 1 END) AS linkedin_shares,
  MIN(ba.issued_on) AS first_issued,
  MAX(ba.issued_on) AS last_issued
FROM badge_classes bc
LEFT JOIN badge_assertions ba ON bc.id = ba.badge_class_id
WHERE bc.is_active = true
GROUP BY bc.id, bc.name, bc.category;

-- ========================================
-- 9. SEED DATA
-- ========================================

-- Sample Badge Classes
INSERT INTO badge_classes (name, description, image_url, category, level, tags) VALUES
  ('Course Completion Master', 'Completed a full course with 85%+ score', 'https://cdn.techlearn.com/badges/completion.svg', 'completion', 'intermediate', ARRAY['completion', 'dedication']),
  ('Perfect Score Achiever', 'Achieved 100% on a final assessment', 'https://cdn.techlearn.com/badges/perfect.svg', 'achievement', 'expert', ARRAY['excellence', 'achievement']),
  ('Peer Review Champion', 'Completed 50+ peer code reviews with 4.5+ rating', 'https://cdn.techlearn.com/badges/peer-review.svg', 'recognition', 'advanced', ARRAY['collaboration', 'feedback']),
  ('JavaScript Expert', 'Mastered JavaScript with advanced certification', 'https://cdn.techlearn.com/badges/javascript.svg', 'skill', 'expert', ARRAY['javascript', 'programming']),
  ('React Professional', 'Demonstrated proficiency in React development', 'https://cdn.techlearn.com/badges/react.svg', 'skill', 'advanced', ARRAY['react', 'frontend', 'javascript']),
  ('Security Champion', 'Completed cybersecurity course with distinction', 'https://cdn.techlearn.com/badges/security.svg', 'skill', 'advanced', ARRAY['security', 'cybersecurity'])
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Verified Cryptographic Badges - Open Badges 2.0 compliant with RSA signatures';
