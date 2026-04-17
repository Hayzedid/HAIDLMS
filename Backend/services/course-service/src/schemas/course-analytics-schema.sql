-- ============================================================================
-- COURSE ANALYTICS SCHEMA
-- ============================================================================
-- Course-level analytics including enrollment trends, completion rates,
-- assessment performance, and instructor metrics

-- ============================================================================
-- COURSE METRICS (Daily Aggregation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Enrollment Metrics
  total_enrollments INTEGER DEFAULT 0,
  new_enrollments INTEGER DEFAULT 0,
  active_learners INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,

  -- Engagement Metrics
  avg_time_spent_minutes INTEGER DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  total_assessments_taken INTEGER DEFAULT 0,
  total_forum_posts INTEGER DEFAULT 0,

  -- Performance Metrics
  avg_assessment_score NUMERIC(5,2),
  avg_completion_rate NUMERIC(5,2),
  pass_rate NUMERIC(5,2),

  -- Dropout Metrics
  dropouts INTEGER DEFAULT 0,
  dropout_rate NUMERIC(5,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, date)
);

CREATE INDEX idx_course_metrics_course ON course_metrics(course_id, date DESC);
CREATE INDEX idx_course_metrics_date ON course_metrics(date DESC);

-- ============================================================================
-- ENROLLMENT TRENDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  week_start_date DATE NOT NULL,

  -- Enrollment Counts
  new_enrollments INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  active_enrollments INTEGER DEFAULT 0,
  completed_enrollments INTEGER DEFAULT 0,
  dropped_enrollments INTEGER DEFAULT 0,

  -- Conversion Metrics
  enrollment_conversion_rate NUMERIC(5,2), -- views to enrollments
  completion_conversion_rate NUMERIC(5,2), -- enrollments to completions

  -- Trend Analysis
  enrollment_growth_rate NUMERIC(5,2),
  trend_direction VARCHAR(20), -- 'growing', 'stable', 'declining'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, week_start_date)
);

CREATE INDEX idx_enrollment_trends_course ON enrollment_trends(course_id, week_start_date DESC);
CREATE INDEX idx_enrollment_trends_trend ON enrollment_trends(trend_direction);

-- ============================================================================
-- COURSE COMPLETION ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_completion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Completion Metrics
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_in_progress INTEGER DEFAULT 0,
  total_dropped INTEGER DEFAULT 0,

  completion_rate NUMERIC(5,2),
  avg_time_to_complete_days NUMERIC(10,2),
  median_time_to_complete_days NUMERIC(10,2),

  -- Milestone Completion
  avg_lessons_completed NUMERIC(10,2),
  avg_assessments_completed NUMERIC(10,2),
  avg_modules_completed NUMERIC(10,2),

  -- Last Updated
  last_calculated_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id)
);

CREATE INDEX idx_course_completion_course ON course_completion_analytics(course_id);
CREATE INDEX idx_course_completion_rate ON course_completion_analytics(completion_rate DESC);

-- ============================================================================
-- MODULE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Engagement
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),

  -- Time Metrics
  avg_time_spent_minutes INTEGER DEFAULT 0,
  avg_time_to_complete_days NUMERIC(10,2),

  -- Performance
  avg_assessment_score NUMERIC(5,2),

  -- Dropout Analysis
  dropout_count INTEGER DEFAULT 0,
  dropout_rate NUMERIC(5,2),

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(module_id)
);

CREATE INDEX idx_module_analytics_module ON module_analytics(module_id);
CREATE INDEX idx_module_analytics_course ON module_analytics(course_id);
CREATE INDEX idx_module_analytics_completion ON module_analytics(completion_rate DESC);

