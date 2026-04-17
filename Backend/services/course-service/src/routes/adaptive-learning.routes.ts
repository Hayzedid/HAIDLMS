import { Router } from 'express';
import { AdaptiveLearningController } from '../controllers/adaptive-learning.controller';
import { Pool } from 'pg';

export const createAdaptiveLearningRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new AdaptiveLearningController(pool);

  // Knowledge Concepts
  router.post('/concepts', controller.createConcept);
  router.get('/concepts', controller.getConcepts);

  // Learner Profiles
  router.get('/profile/:user_id', controller.getLearnerProfile);

  // Concept Mastery
  router.post('/mastery', controller.updateMastery);
  router.get('/mastery/:user_id', controller.getMastery);

  // Learning Paths
  router.post('/paths/generate', controller.generatePath);

  // Recommendations
  router.get('/recommendations/:user_id', controller.getRecommendations);

  // Spaced Repetition
  router.get('/review/:user_id', controller.getReviewConcepts);

  return router;
};
