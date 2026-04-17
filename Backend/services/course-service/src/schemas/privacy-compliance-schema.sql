-- Data Compliance & Privacy System Schema
-- GDPR, CCPA, data retention, consent management, privacy auditing

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE consent_status AS ENUM ('pending', 'granted', 'denied', 'withdrawn', 'expired');
CREATE TYPE data_processing_purpose AS ENUM (
  'service_provision', 'analytics', 'marketing', 'personalization',
  'security', 'legal_obligation', 'legitimate_interest'
);
CREATE TYPE privacy_request_type AS ENUM (
  'data_access', 'data_portability', 'data_erasure',
  'data_rectification', 'processing_restriction', 'objection'
);
CREATE TYPE privacy_request_status AS ENUM (
  'pending', 'in_progress', 'completed', 'rejected', 'cancelled'
);
CREATE TYPE data_category AS ENUM (
  'personal_identity', 'contact_info', 'account_data',
  'educational_data', 'financial_data', 'behavioral_data',
  'technical_data', 'communication_data'
);

-- ========================================
-- 2. CONSENT MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Consent Details
  consent_type VARCHAR(100) NOT NULL, -- 'terms_of_service', 'privacy_policy', 'marketing', etc.
  consent_version VARCHAR(50) NOT NULL,
  consent_purpose data_processing_purpose NOT NULL,

  -- Status
  status consent_status NOT NULL DEFAULT 'pending',

  -- Timing
  granted_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  consent_method VARCHAR(50), -- 'explicit', 'implicit', 'opt-in', 'opt-out'

  -- Consent Text
  consent_text TEXT, -- Snapshot of what user consented to
  consent_url VARCHAR(500),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_consent UNIQUE (user_id, consent_type, consent_version)
);

CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);
CREATE INDEX idx_consents_status ON user_consents(status);
CREATE INDEX idx_consents_purpose ON user_consents(consent_purpose);

-- ========================================
-- 3. PRIVACY REQUESTS (GDPR/CCPA)
-- ========================================

CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Requester
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_email VARCHAR(255) NOT NULL,

  -- Request Type
  request_type privacy_request_type NOT NULL,
  request_description TEXT,

  -- Status
  status privacy_request_status DEFAULT 'pending',

  -- Data Categories
  data_categories data_category[],
  specific_data_types TEXT[], -- More specific data types

  -- Processing
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 1, -- 1 (low) to 5 (high)

  -- Timeline
  requested_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL, -- Legal deadline (30 days for GDPR)
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Result
  result_data JSONB, -- For data access/portability requests
  result_file_path VARCHAR(1000), -- Path to exported data file
  rejection_reason TEXT,

  -- Verification
  identity_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verification_method VARCHAR(100),

  -- Audit
  processing_notes TEXT,
  actions_taken JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_privacy_requests_user ON privacy_requests(user_id);
CREATE INDEX idx_privacy_requests_type ON privacy_requests(request_type);
CREATE INDEX idx_privacy_requests_status ON privacy_requests(status);
CREATE INDEX idx_privacy_requests_due ON privacy_requests(due_date);
CREATE INDEX idx_privacy_requests_assigned ON privacy_requests(assigned_to);

-- ========================================
-- 4. DATA RETENTION POLICIES
-- ========================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Policy Identity
  policy_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,

  -- Data Type
  data_category data_category NOT NULL,
  table_name VARCHAR(255), -- Database table
  data_type VARCHAR(100), -- Specific data type

  -- Retention Period
  retention_period_days INTEGER NOT NULL,
  retention_reason TEXT,

  -- Legal Basis
  legal_basis VARCHAR(100), -- 'contract', 'legal_obligation', 'consent', etc.
  applicable_regulations TEXT[], -- 'GDPR', 'CCPA', etc.

  -- Actions
  deletion_method VARCHAR(50) DEFAULT 'hard_delete', -- 'hard_delete', 'anonymize', 'archive'
  backup_before_deletion BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retention_policies_category ON data_retention_policies(data_category);
CREATE INDEX idx_retention_policies_table ON data_retention_policies(table_name);
CREATE INDEX idx_retention_policies_active ON data_retention_policies(is_active);
CREATE INDEX idx_retention_policies_next_run ON data_retention_policies(next_run_at);

-- ========================================
-- 5. DATA DELETION LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS data_deletion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Subject
  user_id UUID, -- NULL if user already deleted
  user_email VARCHAR(255),

  -- Deletion Details
  deletion_type VARCHAR(50) NOT NULL, -- 'user_request', 'retention_policy', 'account_closure'
  data_category data_category,
  table_name VARCHAR(255),
  record_count INTEGER,

  -- Reference
  privacy_request_id UUID REFERENCES privacy_requests(id) ON DELETE SET NULL,
  retention_policy_id UUID REFERENCES data_retention_policies(id) ON DELETE SET NULL,

  -- Deleted Data Summary
  deleted_data_summary JSONB, -- Summary of what was deleted (not the data itself)

  -- Backup
  backup_location VARCHAR(1000),
  backup_retention_until TIMESTAMP,

  -- Executor
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deletion_method VARCHAR(50),

  -- Timing
  deleted_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_deletion_logs_user ON data_deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_email ON data_deletion_logs(user_email);
