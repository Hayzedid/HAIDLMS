-- Advanced Proctoring & Assessment Integrity Schema
-- AI proctoring, facial recognition, screen recording, browser lockdown, plagiarism detection

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE proctoring_mode AS ENUM ('live', 'recorded', 'ai_automated', 'hybrid', 'no_proctoring');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'paused', 'completed', 'terminated', 'flagged');
CREATE TYPE violation_type AS ENUM (
  'multiple_faces', 'no_face', 'face_not_recognized', 'looking_away',
  'suspicious_audio', 'tab_switch', 'window_switch', 'prohibited_app',
  'external_monitor', 'mobile_device_detected', 'unauthorized_person',
  'screen_sharing_stopped', 'browser_exit', 'copy_paste', 'suspicious_behavior'
);
CREATE TYPE violation_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'cleared', 'violation_confirmed', 'escalated');
CREATE TYPE identity_verification_method AS ENUM ('face_match', 'id_document', 'knowledge_based', 'biometric', 'multi_factor');
CREATE TYPE browser_lockdown_level AS ENUM ('none', 'basic', 'strict', 'full');

-- ========================================
-- 2. PROCTORING SESSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Assessment Reference
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES assessment_submissions(id) ON DELETE SET NULL,

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session Details
  session_token VARCHAR(255) NOT NULL UNIQUE,
  proctoring_mode proctoring_mode NOT NULL,

  -- Status
  status session_status DEFAULT 'scheduled',

  -- Timing
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  total_duration_seconds INTEGER,

  -- Proctoring Configuration
  browser_lockdown_enabled BOOLEAN DEFAULT true,
  browser_lockdown_level browser_lockdown_level DEFAULT 'strict',
  webcam_required BOOLEAN DEFAULT true,
  screen_recording_required BOOLEAN DEFAULT true,
  audio_recording_required BOOLEAN DEFAULT false,
  id_verification_required BOOLEAN DEFAULT true,

  -- Identity Verification
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_method identity_verification_method,
  identity_verified_at TIMESTAMP,
  identity_confidence_score NUMERIC, -- 0-1

  -- AI Monitoring
  ai_monitoring_enabled BOOLEAN DEFAULT true,
  face_detection_enabled BOOLEAN DEFAULT true,
  gaze_tracking_enabled BOOLEAN DEFAULT true,
  audio_analysis_enabled BOOLEAN DEFAULT false,

  -- Recording URLs
  video_recording_url VARCHAR(1000),
  screen_recording_url VARCHAR(1000),
  audio_recording_url VARCHAR(1000),

  -- Statistics
  total_violations INTEGER DEFAULT 0,
  critical_violations INTEGER DEFAULT 0,
  pauses_count INTEGER DEFAULT 0,
  total_pause_time_seconds INTEGER DEFAULT 0,

  -- Risk Score
  overall_risk_score NUMERIC DEFAULT 0, -- 0-100
  integrity_score NUMERIC DEFAULT 100, -- 100-0

  -- Review
  requires_review BOOLEAN DEFAULT false,
  review_status review_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  -- Proctor (for live proctoring)
  proctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  proctor_notes TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proctoring_assessment ON proctoring_sessions(assessment_id);
CREATE INDEX idx_proctoring_user ON proctoring_sessions(user_id);
CREATE INDEX idx_proctoring_status ON proctoring_sessions(status);
CREATE INDEX idx_proctoring_session_token ON proctoring_sessions(session_token);
CREATE INDEX idx_proctoring_review ON proctoring_sessions(requires_review, review_status);
CREATE INDEX idx_proctoring_scheduled ON proctoring_sessions(scheduled_start_time);

-- ========================================
-- 3. VIOLATION INCIDENTS
-- ========================================

CREATE TABLE IF NOT EXISTS violation_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Violation Details
  violation_type violation_type NOT NULL,
  severity violation_severity NOT NULL,

  -- Detection
  detected_at TIMESTAMP DEFAULT NOW(),
  detection_method VARCHAR(100), -- 'ai', 'proctor', 'system'
  confidence_score NUMERIC, -- 0-1

  -- Evidence
  snapshot_url VARCHAR(1000), -- Screenshot/frame capture
  video_timestamp_seconds NUMERIC,
  screen_snapshot_url VARCHAR(1000),
  audio_clip_url VARCHAR(1000),

  -- Description
  violation_description TEXT,
  ai_analysis JSONB, -- AI-generated analysis

  -- Action Taken
  auto_flagged BOOLEAN DEFAULT false,
  warning_issued BOOLEAN DEFAULT false,
  session_paused BOOLEAN DEFAULT false,
  session_terminated BOOLEAN DEFAULT false,

  -- Review
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_decision VARCHAR(50), -- 'false_positive', 'confirmed', 'inconclusive'
  review_notes TEXT,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_violations_session ON violation_incidents(session_id);
