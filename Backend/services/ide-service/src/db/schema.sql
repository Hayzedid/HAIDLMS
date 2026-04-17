-- TechLearn IDE Service Schema

-- ── Enums ──────────────────────────────────────────────────────────────────
CREATE TYPE execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'timeout', 'error');
CREATE TYPE language_type AS ENUM ('python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'csharp');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'grading', 'passed', 'failed');

-- ── Code Submissions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,  -- References users from auth-service
  lesson_id         UUID NOT NULL,  -- References lessons from course-service
  course_id         UUID NOT NULL,  -- Denormalized for quick queries

  -- Code content
  code              TEXT NOT NULL,
  language          language_type NOT NULL,
  file_name         VARCHAR(255),

  -- Submission details
  status            submission_status NOT NULL DEFAULT 'draft',
  score             DECIMAL(5,2),  -- 0-100
  passed            BOOLEAN,
  attempt_number    INT NOT NULL DEFAULT 1,

  -- Execution results
  stdout            TEXT,
  stderr            TEXT,
  execution_time_ms INT,
  memory_used_kb    INT,
  exit_code         INT,

  -- Test results
  tests_passed      INT DEFAULT 0,
  tests_failed      INT DEFAULT 0,
  tests_total       INT DEFAULT 0,
  test_results      JSONB,  -- Detailed test results

  -- Metadata
  submitted_at      TIMESTAMPTZ,
  graded_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Code Executions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id     UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,

  -- Execution details
  language          language_type NOT NULL,
  code              TEXT NOT NULL,
  stdin             TEXT,

  -- Status
  status            execution_status NOT NULL DEFAULT 'pending',

  -- Results
  stdout            TEXT,
  stderr            TEXT,
  execution_time_ms INT,
  memory_used_kb    INT,
  exit_code         INT,
  error_message     TEXT,

  -- Container details
  container_id      VARCHAR(255),
  image_name        VARCHAR(255),

  -- Limits applied
  timeout_ms        INT NOT NULL DEFAULT 30000,  -- 30 seconds default
  memory_limit_mb   INT NOT NULL DEFAULT 256,    -- 256MB default

  -- Timestamps
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Test Cases ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id         UUID NOT NULL,  -- References lessons from course-service

  -- Test details
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  display_order     INT NOT NULL DEFAULT 0,

  -- Input/Output
  stdin             TEXT,
  expected_stdout   TEXT,
  expected_stderr   TEXT,
  expected_exit_code INT DEFAULT 0,

  -- Validation settings
  is_hidden         BOOLEAN NOT NULL DEFAULT false,  -- Hidden tests not shown to students
  ignore_whitespace BOOLEAN NOT NULL DEFAULT true,
  ignore_case       BOOLEAN NOT NULL DEFAULT false,
  timeout_ms        INT DEFAULT 5000,
  points            INT DEFAULT 10,

  -- Metadata
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Keystroke Data ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS keystroke_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id     UUID REFERENCES code_submissions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  lesson_id         UUID NOT NULL,

  -- Session info
  session_id        UUID NOT NULL,

  -- Keystroke events (stored as JSONB array)
  keystrokes        JSONB NOT NULL,  -- [{timestamp, key, type: 'press'|'delete', position}]

  -- Aggregated metrics
  total_keystrokes  INT,
  total_deletes     INT,
  typing_speed_wpm  DECIMAL(5,2),
  pause_count       INT,  -- Number of pauses > 5 seconds

  -- Session duration
  session_start     TIMESTAMPTZ NOT NULL,
  session_end       TIMESTAMPTZ,
  duration_seconds  INT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Plagiarism Reports ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plagiarism_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id     UUID NOT NULL REFERENCES code_submissions(id) ON DELETE CASCADE,

  -- MOSS results
  moss_url          VARCHAR(500),
  similarity_score  DECIMAL(5,2),  -- 0-100
  matched_submissions UUID[],  -- Array of submission IDs with high similarity

  -- Status
  is_flagged        BOOLEAN NOT NULL DEFAULT false,
  flagged_reason    TEXT,
  reviewed_by       UUID,  -- Admin who reviewed
  reviewed_at       TIMESTAMPTZ,

  -- External comparison
  external_matches  JSONB,  -- Matches from external sources

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Code Templates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS code_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id         UUID NOT NULL,
  language          language_type NOT NULL,

  -- Template code
  starter_code      TEXT NOT NULL,
  solution_code     TEXT,

  -- Files (for multi-file projects)
  files             JSONB,  -- [{name, content, language}]

  -- Test configuration
  test_command      VARCHAR(500),  -- Command to run tests
  build_command     VARCHAR(500),  -- Optional build command

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(lesson_id, language)
);

