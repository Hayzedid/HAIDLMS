-- Integrity Service Database Schema
-- Academic integrity, accountability, proctoring, and plagiarism detection

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity

-- Enums
CREATE TYPE watch_event_type AS ENUM (
  'play', 'pause', 'seek', 'tab_blur', 'tab_focus',
  'window_blur', 'window_focus', 'fullscreen_enter', 'fullscreen_exit'
);

CREATE TYPE checkpoint_result AS ENUM ('correct', 'incorrect', 'skipped', 'timeout');

CREATE TYPE proctoring_event_type AS ENUM (
  'session_start', 'session_end', 'face_detected', 'face_lost',
  'multiple_faces', 'no_face', 'tab_switch', 'screen_share_stopped',
  'suspicious_behavior', 'audio_detected', 'exam_submitted'
);

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed', 'requires_review');

CREATE TYPE plagiarism_status AS ENUM ('pending', 'clean', 'suspicious', 'plagiarized', 'under_review');

CREATE TYPE keystroke_event_type AS ENUM ('keydown', 'keyup', 'paste', 'cut', 'copy', 'focus', 'blur');

-- =============================================================================
-- VIDEO ACCOUNTABILITY TABLES
-- =============================================================================

-- Video watch sessions
CREATE TABLE video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL, -- seconds
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  total_watch_time INTEGER DEFAULT 0, -- seconds actually watched
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  passed_threshold BOOLEAN DEFAULT false,
  seek_count INTEGER DEFAULT 0,
  tab_switch_count INTEGER DEFAULT 0,
  violations JSONB DEFAULT '[]'::jsonb,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video watch events (detailed tracking)
CREATE TABLE video_watch_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  event_type watch_event_type NOT NULL,
  timestamp_ms INTEGER NOT NULL, -- video timestamp in milliseconds
  client_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  duration_ms INTEGER, -- for play/pause duration
  from_position INTEGER, -- for seek events
  to_position INTEGER, -- for seek events
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_watch_events_session ON video_watch_events(session_id);
CREATE INDEX idx_video_watch_events_type ON video_watch_events(event_type);

-- Comprehension checkpoints
CREATE TABLE comprehension_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  video_timestamp INTEGER NOT NULL, -- seconds into video
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_lesson ON comprehension_checkpoints(lesson_id);

-- Checkpoint responses
CREATE TABLE checkpoint_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id UUID REFERENCES comprehension_checkpoints(id) ON DELETE CASCADE,
  session_id UUID REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_answer TEXT,
  result checkpoint_result NOT NULL,
  time_taken INTEGER, -- seconds
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkpoint_responses_session ON checkpoint_responses(session_id);
CREATE INDEX idx_checkpoint_responses_user ON checkpoint_responses(user_id);

-- =============================================================================
-- LIVE PROCTORING TABLES
-- =============================================================================

-- Proctoring sessions
CREATE TABLE proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  assessment_type VARCHAR(50) NOT NULL, -- 'quiz', 'exam', 'assignment'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  webcam_enabled BOOLEAN DEFAULT false,
  screen_recording_enabled BOOLEAN DEFAULT false,
  browser_lockdown_enabled BOOLEAN DEFAULT false,
  face_verification_required BOOLEAN DEFAULT false,
  initial_verification_status verification_status DEFAULT 'pending',
  final_verification_status verification_status DEFAULT 'pending',
  suspicious_events_count INTEGER DEFAULT 0,
  violations JSONB DEFAULT '[]'::jsonb,
  is_flagged BOOLEAN DEFAULT false,
  proctor_review_status VARCHAR(50) DEFAULT 'pending',
  proctor_notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proctoring_sessions_user ON proctoring_sessions(user_id);
CREATE INDEX idx_proctoring_sessions_assessment ON proctoring_sessions(assessment_id);
CREATE INDEX idx_proctoring_sessions_flagged ON proctoring_sessions(is_flagged) WHERE is_flagged = true;

-- Proctoring events
CREATE TABLE proctoring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  event_type proctoring_event_type NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  screenshot_url TEXT,
  face_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proctoring_events_session ON proctoring_events(session_id);
CREATE INDEX idx_proctoring_events_type ON proctoring_events(event_type);
CREATE INDEX idx_proctoring_events_severity ON proctoring_events(severity);

-- Face snapshots (periodic captures during proctoring)
CREATE TABLE face_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT false,
  face_count INTEGER DEFAULT 0,
  confidence_score DECIMAL(5,4),
  face_encodings BYTEA, -- stored face embeddings for matching
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_face_snapshots_session ON face_snapshots(session_id);
CREATE INDEX idx_face_snapshots_timestamp ON face_snapshots(timestamp);

-- =============================================================================
-- BIOMETRIC VERIFICATION TABLES
-- =============================================================================

