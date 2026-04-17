import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateMLModelParams {
  name: string;
  modelType: string;
  version: string;
  algorithm?: string;
  hyperparameters?: any;
  featureSet?: any;
  trainedBy?: string;
  description?: string;
  tags?: string[];
}

interface CreateRecommendationParams {
  userId: string;
  recommendationType: string;
  entityType: string;
  entityId: string;
  score: number;
  confidence?: number;
  reasons?: string[];
  explanation?: string;
  context?: any;
  modelId?: string;
  modelVersion?: string;
  expiresAt?: Date;
}

interface ContentAnalysisParams {
  contentType: string;
  contentId: string;
  qualityScore?: number;
  qualityStatus?: string;
  readabilityScore?: number;
  engagementScore?: number;
  effectivenessScore?: number;
  difficultyLevel?: string;
  estimatedDurationMinutes?: number;
  detectedTopics?: string[];
  detectedSkills?: string[];
  detectedKeywords?: string[];
  sentimentScore?: number;
  modelId?: string;
  improvementSuggestions?: string[];
}

interface OptimizedPathParams {
  userId: string;
  targetSkill?: string;
  targetRole?: string;
  completionGoalDate?: Date;
  currentSkillLevel?: string;
  completedCourses?: string[];
  inProgressCourses?: string[];
  recommendedCourses: any;
  totalEstimatedHours?: number;
  modelId?: string;
  confidenceScore?: number;
}

interface SkillGapParams {
  userId: string;
  targetRole: string;
  targetSkills: any;
  currentSkills: any;
  skillGaps: any;
  overallGapScore?: number;
  recommendedCourses?: string[];
  estimatedTimeToClose?: number;
  modelId?: string;
  confidenceScore?: number;
}

interface UserPredictionParams {
  userId: string;
  predictionType: string;
  entityType?: string;
  entityId?: string;
  predictedValue?: number;
  predictedCategory?: string;
  confidenceScore: number;
  riskLevel?: string;
  riskFactors?: string[];
  recommendedInterventions?: string[];
  modelId?: string;
  modelVersion?: string;
  predictionFactors?: any;
  expiresAt?: Date;
}

interface TrainingDataParams {
  modelType: string;
  features: any;
  labels?: any;
  sourceType: string;
  sourceId?: string;
  userId?: string;
  dataVersion?: string;
  tags?: string[];
}

interface AIInsightParams {
  insightType: string;
  scopeType: string;
  scopeId?: string;
  title: string;
  description?: string;
  insightData?: any;
  confidenceScore?: number;
  impactScore?: number;
  priority?: number;
  recommendedActions?: string[];
  expectedOutcome?: string;
  modelId?: string;
  isPublic?: boolean;
  targetAudience?: string;
}

// ============================================================================
// AI/ML SERVICE
// ============================================================================

export class AIMLService {
  // ========================================
  // ML MODEL MANAGEMENT
  // ========================================

  async createMLModel(params: CreateMLModelParams): Promise<any> {
    const {
      name,
      modelType,
      version,
      algorithm,
      hyperparameters,
      featureSet,
      trainedBy,
      description,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO ml_models (
        name, model_type, version, algorithm, hyperparameters, feature_set,
        trained_by, description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        name,
        modelType,
        version,
        algorithm,
        hyperparameters ? JSON.stringify(hyperparameters) : null,
        featureSet ? JSON.stringify(featureSet) : null,
        trainedBy,
        description,
        tags
      ]
    );

    return result.rows[0];
  }

