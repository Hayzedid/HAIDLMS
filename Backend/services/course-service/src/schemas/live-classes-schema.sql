-- ============================================================================
-- LIVE CLASSES & VIRTUAL CLASSROOM SCHEMA
-- ============================================================================
-- Real-time virtual classroom with video conferencing, live class scheduling,
-- screen sharing, interactive whiteboard, breakout rooms, and attendance tracking
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LIVE CLASSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  class_type VARCHAR(50) DEFAULT 'lecture', -- 'lecture', 'tutorial', 'workshop', 'office_hours', 'lab'

  -- Scheduling
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {frequency: 'daily'|'weekly'|'monthly', interval: 1, daysOfWeek: [1,3,5], endDate: '2026-12-31'}

  -- Access control
  access_type VARCHAR(50) DEFAULT 'enrolled', -- 'public', 'enrolled', 'invited', 'paid'
  requires_approval BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 100,
  password VARCHAR(255),

  -- Meeting details
  meeting_provider VARCHAR(50) DEFAULT 'internal', -- 'internal', 'zoom', 'webex', 'teams', 'jitsi'
  meeting_url TEXT,
  meeting_id VARCHAR(255),
  meeting_password VARCHAR(255),

  -- Features
  enable_recording BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  enable_screen_sharing BOOLEAN DEFAULT true,
  enable_whiteboard BOOLEAN DEFAULT true,
  enable_breakout_rooms BOOLEAN DEFAULT false,
  enable_polls BOOLEAN DEFAULT true,
  enable_qa BOOLEAN DEFAULT true,
  enable_hand_raise BOOLEAN DEFAULT true,

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'cancelled'
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,

  -- Recordings
  recording_url TEXT,
  recording_duration INTEGER, -- in seconds
  recording_size BIGINT, -- in bytes

  -- Metadata
  tags TEXT[],
  attachments JSONB, -- [{name: 'slides.pdf', url: '...', size: 1024}]
  reminder_sent BOOLEAN DEFAULT false,

  -- Statistics
  total_participants INTEGER DEFAULT 0,
  peak_concurrent_participants INTEGER DEFAULT 0,
  average_attendance_duration INTEGER DEFAULT 0, -- in seconds
  total_messages INTEGER DEFAULT 0,
  total_polls INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_classes_course ON live_classes(course_id);
CREATE INDEX idx_live_classes_instructor ON live_classes(instructor_id);
CREATE INDEX idx_live_classes_scheduled_start ON live_classes(scheduled_start_time);
CREATE INDEX idx_live_classes_status ON live_classes(status);
CREATE INDEX idx_live_classes_type ON live_classes(class_type);

-- ============================================================================
-- CLASS PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Registration
  registration_status VARCHAR(50) DEFAULT 'registered', -- 'invited', 'registered', 'approved', 'declined', 'removed'
  registered_at TIMESTAMP DEFAULT NOW(),
  invitation_sent_at TIMESTAMP,

  -- Attendance
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  attendance_duration INTEGER DEFAULT 0, -- in seconds
  is_present BOOLEAN DEFAULT false,

  -- Participation
  camera_enabled BOOLEAN DEFAULT false,
  microphone_enabled BOOLEAN DEFAULT false,
  screen_sharing BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'attendee', -- 'host', 'co-host', 'presenter', 'attendee'

  -- Permissions
  can_share_screen BOOLEAN DEFAULT false,
  can_use_chat BOOLEAN DEFAULT true,
  can_use_whiteboard BOOLEAN DEFAULT false,
  can_create_polls BOOLEAN DEFAULT false,
  is_muted_by_host BOOLEAN DEFAULT false,

  -- Engagement metrics
  messages_sent INTEGER DEFAULT 0,
  polls_answered INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  hand_raises INTEGER DEFAULT 0,
  reactions_sent INTEGER DEFAULT 0,

  -- Connection quality
  connection_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
  disconnections INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(class_id, user_id)
);

