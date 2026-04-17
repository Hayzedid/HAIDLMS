-- ══════════════════════════════════════════════════════════════════════════════
-- VIDEO ACCOUNTABILITY SYSTEM SCHEMA
-- Tracks genuine video engagement vs passive watching
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Video Watch Sessions ───────────────────────────────────────────────────────
-- Tracks each time a student watches a video lesson
CREATE TABLE IF NOT EXISTS video_watch_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,

  -- Session tracking
  session_start     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end       TIMESTAMPTZ,
  total_watch_time_seconds INT NOT NULL DEFAULT 0,  -- Total time video was playing
  active_watch_time_seconds INT NOT NULL DEFAULT 0, -- Time user was actively engaged

  -- Engagement metrics
  tab_switches      INT NOT NULL DEFAULT 0,  -- Number of times user switched tabs
  tab_away_seconds  INT NOT NULL DEFAULT 0,  -- Total time spent with tab inactive
  idle_events       INT NOT NULL DEFAULT 0,  -- Number of times user went idle
  idle_seconds      INT NOT NULL DEFAULT 0,  -- Total idle time
  seek_events       INT NOT NULL DEFAULT 0,  -- Number of seeks (forward/backward)

  -- Video state
  video_duration_seconds INT NOT NULL,
  furthest_position_seconds INT NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  -- First watch tracking
  is_first_watch    BOOLEAN NOT NULL DEFAULT true,
  completed_first_watch BOOLEAN NOT NULL DEFAULT false,

  -- Session status
  session_quality_score DECIMAL(5,2),  -- 0-100 score based on engagement
  is_completed      BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Video Engagement Events ────────────────────────────────────────────────────
-- Granular log of all engagement events during video playback
CREATE TABLE IF NOT EXISTS video_engagement_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_session_id  UUID NOT NULL REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  lesson_id         UUID NOT NULL,

  -- Event details
  event_type        VARCHAR(50) NOT NULL,  -- 'play', 'pause', 'seek', 'tab_blur', 'tab_focus', 'idle_start', 'idle_end', 'volume_change', 'playback_rate_change'
  event_timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  video_position    INT NOT NULL,  -- Position in seconds when event occurred

  -- Event metadata
  metadata          JSONB,  -- Additional context (e.g., seek from/to, idle duration)

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Video Comprehension Checkpoints ────────────────────────────────────────────
-- Instructor-defined checkpoints with quiz questions
CREATE TABLE IF NOT EXISTS video_checkpoints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  -- Checkpoint configuration
  trigger_at_seconds INT NOT NULL,  -- Video position where checkpoint triggers
  checkpoint_type   VARCHAR(50) NOT NULL DEFAULT 'quiz',  -- 'quiz', 'note_required', 'reflection'
  is_required       BOOLEAN NOT NULL DEFAULT true,
  display_order     INT NOT NULL DEFAULT 0,

  -- Quiz question (if type is 'quiz')
  question_text     TEXT,
  question_type     VARCHAR(20),  -- 'multiple_choice', 'true_false', 'short_answer'
  options           JSONB,  -- For multiple choice: [{text: "Option A", is_correct: true}, ...]
  correct_answer    TEXT,   -- For short answer

  -- Note requirement (if type is 'note_required')
  note_prompt       TEXT,
  min_note_length   INT DEFAULT 50,

  -- Settings
  allow_skip        BOOLEAN NOT NULL DEFAULT false,
  max_attempts      INT DEFAULT 3,
  time_limit_seconds INT,  -- Optional time limit to answer

  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Checkpoint Responses ───────────────────────────────────────────────────────
