-- ══════════════════════════════════════════════════════════════════════════════
-- PROCTORED ASSESSMENT & BIOMETRIC VERIFICATION SCHEMA
-- Comprehensive exam integrity and identity verification
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Proctored Exam Sessions ───────────────────────────────────────────────────
CREATE TYPE exam_status AS ENUM ('scheduled', 'in_progress', 'completed', 'flagged', 'cancelled');
CREATE TYPE proctor_mode AS ENUM ('live_human', 'ai_proctored', 'record_and_review');
CREATE TYPE integrity_level AS ENUM ('low', 'medium', 'high', 'maximum');

CREATE TABLE IF NOT EXISTS proctored_exam_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  assessment_id     UUID NOT NULL,  -- References assessment/quiz
  course_id         UUID NOT NULL,
  enrollment_id     UUID NOT NULL,

  -- Exam configuration
  proctor_mode      proctor_mode NOT NULL DEFAULT 'ai_proctored',
  integrity_level   integrity_level NOT NULL DEFAULT 'high',
  time_limit_minutes INT NOT NULL,
  allowed_attempts  INT NOT NULL DEFAULT 1,
  attempt_number    INT NOT NULL DEFAULT 1,

  -- Session timing
  scheduled_start   TIMESTAMPTZ,
  actual_start      TIMESTAMPTZ,
  actual_end        TIMESTAMPTZ,
  time_remaining_seconds INT,

  -- Status
  status            exam_status NOT NULL DEFAULT 'scheduled',
  is_flagged        BOOLEAN NOT NULL DEFAULT false,
  flag_count        INT NOT NULL DEFAULT 0,
  risk_score        DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 0-100 risk score

  -- Proctoring data
  webcam_enabled    BOOLEAN NOT NULL DEFAULT false,
  screen_recording_enabled BOOLEAN NOT NULL DEFAULT false,
  browser_lockdown_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Recordings (stored URLs)
  webcam_recording_url VARCHAR(500),
  screen_recording_url VARCHAR(500),

  -- Results
  final_score       DECIMAL(5,2),
  passed            BOOLEAN,

  -- Verification
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  biometric_verified BOOLEAN NOT NULL DEFAULT false,
  verification_confidence DECIMAL(5,2),  -- 0-100 confidence score

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Biometric Verification Attempts ───────────────────────────────────────────
CREATE TYPE verification_method AS ENUM ('face_recognition', 'fingerprint', 'voice', 'id_document');
CREATE TYPE verification_result AS ENUM ('verified', 'failed', 'inconclusive', 'skipped');

CREATE TABLE IF NOT EXISTS biometric_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id   UUID NOT NULL REFERENCES proctored_exam_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,

  -- Verification details
  verification_method verification_method NOT NULL,
  verification_result verification_result NOT NULL,
  confidence_score  DECIMAL(5,2),  -- 0-100 confidence

  -- Image/Data references (never store raw biometric data)
  reference_image_hash VARCHAR(255),  -- Hash of reference photo
  capture_image_hash VARCHAR(255),     -- Hash of captured photo
  comparison_metadata JSONB,            -- Comparison results (no raw images)

  -- Timing
  attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_time_ms INT,

  -- Provider details (e.g., AWS Rekognition, Azure Face API)
  provider_name     VARCHAR(100),
  provider_transaction_id VARCHAR(255),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Proctoring Flags ───────────────────────────────────────────────────────────
CREATE TYPE flag_type AS ENUM (
  'multiple_faces',
  'no_face_detected',
  'face_not_visible',
  'looking_away',
  'tab_switch',
  'window_switch',
  'new_window_opened',
  'copy_paste_attempted',
  'unauthorized_device',
  'network_disconnection',
  'suspicious_noise',
  'prohibited_software_detected',
  'identity_mismatch',
  'exam_content_screenshot',
  'second_monitor_detected'
);

CREATE TYPE flag_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS proctoring_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id   UUID NOT NULL REFERENCES proctored_exam_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,

  -- Flag details
  flag_type         flag_type NOT NULL,
  severity          flag_severity NOT NULL,
  description       TEXT,

  -- Timestamp
  flagged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exam_position_seconds INT,  -- How many seconds into the exam

  -- Evidence
  screenshot_url    VARCHAR(500),  -- Screenshot of violation
  webcam_frame_url  VARCHAR(500),  -- Webcam frame at time of flag
  evidence_metadata JSONB,          -- Additional context

  -- Review
  reviewed          BOOLEAN NOT NULL DEFAULT false,
  reviewed_by       UUID,  -- Admin/proctor who reviewed
  review_outcome    VARCHAR(50),  -- 'confirmed', 'dismissed', 'false_positive'
  review_notes      TEXT,
  reviewed_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Browser Lockdown Events ────────────────────────────────────────────────────
CREATE TYPE lockdown_event_type AS ENUM (
  'lockdown_activated',
  'lockdown_deactivated',
  'exit_attempt',
  'fullscreen_exit',
  'devtools_opened',
  'context_menu_blocked',
  'keyboard_shortcut_blocked',
  'paste_blocked',
  'print_blocked'
);