CREATE INDEX idx_class_participants_class ON class_participants(class_id);
CREATE INDEX idx_class_participants_user ON class_participants(user_id);
CREATE INDEX idx_class_participants_status ON class_participants(registration_status);
CREATE INDEX idx_class_participants_present ON class_participants(is_present);

-- ============================================================================
-- BREAKOUT ROOMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS breakout_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  room_number INTEGER NOT NULL,
  description TEXT,

  -- Configuration
  assignment_method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatic', 'self-select'
  max_participants INTEGER DEFAULT 10,
  duration_minutes INTEGER,

  -- Meeting details
  meeting_url TEXT,
  meeting_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'created', -- 'created', 'open', 'closed'
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,

  -- Statistics
  current_participants INTEGER DEFAULT 0,
  total_participants_joined INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_breakout_rooms_class ON breakout_rooms(class_id);
CREATE INDEX idx_breakout_rooms_status ON breakout_rooms(status);

-- ============================================================================
-- BREAKOUT ROOM ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS breakout_room_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES breakout_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,

  -- Assignment
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),

  -- Participation
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  participation_duration INTEGER DEFAULT 0, -- in seconds
  is_present BOOLEAN DEFAULT false,

  -- Engagement
  messages_sent INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_breakout_assignments_room ON breakout_room_assignments(room_id);
CREATE INDEX idx_breakout_assignments_user ON breakout_room_assignments(user_id);
CREATE INDEX idx_breakout_assignments_class ON breakout_room_assignments(class_id);

-- ============================================================================
-- WHITEBOARD SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS whiteboard_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  room_id UUID REFERENCES breakout_rooms(id) ON DELETE CASCADE, -- NULL if main room

  title VARCHAR(255),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content (stored as JSON for real-time sync)
  canvas_data JSONB, -- Whiteboard drawing data

  -- Permissions
  is_locked BOOLEAN DEFAULT false,
  can_edit_roles TEXT[] DEFAULT ARRAY['host', 'co-host', 'presenter'],

  -- Export
  snapshot_url TEXT, -- URL to saved PNG/PDF snapshot

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_whiteboard_sessions_class ON whiteboard_sessions(class_id);
CREATE INDEX idx_whiteboard_sessions_room ON whiteboard_sessions(room_id);

