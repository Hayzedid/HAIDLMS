-- ============================================================================
-- RECOMMENDATION ENGINE SCHEMA
-- ============================================================================
-- AI-powered recommendation system for courses, learning paths, and content
-- based on user behavior, skill gaps, and collaborative filtering

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Learning Preferences
  preferred_topics JSONB DEFAULT '[]'::JSONB,
  preferred_difficulty_levels JSONB DEFAULT '["beginner", "intermediate"]'::JSONB,
  preferred_content_types JSONB DEFAULT '[]'::JSONB, -- ['video', 'reading', 'hands-on']
  preferred_duration VARCHAR(50), -- 'short', 'medium', 'long'

  -- Goals
  learning_goals JSONB DEFAULT '[]'::JSONB,
  career_goals JSONB DEFAULT '[]'::JSONB,
  skill_interests JSONB DEFAULT '[]'::JSONB,

  -- Schedule Preferences
  available_hours_per_week INTEGER,
  preferred_learning_time VARCHAR(50), -- 'morning', 'afternoon', 'evening', 'flexible'

  -- Recommendation Settings
  enable_recommendations BOOLEAN DEFAULT true,
  recommendation_frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- ============================================================================
-- COURSE RECOMMENDATIONS
-- ============================================================================

CREATE TYPE recommendation_reason AS ENUM (
  'skill_gap',
  'learning_path',
  'popular',
  'similar_users',
  'career_goal',
  'interest_match',
  'continuation',
  'trending',
  'instructor_follow',
  'prerequisite'
);

CREATE TABLE IF NOT EXISTS course_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Recommendation Score
  recommendation_score NUMERIC(5,2) NOT NULL,
  confidence_score NUMERIC(5,2) DEFAULT 0,

  -- Reasoning
  primary_reason recommendation_reason NOT NULL,
  secondary_reasons JSONB DEFAULT '[]'::JSONB,
  explanation TEXT,

  -- Matching Factors
  skill_match_score NUMERIC(5,2) DEFAULT 0,
  interest_match_score NUMERIC(5,2) DEFAULT 0,
  difficulty_match_score NUMERIC(5,2) DEFAULT 0,
  time_commitment_match_score NUMERIC(5,2) DEFAULT 0,

  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- User Interaction
  viewed_at TIMESTAMP,
  clicked_at TIMESTAMP,
  enrolled_at TIMESTAMP,
  dismissed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, course_id, generated_at)
);

CREATE INDEX idx_course_recommendations_user ON course_recommendations(user_id, is_active, recommendation_score DESC);
CREATE INDEX idx_course_recommendations_course ON course_recommendations(course_id);
CREATE INDEX idx_course_recommendations_reason ON course_recommendations(primary_reason);
CREATE INDEX idx_course_recommendations_active ON course_recommendations(is_active, expires_at) WHERE is_active = true;

-- ============================================================================
-- LEARNING PATH RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_path_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  path_name VARCHAR(300) NOT NULL,
  path_description TEXT,

  -- Path Structure (ordered course IDs)
  course_sequence JSONB NOT NULL, -- [{"course_id": "...", "order": 1, "estimated_weeks": 4}, ...]
  total_courses INTEGER NOT NULL,
  estimated_duration_weeks INTEGER,

  -- Recommendation Score
  recommendation_score NUMERIC(5,2) NOT NULL,
  relevance_score NUMERIC(5,2) DEFAULT 0,

  -- Target Outcome
  target_skill VARCHAR(200),
  target_role VARCHAR(200),
  learning_outcome TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- User Interaction
  viewed_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_path_recommendations_user ON learning_path_recommendations(user_id, is_active);
CREATE INDEX idx_learning_path_recommendations_score ON learning_path_recommendations(recommendation_score DESC);

-- ============================================================================
-- SKILL GAP ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Target
  target_role VARCHAR(200),
  target_skill_level VARCHAR(50), -- 'junior', 'mid', 'senior', 'expert'

  -- Current State
  current_skills JSONB NOT NULL, -- [{"skill_id": "...", "mastery_level": "intermediate", "mastery_percentage": 65}, ...]

  -- Gaps Identified
  skill_gaps JSONB NOT NULL, -- [{"skill_id": "...", "skill_name": "...", "required_level": "advanced", "current_level": "beginner", "gap_severity": "high"}, ...]

  -- Recommendations
  recommended_courses JSONB, -- [{"course_id": "...", "addresses_gaps": ["skill1", "skill2"]}, ...]
  recommended_learning_path JSONB,

  -- Scores
  overall_readiness_score NUMERIC(5,2),
  skill_coverage_percentage NUMERIC(5,2),

  -- Analysis Metadata
  analyzed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skill_gap_analysis_user ON skill_gap_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_skill_gap_analysis_role ON skill_gap_analysis(target_role);

