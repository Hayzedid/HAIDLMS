-- Analytics Service Database Schema
-- Track user behavior, learning progress, and platform metrics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE event_type AS ENUM (
  -- Page Navigation
  'page_view',
  'course_view',
  'lesson_view',

  -- Learning Actions
  'lesson_start',
  'lesson_complete',
  'module_complete',
  'course_enroll',
  'course_complete',

  -- Assessment Events
  'assessment_start',
  'assessment_submit',
  'assessment_complete',
  'quiz_attempt',

  -- Content Interaction
  'video_play',
  'video_pause',
  'video_complete',
  'code_run',
  'code_submit',

  -- IDE Events
  'ide_open',
  'ide_save',
  'ide_execute',

  -- Social Events
  'comment_create',
  'comment_reply',
  'discussion_view',

  -- Search and Discovery
  'search',
  'filter_apply',
  'course_preview',

  -- Account Events
  'login',
  'logout',
  'profile_update',
  'settings_change',

  -- Certification
  'certificate_view',
  'certificate_download',

  -- Other
  'error',
  'feedback_submit'
);

CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE time_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Raw event tracking for all user actions

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  event_type event_type NOT NULL,

  -- Context
  course_id UUID,
  lesson_id UUID,
  module_id UUID,
  assessment_id UUID,

  -- Event metadata
  properties JSONB DEFAULT '{}',

  -- Session tracking
  session_id UUID,

  -- Technical details
  ip_address INET,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,

  -- Performance metrics
  page_load_time INTEGER, -- milliseconds

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_course_id ON events(course_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_user_created ON events(user_id, created_at DESC);

-- GIN index for JSONB properties
CREATE INDEX idx_events_properties ON events USING GIN(properties);

-- ============================================================================
-- LEARNING SESSIONS
-- ============================================================================
-- Track continuous learning sessions with time spent

CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- Session details
  status session_status DEFAULT 'active',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER, -- computed on end

  -- Context
  course_id UUID,
  lesson_id UUID,

  -- Activity metrics
  events_count INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,

  -- Engagement score (0-100)
  engagement_score DECIMAL(5,2),

  -- Technical details
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_status ON learning_sessions(status);
CREATE INDEX idx_sessions_course_id ON learning_sessions(course_id);
CREATE INDEX idx_sessions_start_time ON learning_sessions(start_time DESC);
CREATE INDEX idx_sessions_user_course ON learning_sessions(user_id, course_id);

-- ============================================================================
-- USER ANALYTICS
-- ============================================================================
-- Aggregated metrics per user (updated via triggers/cron)

CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,

  -- Time metrics
  total_time_minutes INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2) DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Activity counts
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  courses_enrolled INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,

  -- Performance metrics
  avg_assessment_score DECIMAL(5,2),
  completion_rate DECIMAL(5,2) DEFAULT 0, -- % of enrolled courses completed

  -- Engagement metrics
  engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100 based on activity
  streak_days INTEGER DEFAULT 0, -- consecutive days active
  longest_streak_days INTEGER DEFAULT 0,

  -- Learning velocity
  avg_lessons_per_week DECIMAL(10,2) DEFAULT 0,
  avg_hours_per_week DECIMAL(10,2) DEFAULT 0,

  -- Health score (0-100)
  health_score DECIMAL(5,2) DEFAULT 50,

  -- Trend indicators (-1: declining, 0: stable, 1: improving)
  engagement_trend SMALLINT DEFAULT 0,
  performance_trend SMALLINT DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_health_score ON user_analytics(health_score DESC);
CREATE INDEX idx_user_analytics_engagement ON user_analytics(engagement_score DESC);

-- ============================================================================
-- COURSE ANALYTICS
-- ============================================================================
-- Aggregated metrics per course

CREATE TABLE course_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID UNIQUE NOT NULL,

  -- Enrollment metrics
  total_enrollments INTEGER DEFAULT 0,
  active_learners INTEGER DEFAULT 0, -- enrolled and active in last 30 days
  completed_count INTEGER DEFAULT 0,

  -- Completion metrics
  avg_completion_time_days DECIMAL(10,2),
  completion_rate DECIMAL(5,2) DEFAULT 0, -- % who complete

  -- Engagement metrics
  avg_engagement_score DECIMAL(5,2) DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  avg_time_per_student_minutes DECIMAL(10,2) DEFAULT 0,

  -- Performance metrics
  avg_assessment_score DECIMAL(5,2),
  pass_rate DECIMAL(5,2),

  -- Drop-off analysis
  dropout_rate DECIMAL(5,2) DEFAULT 0,
  avg_dropout_point DECIMAL(5,2), -- % through course where most drop off

  -- Popular content
  most_viewed_lesson_id UUID,
  most_completed_lesson_id UUID,

  -- Ratings
  avg_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,

  -- Revenue (if applicable)
  total_revenue DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_course_analytics_course_id ON course_analytics(course_id);
