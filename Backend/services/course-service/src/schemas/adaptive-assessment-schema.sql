-- Adaptive Assessment System Schema
-- Enables real-time difficulty adjustment based on student performance

-- ========================================
-- 1. ADAPTIVE ASSESSMENT CONFIGURATION
-- ========================================

CREATE TABLE IF NOT EXISTS adaptive_assessment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Adaptive Settings
  is_adaptive BOOLEAN DEFAULT true,
  initial_difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
  difficulty_adjustment_algorithm VARCHAR(50) DEFAULT 'elo_based', -- elo_based, performance_based, hybrid

  -- Item Selection Strategy
  question_pool_strategy VARCHAR(50) DEFAULT 'dynamic', -- dynamic, fixed_pool, mixed
  min_questions_per_level INTEGER DEFAULT 3,
  max_questions_total INTEGER DEFAULT 20,

  -- Difficulty Thresholds
  easy_threshold DECIMAL(5,2) DEFAULT 0.70, -- If performance > 70%, increase difficulty
  hard_threshold DECIMAL(5,2) DEFAULT 0.40, -- If performance < 40%, decrease difficulty

  -- Performance Weights
  weight_correctness DECIMAL(3,2) DEFAULT 0.60,
  weight_time_efficiency DECIMAL(3,2) DEFAULT 0.20,
  weight_confidence DECIMAL(3,2) DEFAULT 0.20,

  -- Termination Criteria
  termination_strategy VARCHAR(50) DEFAULT 'confidence_threshold', -- confidence_threshold, fixed_count, time_limit
  confidence_threshold DECIMAL(5,2) DEFAULT 0.85, -- Stop when 85% confident of ability level
  max_time_minutes INTEGER DEFAULT 60,

  -- Scoring
  use_irt_scoring BOOLEAN DEFAULT false, -- Item Response Theory scoring
  passing_score DECIMAL(5,2) DEFAULT 0.70,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adaptive_config_assessment ON adaptive_assessment_config(assessment_id);
CREATE INDEX idx_adaptive_config_course ON adaptive_assessment_config(course_id);

-- ========================================
-- 2. QUESTION DIFFICULTY METADATA
-- ========================================

CREATE TABLE IF NOT EXISTS question_difficulty_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,

  -- Difficulty Parameters
  difficulty_level VARCHAR(20) NOT NULL, -- easy, medium, hard, expert
  difficulty_score DECIMAL(5,2) DEFAULT 0.50, -- 0.0 (easiest) to 1.0 (hardest)

  -- IRT Parameters (Item Response Theory)
  discrimination_param DECIMAL(5,2), -- How well question discriminates between abilities
  difficulty_param DECIMAL(5,2), -- Question difficulty on ability scale
  guessing_param DECIMAL(5,2) DEFAULT 0.25, -- Probability of random correct answer

  -- Statistical Metrics
  times_presented INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  avg_time_seconds INTEGER,
  avg_confidence_score DECIMAL(3,2),

  -- Computed Metrics
  historical_accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN times_presented > 0 THEN CAST(times_correct AS DECIMAL) / times_presented
      ELSE NULL
    END
  ) STORED,

  -- Tags for Content Alignment
  topic_tags TEXT[], -- ['loops', 'arrays', 'functions']
  prerequisite_concepts TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_difficulty_question ON question_difficulty_metadata(question_id);
CREATE INDEX idx_question_difficulty_assessment ON question_difficulty_metadata(assessment_id);
CREATE INDEX idx_question_difficulty_level ON question_difficulty_metadata(difficulty_level);
CREATE INDEX idx_question_difficulty_score ON question_difficulty_metadata(difficulty_score);