-- ============================================================================
-- LESSON ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lesson_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Engagement
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),

  -- Time Metrics
  avg_time_spent_minutes INTEGER DEFAULT 0,
  total_time_spent_hours NUMERIC(10,2),

  -- Video Analytics (if applicable)
  avg_video_completion_rate NUMERIC(5,2),
  rewatch_count INTEGER DEFAULT 0,

  -- Engagement Indicators
  bookmark_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,

  -- Quality Indicators
  avg_rating NUMERIC(3,2),
  difficulty_rating NUMERIC(3,2),

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(lesson_id)
);

CREATE INDEX idx_lesson_analytics_lesson ON lesson_analytics(lesson_id);
CREATE INDEX idx_lesson_analytics_module ON lesson_analytics(module_id);
CREATE INDEX idx_lesson_analytics_course ON lesson_analytics(course_id);
CREATE INDEX idx_lesson_analytics_views ON lesson_analytics(total_views DESC);
CREATE INDEX idx_lesson_analytics_rating ON lesson_analytics(avg_rating DESC);

-- ============================================================================
-- ASSESSMENT ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Attempt Metrics
  total_attempts INTEGER DEFAULT 0,
  unique_takers INTEGER DEFAULT 0,
  avg_attempts_per_user NUMERIC(5,2),

  -- Performance Metrics
  avg_score NUMERIC(5,2),
  median_score NUMERIC(5,2),
  highest_score NUMERIC(5,2),
  lowest_score NUMERIC(5,2),
  pass_rate NUMERIC(5,2),
  first_attempt_pass_rate NUMERIC(5,2),

  -- Time Metrics
  avg_time_spent_minutes INTEGER DEFAULT 0,
  avg_time_to_pass_attempts NUMERIC(5,2),

  -- Question Analysis
  easiest_question_id UUID,
  hardest_question_id UUID,
  most_skipped_question_id UUID,

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(assessment_id)
);

CREATE INDEX idx_assessment_analytics_assessment ON assessment_analytics(assessment_id);
CREATE INDEX idx_assessment_analytics_course ON assessment_analytics(course_id);
CREATE INDEX idx_assessment_analytics_pass_rate ON assessment_analytics(pass_rate DESC);

-- ============================================================================
-- DROPOUT ANALYSIS
-- ============================================================================

CREATE TYPE dropout_reason AS ENUM (
  'too_difficult',
  'time_constraints',
  'not_relevant',
  'technical_issues',
  'poor_quality',
  'completed_elsewhere',
  'lost_interest',
  'unknown'
);

CREATE TABLE IF NOT EXISTS course_dropouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,

  -- Dropout Details
  dropped_at TIMESTAMP DEFAULT NOW(),
  progress_percentage INTEGER,
  last_lesson_id UUID,
  last_module_id UUID,

  -- Analysis
  days_since_enrollment INTEGER,
  lessons_completed INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,
  dropout_reason dropout_reason DEFAULT 'unknown',
  feedback TEXT,

  -- Predictive Indicators
  last_activity_date DATE,
  days_inactive INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_course_dropouts_course ON course_dropouts(course_id);
CREATE INDEX idx_course_dropouts_user ON course_dropouts(user_id);
CREATE INDEX idx_course_dropouts_reason ON course_dropouts(dropout_reason);
CREATE INDEX idx_course_dropouts_progress ON course_dropouts(progress_percentage);

-- ============================================================================
-- INSTRUCTOR ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS instructor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Course Metrics
  total_courses INTEGER DEFAULT 0,
  active_courses INTEGER DEFAULT 0,
  published_courses INTEGER DEFAULT 0,

  -- Student Metrics
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  completed_students INTEGER DEFAULT 0,

  -- Performance Metrics
  avg_course_rating NUMERIC(3,2),
  avg_completion_rate NUMERIC(5,2),
  avg_student_satisfaction NUMERIC(5,2),

  -- Engagement Metrics
  total_forum_responses INTEGER DEFAULT 0,
  avg_response_time_hours NUMERIC(10,2),
  total_feedback_given INTEGER DEFAULT 0,

  -- Revenue (if applicable)
  total_revenue NUMERIC(12,2) DEFAULT 0,
  avg_revenue_per_course NUMERIC(10,2),

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(instructor_id)
);

