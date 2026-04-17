-- Code Explain / Viva Mode Schema
-- Async video explanation system for code submissions

-- Enums
CREATE TYPE viva_request_status AS ENUM (
  'pending',        -- Request sent, awaiting student response
  'submitted',      -- Student submitted video
  'under_review',   -- Instructor reviewing
  'graded',         -- Grading complete
  'expired',        -- Student didn't submit in time
  'waived'          -- Instructor waived requirement
);

CREATE TYPE viva_selection_type AS ENUM (
  'random',         -- Random selection from class
  'flagged',        -- Flagged for plagiarism/integrity concerns
  'all',            -- All students must explain
  'manual'          -- Manually selected by instructor
);

-- =============================================================================
-- VIVA REQUESTS
-- =============================================================================

-- Viva requests - instructor requests student to explain code
CREATE TABLE viva_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  submission_id         UUID NOT NULL,  -- code_submissions.id
  user_id               UUID NOT NULL,  -- Student who must explain
  assessment_id         UUID NOT NULL,
  problem_id            UUID NOT NULL,
  requested_by          UUID NOT NULL,  -- Instructor who requested

  -- Request details
  selection_type        viva_selection_type NOT NULL,
  reason                TEXT,           -- Why this student was selected
  instructions          TEXT,           -- Custom instructions from instructor

  -- Timing
  requested_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at                TIMESTAMP NOT NULL,  -- Deadline for submission
  submitted_at          TIMESTAMP,
  reviewed_at           TIMESTAMP,

  -- Status
  status                viva_request_status NOT NULL DEFAULT 'pending',

  -- Student submission
  video_url             TEXT,           -- S3 URL to video explanation
  video_duration_seconds INT,
  video_transcript      TEXT,          -- Auto-generated transcript (optional)
  student_notes         TEXT,          -- Additional notes from student

  -- Instructor review
  reviewed_by           UUID,
  explanation_score     DECIMAL(5,2),  -- 0-100
  comprehension_level   VARCHAR(20),   -- 'poor', 'fair', 'good', 'excellent'
  review_notes          TEXT,
  authenticity_verified BOOLEAN,       -- Did student actually write this?

  -- Flags
  is_late               BOOLEAN DEFAULT false,
  is_incomplete         BOOLEAN DEFAULT false,
  requires_resubmit     BOOLEAN DEFAULT false,

  -- Metadata
  metadata              JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW(),

  UNIQUE(submission_id)  -- One viva per submission
);

CREATE INDEX idx_viva_requests_user ON viva_requests(user_id);
CREATE INDEX idx_viva_requests_assessment ON viva_requests(assessment_id);
CREATE INDEX idx_viva_requests_status ON viva_requests(status);
CREATE INDEX idx_viva_requests_due ON viva_requests(due_at) WHERE status = 'pending';
CREATE INDEX idx_viva_requests_requested_by ON viva_requests(requested_by);

-- =============================================================================
-- VIVA SELECTION RULES
-- =============================================================================

-- Rules for automatic viva selection
CREATE TABLE viva_selection_rules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Scope
  instructor_id         UUID NOT NULL,
  assessment_id         UUID,          -- Specific assessment or NULL for all
  course_id             UUID,          -- Course-level rule

  -- Rule configuration
  is_active             BOOLEAN NOT NULL DEFAULT true,
  selection_type        viva_selection_type NOT NULL,

  -- Random selection
  random_percentage     DECIMAL(5,2),  -- e.g., 20.00 = 20% of students
  random_min_count      INT,           -- Minimum students to select
  random_max_count      INT,           -- Maximum students to select

  -- Flagged selection
  plagiarism_threshold  DECIMAL(5,4),  -- Select if similarity > threshold
  low_quality_threshold DECIMAL(5,2),  -- Select if code quality < threshold

  -- Timing
  trigger_on            VARCHAR(50) NOT NULL DEFAULT 'submission',  -- 'submission', 'grading', 'manual'
  deadline_hours        INT NOT NULL DEFAULT 48,  -- Hours after submission

  -- Instructions template
  instructions_template TEXT,

  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_viva_rules_instructor ON viva_selection_rules(instructor_id);
CREATE INDEX idx_viva_rules_assessment ON viva_selection_rules(assessment_id);
CREATE INDEX idx_viva_rules_active ON viva_selection_rules(is_active) WHERE is_active = true;

-- =============================================================================
-- VIVA NOTIFICATIONS
-- =============================================================================

-- Track notification attempts
CREATE TABLE viva_notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viva_request_id       UUID REFERENCES viva_requests(id) ON DELETE CASCADE,

  -- Notification details
  notification_type     VARCHAR(50) NOT NULL,  -- 'request', 'reminder', 'overdue', 'graded'
  channel               VARCHAR(50) NOT NULL,  -- 'email', 'in_app', 'slack'

  -- Status
  sent_at               TIMESTAMP,
  delivered_at          TIMESTAMP,
  opened_at             TIMESTAMP,

  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_viva_notifications_request ON viva_notifications(viva_request_id);
CREATE INDEX idx_viva_notifications_type ON viva_notifications(notification_type);

-- =============================================================================
-- VIVA REVIEW RUBRIC
-- =============================================================================