-- ============================================================================
-- WHITEBOARD ACTIONS (for history/undo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whiteboard_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES whiteboard_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  action_type VARCHAR(50) NOT NULL, -- 'draw', 'erase', 'text', 'shape', 'image', 'clear'
  action_data JSONB NOT NULL, -- Action-specific data

  sequence_number INTEGER NOT NULL, -- For ordering and conflict resolution

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_whiteboard_actions_session ON whiteboard_actions(session_id);
CREATE INDEX idx_whiteboard_actions_sequence ON whiteboard_actions(session_id, sequence_number);

-- ============================================================================
-- CLASS CHAT MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  room_id UUID REFERENCES breakout_rooms(id) ON DELETE CASCADE, -- NULL if main room
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'file', 'image', 'poll_result', 'system'

  -- Recipients
  is_private BOOLEAN DEFAULT false,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if public message

  -- File attachments
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(100),

  -- Reactions
  reactions JSONB DEFAULT '{}', -- {emoji: [userId1, userId2]}

  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP,

  -- Metadata
  reply_to_id UUID REFERENCES class_chat_messages(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_class_chat_class ON class_chat_messages(class_id);
CREATE INDEX idx_class_chat_room ON class_chat_messages(room_id);
CREATE INDEX idx_class_chat_user ON class_chat_messages(user_id);
CREATE INDEX idx_class_chat_created ON class_chat_messages(created_at);

-- ============================================================================
-- POLLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  question TEXT NOT NULL,
  poll_type VARCHAR(50) DEFAULT 'multiple_choice', -- 'multiple_choice', 'multiple_answer', 'yes_no', 'rating', 'open_text'

  -- Options (for multiple choice/answer)
  options JSONB, -- [{id: 'a', text: 'Option A'}, {id: 'b', text: 'Option B'}]

  -- Settings
  is_anonymous BOOLEAN DEFAULT false,
  allow_multiple_answers BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'closed'
  started_at TIMESTAMP,
  closed_at TIMESTAMP,

  -- Results
  total_responses INTEGER DEFAULT 0,
  results JSONB, -- {optionId: count} or aggregated data

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_class_polls_class ON class_polls(class_id);
CREATE INDEX idx_class_polls_status ON class_polls(status);

-- ============================================================================
-- POLL RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES class_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Response data
  selected_options TEXT[], -- For multiple choice/answer
  text_response TEXT, -- For open text
  rating_value INTEGER, -- For rating polls

  responded_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(poll_id, user_id)
);

CREATE INDEX idx_poll_responses_poll ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_user ON poll_responses(user_id);

-- ============================================================================
-- Q&A (Questions & Answers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  asked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  question TEXT NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'answered', 'dismissed'
  is_anonymous BOOLEAN DEFAULT false,

  -- Engagement
  upvotes INTEGER DEFAULT 0,
  upvoted_by UUID[], -- Array of user IDs who upvoted

  -- Answer
  answer TEXT,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  answered_at TIMESTAMP,

  -- Metadata
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_class_questions_class ON class_questions(class_id);
CREATE INDEX idx_class_questions_status ON class_questions(status);
CREATE INDEX idx_class_questions_upvotes ON class_questions(upvotes DESC);

-- ============================================================================
-- HAND RAISES
-- ============================================================================

CREATE TABLE IF NOT EXISTS hand_raises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(50) DEFAULT 'raised', -- 'raised', 'acknowledged', 'lowered'

  raised_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  lowered_at TIMESTAMP,

  -- Context
  reason TEXT, -- Optional: 'question', 'comment', 'technical_issue'

  UNIQUE(class_id, user_id, status)
);

CREATE INDEX idx_hand_raises_class ON hand_raises(class_id);
CREATE INDEX idx_hand_raises_status ON hand_raises(status);
CREATE INDEX idx_hand_raises_raised_at ON hand_raises(raised_at);

-- ============================================================================
-- SCREEN SHARING SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS screen_sharing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  session_type VARCHAR(50) DEFAULT 'screen', -- 'screen', 'window', 'application'

  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER, -- in seconds

  -- Recording (if screen share was recorded separately)
  recording_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_screen_sharing_class ON screen_sharing_sessions(class_id);
CREATE INDEX idx_screen_sharing_user ON screen_sharing_sessions(user_id);

-- ============================================================================
-- CLASS RECORDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- File details
  recording_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  format VARCHAR(50), -- 'mp4', 'webm', 'mkv'
  resolution VARCHAR(20), -- '1920x1080', '1280x720'

  -- Processing
  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'ready', 'failed'
  processing_progress INTEGER DEFAULT 0, -- 0-100

  -- Access control
  access_type VARCHAR(50) DEFAULT 'enrolled', -- 'public', 'enrolled', 'restricted'
  password VARCHAR(255),

  -- Transcription
  transcript_url TEXT,
  has_captions BOOLEAN DEFAULT false,

  -- Analytics
  total_views INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- in seconds

  -- Metadata
  recorded_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_class_recordings_class ON class_recordings(class_id);
CREATE INDEX idx_class_recordings_status ON class_recordings(status);
CREATE INDEX idx_class_recordings_recorded ON class_recordings(recorded_at);

-- ============================================================================
-- RECORDING VIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS recording_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID NOT NULL REFERENCES class_recordings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views

  started_at TIMESTAMP DEFAULT NOW(),
  last_position INTEGER DEFAULT 0, -- in seconds
  watch_duration INTEGER DEFAULT 0, -- in seconds
  completed BOOLEAN DEFAULT false,

  -- Device info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address INET,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recording_views_recording ON recording_views(recording_id);
CREATE INDEX idx_recording_views_user ON recording_views(user_id);

-- ============================================================================
-- CLASS REMINDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  reminder_time TIMESTAMP NOT NULL,
  reminder_type VARCHAR(50) DEFAULT 'email', -- 'email', 'push', 'sms'

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed'
  sent_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(class_id, user_id, reminder_time, reminder_type)
);