-- ============================================================================
-- USER SIMILARITY (Collaborative Filtering)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_similarity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  similar_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Similarity Metrics
  similarity_score NUMERIC(5,2) NOT NULL,

  -- Similarity Factors
  course_overlap_score NUMERIC(5,2) DEFAULT 0,
  skill_similarity_score NUMERIC(5,2) DEFAULT 0,
  learning_pattern_similarity NUMERIC(5,2) DEFAULT 0,
  interest_similarity_score NUMERIC(5,2) DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, similar_user_id),
  CHECK (user_id != similar_user_id)
);

CREATE INDEX idx_user_similarity_user ON user_similarity(user_id, similarity_score DESC);
CREATE INDEX idx_user_similarity_expires ON user_similarity(expires_at);

-- ============================================================================
-- COURSE SIMILARITY (Content-Based Filtering)
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_similarity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  similar_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Similarity Metrics
  similarity_score NUMERIC(5,2) NOT NULL,

  -- Similarity Factors
  topic_similarity_score NUMERIC(5,2) DEFAULT 0,
  skill_similarity_score NUMERIC(5,2) DEFAULT 0,
  difficulty_similarity_score NUMERIC(5,2) DEFAULT 0,
  content_type_similarity NUMERIC(5,2) DEFAULT 0,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, similar_course_id),
  CHECK (course_id != similar_course_id)
);

CREATE INDEX idx_course_similarity_course ON course_similarity(course_id, similarity_score DESC);

-- ============================================================================
-- RECOMMENDATION FEEDBACK
-- ============================================================================

CREATE TYPE feedback_type AS ENUM (
  'helpful',
  'not_helpful',
  'not_interested',
  'already_known',
  'too_difficult',
  'too_easy',
  'wrong_topic',
  'enrolled',
  'completed'
);

CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'course', 'learning_path'

  feedback_type feedback_type NOT NULL,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX idx_recommendation_feedback_recommendation ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_recommendation_feedback_type ON recommendation_feedback(feedback_type);

-- ============================================================================
-- TRENDING COURSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trending_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Trending Metrics
  trending_score NUMERIC(10,2) NOT NULL,
  enrollment_velocity NUMERIC(10,2) DEFAULT 0, -- enrollments per day
  engagement_velocity NUMERIC(10,2) DEFAULT 0, -- avg engagement increase

  -- Period Metrics
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  new_enrollments INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),
  avg_rating NUMERIC(3,2),

  -- Ranking
  trend_rank INTEGER,
  category VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, period_start, period_end)
);

CREATE INDEX idx_trending_courses_score ON trending_courses(trending_score DESC);
CREATE INDEX idx_trending_courses_rank ON trending_courses(trend_rank);
CREATE INDEX idx_trending_courses_period ON trending_courses(period_end DESC);

-- ============================================================================
-- NEXT BEST ACTION
-- ============================================================================

CREATE TYPE action_type AS ENUM (
  'enroll_course',
  'complete_lesson',
  'take_assessment',
  'practice_skill',
  'join_study_group',
  'review_material',
  'earn_certificate',
  'update_profile'
);

CREATE TABLE IF NOT EXISTS next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  action_type action_type NOT NULL,
  action_title VARCHAR(300) NOT NULL,
  action_description TEXT,

  -- Action Details
  target_id UUID, -- course_id, lesson_id, etc.
  target_type VARCHAR(50),
  action_url VARCHAR(500),

  -- Prioritization
  priority_score NUMERIC(5,2) NOT NULL,
  urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  impact_level VARCHAR(20), -- 'low', 'medium', 'high'

  -- Reasoning
  reasoning TEXT,
  expected_outcome TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- User Interaction
  viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  dismissed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_next_best_actions_user ON next_best_actions(user_id, is_active, priority_score DESC);
CREATE INDEX idx_next_best_actions_urgency ON next_best_actions(urgency_level);