  async getMLModel(modelId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM ml_models WHERE id = $1`,
      [modelId]
    );
    return result.rows[0];
  }

  async listMLModels(filters: any = {}): Promise<any[]> {
    const { modelType, status, limit = 50 } = filters;

    let query = `SELECT * FROM ml_models WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (modelType) {
      query += ` AND model_type = $${paramIndex}`;
      params.push(modelType);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateMLModelStatus(modelId: string, status: string, metrics?: any): Promise<any> {
    const result = await pool.query(
      `UPDATE ml_models
      SET status = $2,
          accuracy = COALESCE($3, accuracy),
          precision_score = COALESCE($4, precision_score),
          recall_score = COALESCE($5, recall_score),
          f1_score = COALESCE($6, f1_score),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        modelId,
        status,
        metrics?.accuracy,
        metrics?.precisionScore,
        metrics?.recallScore,
        metrics?.f1Score
      ]
    );

    return result.rows[0];
  }

  async deployMLModel(modelId: string, modelPath: string, artifactUrl?: string): Promise<any> {
    const result = await pool.query(
      `UPDATE ml_models
      SET status = 'active',
          deployed_at = NOW(),
          model_path = $2,
          artifact_url = $3,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [modelId, modelPath, artifactUrl]
    );

    return result.rows[0];
  }

  async getActiveMLModels(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM active_ml_models`);
    return result.rows;
  }

  // ========================================
  // AI RECOMMENDATIONS
  // ========================================

  async createRecommendation(params: CreateRecommendationParams): Promise<any> {
    const {
      userId,
      recommendationType,
      entityType,
      entityId,
      score,
      confidence,
      reasons,
      explanation,
      context,
      modelId,
      modelVersion,
      expiresAt
    } = params;

    const result = await pool.query(
      `INSERT INTO ai_recommendations (
        user_id, recommendation_type, entity_type, entity_id, score,
        confidence, reasons, explanation, context, model_id, model_version, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        recommendationType,
        entityType,
        entityId,
        score,
        confidence,
        reasons,
        explanation,
        context ? JSON.stringify(context) : null,
        modelId,
        modelVersion,
        expiresAt
      ]
    );

    return result.rows[0];
  }

  async getUserRecommendations(
    userId: string,
    recommendationType?: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM get_user_recommendations($1, $2, $3)`,
      [userId, recommendationType, limit]
    );

    return result.rows;
  }

  async recordRecommendationClick(recommendationId: string): Promise<void> {
    await pool.query(
      `UPDATE ai_recommendations
      SET clicked_at = NOW()
      WHERE id = $1`,
      [recommendationId]
    );
  }

  async recordRecommendationConversion(
    recommendationId: string,
    conversionValue?: number
  ): Promise<void> {
    await pool.query(
      `UPDATE ai_recommendations
      SET converted = true,
          converted_at = NOW(),
          conversion_value = $2
      WHERE id = $1`,
      [recommendationId, conversionValue]
    );
  }

  async dismissRecommendation(recommendationId: string): Promise<void> {
    await pool.query(
      `UPDATE ai_recommendations
      SET dismissed_at = NOW(),
          is_active = false
      WHERE id = $1`,
      [recommendationId]
    );
  }

  async recordRecommendationFeedback(
    recommendationId: string,
    userId: string,
    feedbackType: string,
    rating?: number,
    feedbackText?: string
  ): Promise<string> {
    const result = await pool.query(
      `SELECT record_recommendation_feedback($1, $2, $3, $4, $5) as feedback_id`,
      [recommendationId, userId, feedbackType, rating, feedbackText]
    );

    return result.rows[0].feedback_id;
  }

  async getRecommendationPerformance(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM recommendation_performance`);
    return result.rows;
  }

  // ========================================
  // CONTENT ANALYSIS
  // ========================================

  async analyzeContent(params: ContentAnalysisParams): Promise<any> {
    const {
      contentType,
      contentId,
      qualityScore,
      qualityStatus,
      readabilityScore,
      engagementScore,
      effectivenessScore,
      difficultyLevel,
      estimatedDurationMinutes,
      detectedTopics,
      detectedSkills,
      detectedKeywords,
      sentimentScore,
      modelId,
      improvementSuggestions
    } = params;

    const result = await pool.query(
      `INSERT INTO content_analysis (
        content_type, content_id, quality_score, quality_status, readability_score,
        engagement_score, effectiveness_score, difficulty_level, estimated_duration_minutes,
        detected_topics, detected_skills, detected_keywords, sentiment_score,
        analyzed_by_model_id, improvement_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (content_type, content_id) DO UPDATE
      SET quality_score = $3,
          quality_status = $4,
          readability_score = $5,
          engagement_score = $6,
          effectiveness_score = $7,
          difficulty_level = $8,
          estimated_duration_minutes = $9,
          detected_topics = $10,
          detected_skills = $11,
          detected_keywords = $12,
          sentiment_score = $13,
          analyzed_by_model_id = $14,
          improvement_suggestions = $15,
          analyzed_at = NOW(),
          updated_at = NOW()
      RETURNING *`,
      [
        contentType,
        contentId,
        qualityScore,
        qualityStatus,
        readabilityScore,
        engagementScore,
        effectivenessScore,
        difficultyLevel,
        estimatedDurationMinutes,
        detectedTopics,
        detectedSkills,
        detectedKeywords,
        sentimentScore,
        modelId,
        improvementSuggestions
      ]
    );

    return result.rows[0];
  }