-- User biometric profiles
CREATE TABLE biometric_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  photo_id_url TEXT,
  profile_photo_url TEXT,
  face_encodings BYTEA, -- primary face encoding
  alternate_encodings JSONB DEFAULT '[]'::jsonb, -- multiple angles
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by UUID,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_biometric_profiles_user ON biometric_profiles(user_id);
CREATE INDEX idx_biometric_profiles_status ON biometric_profiles(verification_status);

-- Verification attempts
CREATE TABLE verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID,
  attempt_type VARCHAR(50) NOT NULL, -- 'initial', 'periodic', 'challenge'
  image_url TEXT NOT NULL,
  face_detected BOOLEAN DEFAULT false,
  match_score DECIMAL(5,4),
  verification_result verification_status NOT NULL,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_attempts_user ON verification_attempts(user_id);
CREATE INDEX idx_verification_attempts_session ON verification_attempts(session_id);
CREATE INDEX idx_verification_attempts_result ON verification_attempts(verification_result);

-- =============================================================================
-- KEYSTROKE RECORDING TABLES
-- =============================================================================

-- Keystroke sessions (tied to code submissions)
CREATE TABLE keystroke_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  language VARCHAR(50) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  total_keystrokes INTEGER DEFAULT 0,
  paste_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  typing_speed_wpm DECIMAL(6,2),
  pause_count INTEGER DEFAULT 0,
  avg_pause_duration DECIMAL(6,2),
  final_code TEXT,
  character_count INTEGER DEFAULT 0,
  line_count INTEGER DEFAULT 0,
  is_suspicious BOOLEAN DEFAULT false,
  analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keystroke_sessions_user ON keystroke_sessions(user_id);
CREATE INDEX idx_keystroke_sessions_assessment ON keystroke_sessions(assessment_id);
CREATE INDEX idx_keystroke_sessions_suspicious ON keystroke_sessions(is_suspicious) WHERE is_suspicious = true;

-- Keystroke events (every keystroke)
CREATE TABLE keystroke_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES keystroke_sessions(id) ON DELETE CASCADE,
  event_type keystroke_event_type NOT NULL,
  key VARCHAR(50),
  timestamp_ms BIGINT NOT NULL,
  cursor_position INTEGER,
  line_number INTEGER,
  column_number INTEGER,
  code_length INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keystroke_events_session ON keystroke_events(session_id);
CREATE INDEX idx_keystroke_events_type ON keystroke_events(event_type);

-- Code snapshots (periodic saves during typing)
CREATE TABLE code_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES keystroke_sessions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  line_count INTEGER,
  character_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_code_snapshots_session ON code_snapshots(session_id);

-- =============================================================================
-- PLAGIARISM DETECTION TABLES
-- =============================================================================

-- Code submissions
CREATE TABLE code_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  file_name VARCHAR(255),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  plagiarism_status plagiarism_status DEFAULT 'pending',
  similarity_score DECIMAL(5,4),
  matched_submissions JSONB DEFAULT '[]'::jsonb,
  moss_report_url TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  is_flagged BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_code_submissions_user ON code_submissions(user_id);
CREATE INDEX idx_code_submissions_assessment ON code_submissions(assessment_id);
CREATE INDEX idx_code_submissions_status ON code_submissions(plagiarism_status);
CREATE INDEX idx_code_submissions_flagged ON code_submissions(is_flagged) WHERE is_flagged = true;

-- Plagiarism matches
CREATE TABLE plagiarism_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission1_id UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  submission2_id UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL,
  matching_lines INTEGER,
  total_lines INTEGER,
  algorithm VARCHAR(50) NOT NULL, -- 'moss', 'levenshtein', 'ai_signature'
  match_details JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plagiarism_matches_submission1 ON plagiarism_matches(submission1_id);
CREATE INDEX idx_plagiarism_matches_submission2 ON plagiarism_matches(submission2_id);
CREATE INDEX idx_plagiarism_matches_score ON plagiarism_matches(similarity_score DESC);

-- Code patterns (for AI signature detection)
CREATE TABLE code_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  language VARCHAR(50) NOT NULL,
  pattern_signature JSONB NOT NULL, -- coding style fingerprint
  common_variable_names JSONB DEFAULT '[]'::jsonb,
  common_function_names JSONB DEFAULT '[]'::jsonb,
  indentation_style VARCHAR(20),
  avg_line_length DECIMAL(6,2),
  comment_frequency DECIMAL(5,4),
  complexity_metrics JSONB DEFAULT '{}'::jsonb,
  samples_analyzed INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_code_patterns_user ON code_patterns(user_id);
CREATE INDEX idx_code_patterns_language ON code_patterns(language);

-- External code matches (GitHub, StackOverflow)
CREATE TABLE external_code_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'github', 'stackoverflow', 'other'
  source_url TEXT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL,
  matched_code TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_external_matches_submission ON external_code_matches(submission_id);
