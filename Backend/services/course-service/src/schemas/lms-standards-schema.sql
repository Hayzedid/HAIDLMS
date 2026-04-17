-- LMS Standards Compliance Schema
-- SCORM 1.2/2004, LTI 1.3, xAPI/Tin Can, and interoperability standards

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE scorm_version AS ENUM ('1.2', '2004_3rd', '2004_4th');
CREATE TYPE scorm_status AS ENUM ('not_attempted', 'incomplete', 'completed', 'passed', 'failed', 'browsed');
CREATE TYPE lti_version AS ENUM ('1.1', '1.3');
CREATE TYPE lti_message_type AS ENUM ('basic-lti-launch-request', 'ContentItemSelectionRequest', 'LtiDeepLinkingRequest');
CREATE TYPE xapi_verb AS ENUM (
  'attempted', 'completed', 'passed', 'failed', 'answered',
  'experienced', 'interacted', 'attended', 'scored', 'progressed'
);

-- ========================================
-- 2. SCORM PACKAGES
-- ========================================

CREATE TABLE IF NOT EXISTS scorm_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Package Identity
  package_identifier VARCHAR(255) NOT NULL UNIQUE,
  package_title VARCHAR(500) NOT NULL,
  package_description TEXT,

  -- Version
  scorm_version scorm_version NOT NULL,

  -- Package Files
  manifest_file_path VARCHAR(1000) NOT NULL, -- imsmanifest.xml location
  package_file_path VARCHAR(1000) NOT NULL, -- Uploaded .zip location
  extracted_path VARCHAR(1000), -- Extracted content path

  -- Package Structure
  manifest_xml TEXT, -- Full manifest content
  organizations JSONB, -- Package organization structure
  resources JSONB, -- Package resources

  -- Launch Information
  launch_url VARCHAR(1000),
  entry_point VARCHAR(500),

  -- Metadata
  metadata JSONB,
  duration_estimate INTEGER, -- Estimated time in minutes

  -- Course Integration
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_validated BOOLEAN DEFAULT false,
  validation_errors JSONB,

  -- Statistics
  total_attempts INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scorm_packages_identifier ON scorm_packages(package_identifier);
CREATE INDEX idx_scorm_packages_course ON scorm_packages(course_id);
CREATE INDEX idx_scorm_packages_lesson ON scorm_packages(lesson_id);
CREATE INDEX idx_scorm_packages_active ON scorm_packages(is_active);

-- ========================================
-- 3. SCORM ATTEMPTS
-- ========================================

CREATE TABLE IF NOT EXISTS scorm_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Package & User
  package_id UUID NOT NULL REFERENCES scorm_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt Details
  attempt_number INTEGER NOT NULL,

  -- SCORM Data Model
  cmi_core_lesson_status scorm_status DEFAULT 'not_attempted',
  cmi_core_score_raw NUMERIC,
  cmi_core_score_min NUMERIC,
  cmi_core_score_max NUMERIC,
  cmi_core_lesson_location VARCHAR(255),
  cmi_suspend_data TEXT, -- Large suspend data

  -- Timing
  cmi_core_total_time INTEGER, -- Total time in seconds
  cmi_core_session_time INTEGER, -- Current session time
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_access_at TIMESTAMP DEFAULT NOW(),

  -- Progress
  progress_measure NUMERIC, -- 0-1
  completion_threshold NUMERIC,

  -- Success
  success_status VARCHAR(50),
  scaled_passing_score NUMERIC,

  -- Interactions (for detailed tracking)
  interactions JSONB, -- Array of interaction data

  -- Objectives
  objectives JSONB, -- Array of objective data

  -- Full CMI Data (for SCORM 2004)
  cmi_data JSONB, -- Complete SCORM data model

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_scorm_attempt UNIQUE (package_id, user_id, attempt_number)
);

CREATE INDEX idx_scorm_attempts_package ON scorm_attempts(package_id);
CREATE INDEX idx_scorm_attempts_user ON scorm_attempts(user_id);
CREATE INDEX idx_scorm_attempts_status ON scorm_attempts(cmi_core_lesson_status);
CREATE INDEX idx_scorm_attempts_user_package ON scorm_attempts(user_id, package_id);

