-- ============================================================================
-- AI/ML INTEGRATION SCHEMA
-- ============================================================================
-- This schema manages AI/ML features including recommendations, content analysis,
-- learning path optimization, skill gap analysis, and predictive analytics.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE ml_model_type AS ENUM (
  'recommendation',
  'content_analysis',
  'skill_prediction',
  'completion_prediction',
  'engagement_prediction',
  'difficulty_estimation',
  'personalization',
  'nlp_classification',
  'sentiment_analysis',
  'anomaly_detection'
);

CREATE TYPE model_status AS ENUM (
  'training',
  'validating',
  'active',
  'deprecated',
  'failed'
);

CREATE TYPE recommendation_type AS ENUM (
  'course',
  'content',
  'learning_path',
  'peer',
  'mentor',
  'resource',
  'skill'
);

CREATE TYPE recommendation_reason AS ENUM (
  'similar_users',
  'skill_gap',
  'learning_goal',
  'trending',
  'completion_likely',
  'prerequisite',
  'career_path',
  'interest_match'
);

CREATE TYPE content_quality_status AS ENUM (
  'excellent',
  'good',
  'fair',
  'needs_improvement',
  'poor'
);

CREATE TYPE prediction_type AS ENUM (
  'completion_likelihood',
  'dropout_risk',
  'engagement_level',
  'performance_forecast',
  'time_to_complete',
  'skill_mastery'
);

CREATE TYPE feedback_type AS ENUM (
  'positive',
  'negative',
  'neutral',
  'dismissed'
);

-- ============================================================================
-- ML MODELS
-- ============================================================================

CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  model_type ml_model_type NOT NULL,
  version VARCHAR(50) NOT NULL,
  status model_status DEFAULT 'training',

  -- Model Configuration
  algorithm VARCHAR(100),
  hyperparameters JSONB,
  feature_set JSONB,

  -- Training Information
  training_data_size INTEGER,
  training_started_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  trained_by UUID,

  -- Performance Metrics
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  rmse DECIMAL(10,4),
  mae DECIMAL(10,4),
  auc_roc DECIMAL(5,4),
  custom_metrics JSONB,

  -- Deployment
  deployed_at TIMESTAMPTZ,
  last_inference_at TIMESTAMPTZ,
  inference_count INTEGER DEFAULT 0,

  -- Model Artifacts
  model_path TEXT,
  artifact_url TEXT,
  model_size_mb DECIMAL(10,2),

  -- Metadata
  description TEXT,
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_model_version UNIQUE(name, version)
);

CREATE INDEX idx_ml_models_type_status ON ml_models(model_type, status);
CREATE INDEX idx_ml_models_deployed ON ml_models(deployed_at) WHERE status = 'active';

-- ============================================================================
-- AI RECOMMENDATIONS
-- ============================================================================

CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type recommendation_type NOT NULL,

  -- Recommended Item
  entity_type VARCHAR(50), -- course, module, lesson, user, etc.
  entity_id UUID,

  -- Recommendation Details
  score DECIMAL(5,4) NOT NULL, -- 0.0 to 1.0
  confidence DECIMAL(5,4),
  reasons recommendation_reason[],
  explanation TEXT,

  -- Context
  context JSONB, -- user state, session info, etc.
  model_id UUID REFERENCES ml_models(id),
  model_version VARCHAR(50),

  -- User Interaction
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  feedback feedback_type,
  feedback_note TEXT,

  -- Conversion Tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  conversion_value DECIMAL(10,2),

  -- Expiration
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id, created_at DESC);
CREATE INDEX idx_ai_recommendations_active ON ai_recommendations(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type, created_at DESC);
CREATE INDEX idx_ai_recommendations_entity ON ai_recommendations(entity_type, entity_id);

-- ============================================================================
-- CONTENT ANALYSIS
-- ============================================================================

