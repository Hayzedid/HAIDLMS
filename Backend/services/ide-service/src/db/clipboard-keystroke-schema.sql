-- IDE Copy-Paste Restriction & Keystroke Recording Schema
-- Tracks clipboard access attempts and keystroke patterns for integrity

-- Clipboard/Paste Attempt Tracking
CREATE TABLE IF NOT EXISTS clipboard_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL, -- IDE session
  lesson_id UUID,
  assessment_id UUID,
  problem_id UUID,

  -- Attempt details
  attempt_type VARCHAR(50) NOT NULL, -- 'copy', 'cut', 'paste', 'drag_drop', 'right_click_paste'
  source VARCHAR(100), -- 'keyboard_shortcut', 'context_menu', 'drag_drop', 'browser_paste'
  blocked BOOLEAN DEFAULT true,
  content_length INT, -- Length of pasted content (not the content itself for privacy)
  content_hash VARCHAR(64), -- SHA-256 hash for detecting repeated pastes

  -- Context
  cursor_position INT,
  selected_text_length INT,
  file_name VARCHAR(255),
  line_number INT,

  -- Detection
  detected_by VARCHAR(50), -- 'keyboard_listener', 'clipboard_api', 'beforepaste_event'
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Keystroke Recording (Session-level)
CREATE TABLE IF NOT EXISTS keystroke_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  lesson_id UUID,
  assessment_id UUID,
  problem_id UUID,

  -- Session info
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INT,
  is_active BOOLEAN DEFAULT true,

  -- Keystroke summary
  total_keystrokes INT DEFAULT 0,
  total_deletions INT DEFAULT 0, -- Backspace/Delete count
  total_copy_attempts INT DEFAULT 0,
  total_paste_attempts INT DEFAULT 0,

  -- Typing patterns
  avg_typing_speed_wpm DECIMAL(5,2), -- Words per minute
  avg_key_interval_ms DECIMAL(6,2), -- Average time between keystrokes
  pause_count INT DEFAULT 0, -- Pauses > 5 seconds
  longest_pause_seconds INT,

  -- Code metrics
  lines_written INT DEFAULT 0,
  chars_written INT DEFAULT 0,
  chars_deleted INT DEFAULT 0,

  -- Flags
  has_suspicious_burst BOOLEAN DEFAULT false, -- Sudden typing burst (paste indicator)
  has_long_idle BOOLEAN DEFAULT false, -- >5 min idle (left to search/copy)
  consistency_score DECIMAL(5,2), -- 0-100: How consistent typing patterns are

  -- Final snapshot
  final_code TEXT,
  language VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual Keystroke Events (for replay)
CREATE TABLE IF NOT EXISTS keystroke_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES keystroke_sessions(id) ON DELETE CASCADE,

  -- Event details
  timestamp_ms BIGINT NOT NULL, -- Milliseconds since session start
  event_type VARCHAR(20) NOT NULL, -- 'keydown', 'keyup', 'paste', 'cut', 'copy'

  -- Key details
  key_code INT,
  key_name VARCHAR(50), -- 'a', 'Enter', 'Backspace', 'Ctrl', etc.
  is_special_key BOOLEAN DEFAULT false, -- Ctrl, Alt, Shift, Meta
  modifiers VARCHAR(50), -- 'ctrl', 'shift', 'alt', 'meta' (comma-separated)

  -- Context
  cursor_position INT,
  line_number INT,
  column_number INT,
  selection_start INT,
  selection_end INT,

  -- Change tracking
  char_inserted VARCHAR(10), -- Single character that was inserted (null for special keys)
  chars_deleted TEXT, -- Characters that were deleted (for backspace/delete)

  created_at TIMESTAMP DEFAULT NOW()
);

-- Paste Content Analysis (if paste is allowed in specific contexts)
CREATE TABLE IF NOT EXISTS paste_content_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES keystroke_sessions(id),
  clipboard_attempt_id UUID REFERENCES clipboard_attempts(id),

  -- Content analysis
  content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  content_length INT NOT NULL,
  detected_language VARCHAR(50), -- 'python', 'javascript', etc.

  -- Similarity analysis
  similarity_to_student_code DECIMAL(5,4), -- 0-1: How similar to their existing code
  is_likely_external BOOLEAN DEFAULT false, -- Doesn't match student's style

  -- Source detection
  potential_source VARCHAR(100), -- 'github', 'stackoverflow', 'chatgpt', 'unknown'
  source_confidence DECIMAL(3,2), -- 0-1

  -- AI detection
  ai_generated_probability DECIMAL(3,2), -- 0-1: Likelihood content is AI-generated
  ai_model_signature VARCHAR(100), -- 'gpt-4', 'claude', 'copilot', 'unknown'

  -- Pattern flags
  has_comments BOOLEAN DEFAULT false,
  has_complete_functions BOOLEAN DEFAULT false,
  has_imports BOOLEAN DEFAULT false,
  formatting_quality VARCHAR(20), -- 'poor', 'good', 'excellent' (AI code is usually excellent)

  created_at TIMESTAMP DEFAULT NOW()
);

