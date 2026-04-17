import { Pool } from 'pg';

export class AdaptiveLearningService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Knowledge Concepts
  async createConcept(data: { name: string; description?: string; cognitive_level: string; }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO knowledge_concepts (name, description, cognitive_level) VALUES ($1, $2, $3) RETURNING id`,
      [data.name, data.description || null, data.cognitive_level]
    );
    return result.rows[0].id;
  }

  async getConcepts(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM knowledge_concepts ORDER BY created_at DESC`);
    return result.rows;
  }

  // Concept Relationships
  async linkConcepts(prerequisite_id: string, dependent_id: string): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO concept_relationships (prerequisite_concept_id, dependent_concept_id, relationship_type)
       VALUES ($1, $2, 'prerequisite') RETURNING id`,
      [prerequisite_id, dependent_id]
    );
    return result.rows[0].id;
  }

  // Learner Profiles
  async createLearnerProfile(user_id: string, learning_style?: string): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO learner_profiles (user_id, learning_style) VALUES ($1, $2) RETURNING id`,
      [user_id, learning_style || null]
    );
    return result.rows[0].id;
  }

  async getLearnerProfile(user_id: string): Promise<any> {
    const result = await this.pool.query(`SELECT * FROM learner_profiles WHERE user_id = $1`, [user_id]);
    return result.rows[0];
  }

  // Concept Mastery
  async updateMastery(user_id: string, concept_id: string, performance_score: number): Promise<void> {
    await this.pool.query(
      `SELECT update_concept_mastery($1, $2, $3)`,
      [user_id, concept_id, performance_score]
    );
  }

  async getMastery(user_id: string): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM user_learning_progress WHERE user_id = $1`, [user_id]);
    return result.rows;
  }

  // Adaptive Learning Paths
  async generatePath(user_id: string, target_concept_id: string): Promise<string> {
    const result = await this.pool.query(
      `SELECT generate_adaptive_path($1, $2) as path_id`,
      [user_id, target_concept_id]
    );
    return result.rows[0].path_id;
  }

  async getLearningPaths(user_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM adaptive_learning_paths WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Learning Recommendations
  async getRecommendations(user_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM learning_recommendations WHERE user_id = $1 AND is_completed = false ORDER BY confidence_score DESC LIMIT 10`,
      [user_id]
    );
    return result.rows;
  }

  // Skill Gap Analysis
  async analyzeSkillGap(user_id: string, target_skills: string[]): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO skill_gap_analyses (user_id, target_skills) VALUES ($1, $2) RETURNING id`,
      [user_id, target_skills]
    );
    return result.rows[0].id;
  }

  async getSkillGaps(user_id: string): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM skill_gap_analyses WHERE user_id = $1`, [user_id]);
    return result.rows;
  }

  // Spaced Repetition
  async getConceptsDueForReview(user_id: string): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM concepts_due_for_review WHERE user_id = $1`, [user_id]);
    return result.rows;
  }
}