CREATE TABLE content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- course, module, lesson, video, document
  content_id UUID NOT NULL,

  -- Quality Metrics
  quality_score DECIMAL(5,4), -- 0.0 to 1.0
  quality_status content_quality_status,
  readability_score DECIMAL(5,4),
  engagement_score DECIMAL(5,4),
  effectiveness_score DECIMAL(5,4),

  -- Content Attributes
  difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
  estimated_duration_minutes INTEGER,
  word_count INTEGER,
  media_count INTEGER,
  interactive_elements_count INTEGER,

  -- Topic & Skills
  detected_topics TEXT[],
  detected_skills TEXT[],
  detected_keywords TEXT[],
  primary_category VARCHAR(100),

  -- Sentiment & Tone
  sentiment_score DECIMAL(5,4), -- -1.0 (negative) to 1.0 (positive)
  tone VARCHAR(50), -- formal, casual, technical, conversational

  -- Accessibility
  accessibility_score DECIMAL(5,4),
  accessibility_issues TEXT[],

  -- SEO & Discoverability
  seo_score DECIMAL(5,4),
  meta_quality JSONB,

  -- Analysis Details
  analyzed_by_model_id UUID REFERENCES ml_models(id),
  analysis_metadata JSONB,

  -- Recommendations
  improvement_suggestions TEXT[],
  similar_content_ids UUID[],

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_content_analysis UNIQUE(content_type, content_id)
);

CREATE INDEX idx_content_analysis_content ON content_analysis(content_type, content_id);
CREATE INDEX idx_content_analysis_quality ON content_analysis(quality_status);
CREATE INDEX idx_content_analysis_topics ON content_analysis USING GIN(detected_topics);
CREATE INDEX idx_content_analysis_skills ON content_analysis USING GIN(detected_skills);

-- ============================================================================
-- LEARNING PATH OPTIMIZATION
-- ============================================================================

CREATE TABLE optimized_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Goal
  target_skill VARCHAR(255),
  target_role VARCHAR(255),
  completion_goal_date DATE,

  -- Current State
  current_skill_level VARCHAR(50),
  completed_courses UUID[],
  in_progress_courses UUID[],

  -- Optimized Path
  recommended_courses JSONB, -- [{courseId, order, reason, estimated_hours}]
  total_estimated_hours INTEGER,
  estimated_completion_date DATE,

  -- Path Metrics
  path_efficiency_score DECIMAL(5,4),
  skill_coverage_score DECIMAL(5,4),
  difficulty_progression_score DECIMAL(5,4),

  -- Generation Details
  generated_by_model_id UUID REFERENCES ml_models(id),
  generation_factors JSONB,
  confidence_score DECIMAL(5,4),

  -- User Interaction
  accepted BOOLEAN,
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  progress_percentage DECIMAL(5,2) DEFAULT 0,

  -- Tracking
  is_active BOOLEAN DEFAULT true,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_optimized_paths_user ON optimized_learning_paths(user_id, is_active);
CREATE INDEX idx_optimized_paths_skill ON optimized_learning_paths(target_skill);

-- ============================================================================
-- SKILL GAP ANALYSIS
-- ============================================================================

CREATE TABLE skill_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Target Profile
  target_role VARCHAR(255),
  target_skills JSONB, -- [{skill, required_level}]

  -- Current Profile
  current_skills JSONB, -- [{skill, current_level, proficiency_score}]

  -- Gap Analysis
  skill_gaps JSONB, -- [{skill, gap_size, priority, estimated_time}]
  overall_gap_score DECIMAL(5,4),
  priority_gaps TEXT[],

  -- Recommendations
  recommended_courses UUID[],
  recommended_resources JSONB,
  estimated_time_to_close INTEGER, -- hours

  -- Analysis Details
  analyzed_by_model_id UUID REFERENCES ml_models(id),
  analysis_factors JSONB,
  confidence_score DECIMAL(5,4),

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_skill_gap_user ON skill_gap_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_skill_gap_role ON skill_gap_analysis(target_role);

-- ============================================================================
-- PREDICTIVE ANALYTICS
-- ============================================================================

CREATE TABLE user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prediction_type prediction_type NOT NULL,

  -- Related Entity
  entity_type VARCHAR(50), -- course, module, lesson
  entity_id UUID,

  -- Prediction
  predicted_value DECIMAL(10,4),
  predicted_category VARCHAR(100),
  confidence_score DECIMAL(5,4),

  -- Risk Factors (for negative predictions)
  risk_level VARCHAR(20), -- low, medium, high, critical
  risk_factors TEXT[],

  -- Recommended Actions
  recommended_interventions TEXT[],
  intervention_priority INTEGER,

  -- Model Information
  model_id UUID REFERENCES ml_models(id),
  model_version VARCHAR(50),
  prediction_factors JSONB,

  -- Validation
  actual_value DECIMAL(10,4),
  actual_category VARCHAR(100),
  prediction_error DECIMAL(10,4),
  was_accurate BOOLEAN,

  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  actual_recorded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_predictions_user ON user_predictions(user_id, prediction_type);