-- Rubric criteria for evaluating explanations
CREATE TABLE viva_rubric (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Scope
  instructor_id         UUID NOT NULL,
  assessment_id         UUID,          -- Specific assessment or NULL for default

  -- Rubric details
  name                  VARCHAR(255) NOT NULL,
  description           TEXT,

  -- Criteria
  criteria              JSONB NOT NULL,  -- Array of {name, description, max_points, weight}
  total_points          INT NOT NULL DEFAULT 100,

  -- Usage
  is_default            BOOLEAN DEFAULT false,
  is_active             BOOLEAN DEFAULT true,

  -- Timestamps
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_viva_rubric_instructor ON viva_rubric(instructor_id);
CREATE INDEX idx_viva_rubric_assessment ON viva_rubric(assessment_id);

-- =============================================================================
-- VIVA STATISTICS
-- =============================================================================

-- Aggregate statistics for analytics
CREATE TABLE viva_statistics (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Scope
  assessment_id         UUID NOT NULL,
  instructor_id         UUID NOT NULL,

  -- Stats
  total_requests        INT DEFAULT 0,
  total_submitted       INT DEFAULT 0,
  total_graded          INT DEFAULT 0,
  total_expired         INT DEFAULT 0,

  -- Timing
  avg_submission_hours  DECIMAL(6,2),
  avg_review_hours      DECIMAL(6,2),

  -- Quality
  avg_explanation_score DECIMAL(5,2),
  avg_video_duration    DECIMAL(6,2),

  -- Authenticity
  authenticity_verified_count INT DEFAULT 0,
  requires_resubmit_count     INT DEFAULT 0,

  -- Last update
  last_calculated_at    TIMESTAMP DEFAULT NOW(),

  UNIQUE(assessment_id)
);

CREATE INDEX idx_viva_stats_instructor ON viva_statistics(instructor_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update viva request status trigger
CREATE OR REPLACE FUNCTION update_viva_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if expired
  IF NEW.status = 'pending' AND NEW.due_at < NOW() THEN
    NEW.status = 'expired';
    NEW.is_incomplete = true;
  END IF;

  -- Check if late
  IF NEW.submitted_at IS NOT NULL AND NEW.submitted_at > NEW.due_at THEN
    NEW.is_late = true;
  END IF;

  -- Update timestamps
  IF NEW.status = 'submitted' AND OLD.status = 'pending' THEN
    NEW.submitted_at = NOW();
  END IF;

  IF NEW.status = 'graded' AND OLD.status != 'graded' THEN
    NEW.reviewed_at = NOW();
  END IF;

  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viva_request_status_update
  BEFORE UPDATE ON viva_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_viva_status();

-- Update viva statistics trigger
CREATE OR REPLACE FUNCTION update_viva_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert statistics
  INSERT INTO viva_statistics (assessment_id, instructor_id)
  VALUES (NEW.assessment_id, NEW.requested_by)
  ON CONFLICT (assessment_id) DO NOTHING;

  -- Recalculate stats
  UPDATE viva_statistics
  SET
    total_requests = (
      SELECT COUNT(*) FROM viva_requests WHERE assessment_id = NEW.assessment_id
    ),
    total_submitted = (
      SELECT COUNT(*) FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND status IN ('submitted', 'under_review', 'graded')
    ),
    total_graded = (
      SELECT COUNT(*) FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND status = 'graded'
    ),
    total_expired = (
      SELECT COUNT(*) FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND status = 'expired'
    ),
    avg_submission_hours = (
      SELECT AVG(EXTRACT(EPOCH FROM (submitted_at - requested_at)) / 3600)
      FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND submitted_at IS NOT NULL
    ),
    avg_explanation_score = (
      SELECT AVG(explanation_score)
      FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND explanation_score IS NOT NULL
    ),
    authenticity_verified_count = (
      SELECT COUNT(*) FROM viva_requests
      WHERE assessment_id = NEW.assessment_id AND authenticity_verified = true
    ),
    last_calculated_at = NOW()
  WHERE assessment_id = NEW.assessment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER viva_statistics_update
  AFTER INSERT OR UPDATE ON viva_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_viva_statistics();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Pending viva requests (for student dashboard)
CREATE OR REPLACE VIEW pending_viva_requests AS
SELECT
  vr.*,
  cs.code,
  cs.language,
  cs.file_name,
  cs.plagiarism_status,
  EXTRACT(EPOCH FROM (vr.due_at - NOW())) / 3600 AS hours_remaining
FROM viva_requests vr
JOIN code_submissions cs ON cs.id = vr.submission_id
WHERE vr.status = 'pending' AND vr.due_at > NOW()
ORDER BY vr.due_at ASC;

-- Vivas needing review (for instructor dashboard)
CREATE OR REPLACE VIEW vivas_needing_review AS
SELECT
  vr.*,
  cs.code,
  cs.language,
  cs.file_name,
  cs.plagiarism_status,
  EXTRACT(EPOCH FROM (NOW() - vr.submitted_at)) / 3600 AS hours_since_submission
FROM viva_requests vr
JOIN code_submissions cs ON cs.id = vr.submission_id
WHERE vr.status IN ('submitted', 'under_review')
ORDER BY vr.submitted_at ASC;

-- Overdue viva requests
CREATE OR REPLACE VIEW overdue_viva_requests AS
SELECT
  vr.*,
  cs.code,
  cs.language,
  cs.file_name,
  EXTRACT(EPOCH FROM (NOW() - vr.due_at)) / 3600 AS hours_overdue
FROM viva_requests vr
JOIN code_submissions cs ON cs.id = vr.submission_id
WHERE vr.status = 'pending' AND vr.due_at < NOW()
ORDER BY vr.due_at ASC;