-- ========================================
-- 3. ADAPTIVE SESSION TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS adaptive_assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES adaptive_assessment_config(id) ON DELETE SET NULL,

  -- Session State
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
  current_difficulty VARCHAR(20) DEFAULT 'medium',
  current_ability_estimate DECIMAL(5,2) DEFAULT 0.50, -- Estimated ability (0.0 to 1.0)
  ability_confidence DECIMAL(5,2) DEFAULT 0.0, -- Confidence in ability estimate (0.0 to 1.0)

  -- Progress Tracking
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- Consecutive correct answers
  max_streak INTEGER DEFAULT 0,

  -- Performance Metrics
  overall_accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN questions_answered > 0 THEN CAST(questions_correct AS DECIMAL) / questions_answered
      ELSE 0
    END
  ) STORED,
  avg_time_per_question DECIMAL(10,2),
  avg_confidence DECIMAL(3,2),

  -- Difficulty Progression
  difficulty_adjustments INTEGER DEFAULT 0,
  difficulty_history JSONB DEFAULT '[]', -- [{timestamp, difficulty, reason}]

  -- Final Results
  final_score DECIMAL(5,2),
  final_ability_level VARCHAR(20), -- novice, intermediate, advanced, expert
  passed BOOLEAN,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_elapsed_seconds INTEGER
);

CREATE INDEX idx_adaptive_session_assessment ON adaptive_assessment_sessions(assessment_id);
CREATE INDEX idx_adaptive_session_user ON adaptive_assessment_sessions(user_id);
CREATE INDEX idx_adaptive_session_status ON adaptive_assessment_sessions(status);

-- ========================================
-- 4. QUESTION PRESENTATIONS (History)
-- ========================================

CREATE TABLE IF NOT EXISTS adaptive_question_presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES adaptive_assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  metadata_id UUID REFERENCES question_difficulty_metadata(id) ON DELETE SET NULL,

  -- Presentation Context
  question_sequence INTEGER NOT NULL, -- 1st, 2nd, 3rd question in session
  difficulty_at_presentation VARCHAR(20),
  ability_estimate_before DECIMAL(5,2),

  -- Student Response
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  confidence_level VARCHAR(20), -- very_low, low, medium, high, very_high
  confidence_score DECIMAL(3,2), -- 0.0 to 1.0

  -- Performance Contribution
  contributed_to_ability BOOLEAN DEFAULT false, -- Did this impact ability estimate?
  ability_change DECIMAL(5,2), -- Change in ability estimate after this question

  -- Adaptive Decision
  next_difficulty_recommendation VARCHAR(20),
  adjustment_reason TEXT,

  presented_at TIMESTAMP DEFAULT NOW(),
  answered_at TIMESTAMP
);

CREATE INDEX idx_adaptive_presentation_session ON adaptive_question_presentations(session_id);
CREATE INDEX idx_adaptive_presentation_question ON adaptive_question_presentations(question_id);
CREATE INDEX idx_adaptive_presentation_sequence ON adaptive_question_presentations(session_id, question_sequence);

-- ========================================
-- 5. ABILITY LEVEL DEFINITIONS
-- ========================================

CREATE TABLE IF NOT EXISTS ability_level_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_name VARCHAR(50) NOT NULL UNIQUE,
  min_ability_score DECIMAL(5,2) NOT NULL,
  max_ability_score DECIMAL(5,2) NOT NULL,
  display_order INTEGER NOT NULL,
  description TEXT,
  recommended_next_steps TEXT,
  badge_icon VARCHAR(255),

  CONSTRAINT check_ability_range CHECK (min_ability_score >= 0 AND max_ability_score <= 1.0)
);

-- Default Ability Levels
INSERT INTO ability_level_definitions (level_name, min_ability_score, max_ability_score, display_order, description) VALUES
  ('novice', 0.00, 0.35, 1, 'Beginner level - requires fundamental concept review'),
  ('intermediate', 0.35, 0.65, 2, 'Developing skills - ready for moderate challenges'),
  ('advanced', 0.65, 0.85, 3, 'Strong understanding - capable of complex problems'),
  ('expert', 0.85, 1.00, 4, 'Mastery level - excels at difficult challenges')
ON CONFLICT (level_name) DO NOTHING;

-- ========================================
-- 6. TRIGGERS FOR AUTO-UPDATES
-- ========================================