CREATE INDEX idx_violations_user ON violation_incidents(user_id);
CREATE INDEX idx_violations_type ON violation_incidents(violation_type);
CREATE INDEX idx_violations_severity ON violation_incidents(severity);
CREATE INDEX idx_violations_detected ON violation_incidents(detected_at DESC);
CREATE INDEX idx_violations_review ON violation_incidents(is_reviewed);

-- ========================================
-- 4. FACE RECOGNITION DATA
-- ========================================

CREATE TABLE IF NOT EXISTS face_recognition_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Capture Details
  captured_at TIMESTAMP DEFAULT NOW(),
  image_url VARCHAR(1000) NOT NULL,
  image_hash VARCHAR(64), -- For deduplication

  -- Face Detection
  faces_detected INTEGER NOT NULL,
  primary_face_confidence NUMERIC, -- 0-1

  -- Face Recognition
  face_match_score NUMERIC, -- 0-1, match against enrolled photo
  is_match BOOLEAN,
  is_authorized_person BOOLEAN,

  -- Face Attributes
  face_attributes JSONB, -- Age, gender, emotions, glasses, etc.

  -- Gaze Tracking
  gaze_direction VARCHAR(50), -- 'center', 'left', 'right', 'up', 'down', 'away'
  attention_score NUMERIC, -- 0-1

  -- Analysis
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_type VARCHAR(100),

  -- Processing
  processed_by VARCHAR(50), -- 'aws_rekognition', 'azure_face', 'custom_ml'

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_face_session ON face_recognition_captures(session_id);
CREATE INDEX idx_face_user ON face_recognition_captures(user_id);
CREATE INDEX idx_face_captured ON face_recognition_captures(captured_at DESC);
CREATE INDEX idx_face_match ON face_recognition_captures(is_match);
CREATE INDEX idx_face_anomaly ON face_recognition_captures(anomaly_detected);

-- ========================================
-- 5. SCREEN ACTIVITY LOG
-- ========================================

CREATE TABLE IF NOT EXISTS screen_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity Type
  activity_type VARCHAR(100) NOT NULL, -- 'tab_switch', 'window_switch', 'app_launch', 'copy', 'paste', etc.

  -- Activity Details
  window_title VARCHAR(500),
  application_name VARCHAR(255),
  url VARCHAR(1000),

  -- Timestamp
  occurred_at TIMESTAMP DEFAULT NOW(),

  -- Context
  screen_snapshot_url VARCHAR(1000),
  clipboard_content_hash VARCHAR(64), -- Hash of copied content

  -- Classification
  is_suspicious BOOLEAN DEFAULT false,
  is_prohibited BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_screen_activity_session ON screen_activity_log(session_id);
CREATE INDEX idx_screen_activity_user ON screen_activity_log(user_id);
CREATE INDEX idx_screen_activity_type ON screen_activity_log(activity_type);
CREATE INDEX idx_screen_activity_suspicious ON screen_activity_log(is_suspicious);
CREATE INDEX idx_screen_activity_time ON screen_activity_log(occurred_at DESC);

-- ========================================
-- 6. AUDIO ANALYSIS LOG
-- ========================================

CREATE TABLE IF NOT EXISTS audio_analysis_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Audio Details
  audio_segment_url VARCHAR(1000),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_seconds INTEGER,

  -- Analysis
  voices_detected INTEGER,
  background_noise_level NUMERIC, -- dB
  speech_detected BOOLEAN,
  multiple_speakers BOOLEAN,

  -- Transcription
  transcribed_text TEXT,
  transcription_confidence NUMERIC, -- 0-1

  -- Keywords Detection
  suspicious_keywords TEXT[],
  prohibited_content_detected BOOLEAN DEFAULT false,

  -- Analysis Service
  analyzed_by VARCHAR(50), -- 'aws_transcribe', 'google_speech', 'custom'

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audio_session ON audio_analysis_log(session_id);
CREATE INDEX idx_audio_user ON audio_analysis_log(user_id);
CREATE INDEX idx_audio_suspicious ON audio_analysis_log(prohibited_content_detected);
CREATE INDEX idx_audio_time ON audio_analysis_log(start_time);

