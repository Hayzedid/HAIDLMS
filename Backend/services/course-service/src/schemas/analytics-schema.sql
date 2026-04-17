-- Advanced Analytics Schema
-- Track detailed metrics for courses, students, and engagement

-- ========================================
-- 1. COURSE ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS course_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Date Range
  date DATE NOT NULL,

  -- Enrollment Metrics
  total_enrollments INTEGER DEFAULT 0,
  new_enrollments INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0, -- Students active on this date
  completed_students INTEGER DEFAULT 0,

  -- Engagement Metrics
  total_lessons_viewed INTEGER DEFAULT 0,
  total_videos_watched INTEGER DEFAULT 0,
  total_assessments_attempted INTEGER DEFAULT 0,
  total_forum_posts INTEGER DEFAULT 0,
  avg_time_spent_minutes DECIMAL(10,2) DEFAULT 0,

  -- Completion Metrics
  avg_progress_percentage DECIMAL(5,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0, -- % of enrolled who completed

  -- Assessment Metrics
  avg_assessment_score DECIMAL(5,2) DEFAULT 0,
  pass_rate DECIMAL(5,2) DEFAULT 0,

  -- Engagement Rates
  video_completion_rate DECIMAL(5,2) DEFAULT 0,
  assignment_submission_rate DECIMAL(5,2) DEFAULT 0,
  forum_participation_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, date)
);

CREATE INDEX idx_course_analytics_course ON course_analytics(course_id);
CREATE INDEX idx_course_analytics_date ON course_analytics(date DESC);

-- ========================================
-- 2. STUDENT ACTIVITY TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS student_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type VARCHAR(50) NOT NULL, -- 'lesson_view', 'video_watch', 'assessment_submit', etc.
  activity_target VARCHAR(100), -- ID of lesson, video, assessment, etc.

  -- Session Info
  session_id VARCHAR(255),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,

  -- Time Tracking
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,

  -- Additional Data
  metadata JSONB, -- Flexible field for activity-specific data

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_activities_user ON student_activities(user_id);
CREATE INDEX idx_student_activities_course ON student_activities(course_id);
CREATE INDEX idx_student_activities_type ON student_activities(activity_type);
CREATE INDEX idx_student_activities_date ON student_activities(created_at DESC);
CREATE INDEX idx_student_activities_session ON student_activities(session_id);

-- ========================================
-- 3. LESSON ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS lesson_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Viewing Metrics
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_time_spent_seconds INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,

  -- Video Metrics (if video lesson)
  avg_video_completion DECIMAL(5,2) DEFAULT 0,
  avg_watch_time_seconds INTEGER DEFAULT 0,
  rewatch_rate DECIMAL(5,2) DEFAULT 0,

  -- Engagement
  notes_taken INTEGER DEFAULT 0,
  bookmarks_created INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(lesson_id, date)
);

CREATE INDEX idx_lesson_analytics_lesson ON lesson_analytics(lesson_id);
CREATE INDEX idx_lesson_analytics_course ON lesson_analytics(course_id);
CREATE INDEX idx_lesson_analytics_date ON lesson_analytics(date DESC);

-- ========================================
-- 4. ASSESSMENT ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS assessment_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Attempt Metrics
  total_attempts INTEGER DEFAULT 0,
  unique_students INTEGER DEFAULT 0,
  first_time_pass_rate DECIMAL(5,2) DEFAULT 0,

  -- Score Metrics
  avg_score DECIMAL(5,2) DEFAULT 0,
  median_score DECIMAL(5,2) DEFAULT 0,
  min_score DECIMAL(5,2) DEFAULT 0,
  max_score DECIMAL(5,2) DEFAULT 0,
  std_deviation DECIMAL(5,2) DEFAULT 0,

  -- Time Metrics
  avg_time_taken_minutes INTEGER DEFAULT 0,
  median_time_taken_minutes INTEGER DEFAULT 0,

  -- Distribution
  score_distribution JSONB, -- {"0-20": 5, "21-40": 10, "41-60": 15, ...}

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(assessment_id, date)
);

CREATE INDEX idx_assessment_analytics_assessment ON assessment_analytics(assessment_id);
CREATE INDEX idx_assessment_analytics_course ON assessment_analytics(course_id);
CREATE INDEX idx_assessment_analytics_date ON assessment_analytics(date DESC);

-- ========================================
-- 5. STUDENT PERFORMANCE SNAPSHOTS
-- ========================================

CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Snapshot Date
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Progress Metrics
  overall_progress DECIMAL(5,2) DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,

  -- Assessment Performance
  assessments_completed INTEGER DEFAULT 0,
  avg_assessment_score DECIMAL(5,2) DEFAULT 0,
  best_assessment_score DECIMAL(5,2) DEFAULT 0,

  -- Time Investment
  total_time_spent_minutes INTEGER DEFAULT 0,
  avg_session_duration_minutes INTEGER DEFAULT 0,
  last_active_at TIMESTAMP,

  -- Engagement
  forum_posts_count INTEGER DEFAULT 0,
  peer_reviews_given INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,

  -- Performance Indicators
  is_at_risk BOOLEAN DEFAULT false, -- Low engagement or poor performance
  risk_factors TEXT[], -- ['low_engagement', 'failing_assessments', 'inactive']
  predicted_completion_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, course_id, snapshot_date)
);

CREATE INDEX idx_student_performance_user ON student_performance(user_id);
CREATE INDEX idx_student_performance_course ON student_performance(course_id);
CREATE INDEX idx_student_performance_date ON student_performance(snapshot_date DESC);
CREATE INDEX idx_student_performance_risk ON student_performance(is_at_risk);

-- ========================================
-- 6. LEARNING PATTERNS
-- ========================================

CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Study Habits
  preferred_study_times TEXT[], -- ['morning', 'afternoon', 'evening', 'night']
  preferred_days TEXT[], -- ['monday', 'tuesday', ...]
  avg_session_length_minutes INTEGER DEFAULT 0,
  sessions_per_week DECIMAL(4,2) DEFAULT 0,

  -- Learning Style
  video_preference DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
  reading_preference DECIMAL(3,2) DEFAULT 0,
  interactive_preference DECIMAL(3,2) DEFAULT 0,
  peer_learning_preference DECIMAL(3,2) DEFAULT 0,

  -- Behavior Patterns
  completion_consistency DECIMAL(3,2) DEFAULT 0, -- How consistently they complete lessons
  pace_rating VARCHAR(20), -- 'fast', 'moderate', 'slow'
  retry_frequency DECIMAL(3,2) DEFAULT 0, -- How often they retry assessments

  -- Calculated Metrics
  engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  persistence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  collaboration_score DECIMAL(5,2) DEFAULT 0, -- 0-100

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_learning_patterns_user ON learning_patterns(user_id);

-- ========================================
-- 7. RETENTION & CHURN TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS retention_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Cohort Definition
  cohort_name VARCHAR(255), -- e.g., "January 2024 Enrollees"
  cohort_start_date DATE NOT NULL,
  cohort_end_date DATE NOT NULL,
  cohort_size INTEGER NOT NULL,

  -- Retention Over Time
  retention_day_7 INTEGER DEFAULT 0, -- Students still active after 7 days
  retention_day_30 INTEGER DEFAULT 0,
  retention_day_60 INTEGER DEFAULT 0,
  retention_day_90 INTEGER DEFAULT 0,

  -- Churn Metrics
  churned_students INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  avg_days_to_churn DECIMAL(8,2) DEFAULT 0,

  -- Completion
  completed_students INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  avg_days_to_complete DECIMAL(8,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retention_metrics_course ON retention_metrics(course_id);
CREATE INDEX idx_retention_metrics_cohort ON retention_metrics(cohort_start_date, cohort_end_date);

-- ========================================
-- 8. VIEWS FOR REPORTING
-- ========================================

-- View: Real-time course dashboard
CREATE OR REPLACE VIEW course_dashboard AS
SELECT
  c.id AS course_id,
  c.title AS course_title,
  COUNT(DISTINCT e.user_id) AS total_students,
  COUNT(DISTINCT CASE WHEN e.completed = true THEN e.user_id END) AS completed_students,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.completed = true THEN e.user_id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT e.user_id), 0) * 100,
    2
  ) AS completion_rate,
  ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress,
  COUNT(DISTINCT CASE WHEN e.last_accessed_at > NOW() - INTERVAL '7 days' THEN e.user_id END) AS active_last_7_days,
  COUNT(DISTINCT CASE WHEN e.last_accessed_at > NOW() - INTERVAL '30 days' THEN e.user_id END) AS active_last_30_days,
  ROUND(AVG(e.final_score)::NUMERIC, 2) AS avg_final_score
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title;

