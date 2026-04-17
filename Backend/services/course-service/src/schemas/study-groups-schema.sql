-- Study Groups & Collaborative Learning Schema
-- Student-created learning groups for peer collaboration

-- ========================================
-- 1. STUDY GROUPS
-- ========================================

CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url VARCHAR(500),

  -- Course Association
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

  -- Creator & Leadership
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Group Type
  group_type VARCHAR(50) DEFAULT 'study', -- 'study', 'project', 'accountability'

  -- Privacy Settings
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,

  -- Capacity
  max_members INTEGER DEFAULT 50,
  current_member_count INTEGER DEFAULT 1,

  -- Group Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'archived'

  -- Goal & Focus
  learning_goals TEXT[],
  focus_areas TEXT[],
  target_completion_date DATE,

  -- Meeting Schedule
  meeting_schedule JSONB, -- {day: 'Monday', time: '18:00', timezone: 'UTC', recurring: 'weekly'}

  -- Tags
  tags TEXT[],

  -- Statistics
  total_sessions INTEGER DEFAULT 0,
  total_resources INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_study_groups_course ON study_groups(course_id);
CREATE INDEX idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX idx_study_groups_status ON study_groups(status);
CREATE INDEX idx_study_groups_private ON study_groups(is_private);
CREATE INDEX idx_study_groups_tags ON study_groups USING GIN (tags);

-- ========================================
-- 2. STUDY GROUP MEMBERS
-- ========================================

CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(20) DEFAULT 'member', -- 'leader', 'moderator', 'member'

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'inactive'
  invitation_status VARCHAR(20) DEFAULT 'accepted', -- 'pending', 'accepted', 'declined'

  -- Invitation
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP,

  -- Participation
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,

  -- Contribution Metrics
  sessions_attended INTEGER DEFAULT 0,
  resources_shared INTEGER DEFAULT 0,
  notes_contributed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,

  -- Accountability
  commitment_level VARCHAR(20) DEFAULT 'regular', -- 'casual', 'regular', 'committed'
  study_hours_logged INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX idx_study_group_members_status ON study_group_members(status);
CREATE INDEX idx_study_group_members_role ON study_group_members(role);

-- ========================================
-- 3. STUDY SESSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,

  -- Session Info
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scheduling
  scheduled_start_time TIMESTAMP NOT NULL,
  scheduled_end_time TIMESTAMP NOT NULL,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,

  -- Location
  location_type VARCHAR(20) DEFAULT 'virtual', -- 'virtual', 'physical', 'hybrid'
  location_details TEXT,
  meeting_link VARCHAR(500),

  -- Agenda
  agenda TEXT,
  topics TEXT[],

  -- Organizer
  organized_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'cancelled'

  -- Attendance
  expected_attendees INTEGER DEFAULT 0,
  actual_attendees INTEGER DEFAULT 0,

  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'biweekly', 'monthly'
  parent_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

  -- Notes & Recording
  session_notes TEXT,
  recording_url VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_group ON study_sessions(group_id);
CREATE INDEX idx_study_sessions_organized_by ON study_sessions(organized_by);
CREATE INDEX idx_study_sessions_status ON study_sessions(status);
CREATE INDEX idx_study_sessions_scheduled ON study_sessions(scheduled_start_time);
CREATE INDEX idx_study_sessions_parent ON study_sessions(parent_session_id);

-- ========================================
-- 4. SESSION ATTENDANCE
-- ========================================

CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- RSVP
  rsvp_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'maybe'
  rsvp_at TIMESTAMP,

  -- Attendance
  attendance_status VARCHAR(20) DEFAULT 'absent', -- 'present', 'absent', 'late'
  checked_in_at TIMESTAMP,
  checked_out_at TIMESTAMP,
  duration_minutes INTEGER DEFAULT 0,

  -- Participation
  participation_rating INTEGER, -- 1-5 scale
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_user ON session_attendance(user_id);
CREATE INDEX idx_session_attendance_rsvp ON session_attendance(rsvp_status);
CREATE INDEX idx_session_attendance_status ON session_attendance(attendance_status);

-- ========================================
-- 5. SHARED RESOURCES
-- ========================================