CREATE INDEX idx_class_reminders_class ON class_reminders(class_id);
CREATE INDEX idx_class_reminders_user ON class_reminders(user_id);
CREATE INDEX idx_class_reminders_time ON class_reminders(reminder_time);
CREATE INDEX idx_class_reminders_status ON class_reminders(status);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Upcoming classes view
CREATE OR REPLACE VIEW upcoming_classes AS
SELECT
  lc.*,
  u.name as instructor_name,
  u.email as instructor_email,
  c.title as course_title,
  COUNT(DISTINCT cp.user_id) as registered_count
FROM live_classes lc
JOIN users u ON lc.instructor_id = u.id
LEFT JOIN courses c ON lc.course_id = c.id
LEFT JOIN class_participants cp ON lc.id = cp.class_id
  AND cp.registration_status IN ('registered', 'approved')
WHERE lc.scheduled_start_time > NOW()
  AND lc.status = 'scheduled'
GROUP BY lc.id, u.id, u.name, u.email, c.title
ORDER BY lc.scheduled_start_time ASC;

-- Class analytics view
CREATE OR REPLACE VIEW class_analytics AS
SELECT
  lc.id,
  lc.title,
  lc.class_type,
  lc.scheduled_start_time,
  lc.scheduled_end_time,
  lc.actual_start_time,
  lc.actual_end_time,
  lc.status,
  lc.instructor_id,
  u.name as instructor_name,
  lc.total_participants,
  lc.peak_concurrent_participants,
  lc.average_attendance_duration,
  lc.total_messages,
  lc.total_polls,
  lc.total_questions,
  COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.joined_at IS NOT NULL) as actual_attendees,
  COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.registration_status IN ('registered', 'approved')) as registered_count,
  AVG(cp.attendance_duration) FILTER (WHERE cp.attendance_duration > 0) as avg_attendance_seconds,
  SUM(cp.messages_sent) as total_chat_messages,
  COUNT(DISTINCT br.id) as breakout_rooms_count,
  COUNT(DISTINCT cq.id) as questions_count,
  COUNT(DISTINCT cp2.id) as polls_count
FROM live_classes lc
JOIN users u ON lc.instructor_id = u.id
LEFT JOIN class_participants cp ON lc.id = cp.class_id
LEFT JOIN breakout_rooms br ON lc.id = br.class_id
LEFT JOIN class_questions cq ON lc.id = cq.class_id
LEFT JOIN class_polls cp2 ON lc.id = cp2.class_id
GROUP BY lc.id, u.id, u.name;

-- Active participants view (for real-time monitoring)
CREATE OR REPLACE VIEW active_participants AS
SELECT
  cp.*,
  u.name as user_name,
  u.email as user_email,
  u.avatar_url,
  lc.title as class_title,
  lc.status as class_status
FROM class_participants cp
JOIN users u ON cp.user_id = u.id
JOIN live_classes lc ON cp.class_id = lc.id
WHERE cp.is_present = true
  AND lc.status = 'live';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to start a live class
