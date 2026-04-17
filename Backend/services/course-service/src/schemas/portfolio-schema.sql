-- Public Portfolio System Schema
-- Auto-compiled showcases of student achievements and projects

-- ========================================
-- 1. PORTFOLIO SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS portfolio_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  custom_url_slug VARCHAR(100) UNIQUE, -- e.g., /portfolio/john-doe

  -- Profile Information
  display_name VARCHAR(255),
  headline VARCHAR(500), -- e.g., "Full-Stack Developer | React Specialist"
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(255),
  timezone VARCHAR(50),

  -- Social Links
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  twitter_url VARCHAR(500),
  personal_website VARCHAR(500),
  email_public VARCHAR(255),

  -- Portfolio Theme
  theme_color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
  theme_style VARCHAR(20) DEFAULT 'modern', -- modern, minimal, professional, creative
  layout_type VARCHAR(20) DEFAULT 'grid', -- grid, list, timeline

  -- Featured Content
  featured_projects UUID[], -- Array of project IDs
  featured_badges UUID[], -- Array of badge assertion IDs
  featured_skills TEXT[], -- Array of skill names

  -- Privacy Settings
  show_courses BOOLEAN DEFAULT true,
  show_badges BOOLEAN DEFAULT true,
  show_projects BOOLEAN DEFAULT true,
  show_skills BOOLEAN DEFAULT true,
  show_activity BOOLEAN DEFAULT true,
  show_peer_reviews BOOLEAN DEFAULT false,
  show_contact_form BOOLEAN DEFAULT true,

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url VARCHAR(500), -- Open Graph image for social sharing

  -- Analytics
  view_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_settings_user ON portfolio_settings(user_id);
CREATE INDEX idx_portfolio_settings_slug ON portfolio_settings(custom_url_slug);
CREATE INDEX idx_portfolio_settings_public ON portfolio_settings(is_public);

-- ========================================
-- 2. PORTFOLIO PROJECTS
-- ========================================

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Project Information
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT, -- Markdown supported
  project_type VARCHAR(50), -- 'course', 'personal', 'capstone', 'freelance'

  -- Project Links
  live_url VARCHAR(500), -- Deployed project URL
  repository_url VARCHAR(500), -- GitHub/GitLab repo
  demo_video_url VARCHAR(500), -- YouTube/Vimeo demo

  -- Media
  thumbnail_url VARCHAR(500),
  screenshot_urls TEXT[], -- Array of screenshot URLs
  video_embed_url VARCHAR(500),

  -- Technologies
  technologies TEXT[] NOT NULL, -- ['React', 'Node.js', 'PostgreSQL']
  skills_demonstrated TEXT[], -- ['API Design', 'State Management', 'Authentication']

  -- Course Association
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- Metrics
  lines_of_code INTEGER,
  completion_time_hours INTEGER,
  final_grade DECIMAL(5,2),
  peer_review_rating DECIMAL(3,2), -- Average from peer reviews

  -- Highlights
  key_features TEXT[], -- Bullet points of main features
  challenges_overcome TEXT, -- Markdown description
  lessons_learned TEXT, -- Markdown description

  -- Status
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_projects_user ON portfolio_projects(user_id);
CREATE INDEX idx_portfolio_projects_course ON portfolio_projects(course_id);
CREATE INDEX idx_portfolio_projects_public ON portfolio_projects(user_id, is_public);
CREATE INDEX idx_portfolio_projects_featured ON portfolio_projects(user_id, is_featured);

-- ========================================
-- 3. COMPETENCY SCORES
-- ========================================

CREATE TABLE IF NOT EXISTS competency_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Competency
  skill_name VARCHAR(255) NOT NULL,
  skill_category VARCHAR(100), -- 'programming', 'framework', 'tool', 'soft-skill'

  -- Proficiency Level
  proficiency_level VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  proficiency_score INTEGER CHECK (proficiency_score >= 0 AND proficiency_score <= 100),

  -- Evidence
  courses_completed INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  assessments_passed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  peer_reviews_given INTEGER DEFAULT 0,

  -- Validation
  validated_by_instructor BOOLEAN DEFAULT false,
  endorsed_by_peers INTEGER DEFAULT 0,

  -- Timestamps
  first_used_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, skill_name)
);

