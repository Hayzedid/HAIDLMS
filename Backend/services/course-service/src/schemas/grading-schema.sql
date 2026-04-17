-- ============================================================================
-- GRADING & RUBRICS SCHEMA
-- ============================================================================
-- Advanced grading system with rubrics, grade scales, automated calculations,
-- manual overrides, and grade history tracking
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RUBRIC TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS rubric_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Type
  rubric_type VARCHAR(50) DEFAULT 'analytic', -- 'analytic', 'holistic', 'single_point'

  -- Scoring
  max_points NUMERIC(10,2),
  use_percentage BOOLEAN DEFAULT false,

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[], -- Array of user IDs

  -- Metadata
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rubric_templates_created_by ON rubric_templates(created_by);
CREATE INDEX idx_rubric_templates_organization ON rubric_templates(organization_id);

-- ============================================================================
-- RUBRIC CRITERIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS rubric_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  rubric_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,

  -- Criterion details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,

  -- Scoring
  points NUMERIC(10,2),
  weight NUMERIC(5,2), -- Percentage weight if using weighted scoring

  -- Feedback
  feedback_prompt TEXT, -- Guide for providing feedback

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rubric_criteria_rubric ON rubric_criteria(rubric_id);
CREATE INDEX idx_rubric_criteria_order ON rubric_criteria(rubric_id, order_index);

-- ============================================================================
-- RUBRIC LEVELS (Performance Levels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rubric_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,

  -- Level details
  name VARCHAR(100) NOT NULL, -- 'Excellent', 'Good', 'Fair', 'Poor'
  description TEXT, -- What this level looks like
  order_index INTEGER DEFAULT 0,

  -- Scoring
  points NUMERIC(10,2),
  min_score NUMERIC(5,2), -- For range-based levels
  max_score NUMERIC(5,2),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rubric_levels_criterion ON rubric_levels(criterion_id);
CREATE INDEX idx_rubric_levels_order ON rubric_levels(criterion_id, order_index);

-- ============================================================================
-- ASSESSMENT RUBRICS (Link assessments to rubrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,

  -- Configuration
  is_primary BOOLEAN DEFAULT true,
  apply_to_all_questions BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(assessment_id, rubric_id)
);

CREATE INDEX idx_assessment_rubrics_assessment ON assessment_rubrics(assessment_id);
CREATE INDEX idx_assessment_rubrics_rubric ON assessment_rubrics(rubric_id);

-- ============================================================================
-- RUBRIC SCORES (Applied rubric scores for attempts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rubric_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES assessment_answers(id) ON DELETE CASCADE, -- NULL if scoring entire attempt
  rubric_id UUID NOT NULL REFERENCES rubric_templates(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  level_id UUID REFERENCES rubric_levels(id) ON DELETE SET NULL, -- NULL if custom score

  -- Scoring
  score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2),

  -- Feedback
  feedback TEXT,

  -- Grading info
  graded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  graded_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rubric_scores_attempt ON rubric_scores(attempt_id);
CREATE INDEX idx_rubric_scores_answer ON rubric_scores(answer_id);
CREATE INDEX idx_rubric_scores_rubric ON rubric_scores(rubric_id);

-- ============================================================================
-- GRADE SCALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Type
  scale_type VARCHAR(50) DEFAULT 'percentage', -- 'percentage', 'points', 'letter', 'gpa'

  -- Default scale
  is_default BOOLEAN DEFAULT false,

  -- Sharing
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grade_scales_created_by ON grade_scales(created_by);
CREATE INDEX idx_grade_scales_organization ON grade_scales(organization_id);

-- ============================================================================
-- GRADE SCALE RANGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_scale_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  scale_id UUID NOT NULL REFERENCES grade_scales(id) ON DELETE CASCADE,

  -- Range
  min_score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2) NOT NULL,

  -- Letter grade
  letter_grade VARCHAR(10), -- 'A+', 'A', 'A-', 'B+', etc.
  gpa_value NUMERIC(3,2), -- 4.0, 3.7, etc.

  -- Pass/Fail
  is_passing BOOLEAN DEFAULT true,

  -- Display
  display_name VARCHAR(50),
  color VARCHAR(20), -- For UI display

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grade_scale_ranges_scale ON grade_scale_ranges(scale_id);

-- ============================================================================
-- COURSE GRADING CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_grading_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Grade scale
  grade_scale_id UUID REFERENCES grade_scales(id) ON DELETE SET NULL,

  -- Calculation method
  calculation_method VARCHAR(50) DEFAULT 'weighted_average', -- 'weighted_average', 'points', 'highest', 'latest'

  -- Weights for different assessment types
  quiz_weight NUMERIC(5,2), -- Percentage
  test_weight NUMERIC(5,2),
  exam_weight NUMERIC(5,2),
  assignment_weight NUMERIC(5,2),
  participation_weight NUMERIC(5,2),

  -- Drop lowest
  drop_lowest_quiz INTEGER DEFAULT 0,
  drop_lowest_assignment INTEGER DEFAULT 0,

  -- Late submission penalties
  late_penalty_percentage NUMERIC(5,2),
  late_grace_period_hours INTEGER DEFAULT 24,

  -- Extra credit
  allow_extra_credit BOOLEAN DEFAULT false,
  extra_credit_cap NUMERIC(5,2), -- Max percentage points from extra credit

  -- Curve
  apply_curve BOOLEAN DEFAULT false,
  curve_method VARCHAR(50), -- 'linear', 'square_root', 'bell_curve'

  -- Display settings
  show_grades_to_students BOOLEAN DEFAULT true,
  show_statistics BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id)
);

