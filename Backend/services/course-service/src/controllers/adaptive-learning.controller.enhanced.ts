import { Request, Response } from 'express';
import { AdaptiveLearningServiceEnhanced } from '../services/adaptive-learning.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdaptiveLearningController');

export class AdaptiveLearningControllerEnhanced {
  private adaptiveService: AdaptiveLearningServiceEnhanced;

  constructor(pool: Pool) {
    this.adaptiveService = new AdaptiveLearningServiceEnhanced(pool);
  }

  // ========================================
  // ERROR HANDLER
  // ========================================

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);

    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });

    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  // ========================================
  // KNOWLEDGE CONCEPTS
  // ========================================

  createConcept = async (req: Request, res: Response): Promise<void> => {
    try {
      const conceptId = await this.adaptiveService.createConceptWithValidation(req.body);

      res.status(201).json({
        id: conceptId,
        message: 'Knowledge concept created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create concept');
    }
  };

  getConcepts = async (req: Request, res: Response): Promise<void> => {
    try {
      const concepts = await this.adaptiveService.getConceptsWithHierarchy();

      res.json({
        concepts,
        count: concepts.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get concepts');
    }
  };

  getConceptById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { concept_id } = req.params;
      const concept = await this.adaptiveService.getConceptByIdWithValidation(concept_id);

      res.json(concept);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get concept');
    }
  };

  linkConcepts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { prerequisite_id, dependent_id } = req.body;

      if (!prerequisite_id || !dependent_id) {
        res.status(400).json({ error: 'prerequisite_id and dependent_id are required' });
        return;
      }

      const relationshipId = await this.adaptiveService.linkConceptsWithValidation(
        prerequisite_id,
        dependent_id
      );

      res.status(201).json({
        id: relationshipId,
        message: 'Concepts linked successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Link concepts');
    }
  };

  getConceptPrerequisites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { concept_id } = req.params;
      const prerequisites = await this.adaptiveService.getConceptPrerequisites(concept_id);

      res.json({
        concept_id,
        prerequisites,
        count: prerequisites.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get prerequisites');
    }
  };

  // ========================================
  // LEARNER PROFILES
  // ========================================

  createOrUpdateLearnerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, learning_style } = req.body;

      if (!user_id) {
        res.status(400).json({ error: 'user_id is required' });
        return;
      }

      const profileId = await this.adaptiveService.createOrUpdateLearnerProfile(user_id, learning_style);

      res.status(201).json({
        id: profileId,
        message: 'Learner profile created/updated successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create/update learner profile');
    }
  };

  getLearnerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const profile = await this.adaptiveService.getLearnerProfileWithStats(user_id);

      res.json(profile);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get learner profile');
    }
  };

  // ========================================
  // CONCEPT MASTERY
  // ========================================

  updateMastery = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.adaptiveService.updateMasteryWithValidation(req.body);

      res.json({
        message: 'Concept mastery updated successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update mastery');
    }
  };

  getMastery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const mastery = await this.adaptiveService.getMasteryProgressWithDetails(user_id);

      res.json({
        user_id,
        mastery,
        count: mastery.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get mastery');
    }
  };

  // ========================================
  // LEARNING PATHS
  // ========================================

  generatePath = async (req: Request, res: Response): Promise<void> => {
    try {
      const pathId = await this.adaptiveService.generatePathWithValidation(req.body);

      res.status(201).json({
        path_id: pathId,
        message: 'Adaptive learning path generated successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Generate learning path');
    }
  };

  getLearningPaths = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { status } = req.query;

      const paths = await this.adaptiveService.getLearningPathsWithProgress(
        user_id,
        status as string
      );

      res.json({
        user_id,
        paths,
        count: paths.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get learning paths');
    }
  };

  // ========================================
  // RECOMMENDATIONS
  // ========================================

  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { limit } = req.query;

      const recommendations = await this.adaptiveService.getPersonalizedRecommendations(
        user_id,
        limit ? parseInt(limit as string) : 10
      );

      res.json({
        user_id,
        recommendations,
        count: recommendations.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get recommendations');
    }
  };

  // ========================================
  // SPACED REPETITION
  // ========================================

  getReviewConcepts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const concepts = await this.adaptiveService.getConceptsDueForReviewWithPriority(user_id);

      const urgentCount = concepts.filter(c => c.priority === 'urgent').length;

      res.json({
        user_id,
        concepts,
        count: concepts.length,
        urgent_count: urgentCount,
        alert: urgentCount > 0 ? `${urgentCount} concepts urgently need review` : null
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get review concepts');
    }
  };

  // ========================================
  // HEALTH CHECK
  // ========================================

  adaptiveLearningHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.adaptiveService.getAdaptiveLearningHealthCheck();

      res.json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Adaptive learning health check');
    }
  };
}