-- ============================================================================
-- RECOMMENDATION PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date DATE NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'course', 'learning_path'
  primary_reason recommendation_reason,

  -- Performance Metrics
  total_recommendations INTEGER DEFAULT 0,
  viewed_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  dismissed_count INTEGER DEFAULT 0,

  -- Rates
  view_rate NUMERIC(5,2) DEFAULT 0,
  click_through_rate NUMERIC(5,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  dismissal_rate NUMERIC(5,2) DEFAULT 0,

  -- Feedback
  avg_feedback_rating NUMERIC(3,2),
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(date, recommendation_type, primary_reason)
);

CREATE INDEX idx_recommendation_performance_date ON recommendation_performance(date DESC);
CREATE INDEX idx_recommendation_performance_type ON recommendation_performance(recommendation_type);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate course recommendations for a user
CREATE OR REPLACE FUNCTION generate_course_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS SETOF course_recommendations AS $$
BEGIN
  -- This is a simplified version
  -- In production, this would involve complex ML models and scoring algorithms

  -- Mark existing recommendations as inactive
  UPDATE course_recommendations
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- Generate new recommendations based on user preferences and behavior
  -- This is a placeholder - real implementation would be more sophisticated
  RETURN QUERY
  INSERT INTO course_recommendations (
    user_id, course_id, recommendation_score, primary_reason,
    skill_match_score, interest_match_score, expires_at
  )
  SELECT
    p_user_id,
    c.id,
    (RANDOM() * 100)::NUMERIC(5,2) as recommendation_score,
    'interest_match'::recommendation_reason,
    (RANDOM() * 100)::NUMERIC(5,2),
    (RANDOM() * 100)::NUMERIC(5,2),
    NOW() + INTERVAL '7 days'
  FROM courses c
  WHERE c.status = 'published'
    AND NOT EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = p_user_id AND e.course_id = c.id
    )
  ORDER BY RANDOM()
  LIMIT p_limit
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Calculate user similarity
CREATE OR REPLACE FUNCTION calculate_user_similarity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS VOID AS $$
DECLARE
  v_user_courses UUID[];
  v_similar_user RECORD;
  v_overlap INTEGER;
  v_similarity_score NUMERIC;
BEGIN
  -- Get user's enrolled courses
  SELECT ARRAY_AGG(course_id) INTO v_user_courses
  FROM enrollments
  WHERE user_id = p_user_id;

  -- Delete old similarities
  DELETE FROM user_similarity WHERE user_id = p_user_id;

  -- Find similar users based on course overlap
  FOR v_similar_user IN
    SELECT
      e.user_id,
      COUNT(*) FILTER (WHERE e.course_id = ANY(v_user_courses)) as overlap_count,
      COUNT(DISTINCT e.course_id) as total_courses
    FROM enrollments e
    WHERE e.user_id != p_user_id
    GROUP BY e.user_id
    HAVING COUNT(*) FILTER (WHERE e.course_id = ANY(v_user_courses)) > 0
    ORDER BY overlap_count DESC
    LIMIT p_limit
  LOOP
    -- Calculate similarity score (Jaccard similarity)
    v_similarity_score := (v_similar_user.overlap_count::NUMERIC /
      (ARRAY_LENGTH(v_user_courses, 1) + v_similar_user.total_courses - v_similar_user.overlap_count)) * 100;

    -- Insert similarity
    INSERT INTO user_similarity (
      user_id, similar_user_id, similarity_score,
      course_overlap_score, expires_at
    )
    VALUES (
      p_user_id, v_similar_user.user_id, v_similarity_score,
      v_similarity_score, NOW() + INTERVAL '30 days'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_courses(
  p_period_days INTEGER DEFAULT 7
) RETURNS VOID AS $$
DECLARE
  v_period_start DATE := CURRENT_DATE - p_period_days;
  v_period_end DATE := CURRENT_DATE;
BEGIN
  -- Delete old trending data for this period
  DELETE FROM trending_courses
  WHERE period_start = v_period_start AND period_end = v_period_end;

  -- Calculate trending courses
  INSERT INTO trending_courses (
    course_id, trending_score, enrollment_velocity,
    period_start, period_end, new_enrollments,
    completion_rate, avg_rating
  )
  SELECT
    c.id,
    (COUNT(e.id)::NUMERIC / p_period_days * 10) + -- enrollment velocity weight
    (AVG(r.rating) * 5) + -- rating weight
    (COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'completed')::NUMERIC /
      NULLIF(COUNT(DISTINCT e.user_id), 0) * 100 * 0.5) -- completion rate weight
    as trending_score,
    COUNT(e.id)::NUMERIC / p_period_days as enrollment_velocity,
    v_period_start,
    v_period_end,
    COUNT(e.id),
    COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'completed')::NUMERIC /
      NULLIF(COUNT(DISTINCT e.user_id), 0) * 100,
    AVG(r.rating)
  FROM courses c
  LEFT JOIN enrollments e ON c.id = e.course_id
    AND e.enrolled_at >= v_period_start
  LEFT JOIN reviews r ON c.id = r.course_id
  WHERE c.status = 'published'
  GROUP BY c.id
  HAVING COUNT(e.id) > 0
  ORDER BY trending_score DESC;

  -- Update rankings
  UPDATE trending_courses SET trend_rank = subquery.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY trending_score DESC) as rank
    FROM trending_courses
    WHERE period_start = v_period_start AND period_end = v_period_end
  ) as subquery
  WHERE trending_courses.id = subquery.id;
