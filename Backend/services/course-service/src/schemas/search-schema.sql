-- ============================================================================
-- SEARCH & DISCOVERY SCHEMA
-- ============================================================================
-- This schema manages full-text search, content discovery, recommendations,
-- and search analytics.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE search_entity_type AS ENUM (
  'course',
  'lesson',
  'module',
  'user',
  'discussion',
  'announcement',
  'document',
  'video'
);

CREATE TYPE search_result_type AS ENUM (
  'exact',
  'partial',
  'fuzzy',
  'recommended',
  'trending'
);

CREATE TYPE recommendation_source AS ENUM (
  'collaborative_filtering',
  'content_based',
  'popular',
  'trending',
  'personalized',
  'similar_users'
);

-- ============================================================================
-- SEARCH INDEX
-- ============================================================================

CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity Reference
  entity_type search_entity_type NOT NULL,
  entity_id UUID NOT NULL,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  tags TEXT[],
  categories TEXT[],

  -- Full-Text Search Vectors
  title_vector TSVECTOR,
  description_vector TSVECTOR,
  content_vector TSVECTOR,
  combined_vector TSVECTOR,

  -- Metadata
  author_id UUID,
  author_name VARCHAR(255),
  created_date DATE,
  modified_date DATE,

  -- Relevance Factors
  view_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  popularity_score DECIMAL(10,2) DEFAULT 0,

  -- Status
  is_published BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',

  -- Access Control
  visibility VARCHAR(50) DEFAULT 'public', -- public, private, organization
  organization_id UUID,
  required_role VARCHAR(50),

  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_search_entity UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_search_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_title_vector ON search_index USING GIN(title_vector);
CREATE INDEX idx_search_description_vector ON search_index USING GIN(description_vector);
CREATE INDEX idx_search_content_vector ON search_index USING GIN(content_vector);
CREATE INDEX idx_search_combined_vector ON search_index USING GIN(combined_vector);
CREATE INDEX idx_search_tags ON search_index USING GIN(tags);
CREATE INDEX idx_search_categories ON search_index USING GIN(categories);
CREATE INDEX idx_search_popularity ON search_index(popularity_score DESC);
CREATE INDEX idx_search_published ON search_index(is_published, is_searchable) WHERE is_published = true AND is_searchable = true;
CREATE INDEX idx_search_language ON search_index(language);

-- ============================================================================
-- SEARCH QUERIES
-- ============================================================================

CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id VARCHAR(255),

  -- Query Details
  query_text TEXT NOT NULL,
  query_normalized TEXT, -- Normalized for analytics
  query_tokens TEXT[], -- Tokenized query
  search_filters JSONB, -- Applied filters

  -- Results
  results_count INTEGER DEFAULT 0,
  clicked_result_id UUID,
  clicked_result_position INTEGER,
  clicked_result_type search_entity_type,

  -- Context
  page_url VARCHAR(500),
  referrer VARCHAR(500),
  user_agent VARCHAR(500),

  -- Timing
  search_duration_ms INTEGER,

  -- Location
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_text ON search_queries USING GIN(to_tsvector('english', query_text));
CREATE INDEX idx_search_queries_date ON search_queries(created_at DESC);
CREATE INDEX idx_search_queries_normalized ON search_queries(query_normalized);

-- ============================================================================
-- SAVED SEARCHES
-- ============================================================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Search Details
  search_name VARCHAR(255) NOT NULL,
  query_text TEXT NOT NULL,
  search_filters JSONB,
  entity_types search_entity_type[],

  -- Notifications
  enable_notifications BOOLEAN DEFAULT false,
  notification_frequency VARCHAR(50), -- daily, weekly, instant
  last_notification_at TIMESTAMPTZ,

  -- Metadata
  result_count INTEGER,
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;

-- ============================================================================
-- SEARCH SUGGESTIONS
-- ============================================================================

CREATE TABLE search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Suggestion Details
  suggestion_text VARCHAR(255) NOT NULL,
  suggestion_normalized VARCHAR(255), -- For matching
  suggestion_type VARCHAR(50), -- query, entity, category, tag

  -- Association
  entity_type search_entity_type,
  entity_id UUID,

  -- Metrics
  usage_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,

  -- Relevance
  relevance_score DECIMAL(10,2) DEFAULT 0,
  trending_score DECIMAL(10,2) DEFAULT 0,

  -- Language
  language VARCHAR(10) DEFAULT 'en',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(suggestion_normalized, language)
);

