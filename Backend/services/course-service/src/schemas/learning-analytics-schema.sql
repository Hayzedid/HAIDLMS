-- ============================================================================
-- LEARNING ANALYTICS SCHEMA
-- ============================================================================
-- Comprehensive learning analytics tracking user behavior, performance,
-- skill mastery, and learning patterns

-- ============================================================================
-- LEARNING SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session Info
  session_start TIMESTAMP NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP,
  duration_minutes INTEGER,

  -- Session Context
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  platform VARCHAR(50), -- 'web', 'ios', 'android'
  ip_address INET,

  -- Session Metrics
  pages_viewed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  assessments_taken INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,

  -- Engagement
  engagement_score NUMERIC(5,2),
  focus_time_minutes INTEGER DEFAULT 0, -- time actively engaged

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id, session_start DESC);
CREATE INDEX idx_learning_sessions_date ON learning_sessions(session_start DESC);
CREATE INDEX idx_learning_sessions_device ON learning_sessions(device_type);

-- ============================================================================
-- SESSION ACTIVITIES
-- ============================================================================

CREATE TYPE activity_action AS ENUM (
  'view',
  'start',
  'pause',
  'resume',
  'complete',
  'skip',
  'rewatch',
  'download',
  'bookmark',
  'note',
  'question',
  'submit'
);

CREATE TABLE IF NOT EXISTS session_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity Details
  activity_action activity_action NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'lesson', 'video', 'assessment', 'quiz', etc.
  content_id UUID NOT NULL,
  content_title VARCHAR(500),

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Context
  progress_percentage INTEGER,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_activities_session ON session_activities(session_id);
CREATE INDEX idx_session_activities_user ON session_activities(user_id, created_at DESC);
CREATE INDEX idx_session_activities_content ON session_activities(content_type, content_id);
CREATE INDEX idx_session_activities_action ON session_activities(activity_action);

-- ============================================================================
-- LEARNING METRICS (Daily Aggregation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Time Metrics
  total_time_minutes INTEGER DEFAULT 0,
  active_time_minutes INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  avg_session_duration_minutes INTEGER DEFAULT 0,

  -- Activity Metrics
  lessons_started INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  assessments_attempted INTEGER DEFAULT 0,
  assessments_passed INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,

  -- Performance Metrics
  avg_assessment_score NUMERIC(5,2),
  avg_quiz_score NUMERIC(5,2),
  first_attempt_pass_rate NUMERIC(5,2),

  -- Engagement Metrics
  interactions_count INTEGER DEFAULT 0,
  forum_posts INTEGER DEFAULT 0,
  forum_replies INTEGER DEFAULT 0,
  peer_reviews_given INTEGER DEFAULT 0,

  -- Learning Velocity
  completion_velocity NUMERIC(10,2), -- content items per day
  learning_momentum NUMERIC(5,2), -- trending up/down indicator

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_learning_metrics_user ON learning_metrics(user_id, date DESC);
CREATE INDEX idx_learning_metrics_date ON learning_metrics(date DESC);
CREATE INDEX idx_learning_metrics_velocity ON learning_metrics(completion_velocity DESC);

-- ============================================================================
-- CONTENT INTERACTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,

  -- Interaction Metrics
  view_count INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,

  -- Engagement Indicators
  last_viewed_at TIMESTAMP,
  first_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  bookmark_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Performance
  attempts_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),
  best_score NUMERIC(5,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX idx_content_interactions_content ON content_interactions(content_type, content_id);
CREATE INDEX idx_content_interactions_time ON content_interactions(total_time_spent_seconds DESC);

-- ============================================================================
-- SKILL MASTERY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name VARCHAR(200) NOT NULL UNIQUE,
  skill_category VARCHAR(100),
  description TEXT,
  parent_skill_id UUID REFERENCES skills(id),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(skill_category);
CREATE INDEX idx_skills_parent ON skills(parent_skill_id);

CREATE TABLE IF NOT EXISTS user_skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

  -- Mastery Level
  mastery_level VARCHAR(50) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'expert'
  mastery_percentage NUMERIC(5,2) DEFAULT 0,
  confidence_score NUMERIC(5,2) DEFAULT 0,

  -- Evidence
  practice_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Progression
  level_achieved_at TIMESTAMP,
  last_practiced_at TIMESTAMP,
  next_recommended_practice TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skill_mastery_user ON user_skill_mastery(user_id);
CREATE INDEX idx_user_skill_mastery_skill ON user_skill_mastery(skill_id);
CREATE INDEX idx_user_skill_mastery_level ON user_skill_mastery(mastery_level);

-- ============================================================================
-- LEARNING VELOCITY & MOMENTUM
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_velocity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  week_start_date DATE NOT NULL,

  -- Velocity Metrics
  lessons_per_day NUMERIC(10,2) DEFAULT 0,
  hours_per_week NUMERIC(10,2) DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,

  -- Momentum Indicators
  velocity_trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing'
  momentum_score NUMERIC(5,2) DEFAULT 0,
  consistency_score NUMERIC(5,2) DEFAULT 0,

  -- Predictions
  predicted_completion_date DATE,
  predicted_next_milestone_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_learning_velocity_user ON learning_velocity(user_id, week_start_date DESC);
CREATE INDEX idx_learning_velocity_trend ON learning_velocity(velocity_trend);

-- ============================================================================
-- PERFORMANCE TRENDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Performance Scores
  avg_score NUMERIC(5,2),
  assessment_accuracy NUMERIC(5,2),
  quiz_accuracy NUMERIC(5,2),

  -- Trend Analysis
  score_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
  percentile_rank NUMERIC(5,2),

  -- Strengths & Weaknesses
  strong_topics JSONB, -- array of topic names
  weak_topics JSONB, -- array of topic names

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, course_id, date)
);