CREATE INDEX idx_competency_scores_user ON competency_scores(user_id);
CREATE INDEX idx_competency_scores_skill ON competency_scores(skill_name);
CREATE INDEX idx_competency_scores_level ON competency_scores(user_id, proficiency_level);

-- ========================================
-- 4. ACTIVITY TIMELINE
-- ========================================

CREATE TABLE IF NOT EXISTS portfolio_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type VARCHAR(50) NOT NULL, -- 'course_completed', 'badge_earned', 'project_published', etc.
  activity_title VARCHAR(500) NOT NULL,
  activity_description TEXT,

  -- Related Entities
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES portfolio_projects(id) ON DELETE SET NULL,
  related_badge_id UUID, -- badge_assertion_id

  -- Display
  icon_name VARCHAR(50), -- For UI rendering
  icon_color VARCHAR(7), -- Hex color
  is_highlighted BOOLEAN DEFAULT false,

  -- Visibility
  is_public BOOLEAN DEFAULT true,

  activity_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_activity_user ON portfolio_activity(user_id);
CREATE INDEX idx_portfolio_activity_date ON portfolio_activity(user_id, activity_date DESC);
CREATE INDEX idx_portfolio_activity_type ON portfolio_activity(activity_type);
CREATE INDEX idx_portfolio_activity_public ON portfolio_activity(user_id, is_public);

-- ========================================
-- 5. PORTFOLIO VIEWS/ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS portfolio_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Viewer Information
  viewer_ip INET,
  viewer_country VARCHAR(100),
  viewer_city VARCHAR(100),
  viewer_user_agent TEXT,

  -- Referrer
  referrer_url TEXT,
  referrer_source VARCHAR(100), -- 'linkedin', 'google', 'direct', 'github'

  -- Session
  session_duration_seconds INTEGER,

  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_views_user ON portfolio_views(portfolio_user_id);
CREATE INDEX idx_portfolio_views_date ON portfolio_views(portfolio_user_id, viewed_at DESC);
CREATE INDEX idx_portfolio_views_source ON portfolio_views(referrer_source);

-- ========================================
-- 6. PEER ENDORSEMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS portfolio_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endorser_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Endorsement
  skill_name VARCHAR(255) NOT NULL,
  endorsement_message TEXT,

  -- Context
  worked_together_on VARCHAR(255), -- Course name or project

  is_public BOOLEAN DEFAULT true,

  endorsed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(portfolio_user_id, endorser_user_id, skill_name)
);

CREATE INDEX idx_endorsements_portfolio_user ON portfolio_endorsements(portfolio_user_id);
CREATE INDEX idx_endorsements_skill ON portfolio_endorsements(portfolio_user_id, skill_name);

-- ========================================
-- 7. TRIGGERS
-- ========================================

-- Trigger: Auto-update view count
CREATE OR REPLACE FUNCTION update_portfolio_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE portfolio_settings
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE user_id = NEW.portfolio_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_view_count
AFTER INSERT ON portfolio_views
FOR EACH ROW
EXECUTE FUNCTION update_portfolio_view_count();

-- Trigger: Auto-create portfolio activity on course completion
CREATE OR REPLACE FUNCTION create_course_completion_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    INSERT INTO portfolio_activity (
      user_id, activity_type, activity_title, activity_description,
      related_course_id, icon_name, icon_color, activity_date, is_public
    )
    SELECT
      NEW.user_id,
      'course_completed',
      'Completed ' || c.title,
      'Achieved ' || NEW.final_score || '% final score',
      NEW.course_id,
      'graduation-cap',
      '#22c55e',
      NOW(),
      true
    FROM courses c WHERE c.id = NEW.course_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This assumes enrollments table exists
-- CREATE TRIGGER trigger_course_completion_activity
-- AFTER UPDATE ON enrollments
-- FOR EACH ROW
-- EXECUTE FUNCTION create_course_completion_activity();

-- ========================================
-- 8. VIEWS FOR PORTFOLIO DATA
-- ========================================