-- Student responses to video checkpoints
CREATE TABLE IF NOT EXISTS checkpoint_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id     UUID NOT NULL REFERENCES video_checkpoints(id) ON DELETE CASCADE,
  watch_session_id  UUID NOT NULL REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  lesson_id         UUID NOT NULL,

  -- Response details
  attempt_number    INT NOT NULL DEFAULT 1,
  response_text     TEXT,
  selected_option   INT,  -- Index of selected option for multiple choice

  -- Evaluation
  is_correct        BOOLEAN,
  passed            BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INT,

  -- Note submission (if checkpoint_type is 'note_required')
  note_text         TEXT,
  note_word_count   INT,

  responded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Video Notes ────────────────────────────────────────────────────────────────
-- Student notes at specific video timestamps
CREATE TABLE IF NOT EXISTS video_notes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  watch_session_id  UUID REFERENCES video_watch_sessions(id) ON DELETE SET NULL,

  -- Note details
  video_timestamp   INT NOT NULL,  -- Position in seconds
  note_text         TEXT NOT NULL,
  word_count        INT,

  -- Required note tracking (linked to checkpoint if required)
  checkpoint_id     UUID REFERENCES video_checkpoints(id) ON DELETE SET NULL,
  is_required_note  BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Video Accountability Settings ──────────────────────────────────────────────