CREATE INDEX idx_performance_trends_user ON performance_trends(user_id, date DESC);
CREATE INDEX idx_performance_trends_course ON performance_trends(course_id, date DESC);
CREATE INDEX idx_performance_trends_trend ON performance_trends(score_trend);

-- ============================================================================
-- LEARNING GOALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Goal Details
  goal_title VARCHAR(300) NOT NULL,
  goal_description TEXT,
  goal_type VARCHAR(50), -- 'course_completion', 'skill_mastery', 'certification', 'time_based', 'custom'

  -- Target
  target_value NUMERIC(10,2),
  target_unit VARCHAR(50), -- 'courses', 'hours', 'lessons', 'skills', etc.
  target_date DATE,

  -- Progress
  current_value NUMERIC(10,2) DEFAULT 0,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP,

  -- Tracking
  last_updated_at TIMESTAMP DEFAULT NOW(),
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_goals_user ON learning_goals(user_id, created_at DESC);
CREATE INDEX idx_learning_goals_type ON learning_goals(goal_type);
CREATE INDEX idx_learning_goals_achieved ON learning_goals(is_achieved);
CREATE INDEX idx_learning_goals_target_date ON learning_goals(target_date);

-- ============================================================================
-- TIME TRACKING (Granular)
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,

  -- Time Details
  start_time TIMESTAMP NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,

  -- Context
  is_active BOOLEAN DEFAULT true, -- was user actively engaged?
  pause_count INTEGER DEFAULT 0,
  completion_percentage INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_time_tracking_user ON time_tracking(user_id, start_time DESC);
CREATE INDEX idx_time_tracking_content ON time_tracking(content_type, content_id);
CREATE INDEX idx_time_tracking_active ON time_tracking(is_active);

-- ============================================================================
-- LEARNING PATTERNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Behavioral Patterns
  preferred_learning_time VARCHAR(50), -- 'morning', 'afternoon', 'evening', 'night'
  avg_session_duration_minutes INTEGER,
  preferred_content_type VARCHAR(50), -- 'video', 'reading', 'interactive', 'hands-on'
  learning_style VARCHAR(50), -- 'visual', 'auditory', 'kinesthetic', 'mixed'

  -- Engagement Patterns
  peak_productivity_day VARCHAR(20), -- 'monday', 'tuesday', etc.
  consistency_rating NUMERIC(5,2),
  dropout_risk_score NUMERIC(5,2),

  -- Social Patterns
  collaboration_preference VARCHAR(50), -- 'solo', 'peer', 'group', 'mixed'
  help_seeking_frequency VARCHAR(50), -- 'frequent', 'occasional', 'rare', 'never'

  -- Analysis Period
  analysis_start_date DATE,
  analysis_end_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_learning_patterns_user ON learning_patterns(user_id);
