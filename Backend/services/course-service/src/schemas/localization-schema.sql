-- ============================================================================
-- LOCALIZATION & INTERNATIONALIZATION SCHEMA
-- ============================================================================
-- This schema manages multi-language support, translations, locale-specific
-- formatting, and RTL language support.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE translation_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'published',
  'deprecated'
);

CREATE TYPE content_localization_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'needs_update'
);

CREATE TYPE translation_quality AS ENUM (
  'machine',
  'professional',
  'native',
  'verified'
);

-- ============================================================================
-- LOCALES
-- ============================================================================

CREATE TABLE locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Locale Details
  code VARCHAR(10) NOT NULL UNIQUE, -- en, es, fr, ar, zh-CN
  name VARCHAR(100) NOT NULL, -- English, Spanish, French
  native_name VARCHAR(100), -- Español, Français

  -- Language Info
  language_code VARCHAR(5), -- en, es, fr
  country_code VARCHAR(5), -- US, ES, FR

  -- Formatting
  direction VARCHAR(3) DEFAULT 'ltr', -- ltr or rtl
  date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(50) DEFAULT 'HH:mm:ss',
  number_format VARCHAR(50),
  currency_format VARCHAR(50),
  decimal_separator VARCHAR(1) DEFAULT '.',
  thousand_separator VARCHAR(1) DEFAULT ',',

  -- Pluralization
  plural_rules JSONB, -- CLDR plural rules

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_rtl BOOLEAN DEFAULT false,

  -- Metadata
  flag_icon VARCHAR(255),
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locales_code ON locales(code);
CREATE INDEX idx_locales_active ON locales(is_active) WHERE is_active = true;
CREATE INDEX idx_locales_default ON locales(is_default) WHERE is_default = true;

-- ============================================================================
-- TRANSLATION KEYS
-- ============================================================================

CREATE TABLE translation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key Details
  key VARCHAR(500) NOT NULL UNIQUE, -- app.welcome, course.title
  namespace VARCHAR(100), -- app, course, auth
  description TEXT,

  -- Context
  context VARCHAR(100), -- button, title, description, error
  max_length INTEGER,

  -- Pluralization
  supports_pluralization BOOLEAN DEFAULT false,
  plural_forms TEXT[], -- one, few, many

  -- Variables
  variables TEXT[], -- {username}, {count}
  sample_value TEXT,

  -- Status
  is_deprecated BOOLEAN DEFAULT false,
  replacement_key VARCHAR(500),

  -- Metadata
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_translation_keys_key ON translation_keys(key);
CREATE INDEX idx_translation_keys_namespace ON translation_keys(namespace);
CREATE INDEX idx_translation_keys_deprecated ON translation_keys(is_deprecated);

-- ============================================================================
-- TRANSLATIONS
-- ============================================================================

CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES translation_keys(id) ON DELETE CASCADE,
  locale_id UUID REFERENCES locales(id) ON DELETE CASCADE,

  -- Translation
  value TEXT NOT NULL,
  plural_forms JSONB, -- {one: 'item', other: 'items'}

  -- Quality
  status translation_status DEFAULT 'draft',
  quality translation_quality DEFAULT 'machine',

  -- Review
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,

  -- Version
  version INTEGER DEFAULT 1,
  previous_version_id UUID,

  -- Context
  context_screenshot_url TEXT,
  usage_examples TEXT[],

  -- Metadata
  char_count INTEGER,
  word_count INTEGER,
  is_html BOOLEAN DEFAULT false,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_translation UNIQUE(key_id, locale_id)
);

CREATE INDEX idx_translations_key ON translations(key_id);
CREATE INDEX idx_translations_locale ON translations(locale_id);
CREATE INDEX idx_translations_status ON translations(status);
CREATE INDEX idx_translations_quality ON translations(quality);

-- ============================================================================
-- CONTENT LOCALIZATIONS
-- ============================================================================

CREATE TABLE content_localizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Reference
  content_type VARCHAR(50) NOT NULL, -- course, module, lesson, announcement
  content_id UUID NOT NULL,
  locale_id UUID REFERENCES locales(id) ON DELETE CASCADE,

  -- Localized Fields
  title TEXT,
  description TEXT,
  body TEXT,
  metadata JSONB, -- other localized fields

  -- Status
  status content_localization_status DEFAULT 'not_started',

  -- Translation Details
  translated_by UUID,
  translated_at TIMESTAMPTZ,
  translation_quality translation_quality,

  -- Review
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,

  -- Version Tracking
  source_version INTEGER,
  needs_update BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,

  -- SEO
  seo_title VARCHAR(255),
  seo_description TEXT,
  slug VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_content_localization UNIQUE(content_type, content_id, locale_id)
);

CREATE INDEX idx_content_localizations_content ON content_localizations(content_type, content_id);
CREATE INDEX idx_content_localizations_locale ON content_localizations(locale_id);
CREATE INDEX idx_content_localizations_status ON content_localizations(status);

