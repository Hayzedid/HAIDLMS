import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface AdaptiveConfig {
  id: string;
  assessmentId: string;
  courseId: string;
  isAdaptive: boolean;
  initialDifficulty: string;
  difficultyAdjustmentAlgorithm: string;
  easyThreshold: number;
  hardThreshold: number;
  weightCorrectness: number;
  weightTimeEfficiency: number;
  weightConfidence: number;
  confidenceThreshold: number;
  maxQuestions: number;
}

interface AdaptiveSession {
  id: string;
  assessmentId: string;
  userId: string;
  status: string;
  currentDifficulty: string;
  currentAbilityEstimate: number;
  abilityConfidence: number;
  questionsAnswered: number;
  questionsCorrect: number;
  currentStreak: number;
}

interface QuestionMetadata {
  id: string;
  questionId: string;
  difficultyLevel: string;
  difficultyScore: number;
  discriminationParam?: number;
  difficultyParam?: number;
  guessingParam?: number;
  historicalAccuracy?: number;
}

interface QuestionResponse {
  questionId: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  confidenceLevel?: string;
  confidenceScore?: number;
}

export class AdaptiveAssessmentService {
  constructor(private pool: Pool) {}

  // ========================================
  // 1. CONFIGURATION MANAGEMENT
  // ========================================