-- Copy-Paste Configuration (per course/assessment)
CREATE TABLE IF NOT EXISTS clipboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID,
  assessment_id UUID,

  -- Restrictions
  paste_enabled BOOLEAN DEFAULT false,
  copy_enabled BOOLEAN DEFAULT false,
  cut_enabled BOOLEAN DEFAULT false,
  drag_drop_enabled BOOLEAN DEFAULT false,

  -- Exceptions
  allow_paste_from_within_ide BOOLEAN DEFAULT true, -- Can paste from own code
  allow_copy_to_submit BOOLEAN DEFAULT true, -- Can copy final code for submission

  -- Warnings
  show_warning_on_attempt BOOLEAN DEFAULT true,
  warning_message TEXT DEFAULT 'Copy/paste is disabled for this assessment. Type your code manually.',

  -- Logging
  log_all_attempts BOOLEAN DEFAULT true,
  notify_instructor_on_violation BOOLEAN DEFAULT false,
  violation_threshold INT DEFAULT 3, -- Notify after N attempts

  -- Keystroke recording
  enable_keystroke_recording BOOLEAN DEFAULT true,
  record_all_keys BOOLEAN DEFAULT false, -- false = only record typing events, not special keys
  enable_session_replay BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, assessment_id)
);

-- Typing Pattern Baseline (per student)
CREATE TABLE IF NOT EXISTS student_typing_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,

  -- Baseline metrics (calculated from non-restricted sessions)
  avg_typing_speed_wpm DECIMAL(5,2),
  std_dev_typing_speed DECIMAL(5,2),
  avg_key_interval_ms DECIMAL(6,2),
  std_dev_key_interval DECIMAL(6,2),

  -- Common patterns
  common_typos JSONB, -- { "teh": "the", "retrun": "return" }
  common_pause_locations JSONB, -- Where they typically pause (e.g., before function names)

  -- Behavioral fingerprint
  uses_tab_or_spaces VARCHAR(10), -- 'tabs', 'spaces'
  typical_indent_size INT,
  prefers_semicolons BOOLEAN, -- JavaScript style
  typical_session_duration_minutes INT,

  -- Deviation alerts
  alert_if_speed_increases_by_percent INT DEFAULT 100, -- Alert if speed doubles
  alert_if_pattern_changes BOOLEAN DEFAULT true,

  last_calculated_at TIMESTAMP,
  sessions_analyzed INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suspicious Activity Detection
CREATE TABLE IF NOT EXISTS ide_integrity_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES keystroke_sessions(id),
  assessment_id UUID,

  -- Flag details
  flag_type VARCHAR(100) NOT NULL, -- 'paste_attempt', 'typing_burst', 'external_code_detected', 'pattern_deviation'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  evidence JSONB, -- Detailed evidence (timestamps, metrics, etc.)

  -- Review
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  review_notes TEXT,
  action_taken VARCHAR(100), -- 'no_action', 'warning_sent', 'grade_penalty', 'manual_review'
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clipboard_attempts_user ON clipboard_attempts(user_id);
CREATE INDEX idx_clipboard_attempts_session ON clipboard_attempts(session_id);
CREATE INDEX idx_clipboard_attempts_assessment ON clipboard_attempts(assessment_id);
CREATE INDEX idx_clipboard_attempts_created ON clipboard_attempts(created_at);

CREATE INDEX idx_keystroke_sessions_user ON keystroke_sessions(user_id);
CREATE INDEX idx_keystroke_sessions_assessment ON keystroke_sessions(assessment_id);
CREATE INDEX idx_keystroke_sessions_active ON keystroke_sessions(is_active);

CREATE INDEX idx_keystroke_events_session ON keystroke_events(session_id);
CREATE INDEX idx_keystroke_events_timestamp ON keystroke_events(timestamp_ms);

CREATE INDEX idx_paste_analysis_user ON paste_content_analysis(user_id);
CREATE INDEX idx_paste_analysis_hash ON paste_content_analysis(content_hash);

CREATE INDEX idx_typing_patterns_user ON student_typing_patterns(user_id);

CREATE INDEX idx_integrity_flags_user ON ide_integrity_flags(user_id);
CREATE INDEX idx_integrity_flags_session ON ide_integrity_flags(session_id);
CREATE INDEX idx_integrity_flags_severity ON ide_integrity_flags(severity);
CREATE INDEX idx_integrity_flags_reviewed ON ide_integrity_flags(reviewed);

