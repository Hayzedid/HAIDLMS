-- Peer Code Review System Schema
-- Enables rubric-based peer reviews with MOSS cross-checking for collusion

-- Review Rubrics (Instructor-defined criteria)
CREATE TABLE IF NOT EXISTS review_rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL,
  assessment_id UUID,
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Settings
  min_reviews_required INT DEFAULT 2, -- Number of peer reviews before submission acceptance
  allow_self_review BOOLEAN DEFAULT false,
  anonymize_reviewers BOOLEAN DEFAULT true,
  anonymize_code_authors BOOLEAN DEFAULT false,

  -- Deadlines
  submission_deadline TIMESTAMP,
  review_deadline TIMESTAMP,

  -- MOSS integration
  run_moss_check BOOLEAN DEFAULT true, -- Check for collusion between reviewers
  moss_similarity_threshold DECIMAL(5,4) DEFAULT 0.75,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rubric Criteria (Individual evaluation dimensions)
CREATE TABLE IF NOT EXISTS rubric_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID NOT NULL REFERENCES review_rubrics(id) ON DELETE CASCADE,

  -- Criteria details
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  weight DECIMAL(5,2) DEFAULT 1.0, -- Relative weight in final score

  -- Rating scale
  max_score INT NOT NULL DEFAULT 5, -- e.g., 5-point scale
  score_labels JSONB, -- { "1": "Poor", "2": "Fair", "3": "Good", "4": "Very Good", "5": "Excellent" }

  -- Guidance
  examples TEXT, -- Examples of what each score level looks like
  is_required BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Code Reviews (Individual review instances)
CREATE TABLE IF NOT EXISTS code_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID NOT NULL REFERENCES review_rubrics(id),

  -- Participants
  submission_id UUID NOT NULL, -- Code submission being reviewed
  author_id UUID NOT NULL, -- Student who wrote the code
  reviewer_id UUID NOT NULL, -- Student doing the review

  -- Review details
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'disputed', 'resolved'
  overall_score DECIMAL(5,2), -- Calculated from criterion scores
  overall_feedback TEXT,

  -- Time tracking
  started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  time_spent_seconds INT,

  -- Collusion detection
  is_flagged_for_collusion BOOLEAN DEFAULT false,
  collusion_similarity_score DECIMAL(5,4), -- MOSS similarity with reviewed code
  collusion_check_run_at TIMESTAMP,

  -- Quality control
  is_helpful BOOLEAN, -- Author's feedback on review quality
  instructor_override_score DECIMAL(5,2),
  instructor_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(submission_id, reviewer_id) -- One review per reviewer per submission
);

-- Review Criterion Scores (Individual scores for each criterion)
CREATE TABLE IF NOT EXISTS review_criterion_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES rubric_criteria(id),

  -- Score
  score INT NOT NULL,
  feedback TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(review_id, criterion_id)
);

-- Review Comments (Line-by-line feedback)
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,

  -- Location
  file_name VARCHAR(255),
  line_number INT NOT NULL,
  line_end_number INT, -- For multi-line comments
  code_snippet TEXT, -- The code being commented on

  -- Comment
  comment TEXT NOT NULL,
  comment_type VARCHAR(50), -- 'suggestion', 'question', 'praise', 'issue', 'critical'
  severity VARCHAR(20), -- 'low', 'medium', 'high' (for issues)

  -- Author response
  author_response TEXT,
  is_resolved BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Review Assignments (Manages who reviews whom)
CREATE TABLE IF NOT EXISTS review_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID NOT NULL REFERENCES review_rubrics(id),

  -- Assignment
  submission_id UUID NOT NULL,
  author_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'completed'
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Deadline
  due_at TIMESTAMP NOT NULL,

  -- Notifications
  reminder_sent_at TIMESTAMP,
  overdue_notified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(submission_id, reviewer_id)
);

-- Reviewer Performance Metrics
CREATE TABLE IF NOT EXISTS reviewer_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,

  -- Review counts
  total_reviews_completed INT DEFAULT 0,
  total_reviews_assigned INT DEFAULT 0,
  on_time_reviews INT DEFAULT 0,
  late_reviews INT DEFAULT 0,

  -- Quality metrics
  avg_time_spent_seconds INT,
  avg_comment_count DECIMAL(5,2),
  avg_helpfulness_rating DECIMAL(3,2), -- 0-1: Based on author feedback
  instructor_quality_rating DECIMAL(3,2), -- 0-1: Instructor's assessment of review quality

  -- Reliability
  completion_rate DECIMAL(5,2), -- Percentage of assigned reviews completed
  on_time_rate DECIMAL(5,2), -- Percentage of reviews submitted on time

  -- Engagement
  avg_feedback_length INT, -- Average character count of feedback
  uses_line_comments BOOLEAN DEFAULT false, -- Whether they provide line-by-line comments

  -- Flags
  collusion_flags INT DEFAULT 0, -- Number of times flagged for collusion
  quality_flags INT DEFAULT 0, -- Number of times flagged for low-quality reviews

  last_updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Review Disputes (When author disagrees with review)