CREATE INDEX idx_course_analytics_completion_rate ON course_analytics(completion_rate DESC);
CREATE INDEX idx_course_analytics_avg_rating ON course_analytics(avg_rating DESC);

-- ============================================================================
-- USER LEARNING METRICS
-- ============================================================================
-- Detailed learning progress per user per course

CREATE TABLE user_learning_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,

  -- Progress
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER,
  modules_completed INTEGER DEFAULT 0,
  total_modules INTEGER,

  -- Time metrics
  time_spent_minutes INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2) DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,

  -- Assessment performance
  assessments_attempted INTEGER DEFAULT 0,
  assessments_passed INTEGER DEFAULT 0,
  avg_assessment_score DECIMAL(5,2),
  best_assessment_score DECIMAL(5,2),

  -- Engagement
  engagement_score DECIMAL(5,2) DEFAULT 0,
  days_active INTEGER DEFAULT 0,

  -- Velocity
  lessons_per_week DECIMAL(10,2) DEFAULT 0,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,

  -- Prediction
  predicted_success_rate DECIMAL(5,2), -- ML-based prediction
  at_risk BOOLEAN DEFAULT false, -- flagged for intervention

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_user_learning_user_id ON user_learning_metrics(user_id);
CREATE INDEX idx_user_learning_course_id ON user_learning_metrics(course_id);
CREATE INDEX idx_user_learning_at_risk ON user_learning_metrics(at_risk) WHERE at_risk = true;
CREATE INDEX idx_user_learning_progress ON user_learning_metrics(user_id, course_id, progress_percentage);

-- ============================================================================
-- LESSON ANALYTICS
-- ============================================================================
-- Performance metrics per lesson

CREATE TABLE lesson_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID UNIQUE NOT NULL,
  course_id UUID NOT NULL,

  -- Engagement
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,

  -- Time metrics
  avg_time_spent_minutes DECIMAL(10,2) DEFAULT 0,
  median_time_spent_minutes DECIMAL(10,2) DEFAULT 0,

  -- Drop-off
  dropout_count INTEGER DEFAULT 0,
  dropout_rate DECIMAL(5,2) DEFAULT 0,

  -- Video metrics (if applicable)
  avg_video_completion_rate DECIMAL(5,2),
  avg_rewatch_count DECIMAL(5,2),

  -- Difficulty perception
  avg_difficulty_rating DECIMAL(3,2), -- user-reported difficulty

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lesson_analytics_lesson_id ON lesson_analytics(lesson_id);
CREATE INDEX idx_lesson_analytics_course_id ON lesson_analytics(course_id);
CREATE INDEX idx_lesson_analytics_completion_rate ON lesson_analytics(completion_rate DESC);

-- ============================================================================
-- INSTRUCTOR ANALYTICS
-- ============================================================================
-- Aggregated metrics per instructor

CREATE TABLE instructor_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID UNIQUE NOT NULL,

  -- Course metrics
  total_courses INTEGER DEFAULT 0,
  published_courses INTEGER DEFAULT 0,

  -- Student metrics
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,

  -- Performance
  avg_course_rating DECIMAL(3,2),
  avg_completion_rate DECIMAL(5,2),
  avg_student_satisfaction DECIMAL(5,2),

  -- Engagement
  total_student_hours INTEGER DEFAULT 0,

  -- Revenue (if applicable)
  total_revenue DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_instructor_analytics_instructor_id ON instructor_analytics(instructor_id);

-- ============================================================================
-- PLATFORM ANALYTICS
-- ============================================================================
-- Platform-wide metrics (single row, updated regularly)