CREATE TABLE IF NOT EXISTS study_group_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Resource Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'note', 'document', 'video', 'link', 'code', 'flashcard'

  -- File/Link
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  external_link VARCHAR(500),

  -- Content (for notes and text-based resources)
  content TEXT,
  content_format VARCHAR(20) DEFAULT 'markdown', -- 'markdown', 'html', 'plain'

  -- Organization
  folder_path VARCHAR(500),
  tags TEXT[],

  -- Related To
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  related_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  related_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

  -- Collaboration
  is_collaborative BOOLEAN DEFAULT false, -- Allow multi-user editing
  version INTEGER DEFAULT 1,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,

  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_study_group_resources_group ON study_group_resources(group_id);
CREATE INDEX idx_study_group_resources_uploaded_by ON study_group_resources(uploaded_by);
CREATE INDEX idx_study_group_resources_type ON study_group_resources(resource_type);
CREATE INDEX idx_study_group_resources_session ON study_group_resources(related_session_id);
CREATE INDEX idx_study_group_resources_tags ON study_group_resources USING GIN (tags);
CREATE INDEX idx_study_group_resources_pinned ON study_group_resources(is_pinned) WHERE is_pinned = true;

-- ========================================
-- 6. COLLABORATIVE NOTES
-- ========================================

CREATE TABLE IF NOT EXISTS collaborative_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES study_group_resources(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,

  -- Note Content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- Version Control
  version INTEGER NOT NULL,
  parent_version_id UUID REFERENCES collaborative_notes(id) ON DELETE SET NULL,

  -- Editor
  edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  edit_summary VARCHAR(500),

  -- Changes
  content_diff TEXT, -- Store diff for version comparison

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collaborative_notes_resource ON collaborative_notes(resource_id);
CREATE INDEX idx_collaborative_notes_group ON collaborative_notes(group_id);
CREATE INDEX idx_collaborative_notes_version ON collaborative_notes(resource_id, version);
CREATE INDEX idx_collaborative_notes_edited_by ON collaborative_notes(edited_by);

-- ========================================
-- 7. GROUP TASKS & ASSIGNMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS group_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,

  -- Task Info
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Assignment
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID[], -- Array of user IDs or NULL for entire group

  -- Timing
  due_date TIMESTAMP,
  estimated_hours DECIMAL(5,2),

  -- Priority & Status
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  -- Related Items
  related_resource_id UUID REFERENCES study_group_resources(id) ON DELETE SET NULL,
  related_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

  -- Completion
  completed_at TIMESTAMP,
  completion_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_group_tasks_group ON group_tasks(group_id);
CREATE INDEX idx_group_tasks_assigned_by ON group_tasks(assigned_by);
CREATE INDEX idx_group_tasks_status ON group_tasks(status);
CREATE INDEX idx_group_tasks_due_date ON group_tasks(due_date);
CREATE INDEX idx_group_tasks_assigned_to ON group_tasks USING GIN (assigned_to);

-- ========================================
-- 8. ACCOUNTABILITY PARTNERS
-- ========================================

CREATE TABLE IF NOT EXISTS accountability_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Partnership Info
  partnership_type VARCHAR(50) DEFAULT 'mutual', -- 'mutual', 'mentor', 'mentee'
  goals TEXT[],
  check_in_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly'

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'ended'

  -- Tracking
  check_ins_completed INTEGER DEFAULT 0,
  last_check_in_at TIMESTAMP,
  next_check_in_at TIMESTAMP,

  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(group_id, user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

CREATE INDEX idx_accountability_partners_group ON accountability_partners(group_id);
CREATE INDEX idx_accountability_partners_user1 ON accountability_partners(user1_id);
CREATE INDEX idx_accountability_partners_user2 ON accountability_partners(user2_id);
CREATE INDEX idx_accountability_partners_status ON accountability_partners(status);

-- ========================================
-- 9. STUDY LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session Info
  study_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Content
  topics_studied TEXT[],
  notes TEXT,

  -- Related Items
  related_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  related_resource_ids UUID[],

  -- Productivity
  productivity_rating INTEGER, -- 1-5 scale
  mood_rating INTEGER, -- 1-5 scale

  -- Visibility
  is_shared BOOLEAN DEFAULT true, -- Share with group

  logged_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_study_logs_group ON study_logs(group_id);
CREATE INDEX idx_study_logs_user ON study_logs(user_id);
CREATE INDEX idx_study_logs_date ON study_logs(study_date DESC);
CREATE INDEX idx_study_logs_session ON study_logs(related_session_id);

-- ========================================
-- 10. GROUP ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS study_group_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Activity Metrics
  active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,

  -- Engagement
  sessions_held INTEGER DEFAULT 0,
  avg_session_attendance DECIMAL(5,2) DEFAULT 0,
  resources_shared INTEGER DEFAULT 0,
  notes_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,

  -- Study Time
  total_study_hours DECIMAL(10,2) DEFAULT 0,
  avg_study_hours_per_member DECIMAL(5,2) DEFAULT 0,

  -- Collaboration
  messages_sent INTEGER DEFAULT 0,
  discussions_started INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(group_id, date)
);

CREATE INDEX idx_study_group_analytics_group ON study_group_analytics(group_id);
CREATE INDEX idx_study_group_analytics_date ON study_group_analytics(date DESC);

-- ========================================
-- 11. VIEWS
-- ========================================

-- View: Group Summary
CREATE OR REPLACE VIEW study_group_summary AS
SELECT
  sg.id AS group_id,
  sg.name,
  sg.description,
  sg.avatar_url,
  sg.course_id,
  c.title AS course_title,
  sg.created_by,
  u.full_name AS creator_name,
  sg.group_type,
  sg.is_private,
  sg.status,
  sg.max_members,
  sg.current_member_count,
  sg.total_sessions,
  sg.total_resources,
  COUNT(DISTINCT sgm.user_id) FILTER (WHERE sgm.status = 'active') AS active_members,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.scheduled_start_time > NOW()) AS upcoming_sessions,
  sg.created_at,
  sg.updated_at