CREATE TABLE IF NOT EXISTS review_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES code_reviews(id),

  -- Parties
  author_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,

  -- Dispute details
  reason VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requested_outcome VARCHAR(100), -- 'score_adjustment', 're_review', 'remove_review'

  -- Resolution
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'rejected'
  resolved_by UUID, -- Instructor who resolved
  resolution TEXT,
  resolution_action VARCHAR(100), -- 'no_change', 'score_adjusted', 'review_removed', 're_review_assigned'

  -- Timestamps
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- MOSS Collusion Checks (Cross-checking between reviewer and reviewee)
CREATE TABLE IF NOT EXISTS peer_review_moss_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES code_reviews(id),

  -- Submissions being compared
  reviewer_submission_id UUID NOT NULL, -- Reviewer's own submission
  reviewed_submission_id UUID NOT NULL, -- Submission they're reviewing

  -- MOSS results
  similarity_score DECIMAL(5,4) NOT NULL,
  moss_report_url TEXT,
  matched_lines INT,
  total_lines INT,

  -- Analysis
  is_collusion BOOLEAN DEFAULT false, -- Similarity > threshold
  manual_review_required BOOLEAN DEFAULT false,
  instructor_reviewed BOOLEAN DEFAULT false,
  instructor_notes TEXT,

  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Peer Review Notifications
CREATE TABLE IF NOT EXISTS peer_review_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- Notification details
  type VARCHAR(100) NOT NULL, -- 'review_assigned', 'review_received', 'review_overdue', 'dispute_opened'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_review_rubrics_course ON review_rubrics(course_id);
CREATE INDEX idx_review_rubrics_assessment ON review_rubrics(assessment_id);
CREATE INDEX idx_rubric_criteria_rubric ON rubric_criteria(rubric_id);
CREATE INDEX idx_code_reviews_submission ON code_reviews(submission_id);
CREATE INDEX idx_code_reviews_author ON code_reviews(author_id);
CREATE INDEX idx_code_reviews_reviewer ON code_reviews(reviewer_id);
CREATE INDEX idx_code_reviews_status ON code_reviews(status);
CREATE INDEX idx_code_reviews_flagged ON code_reviews(is_flagged_for_collusion);
CREATE INDEX idx_review_criterion_scores_review ON review_criterion_scores(review_id);
CREATE INDEX idx_review_comments_review ON review_comments(review_id);
CREATE INDEX idx_review_assignments_reviewer ON review_assignments(reviewer_id);
CREATE INDEX idx_review_assignments_submission ON review_assignments(submission_id);
CREATE INDEX idx_review_assignments_status ON review_assignments(status);
CREATE INDEX idx_reviewer_stats_user ON reviewer_stats(user_id);
CREATE INDEX idx_review_disputes_review ON review_disputes(review_id);
CREATE INDEX idx_review_disputes_status ON review_disputes(status);
CREATE INDEX idx_peer_review_moss_reviewer_sub ON peer_review_moss_checks(reviewer_submission_id);
CREATE INDEX idx_peer_review_moss_reviewed_sub ON peer_review_moss_checks(reviewed_submission_id);
CREATE INDEX idx_peer_review_notifications_user ON peer_review_notifications(user_id);
CREATE INDEX idx_peer_review_notifications_read ON peer_review_notifications(is_read);

-- Trigger to update review status and overall score
CREATE OR REPLACE FUNCTION calculate_review_overall_score()
RETURNS TRIGGER AS $$
DECLARE
  total_weighted_score DECIMAL(10,4);
  total_weight DECIMAL(10,4);
  overall DECIMAL(5,2);
BEGIN
  -- Calculate weighted average
  SELECT
    SUM(rcs.score * rc.weight),
    SUM(rc.weight)
  INTO total_weighted_score, total_weight
  FROM review_criterion_scores rcs
  JOIN rubric_criteria rc ON rc.id = rcs.criterion_id
  WHERE rcs.review_id = NEW.review_id;

  IF total_weight > 0 THEN
    overall := (total_weighted_score / total_weight);

    UPDATE code_reviews
    SET overall_score = overall,
        updated_at = NOW()
    WHERE id = NEW.review_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_review_score