-- ── Execution Statistics ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS execution_stats (
  date              DATE NOT NULL,
  language          language_type NOT NULL,

  -- Execution counts
  total_executions  INT NOT NULL DEFAULT 0,
  successful_runs   INT NOT NULL DEFAULT 0,
  failed_runs       INT NOT NULL DEFAULT 0,
  timeout_runs      INT NOT NULL DEFAULT 0,

  -- Performance
  avg_execution_ms  INT,
  max_execution_ms  INT,
  avg_memory_kb     INT,
  max_memory_kb     INT,

  -- Resources
  total_cpu_seconds DECIMAL(10,2),

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (date, language)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

-- Code Submissions
CREATE INDEX idx_submissions_user_id ON code_submissions(user_id);
CREATE INDEX idx_submissions_lesson_id ON code_submissions(lesson_id);
CREATE INDEX idx_submissions_course_id ON code_submissions(course_id);
CREATE INDEX idx_submissions_status ON code_submissions(status);
CREATE INDEX idx_submissions_user_lesson ON code_submissions(user_id, lesson_id);
CREATE INDEX idx_submissions_submitted_at ON code_submissions(submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Code Executions
CREATE INDEX idx_executions_submission_id ON code_executions(submission_id);
CREATE INDEX idx_executions_user_id ON code_executions(user_id);
CREATE INDEX idx_executions_status ON code_executions(status);
CREATE INDEX idx_executions_created_at ON code_executions(created_at DESC);
CREATE INDEX idx_executions_container_id ON code_executions(container_id) WHERE container_id IS NOT NULL;

-- Test Cases
CREATE INDEX idx_test_cases_lesson_id ON test_cases(lesson_id);
CREATE INDEX idx_test_cases_active ON test_cases(lesson_id, is_active) WHERE is_active = true;
CREATE INDEX idx_test_cases_order ON test_cases(lesson_id, display_order);

-- Keystroke Data
CREATE INDEX idx_keystrokes_submission_id ON keystroke_data(submission_id);
CREATE INDEX idx_keystrokes_user_id ON keystroke_data(user_id);
CREATE INDEX idx_keystrokes_lesson_id ON keystroke_data(lesson_id);
CREATE INDEX idx_keystrokes_session_id ON keystroke_data(session_id);

-- Plagiarism Reports
CREATE INDEX idx_plagiarism_submission_id ON plagiarism_reports(submission_id);
CREATE INDEX idx_plagiarism_flagged ON plagiarism_reports(is_flagged) WHERE is_flagged = true;

-- Code Templates
CREATE INDEX idx_templates_lesson_id ON code_templates(lesson_id);
CREATE INDEX idx_templates_lesson_language ON code_templates(lesson_id, language);

-- ── Triggers ───────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON code_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON code_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update execution statistics
CREATE OR REPLACE FUNCTION update_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' OR NEW.status = 'failed' OR NEW.status = 'timeout' THEN
    INSERT INTO execution_stats (
      date,
      language,
      total_executions,
      successful_runs,
      failed_runs,
      timeout_runs,
      avg_execution_ms,
      max_execution_ms,
      avg_memory_kb,
      max_memory_kb
    )
    VALUES (
      CURRENT_DATE,
      NEW.language,
      1,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'timeout' THEN 1 ELSE 0 END,
      NEW.execution_time_ms,
      NEW.execution_time_ms,
      NEW.memory_used_kb,
      NEW.memory_used_kb
    )
    ON CONFLICT (date, language) DO UPDATE SET
      total_executions = execution_stats.total_executions + 1,
      successful_runs = execution_stats.successful_runs + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      failed_runs = execution_stats.failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      timeout_runs = execution_stats.timeout_runs + CASE WHEN NEW.status = 'timeout' THEN 1 ELSE 0 END,
      avg_execution_ms = (
        (execution_stats.avg_execution_ms * execution_stats.total_executions + COALESCE(NEW.execution_time_ms, 0)) /
        (execution_stats.total_executions + 1)
      ),
      max_execution_ms = GREATEST(execution_stats.max_execution_ms, NEW.execution_time_ms),
      avg_memory_kb = (
        (execution_stats.avg_memory_kb * execution_stats.total_executions + COALESCE(NEW.memory_used_kb, 0)) /
        (execution_stats.total_executions + 1)
      ),
      max_memory_kb = GREATEST(execution_stats.max_memory_kb, NEW.memory_used_kb),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_execution_stats_trigger
AFTER UPDATE ON code_executions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_execution_stats();