CREATE OR REPLACE FUNCTION start_live_class(p_class_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_classes
  SET status = 'live',
      actual_start_time = NOW()
  WHERE id = p_class_id
    AND status = 'scheduled';
END;
$$ LANGUAGE plpgsql;

-- Function to end a live class
CREATE OR REPLACE FUNCTION end_live_class(p_class_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE live_classes
  SET status = 'ended',
      actual_end_time = NOW()
  WHERE id = p_class_id
    AND status = 'live';

  -- Update all present participants to not present
  UPDATE class_participants
  SET is_present = false,
      left_at = NOW(),
      attendance_duration = EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER
  WHERE class_id = p_class_id
    AND is_present = true;
END;
$$ LANGUAGE plpgsql;

-- Function to join a class
CREATE OR REPLACE FUNCTION join_class(
  p_class_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE class_participants
  SET is_present = true,
      joined_at = NOW()
  WHERE class_id = p_class_id
    AND user_id = p_user_id;

  -- Update class statistics
  UPDATE live_classes
  SET total_participants = (
    SELECT COUNT(DISTINCT user_id)
    FROM class_participants
    WHERE class_id = p_class_id
      AND joined_at IS NOT NULL
  ),
  peak_concurrent_participants = GREATEST(
    peak_concurrent_participants,
    (SELECT COUNT(*) FROM class_participants WHERE class_id = p_class_id AND is_present = true)
  )
  WHERE id = p_class_id;
END;
$$ LANGUAGE plpgsql;

-- Function to leave a class
CREATE OR REPLACE FUNCTION leave_class(
  p_class_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_joined_at TIMESTAMP;
BEGIN
  SELECT joined_at INTO v_joined_at
  FROM class_participants
  WHERE class_id = p_class_id
    AND user_id = p_user_id;

  UPDATE class_participants
  SET is_present = false,
      left_at = NOW(),
      attendance_duration = attendance_duration + EXTRACT(EPOCH FROM (NOW() - v_joined_at))::INTEGER
  WHERE class_id = p_class_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_live_class_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_classes_updated_at
  BEFORE UPDATE ON live_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_live_class_timestamp();

CREATE TRIGGER class_participants_updated_at
  BEFORE UPDATE ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_live_class_timestamp();

CREATE TRIGGER breakout_rooms_updated_at
  BEFORE UPDATE ON breakout_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_live_class_timestamp();

-- Update class message count when chat message is added
CREATE OR REPLACE FUNCTION increment_class_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_classes
  SET total_messages = total_messages + 1
  WHERE id = NEW.class_id;

  UPDATE class_participants
  SET messages_sent = messages_sent + 1
  WHERE class_id = NEW.class_id
    AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_chat_message_created
  AFTER INSERT ON class_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_class_message_count();

-- Update poll count when poll is created
CREATE OR REPLACE FUNCTION increment_class_poll_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_classes
  SET total_polls = total_polls + 1
  WHERE id = NEW.class_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_poll_created
  AFTER INSERT ON class_polls
  FOR EACH ROW
  EXECUTE FUNCTION increment_class_poll_count();

-- Update question count when question is asked
CREATE OR REPLACE FUNCTION increment_class_question_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_classes
  SET total_questions = total_questions + 1
  WHERE id = NEW.class_id;

  UPDATE class_participants
  SET questions_asked = questions_asked + 1
  WHERE class_id = NEW.class_id
    AND user_id = NEW.asked_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_question_created
  AFTER INSERT ON class_questions
  FOR EACH ROW
  EXECUTE FUNCTION increment_class_question_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE live_classes IS 'Scheduled and live virtual classroom sessions';
COMMENT ON TABLE class_participants IS 'Users registered for and attending live classes';
COMMENT ON TABLE breakout_rooms IS 'Breakout rooms for small group discussions during live classes';
COMMENT ON TABLE whiteboard_sessions IS 'Interactive whiteboard sessions for collaborative drawing';
COMMENT ON TABLE class_chat_messages IS 'Chat messages sent during live classes';
COMMENT ON TABLE class_polls IS 'Polls and quizzes during live classes';
COMMENT ON TABLE class_questions IS 'Q&A questions asked during live classes';
COMMENT ON TABLE hand_raises IS 'Virtual hand raises during live classes';
COMMENT ON TABLE screen_sharing_sessions IS 'Screen sharing sessions during live classes';
COMMENT ON TABLE class_recordings IS 'Recorded live class sessions';