-- ========================================
-- 4. LTI TOOL CONSUMERS
-- ========================================

CREATE TABLE IF NOT EXISTS lti_tool_consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Consumer Identity
  consumer_key VARCHAR(255) NOT NULL UNIQUE,
  consumer_name VARCHAR(255) NOT NULL,
  consumer_description TEXT,

  -- Credentials
  consumer_secret VARCHAR(500) NOT NULL, -- Encrypted
  consumer_guid VARCHAR(255),

  -- LTI Version
  lti_version lti_version NOT NULL,

  -- LTI 1.3 Configuration
  platform_id VARCHAR(500), -- Platform issuer
  client_id VARCHAR(500),
  deployment_id VARCHAR(500),
  auth_login_url VARCHAR(1000),
  auth_token_url VARCHAR(1000),
  key_set_url VARCHAR(1000),

  -- Public Key (for LTI 1.3)
  public_key TEXT,
  private_key TEXT, -- Encrypted

  -- Settings
  enable_outcomes BOOLEAN DEFAULT true,
  enable_roster BOOLEAN DEFAULT true,
  enable_deep_linking BOOLEAN DEFAULT true,

  -- Custom Parameters
  custom_parameters JSONB,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_access_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lti_consumers_key ON lti_tool_consumers(consumer_key);
CREATE INDEX idx_lti_consumers_enabled ON lti_tool_consumers(is_enabled);

-- ========================================
-- 5. LTI RESOURCE LINKS
-- ========================================

CREATE TABLE IF NOT EXISTS lti_resource_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Consumer
  tool_consumer_id UUID NOT NULL REFERENCES lti_tool_consumers(id) ON DELETE CASCADE,

  -- Resource Identity
  resource_link_id VARCHAR(255) NOT NULL,
  resource_link_title VARCHAR(500),
  resource_link_description TEXT,

  -- Course Integration
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  -- LTI Context
  context_id VARCHAR(255),
  context_label VARCHAR(255),
  context_title VARCHAR(500),
  context_type VARCHAR(100),

  -- Settings
  custom_parameters JSONB,

  -- Statistics
  total_launches INTEGER DEFAULT 0,
  last_launch_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_lti_resource_link UNIQUE (tool_consumer_id, resource_link_id)
);

CREATE INDEX idx_lti_links_consumer ON lti_resource_links(tool_consumer_id);
CREATE INDEX idx_lti_links_course ON lti_resource_links(course_id);
CREATE INDEX idx_lti_links_lesson ON lti_resource_links(lesson_id);

-- ========================================
-- 6. LTI LAUNCHES
-- ========================================

CREATE TABLE IF NOT EXISTS lti_launches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Resource Link
  resource_link_id UUID NOT NULL REFERENCES lti_resource_links(id) ON DELETE CASCADE,
  tool_consumer_id UUID NOT NULL REFERENCES lti_tool_consumers(id) ON DELETE CASCADE,

  -- User
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lti_user_id VARCHAR(255), -- User ID from LTI consumer

  -- Launch Details
  message_type lti_message_type,
  lti_version lti_version,

  -- User Info (from LTI)
  lis_person_name_full VARCHAR(255),
  lis_person_contact_email_primary VARCHAR(255),
  roles TEXT[], -- LTI roles

  -- Outcome Service
  lis_outcome_service_url VARCHAR(1000),
  lis_result_sourcedid VARCHAR(500),

  -- Context
  context_id VARCHAR(255),
  context_title VARCHAR(500),

  -- Launch Data
  launch_presentation_locale VARCHAR(20),
  launch_presentation_return_url VARCHAR(1000),

  -- Custom Parameters
  custom_parameters JSONB,

  -- Request Details
  ip_address VARCHAR(45),
  user_agent TEXT,

  launched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lti_launches_resource ON lti_launches(resource_link_id);
CREATE INDEX idx_lti_launches_user ON lti_launches(user_id);
CREATE INDEX idx_lti_launches_consumer ON lti_launches(tool_consumer_id);
CREATE INDEX idx_lti_launches_date ON lti_launches(launched_at DESC);

-- ========================================
-- 7. LTI GRADES (Outcomes)
-- ========================================