-- ========================================
-- 7. IDENTITY VERIFICATION
-- ========================================

CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Verification Method
  verification_method identity_verification_method NOT NULL,

  -- ID Document (if applicable)
  document_type VARCHAR(50), -- 'passport', 'drivers_license', 'national_id'
  document_number_hash VARCHAR(64), -- Hashed document number
  document_image_url VARCHAR(1000),
  document_verified BOOLEAN DEFAULT false,

  -- Face Photo
  face_photo_url VARCHAR(1000),
  enrolled_face_photo_url VARCHAR(1000),

  -- Biometric Data
  biometric_data JSONB,

  -- Verification Result
  is_verified BOOLEAN DEFAULT false,
  verification_confidence NUMERIC, -- 0-1
  verification_timestamp TIMESTAMP DEFAULT NOW(),

  -- Verification Service
  service_provider VARCHAR(100), -- 'onfido', 'jumio', 'trulioo', 'custom'
  service_request_id VARCHAR(255),
  service_response JSONB,

  -- Failure Reason
  failure_reason TEXT,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_identity_session ON identity_verifications(session_id);
CREATE INDEX idx_identity_user ON identity_verifications(user_id);
CREATE INDEX idx_identity_verified ON identity_verifications(is_verified);
CREATE INDEX idx_identity_method ON identity_verifications(verification_method);

-- ========================================
-- 8. BROWSER LOCKDOWN STATUS
-- ========================================

CREATE TABLE IF NOT EXISTS browser_lockdown_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Browser Details
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  is_secure_browser BOOLEAN DEFAULT false,

  -- Lockdown Status
  lockdown_active BOOLEAN DEFAULT false,
  lockdown_level browser_lockdown_level,

  -- Restrictions
  copy_disabled BOOLEAN DEFAULT false,
  paste_disabled BOOLEAN DEFAULT false,
  print_disabled BOOLEAN DEFAULT false,
  right_click_disabled BOOLEAN DEFAULT false,
  developer_tools_disabled BOOLEAN DEFAULT false,

  -- Monitoring
  fullscreen_enforced BOOLEAN DEFAULT true,
  tab_switching_blocked BOOLEAN DEFAULT true,
  new_windows_blocked BOOLEAN DEFAULT true,

  -- Events
  lockdown_started_at TIMESTAMP,
  lockdown_ended_at TIMESTAMP,
  violations_count INTEGER DEFAULT 0,

  -- Status Checks
  last_heartbeat_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lockdown_session ON browser_lockdown_status(session_id);
CREATE INDEX idx_lockdown_active ON browser_lockdown_status(lockdown_active);
CREATE INDEX idx_lockdown_heartbeat ON browser_lockdown_status(last_heartbeat_at);

-- ========================================
-- 9. PLAGIARISM DETECTION
-- ========================================

CREATE TABLE IF NOT EXISTS plagiarism_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Submission Reference
  submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

  -- Content
  content_text TEXT NOT NULL,
  content_hash VARCHAR(64) UNIQUE,
  word_count INTEGER,

  -- Detection Method
  detection_method VARCHAR(100), -- 'turnitin', 'copyscape', 'custom', 'similarity_comparison'

  -- Results
  overall_similarity_percent NUMERIC, -- 0-100
  is_plagiarized BOOLEAN DEFAULT false,
  plagiarism_confidence NUMERIC, -- 0-1

  -- Sources
  matched_sources JSONB, -- Array of matched sources with similarity scores

  -- Internal Matches
  internal_matches UUID[], -- Other submissions with similar content
  max_internal_similarity NUMERIC, -- 0-100

  -- External Matches
  web_matches_count INTEGER DEFAULT 0,
  publication_matches_count INTEGER DEFAULT 0,

  -- Report
  report_url VARCHAR(1000),
  report_generated_at TIMESTAMP,

  -- Review
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_decision VARCHAR(50), -- 'cleared', 'violation', 'inconclusive'

  -- Metadata
  metadata JSONB,

  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plagiarism_submission ON plagiarism_checks(submission_id);
CREATE INDEX idx_plagiarism_user ON plagiarism_checks(user_id);
CREATE INDEX idx_plagiarism_assessment ON plagiarism_checks(assessment_id);
CREATE INDEX idx_plagiarism_hash ON plagiarism_checks(content_hash);
CREATE INDEX idx_plagiarism_detected ON plagiarism_checks(is_plagiarized);

