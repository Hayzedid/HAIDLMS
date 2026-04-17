-- AI-Powered Adaptive Learning System Schema
-- Adaptive paths, knowledge graphs, skill gap analysis, personalized sequencing

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE learning_style AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading_writing', 'mixed');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE mastery_level AS ENUM ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert');
CREATE TYPE concept_relationship AS ENUM ('prerequisite', 'related', 'successor', 'alternative', 'reinforces');
CREATE TYPE path_status AS ENUM ('not_started', 'in_progress', 'completed', 'abandoned');
CREATE TYPE intervention_type AS ENUM ('review', 'remediation', 'acceleration', 'alternative_content', 'peer_support');

-- ========================================
-- 2. KNOWLEDGE GRAPH
-- ========================================

CREATE TABLE IF NOT EXISTS knowledge_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Concept Identity
  concept_code VARCHAR(100) NOT NULL UNIQUE,
  concept_name VARCHAR(255) NOT NULL,
  concept_description TEXT,

  -- Hierarchy
  domain VARCHAR(100), -- e.g., 'programming', 'mathematics'
  subdomain VARCHAR(100),
  parent_concept_id UUID REFERENCES knowledge_concepts(id) ON DELETE SET NULL,

  -- Metadata
  difficulty_level difficulty_level,
  estimated_learning_time_minutes INTEGER,
  importance_weight NUMERIC DEFAULT 1.0, -- 0-1 scale

  -- Content Mapping
  tags TEXT[],
  keywords TEXT[],

  -- Usage Statistics
  total_learners INTEGER DEFAULT 0,
  avg_mastery_time_hours NUMERIC,
  avg_success_rate NUMERIC,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_concepts_code ON knowledge_concepts(concept_code);
CREATE INDEX idx_concepts_domain ON knowledge_concepts(domain, subdomain);
CREATE INDEX idx_concepts_parent ON knowledge_concepts(parent_concept_id);
CREATE INDEX idx_concepts_difficulty ON knowledge_concepts(difficulty_level);

-- ========================================
-- 3. CONCEPT RELATIONSHIPS
-- ========================================

CREATE TABLE IF NOT EXISTS concept_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Concepts
  source_concept_id UUID NOT NULL REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES knowledge_concepts(id) ON DELETE CASCADE,

  -- Relationship
  relationship_type concept_relationship NOT NULL,
  strength NUMERIC DEFAULT 1.0, -- 0-1 scale

  -- Metadata
  is_required BOOLEAN DEFAULT false,
  sequence_order INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_concept_relationship UNIQUE (source_concept_id, target_concept_id, relationship_type)
);

CREATE INDEX idx_relationships_source ON concept_relationships(source_concept_id);
CREATE INDEX idx_relationships_target ON concept_relationships(target_concept_id);
CREATE INDEX idx_relationships_type ON concept_relationships(relationship_type);

-- ========================================
-- 4. LEARNING OBJECTIVES
-- ========================================

CREATE TABLE IF NOT EXISTS learning_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Objective Identity
  objective_code VARCHAR(100) NOT NULL UNIQUE,
  objective_text TEXT NOT NULL,

  -- Bloom's Taxonomy Level
  cognitive_level VARCHAR(50), -- 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'

  -- Concept Mapping
  concept_id UUID NOT NULL REFERENCES knowledge_concepts(id) ON DELETE CASCADE,

  -- Course/Lesson Mapping
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  -- Measurability
  is_measurable BOOLEAN DEFAULT true,
  assessment_criteria TEXT[],

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objectives_code ON learning_objectives(objective_code);
CREATE INDEX idx_objectives_concept ON learning_objectives(concept_id);
CREATE INDEX idx_objectives_course ON learning_objectives(course_id);
CREATE INDEX idx_objectives_cognitive ON learning_objectives(cognitive_level);

-- ========================================
-- 5. LEARNER PROFILES
-- ========================================