-- Update question difficulty metadata after each presentation
CREATE OR REPLACE FUNCTION update_question_difficulty_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE question_difficulty_metadata
  SET
    times_presented = times_presented + 1,
    times_correct = times_correct + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    avg_time_seconds = (
      COALESCE(avg_time_seconds * times_presented, 0) + NEW.time_taken_seconds
    ) / (times_presented + 1),
    updated_at = NOW()
  WHERE question_id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_difficulty
AFTER INSERT ON adaptive_question_presentations
FOR EACH ROW
EXECUTE FUNCTION update_question_difficulty_stats();

-- Update session metrics after each question answer
CREATE OR REPLACE FUNCTION update_adaptive_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE adaptive_assessment_sessions
  SET
    questions_answered = questions_answered + 1,
    questions_correct = questions_correct + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    current_streak = CASE
      WHEN NEW.is_correct THEN current_streak + 1
      ELSE 0
    END,
    max_streak = GREATEST(max_streak, CASE WHEN NEW.is_correct THEN current_streak + 1 ELSE 0 END),
    avg_time_per_question = (
      COALESCE(avg_time_per_question * questions_answered, 0) + NEW.time_taken_seconds
    ) / (questions_answered + 1),
    current_ability_estimate = NEW.ability_estimate_before + COALESCE(NEW.ability_change, 0),
    updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_adaptive_session
AFTER INSERT ON adaptive_question_presentations
FOR EACH ROW
EXECUTE FUNCTION update_adaptive_session_stats();

-- ========================================
-- 7. VIEWS FOR REPORTING
-- ========================================

-- View: Student ability progression
CREATE OR REPLACE VIEW student_ability_progression AS
SELECT
  s.id AS session_id,
  s.user_id,
  s.assessment_id,
  s.questions_answered,
  s.overall_accuracy,
  s.current_ability_estimate,
  s.ability_confidence,
  s.final_ability_level,
  a.level_name AS recommended_level,
  a.description AS level_description
FROM adaptive_assessment_sessions s
LEFT JOIN ability_level_definitions a
  ON s.current_ability_estimate >= a.min_ability_score
  AND s.current_ability_estimate < a.max_ability_score
WHERE s.status = 'in_progress' OR s.status = 'completed';

-- View: Question performance analysis
CREATE OR REPLACE VIEW question_performance_analysis AS
SELECT
  q.id AS question_id,
  q.question_text,
  m.difficulty_level,
  m.difficulty_score,
  m.times_presented,
  m.times_correct,
  m.historical_accuracy,
  m.avg_time_seconds,
  m.discrimination_param,
  COUNT(DISTINCT p.session_id) AS unique_students_attempted
FROM questions q
JOIN question_difficulty_metadata m ON q.id = m.question_id
LEFT JOIN adaptive_question_presentations p ON q.id = p.question_id
GROUP BY q.id, q.question_text, m.difficulty_level, m.difficulty_score,
         m.times_presented, m.times_correct, m.historical_accuracy,
         m.avg_time_seconds, m.discrimination_param;

-- ========================================
-- 8. HELPER FUNCTIONS
-- ========================================

-- Function: Get next question based on current ability
CREATE OR REPLACE FUNCTION get_next_adaptive_question(
  p_session_id UUID,
  p_target_difficulty DECIMAL(5,2)
)
RETURNS UUID AS $$
DECLARE
  v_question_id UUID;
  v_assessment_id UUID;
  v_already_seen UUID[];
BEGIN
  -- Get assessment and already answered questions
  SELECT assessment_id INTO v_assessment_id
  FROM adaptive_assessment_sessions
  WHERE id = p_session_id;

  SELECT ARRAY_AGG(question_id) INTO v_already_seen
  FROM adaptive_question_presentations
  WHERE session_id = p_session_id;

  -- Select question closest to target difficulty, not yet seen
  SELECT qm.question_id INTO v_question_id
  FROM question_difficulty_metadata qm
  WHERE qm.assessment_id = v_assessment_id
    AND (v_already_seen IS NULL OR qm.question_id != ALL(v_already_seen))
  ORDER BY ABS(qm.difficulty_score - p_target_difficulty), RANDOM()
  LIMIT 1;

  RETURN v_question_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Adaptive Assessment System - Real-time difficulty adjustment based on student performance';