CREATE INDEX idx_learning_patterns_dropout_risk ON learning_patterns(dropout_risk_score DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Start a learning session
CREATE OR REPLACE FUNCTION start_learning_session(
  p_user_id UUID,
  p_device_type VARCHAR DEFAULT NULL,
  p_browser VARCHAR DEFAULT NULL,
  p_platform VARCHAR DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO learning_sessions (
    user_id, device_type, browser, platform, ip_address
  )
  VALUES (
    p_user_id, p_device_type, p_browser, p_platform, p_ip_address
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- End a learning session
CREATE OR REPLACE FUNCTION end_learning_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE learning_sessions SET
    session_end = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - session_start)) / 60
  WHERE id = p_session_id AND session_end IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Log session activity
CREATE OR REPLACE FUNCTION log_session_activity(
  p_session_id UUID,
  p_user_id UUID,
  p_activity_action activity_action,
  p_content_type VARCHAR,
  p_content_id UUID,
  p_content_title VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO session_activities (
    session_id, user_id, activity_action, content_type,
    content_id, content_title, metadata
  )
  VALUES (
    p_session_id, p_user_id, p_activity_action, p_content_type,
    p_content_id, p_content_title, p_metadata
  )
  RETURNING id INTO v_activity_id;

  -- Update session metrics
  UPDATE learning_sessions SET
    interactions_count = interactions_count + 1
  WHERE id = p_session_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Update daily learning metrics
CREATE OR REPLACE FUNCTION update_learning_metrics(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_total_time INTEGER;
  v_session_count INTEGER;
  v_lessons_completed INTEGER;
  v_assessments_attempted INTEGER;
  v_avg_score NUMERIC;
BEGIN
  -- Calculate metrics for the day
  SELECT
    COALESCE(SUM(duration_minutes), 0),
    COUNT(*)
  INTO v_total_time, v_session_count
  FROM learning_sessions
  WHERE user_id = p_user_id
    AND DATE(session_start) = p_date;

  -- Upsert metrics
  INSERT INTO learning_metrics (
    user_id, date, total_time_minutes, session_count,
    avg_session_duration_minutes
  )
  VALUES (
    p_user_id, p_date, v_total_time, v_session_count,
    CASE WHEN v_session_count > 0 THEN v_total_time / v_session_count ELSE 0 END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_time_minutes = v_total_time,
    session_count = v_session_count,
    avg_session_duration_minutes = CASE
      WHEN v_session_count > 0 THEN v_total_time / v_session_count
      ELSE 0
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Update skill mastery
CREATE OR REPLACE FUNCTION update_skill_mastery(
  p_user_id UUID,
  p_skill_id UUID,
  p_success BOOLEAN,
  p_confidence_delta NUMERIC DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_current_mastery NUMERIC;
  v_practice_count INTEGER;
  v_success_count INTEGER;
  v_new_mastery NUMERIC;
  v_new_level VARCHAR;
BEGIN
  -- Get current mastery
  SELECT mastery_percentage, practice_count, success_count
  INTO v_current_mastery, v_practice_count, v_success_count
  FROM user_skill_mastery
  WHERE user_id = p_user_id AND skill_id = p_skill_id;

  -- Initialize if not exists
  IF NOT FOUND THEN
    INSERT INTO user_skill_mastery (user_id, skill_id, practice_count, success_count)
    VALUES (p_user_id, p_skill_id, 1, CASE WHEN p_success THEN 1 ELSE 0 END);
    v_current_mastery := CASE WHEN p_success THEN 10 ELSE 0 END;
    v_practice_count := 1;
    v_success_count := CASE WHEN p_success THEN 1 ELSE 0 END;
  END IF;

  -- Calculate new mastery
  v_practice_count := v_practice_count + 1;
  v_success_count := v_success_count + CASE WHEN p_success THEN 1 ELSE 0 END;

  v_new_mastery := LEAST(100, GREATEST(0,
    (v_success_count::NUMERIC / v_practice_count * 100 * 0.7) + -- 70% weight on success rate
    (p_confidence_delta * 0.3) + -- 30% weight on confidence
    v_current_mastery * 0.1 -- 10% smoothing from previous
  ));

  -- Determine level
  v_new_level := CASE
    WHEN v_new_mastery >= 90 THEN 'expert'
    WHEN v_new_mastery >= 70 THEN 'advanced'
    WHEN v_new_mastery >= 40 THEN 'intermediate'
    ELSE 'beginner'
  END;

  -- Update mastery
  UPDATE user_skill_mastery SET
    mastery_percentage = v_new_mastery,
    mastery_level = v_new_level,
    confidence_score = LEAST(100, confidence_score + p_confidence_delta),
    practice_count = v_practice_count,
    success_count = v_success_count,
    failure_count = v_practice_count - v_success_count,
    last_practiced_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND skill_id = p_skill_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate learning velocity
CREATE OR REPLACE FUNCTION calculate_learning_velocity(
  p_user_id UUID,
  p_week_start DATE
) RETURNS VOID AS $$
DECLARE
  v_lessons_completed INTEGER;
  v_total_hours NUMERIC;
  v_days_active INTEGER;
  v_lessons_per_day NUMERIC;
  v_prev_week_lessons INTEGER;
  v_trend VARCHAR;
BEGIN
  -- Get current week metrics
  SELECT
    COUNT(DISTINCT lp.lesson_id),
    COALESCE(SUM(lm.total_time_minutes), 0) / 60.0,
    COUNT(DISTINCT lm.date)
  INTO v_lessons_completed, v_total_hours, v_days_active
  FROM learning_metrics lm
  LEFT JOIN lesson_progress lp ON lp.user_id = lm.user_id
    AND lp.status = 'completed'
    AND DATE(lp.completed_at) BETWEEN p_week_start AND p_week_start + INTERVAL '6 days'
  WHERE lm.user_id = p_user_id
    AND lm.date BETWEEN p_week_start AND p_week_start + INTERVAL '6 days';

  v_lessons_per_day := CASE WHEN v_days_active > 0
    THEN v_lessons_completed::NUMERIC / v_days_active
    ELSE 0
  END;

  -- Get previous week for trend
  SELECT COUNT(DISTINCT lp.lesson_id)
  INTO v_prev_week_lessons
  FROM lesson_progress lp
  WHERE lp.user_id = p_user_id
    AND lp.status = 'completed'
    AND DATE(lp.completed_at) BETWEEN p_week_start - INTERVAL '7 days' AND p_week_start - INTERVAL '1 day';

  -- Determine trend
  v_trend := CASE
    WHEN v_lessons_completed > v_prev_week_lessons * 1.1 THEN 'increasing'
    WHEN v_lessons_completed < v_prev_week_lessons * 0.9 THEN 'decreasing'
    ELSE 'stable'
  END;

  -- Upsert velocity
  INSERT INTO learning_velocity (
    user_id, week_start_date, lessons_per_day, hours_per_week, velocity_trend
  )
  VALUES (
    p_user_id, p_week_start, v_lessons_per_day, v_total_hours, v_trend
  )
  ON CONFLICT (user_id, week_start_date) DO UPDATE SET
    lessons_per_day = v_lessons_per_day,
    hours_per_week = v_total_hours,
    velocity_trend = v_trend,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User learning summary
CREATE OR REPLACE VIEW user_learning_summary AS
SELECT
  u.id as user_id,
  u.full_name,
  u.email,
  COUNT(DISTINCT ls.id) as total_sessions,
  COALESCE(SUM(ls.duration_minutes), 0) as total_time_minutes,
  COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.status = 'completed') as lessons_completed,
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'completed') as assessments_completed,
  AVG(aa.score) FILTER (WHERE aa.status = 'completed') as avg_assessment_score,
  MAX(ls.session_start) as last_active_at
FROM users u
LEFT JOIN learning_sessions ls ON u.id = ls.user_id
LEFT JOIN lesson_progress lp ON u.id = lp.user_id
LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
GROUP BY u.id, u.full_name, u.email;

-- Active learners (active in last 7 days)
CREATE OR REPLACE VIEW active_learners AS
SELECT
  user_id,
  COUNT(*) as session_count,
  SUM(duration_minutes) as total_minutes,
  AVG(engagement_score) as avg_engagement,
  MAX(session_start) as last_session
FROM learning_sessions
WHERE session_start >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_minutes DESC;

-- Top performing learners
CREATE OR REPLACE VIEW top_performing_learners AS
SELECT
  u.id as user_id,
  u.full_name,
  AVG(pt.avg_score) as overall_avg_score,
  COUNT(DISTINCT pt.course_id) as courses_enrolled,
  SUM(lm.lessons_completed) as total_lessons_completed,
  AVG(usm.mastery_percentage) as avg_skill_mastery
FROM users u
LEFT JOIN performance_trends pt ON u.id = pt.user_id
LEFT JOIN learning_metrics lm ON u.id = lm.user_id
LEFT JOIN user_skill_mastery usm ON u.id = usm.user_id
GROUP BY u.id, u.full_name
HAVING COUNT(DISTINCT pt.course_id) > 0
ORDER BY overall_avg_score DESC, total_lessons_completed DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE learning_sessions IS 'Tracks individual learning sessions with engagement metrics';
COMMENT ON TABLE session_activities IS 'Detailed log of activities within each learning session';
COMMENT ON TABLE learning_metrics IS 'Daily aggregated learning metrics per user';
COMMENT ON TABLE content_interactions IS 'Tracks user interactions with specific content over time';
COMMENT ON TABLE skills IS 'Defines skills that can be tracked for mastery';
COMMENT ON TABLE user_skill_mastery IS 'Tracks user proficiency in various skills';
COMMENT ON TABLE learning_velocity IS 'Weekly learning velocity and momentum tracking';
COMMENT ON TABLE performance_trends IS 'Performance trends over time with strengths/weaknesses analysis';
COMMENT ON TABLE learning_goals IS 'User-defined learning goals with progress tracking';
COMMENT ON TABLE time_tracking IS 'Granular time tracking for content engagement';
COMMENT ON TABLE learning_patterns IS 'Behavioral learning patterns and preferences per user';