CREATE TABLE IF NOT EXISTS learner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Learning Style
  primary_learning_style learning_style,
  learning_style_scores JSONB, -- Scores for each style

  -- Preferences
  preferred_content_types TEXT[], -- 'video', 'text', 'interactive', 'audio'
  preferred_pace VARCHAR(50), -- 'slow', 'moderate', 'fast', 'self_paced'
  preferred_difficulty difficulty_level,

  -- Behavioral Patterns
  avg_session_duration_minutes INTEGER,
  preferred_time_of_day VARCHAR(50), -- 'morning', 'afternoon', 'evening', 'night'
  study_frequency_per_week NUMERIC,
  avg_attention_span_minutes INTEGER,

  -- Performance Metrics
  overall_mastery_score NUMERIC, -- 0-100
  learning_velocity NUMERIC, -- Concepts mastered per hour
  retention_rate NUMERIC, -- 0-1
  engagement_score NUMERIC, -- 0-100

  -- Motivational Factors
  motivation_type VARCHAR(50), -- 'intrinsic', 'extrinsic', 'mixed'
  response_to_difficulty VARCHAR(50), -- 'resilient', 'discouraged', 'adaptive'

  -- Goals
  learning_goals TEXT[],
  target_completion_date DATE,

  -- Last Updated
  profile_last_analyzed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON learner_profiles(user_id);
CREATE INDEX idx_profiles_style ON learner_profiles(primary_learning_style);
CREATE INDEX idx_profiles_difficulty ON learner_profiles(preferred_difficulty);

-- ========================================
-- 6. CONCEPT MASTERY TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS concept_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User & Concept
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES knowledge_concepts(id) ON DELETE CASCADE,

  -- Mastery Level
  mastery_level mastery_level DEFAULT 'novice',
  mastery_score NUMERIC DEFAULT 0, -- 0-100

  -- Confidence
  confidence_level NUMERIC, -- 0-1, how confident the system is in the assessment

  -- Practice Stats
  total_attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,

  -- Spaced Repetition
  next_review_date DATE,
  review_interval_days INTEGER DEFAULT 1,
  ease_factor NUMERIC DEFAULT 2.5, -- SM-2 algorithm

  -- Trend
  mastery_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
  last_assessment_score NUMERIC,

  -- Timestamps
  first_exposure_at TIMESTAMP DEFAULT NOW(),
  last_practiced_at TIMESTAMP,
  mastery_achieved_at TIMESTAMP,

  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_user_concept_mastery UNIQUE (user_id, concept_id)
);

CREATE INDEX idx_mastery_user ON concept_mastery(user_id);
CREATE INDEX idx_mastery_concept ON concept_mastery(concept_id);
CREATE INDEX idx_mastery_level ON concept_mastery(mastery_level);
CREATE INDEX idx_mastery_review ON concept_mastery(next_review_date);
CREATE INDEX idx_mastery_user_concept ON concept_mastery(user_id, concept_id);

-- ========================================
-- 7. ADAPTIVE LEARNING PATHS
-- ========================================

CREATE TABLE IF NOT EXISTS adaptive_learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User & Goal
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_description TEXT NOT NULL,

  -- Target
  target_concepts UUID[], -- Array of concept IDs to master
  target_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

  -- Path Sequence
  path_sequence JSONB NOT NULL, -- Ordered list of learning activities
  current_position INTEGER DEFAULT 0,

  -- Difficulty Adaptation
  current_difficulty difficulty_level DEFAULT 'beginner',
  difficulty_adjustment_count INTEGER DEFAULT 0,

  -- Status
  status path_status DEFAULT 'not_started',
  completion_percentage NUMERIC DEFAULT 0,

  -- Timeline
  started_at TIMESTAMP,
  target_completion_date DATE,
  estimated_hours_remaining NUMERIC,
  actual_hours_spent NUMERIC DEFAULT 0,

  -- Performance
  overall_performance_score NUMERIC,
  struggling_concepts UUID[],

  -- Adaptation Metadata
  adaptation_history JSONB, -- Log of path adjustments
  last_adapted_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paths_user ON adaptive_learning_paths(user_id);
CREATE INDEX idx_paths_status ON adaptive_learning_paths(status);
CREATE INDEX idx_paths_course ON adaptive_learning_paths(target_course_id);