FROM study_groups sg
LEFT JOIN courses c ON sg.course_id = c.id
LEFT JOIN users u ON sg.created_by = u.id
LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
LEFT JOIN study_sessions ss ON sg.id = ss.group_id
GROUP BY sg.id, c.title, u.full_name;

-- View: Member Activity
CREATE OR REPLACE VIEW study_group_member_activity AS
SELECT
  sgm.id,
  sgm.group_id,
  sg.name AS group_name,
  sgm.user_id,
  u.full_name AS user_name,
  u.avatar_url,
  sgm.role,
  sgm.status,
  sgm.commitment_level,
  sgm.sessions_attended,
  sgm.resources_shared,
  sgm.notes_contributed,
  sgm.tasks_completed,
  sgm.study_hours_logged,
  sgm.joined_at,
  sgm.last_active_at,
  (
    SELECT COUNT(*)
    FROM study_logs
    WHERE group_id = sgm.group_id
      AND user_id = sgm.user_id
      AND study_date > CURRENT_DATE - INTERVAL '30 days'
  ) AS study_sessions_last_30_days
FROM study_group_members sgm
JOIN study_groups sg ON sgm.group_id = sg.id
JOIN users u ON sgm.user_id = u.id
WHERE sgm.status = 'active';

-- View: Upcoming Sessions
CREATE OR REPLACE VIEW upcoming_study_sessions AS
SELECT
  ss.*,
  sg.name AS group_name,
  sg.avatar_url AS group_avatar,
  u.full_name AS organizer_name,
  COUNT(sa.id) FILTER (WHERE sa.rsvp_status = 'accepted') AS confirmed_attendees
FROM study_sessions ss
JOIN study_groups sg ON ss.group_id = sg.id
LEFT JOIN users u ON ss.organized_by = u.id
LEFT JOIN session_attendance sa ON ss.id = sa.session_id
WHERE ss.status = 'scheduled'
  AND ss.scheduled_start_time > NOW()
GROUP BY ss.id, sg.name, sg.avatar_url, u.full_name
ORDER BY ss.scheduled_start_time ASC;

-- ========================================
-- 12. FUNCTIONS
-- ========================================