CREATE INDEX idx_suggestions_text ON search_suggestions(suggestion_normalized);
CREATE INDEX idx_suggestions_type ON search_suggestions(suggestion_type);
CREATE INDEX idx_suggestions_score ON search_suggestions(relevance_score DESC);
CREATE INDEX idx_suggestions_trending ON search_suggestions(trending_score DESC);
CREATE INDEX idx_suggestions_active ON search_suggestions(is_active) WHERE is_active = true;

-- ============================================================================
-- TRENDING SEARCHES
-- ============================================================================

CREATE TABLE trending_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Query
  query_text VARCHAR(255) NOT NULL,
  query_normalized VARCHAR(255),

  -- Time Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type VARCHAR(50), -- hourly, daily, weekly

  -- Metrics
  search_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2),
  avg_results_count INTEGER,

  -- Trending Factors
  trending_score DECIMAL(10,2) DEFAULT 0,
  velocity DECIMAL(10,2), -- Rate of increase
  previous_rank INTEGER,
  current_rank INTEGER,

  -- Status
  is_trending BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false, -- Rapidly rising

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(query_normalized, period_start, period_end)
);

CREATE INDEX idx_trending_period ON trending_searches(period_start DESC, period_end DESC);
CREATE INDEX idx_trending_score ON trending_searches(trending_score DESC);
CREATE INDEX idx_trending_status ON trending_searches(is_trending) WHERE is_trending = true;

-- ============================================================================
-- SEARCH FACETS
-- ============================================================================

CREATE TABLE search_facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Facet Definition
  facet_key VARCHAR(100) NOT NULL, -- category, difficulty, duration, rating
  facet_name VARCHAR(255) NOT NULL,
  facet_type VARCHAR(50) NOT NULL, -- select, multiselect, range, date
  facet_group VARCHAR(100), -- Group related facets

  -- Options (for select/multiselect)
  options JSONB, -- [{"value": "beginner", "label": "Beginner", "count": 10}]

  -- Range (for range facets)
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  step_value DECIMAL(10,2),

  -- Display
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_expanded BOOLEAN DEFAULT false, -- Expanded by default in UI

  -- Entity Types
  applicable_entity_types search_entity_type[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(facet_key)
);

CREATE INDEX idx_facets_key ON search_facets(facet_key);
CREATE INDEX idx_facets_visible ON search_facets(is_visible) WHERE is_visible = true;
CREATE INDEX idx_facets_order ON search_facets(display_order);

-- ============================================================================
-- SEARCH RESULT CLICKS
-- ============================================================================

CREATE TABLE search_result_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES search_queries(id) ON DELETE CASCADE,

  -- Result Details
  entity_type search_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  result_position INTEGER NOT NULL,
  result_score DECIMAL(10,4),

  -- Interaction
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  time_to_click_ms INTEGER,
  dwell_time_seconds INTEGER, -- Time spent on result page

  -- User Context
  user_id UUID,
  session_id VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_query ON search_result_clicks(query_id);
CREATE INDEX idx_clicks_entity ON search_result_clicks(entity_type, entity_id);
CREATE INDEX idx_clicks_date ON search_result_clicks(created_at DESC);
CREATE INDEX idx_clicks_user ON search_result_clicks(user_id);

-- ============================================================================
-- CONTENT RECOMMENDATIONS
-- ============================================================================

CREATE TABLE content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,

  -- Source
  source_entity_type search_entity_type,
  source_entity_id UUID,

  -- Recommendation
  recommended_entity_type search_entity_type NOT NULL,
  recommended_entity_id UUID NOT NULL,

  -- Algorithm
  recommendation_source recommendation_source NOT NULL,
  confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  relevance_score DECIMAL(10,2) DEFAULT 0,

  -- Factors
  factors JSONB, -- {"similar_tags": 5, "same_category": 3, "user_history": 8}

  -- Interaction
  displayed BOOLEAN DEFAULT false,
  displayed_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,

  -- Expiry
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON content_recommendations(user_id);
CREATE INDEX idx_recommendations_entity ON content_recommendations(recommended_entity_type, recommended_entity_id);
CREATE INDEX idx_recommendations_source ON content_recommendations(recommendation_source);
CREATE INDEX idx_recommendations_score ON content_recommendations(confidence_score DESC);
CREATE INDEX idx_recommendations_displayed ON content_recommendations(displayed, displayed_at);