CREATE INDEX idx_course_grading_config_course ON course_grading_config(course_id);

-- ============================================================================
-- STUDENT GRADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE, -- NULL for overall course grade
  attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE CASCADE,

  -- Grade
  score NUMERIC(10,2),
  percentage NUMERIC(5,2),
  letter_grade VARCHAR(10),
  gpa_value NUMERIC(3,2),

  -- Points
  points_earned NUMERIC(10,2),
  points_possible NUMERIC(10,2),

  -- Status
  is_passing BOOLEAN,
  is_final BOOLEAN DEFAULT false, -- True for course final grade
  is_override BOOLEAN DEFAULT false, -- True if manually overridden

  -- Grade date
  grade_date DATE,

  -- Metadata
  comments TEXT,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_grades_user ON student_grades(user_id);
CREATE INDEX idx_student_grades_course ON student_grades(course_id);
CREATE INDEX idx_student_grades_assessment ON student_grades(assessment_id);
CREATE INDEX idx_student_grades_attempt ON student_grades(attempt_id);
CREATE UNIQUE INDEX idx_student_grades_unique ON student_grades(user_id, course_id, assessment_id) WHERE assessment_id IS NOT NULL;

-- ============================================================================
-- GRADE OVERRIDES
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Original grade
  grade_id UUID NOT NULL REFERENCES student_grades(id) ON DELETE CASCADE,

  -- Override details
  original_score NUMERIC(10,2),
  override_score NUMERIC(10,2),
  reason TEXT NOT NULL,

  -- Override by
  overridden_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overridden_at TIMESTAMP DEFAULT NOW(),

  -- Approval (if required)
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grade_overrides_grade ON grade_overrides(grade_id);
CREATE INDEX idx_grade_overrides_overridden_by ON grade_overrides(overridden_by);

-- ============================================================================
-- GRADE HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  grade_id UUID NOT NULL REFERENCES student_grades(id) ON DELETE CASCADE,

  -- Changes
  field_name VARCHAR(100) NOT NULL, -- 'score', 'percentage', 'letter_grade', etc.
  old_value TEXT,
  new_value TEXT,

  -- Changed by
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grade_history_grade ON grade_history(grade_id);
CREATE INDEX idx_grade_history_created ON grade_history(created_at);

