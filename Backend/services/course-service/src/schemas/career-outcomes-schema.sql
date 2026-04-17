-- Career Outcome Tracker Schema
-- Tracks post-certification career outcomes and training ROI

-- ========================================
-- 1. CAREER OUTCOMES
-- ========================================

CREATE TABLE IF NOT EXISTS career_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Course/Certification Reference
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  certification_id UUID, -- Reference to certification if applicable
  completed_at TIMESTAMP,

  -- Outcome Type
  outcome_type VARCHAR(50) NOT NULL, -- 'hired', 'promoted', 'role_change', 'salary_increase', 'started_business', 'other'
  outcome_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'

  -- Employment Details
  previous_job_title VARCHAR(255),
  previous_company VARCHAR(255),
  previous_salary_range VARCHAR(50), -- e.g., '50k-75k', '75k-100k'
  previous_employment_status VARCHAR(50), -- 'employed', 'unemployed', 'student', 'freelance'

  new_job_title VARCHAR(255),
  new_company VARCHAR(255),
  new_salary_range VARCHAR(50),
  new_employment_status VARCHAR(50),

  -- Timing
  time_to_outcome_days INTEGER, -- Days from course completion to outcome
  outcome_date TIMESTAMP,

  -- LinkedIn Integration
  linkedin_profile_url VARCHAR(500),
  linkedin_post_url VARCHAR(500), -- If they shared on LinkedIn
  linkedin_verified BOOLEAN DEFAULT false,

  -- Additional Context
  outcome_description TEXT, -- User's description of how the course helped
  skills_used TEXT[], -- Skills from the course they're using
  industry VARCHAR(100),
  location VARCHAR(255),
  job_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'executive'

  -- Verification
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin/HR who verified
  verified_at TIMESTAMP,
  verification_method VARCHAR(50), -- 'linkedin', 'email', 'manual', 'offer_letter'
  verification_notes TEXT,

  -- Consent & Privacy
  is_public BOOLEAN DEFAULT false, -- Show in public stats
  allow_testimonial BOOLEAN DEFAULT false, -- Use as testimonial
  testimonial_text TEXT,
  testimonial_approved BOOLEAN DEFAULT false,

  -- Attribution
  referral_source VARCHAR(100), -- How they found the job (e.g., 'linkedin', 'company_referral', 'job_board')
  course_directly_helped BOOLEAN, -- Did the course directly lead to this outcome?

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_career_outcomes_user ON career_outcomes(user_id);
CREATE INDEX idx_career_outcomes_course ON career_outcomes(course_id);
CREATE INDEX idx_career_outcomes_type ON career_outcomes(outcome_type);
CREATE INDEX idx_career_outcomes_status ON career_outcomes(outcome_status);
CREATE INDEX idx_career_outcomes_date ON career_outcomes(outcome_date DESC);
CREATE INDEX idx_career_outcomes_verified ON career_outcomes(outcome_status, linkedin_verified);

-- ========================================
-- 2. OUTCOME SURVEY RESPONSES
-- ========================================

CREATE TABLE IF NOT EXISTS outcome_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

  -- Survey Timing
  survey_type VARCHAR(50) NOT NULL, -- 'post_completion', '30_day', '90_day', '6_month', '1_year'
  sent_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,

  -- Survey Responses (JSON for flexibility)
  responses JSONB,

  -- Outcome Reported
  outcome_reported BOOLEAN DEFAULT false,
  outcome_id UUID REFERENCES career_outcomes(id) ON DELETE SET NULL,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outcome_surveys_user ON outcome_surveys(user_id);
CREATE INDEX idx_outcome_surveys_course ON outcome_surveys(course_id);
CREATE INDEX idx_outcome_surveys_type ON outcome_surveys(survey_type);
CREATE INDEX idx_outcome_surveys_completed ON outcome_surveys(completed_at);

