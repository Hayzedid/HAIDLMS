import { Router } from 'express';
import { aimlController } from '../controllers/ai-ml.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI/ML
 *   description: AI and Machine Learning features including recommendations, content analysis, and predictive analytics
 */

// ========================================
// ML MODEL MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/ai-ml/models:
 *   post:
 *     summary: Create ML model
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - modelType
 *               - version
 *             properties:
 *               name:
 *                 type: string
 *               modelType:
 *                 type: string
 *               version:
 *                 type: string
 *               algorithm:
 *                 type: string
 *               hyperparameters:
 *                 type: object
 *               featureSet:
 *                 type: object
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Model created successfully
 */
router.post('/models', authenticate, aimlController.createMLModel.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/models:
 *   get:
 *     summary: List ML models
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modelType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 */
router.get('/models', authenticate, aimlController.listMLModels.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/models/active:
 *   get:
 *     summary: Get active ML models
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active models retrieved successfully
 */
router.get('/models/active', authenticate, aimlController.getActiveMLModels.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/models/{modelId}:
 *   get:
 *     summary: Get ML model
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Model retrieved successfully
 */
router.get('/models/:modelId', authenticate, aimlController.getMLModel.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/models/{modelId}/status:
 *   patch:
 *     summary: Update ML model status
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [training, validating, active, deprecated, failed]
 *               metrics:
 *                 type: object
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/models/:modelId/status', authenticate, aimlController.updateMLModelStatus.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/models/{modelId}/deploy:
 *   post:
 *     summary: Deploy ML model
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelPath
 *             properties:
 *               modelPath:
 *                 type: string
 *               artifactUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Model deployed successfully
 */
router.post('/models/:modelId/deploy', authenticate, aimlController.deployMLModel.bind(aimlController));

// ========================================
// AI RECOMMENDATIONS
// ========================================

/**
 * @swagger
 * /api/ai-ml/recommendations:
 *   post:
 *     summary: Create recommendation
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - recommendationType
 *               - entityType
 *               - entityId
 *               - score
 *             properties:
 *               userId:
 *                 type: string
 *               recommendationType:
 *                 type: string
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               score:
 *                 type: number
 *               confidence:
 *                 type: number
 *               reasons:
 *                 type: array
 *                 items:
 *                   type: string
 *               explanation:
 *                 type: string
 *               context:
 *                 type: object
 *               modelId:
 *                 type: string
 *               modelVersion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recommendation created successfully
 */
router.post('/recommendations', authenticate, aimlController.createRecommendation.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/me:
 *   get:
 *     summary: Get my recommendations
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 */
router.get('/recommendations/me', authenticate, aimlController.getMyRecommendations.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/performance:
 *   get:
 *     summary: Get recommendation performance metrics
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/recommendations/performance', authenticate, aimlController.getRecommendationPerformance.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/{recommendationId}/click:
 *   post:
 *     summary: Record recommendation click
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Click recorded successfully
 */
router.post('/recommendations/:recommendationId/click', authenticate, aimlController.recordRecommendationClick.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/{recommendationId}/conversion:
 *   post:
 *     summary: Record recommendation conversion
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversionValue:
 *                 type: number
 *     responses:
 *       200:
 *         description: Conversion recorded successfully
 */
router.post('/recommendations/:recommendationId/conversion', authenticate, aimlController.recordRecommendationConversion.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/{recommendationId}/dismiss:
 *   post:
 *     summary: Dismiss recommendation
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendation dismissed successfully
 */
router.post('/recommendations/:recommendationId/dismiss', authenticate, aimlController.dismissRecommendation.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/recommendations/{recommendationId}/feedback:
 *   post:
 *     summary: Record recommendation feedback
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedbackType
 *             properties:
 *               feedbackType:
 *                 type: string
 *                 enum: [positive, negative, neutral, dismissed]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedbackText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback recorded successfully
 */
router.post('/recommendations/:recommendationId/feedback', authenticate, aimlController.recordRecommendationFeedback.bind(aimlController));

// ========================================
// CONTENT ANALYSIS
// ========================================

/**
 * @swagger
 * /api/ai-ml/content-analysis:
 *   post:
 *     summary: Analyze content
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               qualityScore:
 *                 type: number
 *               qualityStatus:
 *                 type: string
 *               readabilityScore:
 *                 type: number
 *               engagementScore:
 *                 type: number
 *               difficultyLevel:
 *                 type: string
 *               detectedTopics:
 *                 type: array
 *                 items:
 *                   type: string
 *               detectedSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Content analyzed successfully
 */
router.post('/content-analysis', authenticate, aimlController.analyzeContent.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/content-analysis/quality-summary:
 *   get:
 *     summary: Get content quality summary
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quality summary retrieved successfully
 */
router.get('/content-analysis/quality-summary', authenticate, aimlController.getContentQualitySummary.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/content-analysis/{contentType}/{contentId}:
 *   get:
 *     summary: Get content analysis
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis retrieved successfully
 */
router.get('/content-analysis/:contentType/:contentId', authenticate, aimlController.getContentAnalysis.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/content-analysis/{contentType}/{contentId}/needs-analysis:
 *   get:
 *     summary: Check if content needs analysis
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxAgeDays
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Check completed successfully
 */
router.get('/content-analysis/:contentType/:contentId/needs-analysis', authenticate, aimlController.needsContentAnalysis.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/content-analysis/quality/{qualityStatus}:
 *   get:
 *     summary: Get content by quality status
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: qualityStatus
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 */
router.get('/content-analysis/quality/:qualityStatus', authenticate, aimlController.getContentByQuality.bind(aimlController));

// ========================================
// LEARNING PATH OPTIMIZATION
// ========================================

/**
 * @swagger
 * /api/ai-ml/learning-paths:
 *   post:
 *     summary: Create optimized learning path
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - recommendedCourses
 *             properties:
 *               userId:
 *                 type: string
 *               targetSkill:
 *                 type: string
 *               targetRole:
 *                 type: string
 *               completionGoalDate:
 *                 type: string
 *                 format: date
 *               recommendedCourses:
 *                 type: array
 *     responses:
 *       201:
 *         description: Learning path created successfully
 */
router.post('/learning-paths', authenticate, aimlController.createOptimizedPath.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/learning-paths/me:
 *   get:
 *     summary: Get my learning paths
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Learning paths retrieved successfully
 */
router.get('/learning-paths/me', authenticate, aimlController.getMyLearningPaths.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/learning-paths/{pathId}/accept:
 *   post:
 *     summary: Accept learning path
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pathId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning path accepted successfully
 */
router.post('/learning-paths/:pathId/accept', authenticate, aimlController.acceptLearningPath.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/learning-paths/{pathId}/progress:
 *   patch:
 *     summary: Update learning path progress
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pathId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progressPercentage
 *             properties:
 *               progressPercentage:
 *                 type: number
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.patch('/learning-paths/:pathId/progress', authenticate, aimlController.updatePathProgress.bind(aimlController));

// ========================================
// SKILL GAP ANALYSIS
// ========================================

/**
 * @swagger
 * /api/ai-ml/skill-gaps:
 *   post:
 *     summary: Create skill gap analysis
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - targetRole
 *               - targetSkills
 *               - currentSkills
 *               - skillGaps
 *             properties:
 *               userId:
 *                 type: string
 *               targetRole:
 *                 type: string
 *               targetSkills:
 *                 type: object
 *               currentSkills:
 *                 type: object
 *               skillGaps:
 *                 type: object
 *     responses:
 *       201:
 *         description: Skill gap analysis created successfully
 */
router.post('/skill-gaps', authenticate, aimlController.createSkillGapAnalysis.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/skill-gaps/me:
 *   get:
 *     summary: Get my skill gaps
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Skill gaps retrieved successfully
 */
router.get('/skill-gaps/me', authenticate, aimlController.getMySkillGaps.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/skill-gaps/role/{targetRole}:
 *   get:
 *     summary: Get skill gaps by role
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetRole
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Skill gaps retrieved successfully
 */
router.get('/skill-gaps/role/:targetRole', authenticate, aimlController.getSkillGapsByRole.bind(aimlController));

// ========================================
// PREDICTIVE ANALYTICS
// ========================================

/**
 * @swagger
 * /api/ai-ml/predictions:
 *   post:
 *     summary: Create prediction
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - predictionType
 *               - confidenceScore
 *             properties:
 *               userId:
 *                 type: string
 *               predictionType:
 *                 type: string
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               predictedValue:
 *                 type: number
 *               predictedCategory:
 *                 type: string
 *               confidenceScore:
 *                 type: number
 *               riskLevel:
 *                 type: string
 *               riskFactors:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Prediction created successfully
 */
router.post('/predictions', authenticate, aimlController.createPrediction.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/predictions/me:
 *   get:
 *     summary: Get my predictions
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Predictions retrieved successfully
 */
router.get('/predictions/me', authenticate, aimlController.getMyPredictions.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/predictions/at-risk-users:
 *   get:
 *     summary: Get at-risk users
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: At-risk users retrieved successfully
 */
router.get('/predictions/at-risk-users', authenticate, aimlController.getAtRiskUsers.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/predictions/{predictionId}/actual:
 *   post:
 *     summary: Record actual outcome
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualValue:
 *                 type: number
 *               actualCategory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Actual outcome recorded successfully
 */
router.post('/predictions/:predictionId/actual', authenticate, aimlController.recordActualOutcome.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/predictions/cleanup:
 *   post:
 *     summary: Cleanup expired predictions
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 */
router.post('/predictions/cleanup', authenticate, aimlController.cleanupExpiredPredictions.bind(aimlController));

// ========================================
// TRAINING DATA
// ========================================

/**
 * @swagger
 * /api/ai-ml/training-data:
 *   post:
 *     summary: Add training data
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelType
 *               - features
 *               - sourceType
 *             properties:
 *               modelType:
 *                 type: string
 *               features:
 *                 type: object
 *               labels:
 *                 type: object
 *               sourceType:
 *                 type: string
 *               sourceId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Training data added successfully
 */
router.post('/training-data', authenticate, aimlController.addTrainingData.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/training-data:
 *   get:
 *     summary: Get training data
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: modelType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: validated
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *     responses:
 *       200:
 *         description: Training data retrieved successfully
 */
router.get('/training-data', authenticate, aimlController.getTrainingData.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/training-data/{dataId}/validate:
 *   post:
 *     summary: Validate training data
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dataId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - validationScore
 *             properties:
 *               validationScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Training data validated successfully
 */
router.post('/training-data/:dataId/validate', authenticate, aimlController.validateTrainingData.bind(aimlController));

// ========================================
// MODEL PERFORMANCE
// ========================================

/**
 * @swagger
 * /api/ai-ml/performance/log:
 *   post:
 *     summary: Log model performance
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - periodStart
 *               - periodEnd
 *               - metrics
 *             properties:
 *               modelId:
 *                 type: string
 *               periodStart:
 *                 type: string
 *                 format: date-time
 *               periodEnd:
 *                 type: string
 *                 format: date-time
 *               metrics:
 *                 type: object
 *     responses:
 *       201:
 *         description: Performance logged successfully
 */
router.post('/performance/log', authenticate, aimlController.logModelPerformance.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/performance/summary:
 *   get:
 *     summary: Get model performance summary
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance summary retrieved successfully
 */
router.get('/performance/summary', authenticate, aimlController.getModelPerformanceSummary.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/performance/{modelId}/effectiveness:
 *   get:
 *     summary: Calculate recommendation effectiveness
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Effectiveness calculated successfully
 */
router.get('/performance/:modelId/effectiveness', authenticate, aimlController.calculateRecommendationEffectiveness.bind(aimlController));

// ========================================
// FEATURE IMPORTANCE
// ========================================

/**
 * @swagger
 * /api/ai-ml/feature-importance:
 *   post:
 *     summary: Record feature importance
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - featureName
 *               - importanceScore
 *               - rank
 *             properties:
 *               modelId:
 *                 type: string
 *               featureName:
 *                 type: string
 *               importanceScore:
 *                 type: number
 *               rank:
 *                 type: integer
 *               featureCategory:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature importance recorded successfully
 */
router.post('/feature-importance', authenticate, aimlController.recordFeatureImportance.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/feature-importance/{modelId}:
 *   get:
 *     summary: Get feature importance
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: modelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature importance retrieved successfully
 */
router.get('/feature-importance/:modelId', authenticate, aimlController.getFeatureImportance.bind(aimlController));

// ========================================
// AI INSIGHTS
// ========================================

/**
 * @swagger
 * /api/ai-ml/insights:
 *   post:
 *     summary: Create AI insight
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - insightType
 *               - scopeType
 *               - title
 *             properties:
 *               insightType:
 *                 type: string
 *               scopeType:
 *                 type: string
 *               scopeId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: integer
 *               recommendedActions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: AI insight created successfully
 */
router.post('/insights', authenticate, aimlController.createAIInsight.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/insights:
 *   get:
 *     summary: Get AI insights
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scopeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *       - in: query
 *         name: targetAudience
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: AI insights retrieved successfully
 */
router.get('/insights', authenticate, aimlController.getAIInsights.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/insights/{insightId}/act:
 *   post:
 *     summary: Act on AI insight
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: insightId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionTaken
 *             properties:
 *               actionTaken:
 *                 type: string
 *               actionOutcome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action recorded successfully
 */
router.post('/insights/:insightId/act', authenticate, aimlController.actOnInsight.bind(aimlController));

/**
 * @swagger
 * /api/ai-ml/insights/{insightId}/dismiss:
 *   post:
 *     summary: Dismiss AI insight
 *     tags: [AI/ML]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: insightId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Insight dismissed successfully
 */
router.post('/insights/:insightId/dismiss', authenticate, aimlController.dismissInsight.bind(aimlController));

export default router;