-- Trigger to update keystroke session on event insert
CREATE OR REPLACE FUNCTION update_keystroke_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE keystroke_sessions
  SET total_keystrokes = total_keystrokes + 1,
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_keystroke_stats
AFTER INSERT ON keystroke_events
FOR EACH ROW
WHEN (NEW.event_type = 'keydown' AND NOT NEW.is_special_key)
EXECUTE FUNCTION update_keystroke_session_stats();

-- Trigger to flag suspicious typing bursts
CREATE OR REPLACE FUNCTION detect_typing_burst()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INT;
  time_window_start BIGINT;
BEGIN
  -- Count keystrokes in last 1 second
  time_window_start := NEW.timestamp_ms - 1000;

  SELECT COUNT(*) INTO recent_count
  FROM keystroke_events
  WHERE session_id = NEW.session_id
    AND timestamp_ms >= time_window_start
    AND timestamp_ms <= NEW.timestamp_ms
    AND event_type = 'keydown';

  -- If more than 20 keystrokes per second = suspicious burst (likely paste)
  IF recent_count > 20 THEN
    UPDATE keystroke_sessions
    SET has_suspicious_burst = true
    WHERE id = NEW.session_id;

    -- Create integrity flag
    INSERT INTO ide_integrity_flags (user_id, session_id, flag_type, severity, description, evidence)
    SELECT
      ks.user_id,
      ks.id,
      'typing_burst',
      'high',
      'Detected ' || recent_count || ' keystrokes in 1 second - possible paste attempt',
      jsonb_build_object(
        'keystroke_count', recent_count,
        'time_window_ms', 1000,
        'timestamp', NEW.timestamp_ms
      )
    FROM keystroke_sessions ks
    WHERE ks.id = NEW.session_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_typing_burst
AFTER INSERT ON keystroke_events
FOR EACH ROW
WHEN (NEW.event_type = 'keydown')
EXECUTE FUNCTION detect_typing_burst();

-- View: Sessions with integrity concerns
CREATE OR REPLACE VIEW sessions_with_integrity_concerns AS
SELECT
  ks.id as session_id,
  ks.user_id,
  ks.assessment_id,
  ks.started_at,
  ks.has_suspicious_burst,
  ks.has_long_idle,
  ks.consistency_score,
  COUNT(ca.id) as paste_attempts,
  COUNT(DISTINCT IF.id) as integrity_flags,
  MAX(IF.severity) as highest_severity
FROM keystroke_sessions ks
LEFT JOIN clipboard_attempts ca ON ca.session_id = ks.id::text
LEFT JOIN ide_integrity_flags IF ON IF.session_id = ks.id
WHERE ks.has_suspicious_burst = true
   OR ks.has_long_idle = true
   OR ks.consistency_score < 50
   OR EXISTS (
     SELECT 1 FROM clipboard_attempts ca2
     WHERE ca2.session_id = ks.id::text AND ca2.blocked = true
   )
GROUP BY ks.id;

-- View: Student typing pattern deviations
CREATE OR REPLACE VIEW typing_pattern_deviations AS
SELECT
  ks.user_id,
  ks.id as session_id,
  ks.assessment_id,
  ks.avg_typing_speed_wpm,
  stp.avg_typing_speed_wpm as baseline_speed,
  ((ks.avg_typing_speed_wpm - stp.avg_typing_speed_wpm) / stp.avg_typing_speed_wpm * 100) as speed_change_percent,
  ks.avg_key_interval_ms,
  stp.avg_key_interval_ms as baseline_interval,
  ks.consistency_score,
  ks.has_suspicious_burst,
  COUNT(ca.id) as paste_attempts
FROM keystroke_sessions ks
JOIN student_typing_patterns stp ON stp.user_id = ks.user_id
LEFT JOIN clipboard_attempts ca ON ca.session_id = ks.id::text
WHERE ks.avg_typing_speed_wpm > stp.avg_typing_speed_wpm * 1.5 -- 50% faster than baseline
   OR ks.avg_key_interval_ms < stp.avg_key_interval_ms * 0.7 -- 30% faster interval
   OR ks.consistency_score < 60
GROUP BY ks.id, stp.user_id, stp.avg_typing_speed_wpm, stp.avg_key_interval_ms;

-- Comments
COMMENT ON TABLE clipboard_attempts IS 'Tracks all clipboard access attempts (copy/paste/cut)';
COMMENT ON TABLE keystroke_sessions IS 'Tracks IDE coding sessions with keystroke summary';
COMMENT ON TABLE keystroke_events IS 'Individual keystroke events for session replay';
COMMENT ON TABLE paste_content_analysis IS 'Analyzes pasted content for external sources and AI generation';
COMMENT ON TABLE clipboard_config IS 'Configuration for clipboard restrictions per course/assessment';
COMMENT ON TABLE student_typing_patterns IS 'Baseline typing patterns per student for anomaly detection';
COMMENT ON TABLE ide_integrity_flags IS 'Flags for suspicious activity detected in IDE';