-- ============================================================================
-- USER SEARCH PREFERENCES
-- ============================================================================

CREATE TABLE user_search_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Preferences
  default_entity_types search_entity_type[],
  default_sort VARCHAR(50), -- relevance, recent, popular, rating
  results_per_page INTEGER DEFAULT 20,
  enable_auto_complete BOOLEAN DEFAULT true,
  enable_search_history BOOLEAN DEFAULT true,

  -- Filters
  preferred_languages VARCHAR(10)[],
  preferred_difficulty_levels VARCHAR(50)[],
  excluded_categories TEXT[],

  -- Privacy
  share_search_history BOOLEAN DEFAULT false,
  personalize_results BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_search_prefs_user ON user_search_preferences(user_id);

-- ============================================================================
-- SEARCH ANALYTICS AGGREGATE
-- ============================================================================

CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time Period
  date DATE NOT NULL,
  hour INTEGER, -- NULL for daily aggregates

  -- Metrics
  total_searches INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_queries INTEGER DEFAULT 0,
  avg_results_count DECIMAL(10,2),
  avg_search_duration_ms INTEGER,

  -- Engagement
  searches_with_clicks INTEGER DEFAULT 0,
  searches_with_no_results INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2),

  -- Top Queries
  top_queries JSONB, -- [{"query": "machine learning", "count": 100}]
  failed_queries JSONB, -- Queries with 0 results

  -- Entity Types
  entity_type_distribution JSONB, -- {"course": 500, "lesson": 300}

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(date, hour)
);

CREATE INDEX idx_analytics_date ON search_analytics(date DESC);
CREATE INDEX idx_analytics_date_hour ON search_analytics(date DESC, hour DESC);

-- ============================================================================
-- SEARCH SYNONYMS
-- ============================================================================

CREATE TABLE search_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Synonym Group
  group_name VARCHAR(255),
  terms TEXT[] NOT NULL, -- ["js", "javascript", "ecmascript"]

  -- Type
  synonym_type VARCHAR(50), -- bidirectional, unidirectional
  base_term VARCHAR(255), -- For unidirectional synonyms

  -- Language
  language VARCHAR(10) DEFAULT 'en',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_synonyms_terms ON search_synonyms USING GIN(terms);
CREATE INDEX idx_synonyms_language ON search_synonyms(language);
CREATE INDEX idx_synonyms_active ON search_synonyms(is_active) WHERE is_active = true;

-- ============================================================================
-- SEARCH STOPWORDS
-- ============================================================================

CREATE TABLE search_stopwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stopword
  word VARCHAR(100) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',

  -- Context
  context VARCHAR(50), -- general, domain-specific

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(word, language)
);