-- ========================================
-- 3. JOB POSTINGS (Optional - for job board integration)
-- ========================================

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job Details
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_logo_url VARCHAR(500),
  description TEXT NOT NULL,

  -- Requirements
  required_skills TEXT[] NOT NULL,
  preferred_skills TEXT[],
  experience_level VARCHAR(50), -- 'entry', 'mid', 'senior'
  education_level VARCHAR(100),

  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',

  -- Location
  location VARCHAR(255),
  remote_allowed BOOLEAN DEFAULT false,

  -- External Links
  application_url VARCHAR(500),
  external_id VARCHAR(255), -- ID from external job board
  source VARCHAR(100), -- 'linkedin', 'indeed', 'manual'

  -- Course Recommendations
  recommended_courses UUID[], -- Courses that prepare for this job

  -- Status
  is_active BOOLEAN DEFAULT true,
  posted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_postings_active ON job_postings(is_active, posted_at DESC);
CREATE INDEX idx_job_postings_skills ON job_postings USING GIN(required_skills);
CREATE INDEX idx_job_postings_recommended ON job_postings USING GIN(recommended_courses);

-- ========================================
-- 4. JOB APPLICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,

  -- Application Status
  status VARCHAR(50) DEFAULT 'applied', -- 'applied', 'reviewing', 'interviewing', 'offered', 'accepted', 'rejected'
  applied_at TIMESTAMP DEFAULT NOW(),

  -- Skills Match
  matched_skills TEXT[], -- Skills from their profile that match job
  skill_match_percentage DECIMAL(5,2),

  -- Outcome
  resulted_in_hire BOOLEAN DEFAULT false,
  hired_at TIMESTAMP,
  outcome_id UUID REFERENCES career_outcomes(id) ON DELETE SET NULL,

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_applications_user ON job_applications(user_id);
CREATE INDEX idx_job_applications_job ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- ========================================
-- 5. ORGANIZATION ROI TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS organization_roi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Training Metrics
  total_enrollments INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_certifications INTEGER DEFAULT 0,
  total_training_cost DECIMAL(12,2) DEFAULT 0, -- Cost of platform + instructor time

  -- Outcome Metrics
  employees_promoted INTEGER DEFAULT 0,
  employees_with_salary_increase INTEGER DEFAULT 0,
  internal_role_changes INTEGER DEFAULT 0,
  retention_improved INTEGER DEFAULT 0, -- Employees who stayed due to training

  -- Financial Impact
  avg_salary_increase_percentage DECIMAL(5,2),
  total_salary_increase_amount DECIMAL(12,2),
  productivity_improvement_percentage DECIMAL(5,2),
  estimated_productivity_value DECIMAL(12,2),

  -- Retention Impact
  retention_rate_before DECIMAL(5,2),
  retention_rate_after DECIMAL(5,2),
  cost_of_turnover_saved DECIMAL(12,2),

  -- ROI Calculation
  total_benefits DECIMAL(12,2), -- Sum of all quantifiable benefits
  roi_percentage DECIMAL(8,2), -- ((Benefits - Cost) / Cost) * 100
  payback_period_months INTEGER, -- Time to recoup training investment

  -- Survey Data
  employee_satisfaction_score DECIMAL(3,2), -- 1-5 scale
  manager_satisfaction_score DECIMAL(3,2),

  -- Notes
  notes TEXT,
  calculation_method VARCHAR(50), -- 'automatic', 'manual', 'hybrid'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, period_start, period_end)
);

CREATE INDEX idx_org_roi_organization ON organization_roi(organization_id);
CREATE INDEX idx_org_roi_period ON organization_roi(period_start, period_end);

-- ========================================
-- 6. SALARY BENCHMARKS
-- ========================================

CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job Details
  job_title VARCHAR(255) NOT NULL,
  job_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'executive'
  industry VARCHAR(100),

  -- Location
  country VARCHAR(100),
  region VARCHAR(100), -- State/Province
  city VARCHAR(100),

  -- Salary Data
  salary_min INTEGER,
  salary_median INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',

  -- Skills
  required_skills TEXT[],

  -- Data Source
  data_source VARCHAR(100), -- 'self_reported', 'linkedin', 'glassdoor', 'manual'
  sample_size INTEGER, -- Number of data points

  -- Validity
  last_updated TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_salary_benchmarks_title ON salary_benchmarks(job_title);
