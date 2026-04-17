import { Pool, PoolClient } from 'pg';
import {
  KnowledgeConceptSchema,
  MasteryUpdateSchema,
  LearningPathSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdaptiveLearningService');

export class AdaptiveLearningServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // KNOWLEDGE CONCEPTS - ENHANCED
  // ========================================

  async createConceptWithValidation(data: any): Promise<string> {
    try {
      const validatedData = KnowledgeConceptSchema.parse(data);
      logger.info('Creating knowledge concept', {
        name: validatedData.name,
        cognitive_level: validatedData.cognitive_level
      });

      // Check for duplicate concept name
      const existingConcept = await this.pool.query(
        `SELECT id FROM knowledge_concepts WHERE LOWER(name) = LOWER($1)`,
        [validatedData.name]
      );

      if (existingConcept.rows.length > 0) {
        throw new ConflictError(`Knowledge concept with name '${validatedData.name}' already exists`);
      }

      const result = await this.pool.query(
        `INSERT INTO knowledge_concepts (name, description, cognitive_level)
         VALUES ($1, $2, $3) RETURNING id`,
        [validatedData.name, validatedData.description || null, validatedData.cognitive_level]
      );

      logger.info('Knowledge concept created', { concept_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create knowledge concept', error, { name: data.name });
      throw error;
    }
  }

  async getConceptByIdWithValidation(concept_id: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM knowledge_concepts WHERE id = $1`,
        [concept_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Knowledge concept', concept_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch knowledge concept', error, { concept_id });
      throw error;
    }
  }

  async getConceptsWithHierarchy(): Promise<any[]> {
    try {
      logger.debug('Fetching concepts with hierarchy');

      const result = await this.pool.query(`
        SELECT
          kc.*,
          COUNT(DISTINCT cr_pre.id) as prerequisite_count,
          COUNT(DISTINCT cr_dep.id) as dependent_count,
          COUNT(DISTINCT cm.user_id) as learner_count,
          AVG(cm.mastery_level) as avg_mastery_level
        FROM knowledge_concepts kc
        LEFT JOIN concept_relationships cr_pre ON cr_pre.dependent_concept_id = kc.id
        LEFT JOIN concept_relationships cr_dep ON cr_dep.prerequisite_concept_id = kc.id
        LEFT JOIN concept_mastery cm ON cm.concept_id = kc.id
        GROUP BY kc.id
        ORDER BY kc.created_at DESC
      `);

      logger.debug('Concepts retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch concepts with hierarchy', error);
      throw error;
    }
  }

  // ========================================
  // CONCEPT RELATIONSHIPS - ENHANCED
  // ========================================

  async linkConceptsWithValidation(prerequisite_id: string, dependent_id: string): Promise<string> {
    try {
      logger.info('Linking concepts', { prerequisite_id, dependent_id });

      // Validate both concepts exist
      await this.getConceptByIdWithValidation(prerequisite_id);
      await this.getConceptByIdWithValidation(dependent_id);

      // Check for self-reference
      if (prerequisite_id === dependent_id) {
        throw new ValidationError('A concept cannot be its own prerequisite');
      }

      // Check for duplicate relationship
      const existingLink = await this.pool.query(
        `SELECT id FROM concept_relationships
         WHERE prerequisite_concept_id = $1 AND dependent_concept_id = $2`,
        [prerequisite_id, dependent_id]
      );

      if (existingLink.rows.length > 0) {
        logger.warn('Concept relationship already exists', { prerequisite_id, dependent_id });
        return existingLink.rows[0].id;
      }

      // Check for circular dependency
      const circularCheck = await this.pool.query(
        `WITH RECURSIVE concept_tree AS (
          SELECT prerequisite_concept_id, dependent_concept_id, 1 as depth
          FROM concept_relationships
          WHERE prerequisite_concept_id = $1
          UNION
          SELECT cr.prerequisite_concept_id, cr.dependent_concept_id, ct.depth + 1
          FROM concept_relationships cr
          JOIN concept_tree ct ON cr.prerequisite_concept_id = ct.dependent_concept_id
          WHERE ct.depth < 10
        )
        SELECT 1 FROM concept_tree WHERE dependent_concept_id = $2
        `,
        [dependent_id, prerequisite_id]
      );

      if (circularCheck.rows.length > 0) {
        throw new BusinessLogicError('Cannot create circular prerequisite dependency');
      }

      const result = await this.pool.query(
        `INSERT INTO concept_relationships (prerequisite_concept_id, dependent_concept_id, relationship_type)
         VALUES ($1, $2, 'prerequisite') RETURNING id`,
        [prerequisite_id, dependent_id]
      );

      logger.info('Concepts linked successfully', { relationship_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to link concepts', error, { prerequisite_id, dependent_id });
      throw error;
    }
  }

  async getConceptPrerequisites(concept_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT kc.*, cr.relationship_type
        FROM concept_relationships cr
        JOIN knowledge_concepts kc ON kc.id = cr.prerequisite_concept_id
        WHERE cr.dependent_concept_id = $1
      `, [concept_id]);

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch concept prerequisites', error, { concept_id });
      throw error;
    }
  }

  // ========================================
  // LEARNER PROFILES - ENHANCED
  // ========================================

  async createOrUpdateLearnerProfile(user_id: string, learning_style?: string): Promise<string> {
    try {
      logger.info('Creating/updating learner profile', { user_id, learning_style });

      // Check if profile exists
      const existingProfile = await this.pool.query(
        `SELECT id FROM learner_profiles WHERE user_id = $1`,
        [user_id]
      );

      if (existingProfile.rows.length > 0) {
        // Update existing profile
        await this.pool.query(
          `UPDATE learner_profiles SET learning_style = $1, updated_at = NOW() WHERE user_id = $2`,
          [learning_style || null, user_id]
        );
        logger.info('Learner profile updated', { user_id });
        return existingProfile.rows[0].id;
      }

      // Create new profile
      const result = await this.pool.query(
        `INSERT INTO learner_profiles (user_id, learning_style)
         VALUES ($1, $2) RETURNING id`,
        [user_id, learning_style || null]
      );

      logger.info('Learner profile created', { profile_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create/update learner profile', error, { user_id });
      throw error;
    }
  }

  async getLearnerProfileWithStats(user_id: string): Promise<any> {
    try {
      logger.debug('Fetching learner profile with stats', { user_id });

      const result = await this.pool.query(`
        SELECT
          lp.*,
          COUNT(DISTINCT cm.concept_id) as concepts_learned,
          AVG(cm.mastery_level) as avg_mastery_level,
          COUNT(DISTINCT alp.id) as learning_paths_count,
          COUNT(DISTINCT lr.id) as pending_recommendations
        FROM learner_profiles lp
        LEFT JOIN concept_mastery cm ON cm.user_id = lp.user_id
        LEFT JOIN adaptive_learning_paths alp ON alp.user_id = lp.user_id
        LEFT JOIN learning_recommendations lr ON lr.user_id = lp.user_id AND lr.is_completed = false
        WHERE lp.user_id = $1
        GROUP BY lp.id
      `, [user_id]);

      if (result.rows.length === 0) {
        logger.warn('Learner profile not found, creating default', { user_id });
        const profileId = await this.createOrUpdateLearnerProfile(user_id);
        return this.getLearnerProfileWithStats(user_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch learner profile', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // CONCEPT MASTERY - ENHANCED
  // ========================================

  async updateMasteryWithValidation(data: any): Promise<void> {
    try {
      const validatedData = MasteryUpdateSchema.parse(data);
      logger.info('Updating concept mastery', {
        user_id: validatedData.user_id,
        concept_id: validatedData.concept_id,
        performance_score: validatedData.performance_score
      });

      // Verify concept exists
      await this.getConceptByIdWithValidation(validatedData.concept_id);

      await this.pool.query(
        `SELECT update_concept_mastery($1, $2, $3)`,
        [validatedData.user_id, validatedData.concept_id, validatedData.performance_score]
      );

      logger.info('Concept mastery updated', {
        user_id: validatedData.user_id,
        concept_id: validatedData.concept_id
      });
    } catch (error: any) {
      logger.error('Failed to update concept mastery', error, data);
      throw error;
    }
  }

  async getMasteryProgressWithDetails(user_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          ulp.*,
          kc.name as concept_name,
          kc.cognitive_level,
          CASE
            WHEN ulp.mastery_level >= 0.8 THEN 'mastered'
            WHEN ulp.mastery_level >= 0.6 THEN 'proficient'
            WHEN ulp.mastery_level >= 0.4 THEN 'learning'
            ELSE 'novice'
          END as mastery_status
        FROM user_learning_progress ulp
        JOIN knowledge_concepts kc ON kc.id = ulp.concept_id
        WHERE ulp.user_id = $1
        ORDER BY ulp.mastery_level DESC, kc.name
      `, [user_id]);

      logger.debug('Mastery progress retrieved', { user_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch mastery progress', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // ADAPTIVE LEARNING PATHS - ENHANCED
  // ========================================

  async generatePathWithValidation(data: any): Promise<string> {
    try {
      const validatedData = LearningPathSchema.parse(data);
      logger.info('Generating adaptive learning path', {
        user_id: validatedData.user_id,
        target_concept_id: validatedData.target_concept_id
      });

      // Verify concept exists
      await this.getConceptByIdWithValidation(validatedData.target_concept_id);

      // Check if user already has an active path for this concept
      const existingPath = await this.pool.query(
        `SELECT id FROM adaptive_learning_paths
         WHERE user_id = $1 AND target_concept_id = $2 AND status = 'active'`,
        [validatedData.user_id, validatedData.target_concept_id]
      );

      if (existingPath.rows.length > 0) {
        logger.warn('Active learning path already exists', {
          user_id: validatedData.user_id,
          target_concept_id: validatedData.target_concept_id
        });
        return existingPath.rows[0].id;
      }

      const result = await this.pool.query(
        `SELECT generate_adaptive_path($1, $2) as path_id`,
        [validatedData.user_id, validatedData.target_concept_id]
      );

      logger.info('Adaptive learning path generated', { path_id: result.rows[0].path_id });
      return result.rows[0].path_id;
    } catch (error: any) {
      logger.error('Failed to generate adaptive learning path', error, data);
      throw error;
    }
  }

  async getLearningPathsWithProgress(user_id: string, status?: string): Promise<any[]> {
    try {
      let query = `
        SELECT
          alp.*,
          kc.name as target_concept_name,
          kc.cognitive_level,
          COUNT(DISTINCT lps.id) as total_steps,
          COUNT(DISTINCT lps.id) FILTER (WHERE lps.is_completed = true) as completed_steps,
          CASE
            WHEN COUNT(DISTINCT lps.id) > 0 THEN
              (COUNT(DISTINCT lps.id) FILTER (WHERE lps.is_completed = true)::FLOAT / COUNT(DISTINCT lps.id)::FLOAT) * 100
            ELSE 0
          END as progress_percentage
        FROM adaptive_learning_paths alp
        JOIN knowledge_concepts kc ON kc.id = alp.target_concept_id
        LEFT JOIN learning_path_steps lps ON lps.path_id = alp.id
        WHERE alp.user_id = $1
      `;

      const values: any[] = [user_id];
      let paramIndex = 2;

      if (status) {
        query += ` AND alp.status = $${paramIndex++}`;
        values.push(status);
      }

      query += ` GROUP BY alp.id, kc.id ORDER BY alp.created_at DESC`;

      const result = await this.pool.query(query, values);

      logger.debug('Learning paths retrieved', { user_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch learning paths', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // LEARNING RECOMMENDATIONS - ENHANCED
  // ========================================

  async getPersonalizedRecommendations(user_id: string, limit: number = 10): Promise<any[]> {
    try {
      logger.info('Fetching personalized recommendations', { user_id, limit });

      const result = await this.pool.query(`
        SELECT
          lr.*,
          kc.name as concept_name,
          kc.cognitive_level,
          cm.mastery_level as current_mastery
        FROM learning_recommendations lr
        JOIN knowledge_concepts kc ON kc.id = lr.recommended_concept_id
        LEFT JOIN concept_mastery cm ON cm.user_id = lr.user_id AND cm.concept_id = lr.recommended_concept_id
        WHERE lr.user_id = $1 AND lr.is_completed = false
        ORDER BY lr.confidence_score DESC, lr.created_at DESC
        LIMIT $2
      `, [user_id, limit]);

      logger.info('Recommendations retrieved', { user_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch recommendations', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // SPACED REPETITION - ENHANCED
  // ========================================

  async getConceptsDueForReviewWithPriority(user_id: string): Promise<any[]> {
    try {
      logger.info('Fetching concepts due for review', { user_id });

      const result = await this.pool.query(`
        SELECT
          cdr.*,
          kc.name as concept_name,
          kc.cognitive_level,
          cm.mastery_level,
          CASE
            WHEN cdr.days_overdue > 7 THEN 'urgent'
            WHEN cdr.days_overdue > 3 THEN 'high'
            WHEN cdr.days_overdue > 0 THEN 'medium'
            ELSE 'low'
          END as priority
        FROM concepts_due_for_review cdr
        JOIN knowledge_concepts kc ON kc.id = cdr.concept_id
        JOIN concept_mastery cm ON cm.user_id = cdr.user_id AND cm.concept_id = cdr.concept_id
        WHERE cdr.user_id = $1
        ORDER BY
          CASE
            WHEN cdr.days_overdue > 7 THEN 1
            WHEN cdr.days_overdue > 3 THEN 2
            WHEN cdr.days_overdue > 0 THEN 3
            ELSE 4
          END,
          cdr.days_overdue DESC,
          cm.mastery_level ASC
      `, [user_id]);

      logger.info('Concepts due for review retrieved', {
        user_id,
        count: result.rows.length,
        urgent: result.rows.filter(r => r.priority === 'urgent').length
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch concepts due for review', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getAdaptiveLearningHealthCheck(): Promise<any> {
    try {
      const [concepts, activePaths, recommendations] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM knowledge_concepts`),
        this.pool.query(`SELECT COUNT(*) as count FROM adaptive_learning_paths WHERE status = 'active'`),
        this.pool.query(`SELECT COUNT(*) as count FROM learning_recommendations WHERE is_completed = false`)
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          total_concepts: parseInt(concepts.rows[0].count),
          active_learning_paths: parseInt(activePaths.rows[0].count),
          pending_recommendations: parseInt(recommendations.rows[0].count)
        }
      };
    } catch (error: any) {
      logger.error('Failed to get adaptive learning health check', error);
      throw error;
    }
  }
}