CREATE INDEX idx_instructor_analytics_instructor ON instructor_analytics(instructor_id);
CREATE INDEX idx_instructor_analytics_rating ON instructor_analytics(avg_course_rating DESC);
CREATE INDEX idx_instructor_analytics_students ON instructor_analytics(total_students DESC);

-- ============================================================================
-- CONTENT EFFECTIVENESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Engagement Score
  engagement_score NUMERIC(5,2) DEFAULT 0,
  completion_score NUMERIC(5,2) DEFAULT 0,
  satisfaction_score NUMERIC(5,2) DEFAULT 0,

  -- Overall Effectiveness
  effectiveness_rating VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
  overall_score NUMERIC(5,2) DEFAULT 0,

  -- Recommendations
  needs_improvement BOOLEAN DEFAULT false,
  improvement_suggestions JSONB,

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(content_type, content_id)
);

CREATE INDEX idx_content_effectiveness_content ON content_effectiveness(content_type, content_id);
CREATE INDEX idx_content_effectiveness_course ON content_effectiveness(course_id);
CREATE INDEX idx_content_effectiveness_rating ON content_effectiveness(effectiveness_rating);
CREATE INDEX idx_content_effectiveness_improvement ON content_effectiveness(needs_improvement) WHERE needs_improvement = true;

-- ============================================================================
-- COHORT ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  cohort_name VARCHAR(200) NOT NULL,
  cohort_start_date DATE NOT NULL,
  cohort_end_date DATE NOT NULL,

  -- Cohort Metrics
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_dropped INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),

  -- Performance
  avg_final_score NUMERIC(5,2),
  avg_time_to_complete_days NUMERIC(10,2),

  -- Engagement
  avg_engagement_score NUMERIC(5,2),
  forum_participation_rate NUMERIC(5,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, cohort_name)
);

CREATE INDEX idx_enrollment_cohorts_course ON enrollment_cohorts(course_id);
CREATE INDEX idx_enrollment_cohorts_dates ON enrollment_cohorts(cohort_start_date, cohort_end_date);

-- ============================================================================
-- POPULAR CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS popular_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  content_title VARCHAR(500),

  -- Popularity Metrics
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Ranking
  popularity_score NUMERIC(10,2) DEFAULT 0,
  popularity_rank INTEGER,

  -- Time Period
  period_start DATE,
  period_end DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_popular_content_course ON popular_content(course_id);