CREATE TABLE IF NOT EXISTS lti_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Launch Reference
  launch_id UUID REFERENCES lti_launches(id) ON DELETE CASCADE,
  resource_link_id UUID NOT NULL REFERENCES lti_resource_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Grade Details
  result_sourcedid VARCHAR(500) NOT NULL,
  result_score NUMERIC, -- 0-1 scale
  result_status VARCHAR(50),

  -- Sync Status
  is_synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lti_grades_launch ON lti_grades(launch_id);
CREATE INDEX idx_lti_grades_resource ON lti_grades(resource_link_id);
CREATE INDEX idx_lti_grades_user ON lti_grades(user_id);
CREATE INDEX idx_lti_grades_sync ON lti_grades(is_synced);

-- ========================================
-- 8. xAPI STATEMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS xapi_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Statement ID (from xAPI)
  statement_id UUID NOT NULL UNIQUE,

  -- Actor
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_account_name VARCHAR(255),
  actor_account_homepage VARCHAR(500),
  actor_mbox VARCHAR(255),
  actor_name VARCHAR(255),

  -- Verb
  verb xapi_verb NOT NULL,
  verb_id VARCHAR(500) NOT NULL,
  verb_display JSONB, -- Multilingual verb display

  -- Object
  object_id VARCHAR(1000) NOT NULL, -- Activity IRI
  object_type VARCHAR(50) DEFAULT 'Activity',
  object_name JSONB, -- Multilingual object name
  object_description JSONB,

  -- Result
  result_success BOOLEAN,
  result_completion BOOLEAN,
  result_score_scaled NUMERIC, -- 0-1
  result_score_raw NUMERIC,
  result_score_min NUMERIC,
  result_score_max NUMERIC,
  result_duration INTEGER, -- Duration in seconds
  result_response TEXT,

  -- Context
  context_registration UUID,
  context_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  context_team_id UUID,
  context_revision VARCHAR(100),
  context_platform VARCHAR(255) DEFAULT 'HAIDLMS',
  context_language VARCHAR(20),
  context_extensions JSONB,

  -- Course Integration
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Timestamp
  statement_timestamp TIMESTAMP NOT NULL,
  stored_at TIMESTAMP DEFAULT NOW(),

  -- Authority
  authority_name VARCHAR(255),
  authority_mbox VARCHAR(255),

  -- Attachments
  attachments JSONB,

  -- Full Statement
  full_statement JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_xapi_statements_id ON xapi_statements(statement_id);
CREATE INDEX idx_xapi_statements_actor ON xapi_statements(actor_id);
CREATE INDEX idx_xapi_statements_verb ON xapi_statements(verb);
CREATE INDEX idx_xapi_statements_object ON xapi_statements(object_id);
CREATE INDEX idx_xapi_statements_course ON xapi_statements(course_id);
CREATE INDEX idx_xapi_statements_timestamp ON xapi_statements(statement_timestamp DESC);

-- ========================================
-- 9. xAPI STATE
-- ========================================

CREATE TABLE IF NOT EXISTS xapi_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Activity & Agent
  activity_id VARCHAR(1000) NOT NULL,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state_id VARCHAR(255) NOT NULL,

  -- Registration (optional)
  registration UUID,

  -- State Content
  state_content JSONB NOT NULL,
  content_type VARCHAR(100) DEFAULT 'application/json',

  -- ETag for concurrency control
  etag VARCHAR(100),

  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_xapi_state UNIQUE (activity_id, agent_id, state_id, registration)
);

CREATE INDEX idx_xapi_state_activity ON xapi_state(activity_id);
CREATE INDEX idx_xapi_state_agent ON xapi_state(agent_id);
CREATE INDEX idx_xapi_state_registration ON xapi_state(registration);

-- ========================================
-- 10. CONTENT INTEROPERABILITY
-- ========================================

CREATE TABLE IF NOT EXISTS content_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Export Format
  export_format VARCHAR(50) NOT NULL, -- 'scorm_1.2', 'scorm_2004', 'xapi', 'common_cartridge'

  -- Export Data
  export_file_path VARCHAR(1000),
  manifest_data JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,

  -- Generated By
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  downloaded_at TIMESTAMP,

  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_exports_content ON content_exports(content_type, content_id);