-- Per-lesson configuration for accountability features
CREATE TABLE IF NOT EXISTS video_accountability_settings (
  lesson_id         UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,

  -- Active watch detection
  enable_tab_tracking BOOLEAN NOT NULL DEFAULT true,
  enable_idle_detection BOOLEAN NOT NULL DEFAULT true,
  idle_threshold_seconds INT NOT NULL DEFAULT 30,

  -- Seek restrictions
  disable_seek_on_first_watch BOOLEAN NOT NULL DEFAULT true,
  allow_backward_seek BOOLEAN NOT NULL DEFAULT true,

  -- Completion requirements
  min_active_watch_percentage DECIMAL(5,2) NOT NULL DEFAULT 80.00,  -- Must watch 80% actively
  min_quality_score DECIMAL(5,2) NOT NULL DEFAULT 60.00,  -- Minimum quality score to count as completed

  -- Checkpoint configuration
  enable_checkpoints BOOLEAN NOT NULL DEFAULT false,
  checkpoint_randomization BOOLEAN NOT NULL DEFAULT true,  -- Randomize which students get which questions

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Watch Sessions
CREATE INDEX idx_watch_sessions_user_id ON video_watch_sessions(user_id);
CREATE INDEX idx_watch_sessions_lesson_id ON video_watch_sessions(lesson_id);
CREATE INDEX idx_watch_sessions_enrollment_id ON video_watch_sessions(enrollment_id);
CREATE INDEX idx_watch_sessions_user_lesson ON video_watch_sessions(user_id, lesson_id);
CREATE INDEX idx_watch_sessions_active ON video_watch_sessions(user_id, lesson_id) WHERE is_completed = false;
CREATE INDEX idx_watch_sessions_created_at ON video_watch_sessions(created_at DESC);

-- Engagement Events
CREATE INDEX idx_engagement_events_session_id ON video_engagement_events(watch_session_id);
CREATE INDEX idx_engagement_events_user_id ON video_engagement_events(user_id);
CREATE INDEX idx_engagement_events_lesson_id ON video_engagement_events(lesson_id);
CREATE INDEX idx_engagement_events_type ON video_engagement_events(event_type);
CREATE INDEX idx_engagement_events_timestamp ON video_engagement_events(event_timestamp DESC);

-- Checkpoints
CREATE INDEX idx_checkpoints_lesson_id ON video_checkpoints(lesson_id);
CREATE INDEX idx_checkpoints_trigger ON video_checkpoints(lesson_id, trigger_at_seconds);
CREATE INDEX idx_checkpoints_active ON video_checkpoints(lesson_id) WHERE is_active = true;

-- Checkpoint Responses
CREATE INDEX idx_checkpoint_responses_checkpoint_id ON checkpoint_responses(checkpoint_id);
CREATE INDEX idx_checkpoint_responses_session_id ON checkpoint_responses(watch_session_id);
CREATE INDEX idx_checkpoint_responses_user_id ON checkpoint_responses(user_id);
CREATE INDEX idx_checkpoint_responses_user_checkpoint ON checkpoint_responses(user_id, checkpoint_id);

-- Video Notes
CREATE INDEX idx_video_notes_user_id ON video_notes(user_id);
CREATE INDEX idx_video_notes_lesson_id ON video_notes(lesson_id);
CREATE INDEX idx_video_notes_session_id ON video_notes(watch_session_id);
CREATE INDEX idx_video_notes_timestamp ON video_notes(lesson_id, video_timestamp);

-- ══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Update updated_at timestamp
CREATE TRIGGER update_watch_sessions_updated_at BEFORE UPDATE ON video_watch_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at BEFORE UPDATE ON video_checkpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_notes_updated_at BEFORE UPDATE ON video_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accountability_settings_updated_at BEFORE UPDATE ON video_accountability_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate session quality score
CREATE OR REPLACE FUNCTION calculate_session_quality_score()
RETURNS TRIGGER AS $$
DECLARE
  quality_score DECIMAL(5,2);
  active_percentage DECIMAL(5,2);
  engagement_ratio DECIMAL(5,2);
BEGIN
  -- Calculate active watch percentage
  IF NEW.total_watch_time_seconds > 0 THEN
    active_percentage := (NEW.active_watch_time_seconds::DECIMAL / NEW.total_watch_time_seconds::DECIMAL) * 100;
  ELSE
    active_percentage := 0;
  END IF;

  -- Calculate engagement ratio (penalize tab switches and idle time)
  engagement_ratio := 100 - (
    (NEW.tab_switches * 2) +  -- Each tab switch costs 2 points
    (NEW.idle_events * 1.5)   -- Each idle event costs 1.5 points
  );

  -- Ensure engagement ratio doesn't go negative
  IF engagement_ratio < 0 THEN
    engagement_ratio := 0;
  END IF;

  -- Final quality score is weighted average
  quality_score := (active_percentage * 0.7) + (engagement_ratio * 0.3);

  -- Cap at 100
  IF quality_score > 100 THEN
    quality_score := 100;
  END IF;

  NEW.session_quality_score := quality_score;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_quality_score_trigger
BEFORE INSERT OR UPDATE ON video_watch_sessions
FOR EACH ROW EXECUTE FUNCTION calculate_session_quality_score();

-- ══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to check if lesson should count as completed
CREATE OR REPLACE FUNCTION is_video_lesson_completed(
  p_watch_session_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_session RECORD;
  v_settings RECORD;
  v_required_checkpoints INT;
  v_passed_checkpoints INT;
BEGIN
  -- Get watch session
  SELECT * INTO v_session
  FROM video_watch_sessions
  WHERE id = p_watch_session_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get accountability settings
  SELECT * INTO v_settings
  FROM video_accountability_settings
  WHERE lesson_id = v_session.lesson_id;

  IF NOT FOUND THEN
    -- No settings = use defaults (80% active watch)
    RETURN (v_session.active_watch_time_seconds::DECIMAL / v_session.video_duration_seconds::DECIMAL * 100) >= 80;
  END IF;

  -- Check minimum active watch percentage
  IF v_session.session_quality_score < v_settings.min_quality_score THEN
    RETURN false;
  END IF;

  -- Check completion percentage
  IF v_session.completion_percentage < v_settings.min_active_watch_percentage THEN
    RETURN false;
  END IF;

  -- Check required checkpoints if enabled
  IF v_settings.enable_checkpoints THEN
    SELECT COUNT(*) INTO v_required_checkpoints
    FROM video_checkpoints
    WHERE lesson_id = v_session.lesson_id
      AND is_required = true
      AND is_active = true;

    SELECT COUNT(DISTINCT checkpoint_id) INTO v_passed_checkpoints
    FROM checkpoint_responses
    WHERE watch_session_id = p_watch_session_id
      AND passed = true;

    IF v_passed_checkpoints < v_required_checkpoints THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