CREATE INDEX idx_user_predictions_entity ON user_predictions(entity_type, entity_id);
CREATE INDEX idx_user_predictions_risk ON user_predictions(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_user_predictions_expires ON user_predictions(expires_at);

-- ============================================================================
-- TRAINING DATA & FEEDBACK
-- ============================================================================

CREATE TABLE ml_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type ml_model_type NOT NULL,

  -- Data Sample
  features JSONB NOT NULL,
  labels JSONB,

  -- Source
  source_type VARCHAR(50), -- user_interaction, manual_label, synthetic
  source_id UUID,
  user_id UUID,

  -- Quality
  is_validated BOOLEAN DEFAULT false,
  validation_score DECIMAL(5,4),
  validated_by UUID,
  validated_at TIMESTAMPTZ,

  -- Usage
  used_in_training BOOLEAN DEFAULT false,
  used_in_model_ids UUID[],

  -- Metadata
  data_version VARCHAR(50),
  tags TEXT[],
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_training_model ON ml_training_data(model_type, is_validated);
CREATE INDEX idx_ml_training_source ON ml_training_data(source_type, source_id);
CREATE INDEX idx_ml_training_user ON ml_training_data(user_id);

-- ============================================================================
-- RECOMMENDATION FEEDBACK
-- ============================================================================

CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Feedback
  feedback_type feedback_type NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,

  -- Context
  interaction_duration INTEGER, -- seconds spent viewing
  clicked_through BOOLEAN,
  completed_action BOOLEAN,

  -- Metadata
  feedback_metadata JSONB,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendation_feedback_rec ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX idx_recommendation_feedback_type ON recommendation_feedback(feedback_type);

-- ============================================================================
-- MODEL PERFORMANCE TRACKING
-- ============================================================================

CREATE TABLE model_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,

  -- Performance Window
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Metrics
  inference_count INTEGER,
  avg_inference_time_ms DECIMAL(10,2),
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),

  -- User Engagement
  recommendation_ctr DECIMAL(5,4), -- click-through rate
  conversion_rate DECIMAL(5,4),
  avg_user_rating DECIMAL(3,2),

  -- Drift Detection
  data_drift_score DECIMAL(5,4),
  concept_drift_score DECIMAL(5,4),
  needs_retraining BOOLEAN DEFAULT false,

  -- Resource Usage
  cpu_usage_avg DECIMAL(5,2),
  memory_usage_avg_mb DECIMAL(10,2),

  -- Detailed Metrics
  detailed_metrics JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_model_performance_model ON model_performance_logs(model_id, period_start DESC);
CREATE INDEX idx_model_performance_drift ON model_performance_logs(needs_retraining) WHERE needs_retraining = true;

-- ============================================================================
-- FEATURE IMPORTANCE
-- ============================================================================

CREATE TABLE feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,

  -- Feature
  feature_name VARCHAR(255) NOT NULL,
  feature_category VARCHAR(100),

  -- Importance Metrics
  importance_score DECIMAL(10,8) NOT NULL,
  rank INTEGER,

  -- Statistical Measures
  correlation DECIMAL(5,4),
  p_value DECIMAL(10,8),
  confidence_interval_low DECIMAL(10,8),
  confidence_interval_high DECIMAL(10,8),

  -- Analysis Details
  calculation_method VARCHAR(100),
  sample_size INTEGER,

  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_importance_model ON feature_importance(model_id, rank);
CREATE INDEX idx_feature_importance_score ON feature_importance(importance_score DESC);

-- ============================================================================
-- AI INSIGHTS
-- ============================================================================

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(100) NOT NULL,

  -- Scope
  scope_type VARCHAR(50), -- platform, organization, course, user
  scope_id UUID,

  -- Insight
  title VARCHAR(255) NOT NULL,
  description TEXT,
  insight_data JSONB,

  -- Metrics
  confidence_score DECIMAL(5,4),
  impact_score DECIMAL(5,4), -- potential impact if acted upon
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),

  -- Recommendations
  recommended_actions TEXT[],
  expected_outcome TEXT,

  -- Generation
  generated_by_model_id UUID REFERENCES ml_models(id),
  generation_factors JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'new', -- new, reviewing, acted_upon, dismissed
  acted_upon BOOLEAN DEFAULT false,
  acted_upon_at TIMESTAMPTZ,
  acted_upon_by UUID,
  action_taken TEXT,
  action_outcome TEXT,

  -- Visibility
  is_public BOOLEAN DEFAULT false,
  target_audience VARCHAR(50), -- admin, instructor, user

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_insights_scope ON ai_insights(scope_type, scope_id);
CREATE INDEX idx_ai_insights_status ON ai_insights(status, created_at DESC);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority DESC, created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active ML Models Overview
CREATE VIEW active_ml_models AS
SELECT
  m.id,
  m.name,
  m.model_type,
  m.version,
  m.accuracy,
  m.deployed_at,
  m.last_inference_at,
  m.inference_count,
  COUNT(DISTINCT p.id) as active_predictions,
  AVG(p.confidence_score) as avg_confidence