-- ============================================================================
-- USER LOCALE PREFERENCES
-- ============================================================================

CREATE TABLE user_locale_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  locale_id UUID REFERENCES locales(id),

  -- Preferences
  preferred_language VARCHAR(10),
  timezone VARCHAR(100) DEFAULT 'UTC',
  date_format VARCHAR(50),
  time_format VARCHAR(50),
  number_format VARCHAR(50),
  currency_code VARCHAR(3),

  -- Auto-detection
  detected_locale VARCHAR(10),
  detected_timezone VARCHAR(100),
  browser_language VARCHAR(10),

  -- Override
  force_locale BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_locale_prefs_user ON user_locale_preferences(user_id);
CREATE INDEX idx_user_locale_prefs_locale ON user_locale_preferences(locale_id);

-- ============================================================================
-- TRANSLATION MEMORY
-- ============================================================================

CREATE TABLE translation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source and Target
  source_locale_id UUID REFERENCES locales(id),
  target_locale_id UUID REFERENCES locales(id),

  -- Text
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,

  -- Context
  domain VARCHAR(100), -- technical, marketing, educational
  context VARCHAR(255),

  -- Quality
  quality_score DECIMAL(3,2), -- 0.0 to 1.0
  confidence_score DECIMAL(3,2),
  translation_quality translation_quality,

  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID,
  verified_by UUID,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_translation_memory UNIQUE(source_locale_id, target_locale_id, source_text, context)
);

CREATE INDEX idx_translation_memory_source ON translation_memory(source_locale_id);
CREATE INDEX idx_translation_memory_target ON translation_memory(target_locale_id);
CREATE INDEX idx_translation_memory_text ON translation_memory USING GIN(to_tsvector('english', source_text));

-- ============================================================================
-- GLOSSARY
-- ============================================================================

CREATE TABLE glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Term
  term VARCHAR(255) NOT NULL,
  definition TEXT,
  context VARCHAR(255),

  -- Category
  category VARCHAR(100),
  domain VARCHAR(100),

  -- Translation Rules
  do_not_translate BOOLEAN DEFAULT false,
  translation_notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_glossary_terms_term ON glossary_terms(term);
CREATE INDEX idx_glossary_terms_category ON glossary_terms(category);

CREATE TABLE glossary_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
  locale_id UUID REFERENCES locales(id) ON DELETE CASCADE,

  -- Translation
  translated_term VARCHAR(255) NOT NULL,
  translated_definition TEXT,

  -- Metadata
  notes TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_glossary_translation UNIQUE(term_id, locale_id)
);

CREATE INDEX idx_glossary_translations_term ON glossary_translations(term_id);
CREATE INDEX idx_glossary_translations_locale ON glossary_translations(locale_id);

-- ============================================================================
-- TRANSLATION PROJECTS
-- ============================================================================

CREATE TABLE translation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project Details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scope
  source_locale_id UUID REFERENCES locales(id),
  target_locale_ids UUID[],

  -- Content
  content_types TEXT[],
  content_ids UUID[],
  include_keys TEXT[], -- specific translation keys

  -- Progress
  total_items INTEGER,
  translated_items INTEGER DEFAULT 0,
  reviewed_items INTEGER DEFAULT 0,
  approved_items INTEGER DEFAULT 0,

  -- Deadline
  due_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, review, completed
  completed_at TIMESTAMPTZ,

  -- Team
  project_manager_id UUID,
  translators UUID[],
  reviewers UUID[],

  -- Metadata
  priority INTEGER DEFAULT 0,
  tags TEXT[],

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_translation_projects_status ON translation_projects(status);
CREATE INDEX idx_translation_projects_due ON translation_projects(due_date);

-- ============================================================================
-- LOCALE-SPECIFIC ASSETS
-- ============================================================================

CREATE TABLE locale_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale_id UUID REFERENCES locales(id) ON DELETE CASCADE,

  -- Asset Details
  asset_type VARCHAR(50), -- image, video, document, font
  asset_key VARCHAR(255) NOT NULL,
  asset_url TEXT NOT NULL,

  -- Metadata
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  alt_text TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_locale_asset UNIQUE(locale_id, asset_key)
);

CREATE INDEX idx_locale_assets_locale ON locale_assets(locale_id);
CREATE INDEX idx_locale_assets_type ON locale_assets(asset_type);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Translation Completeness
CREATE VIEW translation_completeness AS
SELECT
  l.code as locale_code,
  l.name as locale_name,
  COUNT(DISTINCT tk.id) as total_keys,
  COUNT(DISTINCT t.id) as translated_keys,
  ROUND(COUNT(DISTINCT t.id)::DECIMAL / NULLIF(COUNT(DISTINCT tk.id), 0) * 100, 2) as completeness_percentage,
  COUNT(CASE WHEN t.status = 'published' THEN 1 END) as published_translations,
  COUNT(CASE WHEN t.status = 'pending_review' THEN 1 END) as pending_review