CREATE INDEX idx_external_matches_score ON external_code_matches(similarity_score DESC);

-- =============================================================================
-- ACCOUNTABILITY DASHBOARD TABLES
-- =============================================================================

-- Integrity scores (aggregated)
CREATE TABLE integrity_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  overall_score DECIMAL(5,2) DEFAULT 100.00, -- 0-100
  video_accountability_score DECIMAL(5,2) DEFAULT 100.00,
  proctoring_score DECIMAL(5,2) DEFAULT 100.00,
  plagiarism_score DECIMAL(5,2) DEFAULT 100.00,
  behavior_score DECIMAL(5,2) DEFAULT 100.00,
  total_violations INTEGER DEFAULT 0,
  major_violations INTEGER DEFAULT 0,
  minor_violations INTEGER DEFAULT 0,
  last_violation_date TIMESTAMP,
  risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrity_scores_user ON integrity_scores(user_id);
CREATE INDEX idx_integrity_scores_risk ON integrity_scores(risk_level);
CREATE INDEX idx_integrity_scores_overall ON integrity_scores(overall_score);

-- Violation logs
CREATE TABLE violation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  violation_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'minor', 'major', 'critical'
  description TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  related_session_id UUID,
  action_taken VARCHAR(100),
  score_penalty DECIMAL(5,2) DEFAULT 0,
  notified BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_violation_logs_user ON violation_logs(user_id);
CREATE INDEX idx_violation_logs_type ON violation_logs(violation_type);
CREATE INDEX idx_violation_logs_severity ON violation_logs(severity);
CREATE INDEX idx_violation_logs_created ON violation_logs(created_at DESC);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Calculate video watch completion percentage
CREATE OR REPLACE FUNCTION calculate_watch_percentage(
  p_total_watch_time INTEGER,
  p_video_duration INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF p_video_duration = 0 THEN
    RETURN 0;
  END IF;
  RETURN LEAST(100, (p_total_watch_time::DECIMAL / p_video_duration) * 100);
END;
$$ LANGUAGE plpgsql;

-- Update integrity score
CREATE OR REPLACE FUNCTION update_integrity_score(
  p_user_id UUID,
  p_violation_type VARCHAR,
  p_severity VARCHAR
) RETURNS void AS $$
DECLARE
  v_penalty DECIMAL(5,2);
BEGIN
  -- Calculate penalty based on severity
  v_penalty := CASE p_severity
    WHEN 'minor' THEN 1.0
    WHEN 'major' THEN 5.0
    WHEN 'critical' THEN 15.0
    ELSE 0.0
  END;

  -- Insert or update integrity score
  INSERT INTO integrity_scores (user_id, overall_score, total_violations)
  VALUES (p_user_id, 100.00 - v_penalty, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    overall_score = GREATEST(0, integrity_scores.overall_score - v_penalty),
    total_violations = integrity_scores.total_violations + 1,
    major_violations = integrity_scores.major_violations + CASE WHEN p_severity = 'major' THEN 1 ELSE 0 END,
    minor_violations = integrity_scores.minor_violations + CASE WHEN p_severity = 'minor' THEN 1 ELSE 0 END,
    last_violation_date = NOW(),
    risk_level = CASE
      WHEN integrity_scores.overall_score - v_penalty < 50 THEN 'critical'
      WHEN integrity_scores.overall_score - v_penalty < 70 THEN 'high'
      WHEN integrity_scores.overall_score - v_penalty < 85 THEN 'medium'
      ELSE 'low'
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER video_watch_sessions_updated_at BEFORE UPDATE ON video_watch_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proctoring_sessions_updated_at BEFORE UPDATE ON proctoring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER keystroke_sessions_updated_at BEFORE UPDATE ON keystroke_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER code_submissions_updated_at BEFORE UPDATE ON code_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER integrity_scores_updated_at BEFORE UPDATE ON integrity_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Flagged users view
CREATE OR REPLACE VIEW flagged_users AS
SELECT
  u.user_id,
  u.overall_score,
  u.risk_level,
  u.total_violations,
  u.major_violations,
  u.last_violation_date,
  COUNT(DISTINCT ps.id) as flagged_proctoring_sessions,
  COUNT(DISTINCT cs.id) as flagged_submissions,
  u.flags
FROM integrity_scores u
LEFT JOIN proctoring_sessions ps ON ps.user_id = u.user_id AND ps.is_flagged = true
LEFT JOIN code_submissions cs ON cs.user_id = u.user_id AND cs.is_flagged = true
WHERE u.risk_level IN ('high', 'critical') OR u.overall_score < 70
GROUP BY u.user_id, u.overall_score, u.risk_level, u.total_violations, u.major_violations, u.last_violation_date, u.flags;