-- ========================================
-- 10. QUESTION RANDOMIZATION
-- ========================================

CREATE TABLE IF NOT EXISTS question_randomization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Assessment Configuration
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

  -- Randomization Settings
  randomize_questions BOOLEAN DEFAULT false,
  randomize_options BOOLEAN DEFAULT false,
  question_pool_size INTEGER,
  questions_per_attempt INTEGER,

  -- Question Pool
  question_pool_ids UUID[], -- Pool of question IDs

  -- Algorithm
  randomization_seed VARCHAR(255), -- For reproducibility
  selection_algorithm VARCHAR(100) DEFAULT 'random', -- 'random', 'weighted', 'adaptive'

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_randomization_assessment ON question_randomization(assessment_id);

-- ========================================
-- 11. QUESTION BANK VARIANTS
-- ========================================

CREATE TABLE IF NOT EXISTS question_bank_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Base Question
  base_question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,

  -- Variant Details
  variant_number INTEGER NOT NULL,
  variant_question_text TEXT NOT NULL,

  -- Options (if multiple choice)
  variant_options JSONB,
  correct_answer JSONB,

  -- Difficulty
  difficulty_level VARCHAR(50),
  cognitive_level VARCHAR(50), -- Bloom's taxonomy

  -- Usage Statistics
  times_used INTEGER DEFAULT 0,
  average_score NUMERIC,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_base_variant UNIQUE (base_question_id, variant_number)
);

CREATE INDEX idx_variants_base ON question_bank_variants(base_question_id);
CREATE INDEX idx_variants_active ON question_bank_variants(is_active);

-- ========================================
-- 12. TIME CONSTRAINTS
-- ========================================

CREATE TABLE IF NOT EXISTS assessment_time_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Assessment Reference
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User-specific overrides

  -- Time Limits
  total_time_limit_minutes INTEGER,
  per_question_time_limit_seconds INTEGER,
  extra_time_granted_minutes INTEGER DEFAULT 0, -- Accommodations

  -- Access Window
  access_start_time TIMESTAMP,
  access_end_time TIMESTAMP,

  -- Attempt Restrictions
  max_attempts INTEGER DEFAULT 1,
  cooldown_period_hours INTEGER, -- Between attempts

  -- Late Submission
  late_submission_allowed BOOLEAN DEFAULT false,
  late_penalty_percent NUMERIC, -- Per day/hour

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_constraints_assessment ON assessment_time_constraints(assessment_id);
CREATE INDEX idx_time_constraints_user ON assessment_time_constraints(user_id);

-- ========================================
-- 13. FUNCTIONS
-- ========================================

-- Function: Calculate session risk score
CREATE OR REPLACE FUNCTION calculate_session_risk_score(p_session_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_risk_score NUMERIC := 0;
  v_violation_count INTEGER;
  v_critical_count INTEGER;
BEGIN
  -- Count violations by severity
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE severity = 'critical')
  INTO v_violation_count, v_critical_count
  FROM violation_incidents
  WHERE session_id = p_session_id;

  -- Calculate risk score (0-100)
  v_risk_score := LEAST(
    (v_violation_count * 5) + (v_critical_count * 20),
    100
  );

  RETURN v_risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Flag session for review