-- View: Student engagement summary
CREATE OR REPLACE VIEW student_engagement_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  COUNT(DISTINCT e.course_id) AS enrolled_courses,
  COUNT(DISTINCT CASE WHEN e.completed = true THEN e.course_id END) AS completed_courses,
  ROUND(AVG(e.progress)::NUMERIC, 2) AS avg_progress,
  COUNT(DISTINCT sa.id) FILTER (WHERE sa.created_at > NOW() - INTERVAL '7 days') AS activities_last_7_days,
  MAX(sa.created_at) AS last_activity_at
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN student_activities sa ON u.id = sa.user_id
GROUP BY u.id, u.full_name, u.email;

-- View: At-risk students
CREATE OR REPLACE VIEW at_risk_students AS
SELECT
  sp.*,
  u.full_name,
  u.email,
  c.title AS course_title
FROM student_performance sp
JOIN users u ON sp.user_id = u.id
JOIN courses c ON sp.course_id = c.id
WHERE sp.is_at_risk = true
  AND sp.snapshot_date = CURRENT_DATE
ORDER BY sp.overall_progress ASC;

-- ========================================
-- 9. FUNCTIONS FOR ANALYTICS
-- ========================================

-- Function: Calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_activities INTEGER;
  v_forum_posts INTEGER;
  v_assessments INTEGER;
  v_progress DECIMAL;
BEGIN
  -- Activity count (max 30 points)
  SELECT COUNT(*) INTO v_activities
  FROM student_activities
  WHERE user_id = p_user_id
    AND course_id = p_course_id
    AND created_at > NOW() - INTERVAL '30 days';

  v_score := v_score + LEAST(v_activities, 30);

  -- Forum participation (max 20 points)
  SELECT COUNT(*) INTO v_forum_posts
  FROM discussion_threads dt
  WHERE dt.author_id = p_user_id
    AND dt.category_id IN (
      SELECT id FROM forum_categories WHERE course_id = p_course_id
    );

  v_score := v_score + LEAST(v_forum_posts * 5, 20);

  -- Assessment completion (max 30 points)
  SELECT COUNT(*) INTO v_assessments
  FROM assessment_submissions asub
  JOIN assessments a ON asub.assessment_id = a.id
  WHERE asub.user_id = p_user_id
    AND a.course_id = p_course_id;

  v_score := v_score + LEAST(v_assessments * 10, 30);

  -- Progress (max 20 points)
  SELECT progress INTO v_progress
  FROM enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id;

  v_score := v_score + (COALESCE(v_progress, 0) * 0.2);

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function: Detect at-risk students
CREATE OR REPLACE FUNCTION detect_at_risk_students(p_course_id UUID)
RETURNS TABLE(
  user_id UUID,
  full_name VARCHAR,
  email VARCHAR,
  risk_factors TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    u.full_name,
    u.email,
    ARRAY_AGG(DISTINCT
      CASE
        WHEN e.progress < 20 AND e.enrolled_at < NOW() - INTERVAL '14 days' THEN 'low_progress'
        WHEN e.last_accessed_at < NOW() - INTERVAL '7 days' THEN 'inactive'
        WHEN e.final_score < 50 THEN 'failing_assessments'
        WHEN (
          SELECT COUNT(*)
          FROM student_activities sa
          WHERE sa.user_id = e.user_id
            AND sa.course_id = e.course_id
            AND sa.created_at > NOW() - INTERVAL '14 days'
        ) < 5 THEN 'low_engagement'
      END
    ) FILTER (WHERE
      (e.progress < 20 AND e.enrolled_at < NOW() - INTERVAL '14 days') OR
      e.last_accessed_at < NOW() - INTERVAL '7 days' OR
      e.final_score < 50 OR
      (
        SELECT COUNT(*)
        FROM student_activities sa
        WHERE sa.user_id = e.user_id
          AND sa.course_id = e.course_id
          AND sa.created_at > NOW() - INTERVAL '14 days'
      ) < 5
    ) AS risk_factors
  FROM enrollments e
  JOIN users u ON e.user_id = u.id
  WHERE e.course_id = p_course_id
    AND e.completed = false
  GROUP BY e.user_id, u.full_name, u.email
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Get course performance trend
CREATE OR REPLACE FUNCTION get_course_performance_trend(
  p_course_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  active_students INTEGER,
  avg_progress DECIMAL,
  completion_rate DECIMAL,
  avg_assessment_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.date,
    ca.active_students,
    ca.avg_progress_percentage,
    ca.completion_rate,
    ca.avg_assessment_score
  FROM course_analytics ca
  WHERE ca.course_id = p_course_id
    AND ca.date >= CURRENT_DATE - p_days
  ORDER BY ca.date ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Advanced Analytics - Comprehensive tracking and insights for learning metrics';