FROM ml_models m
LEFT JOIN user_predictions p ON p.model_id = m.id
  AND p.expires_at > NOW()
WHERE m.status = 'active'
GROUP BY m.id, m.name, m.model_type, m.version, m.accuracy,
         m.deployed_at, m.last_inference_at, m.inference_count;

-- Recommendation Performance
CREATE VIEW recommendation_performance AS
SELECT
  r.recommendation_type,
  r.model_id,
  COUNT(*) as total_recommendations,
  COUNT(CASE WHEN r.clicked_at IS NOT NULL THEN 1 END) as clicks,
  COUNT(CASE WHEN r.converted THEN 1 END) as conversions,
  ROUND(COUNT(CASE WHEN r.clicked_at IS NOT NULL THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0), 4) as ctr,
  ROUND(COUNT(CASE WHEN r.converted THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0), 4) as conversion_rate,
  AVG(r.score) as avg_score,
  AVG(r.confidence) as avg_confidence
FROM ai_recommendations r
WHERE r.shown_at > NOW() - INTERVAL '30 days'
GROUP BY r.recommendation_type, r.model_id;

-- Content Quality Summary
CREATE VIEW content_quality_summary AS
SELECT
  ca.content_type,
  ca.quality_status,
  COUNT(*) as content_count,
  AVG(ca.quality_score) as avg_quality_score,
  AVG(ca.readability_score) as avg_readability,
  AVG(ca.engagement_score) as avg_engagement,
  AVG(ca.effectiveness_score) as avg_effectiveness
FROM content_analysis ca
GROUP BY ca.content_type, ca.quality_status;

-- At-Risk Users
CREATE VIEW at_risk_users AS
SELECT
  p.user_id,
  COUNT(*) as risk_predictions,
  MAX(p.risk_level) as highest_risk_level,
  ARRAY_AGG(DISTINCT p.prediction_type) as risk_types,
  ARRAY_AGG(DISTINCT unnest(p.risk_factors)) as all_risk_factors,
  MAX(p.predicted_at) as last_prediction_at
FROM user_predictions p
WHERE p.prediction_type IN ('dropout_risk', 'completion_likelihood')
  AND p.risk_level IN ('high', 'critical')
  AND p.expires_at > NOW()
GROUP BY p.user_id;

-- Model Performance Summary
CREATE VIEW model_performance_summary AS
SELECT
  m.id,
  m.name,
  m.model_type,
  m.status,
  COUNT(DISTINCT pl.id) as performance_logs_count,
  AVG(pl.accuracy) as avg_accuracy,
  AVG(pl.recommendation_ctr) as avg_ctr,
  AVG(pl.conversion_rate) as avg_conversion_rate,
  MAX(pl.needs_retraining) as needs_retraining,
  MAX(pl.created_at) as last_performance_check
FROM ml_models m
LEFT JOIN model_performance_logs pl ON pl.model_id = m.id
  AND pl.period_start > NOW() - INTERVAL '90 days'
GROUP BY m.id, m.name, m.model_type, m.status;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get personalized recommendations for a user
CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id UUID,
  p_recommendation_type recommendation_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  recommendation_id UUID,
  recommendation_type recommendation_type,
  entity_type VARCHAR,
  entity_id UUID,
  score DECIMAL,
  confidence DECIMAL,
  reasons recommendation_reason[],
  explanation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.recommendation_type,
    r.entity_type,
    r.entity_id,
    r.score,
    r.confidence,
    r.reasons,
    r.explanation
  FROM ai_recommendations r
  WHERE r.user_id = p_user_id
    AND r.is_active = true
    AND (r.expires_at IS NULL OR r.expires_at > NOW())
    AND (p_recommendation_type IS NULL OR r.recommendation_type = p_recommendation_type)
    AND r.dismissed_at IS NULL
  ORDER BY r.score DESC, r.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to record recommendation feedback
