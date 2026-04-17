import { Request, Response } from 'express';
import { AdaptiveLearningService } from '../services/adaptive-learning.service';
import { Pool } from 'pg';

export class AdaptiveLearningController {
  private adaptiveService: AdaptiveLearningService;

  constructor(pool: Pool) {
    this.adaptiveService = new AdaptiveLearningService(pool);
  }

  createConcept = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.adaptiveService.createConcept(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create concept' });
    }
  };

  getConcepts = async (req: Request, res: Response): Promise<void> => {
    try {
      const concepts = await this.adaptiveService.getConcepts();
      res.json({ concepts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch concepts' });
    }
  };

  getLearnerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const profile = await this.adaptiveService.getLearnerProfile(user_id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  };

  updateMastery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, concept_id, performance_score } = req.body;
      await this.adaptiveService.updateMastery(user_id, concept_id, performance_score);
      res.json({ message: 'Mastery updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update mastery' });
    }
  };

  getMastery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const mastery = await this.adaptiveService.getMastery(user_id);
      res.json({ mastery });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch mastery' });
    }
  };

  generatePath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, target_concept_id } = req.body;
      const pathId = await this.adaptiveService.generatePath(user_id, target_concept_id);
      res.status(201).json({ path_id: pathId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate path' });
    }
  };

  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const recommendations = await this.adaptiveService.getRecommendations(user_id);
      res.json({ recommendations });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  };

  getReviewConcepts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const concepts = await this.adaptiveService.getConceptsDueForReview(user_id);
      res.json({ concepts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch review concepts' });
    }
  };
}