END;
$$ LANGUAGE plpgsql;

-- Track recommendation interaction
CREATE OR REPLACE FUNCTION track_recommendation_interaction(
  p_recommendation_id UUID,
  p_interaction_type VARCHAR -- 'view', 'click', 'enroll', 'dismiss'
) RETURNS VOID AS $$
BEGIN
  IF p_interaction_type = 'view' THEN
    UPDATE course_recommendations SET viewed_at = NOW() WHERE id = p_recommendation_id;
  ELSIF p_interaction_type = 'click' THEN
    UPDATE course_recommendations SET clicked_at = NOW() WHERE id = p_recommendation_id;
  ELSIF p_interaction_type = 'enroll' THEN
    UPDATE course_recommendations SET enrolled_at = NOW() WHERE id = p_recommendation_id;
  ELSIF p_interaction_type = 'dismiss' THEN
    UPDATE course_recommendations SET dismissed_at = NOW(), is_active = false WHERE id = p_recommendation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active recommendations for users
CREATE OR REPLACE VIEW active_user_recommendations AS
SELECT
  cr.*,
  c.title as course_title,
  c.description as course_description,
  c.difficulty_level,
  c.duration_hours,
  u.full_name
FROM course_recommendations cr
JOIN courses c ON cr.course_id = c.id
JOIN users u ON cr.user_id = u.id
WHERE cr.is_active = true
  AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
ORDER BY cr.user_id, cr.recommendation_score DESC;

-- Recommendation effectiveness
CREATE OR REPLACE VIEW recommendation_effectiveness AS
SELECT
  primary_reason,
  COUNT(*) as total_recommendations,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked_count,
  COUNT(*) FILTER (WHERE enrolled_at IS NOT NULL) as enrolled_count,
  COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL) as dismissed_count,
  (COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::NUMERIC / COUNT(*) * 100) as click_rate,
  (COUNT(*) FILTER (WHERE enrolled_at IS NOT NULL)::NUMERIC / COUNT(*) * 100) as conversion_rate
FROM course_recommendations
WHERE generated_at >= NOW() - INTERVAL '30 days'
GROUP BY primary_reason
ORDER BY conversion_rate DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_preferences IS 'User learning preferences and goals for personalization';
COMMENT ON TABLE course_recommendations IS 'AI-generated course recommendations with scoring and reasoning';
COMMENT ON TABLE learning_path_recommendations IS 'Recommended learning paths tailored to user goals';
COMMENT ON TABLE skill_gap_analysis IS 'Analysis of skill gaps between current and target levels';
COMMENT ON TABLE user_similarity IS 'User similarity matrix for collaborative filtering';
COMMENT ON TABLE course_similarity IS 'Course similarity matrix for content-based filtering';
COMMENT ON TABLE recommendation_feedback IS 'User feedback on recommendations for model improvement';
COMMENT ON TABLE trending_courses IS 'Trending courses based on enrollment velocity and engagement';
COMMENT ON TABLE next_best_actions IS 'Prioritized next actions recommended to users';
COMMENT ON TABLE recommendation_performance IS 'Performance metrics for recommendation algorithms';
