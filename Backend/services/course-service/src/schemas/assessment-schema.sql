-- ============================================================================
-- ASSESSMENT & QUIZ ENGINE SCHEMA
-- ============================================================================
-- Comprehensive assessment system with multiple question types, question banks,
-- timed assessments, randomization, proctoring, and automated grading
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Association
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Assessment type
  assessment_type VARCHAR(50) DEFAULT 'quiz', -- 'quiz', 'test', 'exam', 'assignment', 'practice'

  -- Creator
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scheduling
  available_from TIMESTAMP,
  available_until TIMESTAMP,

  -- Time settings
  time_limit_minutes INTEGER, -- NULL for untimed
  extra_time_minutes INTEGER DEFAULT 0, -- For accommodations

  -- Attempt settings
  max_attempts INTEGER, -- NULL for unlimited
  attempts_allowed_per_day INTEGER,
  require_sequential BOOLEAN DEFAULT false, -- Must answer in order

  -- Randomization
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  random_question_count INTEGER, -- Pick N random questions, NULL for all

  -- Display settings
  show_results_immediately BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  show_feedback BOOLEAN DEFAULT true,
  one_question_per_page BOOLEAN DEFAULT false,

  -- Scoring
  passing_score NUMERIC(5,2), -- Percentage (0-100)
  total_points NUMERIC(10,2) DEFAULT 0,
  weight_in_course NUMERIC(5,2), -- Percentage weight in final grade

  -- Proctoring
  enable_proctoring BOOLEAN DEFAULT false,
  require_webcam BOOLEAN DEFAULT false,
  require_screen_recording BOOLEAN DEFAULT false,
  lockdown_browser BOOLEAN DEFAULT false,
  detect_tab_switching BOOLEAN DEFAULT false,

  -- Anti-cheating
  prevent_copy_paste BOOLEAN DEFAULT false,
  disable_right_click BOOLEAN DEFAULT false,
  randomize_per_student BOOLEAN DEFAULT false,

  -- Access control
  password VARCHAR(255),
  require_approval BOOLEAN DEFAULT false,
  allowed_ip_addresses TEXT[], -- IP whitelist

  -- Grading
  auto_grade BOOLEAN DEFAULT true,
  manual_grading_required BOOLEAN DEFAULT false,
  grade_released BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  is_practice BOOLEAN DEFAULT false, -- Practice mode (doesn't count toward grade)

  -- Statistics
  total_questions INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  average_score NUMERIC(5,2),
  pass_rate NUMERIC(5,2),

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_assessments_module ON assessments(module_id);
CREATE INDEX idx_assessments_lesson ON assessments(lesson_id);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);

-- ============================================================================
-- QUESTION BANKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Access
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[], -- Array of user IDs

  -- Category
  category VARCHAR(100),
  subject VARCHAR(100),
  difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard'

  -- Statistics
  total_questions INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_banks_created_by ON question_banks(created_by);
CREATE INDEX idx_question_banks_organization ON question_banks(organization_id);
CREATE INDEX idx_question_banks_category ON question_banks(category);

-- ============================================================================
-- QUESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Association
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  question_bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,

  -- Question content
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching', 'code'

  -- Display order
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Points
  points NUMERIC(10,2) DEFAULT 1,

  -- Difficulty
  difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard'

  -- Rich content
  image_url TEXT,
  video_url TEXT,
  code_snippet TEXT,
  code_language VARCHAR(50), -- 'javascript', 'python', 'java', etc.

  -- Answer configuration (for objective questions)
  correct_answer TEXT, -- Single correct answer for short_answer, true_false, fill_blank
  correct_answers TEXT[], -- Multiple correct answers
  case_sensitive BOOLEAN DEFAULT false,

  -- Matching questions
  matching_pairs JSONB, -- [{left: 'A', right: '1'}, ...]

  -- Code questions
  test_cases JSONB, -- [{input: '...', expected_output: '...', points: 5}, ...]
  starter_code TEXT,
  solution_code TEXT,

  -- Feedback
  general_feedback TEXT, -- Shown after answering
  correct_feedback TEXT, -- Shown when correct
  incorrect_feedback TEXT, -- Shown when incorrect
  hint TEXT,

  -- Settings
  allow_partial_credit BOOLEAN DEFAULT false,
  required BOOLEAN DEFAULT true,

  -- Metadata
  tags TEXT[],
  learning_objective VARCHAR(255),
  bloom_taxonomy_level VARCHAR(50), -- 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_assessment ON questions(assessment_id);