FROM locales l
CROSS JOIN translation_keys tk
LEFT JOIN translations t ON t.key_id = tk.id AND t.locale_id = l.id
WHERE l.is_active = true AND tk.is_deprecated = false
GROUP BY l.id, l.code, l.name;

-- Content Localization Progress
CREATE VIEW content_localization_progress AS
SELECT
  cl.content_type,
  l.code as locale_code,
  COUNT(*) as total_items,
  COUNT(CASE WHEN cl.status = 'completed' THEN 1 END) as completed_items,
  COUNT(CASE WHEN cl.status = 'in_progress' THEN 1 END) as in_progress_items,
  COUNT(CASE WHEN cl.status = 'not_started' THEN 1 END) as not_started_items,
  ROUND(COUNT(CASE WHEN cl.status = 'completed' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as completion_percentage
FROM content_localizations cl
JOIN locales l ON l.id = cl.locale_id
GROUP BY cl.content_type, l.code;

-- Translation Quality Overview
CREATE VIEW translation_quality_overview AS
SELECT
  l.code as locale_code,
  t.quality,
  COUNT(*) as translation_count,
  ROUND(AVG(LENGTH(t.value)), 2) as avg_length
FROM translations t
JOIN locales l ON l.id = t.locale_id
WHERE t.status = 'published'
GROUP BY l.code, t.quality;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get translation
CREATE OR REPLACE FUNCTION get_translation(
  p_key VARCHAR,
  p_locale_code VARCHAR,
  p_fallback_locale VARCHAR DEFAULT 'en'
) RETURNS TEXT AS $$
DECLARE
  v_translation TEXT;
  v_key_id UUID;
  v_locale_id UUID;
  v_fallback_locale_id UUID;
BEGIN
  -- Get key ID
  SELECT id INTO v_key_id FROM translation_keys WHERE key = p_key;
  IF NOT FOUND THEN
    RETURN p_key;
  END IF;

  -- Get locale IDs
  SELECT id INTO v_locale_id FROM locales WHERE code = p_locale_code;
  SELECT id INTO v_fallback_locale_id FROM locales WHERE code = p_fallback_locale;

  -- Try to get translation in requested locale
  SELECT value INTO v_translation
  FROM translations
  WHERE key_id = v_key_id
    AND locale_id = v_locale_id
    AND status = 'published';

  IF FOUND THEN
    RETURN v_translation;
  END IF;

  -- Fallback to default locale
  SELECT value INTO v_translation
  FROM translations
  WHERE key_id = v_key_id
    AND locale_id = v_fallback_locale_id
    AND status = 'published';

  IF FOUND THEN
    RETURN v_translation;
  END IF;

  -- Return key if no translation found
  RETURN p_key;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate translation completeness
CREATE OR REPLACE FUNCTION calculate_translation_completeness(p_locale_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total INTEGER;
  v_translated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM translation_keys
  WHERE is_deprecated = false;

  SELECT COUNT(*) INTO v_translated
  FROM translations t
  JOIN translation_keys tk ON tk.id = t.key_id
  WHERE t.locale_id = p_locale_id
    AND tk.is_deprecated = false
    AND t.status = 'published';

  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((v_translated::DECIMAL / v_total) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to find similar translations
CREATE OR REPLACE FUNCTION find_similar_translations(
  p_source_text TEXT,
  p_source_locale_id UUID,
  p_target_locale_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  source_text TEXT,
  target_text TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.source_text,
    tm.target_text,
    similarity(tm.source_text, p_source_text) as similarity_score
  FROM translation_memory tm
  WHERE tm.source_locale_id = p_source_locale_id
    AND tm.target_locale_id = p_target_locale_id
    AND similarity(tm.source_text, p_source_text) > 0.3
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_localization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locales_update_timestamp
  BEFORE UPDATE ON locales
  FOR EACH ROW
  EXECUTE FUNCTION update_localization_timestamp();

CREATE TRIGGER translations_update_timestamp
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_localization_timestamp();

-- Update translation counts
CREATE OR REPLACE FUNCTION update_translation_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.char_count = LENGTH(NEW.value);
  NEW.word_count = array_length(string_to_array(NEW.value, ' '), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER translations_update_counts
  BEFORE INSERT OR UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_word_count();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE locales IS 'Available locales/languages in the system';
COMMENT ON TABLE translation_keys IS 'Translation keys for UI strings';
COMMENT ON TABLE translations IS 'Translations for each key in different locales';
COMMENT ON TABLE content_localizations IS 'Localized versions of course content';
COMMENT ON TABLE user_locale_preferences IS 'User language and formatting preferences';
COMMENT ON TABLE translation_memory IS 'Translation memory for reuse and consistency';
COMMENT ON TABLE glossary_terms IS 'Glossary of terms for consistent translation';
COMMENT ON TABLE translation_projects IS 'Translation projects and progress tracking';
