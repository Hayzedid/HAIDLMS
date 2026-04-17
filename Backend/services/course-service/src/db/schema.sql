-- TechLearn Course Service Schema

-- ── Course Status Enum ────────────────────────────────────────────────────
CREATE TYPE course_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'code', 'quiz', 'audio');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped', 'expired');

-- ── Categories ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) UNIQUE NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  description   TEXT,
  parent_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon_url      VARCHAR(500),
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Courses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) UNIQUE NOT NULL,
  description       TEXT NOT NULL,
  short_description VARCHAR(500),
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  skill_level       skill_level NOT NULL DEFAULT 'beginner',
  status            course_status NOT NULL DEFAULT 'draft',
  instructor_id     UUID NOT NULL,  -- References users from auth-service
  cover_image_url   VARCHAR(500),
  trailer_video_url VARCHAR(500),
  estimated_duration_hours DECIMAL(5,2),  -- Total course duration
  price_cents       INT NOT NULL DEFAULT 0,  -- 0 = free
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  enrollment_limit  INT,  -- NULL = unlimited
  tags              TEXT[],  -- Array of tags for search
  language          VARCHAR(10) NOT NULL DEFAULT 'en',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Course Prerequisites ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_prerequisites (
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (course_id, prerequisite_id),
  CHECK (course_id != prerequisite_id)
);

-- ── Modules ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  display_order     INT NOT NULL,
  duration_minutes  INT,  -- Estimated duration
  is_published      BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Lessons ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id         UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  lesson_type       lesson_type NOT NULL DEFAULT 'video',
  display_order     INT NOT NULL,
  duration_minutes  INT,

  -- Content fields (type-specific)
  video_url         VARCHAR(500),    -- For video lessons
  video_provider    VARCHAR(50),     -- 'youtube', 'vimeo', 's3', etc.
  content_markdown  TEXT,            -- For text lessons
  code_template     TEXT,            -- For code exercises
  code_solution     TEXT,            -- For code exercises
  quiz_data         JSONB,           -- For quiz lessons (questions/answers)
  audio_url         VARCHAR(500),    -- For audio lessons

  -- Attachments
  attachments       JSONB,           -- Array of file attachments

  -- Settings
  is_preview        BOOLEAN NOT NULL DEFAULT false,  -- Free preview
  is_published      BOOLEAN NOT NULL DEFAULT true,
  require_completion BOOLEAN NOT NULL DEFAULT true,  -- Must complete to proceed

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Enrollments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,  -- References users from auth-service
  status            enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  last_accessed_at  TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,  -- For time-limited courses
  progress_percent  DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  -- Payment info (if applicable)
  payment_id        UUID,  -- References from billing-service
  amount_paid_cents INT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_id, user_id)
);

-- ── Lesson Progress ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,  -- Denormalized for quick queries

  -- Progress tracking
  is_completed      BOOLEAN NOT NULL DEFAULT false,
  completion_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  last_position_seconds INT,  -- For video/audio resumption

  -- Attempts (for quizzes/exercises)
  attempts          INT NOT NULL DEFAULT 0,
  score             DECIMAL(5,2),  -- Quiz score
  passed            BOOLEAN,

  -- Timestamps
  first_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  last_accessed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(enrollment_id, lesson_id)
);

-- ── Course Reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,  -- References users from auth-service
  enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  rating            INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text       TEXT,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  instructor_response TEXT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_id, user_id)
);

-- ── Course Analytics (aggregated stats) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS course_stats (
  course_id             UUID PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  total_enrollments     INT NOT NULL DEFAULT 0,
  active_enrollments    INT NOT NULL DEFAULT 0,
  completed_enrollments INT NOT NULL DEFAULT 0,
  average_rating        DECIMAL(3,2),
  total_reviews         INT NOT NULL DEFAULT 0,
  average_completion_time_hours DECIMAL(6,2),
  last_updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Courses
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_skill_level ON courses(skill_level);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);
CREATE INDEX idx_courses_tags ON courses USING GIN(tags);
CREATE INDEX idx_courses_published_at ON courses(published_at) WHERE status = 'published';

-- Modules
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_display_order ON modules(course_id, display_order);

-- Lessons
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_display_order ON lessons(module_id, display_order);
CREATE INDEX idx_lessons_type ON lessons(lesson_type);

-- Enrollments
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Lesson Progress
CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(is_completed);

-- Reviews
CREATE INDEX idx_reviews_course_id ON course_reviews(course_id);
CREATE INDEX idx_reviews_user_id ON course_reviews(user_id);
CREATE INDEX idx_reviews_rating ON course_reviews(rating);

-- ── Triggers ───────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update enrollment progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INT;
  completed_lessons INT;
  new_progress DECIMAL(5,2);
BEGIN
  -- Count total lessons in course
  SELECT COUNT(*) INTO total_lessons
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  JOIN enrollments e ON m.course_id = e.course_id
  WHERE e.id = NEW.enrollment_id;

  -- Count completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = NEW.enrollment_id AND is_completed = true;

  -- Calculate progress
  IF total_lessons > 0 THEN
    new_progress := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
  ELSE
    new_progress := 0;
  END IF;

  -- Update enrollment
  UPDATE enrollments
  SET
    progress_percent = new_progress,
    completed_at = CASE WHEN new_progress >= 100 THEN NOW() ELSE NULL END,
    status = CASE WHEN new_progress >= 100 THEN 'completed' ELSE status END,
    last_accessed_at = NOW()
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_progress_trigger
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- Update course stats on enrollment changes
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO course_stats (course_id, total_enrollments, active_enrollments, completed_enrollments)
  VALUES (
    COALESCE(NEW.course_id, OLD.course_id),
    0, 0, 0
  )
  ON CONFLICT (course_id) DO NOTHING;

  UPDATE course_stats
  SET
    total_enrollments = (SELECT COUNT(*) FROM enrollments WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)),
    active_enrollments = (SELECT COUNT(*) FROM enrollments WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND status = 'active'),
    completed_enrollments = (SELECT COUNT(*) FROM enrollments WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND status = 'completed'),
    last_updated_at = NOW()
  WHERE course_id = COALESCE(NEW.course_id, OLD.course_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- Update course stats on review changes
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_stats
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM course_reviews
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND is_published = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM course_reviews
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) AND is_published = true
    ),
    last_updated_at = NOW()
  WHERE course_id = COALESCE(NEW.course_id, OLD.course_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_reviews
FOR EACH ROW EXECUTE FUNCTION update_course_rating();