CREATE INDEX idx_questions_bank ON questions(question_bank_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_order ON questions(assessment_id, order_index);

-- ============================================================================
-- QUESTION OPTIONS (for MCQ)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  option_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,

  is_correct BOOLEAN DEFAULT false,

  -- Feedback for this specific option
  feedback TEXT,

  -- For weighted partial credit
  points NUMERIC(10,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_options_question ON question_options(question_id);
CREATE INDEX idx_question_options_order ON question_options(question_id, order_index);

-- ============================================================================
-- ASSESSMENT ATTEMPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt number
  attempt_number INTEGER NOT NULL DEFAULT 1,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  time_spent_seconds INTEGER, -- Actual time spent

  -- Status
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'graded', 'abandoned'

  -- Scoring
  score NUMERIC(10,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN,

  -- Points
  points_earned NUMERIC(10,2) DEFAULT 0,
  points_possible NUMERIC(10,2),

  -- Grading
  auto_graded BOOLEAN DEFAULT false,
  manually_graded BOOLEAN DEFAULT false,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP,

  -- Feedback
  instructor_feedback TEXT,

  -- Proctoring data
  proctoring_data JSONB, -- Stores proctoring events, flags, recordings
  tab_switches INTEGER DEFAULT 0,
  suspicious_activity_count INTEGER DEFAULT 0,
  flagged_for_review BOOLEAN DEFAULT false,

  -- IP and device
  ip_address INET,
  user_agent TEXT,

  -- Question order (if randomized)
  question_order UUID[], -- Array of question IDs in the order shown

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_status ON assessment_attempts(status);
CREATE INDEX idx_assessment_attempts_submitted ON assessment_attempts(submitted_at);
CREATE UNIQUE INDEX idx_assessment_attempts_unique ON assessment_attempts(assessment_id, user_id, attempt_number);

-- ============================================================================
-- ASSESSMENT ANSWERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Answer data
  answer_text TEXT, -- For short answer, essay
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL, -- For single choice
  selected_option_ids UUID[], -- For multiple choice
  matching_pairs JSONB, -- For matching questions
  code_answer TEXT, -- For code questions
  file_attachments TEXT[], -- URLs to uploaded files

  -- Timing
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP DEFAULT NOW(),

  -- Scoring
  is_correct BOOLEAN,
  points_earned NUMERIC(10,2) DEFAULT 0,
  points_possible NUMERIC(10,2),

  -- Grading
  auto_graded BOOLEAN DEFAULT false,
  manually_graded BOOLEAN DEFAULT false,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP,

  -- Feedback
  feedback TEXT,

  -- Code execution results
  code_execution_results JSONB, -- Test case results for code questions

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_answers_attempt ON assessment_answers(attempt_id);
CREATE INDEX idx_assessment_answers_question ON assessment_answers(question_id);
CREATE UNIQUE INDEX idx_assessment_answers_unique ON assessment_answers(attempt_id, question_id);

-- ============================================================================
-- PROCTORING EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proctoring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL, -- 'tab_switch', 'window_blur', 'copy', 'paste', 'screenshot', 'face_not_detected', 'multiple_faces'
  event_data JSONB, -- Additional event-specific data

  severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high'

  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proctoring_events_attempt ON proctoring_events(attempt_id);
CREATE INDEX idx_proctoring_events_type ON proctoring_events(event_type);
CREATE INDEX idx_proctoring_events_timestamp ON proctoring_events(timestamp);

-- ============================================================================
-- ASSESSMENT FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  given_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  feedback_type VARCHAR(50) DEFAULT 'general', -- 'general', 'question_specific', 'improvement_areas'
  feedback_text TEXT NOT NULL,

  -- Attachments
  attachments TEXT[], -- URLs to uploaded files

  -- Visibility
  visible_to_student BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_feedback_attempt ON assessment_feedback(attempt_id);
CREATE INDEX idx_assessment_feedback_given_by ON assessment_feedback(given_by);

-- ============================================================================
-- ASSESSMENT ACCOMMODATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Time accommodations
  extra_time_minutes INTEGER DEFAULT 0,
  extra_attempts INTEGER DEFAULT 0,

  -- Other accommodations
  allow_notes BOOLEAN DEFAULT false,
  allow_calculator BOOLEAN DEFAULT false,
  read_aloud BOOLEAN DEFAULT false,
  large_text BOOLEAN DEFAULT false,

  -- Notes
  reason TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(assessment_id, user_id)
);

CREATE INDEX idx_assessment_accommodations_assessment ON assessment_accommodations(assessment_id);
CREATE INDEX idx_assessment_accommodations_user ON assessment_accommodations(user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Assessment summary view
CREATE OR REPLACE VIEW assessment_summary AS
SELECT
  a.id,
  a.title,
  a.assessment_type,
  a.course_id,
  c.title as course_title,
  a.total_questions,
  a.total_points,
  a.passing_score,
  a.time_limit_minutes,
  a.status,
  a.total_attempts,
  a.average_score,
  a.pass_rate,
  u.name as creator_name,
  COUNT(DISTINCT aa.user_id) as unique_students,
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'graded') as completed_attempts
FROM assessments a
JOIN users u ON a.created_by = u.id
LEFT JOIN courses c ON a.course_id = c.id
LEFT JOIN assessment_attempts aa ON a.id = aa.assessment_id
GROUP BY a.id, u.name, c.title;

-- Student assessment results view
CREATE OR REPLACE VIEW student_assessment_results AS
SELECT
  aa.id as attempt_id,
  aa.assessment_id,
  a.title as assessment_title,
  a.assessment_type,
  aa.user_id,
  u.name as student_name,
  u.email as student_email,
  aa.attempt_number,
  aa.started_at,
  aa.submitted_at,
  aa.time_spent_seconds,
  aa.status,
  aa.score,
  aa.percentage,
  aa.passed,
  aa.points_earned,
  aa.points_possible,
  a.passing_score,
  aa.flagged_for_review,
  aa.tab_switches,
  aa.suspicious_activity_count
FROM assessment_attempts aa
JOIN assessments a ON aa.assessment_id = a.id
JOIN users u ON aa.user_id = u.id;

-- Question analytics view
CREATE OR REPLACE VIEW question_analytics AS
SELECT
  q.id as question_id,
  q.question_text,
  q.question_type,
  q.points,
  q.assessment_id,
  a.title as assessment_title,
  COUNT(DISTINCT ans.id) as total_answers,
  COUNT(DISTINCT ans.id) FILTER (WHERE ans.is_correct = true) as correct_answers,
  CASE
    WHEN COUNT(DISTINCT ans.id) > 0
    THEN (COUNT(DISTINCT ans.id) FILTER (WHERE ans.is_correct = true)::NUMERIC / COUNT(DISTINCT ans.id) * 100)
    ELSE 0
  END as success_rate,
  AVG(ans.time_spent_seconds) as avg_time_seconds,
  AVG(ans.points_earned) as avg_points_earned
FROM questions q
JOIN assessments a ON q.assessment_id = a.id
LEFT JOIN assessment_answers ans ON q.id = ans.question_id
GROUP BY q.id, a.title;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_score(p_attempt_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_points NUMERIC;
  v_earned_points NUMERIC;
  v_percentage NUMERIC;
BEGIN
  -- Get total points earned and possible
  SELECT
    SUM(points_earned),
    SUM(points_possible)
  INTO v_earned_points, v_total_points
  FROM assessment_answers
  WHERE attempt_id = p_attempt_id;

  -- Calculate percentage
  IF v_total_points > 0 THEN
    v_percentage := (v_earned_points / v_total_points) * 100;
  ELSE
    v_percentage := 0;
  END IF;

  -- Update attempt
  UPDATE assessment_attempts
  SET score = v_earned_points,
      points_earned = v_earned_points,
      points_possible = v_total_points,
      percentage = v_percentage,
      passed = v_percentage >= (
        SELECT passing_score FROM assessments WHERE id = (
          SELECT assessment_id FROM assessment_attempts WHERE id = p_attempt_id
        )
      )
  WHERE id = p_attempt_id;

  RETURN v_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to submit assessment attempt
CREATE OR REPLACE FUNCTION submit_assessment_attempt(p_attempt_id UUID)
RETURNS void AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_time_spent INTEGER;
BEGIN
  SELECT started_at INTO v_start_time
  FROM assessment_attempts
  WHERE id = p_attempt_id;

  v_time_spent := EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER;

  UPDATE assessment_attempts
  SET status = 'submitted',
      submitted_at = NOW(),
      time_spent_seconds = v_time_spent
  WHERE id = p_attempt_id;

  -- Auto-grade if possible
  PERFORM auto_grade_attempt(p_attempt_id);

  -- Update assessment statistics
  UPDATE assessments
  SET total_attempts = total_attempts + 1
  WHERE id = (SELECT assessment_id FROM assessment_attempts WHERE id = p_attempt_id);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-grade objective questions
CREATE OR REPLACE FUNCTION auto_grade_attempt(p_attempt_id UUID)
RETURNS void AS $$
DECLARE
  v_answer RECORD;
  v_is_correct BOOLEAN;
  v_points NUMERIC;
BEGIN
  -- Grade each answer
  FOR v_answer IN
    SELECT aa.id, aa.question_id, aa.answer_text, aa.selected_option_id, aa.selected_option_ids,
           q.question_type, q.correct_answer, q.correct_answers, q.points, q.case_sensitive
    FROM assessment_answers aa
    JOIN questions q ON aa.question_id = q.id
    WHERE aa.attempt_id = p_attempt_id
      AND q.question_type IN ('multiple_choice', 'true_false', 'short_answer', 'fill_blank')
  LOOP
    v_is_correct := false;
    v_points := 0;

    -- Check correctness based on question type
    IF v_answer.question_type = 'multiple_choice' AND v_answer.selected_option_id IS NOT NULL THEN
      SELECT is_correct INTO v_is_correct
      FROM question_options
      WHERE id = v_answer.selected_option_id;

      IF v_is_correct THEN
        v_points := v_answer.points;
      END IF;

    ELSIF v_answer.question_type = 'true_false' AND v_answer.answer_text IS NOT NULL THEN
      v_is_correct := LOWER(v_answer.answer_text) = LOWER(v_answer.correct_answer);
      IF v_is_correct THEN
        v_points := v_answer.points;
      END IF;

    ELSIF v_answer.question_type IN ('short_answer', 'fill_blank') AND v_answer.answer_text IS NOT NULL THEN
      IF v_answer.case_sensitive THEN
        v_is_correct := v_answer.answer_text = v_answer.correct_answer;
      ELSE
        v_is_correct := LOWER(v_answer.answer_text) = LOWER(v_answer.correct_answer);
      END IF;

      IF v_is_correct THEN
        v_points := v_answer.points;
      END IF;
    END IF;

    -- Update answer
    UPDATE assessment_answers
    SET is_correct = v_is_correct,
        points_earned = v_points,
        points_possible = v_answer.points,
        auto_graded = true,
        graded_at = NOW()
    WHERE id = v_answer.id;
  END LOOP;

  -- Mark attempt as auto-graded
  UPDATE assessment_attempts
  SET auto_graded = true
  WHERE id = p_attempt_id;

  -- Calculate final score
  PERFORM calculate_assessment_score(p_attempt_id);
END;
$$ LANGUAGE plpgsql;

-- Function to update assessment statistics
CREATE OR REPLACE FUNCTION update_assessment_statistics(p_assessment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE assessments
  SET average_score = (
        SELECT AVG(percentage)
        FROM assessment_attempts
        WHERE assessment_id = p_assessment_id
          AND status = 'graded'
      ),
      pass_rate = (
        SELECT (COUNT(*) FILTER (WHERE passed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100
        FROM assessment_attempts
        WHERE assessment_id = p_assessment_id
          AND status = 'graded'
      ),
      total_questions = (
        SELECT COUNT(*)
        FROM questions
        WHERE assessment_id = p_assessment_id
      ),
      total_points = (
        SELECT SUM(points)
        FROM questions
        WHERE assessment_id = p_assessment_id
      )
  WHERE id = p_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_timestamp();

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_timestamp();

CREATE TRIGGER assessment_attempts_updated_at
  BEFORE UPDATE ON assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_timestamp();

-- Update assessment statistics after grading
CREATE OR REPLACE FUNCTION trigger_update_assessment_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'graded' AND (OLD.status IS NULL OR OLD.status != 'graded') THEN
    PERFORM update_assessment_statistics(NEW.assessment_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_attempts_statistics
  AFTER UPDATE ON assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_assessment_statistics();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE assessments IS 'Quizzes, tests, exams, and assessments';
COMMENT ON TABLE questions IS 'Questions for assessments with multiple types';
COMMENT ON TABLE question_options IS 'Multiple choice options for questions';
COMMENT ON TABLE question_banks IS 'Reusable question banks';
COMMENT ON TABLE assessment_attempts IS 'Student attempts at assessments';
COMMENT ON TABLE assessment_answers IS 'Student answers to individual questions';
COMMENT ON TABLE proctoring_events IS 'Proctoring and anti-cheating event logs';
COMMENT ON TABLE assessment_feedback IS 'Instructor feedback on attempts';
COMMENT ON TABLE assessment_accommodations IS 'Special accommodations for students';