CREATE INDEX idx_stopwords_word ON search_stopwords(word);
CREATE INDEX idx_stopwords_language ON search_stopwords(language);
CREATE INDEX idx_stopwords_active ON search_stopwords(is_active) WHERE is_active = true;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Popular Searches View
CREATE VIEW popular_searches AS
SELECT
  query_normalized,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(clicked_result_id) as clicks,
  ROUND(COUNT(clicked_result_id)::NUMERIC / COUNT(*) * 100, 2) as ctr,
  AVG(results_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_queries
WHERE created_at > NOW() - INTERVAL '30 days'
  AND query_normalized IS NOT NULL
GROUP BY query_normalized
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;

-- Failed Searches View (No Results)
CREATE VIEW failed_searches AS
SELECT
  query_text,
  query_normalized,
  COUNT(*) as failure_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_failed
FROM search_queries
WHERE results_count = 0
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY query_text, query_normalized
ORDER BY failure_count DESC
LIMIT 100;

-- Search Performance View
CREATE VIEW search_performance AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_searches,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(results_count) as avg_results,
  AVG(search_duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN clicked_result_id IS NOT NULL THEN 1 END) as searches_with_clicks,
  ROUND(COUNT(CASE WHEN clicked_result_id IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as ctr
FROM search_queries
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update search vectors on insert/update
CREATE OR REPLACE FUNCTION update_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
  -- Set language config based on the language column
  NEW.title_vector = to_tsvector('english', COALESCE(NEW.title, ''));
  NEW.description_vector = to_tsvector('english', COALESCE(NEW.description, ''));
  NEW.content_vector = to_tsvector('english', COALESCE(NEW.content, ''));

  -- Combined vector with weights (A=1.0, B=0.4, C=0.2, D=0.1)
  NEW.combined_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_index_update_vectors
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vectors();

-- Full-text search function
CREATE OR REPLACE FUNCTION search_content(
  p_query TEXT,
  p_entity_types search_entity_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  entity_type search_entity_type,
  entity_id UUID,
  title TEXT,
  description TEXT,
  relevance_rank REAL,
  result_type search_result_type
) AS $$
DECLARE
  v_tsquery TSQUERY;
BEGIN
  -- Convert search query to tsquery
  v_tsquery = plainto_tsquery('english', p_query);

  RETURN QUERY
  SELECT
    si.entity_type,
    si.entity_id,
    si.title,
    si.description,
    ts_rank(si.combined_vector, v_tsquery) *
      (1 + LOG(1 + si.popularity_score)) as relevance_rank,
    'exact'::search_result_type as result_type
  FROM search_index si
  WHERE si.is_published = true
    AND si.is_searchable = true
    AND si.combined_vector @@ v_tsquery
    AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
  ORDER BY relevance_rank DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Auto-complete function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_prefix TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  suggestion TEXT,
  suggestion_type VARCHAR,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.suggestion_text,
    ss.suggestion_type,
    ss.usage_count
  FROM search_suggestions ss
  WHERE ss.is_active = true
    AND ss.suggestion_normalized LIKE LOWER(p_prefix) || '%'
  ORDER BY ss.relevance_score DESC, ss.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_search_count INTEGER,
  p_velocity DECIMAL,
  p_ctr DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    (p_search_count * 0.4) +
    (p_velocity * 0.4) +
    (p_ctr * 20 * 0.2)
  );
END;
$$ LANGUAGE plpgsql;

-- Record search click
CREATE OR REPLACE FUNCTION record_search_click()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search query with clicked result
  UPDATE search_queries
  SET
    clicked_result_id = NEW.entity_id,
    clicked_result_position = NEW.result_position,
    clicked_result_type = NEW.entity_type
  WHERE id = NEW.query_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_clicks_update_query
  AFTER INSERT ON search_result_clicks
  FOR EACH ROW
  EXECUTE FUNCTION record_search_click();

-- Update popularity score
CREATE OR REPLACE FUNCTION update_popularity_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE search_index
  SET popularity_score = (
    COALESCE(view_count, 0) * 0.3 +
    COALESCE(enrollment_count, 0) * 0.5 +
    COALESCE(rating, 0) * 4 * 0.2
  )
  WHERE entity_id = NEW.entity_id
    AND entity_type = NEW.entity_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update search index timestamp
CREATE OR REPLACE FUNCTION update_search_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_index_update_timestamp
  BEFORE UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_search_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE search_index IS 'Full-text search index for all searchable content';
COMMENT ON TABLE search_queries IS 'User search query history and analytics';
COMMENT ON TABLE saved_searches IS 'User-saved searches with notifications';
COMMENT ON TABLE search_suggestions IS 'Auto-complete suggestions';
COMMENT ON TABLE trending_searches IS 'Trending search queries by time period';
COMMENT ON TABLE search_facets IS 'Search facets and filters configuration';
COMMENT ON TABLE search_result_clicks IS 'Click tracking for search results';
COMMENT ON TABLE content_recommendations IS 'Personalized content recommendations';
COMMENT ON TABLE user_search_preferences IS 'User search preferences and settings';
COMMENT ON TABLE search_analytics IS 'Aggregated search analytics';
COMMENT ON TABLE search_synonyms IS 'Search synonyms for query expansion';
COMMENT ON TABLE search_stopwords IS 'Stopwords to filter from search queries';