  async createAdaptiveConfig(data: Partial<AdaptiveConfig>): Promise<AdaptiveConfig> {
    const query = `
      INSERT INTO adaptive_assessment_config (
        assessment_id, course_id, is_adaptive, initial_difficulty,
        difficulty_adjustment_algorithm, easy_threshold, hard_threshold,
        weight_correctness, weight_time_efficiency, weight_confidence,
        confidence_threshold, max_questions_total
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      data.assessmentId,
      data.courseId,
      data.isAdaptive ?? true,
      data.initialDifficulty || 'medium',
      data.difficultyAdjustmentAlgorithm || 'performance_based',
      data.easyThreshold || 0.70,
      data.hardThreshold || 0.40,
      data.weightCorrectness || 0.60,
      data.weightTimeEfficiency || 0.20,
      data.weightConfidence || 0.20,
      data.confidenceThreshold || 0.85,
      data.maxQuestions || 20,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getAdaptiveConfig(assessmentId: string): Promise<AdaptiveConfig | null> {
    const query = 'SELECT * FROM adaptive_assessment_config WHERE assessment_id = $1';
    const result = await this.pool.query(query, [assessmentId]);
    return result.rows[0] || null;
  }

  // ========================================
  // 2. SESSION MANAGEMENT
  // ========================================

  async startAdaptiveSession(
    assessmentId: string,
    userId: string
  ): Promise<AdaptiveSession> {
    const config = await this.getAdaptiveConfig(assessmentId);
    if (!config) {
      throw new Error('Adaptive assessment configuration not found');
    }

    const initialDifficulty = config.initialDifficulty;
    const initialAbility = this.mapDifficultyToAbility(initialDifficulty);

    const query = `
      INSERT INTO adaptive_assessment_sessions (
        assessment_id, user_id, config_id, current_difficulty,
        current_ability_estimate, ability_confidence, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
      RETURNING *
    `;

    const values = [
      assessmentId,
      userId,
      config.id,
      initialDifficulty,
      initialAbility,
      0.0,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getSession(sessionId: string): Promise<AdaptiveSession | null> {
    const query = 'SELECT * FROM adaptive_assessment_sessions WHERE id = $1';
    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async completeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const finalAbilityLevel = this.determineAbilityLevel(session.currentAbilityEstimate);
    const config = await this.getAdaptiveConfig(session.assessmentId);
    const passed = session.currentAbilityEstimate >= (config?.easyThreshold || 0.70);

    const query = `
      UPDATE adaptive_assessment_sessions
      SET
        status = 'completed',
        completed_at = NOW(),
        time_elapsed_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        final_score = current_ability_estimate,
        final_ability_level = $2,
        passed = $3
      WHERE id = $1
    `;

    await this.pool.query(query, [sessionId, finalAbilityLevel, passed]);
  }

  // ========================================
  // 3. QUESTION SELECTION
  // ========================================

  async getNextQuestion(sessionId: string): Promise<QuestionMetadata | null> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const config = await this.getAdaptiveConfig(session.assessmentId);
    if (!config) throw new Error('Configuration not found');

    // Check termination criteria
    if (this.shouldTerminateSession(session, config)) {
      await this.completeSession(sessionId);
      return null;
    }

    // Get target difficulty based on current ability estimate
    const targetDifficulty = session.currentAbilityEstimate;

    // Use database function to select next question
    const query = 'SELECT get_next_adaptive_question($1, $2) AS question_id';
    const result = await this.pool.query(query, [sessionId, targetDifficulty]);

    if (!result.rows[0]?.question_id) {
      return null; // No more questions available
    }

    const questionId = result.rows[0].question_id;

    // Get question metadata
    const metadataQuery = `
      SELECT * FROM question_difficulty_metadata
      WHERE question_id = $1
    `;
    const metadata = await this.pool.query(metadataQuery, [questionId]);

    return metadata.rows[0] || null;
  }

  // ========================================
  // 4. RESPONSE PROCESSING & ADAPTATION
  // ========================================

  async submitQuestionResponse(
    sessionId: string,
    response: QuestionResponse
  ): Promise<{ newAbilityEstimate: number; nextDifficulty: string }> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const config = await this.getAdaptiveConfig(session.assessmentId);
    if (!config) throw new Error('Configuration not found');

    // Calculate ability change based on response
    const abilityChange = await this.calculateAbilityChange(
      session,
      response,
      config
    );

    const newAbilityEstimate = Math.max(
      0,
      Math.min(1, session.currentAbilityEstimate + abilityChange)
    );

    // Determine new difficulty level
    const nextDifficulty = this.determineDifficultyLevel(newAbilityEstimate);

    // Update confidence in ability estimate
    const newConfidence = this.updateConfidence(
      session.abilityConfidence,
      session.questionsAnswered + 1
    );

    // Record question presentation
    await this.recordQuestionPresentation(session, response, abilityChange, nextDifficulty);

    // Update session difficulty if needed
    if (nextDifficulty !== session.currentDifficulty) {
      await this.updateSessionDifficulty(sessionId, nextDifficulty, newAbilityEstimate);
    }

    // Update ability and confidence
    await this.pool.query(
      `UPDATE adaptive_assessment_sessions
       SET current_ability_estimate = $1, ability_confidence = $2
       WHERE id = $3`,
      [newAbilityEstimate, newConfidence, sessionId]
    );

    return {
      newAbilityEstimate,
      nextDifficulty,
    };
  }

  // ========================================
  // 5. DIFFICULTY ADJUSTMENT ALGORITHMS
  // ========================================

  private async calculateAbilityChange(
    session: AdaptiveSession,
    response: QuestionResponse,
    config: AdaptiveConfig
  ): Promise<number> {
    const metadata = await this.getQuestionMetadata(response.questionId);
    if (!metadata) return 0;

    const algorithm = config.difficultyAdjustmentAlgorithm;

    if (algorithm === 'elo_based') {
      return this.eloBasedAdjustment(session, response, metadata);
    } else if (algorithm === 'performance_based') {
      return this.performanceBasedAdjustment(session, response, metadata, config);
    } else {
      return this.hybridAdjustment(session, response, metadata, config);
    }
  }

  private eloBasedAdjustment(
    session: AdaptiveSession,
    response: QuestionResponse,
    metadata: QuestionMetadata
  ): number {
    const K = 0.32; // Learning rate
    const studentAbility = session.currentAbilityEstimate;
    const questionDifficulty = metadata.difficultyScore;

    // Expected probability of success
    const expectedSuccess = 1 / (1 + Math.exp(-7 * (studentAbility - questionDifficulty)));

    // Actual outcome (1 for correct, 0 for incorrect)
    const actualOutcome = response.isCorrect ? 1 : 0;

    // Ability change
    return K * (actualOutcome - expectedSuccess);
  }

  private performanceBasedAdjustment(
    session: AdaptiveSession,
    response: QuestionResponse,
    metadata: QuestionMetadata,
    config: AdaptiveConfig
  ): number {
    // Weighted performance score
    const correctnessScore = response.isCorrect ? 1 : 0;

    // Time efficiency (assuming 60 seconds average per question)
    const avgTime = 60;
    const timeEfficiency = Math.max(0, 1 - (response.timeTakenSeconds / avgTime - 1));

    // Confidence score (0.0 to 1.0)
    const confidenceScore = response.confidenceScore || 0.5;

    const performanceScore =
      config.weightCorrectness * correctnessScore +
      config.weightTimeEfficiency * timeEfficiency +
      config.weightConfidence * confidenceScore;

    // Map performance to ability change
    const questionDifficulty = metadata.difficultyScore;
    const difficultyGap = questionDifficulty - session.currentAbilityEstimate;

    // Larger changes when performance surprises us
    const surpriseFactor = Math.abs(difficultyGap);
    const baseChange = (performanceScore - 0.5) * 0.15; // ±15% max change

    return baseChange * (1 + surpriseFactor);
  }

  private hybridAdjustment(
    session: AdaptiveSession,
    response: QuestionResponse,
    metadata: QuestionMetadata,
    config: AdaptiveConfig
  ): number {
    const eloChange = this.eloBasedAdjustment(session, response, metadata);
    const performanceChange = this.performanceBasedAdjustment(
      session,
      response,
      metadata,
      config
    );

    return (eloChange + performanceChange) / 2;
  }

  // ========================================
  // 6. HELPER FUNCTIONS
  // ========================================

  private mapDifficultyToAbility(difficulty: string): number {
    const mapping: Record<string, number> = {
      easy: 0.25,
      medium: 0.50,
      hard: 0.75,
      expert: 0.90,
    };
    return mapping[difficulty] || 0.50;
  }

  private determineDifficultyLevel(abilityScore: number): string {
    if (abilityScore < 0.35) return 'easy';
    if (abilityScore < 0.65) return 'medium';
    if (abilityScore < 0.85) return 'hard';
    return 'expert';
  }

  private determineAbilityLevel(abilityScore: number): string {
    if (abilityScore < 0.35) return 'novice';
    if (abilityScore < 0.65) return 'intermediate';
    if (abilityScore < 0.85) return 'advanced';
    return 'expert';
  }

  private updateConfidence(currentConfidence: number, questionsAnswered: number): number {
    // Confidence increases with more questions, asymptotically approaching 1.0
    const maxConfidence = 0.95;
    const growthRate = 0.1;
    return maxConfidence * (1 - Math.exp(-growthRate * questionsAnswered));
  }

  private shouldTerminateSession(session: AdaptiveSession, config: AdaptiveConfig): boolean {
    // Check max questions
    if (session.questionsAnswered >= config.maxQuestions) {
      return true;
    }

    // Check confidence threshold
    if (session.abilityConfidence >= config.confidenceThreshold) {
      return true;
    }

    return false;
  }

  private async getQuestionMetadata(questionId: string): Promise<QuestionMetadata | null> {
    const query = 'SELECT * FROM question_difficulty_metadata WHERE question_id = $1';
    const result = await this.pool.query(query, [questionId]);
    return result.rows[0] || null;
  }

  private async recordQuestionPresentation(
    session: AdaptiveSession,
    response: QuestionResponse,
    abilityChange: number,
    nextDifficulty: string
  ): Promise<void> {
    const query = `
      INSERT INTO adaptive_question_presentations (
        session_id, question_id, question_sequence,
        difficulty_at_presentation, ability_estimate_before,
        is_correct, time_taken_seconds, confidence_level, confidence_score,
        contributed_to_ability, ability_change, next_difficulty_recommendation,
        answered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `;

    const values = [
      session.id,
      response.questionId,
      session.questionsAnswered + 1,
      session.currentDifficulty,
      session.currentAbilityEstimate,
      response.isCorrect,
      response.timeTakenSeconds,
      response.confidenceLevel,
      response.confidenceScore,
      true,
      abilityChange,
      nextDifficulty,
    ];

    await this.pool.query(query, values);
  }

  private async updateSessionDifficulty(
    sessionId: string,
    newDifficulty: string,
    newAbility: number
  ): Promise<void> {
    const query = `
      UPDATE adaptive_assessment_sessions
      SET
        current_difficulty = $2,
        difficulty_adjustments = difficulty_adjustments + 1,
        difficulty_history = difficulty_history || jsonb_build_object(
          'timestamp', NOW(),
          'difficulty', $2,
          'ability', $3,
          'reason', 'performance_based'
        )
      WHERE id = $1
    `;

    await this.pool.query(query, [sessionId, newDifficulty, newAbility]);
  }

  // ========================================
  // 7. STATISTICS & REPORTING
  // ========================================

  async getSessionStatistics(sessionId: string): Promise<any> {
    const query = `
      SELECT
        s.*,
        COUNT(p.id) AS total_presentations,
        AVG(p.time_taken_seconds) AS avg_response_time,
        array_agg(p.difficulty_at_presentation ORDER BY p.question_sequence) AS difficulty_progression,
        array_agg(p.is_correct ORDER BY p.question_sequence) AS answer_pattern
      FROM adaptive_assessment_sessions s
      LEFT JOIN adaptive_question_presentations p ON s.id = p.session_id
      WHERE s.id = $1
      GROUP BY s.id
    `;

    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0];
  }

  async getUserAbilityHistory(userId: string, assessmentId: string): Promise<any[]> {
    const query = `
      SELECT * FROM student_ability_progression
      WHERE user_id = $1 AND assessment_id = $2
      ORDER BY started_at DESC
    `;

    const result = await this.pool.query(query, [userId, assessmentId]);
    return result.rows;
  }
}