CREATE INDEX idx_deletion_logs_category ON data_deletion_logs(data_category);
CREATE INDEX idx_deletion_logs_date ON data_deletion_logs(deleted_at DESC);

-- ========================================
-- 6. DATA ACCESS LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Subject
  subject_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Accessor
  accessor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  accessor_role VARCHAR(100),

  -- Access Details
  access_type VARCHAR(50) NOT NULL, -- 'read', 'write', 'export', 'delete'
  data_category data_category,
  table_name VARCHAR(255),
  field_names TEXT[],

  -- Context
  purpose VARCHAR(255), -- Why was data accessed
  legal_basis VARCHAR(100),

  -- Request Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  endpoint VARCHAR(255),

  -- Timing
  accessed_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_access_logs_subject ON data_access_logs(subject_user_id);
CREATE INDEX idx_access_logs_accessor ON data_access_logs(accessor_user_id);
CREATE INDEX idx_access_logs_category ON data_access_logs(data_category);
CREATE INDEX idx_access_logs_date ON data_access_logs(accessed_at DESC);

-- ========================================
-- 7. DATA PROCESSING AGREEMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS data_processing_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Agreement Identity
  agreement_name VARCHAR(255) NOT NULL UNIQUE,
  agreement_type VARCHAR(100) NOT NULL, -- 'processor', 'controller', 'joint_controller'

  -- Third Party
  third_party_name VARCHAR(255) NOT NULL,
  third_party_contact VARCHAR(255),
  third_party_country VARCHAR(100),

  -- Data Details
  data_categories data_category[],
  processing_purposes data_processing_purpose[],

  -- Legal
  legal_basis TEXT,
  safeguards TEXT, -- Data transfer safeguards
  sub_processors TEXT[],

  -- Agreement Document
  agreement_document_path VARCHAR(1000),
  agreement_signed_date DATE,
  agreement_expiry_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Review
  last_reviewed_at DATE,
  next_review_due DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dpa_name ON data_processing_agreements(agreement_name);
CREATE INDEX idx_dpa_active ON data_processing_agreements(is_active);
CREATE INDEX idx_dpa_expiry ON data_processing_agreements(agreement_expiry_date);

-- ========================================
-- 8. PRIVACY IMPACT ASSESSMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Assessment Identity
  assessment_name VARCHAR(255) NOT NULL,
  assessment_description TEXT,

  -- Scope
  processing_activity VARCHAR(255) NOT NULL,
  data_categories data_category[],
  processing_purposes data_processing_purpose[],

  -- Risk Assessment
  risk_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  identified_risks JSONB,
  mitigation_measures JSONB,

  -- Legal Basis
  legal_basis TEXT,
  necessity_justification TEXT,

  -- Data Subject Rights
  rights_impact_analysis TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'under_review', 'approved', 'requires_update'
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,

  -- Review
  next_review_date DATE,

  -- Documents
  assessment_document_path VARCHAR(1000),

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pia_activity ON privacy_impact_assessments(processing_activity);
CREATE INDEX idx_pia_risk ON privacy_impact_assessments(risk_level);
CREATE INDEX idx_pia_status ON privacy_impact_assessments(status);

-- ========================================
-- 9. DATA BREACH INCIDENTS
-- ========================================

CREATE TABLE IF NOT EXISTS data_breach_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Incident Identity
  incident_reference VARCHAR(100) NOT NULL UNIQUE,
  incident_title VARCHAR(255) NOT NULL,
  incident_description TEXT,

  -- Discovery
  discovered_at TIMESTAMP NOT NULL,
  discovered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  discovery_method VARCHAR(100),

  -- Breach Details
  breach_type VARCHAR(100), -- 'unauthorized_access', 'data_loss', 'ransomware', etc.
  affected_data_categories data_category[],
  estimated_affected_users INTEGER,

  -- Severity
  severity VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  risk_to_individuals TEXT,

  -- Response
  containment_actions JSONB,
  containment_completed_at TIMESTAMP,
  investigation_findings TEXT,

  -- Notification Requirements
  notification_required BOOLEAN DEFAULT false,
  dpa_notified BOOLEAN DEFAULT false,
  dpa_notified_at TIMESTAMP,
  users_notified BOOLEAN DEFAULT false,
  users_notified_at TIMESTAMP,

  -- Resolution
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'contained', 'resolved'
  resolved_at TIMESTAMP,
  resolution_summary TEXT,

  -- Lessons Learned
  root_cause TEXT,
  preventive_measures JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_breach_reference ON data_breach_incidents(incident_reference);