-- Function: Add member to group
CREATE OR REPLACE FUNCTION add_study_group_member(
  p_group_id UUID,
  p_user_id UUID,
  p_role VARCHAR DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_members INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get group capacity
  SELECT max_members, current_member_count
  INTO v_max_members, v_current_count
  FROM study_groups
  WHERE id = p_group_id;

  -- Check if group is full
  IF v_current_count >= v_max_members THEN
    RETURN FALSE;
  END IF;

  -- Add member
  INSERT INTO study_group_members (group_id, user_id, role, status)
  VALUES (p_group_id, p_user_id, p_role, 'active')
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET status = 'active', role = p_role, updated_at = NOW();

  -- Update member count
  UPDATE study_groups
  SET current_member_count = current_member_count + 1,
      updated_at = NOW()
  WHERE id = p_group_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Aggregate group analytics
CREATE OR REPLACE FUNCTION aggregate_study_group_analytics(
  p_group_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO study_group_analytics (
    group_id, date, active_members, new_members, total_members,
    sessions_held, avg_session_attendance, resources_shared,
    notes_created, tasks_completed, total_study_hours,
    avg_study_hours_per_member
  )
  SELECT
    p_group_id,
    p_date,
    COUNT(DISTINCT sgm.user_id) FILTER (WHERE sgm.last_active_at::DATE = p_date) AS active_members,
    COUNT(DISTINCT sgm.user_id) FILTER (WHERE sgm.joined_at::DATE = p_date) AS new_members,
    COUNT(DISTINCT sgm.user_id) FILTER (WHERE sgm.status = 'active') AS total_members,
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.actual_start_time::DATE = p_date AND ss.status = 'completed') AS sessions_held,
    COALESCE(AVG(ss.actual_attendees) FILTER (WHERE ss.actual_start_time::DATE = p_date), 0) AS avg_session_attendance,
    COUNT(DISTINCT sgr.id) FILTER (WHERE sgr.uploaded_at::DATE = p_date) AS resources_shared,
    COUNT(DISTINCT cn.id) FILTER (WHERE cn.created_at::DATE = p_date) AS notes_created,
    COUNT(DISTINCT gt.id) FILTER (WHERE gt.completed_at::DATE = p_date AND gt.status = 'completed') AS tasks_completed,
    COALESCE(SUM(sl.duration_minutes) FILTER (WHERE sl.study_date = p_date) / 60.0, 0) AS total_study_hours,
    COALESCE(
      (SUM(sl.duration_minutes) FILTER (WHERE sl.study_date = p_date) / 60.0) /
      NULLIF(COUNT(DISTINCT sgm.user_id) FILTER (WHERE sgm.status = 'active'), 0),
      0
    ) AS avg_study_hours_per_member
  FROM study_group_members sgm
  LEFT JOIN study_sessions ss ON sgm.group_id = ss.group_id
  LEFT JOIN study_group_resources sgr ON sgm.group_id = sgr.group_id
  LEFT JOIN collaborative_notes cn ON sgm.group_id = cn.group_id
  LEFT JOIN group_tasks gt ON sgm.group_id = gt.group_id
  LEFT JOIN study_logs sl ON sgm.group_id = sl.group_id
  WHERE sgm.group_id = p_group_id
  ON CONFLICT (group_id, date)
  DO UPDATE SET
    active_members = EXCLUDED.active_members,
    new_members = EXCLUDED.new_members,
    total_members = EXCLUDED.total_members,
    sessions_held = EXCLUDED.sessions_held,
    avg_session_attendance = EXCLUDED.avg_session_attendance,
    resources_shared = EXCLUDED.resources_shared,
    notes_created = EXCLUDED.notes_created,
    tasks_completed = EXCLUDED.tasks_completed,
    total_study_hours = EXCLUDED.total_study_hours,
    avg_study_hours_per_member = EXCLUDED.avg_study_hours_per_member;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 13. TRIGGERS
-- ========================================

-- Trigger: Update resource count on upload
CREATE OR REPLACE FUNCTION update_group_resource_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE study_groups
  SET total_resources = total_resources + 1,
      updated_at = NOW()
  WHERE id = NEW.group_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_count
AFTER INSERT ON study_group_resources
FOR EACH ROW
EXECUTE FUNCTION update_group_resource_count();

-- Trigger: Update session count on completion
CREATE OR REPLACE FUNCTION update_group_session_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE study_groups
    SET total_sessions = total_sessions + 1,
        updated_at = NOW()
    WHERE id = NEW.group_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_count
AFTER UPDATE ON study_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_group_session_count();

COMMENT ON SCHEMA public IS 'Study Groups - Collaborative learning and peer support system';