CREATE TABLE IF NOT EXISTS browser_lockdown_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id   UUID NOT NULL REFERENCES proctored_exam_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,

  event_type        lockdown_event_type NOT NULL,
  event_timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_action    VARCHAR(255),  -- Specific action that was blocked

  metadata          JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AI Proctor Analysis ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_proctor_frames (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id   UUID NOT NULL REFERENCES proctored_exam_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,

  -- Frame details
  frame_timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exam_position_seconds INT NOT NULL,

  -- Analysis results
  face_detected     BOOLEAN NOT NULL,
  face_count        INT NOT NULL DEFAULT 0,
  primary_face_confidence DECIMAL(5,2),

  -- Attention tracking
  looking_at_screen BOOLEAN,
  eye_gaze_direction VARCHAR(50),  -- 'center', 'left', 'right', 'up', 'down'
  attention_score   DECIMAL(5,2),  -- 0-100 how focused they appear

  -- Environment
  lighting_quality  VARCHAR(20),  -- 'good', 'poor', 'too_dark', 'too_bright'
  background_stable BOOLEAN,  -- Is background changing (indication of movement)?

  -- Audio (if enabled)
  audio_level       INT,  -- 0-100
  speech_detected   BOOLEAN,
  multiple_voices   BOOLEAN,

  -- Risk assessment
  frame_risk_score  DECIMAL(5,2),  -- 0-100 risk for this frame

  -- Evidence
  frame_url         VARCHAR(500),  -- URL to stored frame (if flagged)

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Proctored Exam Configuration ───────────────────────────────────────────────
-- Instructor-defined proctoring rules per assessment
CREATE TABLE IF NOT EXISTS proctoring_config (
  assessment_id     UUID PRIMARY KEY,

  -- Proctoring settings
  require_webcam    BOOLEAN NOT NULL DEFAULT true,
  require_screen_recording BOOLEAN NOT NULL DEFAULT false,
  require_browser_lockdown BOOLEAN NOT NULL DEFAULT true,
  require_biometric_verification BOOLEAN NOT NULL DEFAULT true,

  -- Proctor mode
  proctor_mode      proctor_mode NOT NULL DEFAULT 'ai_proctored',

  -- Integrity level
  integrity_level   integrity_level NOT NULL DEFAULT 'high',

  -- AI Proctor settings
  ai_frame_capture_interval_seconds INT DEFAULT 10,  -- Capture frame every N seconds
  ai_attention_threshold DECIMAL(5,2) DEFAULT 60.00,  -- Flag if attention < threshold
  ai_risk_threshold DECIMAL(5,2) DEFAULT 70.00,      -- Flag if risk > threshold

  -- Tolerance settings
  max_tab_switches  INT DEFAULT 0,  -- 0 = none allowed
  max_face_not_visible_seconds INT DEFAULT 10,
  max_multiple_faces_seconds INT DEFAULT 5,
  max_looking_away_seconds INT DEFAULT 15,

  -- Automatic actions
  auto_pause_on_flag BOOLEAN DEFAULT false,
  auto_submit_on_critical_flag BOOLEAN DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Verified Badges ────────────────────────────────────────────────────────────
-- Cryptographically signed badges for proctored exam completion
CREATE TABLE IF NOT EXISTS verified_badges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  exam_session_id   UUID NOT NULL REFERENCES proctored_exam_sessions(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL,
  assessment_id     UUID NOT NULL,

  -- Badge details
  badge_title       VARCHAR(255) NOT NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Verification
  verification_code VARCHAR(100) UNIQUE NOT NULL,  -- Publicly verifiable code
  signature         TEXT NOT NULL,  -- Cryptographic signature (RS256)
  public_key_id     VARCHAR(100) NOT NULL,  -- ID of public key used

  -- Metadata
  proctor_mode      proctor_mode NOT NULL,
  integrity_level   integrity_level NOT NULL,
  final_score       DECIMAL(5,2) NOT NULL,

  -- Verification URL
  verification_url  VARCHAR(500),  -- Public URL to verify badge

  -- Revocation
  is_revoked        BOOLEAN NOT NULL DEFAULT false,
  revoked_at        TIMESTAMPTZ,
  revocation_reason TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Exam Sessions
CREATE INDEX idx_exam_sessions_user_id ON proctored_exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_assessment_id ON proctored_exam_sessions(assessment_id);
CREATE INDEX idx_exam_sessions_course_id ON proctored_exam_sessions(course_id);
CREATE INDEX idx_exam_sessions_status ON proctored_exam_sessions(status);
CREATE INDEX idx_exam_sessions_flagged ON proctored_exam_sessions(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_exam_sessions_scheduled ON proctored_exam_sessions(scheduled_start);

-- Biometric Verifications
CREATE INDEX idx_biometric_verifications_session_id ON biometric_verifications(exam_session_id);
CREATE INDEX idx_biometric_verifications_user_id ON biometric_verifications(user_id);
CREATE INDEX idx_biometric_verifications_result ON biometric_verifications(verification_result);

-- Proctoring Flags
CREATE INDEX idx_proctoring_flags_session_id ON proctoring_flags(exam_session_id);
CREATE INDEX idx_proctoring_flags_user_id ON proctoring_flags(user_id);
CREATE INDEX idx_proctoring_flags_type ON proctoring_flags(flag_type);
CREATE INDEX idx_proctoring_flags_severity ON proctoring_flags(severity);
CREATE INDEX idx_proctoring_flags_reviewed ON proctoring_flags(reviewed) WHERE reviewed = false;

-- Browser Lockdown Events
CREATE INDEX idx_lockdown_events_session_id ON browser_lockdown_events(exam_session_id);
CREATE INDEX idx_lockdown_events_user_id ON browser_lockdown_events(user_id);
CREATE INDEX idx_lockdown_events_type ON browser_lockdown_events(event_type);

-- AI Proctor Frames
CREATE INDEX idx_ai_proctor_frames_session_id ON ai_proctor_frames(exam_session_id);
CREATE INDEX idx_ai_proctor_frames_user_id ON ai_proctor_frames(user_id);
CREATE INDEX idx_ai_proctor_frames_timestamp ON ai_proctor_frames(frame_timestamp);
CREATE INDEX idx_ai_proctor_frames_high_risk ON ai_proctor_frames(frame_risk_score) WHERE frame_risk_score > 70;

-- Verified Badges
CREATE INDEX idx_verified_badges_user_id ON verified_badges(user_id);
CREATE INDEX idx_verified_badges_verification_code ON verified_badges(verification_code);
CREATE INDEX idx_verified_badges_exam_session_id ON verified_badges(exam_session_id);
CREATE INDEX idx_verified_badges_revoked ON verified_badges(is_revoked) WHERE is_revoked = false;

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Update updated_at timestamp
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON proctored_exam_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proctoring_config_updated_at BEFORE UPDATE ON proctoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate exam risk score based on flags
CREATE OR REPLACE FUNCTION calculate_exam_risk_score()
RETURNS TRIGGER AS $$
DECLARE
  total_flags INT;
  critical_flags INT;
  high_flags INT;
  medium_flags INT;
  risk_score DECIMAL(5,2);
BEGIN
  -- Count flags by severity
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical,
    COUNT(*) FILTER (WHERE severity = 'high') as high,
    COUNT(*) FILTER (WHERE severity = 'medium') as medium
  INTO total_flags, critical_flags, high_flags, medium_flags
  FROM proctoring_flags
  WHERE exam_session_id = NEW.exam_session_id;

  -- Calculate weighted risk score
  risk_score := (
    (critical_flags * 40) +  -- Each critical flag = 40 points
    (high_flags * 20) +      -- Each high flag = 20 points
    (medium_flags * 10)      -- Each medium flag = 10 points
  );

  -- Cap at 100
  IF risk_score > 100 THEN
    risk_score := 100;
  END IF;

  -- Update exam session
  UPDATE proctored_exam_sessions
  SET
    risk_score = risk_score,
    flag_count = total_flags,
    is_flagged = (total_flags > 0 OR risk_score > 50),
    updated_at = NOW()
  WHERE id = NEW.exam_session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_risk_score_trigger
AFTER INSERT ON proctoring_flags
FOR EACH ROW EXECUTE FUNCTION calculate_exam_risk_score();

-- Auto-update verification status
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark session as identity verified if biometric verification succeeded
  IF NEW.verification_result = 'verified' THEN
    UPDATE proctored_exam_sessions
    SET
      identity_verified = true,
      biometric_verified = true,
      verification_confidence = NEW.confidence_score,
      updated_at = NOW()
    WHERE id = NEW.exam_session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verification_trigger
AFTER INSERT ON biometric_verifications
FOR EACH ROW EXECUTE FUNCTION update_verification_status();

-- ══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Generate cryptographic signature for verified badge
CREATE OR REPLACE FUNCTION generate_badge_signature(
  p_badge_id UUID,
  p_user_id UUID,
  p_assessment_id UUID,
  p_score DECIMAL
)
RETURNS TEXT AS $$
DECLARE
  payload TEXT;
  signature TEXT;
BEGIN
  -- Create payload string
  payload := p_badge_id::TEXT || '|' || p_user_id::TEXT || '|' ||
             p_assessment_id::TEXT || '|' || p_score::TEXT;

  -- In production, use actual RSA signature with private key
  -- This is a placeholder - integrate with crypto library
  signature := encode(digest(payload, 'sha256'), 'hex');

  RETURN signature;
END;
$$ LANGUAGE plpgsql;

-- Verify badge signature
CREATE OR REPLACE FUNCTION verify_badge_signature(
  p_verification_code VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  badge_record RECORD;
BEGIN
  SELECT * INTO badge_record
  FROM verified_badges
  WHERE verification_code = p_verification_code
    AND is_revoked = false;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- In production, verify RSA signature with public key
  -- This is a placeholder
  RETURN true;
END;
$$ LANGUAGE plpgsql;