CREATE INDEX idx_exports_status ON content_exports(status);
CREATE INDEX idx_exports_generated ON content_exports(generated_by);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Create SCORM attempt
CREATE OR REPLACE FUNCTION create_scorm_attempt(
  p_package_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_attempt_number INTEGER;
  v_attempt_id UUID;
BEGIN
  -- Get next attempt number
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO v_attempt_number
  FROM scorm_attempts
  WHERE package_id = p_package_id AND user_id = p_user_id;

  -- Create attempt
  INSERT INTO scorm_attempts (
    package_id, user_id, attempt_number
  ) VALUES (
    p_package_id, p_user_id, v_attempt_number
  )
  RETURNING id INTO v_attempt_id;

  -- Update package statistics
  UPDATE scorm_packages
  SET total_attempts = total_attempts + 1
  WHERE id = p_package_id;

  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete SCORM attempt
CREATE OR REPLACE FUNCTION complete_scorm_attempt(
  p_attempt_id UUID,
  p_status scorm_status DEFAULT 'completed',
  p_score NUMERIC DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE scorm_attempts
  SET
    cmi_core_lesson_status = p_status,
    cmi_core_score_raw = COALESCE(p_score, cmi_core_score_raw),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_attempt_id;

  -- Update package statistics if completed
  IF p_status IN ('completed', 'passed') THEN
    UPDATE scorm_packages
    SET total_completions = total_completions + 1
    WHERE id = (SELECT package_id FROM scorm_attempts WHERE id = p_attempt_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Record xAPI statement
CREATE OR REPLACE FUNCTION record_xapi_statement(
  p_statement_id UUID,
  p_actor_id UUID,
  p_verb VARCHAR,
  p_object_id VARCHAR,
  p_full_statement JSONB
)
RETURNS UUID AS $$
DECLARE
  v_statement_id UUID;
BEGIN
  INSERT INTO xapi_statements (
    statement_id, actor_id, verb, verb_id,
    object_id, full_statement, statement_timestamp
  ) VALUES (
    p_statement_id, p_actor_id, p_verb::xapi_verb, p_verb,
    p_object_id, p_full_statement, NOW()
  )
  ON CONFLICT (statement_id) DO NOTHING
  RETURNING id INTO v_statement_id;

  RETURN v_statement_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. VIEWS
-- ========================================

-- View: SCORM package progress by user
CREATE OR REPLACE VIEW scorm_user_progress AS
SELECT
  sa.package_id,
  sp.package_title,
  sa.user_id,
  u.full_name,
  MAX(sa.attempt_number) AS total_attempts,
  MAX(sa.cmi_core_score_raw) AS best_score,
  MAX(CASE WHEN sa.cmi_core_lesson_status IN ('completed', 'passed') THEN 1 ELSE 0 END) AS is_completed,
  MAX(sa.last_access_at) AS last_access
FROM scorm_attempts sa
JOIN scorm_packages sp ON sa.package_id = sp.id
JOIN users u ON sa.user_id = u.id
GROUP BY sa.package_id, sp.package_title, sa.user_id, u.full_name;

-- View: LTI launch statistics
CREATE OR REPLACE VIEW lti_launch_statistics AS
SELECT
  tc.consumer_name,
  rl.resource_link_title,
  COUNT(*) AS total_launches,
  COUNT(DISTINCT ll.user_id) AS unique_users,
  MAX(ll.launched_at) AS last_launch
FROM lti_launches ll
JOIN lti_resource_links rl ON ll.resource_link_id = rl.id
JOIN lti_tool_consumers tc ON ll.tool_consumer_id = tc.id
WHERE ll.launched_at > NOW() - INTERVAL '30 days'
GROUP BY tc.consumer_name, rl.resource_link_title;

-- View: xAPI activity summary
CREATE OR REPLACE VIEW xapi_activity_summary AS
SELECT
  actor_id,
  verb,
  object_id,
  COUNT(*) AS statement_count,
  AVG(result_score_scaled) AS avg_score,
  MAX(statement_timestamp) AS last_activity
FROM xapi_statements
WHERE statement_timestamp > NOW() - INTERVAL '30 days'
GROUP BY actor_id, verb, object_id;

COMMENT ON SCHEMA public IS 'LMS Standards Compliance - SCORM, LTI, xAPI interoperability';