CREATE INDEX idx_breach_severity ON data_breach_incidents(severity);
CREATE INDEX idx_breach_status ON data_breach_incidents(status);
CREATE INDEX idx_breach_discovered ON data_breach_incidents(discovered_at DESC);

-- ========================================
-- 10. COOKIE CONSENT
-- ========================================

CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),

  -- Consent Preferences
  necessary_cookies BOOLEAN DEFAULT true, -- Always true
  functional_cookies BOOLEAN DEFAULT false,
  analytics_cookies BOOLEAN DEFAULT false,
  marketing_cookies BOOLEAN DEFAULT false,

  -- Context
  consent_version VARCHAR(50) NOT NULL,
  consent_given_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Expiry
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 year',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cookie_consents_user ON cookie_consents(user_id);
CREATE INDEX idx_cookie_consents_session ON cookie_consents(session_id);
CREATE INDEX idx_cookie_consents_expires ON cookie_consents(expires_at);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Grant consent
CREATE OR REPLACE FUNCTION grant_user_consent(
  p_user_id UUID,
  p_consent_type VARCHAR,
  p_consent_version VARCHAR,
  p_consent_purpose data_processing_purpose,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO user_consents (
    user_id, consent_type, consent_version,
    consent_purpose, status, granted_at, ip_address
  ) VALUES (
    p_user_id, p_consent_type, p_consent_version,
    p_consent_purpose, 'granted', NOW(), p_ip_address
  )
  ON CONFLICT (user_id, consent_type, consent_version)
  DO UPDATE SET
    status = 'granted',
    granted_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Withdraw consent
CREATE OR REPLACE FUNCTION withdraw_user_consent(
  p_user_id UUID,
  p_consent_type VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_consents
  SET
    status = 'withdrawn',
    withdrawn_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND status = 'granted';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Create privacy request
CREATE OR REPLACE FUNCTION create_privacy_request(
  p_user_id UUID,
  p_request_type privacy_request_type,
  p_requester_email VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_due_date TIMESTAMP;
BEGIN
  -- Calculate due date (30 days for GDPR)
  v_due_date := NOW() + INTERVAL '30 days';

  INSERT INTO privacy_requests (
    user_id, requester_email, request_type, due_date
  ) VALUES (
    p_user_id, p_requester_email, p_request_type, v_due_date
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Execute data retention policy
CREATE OR REPLACE FUNCTION execute_retention_policy(p_policy_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_policy RECORD;
  v_cutoff_date TIMESTAMP;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Get policy details
  SELECT * INTO v_policy
  FROM data_retention_policies
  WHERE id = p_policy_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy not found or inactive';
  END IF;

  v_cutoff_date := NOW() - (v_policy.retention_period_days || ' days')::INTERVAL;

  -- This is a simplified example - actual implementation would handle specific tables
  -- Log the execution
  UPDATE data_retention_policies
  SET last_run_at = NOW(),
      next_run_at = NOW() + INTERVAL '1 day'
  WHERE id = p_policy_id;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user record with anonymized data
  UPDATE users
  SET
    email = 'deleted_' || p_user_id || '@anonymized.local',
    full_name = 'Deleted User',
    phone_number = NULL,
    date_of_birth = NULL,
    address = NULL,
    bio = NULL,
    avatar_url = NULL
  WHERE id = p_user_id;

  -- Log the anonymization
  INSERT INTO data_deletion_logs (
    user_id, deletion_type, data_category,
    table_name, deletion_method
  ) VALUES (
    p_user_id, 'user_request', 'personal_identity',
    'users', 'anonymize'
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. VIEWS
-- ========================================

-- View: Active consents by user
CREATE OR REPLACE VIEW user_active_consents AS
SELECT
  user_id,
  consent_type,
  consent_purpose,
  granted_at,
  expires_at
FROM user_consents
WHERE status = 'granted'
  AND (expires_at IS NULL OR expires_at > NOW());

-- View: Overdue privacy requests
CREATE OR REPLACE VIEW overdue_privacy_requests AS
SELECT
  pr.*,
  u.email,
  u.full_name,
  NOW() - pr.due_date AS overdue_by
FROM privacy_requests pr
JOIN users u ON pr.user_id = u.id
WHERE pr.status IN ('pending', 'in_progress')
  AND pr.due_date < NOW()
ORDER BY pr.due_date ASC;

-- View: Data retention summary
CREATE OR REPLACE VIEW data_retention_summary AS
SELECT
  data_category,
  COUNT(*) AS policy_count,
  AVG(retention_period_days) AS avg_retention_days,
  MIN(next_run_at) AS next_scheduled_run
FROM data_retention_policies
WHERE is_active = true
GROUP BY data_category;

COMMENT ON SCHEMA public IS 'Data Compliance & Privacy - GDPR, CCPA, consent management, privacy requests';