-- View: Complete Portfolio Summary
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  ps.custom_url_slug,
  ps.display_name,
  ps.headline,
  ps.bio,
  ps.avatar_url,
  ps.is_public,
  ps.view_count,
  COUNT(DISTINCT pp.id) AS total_projects,
  COUNT(DISTINCT CASE WHEN pp.is_featured THEN pp.id END) AS featured_projects,
  COUNT(DISTINCT cs.id) AS total_skills,
  COUNT(DISTINCT CASE WHEN cs.proficiency_level IN ('advanced', 'expert') THEN cs.id END) AS advanced_skills,
  ps.linkedin_url,
  ps.github_url,
  ps.personal_website
FROM users u
LEFT JOIN portfolio_settings ps ON u.id = ps.user_id
LEFT JOIN portfolio_projects pp ON u.id = pp.user_id AND pp.is_public = true
LEFT JOIN competency_scores cs ON u.id = cs.user_id
WHERE ps.is_public = true
GROUP BY u.id, u.full_name, u.email, ps.custom_url_slug, ps.display_name,
         ps.headline, ps.bio, ps.avatar_url, ps.is_public, ps.view_count,
         ps.linkedin_url, ps.github_url, ps.personal_website;

-- View: Top Skills by User
CREATE OR REPLACE VIEW top_user_skills AS
SELECT
  user_id,
  skill_name,
  proficiency_level,
  proficiency_score,
  courses_completed,
  projects_completed,
  endorsed_by_peers,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY proficiency_score DESC, endorsed_by_peers DESC) AS skill_rank
FROM competency_scores
WHERE proficiency_score >= 60; -- Only show reasonably proficient skills

-- View: Recent Portfolio Activity
CREATE OR REPLACE VIEW recent_portfolio_activity AS
SELECT
  pa.*,
  u.full_name,
  u.avatar_url,
  c.title AS course_title,
  pp.title AS project_title
FROM portfolio_activity pa
JOIN users u ON pa.user_id = u.id
LEFT JOIN courses c ON pa.related_course_id = c.id
LEFT JOIN portfolio_projects pp ON pa.related_project_id = pp.id
WHERE pa.is_public = true
ORDER BY pa.activity_date DESC;

-- ========================================
-- 9. FUNCTIONS
-- ========================================

-- Function: Calculate skill proficiency score
CREATE OR REPLACE FUNCTION calculate_skill_proficiency(
  p_user_id UUID,
  p_skill_name VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_courses INTEGER;
  v_projects INTEGER;
  v_assessments INTEGER;
  v_badges INTEGER;
BEGIN
  -- Get evidence counts
  SELECT
    COALESCE(courses_completed, 0),
    COALESCE(projects_completed, 0),
    COALESCE(assessments_passed, 0),
    COALESCE(badges_earned, 0)
  INTO v_courses, v_projects, v_assessments, v_badges
  FROM competency_scores
  WHERE user_id = p_user_id AND skill_name = p_skill_name;

  -- Calculate weighted score
  v_score := LEAST(100,
    (v_courses * 10) +
    (v_projects * 15) +
    (v_assessments * 8) +
    (v_badges * 20)
  );

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Get portfolio statistics
CREATE OR REPLACE FUNCTION get_portfolio_stats(p_user_id UUID)
RETURNS TABLE(
  total_courses INTEGER,
  total_projects INTEGER,
  total_badges INTEGER,
  total_skills INTEGER,
  portfolio_views INTEGER,
  skill_endorsements INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM enrollments WHERE user_id = p_user_id AND completed = true),
    (SELECT COUNT(*)::INTEGER FROM portfolio_projects WHERE user_id = p_user_id AND is_public = true),
    (SELECT COUNT(*)::INTEGER FROM badge_assertions WHERE recipient_id = p_user_id AND is_revoked = false),
    (SELECT COUNT(*)::INTEGER FROM competency_scores WHERE user_id = p_user_id),
    (SELECT COALESCE(view_count, 0)::INTEGER FROM portfolio_settings WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM portfolio_endorsements WHERE portfolio_user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Public Portfolio System - Auto-compiled showcases of student achievements';