  async getContentAnalysis(contentType: string, contentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM content_analysis WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );

    return result.rows[0];
  }

  async needsContentAnalysis(
    contentType: string,
    contentId: string,
    maxAgeDays: number = 30
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT needs_content_analysis($1, $2, $3) as needs_analysis`,
      [contentType, contentId, maxAgeDays]
    );

    return result.rows[0]?.needs_analysis || false;
  }

  async getContentQualitySummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM content_quality_summary`);
    return result.rows;
  }

  async getContentByQuality(qualityStatus: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM content_analysis WHERE quality_status = $1 ORDER BY quality_score DESC LIMIT $2`,
      [qualityStatus, limit]
    );

    return result.rows;
  }

  // ========================================
  // LEARNING PATH OPTIMIZATION
  // ========================================

  async createOptimizedPath(params: OptimizedPathParams): Promise<any> {
    const {
      userId,
      targetSkill,
      targetRole,
      completionGoalDate,
      currentSkillLevel,
      completedCourses,
      inProgressCourses,
      recommendedCourses,
      totalEstimatedHours,
      modelId,
      confidenceScore
    } = params;

    const result = await pool.query(
      `INSERT INTO optimized_learning_paths (
        user_id, target_skill, target_role, completion_goal_date, current_skill_level,
        completed_courses, in_progress_courses, recommended_courses, total_estimated_hours,
        generated_by_model_id, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        targetSkill,
        targetRole,
        completionGoalDate,
        currentSkillLevel,
        completedCourses,
        inProgressCourses,
        JSON.stringify(recommendedCourses),
        totalEstimatedHours,
        modelId,
        confidenceScore
      ]
    );

    return result.rows[0];
  }

  async getUserLearningPaths(userId: string, activeOnly: boolean = true): Promise<any[]> {
    let query = `SELECT * FROM optimized_learning_paths WHERE user_id = $1`;

    if (activeOnly) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async acceptLearningPath(pathId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE optimized_learning_paths
      SET accepted = true,
          accepted_at = NOW(),
          started_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [pathId]
    );

    return result.rows[0];
  }

  async updatePathProgress(pathId: string, progressPercentage: number): Promise<any> {
    const result = await pool.query(
      `UPDATE optimized_learning_paths
      SET progress_percentage = $2,
          last_updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [pathId, progressPercentage]
    );

    return result.rows[0];
  }

  // ========================================
  // SKILL GAP ANALYSIS
  // ========================================

  async createSkillGapAnalysis(params: SkillGapParams): Promise<any> {
    const {
      userId,
      targetRole,
      targetSkills,
      currentSkills,
      skillGaps,
      overallGapScore,
      recommendedCourses,
      estimatedTimeToClose,
      modelId,
      confidenceScore
    } = params;

    const result = await pool.query(
      `INSERT INTO skill_gap_analysis (
        user_id, target_role, target_skills, current_skills, skill_gaps,
        overall_gap_score, recommended_courses, estimated_time_to_close,
        analyzed_by_model_id, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        targetRole,
        JSON.stringify(targetSkills),
        JSON.stringify(currentSkills),
        JSON.stringify(skillGaps),
        overallGapScore,
        recommendedCourses,
        estimatedTimeToClose,
        modelId,
        confidenceScore
      ]
    );

    return result.rows[0];
  }

  async getUserSkillGaps(userId: string, limit: number = 5): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM skill_gap_analysis
      WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY analyzed_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  async getSkillGapsByRole(targetRole: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM skill_gap_analysis
      WHERE target_role = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY analyzed_at DESC
      LIMIT $2`,
      [targetRole, limit]
    );

    return result.rows;
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  async createPrediction(params: UserPredictionParams): Promise<any> {
    const {
      userId,
      predictionType,
      entityType,
      entityId,
      predictedValue,
      predictedCategory,
      confidenceScore,
      riskLevel,
      riskFactors,
      recommendedInterventions,
      modelId,
      modelVersion,
      predictionFactors,
      expiresAt
    } = params;

    const result = await pool.query(
      `INSERT INTO user_predictions (
        user_id, prediction_type, entity_type, entity_id, predicted_value,
        predicted_category, confidence_score, risk_level, risk_factors,
        recommended_interventions, model_id, model_version, prediction_factors, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        predictionType,
        entityType,
        entityId,
        predictedValue,
        predictedCategory,
        confidenceScore,
        riskLevel,
        riskFactors,
        recommendedInterventions,
        modelId,
        modelVersion,
        predictionFactors ? JSON.stringify(predictionFactors) : null,
        expiresAt
      ]
    );

    return result.rows[0];
  }

  async getUserPredictions(
    userId: string,
    predictionType?: string,
    limit: number = 10
  ): Promise<any[]> {
    let query = `SELECT * FROM user_predictions WHERE user_id = $1`;
    const params: any[] = [userId];

    if (predictionType) {
      query += ` AND prediction_type = $2`;
      params.push(predictionType);
    }

    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += ` ORDER BY predicted_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAtRiskUsers(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM at_risk_users`);
    return result.rows;
  }

  async recordActualOutcome(
    predictionId: string,
    actualValue?: number,
    actualCategory?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE user_predictions
      SET actual_value = $2,
          actual_category = $3,
          actual_recorded_at = NOW(),
          prediction_error = ABS(predicted_value - $2),
          was_accurate = CASE
            WHEN predicted_category IS NOT NULL THEN predicted_category = $3
            ELSE ABS(predicted_value - $2) < 0.1
          END
      WHERE id = $1`,
      [predictionId, actualValue, actualCategory]
    );
  }

  async cleanupExpiredPredictions(): Promise<number> {
    const result = await pool.query(`SELECT cleanup_expired_predictions()`);
    return result.rows[0]?.cleanup_expired_predictions || 0;
  }

  // ========================================
  // TRAINING DATA
  // ========================================

  async addTrainingData(params: TrainingDataParams): Promise<any> {
    const { modelType, features, labels, sourceType, sourceId, userId, dataVersion, tags } = params;

    const result = await pool.query(
      `INSERT INTO ml_training_data (
        model_type, features, labels, source_type, source_id, user_id, data_version, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        modelType,
        JSON.stringify(features),
        labels ? JSON.stringify(labels) : null,
        sourceType,
        sourceId,
        userId,
        dataVersion,
        tags
      ]
    );

    return result.rows[0];
  }

  async getTrainingData(
    modelType: string,
    validated: boolean = false,
    limit: number = 1000
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM ml_training_data
      WHERE model_type = $1
        AND ($2 = false OR is_validated = true)
      ORDER BY created_at DESC
      LIMIT $3`,
      [modelType, validated, limit]
    );

    return result.rows;
  }

  async validateTrainingData(
    dataId: string,
    validatedBy: string,
    validationScore: number
  ): Promise<void> {
    await pool.query(
      `UPDATE ml_training_data
      SET is_validated = true,
          validation_score = $2,
          validated_by = $3,
          validated_at = NOW()
      WHERE id = $1`,
      [dataId, validationScore, validatedBy]
    );
  }

  // ========================================
  // MODEL PERFORMANCE
  // ========================================

  async logModelPerformance(
    modelId: string,
    periodStart: Date,
    periodEnd: Date,
    metrics: any
  ): Promise<any> {
    const {
      inferenceCount,
      avgInferenceTimeMs,
      accuracy,
      precisionScore,
      recallScore,
      f1Score,
      recommendationCtr,
      conversionRate,
      avgUserRating,
      dataDriftScore,
      conceptDriftScore,
      needsRetraining,
      detailedMetrics
    } = metrics;

    const result = await pool.query(
      `INSERT INTO model_performance_logs (
        model_id, period_start, period_end, inference_count, avg_inference_time_ms,
        accuracy, precision_score, recall_score, f1_score, recommendation_ctr,
        conversion_rate, avg_user_rating, data_drift_score, concept_drift_score,
        needs_retraining, detailed_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        modelId,
        periodStart,
        periodEnd,
        inferenceCount,
        avgInferenceTimeMs,
        accuracy,
        precisionScore,
        recallScore,
        f1Score,
        recommendationCtr,
        conversionRate,
        avgUserRating,
        dataDriftScore,
        conceptDriftScore,
        needsRetraining,
        detailedMetrics ? JSON.stringify(detailedMetrics) : null
      ]
    );

    return result.rows[0];
  }

  async getModelPerformanceSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM model_performance_summary`);
    return result.rows;
  }

  async calculateRecommendationEffectiveness(
    modelId: string,
    days: number = 30
  ): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM calculate_recommendation_effectiveness($1, $2)`,
      [modelId, days]
    );

    return result.rows[0];
  }

  // ========================================
  // FEATURE IMPORTANCE
  // ========================================

  async recordFeatureImportance(
    modelId: string,
    featureName: string,
    importanceScore: number,
    rank: number,
    featureCategory?: string
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO feature_importance (
        model_id, feature_name, feature_category, importance_score, rank
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [modelId, featureName, featureCategory, importanceScore, rank]
    );

    return result.rows[0];
  }

  async getFeatureImportance(modelId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM feature_importance WHERE model_id = $1 ORDER BY rank`,
      [modelId]
    );

    return result.rows;
  }

  // ========================================
  // AI INSIGHTS
  // ========================================

  async createAIInsight(params: AIInsightParams): Promise<any> {
    const {
      insightType,
      scopeType,
      scopeId,
      title,
      description,
      insightData,
      confidenceScore,
      impactScore,
      priority,
      recommendedActions,
      expectedOutcome,
      modelId,
      isPublic,
      targetAudience
    } = params;

    const result = await pool.query(
      `INSERT INTO ai_insights (
        insight_type, scope_type, scope_id, title, description, insight_data,
        confidence_score, impact_score, priority, recommended_actions, expected_outcome,
        generated_by_model_id, is_public, target_audience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        insightType,
        scopeType,
        scopeId,
        title,
        description,
        insightData ? JSON.stringify(insightData) : null,
        confidenceScore,
        impactScore,
        priority,
        recommendedActions,
        expectedOutcome,
        modelId,
        isPublic,
        targetAudience
      ]
    );

    return result.rows[0];
  }

  async getAIInsights(filters: any = {}): Promise<any[]> {
    const { scopeType, scopeId, status, priority, targetAudience, limit = 50 } = filters;

    let query = `SELECT * FROM ai_insights WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (scopeType) {
      query += ` AND scope_type = $${paramIndex}`;
      params.push(scopeType);
      paramIndex++;
    }

    if (scopeId) {
      query += ` AND scope_id = $${paramIndex}`;
      params.push(scopeId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (targetAudience) {
      query += ` AND target_audience = $${paramIndex}`;
      params.push(targetAudience);
      paramIndex++;
    }

    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += ` ORDER BY priority DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async actOnInsight(
    insightId: string,
    actedBy: string,
    actionTaken: string,
    actionOutcome?: string
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE ai_insights
      SET status = 'acted_upon',
          acted_upon = true,
          acted_upon_at = NOW(),
          acted_upon_by = $2,
          action_taken = $3,
          action_outcome = $4
      WHERE id = $1
      RETURNING *`,
      [insightId, actedBy, actionTaken, actionOutcome]
    );

    return result.rows[0];
  }

  async dismissInsight(insightId: string): Promise<void> {
    await pool.query(
      `UPDATE ai_insights SET status = 'dismissed' WHERE id = $1`,
      [insightId]
    );
  }
}

export const aimlService = new AIMLService();