-- ========================================
-- 8. LEARNING RECOMMENDATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Recommendation Type
  recommendation_type VARCHAR(100) NOT NULL, -- 'next_concept', 'review', 'alternative_content', 'peer_group'

  -- Content
  recommended_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  recommended_lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  recommended_concept_id UUID REFERENCES knowledge_concepts(id) ON DELETE CASCADE,

  -- Reasoning
  reasoning TEXT,
  confidence_score NUMERIC, -- 0-1
  priority INTEGER DEFAULT 1, -- 1 (low) to 5 (high)

  -- Algorithm
  algorithm_name VARCHAR(100), -- Which ML model generated this
  algorithm_version VARCHAR(50),

  -- Personalization Factors
  personalization_factors JSONB, -- What factors influenced this recommendation

  -- User Response
  is_accepted BOOLEAN,
  is_dismissed BOOLEAN,
  user_feedback TEXT,
  actual_outcome VARCHAR(50), -- 'helpful', 'not_helpful', 'neutral'

  -- Timing
  recommended_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  responded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON learning_recommendations(user_id);
CREATE INDEX idx_recommendations_type ON learning_recommendations(recommendation_type);
CREATE INDEX idx_recommendations_course ON learning_recommendations(recommended_course_id);
CREATE INDEX idx_recommendations_active ON learning_recommendations(is_accepted, is_dismissed);

-- ========================================
-- 9. SKILL GAP ANALYSIS
-- ========================================

CREATE TABLE IF NOT EXISTS skill_gap_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Target Role/Position
  target_role VARCHAR(255),
  target_job_description TEXT,

  -- Current State
  current_skills JSONB, -- Array of {concept_id, mastery_level}

  -- Gaps Identified
  skill_gaps JSONB NOT NULL, -- Array of {concept_id, gap_severity, priority}
  critical_gaps UUID[], -- Concept IDs of most important gaps

  -- Recommendations
  recommended_learning_path_id UUID REFERENCES adaptive_learning_paths(id) ON DELETE SET NULL,
  estimated_time_to_close_gaps_hours NUMERIC,

  -- Market Data
  market_demand_score NUMERIC, -- How in-demand these skills are
  salary_impact_estimate NUMERIC,

  -- Analysis Metadata
  analysis_date TIMESTAMP DEFAULT NOW(),
  analysis_version VARCHAR(50),
  confidence_score NUMERIC,

  -- Progress Tracking
  gaps_closed_count INTEGER DEFAULT 0,
  next_review_date DATE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gap_analyses_user ON skill_gap_analyses(user_id);
CREATE INDEX idx_gap_analyses_date ON skill_gap_analyses(analysis_date DESC);

-- ========================================
-- 10. LEARNING INTERVENTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS learning_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Trigger
  trigger_condition VARCHAR(255) NOT NULL, -- What triggered this intervention
  intervention_type intervention_type NOT NULL,

  -- Context
  concept_id UUID REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,

  -- Intervention Details
  intervention_description TEXT,
  recommended_actions JSONB,

  -- Content
  alternative_content_ids UUID[],
  review_materials UUID[],

  -- Urgency
  priority INTEGER DEFAULT 1,
  is_automatic BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  user_acknowledged BOOLEAN DEFAULT false,

  -- Effectiveness
  outcome VARCHAR(50), -- 'improved', 'no_change', 'declined'
  effectiveness_score NUMERIC,

  -- Timing
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interventions_user ON learning_interventions(user_id);
CREATE INDEX idx_interventions_type ON learning_interventions(intervention_type);
CREATE INDEX idx_interventions_active ON learning_interventions(is_active);
CREATE INDEX idx_interventions_concept ON learning_interventions(concept_id);

-- ========================================
-- 11. LEARNING ANALYTICS EVENTS
-- ========================================