AFTER INSERT OR UPDATE ON review_criterion_scores
FOR EACH ROW
EXECUTE FUNCTION calculate_review_overall_score();

-- Trigger to update reviewer stats
CREATE OR REPLACE FUNCTION update_reviewer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    INSERT INTO reviewer_stats (user_id, total_reviews_completed, total_reviews_assigned, on_time_reviews, completion_rate)
    VALUES (NEW.reviewer_id, 1, 1, 1, 100.0)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_reviews_completed = reviewer_stats.total_reviews_completed + 1,
      on_time_reviews = reviewer_stats.on_time_reviews + CASE
        WHEN NEW.submitted_at <= (SELECT due_at FROM review_assignments WHERE submission_id = NEW.submission_id AND reviewer_id = NEW.reviewer_id LIMIT 1) THEN 1
        ELSE 0
      END,
      completion_rate = ((reviewer_stats.total_reviews_completed + 1)::DECIMAL / reviewer_stats.total_reviews_assigned) * 100,
      last_updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviewer_stats
AFTER UPDATE ON code_reviews
FOR EACH ROW
WHEN (NEW.status = 'submitted')
EXECUTE FUNCTION update_reviewer_stats();

-- View: Reviews needing completion
CREATE OR REPLACE VIEW pending_reviews AS
SELECT
  cr.id as review_id,
  cr.submission_id,
  cr.author_id,
  cr.reviewer_id,
  cr.status,
  ra.due_at,
  CASE
    WHEN NOW() > ra.due_at THEN true
    ELSE false
  END as is_overdue,
  rr.name as rubric_name,
  rr.min_reviews_required
FROM code_reviews cr
JOIN review_assignments ra ON ra.submission_id = cr.submission_id AND ra.reviewer_id = cr.reviewer_id
JOIN review_rubrics rr ON rr.id = cr.rubric_id
WHERE cr.status IN ('pending', 'in_progress')
ORDER BY ra.due_at ASC;

-- View: Submissions awaiting peer reviews
CREATE OR REPLACE VIEW submissions_awaiting_reviews AS
SELECT
  cr.submission_id,
  cr.author_id,
  rr.id as rubric_id,
  rr.min_reviews_required,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'submitted') as reviews_completed,
  rr.min_reviews_required - COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'submitted') as reviews_remaining,
  CASE
    WHEN COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'submitted') >= rr.min_reviews_required THEN true
    ELSE false
  END as can_submit
FROM code_reviews cr
JOIN review_rubrics rr ON rr.id = cr.rubric_id
GROUP BY cr.submission_id, cr.author_id, rr.id, rr.min_reviews_required;

-- View: High-quality reviewers (for future assignment prioritization)
CREATE OR REPLACE VIEW high_quality_reviewers AS
SELECT
  rs.user_id,
  rs.total_reviews_completed,
  rs.completion_rate,
  rs.on_time_rate,
  rs.avg_helpfulness_rating,
  rs.instructor_quality_rating,
  ((rs.completion_rate * 0.3) +
   (rs.on_time_rate * 0.2) +
   (COALESCE(rs.avg_helpfulness_rating, 0.5) * 100 * 0.3) +
   (COALESCE(rs.instructor_quality_rating, 0.5) * 100 * 0.2)) as quality_score
FROM reviewer_stats rs
WHERE rs.total_reviews_completed >= 3
  AND rs.completion_rate >= 80
  AND rs.collusion_flags = 0
ORDER BY quality_score DESC;

-- Comments
COMMENT ON TABLE review_rubrics IS 'Instructor-defined rubrics for peer code reviews';
COMMENT ON TABLE rubric_criteria IS 'Individual evaluation criteria within a rubric';
COMMENT ON TABLE code_reviews IS 'Peer review instances';
COMMENT ON TABLE review_criterion_scores IS 'Scores for each criterion in a review';
COMMENT ON TABLE review_comments IS 'Line-by-line code comments in reviews';
COMMENT ON TABLE review_assignments IS 'Tracks who is assigned to review whom';
COMMENT ON TABLE reviewer_stats IS 'Performance metrics for peer reviewers';
COMMENT ON TABLE review_disputes IS 'Disputes raised by code authors against reviews';
COMMENT ON TABLE peer_review_moss_checks IS 'MOSS similarity checks between reviewer and reviewee for collusion detection';
COMMENT ON TABLE peer_review_notifications IS 'Notifications for peer review events';