CREATE OR REPLACE FUNCTION record_recommendation_feedback(
  p_recommendation_id UUID,
  p_user_id UUID,
  p_feedback_type feedback_type,
  p_rating INTEGER DEFAULT NULL,
  p_feedback_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_feedback_id UUID;
BEGIN
  -- Insert feedback
  INSERT INTO recommendation_feedback (
    recommendation_id,
    user_id,
    feedback_type,
    rating,
    feedback_text
  ) VALUES (
    p_recommendation_id,
    p_user_id,
    p_feedback_type,
    p_rating,
    p_feedback_text
  ) RETURNING id INTO v_feedback_id;

  -- Update recommendation
  UPDATE ai_recommendations
  SET feedback = p_feedback_type,
      feedback_note = p_feedback_text
  WHERE id = p_recommendation_id;

  RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if content needs analysis
CREATE OR REPLACE FUNCTION needs_content_analysis(
  p_content_type VARCHAR,
  p_content_id UUID,
  p_max_age_days INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
  v_last_analysis TIMESTAMPTZ;
BEGIN
  SELECT analyzed_at INTO v_last_analysis
  FROM content_analysis
  WHERE content_type = p_content_type
    AND content_id = p_content_id;

  IF v_last_analysis IS NULL THEN
    RETURN true;
  END IF;

  IF v_last_analysis < NOW() - (p_max_age_days || ' days')::INTERVAL THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_predictions
  WHERE expires_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate recommendation effectiveness
CREATE OR REPLACE FUNCTION calculate_recommendation_effectiveness(
  p_model_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  total_recommendations BIGINT,
  click_through_rate DECIMAL,
  conversion_rate DECIMAL,
  avg_score DECIMAL,
  avg_confidence DECIMAL,
  positive_feedback_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    ROUND(COUNT(CASE WHEN r.clicked_at IS NOT NULL THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0), 4),
    ROUND(COUNT(CASE WHEN r.converted THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0), 4),
    ROUND(AVG(r.score), 4),
    ROUND(AVG(r.confidence), 4),
    ROUND(COUNT(CASE WHEN rf.feedback_type = 'positive' THEN 1 END)::DECIMAL / NULLIF(COUNT(rf.id), 0), 4)
  FROM ai_recommendations r
  LEFT JOIN recommendation_feedback rf ON rf.recommendation_id = r.id
  WHERE r.model_id = p_model_id
    AND r.shown_at > NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update ml_models updated_at timestamp
CREATE OR REPLACE FUNCTION update_ml_model_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ml_models_update_timestamp
  BEFORE UPDATE ON ml_models
  FOR EACH ROW
  EXECUTE FUNCTION update_ml_model_timestamp();

-- Increment inference count when prediction is made
CREATE OR REPLACE FUNCTION increment_model_inference()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ml_models
  SET inference_count = inference_count + 1,
      last_inference_at = NOW()
  WHERE id = NEW.model_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_predictions_increment_inference
  AFTER INSERT ON user_predictions
  FOR EACH ROW
  WHEN (NEW.model_id IS NOT NULL)
  EXECUTE FUNCTION increment_model_inference();

-- Track recommendation conversions
CREATE OR REPLACE FUNCTION track_recommendation_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted = true AND OLD.converted = false THEN
    NEW.converted_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_recommendations_track_conversion
  BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW
  WHEN (NEW.converted IS DISTINCT FROM OLD.converted)
  EXECUTE FUNCTION track_recommendation_conversion();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes
CREATE INDEX idx_ai_recommendations_user_type_score ON ai_recommendations(user_id, recommendation_type, score DESC);
CREATE INDEX idx_user_predictions_user_type_risk ON user_predictions(user_id, prediction_type, risk_level);
CREATE INDEX idx_content_analysis_quality_type ON content_analysis(quality_status, content_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ml_models IS 'ML models used across the platform for various AI features';
COMMENT ON TABLE ai_recommendations IS 'AI-generated recommendations for users';
COMMENT ON TABLE content_analysis IS 'Automated analysis of course content quality and attributes';
COMMENT ON TABLE optimized_learning_paths IS 'AI-optimized learning paths for users based on goals';
COMMENT ON TABLE skill_gap_analysis IS 'Analysis of skill gaps and recommendations to close them';
COMMENT ON TABLE user_predictions IS 'Predictive analytics for user behavior and performance';
COMMENT ON TABLE ml_training_data IS 'Training data for ML models';
COMMENT ON TABLE recommendation_feedback IS 'User feedback on AI recommendations';
COMMENT ON TABLE model_performance_logs IS 'Performance tracking for ML models over time';
COMMENT ON TABLE feature_importance IS 'Feature importance scores for ML models';
COMMENT ON TABLE ai_insights IS 'AI-generated insights for platform optimization';