CREATE TABLE IF NOT EXISTS learning_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event Type
  event_type VARCHAR(100) NOT NULL, -- 'content_view', 'quiz_attempt', 'concept_practice', etc.

  -- Context
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES knowledge_concepts(id) ON DELETE SET NULL,

  -- Event Data
  event_data JSONB,

  -- Performance
  score NUMERIC,
  time_spent_seconds INTEGER,
  attempts_count INTEGER,

  -- Cognitive Load Indicators
  pause_count INTEGER,
  replay_count INTEGER,
  help_requests INTEGER,

  -- Device & Context
  device_type VARCHAR(50),
  session_id UUID,

  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON learning_analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON learning_analytics_events(event_type);
CREATE INDEX idx_analytics_events_concept ON learning_analytics_events(concept_id);
CREATE INDEX idx_analytics_events_time ON learning_analytics_events(occurred_at DESC);

-- ========================================
-- 12. PEER LEARNING GROUPS
-- ========================================

CREATE TABLE IF NOT EXISTS peer_learning_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Group Identity
  group_name VARCHAR(255) NOT NULL,
  group_description TEXT,

  -- Grouping Criteria
  grouping_algorithm VARCHAR(100), -- 'skill_level', 'learning_style', 'pace', 'mixed'
  target_concepts UUID[],

  -- Members
  member_user_ids UUID[] NOT NULL,
  max_members INTEGER DEFAULT 5,

  -- Activity
  total_interactions INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,

  -- Effectiveness
  group_performance_score NUMERIC,
  collaboration_quality_score NUMERIC,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  dissolved_at TIMESTAMP
);

CREATE INDEX idx_peer_groups_members ON peer_learning_groups USING GIN(member_user_ids);
CREATE INDEX idx_peer_groups_active ON peer_learning_groups(is_active);

-- ========================================
-- 13. FUNCTIONS
-- ========================================

-- Function: Calculate mastery score
CREATE OR REPLACE FUNCTION calculate_mastery_score(
  p_user_id UUID,
  p_concept_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_mastery RECORD;
  v_success_rate NUMERIC;
  v_recency_factor NUMERIC;
  v_score NUMERIC;
BEGIN
  SELECT * INTO v_mastery
  FROM concept_mastery
  WHERE user_id = p_user_id AND concept_id = p_concept_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate success rate
  IF v_mastery.total_attempts > 0 THEN
    v_success_rate := v_mastery.successful_attempts::NUMERIC / v_mastery.total_attempts::NUMERIC;
  ELSE
    v_success_rate := 0;
  END IF;

  -- Recency factor (decay over time)
  IF v_mastery.last_practiced_at IS NOT NULL THEN
    v_recency_factor := 1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - v_mastery.last_practiced_at)) / 86400.0 / 30.0);
  ELSE
    v_recency_factor := 0;
  END IF;

  -- Weighted score
  v_score := (v_success_rate * 70 + v_recency_factor * 30) * 100;

  RETURN LEAST(100, v_score);
END;
$$ LANGUAGE plpgsql;