CREATE OR REPLACE FUNCTION flag_session_for_review(
  p_session_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE proctoring_sessions
  SET
    requires_review = true,
    review_status = 'pending',
    overall_risk_score = calculate_session_risk_score(p_session_id),
    integrity_score = 100 - calculate_session_risk_score(p_session_id),
    updated_at = NOW(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{flag_reason}',
      to_jsonb(p_reason)
    )
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Record violation incident
CREATE OR REPLACE FUNCTION record_violation(
  p_session_id UUID,
  p_violation_type violation_type,
  p_severity violation_severity,
  p_description TEXT DEFAULT NULL,
  p_auto_flag BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_violation_id UUID;
  v_user_id UUID;
BEGIN
  -- Get user_id from session
  SELECT user_id INTO v_user_id
  FROM proctoring_sessions
  WHERE id = p_session_id;

  -- Insert violation
  INSERT INTO violation_incidents (
    session_id, user_id, violation_type, severity,
    violation_description, auto_flagged
  ) VALUES (
    p_session_id, v_user_id, p_violation_type, p_severity,
    p_description, p_auto_flag
  )
  RETURNING id INTO v_violation_id;

  -- Update session statistics
  UPDATE proctoring_sessions
  SET
    total_violations = total_violations + 1,
    critical_violations = critical_violations + CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Auto-flag for review if critical or high
  IF p_auto_flag AND p_severity IN ('critical', 'high') THEN
    PERFORM flag_session_for_review(
      p_session_id,
      'Automatic flag due to ' || p_severity || ' violation: ' || p_violation_type
    );
  END IF;

  RETURN v_violation_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check plagiarism threshold
CREATE OR REPLACE FUNCTION check_plagiarism_threshold(
  p_submission_id UUID,
  p_threshold NUMERIC DEFAULT 20.0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_similarity NUMERIC;
BEGIN
  SELECT overall_similarity_percent
  INTO v_similarity
  FROM plagiarism_checks
  WHERE submission_id = p_submission_id
  ORDER BY checked_at DESC
  LIMIT 1;

  RETURN COALESCE(v_similarity >= p_threshold, false);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 14. TRIGGERS
-- ========================================

-- Trigger: Auto-update session risk score on violation
CREATE OR REPLACE FUNCTION trigger_update_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proctoring_sessions
  SET
    overall_risk_score = calculate_session_risk_score(NEW.session_id),
    integrity_score = 100 - calculate_session_risk_score(NEW.session_id),
    updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_violation_update_risk
AFTER INSERT ON violation_incidents
FOR EACH ROW
EXECUTE FUNCTION trigger_update_risk_score();

-- ========================================
-- 15. VIEWS
-- ========================================

-- View: High-risk proctoring sessions
CREATE OR REPLACE VIEW high_risk_sessions AS
SELECT
  ps.id,
  ps.session_token,
  ps.user_id,
  u.full_name,
  u.email,
  ps.assessment_id,
  a.title AS assessment_title,
  ps.status,
  ps.overall_risk_score,
  ps.integrity_score,
  ps.total_violations,
  ps.critical_violations,
  ps.review_status,
  ps.actual_start_time
FROM proctoring_sessions ps
JOIN users u ON ps.user_id = u.id
JOIN assessments a ON ps.assessment_id = a.id
WHERE ps.overall_risk_score >= 50
   OR ps.critical_violations > 0
   OR ps.requires_review = true
ORDER BY ps.overall_risk_score DESC, ps.actual_start_time DESC;

-- View: Violation summary by type
CREATE OR REPLACE VIEW violation_summary AS
SELECT
  violation_type,
  severity,
  COUNT(*) AS incident_count,
  COUNT(DISTINCT session_id) AS affected_sessions,
  COUNT(DISTINCT user_id) AS affected_users,
  AVG(confidence_score) AS avg_confidence,
  COUNT(*) FILTER (WHERE is_reviewed = true) AS reviewed_count,
  COUNT(*) FILTER (WHERE review_decision = 'confirmed') AS confirmed_count
FROM violation_incidents
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY violation_type, severity
ORDER BY incident_count DESC;

-- View: Plagiarism detection summary
CREATE OR REPLACE VIEW plagiarism_summary AS
SELECT
  a.id AS assessment_id,
  a.title AS assessment_title,
  COUNT(pc.id) AS total_checks,
  COUNT(*) FILTER (WHERE pc.is_plagiarized = true) AS plagiarism_detected,
  AVG(pc.overall_similarity_percent) AS avg_similarity,
  MAX(pc.overall_similarity_percent) AS max_similarity,
  COUNT(*) FILTER (WHERE pc.requires_review = true) AS pending_review
FROM plagiarism_checks pc
JOIN assessments a ON pc.assessment_id = a.id
WHERE pc.checked_at > NOW() - INTERVAL '90 days'
GROUP BY a.id, a.title;

-- View: Identity verification stats
CREATE OR REPLACE VIEW identity_verification_stats AS
SELECT
  verification_method,
  COUNT(*) AS total_verifications,
  COUNT(*) FILTER (WHERE is_verified = true) AS successful,
  COUNT(*) FILTER (WHERE is_verified = false) AS failed,
  AVG(verification_confidence) AS avg_confidence,
  ROUND(
    COUNT(*) FILTER (WHERE is_verified = true)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS success_rate
FROM identity_verifications
WHERE verification_timestamp > NOW() - INTERVAL '30 days'
GROUP BY verification_method;

COMMENT ON SCHEMA public IS 'Advanced Proctoring & Assessment Integrity - AI proctoring, facial recognition, plagiarism detection, browser lockdown';