-- ============================================================================
-- GRADE COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS grade_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  grade_id UUID NOT NULL REFERENCES student_grades(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,

  -- Author
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Visibility
  visible_to_student BOOLEAN DEFAULT true,

  -- Attachments
  attachments TEXT[], -- URLs to files

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grade_comments_grade ON grade_comments(grade_id);
CREATE INDEX idx_grade_comments_author ON grade_comments(author_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Student gradebook view
CREATE OR REPLACE VIEW student_gradebook AS
SELECT
  sg.id,
  sg.user_id,
  u.name as student_name,
  u.email as student_email,
  sg.course_id,
  c.title as course_title,
  sg.assessment_id,
  a.title as assessment_title,
  a.assessment_type,
  sg.score,
  sg.percentage,
  sg.letter_grade,
  sg.gpa_value,
  sg.points_earned,
  sg.points_possible,
  sg.is_passing,
  sg.is_final,
  sg.is_override,
  sg.grade_date,
  sg.comments
FROM student_grades sg
JOIN users u ON sg.user_id = u.id
JOIN courses c ON sg.course_id = c.id
LEFT JOIN assessments a ON sg.assessment_id = a.id;

-- Course gradebook summary
CREATE OR REPLACE VIEW course_gradebook_summary AS
SELECT
  c.id as course_id,
  c.title as course_title,
  u.id as user_id,
  u.name as student_name,
  u.email as student_email,
  COUNT(DISTINCT sg.id) as total_grades,
  AVG(sg.percentage) as average_percentage,
  SUM(sg.points_earned) as total_points_earned,
  SUM(sg.points_possible) as total_points_possible,
  MAX(sg.letter_grade) FILTER (WHERE sg.is_final = true) as final_letter_grade,
  MAX(sg.gpa_value) FILTER (WHERE sg.is_final = true) as final_gpa
FROM courses c
CROSS JOIN users u
LEFT JOIN student_grades sg ON c.id = sg.course_id AND u.id = sg.user_id
GROUP BY c.id, c.title, u.id, u.name, u.email;

-- Rubric application summary
CREATE OR REPLACE VIEW rubric_application_summary AS
SELECT
  rt.id as rubric_id,
  rt.name as rubric_name,
  COUNT(DISTINCT ar.assessment_id) as assessments_using,
  COUNT(DISTINCT rs.attempt_id) as total_applications,
  AVG(rs.score) as average_score
FROM rubric_templates rt
LEFT JOIN assessment_rubrics ar ON rt.id = ar.rubric_id
LEFT JOIN rubric_scores rs ON rt.id = rs.rubric_id
GROUP BY rt.id, rt.name;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate course grade
CREATE OR REPLACE FUNCTION calculate_course_grade(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_config RECORD;
  v_total_weight NUMERIC := 0;
  v_weighted_sum NUMERIC := 0;
  v_grade NUMERIC;
BEGIN
  -- Get course grading configuration
  SELECT * INTO v_config FROM course_grading_config WHERE course_id = p_course_id;

  IF v_config IS NULL THEN
    -- No config, use simple average
    SELECT AVG(percentage) INTO v_grade
    FROM student_grades
    WHERE user_id = p_user_id AND course_id = p_course_id AND assessment_id IS NOT NULL;

    RETURN COALESCE(v_grade, 0);
  END IF;

  -- Calculate weighted average based on assessment types
  IF v_config.calculation_method = 'weighted_average' THEN
    -- Quiz weight
    IF v_config.quiz_weight > 0 THEN
      SELECT AVG(percentage) * v_config.quiz_weight / 100 INTO v_grade
      FROM student_grades sg
      JOIN assessments a ON sg.assessment_id = a.id
      WHERE sg.user_id = p_user_id
        AND sg.course_id = p_course_id
        AND a.assessment_type = 'quiz';

      v_weighted_sum := v_weighted_sum + COALESCE(v_grade, 0);
      v_total_weight := v_total_weight + v_config.quiz_weight;
    END IF;

    -- Test weight
    IF v_config.test_weight > 0 THEN
      SELECT AVG(percentage) * v_config.test_weight / 100 INTO v_grade
      FROM student_grades sg
      JOIN assessments a ON sg.assessment_id = a.id
      WHERE sg.user_id = p_user_id
        AND sg.course_id = p_course_id
        AND a.assessment_type = 'test';

      v_weighted_sum := v_weighted_sum + COALESCE(v_grade, 0);
      v_total_weight := v_total_weight + v_config.test_weight;
    END IF;

    -- Exam weight
    IF v_config.exam_weight > 0 THEN
      SELECT AVG(percentage) * v_config.exam_weight / 100 INTO v_grade
      FROM student_grades sg
      JOIN assessments a ON sg.assessment_id = a.id
      WHERE sg.user_id = p_user_id
        AND sg.course_id = p_course_id
        AND a.assessment_type = 'exam';

      v_weighted_sum := v_weighted_sum + COALESCE(v_grade, 0);
      v_total_weight := v_total_weight + v_config.exam_weight;
    END IF;

    -- Calculate final percentage
    IF v_total_weight > 0 THEN
      RETURN v_weighted_sum;
    ELSE
      RETURN 0;
    END IF;
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to apply grade scale
CREATE OR REPLACE FUNCTION apply_grade_scale(
  p_percentage NUMERIC,
  p_scale_id UUID
)
RETURNS TABLE (
  letter_grade VARCHAR,
  gpa_value NUMERIC,
  is_passing BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gsr.letter_grade,
    gsr.gpa_value,
    gsr.is_passing
  FROM grade_scale_ranges gsr
  WHERE gsr.scale_id = p_scale_id
    AND p_percentage >= gsr.min_score
    AND p_percentage <= gsr.max_score
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to record grade history
CREATE OR REPLACE FUNCTION record_grade_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO grade_history (grade_id, field_name, old_value, new_value)
    VALUES (NEW.id, 'score', OLD.score::TEXT, NEW.score::TEXT);
  END IF;

  IF OLD.percentage IS DISTINCT FROM NEW.percentage THEN
    INSERT INTO grade_history (grade_id, field_name, old_value, new_value)
    VALUES (NEW.id, 'percentage', OLD.percentage::TEXT, NEW.percentage::TEXT);
  END IF;

  IF OLD.letter_grade IS DISTINCT FROM NEW.letter_grade THEN
    INSERT INTO grade_history (grade_id, field_name, old_value, new_value)
    VALUES (NEW.id, 'letter_grade', OLD.letter_grade, NEW.letter_grade);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_grades_history
  AFTER UPDATE ON student_grades
  FOR EACH ROW
  EXECUTE FUNCTION record_grade_change();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_grading_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rubric_templates_updated_at
  BEFORE UPDATE ON rubric_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_grading_timestamp();

CREATE TRIGGER student_grades_updated_at
  BEFORE UPDATE ON student_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_grading_timestamp();

CREATE TRIGGER course_grading_config_updated_at
  BEFORE UPDATE ON course_grading_config
  FOR EACH ROW
  EXECUTE FUNCTION update_grading_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE rubric_templates IS 'Reusable rubric templates for grading';
COMMENT ON TABLE rubric_criteria IS 'Criteria/dimensions for rubrics';
COMMENT ON TABLE rubric_levels IS 'Performance levels for each criterion';
COMMENT ON TABLE rubric_scores IS 'Applied rubric scores for student work';
COMMENT ON TABLE grade_scales IS 'Grade scale definitions (letter grades, GPA)';
COMMENT ON TABLE grade_scale_ranges IS 'Ranges for grade scales';
COMMENT ON TABLE course_grading_config IS 'Course-level grading configuration';
COMMENT ON TABLE student_grades IS 'Student grades for assessments and courses';
COMMENT ON TABLE grade_overrides IS 'Manual grade overrides with reasons';
COMMENT ON TABLE grade_history IS 'Audit trail of grade changes';
COMMENT ON TABLE grade_comments IS 'Instructor comments on grades';