-- Function: Update mastery after practice
CREATE OR REPLACE FUNCTION update_concept_mastery(
  p_user_id UUID,
  p_concept_id UUID,
  p_was_successful BOOLEAN,
  p_time_spent_seconds INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_new_score NUMERIC;
  v_new_level mastery_level;
BEGIN
  -- Insert or update mastery record
  INSERT INTO concept_mastery (
    user_id, concept_id, total_attempts, successful_attempts,
    time_spent_minutes, last_practiced_at
  ) VALUES (
    p_user_id, p_concept_id, 1,
    CASE WHEN p_was_successful THEN 1 ELSE 0 END,
    p_time_spent_seconds / 60, NOW()
  )
  ON CONFLICT (user_id, concept_id)
  DO UPDATE SET
    total_attempts = concept_mastery.total_attempts + 1,
    successful_attempts = concept_mastery.successful_attempts + CASE WHEN p_was_successful THEN 1 ELSE 0 END,
    time_spent_minutes = concept_mastery.time_spent_minutes + p_time_spent_seconds / 60,
    last_practiced_at = NOW(),
    updated_at = NOW();

  -- Recalculate mastery score
  v_new_score := calculate_mastery_score(p_user_id, p_concept_id);

  -- Determine mastery level
  v_new_level := CASE
    WHEN v_new_score >= 90 THEN 'expert'::mastery_level
    WHEN v_new_score >= 75 THEN 'proficient'::mastery_level
    WHEN v_new_score >= 50 THEN 'competent'::mastery_level
    WHEN v_new_score >= 25 THEN 'advanced_beginner'::mastery_level
    ELSE 'novice'::mastery_level
  END;

  -- Update mastery level and score
  UPDATE concept_mastery
  SET
    mastery_score = v_new_score,
    mastery_level = v_new_level,
    mastery_achieved_at = CASE WHEN v_new_level IN ('proficient', 'expert') AND mastery_achieved_at IS NULL THEN NOW() ELSE mastery_achieved_at END
  WHERE user_id = p_user_id AND concept_id = p_concept_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate adaptive path
CREATE OR REPLACE FUNCTION generate_adaptive_path(
  p_user_id UUID,
  p_goal_description TEXT,
  p_target_concepts UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_path_id UUID;
  v_profile RECORD;
  v_sequence JSONB;
BEGIN
  -- Get learner profile
  SELECT * INTO v_profile
  FROM learner_profiles
  WHERE user_id = p_user_id;

  -- Generate personalized sequence (simplified - actual implementation would use ML)
  v_sequence := jsonb_build_array();

  -- Create adaptive path
  INSERT INTO adaptive_learning_paths (
    user_id, goal_description, target_concepts, path_sequence
  ) VALUES (
    p_user_id, p_goal_description, p_target_concepts, v_sequence
  )
  RETURNING id INTO v_path_id;

  RETURN v_path_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger intervention if needed
CREATE OR REPLACE FUNCTION check_and_trigger_intervention(
  p_user_id UUID,
  p_concept_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_mastery RECORD;
  v_intervention_id UUID;
BEGIN
  -- Get mastery data
  SELECT * INTO v_mastery
  FROM concept_mastery
  WHERE user_id = p_user_id AND concept_id = p_concept_id;

  -- Check if intervention needed (e.g., 3+ failed attempts)
  IF v_mastery.total_attempts >= 3 AND
     (v_mastery.successful_attempts::NUMERIC / v_mastery.total_attempts::NUMERIC) < 0.5 THEN

    -- Create intervention
    INSERT INTO learning_interventions (
      user_id, concept_id, trigger_condition,
      intervention_type, intervention_description
    ) VALUES (
      p_user_id, p_concept_id,
      'Low success rate after multiple attempts',
      'remediation',
      'Additional practice and review materials recommended'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 14. VIEWS
-- ========================================

-- View: User learning progress summary
CREATE OR REPLACE VIEW user_learning_progress AS
SELECT
  cm.user_id,
  COUNT(*) AS total_concepts,
  COUNT(*) FILTER (WHERE cm.mastery_level IN ('proficient', 'expert')) AS mastered_concepts,
  AVG(cm.mastery_score) AS avg_mastery_score,
  SUM(cm.time_spent_minutes) AS total_time_spent_minutes,
  MAX(cm.last_practiced_at) AS last_practice
FROM concept_mastery cm
GROUP BY cm.user_id;

-- View: Concepts needing review
CREATE OR REPLACE VIEW concepts_due_for_review AS
SELECT
  cm.user_id,
  cm.concept_id,
  kc.concept_name,
  cm.next_review_date,
  cm.mastery_level,
  cm.last_practiced_at
FROM concept_mastery cm
JOIN knowledge_concepts kc ON cm.concept_id = kc.id
WHERE cm.next_review_date <= CURRENT_DATE
  AND cm.mastery_level != 'expert'
ORDER BY cm.next_review_date ASC;

-- View: Active interventions summary
CREATE OR REPLACE VIEW active_interventions_summary AS
SELECT
  li.user_id,
  li.intervention_type,
  COUNT(*) AS intervention_count,
  MAX(li.triggered_at) AS latest_intervention
FROM learning_interventions li
WHERE li.is_active = true
  AND li.is_completed = false
GROUP BY li.user_id, li.intervention_type;

COMMENT ON SCHEMA public IS 'AI-Powered Adaptive Learning - Knowledge graphs, personalized paths, skill gap analysis';