CREATE INDEX idx_popular_content_score ON popular_content(popularity_score DESC);
CREATE INDEX idx_popular_content_rank ON popular_content(popularity_rank);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate course metrics for a specific date
CREATE OR REPLACE FUNCTION calculate_course_metrics(
  p_course_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_total_enrollments INTEGER;
  v_new_enrollments INTEGER;
  v_active_learners INTEGER;
  v_completed INTEGER;
  v_avg_score NUMERIC;
BEGIN
  -- Get enrollment counts
  SELECT COUNT(*) INTO v_total_enrollments
  FROM enrollments
  WHERE course_id = p_course_id AND DATE(enrolled_at) <= p_date;

  SELECT COUNT(*) INTO v_new_enrollments
  FROM enrollments
  WHERE course_id = p_course_id AND DATE(enrolled_at) = p_date;

  -- Get active learners (had activity on this date)
  SELECT COUNT(DISTINCT ls.user_id) INTO v_active_learners
  FROM learning_sessions ls
  JOIN enrollments e ON ls.user_id = e.user_id
  WHERE e.course_id = p_course_id AND DATE(ls.session_start) = p_date;

  -- Get completed
  SELECT COUNT(*) INTO v_completed
  FROM enrollments
  WHERE course_id = p_course_id AND status = 'completed' AND DATE(completed_at) <= p_date;

  -- Get avg score
  SELECT AVG(aa.score) INTO v_avg_score
  FROM assessment_attempts aa
  JOIN assessments a ON aa.assessment_id = a.id
  WHERE a.course_id = p_course_id
    AND aa.status = 'completed'
    AND DATE(aa.completed_at) = p_date;

  -- Upsert metrics
  INSERT INTO course_metrics (
    course_id, date, total_enrollments, new_enrollments,
    active_learners, completed_enrollments, avg_assessment_score
  )
  VALUES (
    p_course_id, p_date, v_total_enrollments, v_new_enrollments,
    v_active_learners, v_completed, v_avg_score
  )
  ON CONFLICT (course_id, date) DO UPDATE SET
    total_enrollments = v_total_enrollments,
    new_enrollments = v_new_enrollments,
    active_learners = v_active_learners,
    completed_enrollments = v_completed,
    avg_assessment_score = v_avg_score,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Calculate course completion analytics
CREATE OR REPLACE FUNCTION calculate_course_completion_analytics(p_course_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_enrolled INTEGER;
  v_total_completed INTEGER;
  v_total_in_progress INTEGER;
  v_completion_rate NUMERIC;
  v_avg_time_to_complete NUMERIC;
BEGIN
  -- Get enrollment counts by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'active')
  INTO v_total_enrolled, v_total_completed, v_total_in_progress
  FROM enrollments
  WHERE course_id = p_course_id;

  -- Calculate completion rate
  v_completion_rate := CASE
    WHEN v_total_enrolled > 0 THEN (v_total_completed::NUMERIC / v_total_enrolled * 100)
    ELSE 0
  END;

  -- Calculate avg time to complete
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at)) / 86400)
  INTO v_avg_time_to_complete
  FROM enrollments
  WHERE course_id = p_course_id AND status = 'completed' AND completed_at IS NOT NULL;

  -- Upsert analytics
  INSERT INTO course_completion_analytics (
    course_id, total_enrolled, total_completed, total_in_progress,
    completion_rate, avg_time_to_complete_days, last_calculated_at
  )
  VALUES (
    p_course_id, v_total_enrolled, v_total_completed, v_total_in_progress,
    v_completion_rate, v_avg_time_to_complete, NOW()
  )
  ON CONFLICT (course_id) DO UPDATE SET
    total_enrolled = v_total_enrolled,
    total_completed = v_total_completed,
    total_in_progress = v_total_in_progress,
    completion_rate = v_completion_rate,
    avg_time_to_complete_days = v_avg_time_to_complete,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Calculate lesson analytics
CREATE OR REPLACE FUNCTION calculate_lesson_analytics(p_lesson_id UUID)
RETURNS VOID AS $$
DECLARE
  v_course_id UUID;
  v_module_id UUID;
  v_total_views INTEGER;
  v_unique_viewers INTEGER;
  v_completions INTEGER;
  v_completion_rate NUMERIC;
  v_avg_time INTEGER;
BEGIN
  -- Get course and module IDs
  SELECT course_id, module_id INTO v_course_id, v_module_id
  FROM lessons WHERE id = p_lesson_id;

  -- Get view counts
  SELECT
    COUNT(*),
    COUNT(DISTINCT user_id),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_views, v_unique_viewers, v_completions
  FROM lesson_progress
  WHERE lesson_id = p_lesson_id;

  -- Calculate completion rate
  v_completion_rate := CASE
    WHEN v_unique_viewers > 0 THEN (v_completions::NUMERIC / v_unique_viewers * 100)
    ELSE 0
  END;

  -- Get average time spent
  SELECT AVG(total_time_spent_seconds) / 60 INTO v_avg_time
  FROM content_interactions
  WHERE content_type = 'lesson' AND content_id = p_lesson_id;

  -- Upsert analytics
  INSERT INTO lesson_analytics (
    lesson_id, module_id, course_id, total_views, unique_viewers,
    total_completions, completion_rate, avg_time_spent_minutes, last_calculated_at
  )
  VALUES (
    p_lesson_id, v_module_id, v_course_id, v_total_views, v_unique_viewers,
    v_completions, v_completion_rate, COALESCE(v_avg_time, 0), NOW()
  )
  ON CONFLICT (lesson_id) DO UPDATE SET
    total_views = v_total_views,
    unique_viewers = v_unique_viewers,
    total_completions = v_completions,
    completion_rate = v_completion_rate,
    avg_time_spent_minutes = COALESCE(v_avg_time, 0),
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Course performance overview
CREATE OR REPLACE VIEW course_performance_overview AS
SELECT
  c.id as course_id,
  c.title as course_title,
  c.instructor_id,
  cca.total_enrolled,
  cca.total_completed,
  cca.completion_rate,
  cca.avg_time_to_complete_days,
  AVG(aa.avg_score) as avg_assessment_score,
  COUNT(DISTINCT r.id) as review_count,
  AVG(r.rating) as avg_rating