CREATE INDEX idx_salary_benchmarks_location ON salary_benchmarks(country, region, city);
CREATE INDEX idx_salary_benchmarks_skills ON salary_benchmarks USING GIN(required_skills);

-- ========================================
-- 7. TRIGGERS
-- ========================================

-- Trigger: Auto-calculate time to outcome
CREATE OR REPLACE FUNCTION calculate_time_to_outcome()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outcome_date IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
    NEW.time_to_outcome_days := EXTRACT(DAY FROM (NEW.outcome_date - NEW.completed_at));
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_time_to_outcome
BEFORE INSERT OR UPDATE ON career_outcomes
FOR EACH ROW
EXECUTE FUNCTION calculate_time_to_outcome();

-- Trigger: Create activity entry for career outcome
CREATE OR REPLACE FUNCTION create_outcome_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outcome_status = 'verified' AND NEW.is_public = true THEN
    INSERT INTO portfolio_activity (
      user_id, activity_type, activity_title, activity_description,
      related_course_id, icon_name, icon_color, activity_date, is_public
    )
    VALUES (
      NEW.user_id,
      'career_outcome',
      CASE NEW.outcome_type
        WHEN 'hired' THEN 'Got hired as ' || NEW.new_job_title
        WHEN 'promoted' THEN 'Promoted to ' || NEW.new_job_title
        WHEN 'role_change' THEN 'Changed role to ' || NEW.new_job_title
        WHEN 'salary_increase' THEN 'Received salary increase'
        ELSE 'Career milestone achieved'
      END,
      CASE
        WHEN NEW.new_company IS NOT NULL THEN 'at ' || NEW.new_company
        ELSE ''
      END,
      NEW.course_id,
      'briefcase',
      '#10b981',
      NEW.outcome_date,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_outcome_activity
AFTER INSERT OR UPDATE ON career_outcomes
FOR EACH ROW
WHEN (NEW.outcome_status = 'verified' AND NEW.is_public = true)
EXECUTE FUNCTION create_outcome_activity();

-- ========================================
-- 8. VIEWS
-- ========================================

-- View: Course outcome statistics
CREATE OR REPLACE VIEW course_outcome_stats AS
SELECT
  c.id AS course_id,
  c.title AS course_title,
  COUNT(DISTINCT co.user_id) AS total_students_with_outcomes,
  COUNT(DISTINCT CASE WHEN co.outcome_type = 'hired' THEN co.user_id END) AS students_hired,
  COUNT(DISTINCT CASE WHEN co.outcome_type = 'promoted' THEN co.user_id END) AS students_promoted,
  COUNT(DISTINCT CASE WHEN co.outcome_type = 'salary_increase' THEN co.user_id END) AS students_salary_increase,
  ROUND(AVG(co.time_to_outcome_days)::numeric, 1) AS avg_time_to_outcome_days,
  ROUND(AVG(CASE WHEN co.outcome_status = 'verified' THEN 100.0 ELSE 0 END), 1) AS verification_rate,
  COUNT(DISTINCT CASE WHEN co.course_directly_helped = true THEN co.user_id END) AS directly_attributed_outcomes
FROM courses c
LEFT JOIN career_outcomes co ON c.id = co.course_id
WHERE co.outcome_status = 'verified'
GROUP BY c.id, c.title;

-- View: Recent verified outcomes
CREATE OR REPLACE VIEW recent_career_outcomes AS
SELECT
  co.*,
  u.full_name,
  u.avatar_url,
  c.title AS course_title
FROM career_outcomes co
JOIN users u ON co.user_id = u.id
LEFT JOIN courses c ON co.course_id = c.id
WHERE co.outcome_status = 'verified' AND co.is_public = true
ORDER BY co.outcome_date DESC;

-- View: Organization ROI summary
CREATE OR REPLACE VIEW organization_roi_summary AS
SELECT
  org.organization_id,
  org.period_start,
  org.period_end,
  org.total_enrollments,
  org.total_completions,
  org.total_training_cost,
  org.employees_promoted,
  org.employees_with_salary_increase,
  org.roi_percentage,
  org.payback_period_months,
  org.employee_satisfaction_score,
  ROUND((org.total_benefits / NULLIF(org.total_training_cost, 0))::numeric, 2) AS benefit_cost_ratio
FROM organization_roi org
ORDER BY org.period_start DESC;

-- ========================================
-- 9. FUNCTIONS
-- ========================================

-- Function: Get outcome statistics for a course
CREATE OR REPLACE FUNCTION get_course_outcome_stats(p_course_id UUID)
RETURNS TABLE(
  total_outcomes INTEGER,
  hired_count INTEGER,
  promoted_count INTEGER,
  salary_increase_count INTEGER,
  avg_time_to_outcome DECIMAL,
  median_salary_range VARCHAR,
  top_companies TEXT[],
  top_job_titles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_outcomes,
    COUNT(CASE WHEN outcome_type = 'hired' THEN 1 END)::INTEGER AS hired_count,
    COUNT(CASE WHEN outcome_type = 'promoted' THEN 1 END)::INTEGER AS promoted_count,
    COUNT(CASE WHEN outcome_type = 'salary_increase' THEN 1 END)::INTEGER AS salary_increase_count,
    ROUND(AVG(time_to_outcome_days)::numeric, 1) AS avg_time_to_outcome,
    MODE() WITHIN GROUP (ORDER BY new_salary_range) AS median_salary_range,
    ARRAY_AGG(DISTINCT new_company ORDER BY new_company) FILTER (WHERE new_company IS NOT NULL) AS top_companies,
    ARRAY_AGG(DISTINCT new_job_title ORDER BY new_job_title) FILTER (WHERE new_job_title IS NOT NULL) AS top_job_titles
  FROM career_outcomes
  WHERE course_id = p_course_id AND outcome_status = 'verified';
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate organization ROI for a period
CREATE OR REPLACE FUNCTION calculate_organization_roi(
  p_organization_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_roi_id UUID;
  v_enrollments INTEGER;
  v_completions INTEGER;
  v_promotions INTEGER;
  v_salary_increases INTEGER;
  v_avg_salary_increase DECIMAL;
BEGIN
  -- Count enrollments
  SELECT COUNT(*) INTO v_enrollments
  FROM enrollments e
  WHERE e.organization_id = p_organization_id
    AND e.enrolled_at BETWEEN p_start_date AND p_end_date;

  -- Count completions
  SELECT COUNT(*) INTO v_completions
  FROM enrollments e
  WHERE e.organization_id = p_organization_id
    AND e.completed = true
    AND e.completed_at BETWEEN p_start_date AND p_end_date;

  -- Count outcomes
  SELECT
    COUNT(CASE WHEN outcome_type = 'promoted' THEN 1 END),
    COUNT(CASE WHEN outcome_type = 'salary_increase' THEN 1 END)
  INTO v_promotions, v_salary_increases
  FROM career_outcomes co
  JOIN enrollments e ON co.user_id = e.user_id
  WHERE e.organization_id = p_organization_id
    AND co.outcome_date BETWEEN p_start_date AND p_end_date
    AND co.outcome_status = 'verified';

  -- Insert or update ROI record
  INSERT INTO organization_roi (
    organization_id,
    period_start,
    period_end,
    total_enrollments,
    total_completions,
    employees_promoted,
    employees_with_salary_increase
  ) VALUES (
    p_organization_id,
    p_start_date,
    p_end_date,
    v_enrollments,
    v_completions,
    v_promotions,
    v_salary_increases
  )
  ON CONFLICT (organization_id, period_start, period_end)
  DO UPDATE SET
    total_enrollments = EXCLUDED.total_enrollments,
    total_completions = EXCLUDED.total_completions,
    employees_promoted = EXCLUDED.employees_promoted,
    employees_with_salary_increase = EXCLUDED.employees_with_salary_increase,
    updated_at = NOW()
  RETURNING id INTO v_roi_id;

  RETURN v_roi_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Career Outcome Tracker - Post-certification outcomes and training ROI';
