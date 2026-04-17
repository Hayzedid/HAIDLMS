import { Router } from 'express';
import { AdaptiveLearningControllerEnhanced } from '../controllers/adaptive-learning.controller.enhanced';
import { Pool } from 'pg';

export const createAdaptiveLearningRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new AdaptiveLearningControllerEnhanced(pool);

  /**
   * @swagger
   * /api/adaptive/health:
   *   get:
   *     summary: Adaptive learning health check
   *     tags: [Adaptive Learning - System]
   *     responses:
   *       200:
   *         description: System healthy
   */
  router.get('/health', controller.adaptiveLearningHealthCheck);

  /**
   * @swagger
   * /api/adaptive/concepts:
   *   post:
   *     summary: Create knowledge concept (Enhanced)
   *     tags: [Adaptive Learning - Concepts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, cognitive_level]
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               cognitive_level:
   *                 type: string
   *                 enum: [remember, understand, apply, analyze, evaluate, create]
   *     responses:
   *       201:
   *         description: Concept created
   *       409:
   *         description: Concept name already exists
   */
  router.post('/concepts', controller.createConcept);

  /**
   * @swagger
   * /api/adaptive/concepts:
   *   get:
   *     summary: Get all concepts with hierarchy (Enhanced)
   *     tags: [Adaptive Learning - Concepts]
   *     responses:
   *       200:
   *         description: List of concepts with prerequisite/dependent counts
   */
  router.get('/concepts', controller.getConcepts);

  /**
   * @swagger
   * /api/adaptive/concepts/{concept_id}:
   *   get:
   *     summary: Get concept by ID (NEW)
   *     tags: [Adaptive Learning - Concepts]
   *     parameters:
   *       - in: path
   *         name: concept_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Concept details
   *       404:
   *         description: Concept not found
   */
  router.get('/concepts/:concept_id', controller.getConceptById);

  /**
   * @swagger
   * /api/adaptive/concepts/link:
   *   post:
   *     summary: Link concepts as prerequisite (Enhanced)
   *     description: Creates prerequisite relationship with circular dependency detection
   *     tags: [Adaptive Learning - Concepts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [prerequisite_id, dependent_id]
   *             properties:
   *               prerequisite_id:
   *                 type: string
   *                 format: uuid
   *               dependent_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Concepts linked
   *       400:
   *         description: Validation error (self-reference, circular dependency)
   */
  router.post('/concepts/link', controller.linkConcepts);

  /**
   * @swagger
   * /api/adaptive/concepts/{concept_id}/prerequisites:
   *   get:
   *     summary: Get concept prerequisites (NEW)
   *     tags: [Adaptive Learning - Concepts]
   *     parameters:
   *       - in: path
   *         name: concept_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: List of prerequisite concepts
   */
  router.get('/concepts/:concept_id/prerequisites', controller.getConceptPrerequisites);

  /**
   * @swagger
   * /api/adaptive/profile:
   *   post:
   *     summary: Create/update learner profile (Enhanced)
   *     tags: [Adaptive Learning - Profile]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id]
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               learning_style:
   *                 type: string
   *     responses:
   *       201:
   *         description: Profile created/updated
   */
  router.post('/profile', controller.createOrUpdateLearnerProfile);

  /**
   * @swagger
   * /api/adaptive/profile/{user_id}:
   *   get:
   *     summary: Get learner profile with stats (Enhanced)
   *     tags: [Adaptive Learning - Profile]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Profile with learning statistics
   */
  router.get('/profile/:user_id', controller.getLearnerProfile);

  /**
   * @swagger
   * /api/adaptive/mastery:
   *   post:
   *     summary: Update concept mastery (Enhanced)
   *     tags: [Adaptive Learning - Mastery]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id, concept_id, performance_score]
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               concept_id:
   *                 type: string
   *                 format: uuid
   *               performance_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *     responses:
   *       200:
   *         description: Mastery updated
   */
  router.post('/mastery', controller.updateMastery);

  /**
   * @swagger
   * /api/adaptive/mastery/{user_id}:
   *   get:
   *     summary: Get mastery progress with details (Enhanced)
   *     tags: [Adaptive Learning - Mastery]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Mastery progress with status (mastered, proficient, learning, novice)
   */
  router.get('/mastery/:user_id', controller.getMastery);

  /**
   * @swagger
   * /api/adaptive/paths/generate:
   *   post:
   *     summary: Generate adaptive learning path (Enhanced)
   *     tags: [Adaptive Learning - Paths]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id, target_concept_id]
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               target_concept_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Learning path generated
   *       404:
   *         description: Concept not found
   */
  router.post('/paths/generate', controller.generatePath);

  /**
   * @swagger
   * /api/adaptive/paths/{user_id}:
   *   get:
   *     summary: Get learning paths with progress (Enhanced)
   *     tags: [Adaptive Learning - Paths]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, completed, abandoned]
   *     responses:
   *       200:
   *         description: Learning paths with progress percentage
   */
  router.get('/paths/:user_id', controller.getLearningPaths);

  /**
   * @swagger
   * /api/adaptive/recommendations/{user_id}:
   *   get:
   *     summary: Get personalized recommendations (Enhanced)
   *     tags: [Adaptive Learning - Recommendations]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Personalized learning recommendations
   */
  router.get('/recommendations/:user_id', controller.getRecommendations);

  /**
   * @swagger
   * /api/adaptive/review/{user_id}:
   *   get:
   *     summary: Get concepts due for review with priority (Enhanced)
   *     tags: [Adaptive Learning - Spaced Repetition]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Concepts due for review with priority levels (urgent, high, medium, low)
   */
  router.get('/review/:user_id', controller.getReviewConcepts);

  return router;
};