FROM courses c
LEFT JOIN course_completion_analytics cca ON c.id = cca.course_id
LEFT JOIN assessments a ON c.id = a.course_id
LEFT JOIN assessment_analytics aa ON a.id = aa.assessment_id
LEFT JOIN reviews r ON c.id = r.course_id
GROUP BY c.id, c.title, c.instructor_id, cca.total_enrolled, cca.total_completed,
         cca.completion_rate, cca.avg_time_to_complete_days
ORDER BY cca.total_enrolled DESC;

-- Top performing courses
CREATE OR REPLACE VIEW top_performing_courses AS
SELECT
  c.id as course_id,
  c.title as course_title,
  cca.completion_rate,
  cca.total_completed,
  AVG(r.rating) as avg_rating,
  COUNT(DISTINCT e.user_id) as total_students
FROM courses c
LEFT JOIN course_completion_analytics cca ON c.id = cca.course_id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN reviews r ON c.id = r.course_id
GROUP BY c.id, c.title, cca.completion_rate, cca.total_completed
HAVING cca.completion_rate > 50 AND COUNT(DISTINCT e.user_id) >= 10
ORDER BY cca.completion_rate DESC, avg_rating DESC;

-- Courses needing attention
CREATE OR REPLACE VIEW courses_needing_attention AS
SELECT
  c.id as course_id,
  c.title as course_title,
  cca.completion_rate,
  cca.total_enrolled,
  cca.total_dropped,
  AVG(r.rating) as avg_rating,
  COUNT(cd.id) as recent_dropouts
FROM courses c
LEFT JOIN course_completion_analytics cca ON c.id = cca.course_id
LEFT JOIN reviews r ON c.id = r.course_id
LEFT JOIN course_dropouts cd ON c.id = cd.course_id AND cd.dropped_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.title, cca.completion_rate, cca.total_enrolled, cca.total_dropped
HAVING cca.completion_rate < 30 OR COUNT(cd.id) > 5 OR AVG(r.rating) < 3.0
ORDER BY cca.completion_rate ASC, recent_dropouts DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE course_metrics IS 'Daily aggregated metrics for courses';
COMMENT ON TABLE enrollment_trends IS 'Weekly enrollment trend analysis';
COMMENT ON TABLE course_completion_analytics IS 'Course completion rates and time-to-complete metrics';
COMMENT ON TABLE module_analytics IS 'Module-level engagement and performance metrics';
COMMENT ON TABLE lesson_analytics IS 'Lesson-level engagement and completion metrics';
COMMENT ON TABLE assessment_analytics IS 'Assessment performance and attempt metrics';
COMMENT ON TABLE course_dropouts IS 'Tracks course dropouts with reasons and analysis';
COMMENT ON TABLE instructor_analytics IS 'Instructor performance and engagement metrics';
COMMENT ON TABLE content_effectiveness IS 'Measures effectiveness of course content';
COMMENT ON TABLE enrollment_cohorts IS 'Cohort-based analysis of enrollment groups';
COMMENT ON TABLE popular_content IS 'Tracks most popular content by engagement metrics';