CREATE TABLE platform_analytics (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- User metrics
  total_users INTEGER DEFAULT 0,
  active_users_daily INTEGER DEFAULT 0,
  active_users_weekly INTEGER DEFAULT 0,
  active_users_monthly INTEGER DEFAULT 0,

  -- Content metrics
  total_courses INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_assessments INTEGER DEFAULT 0,

  -- Engagement
  total_enrollments INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  avg_platform_engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Time
  total_learning_hours INTEGER DEFAULT 0,

  -- Performance
  avg_assessment_score DECIMAL(5,2),
  avg_course_completion_rate DECIMAL(5,2),

  -- Revenue
  total_revenue DECIMAL(15,2) DEFAULT 0,
  mrr DECIMAL(12,2) DEFAULT 0, -- Monthly Recurring Revenue

  -- Growth metrics
  user_growth_rate DECIMAL(5,2), -- % growth vs previous period
  revenue_growth_rate DECIMAL(5,2),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with single row
INSERT INTO platform_analytics (id) VALUES (1);

-- ============================================================================
-- DAILY METRICS SNAPSHOT
-- ============================================================================
-- Historical snapshot of key metrics

CREATE TABLE daily_metrics_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE UNIQUE NOT NULL,

  -- Users
  total_users INTEGER,
  new_users INTEGER,
  active_users INTEGER,

  -- Courses
  total_courses INTEGER,
  new_courses INTEGER,

  -- Engagement
  total_enrollments INTEGER,
  new_enrollments INTEGER,
  completions INTEGER,

  -- Activity
  total_sessions INTEGER,
  total_events INTEGER,
  total_learning_hours INTEGER,

  -- Performance
  avg_engagement_score DECIMAL(5,2),
  avg_health_score DECIMAL(5,2),

  -- Revenue
  daily_revenue DECIMAL(12,2),
  mrr DECIMAL(12,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics_snapshot(snapshot_date DESC);

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Active users in last 30 days with their key metrics
CREATE MATERIALIZED VIEW mv_active_users_30d AS
SELECT
  u.user_id,
  u.total_time_minutes,
  u.engagement_score,
  u.health_score,
  u.courses_enrolled,
  u.courses_completed,
  u.last_active_at,
  COUNT(DISTINCT s.id) as sessions_30d,
  SUM(s.duration_seconds) / 60 as time_30d_minutes
FROM user_analytics u
LEFT JOIN learning_sessions s ON s.user_id = u.user_id
  AND s.start_time >= NOW() - INTERVAL '30 days'
WHERE u.last_active_at >= NOW() - INTERVAL '30 days'
GROUP BY u.user_id, u.total_time_minutes, u.engagement_score, u.health_score,
         u.courses_enrolled, u.courses_completed, u.last_active_at;

CREATE UNIQUE INDEX idx_mv_active_users_user_id ON mv_active_users_30d(user_id);

-- Top performing courses
CREATE MATERIALIZED VIEW mv_top_courses AS
SELECT
  c.course_id,
  c.total_enrollments,
  c.completion_rate,
  c.avg_rating,
  c.avg_engagement_score,
  c.total_revenue
FROM course_analytics c
WHERE c.total_enrollments > 10
ORDER BY c.avg_rating DESC, c.total_enrollments DESC
LIMIT 100;

-- Users at risk (low engagement, not progressing)
CREATE MATERIALIZED VIEW mv_users_at_risk AS
SELECT
  u.user_id,
  u.engagement_score,
  u.health_score,
  u.last_active_at,
  u.courses_enrolled,
  u.courses_completed,
  COUNT(ulm.id) as struggling_courses
FROM user_analytics u
LEFT JOIN user_learning_metrics ulm ON ulm.user_id = u.user_id AND ulm.at_risk = true
WHERE u.health_score < 40 OR u.engagement_score < 30
GROUP BY u.user_id, u.engagement_score, u.health_score, u.last_active_at,
         u.courses_enrolled, u.courses_completed;

CREATE UNIQUE INDEX idx_mv_users_at_risk_user_id ON mv_users_at_risk(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learning_sessions_updated_at
  BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_analytics_updated_at
  BEFORE UPDATE ON course_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_metrics_updated_at
  BEFORE UPDATE ON user_learning_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh materialized views (call via cron job)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_users_30d;
  REFRESH MATERIALIZED VIEW mv_top_courses;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_users_at_risk;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate engagement score based on activity
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_sessions_count INTEGER,
  p_time_minutes INTEGER,
  p_events_count INTEGER,
  p_lessons_completed INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2);
BEGIN
  -- Weighted scoring: sessions (25%), time (25%), events (25%), completions (25%)
  score := (
    LEAST(p_sessions_count * 2, 25) +
    LEAST(p_time_minutes / 10, 25) +
    LEAST(p_events_count / 5, 25) +
    LEAST(p_lessons_completed * 5, 25)
  );

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Calculate health score (engagement + performance + consistency)
CREATE OR REPLACE FUNCTION calculate_health_score(
  p_engagement_score DECIMAL(5,2),
  p_completion_rate DECIMAL(5,2),
  p_streak_days INTEGER,
  p_avg_assessment_score DECIMAL(5,2)
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2);
BEGIN
  -- Weighted: engagement (40%), completion (20%), streak (20%), performance (20%)
  score := (
    COALESCE(p_engagement_score, 0) * 0.4 +
    COALESCE(p_completion_rate, 0) * 0.2 +
    LEAST(p_streak_days * 2, 20) +
    COALESCE(p_avg_assessment_score, 0) * 0.2
  );

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;
