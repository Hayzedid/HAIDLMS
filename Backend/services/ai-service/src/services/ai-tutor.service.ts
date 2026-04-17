import OpenAI from 'openai';
import { pool } from '../db/pool';
import crypto from 'crypto';

/**
 * AI Socratic Tutor Service - Complete Implementation
 *
 * CRITICAL: This AI NEVER writes code for students.
 * It only explains, asks questions, and provides hints.
 */

interface ChatSession {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
  problemId?: string;
  contextType: string;
  startedAt: Date;
  totalMessages: number;
  studentCodeContext?: string;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'student' | 'assistant' | 'system';
  content: string;
  messageType?: string;
  codeSnippet?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  createdAt: Date;
}

interface ErrorExplanation {
  id: string;
  userId: string;
  sessionId?: string;
  errorMessage: string;
  errorType: string;
  language: string;
  studentCode: string;
  lineNumber?: number;
  aiExplanation: string;
  suggestedFix: string;
  learningResourceLinks: string[];
  wasHelpful?: boolean;
  resolvedIndependently: boolean;
}

interface ExtensionChallenge {
  id: string;
  userId: string;
  sessionId?: string;
  baseProblemId?: string;
  studentCode: string;
  challengePrompt: string;
  challengeType: string;
  difficultyLevel: number;
  accepted: boolean;
  completed: boolean;
}

class AITutorService {
  private openai: OpenAI;
  private readonly SYSTEM_PROMPT = `You are a Socratic programming tutor for a coding bootcamp LMS. Your role is to help students learn by:

1. NEVER writing code for them - you explain concepts and guide thinking
2. Asking probing questions to make them think deeply
3. Breaking down complex problems into smaller steps
4. Explaining error messages in plain language
5. Suggesting where to look in documentation
6. Proposing "what if?" scenarios to extend their learning

CRITICAL RULES:
- If asked to write code, respond: "I can't write the code for you, but I can help you think through the logic. What approach were you considering?"
- If asked for the answer, respond: "Let me help you discover the answer. What have you tried so far?"
- If asked to debug, explain the error but don't give the fix: "This error means X. Where in your code do you think this might be happening?"
- Use the Socratic method: answer questions with guiding questions
- Be encouraging but don't solve problems for students
- If detecting cheating attempts, log safety violation

Your goal: Help students become independent problem solvers, not dependent on AI assistance.`;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async startChatSession(params: {
    userId: string;
    courseId?: string;
    lessonId?: string;
    assessmentId?: string;
    problemId?: string;
    contextType: string;
    studentCodeContext?: string;
  }): Promise<ChatSession> {
    const config = await this.getTutorConfig(params.courseId, params.assessmentId);

    if (!config.isEnabled) {
      throw new Error('AI tutor is disabled for this context');
    }

    const todayUsage = await this.getTodayUsage(params.userId);
    if (todayUsage.totalSessions >= config.maxSessionsPerDay) {
      throw new Error(`Daily session limit reached (${config.maxSessionsPerDay})`);
    }

    if (params.assessmentId && config.restrictedDuringExam) {
      const isProctored = await this.isAssessmentProctored(params.assessmentId);
      if (isProctored) {
        throw new Error('AI tutor is disabled during proctored assessments');
      }
    }

    const result = await pool.query(
      `INSERT INTO ai_chat_sessions (
        user_id, course_id, lesson_id, assessment_id, problem_id,
        context_type, student_code_context
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.userId,
        params.courseId,
        params.lessonId,
        params.assessmentId,
        params.problemId,
        params.contextType,
        params.studentCodeContext,
      ]
    );

    await this.addMessage({
      sessionId: result.rows[0].id,
      role: 'system',
      content: this.SYSTEM_PROMPT,
      messageType: 'system_init',
    });

    return this.mapSessionRow(result.rows[0]);
  }

  async sendMessage(params: {
    sessionId: string;
    userId: string;
    content: string;
    codeSnippet?: string;
  }): Promise<ChatMessage> {
    const startTime = Date.now();

    const session = await this.getChatSession(params.sessionId);
    if (!session || session.userId !== params.userId) {
      throw new Error('Invalid session');
    }

    if (!session.isActive) {
      throw new Error('Session is no longer active');
    }

    const config = await this.getTutorConfig(session.courseId, session.assessmentId);
    if (session.totalMessages >= config.maxMessagesPerSession) {
      throw new Error(`Session message limit reached (${config.maxMessagesPerSession})`);
    }

    const violation = this.detectViolation(params.content);
    if (violation) {
      await this.logSafetyViolation({
        sessionId: params.sessionId,
        violationType: violation.type,
        studentPrompt: params.content,
        actionTaken: 'warned',
        severity: violation.severity,
      });

      return await this.addMessage({
        sessionId: params.sessionId,
        role: 'assistant',
        content: violation.warningMessage,
        messageType: 'safety_warning',
      });
    }

    await this.addMessage({
      sessionId: params.sessionId,
      role: 'student',
      content: params.content,
      codeSnippet: params.codeSnippet,
    });

    const history = await this.getConversationHistory(params.sessionId);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: history.map((msg) => ({
        role: msg.role === 'student' ? 'user' as const : msg.role === 'assistant' ? 'assistant' as const : 'system' as const,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseTimeMs = Date.now() - startTime;
    const aiResponse = completion.choices[0].message.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    const messageType = this.detectMessageType(aiResponse);

    const assistantMessage = await this.addMessage({
      sessionId: params.sessionId,
      role: 'assistant',
      content: aiResponse,
      messageType,
      tokensUsed,
      responseTimeMs,
    });

    await this.updateUsageStats(params.userId, tokensUsed);

    return assistantMessage;
  }

  async endChatSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error('Invalid session');
    }

    const history = await this.getConversationHistory(sessionId);
    const summary = await this.generateSessionSummary(history);
    const objectivesMet = await this.extractLearningObjectives(history);

    await pool.query(
      `UPDATE ai_chat_sessions
      SET is_active = false,
          ended_at = NOW(),
          session_summary = $1,
          learning_objectives_met = $2
      WHERE id = $3`,
      [summary, objectivesMet, sessionId]
    );
  }

  async getSession(sessionId: string, userId: string): Promise<any> {
    const session = await this.getChatSession(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    const messages = await this.getConversationHistory(sessionId);

    return {
      ...session,
      messages,
    };
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const result = await pool.query(
      `SELECT * FROM ai_chat_sessions
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT 50`,
      [userId]
    );

    return result.rows.map(this.mapSessionRow);
  }

  // ============================================================================
  // ERROR EXPLANATIONS
  // ============================================================================

  async explainError(params: {
    userId: string;
    sessionId?: string;
    errorMessage: string;
    studentCode: string;
    language: string;
    lineNumber?: number;
  }): Promise<ErrorExplanation> {
    const errorType = this.classifyError(params.errorMessage, params.language);

    const prompt = `A student encountered this error while coding in ${params.language}:

Error: ${params.errorMessage}
${params.lineNumber ? `Line: ${params.lineNumber}` : ''}

Their code:
\`\`\`${params.language}
${params.studentCode}
\`\`\`

Please:
1. Explain what this error means in simple terms
2. Help them understand WHY this error occurred
3. Ask guiding questions to help them locate the problem
4. Suggest documentation or concepts to review

DO NOT provide the fix or corrected code. Help them discover the solution themselves.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const aiExplanation = completion.choices[0].message.content || '';
    const resourceLinks = this.generateResourceLinks(params.language, errorType);
    const suggestedFix = this.extractSuggestedFix(aiExplanation);

    const result = await pool.query(
      `INSERT INTO ai_error_explanations (
        user_id, session_id, error_message, error_type, language,
        student_code, line_number, ai_explanation, suggested_fix,
        learning_resource_links
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.userId,
        params.sessionId,
        params.errorMessage,
        errorType,
        params.language,
        params.studentCode,
        params.lineNumber,
        aiExplanation,
        suggestedFix,
        resourceLinks,
      ]
    );

    return this.mapErrorExplanationRow(result.rows[0]);
  }

  async updateExplanationFeedback(params: {
    explanationId: string;
    wasHelpful?: boolean;
    resolvedIndependently?: boolean;
  }): Promise<void> {
    await pool.query(
      `UPDATE ai_error_explanations
      SET was_helpful = COALESCE($1, was_helpful),
          resolved_independently = COALESCE($2, resolved_independently)
      WHERE id = $3`,
      [params.wasHelpful, params.resolvedIndependently, params.explanationId]
    );
  }

  // ============================================================================
  // EXTENSION CHALLENGES
  // ============================================================================

  async generateExtensionChallenge(params: {
    userId: string;
    sessionId?: string;
    baseProblemId?: string;
    studentCode: string;
    language: string;
  }): Promise<ExtensionChallenge> {
    const prompt = `A student just completed this code:

\`\`\`${params.language}
${params.studentCode}
\`\`\`

Generate a "what if?" extension challenge that:
1. Builds on their current solution
2. Introduces a new complexity or edge case
3. Makes them think about scalability, performance, or design
4. Is achievable but requires deeper thinking

Examples:
- "What if the input was 1 million records instead of 100?"
- "What if the input could be negative or zero?"
- "What if you needed to handle this operation 1000 times per second?"
- "What if you had to make this thread-safe?"

Format your response as:
Challenge: [one-sentence challenge]
Why this matters: [1-2 sentences on real-world relevance]
Hints: [2-3 guiding questions to help them start]

DO NOT provide the solution.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const challengePrompt = completion.choices[0].message.content || '';
    const challengeType = this.detectChallengeType(challengePrompt);
    const difficultyLevel = this.estimateDifficulty(params.studentCode, challengePrompt);

    const result = await pool.query(
      `INSERT INTO ai_extension_challenges (
        user_id, session_id, base_problem_id, student_code,
        challenge_prompt, challenge_type, difficulty_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.userId,
        params.sessionId,
        params.baseProblemId,
        params.studentCode,
        challengePrompt,
        challengeType,
        difficultyLevel,
      ]
    );

    return this.mapExtensionChallengeRow(result.rows[0]);
  }

  async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE ai_extension_challenges
      SET accepted = true
      WHERE id = $1 AND user_id = $2`,
      [challengeId, userId]
    );
  }

  async submitChallengeSolution(params: {
    challengeId: string;
    userId: string;
    solution: string;
  }): Promise<any> {
    const challengeResult = await pool.query(
      `SELECT * FROM ai_extension_challenges
      WHERE id = $1 AND user_id = $2`,
      [params.challengeId, params.userId]
    );

    if (challengeResult.rows.length === 0) {
      throw new Error('Challenge not found');
    }

    const challenge = challengeResult.rows[0];

    // Generate AI feedback on solution
    const feedbackPrompt = `A student completed this extension challenge:

Challenge: ${challenge.challenge_prompt}

Their solution:
\`\`\`
${params.solution}
\`\`\`

Provide feedback:
1. Did they address the challenge requirements?
2. What did they do well?
3. What could be improved?
4. Follow-up questions to deepen their understanding

Be encouraging and focus on learning, not just correctness.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: feedbackPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiFeedback = completion.choices[0].message.content || '';

    await pool.query(
      `UPDATE ai_extension_challenges
      SET completed = true,
          student_solution = $1,
          ai_feedback = $2,
          completed_at = NOW()
      WHERE id = $3`,
      [params.solution, aiFeedback, params.challengeId]
    );

    return {
      challengeId: params.challengeId,
      feedback: aiFeedback,
    };
  }

  // ============================================================================
  // CONCEPT CHECKS
  // ============================================================================

  async generateConceptCheck(params: {
    sessionId: string;
    conceptName: string;
    context: string;
  }): Promise<any> {
    const prompt = `Generate a Socratic question to check if the student understands "${params.conceptName}".

Context: ${params.context}

Create a question that:
1. Tests conceptual understanding, not memorization
2. Requires them to apply the concept to a new situation
3. Has no single "right" answer - encourages discussion
4. Leads to deeper thinking

Example formats:
- "In what situations would you choose X over Y?"
- "How would this change if...?"
- "Why do you think the language designers made this choice?"

Keep it conversational and encouraging.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const question = completion.choices[0].message.content || '';

    const result = await pool.query(
      `INSERT INTO ai_concept_checks (session_id, concept_name, question)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [params.sessionId, params.conceptName, question]
    );

    return result.rows[0];
  }

  async answerConceptCheck(params: {
    checkId: string;
    answer: string;
  }): Promise<any> {
    const checkResult = await pool.query(
      `SELECT * FROM ai_concept_checks WHERE id = $1`,
      [params.checkId]
    );

    if (checkResult.rows.length === 0) {
      throw new Error('Concept check not found');
    }

    const check = checkResult.rows[0];

    // Generate AI follow-up
    const followUpPrompt = `The student was asked: "${check.question}"

Their answer: "${params.answer}"

Provide a Socratic follow-up:
1. If correct, ask a deeper question to extend their thinking
2. If partially correct, guide them to refine their understanding
3. If incorrect, ask questions that help them discover the right answer

Keep it encouraging and focused on learning.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: followUpPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiFollowUp = completion.choices[0].message.content || '';

    // Simple correctness check (this could be more sophisticated)
    const isCorrect = aiFollowUp.toLowerCase().includes('correct') ||
                      aiFollowUp.toLowerCase().includes('right') ||
                      aiFollowUp.toLowerCase().includes('good');

    await pool.query(
      `UPDATE ai_concept_checks
      SET student_answer = $1,
          is_correct = $2,
          ai_follow_up = $3,
          attempts = attempts + 1
      WHERE id = $4`,
      [params.answer, isCorrect, aiFollowUp, params.checkId]
    );

    return {
      checkId: params.checkId,
      isCorrect,
      followUp: aiFollowUp,
    };
  }

  // ============================================================================
  // ANALYTICS & PATTERNS
  // ============================================================================

  async getLearningPatterns(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM ai_learning_patterns WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Calculate and create patterns
      await this.calculateLearningPatterns(userId);
      return await this.getLearningPatterns(userId);
    }

    return result.rows[0];
  }

  private async calculateLearningPatterns(userId: string): Promise<void> {
    // Analyze error explanations to find weak concepts
    const errors = await pool.query(
      `SELECT error_type, COUNT(*) as count
      FROM ai_error_explanations
      WHERE user_id = $1
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10`,
      [userId]
    );

    const weakConcepts = errors.rows.map(r => r.error_type);

    // Analyze sessions to find average metrics
    const sessions = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_session_minutes
      FROM ai_chat_sessions
      WHERE user_id = $1 AND ended_at IS NOT NULL`,
      [userId]
    );

    const avgSessionMinutes = sessions.rows[0]?.avg_session_minutes || 0;

    // Check if student asks before trying (early sessions have minimal code context)
    const askBeforeTrying = await pool.query(
      `SELECT COUNT(*) as count
      FROM ai_chat_sessions
      WHERE user_id = $1
        AND student_code_context IS NULL
        AND total_messages > 0`,
      [userId]
    );

    const asksBeforeTrying = askBeforeTrying.rows[0]?.count > 5;

    // Calculate independence score
    const independence = await pool.query(
      `SELECT
        AVG(CASE WHEN resolved_independently THEN 100 ELSE 0 END) as score
      FROM ai_error_explanations
      WHERE user_id = $1`,
      [userId]
    );

    const independenceScore = independence.rows[0]?.score || 50;

    await pool.query(
      `INSERT INTO ai_learning_patterns (
        user_id, weak_concepts, avg_time_to_debug_minutes,
        independence_score, asks_before_trying,
        typical_session_duration_minutes, last_analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        weak_concepts = $2,
        avg_time_to_debug_minutes = $3,
        independence_score = $4,
        asks_before_trying = $5,
        typical_session_duration_minutes = $6,
        last_analyzed_at = NOW()`,
      [userId, weakConcepts, avgSessionMinutes, independenceScore, asksBeforeTrying, avgSessionMinutes]
    );
  }

  async getUsageStats(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM ai_usage_stats
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 30`,
      [userId]
    );

    return result.rows;
  }

  async getSafetyLogs(params: {
    userId?: string;
    severity?: string;
    limit: number;
  }): Promise<any[]> {
    let query = `SELECT * FROM ai_safety_logs WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (params.userId) {
      query += ` AND EXISTS (
        SELECT 1 FROM ai_chat_sessions
        WHERE ai_chat_sessions.id = ai_safety_logs.session_id
          AND ai_chat_sessions.user_id = $${paramCount}
      )`;
      values.push(params.userId);
      paramCount++;
    }

    if (params.severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(params.severity);
      paramCount++;
    }

    query += ` ORDER BY detected_at DESC LIMIT $${paramCount}`;
    values.push(params.limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const result = await pool.query(
      'SELECT * FROM ai_chat_sessions WHERE id = $1',
      [sessionId]
    );
    return result.rows[0] ? this.mapSessionRow(result.rows[0]) : null;
  }

  private async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    const result = await pool.query(
      `SELECT * FROM ai_chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC`,
      [sessionId]
    );
    return result.rows.map(this.mapMessageRow);
  }

  private async addMessage(params: {
    sessionId: string;
    role: 'student' | 'assistant' | 'system';
    content: string;
    messageType?: string;
    codeSnippet?: string;
    tokensUsed?: number;
    responseTimeMs?: number;
  }): Promise<ChatMessage> {
    const result = await pool.query(
      `INSERT INTO ai_chat_messages (
        session_id, role, content, message_type, code_snippet,
        tokens_used, response_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        params.sessionId,
        params.role,
        params.content,
        params.messageType,
        params.codeSnippet,
        params.tokensUsed,
        params.responseTimeMs,
      ]
    );
    return this.mapMessageRow(result.rows[0]);
  }

  private async getTutorConfig(courseId?: string, assessmentId?: string): Promise<any> {
    if (!courseId && !assessmentId) {
      return {
        isEnabled: true,
        mode: 'explain_only',
        maxMessagesPerSession: 50,
        maxSessionsPerDay: 10,
        allowErrorHelp: true,
        allowChallenges: true,
        allowConceptChecks: true,
        restrictedDuringExam: true,
      };
    }

    const result = await pool.query(
      `SELECT * FROM ai_tutor_config
      WHERE course_id = $1 OR assessment_id = $2
      LIMIT 1`,
      [courseId, assessmentId]
    );

    return result.rows[0] || {
      isEnabled: true,
      mode: 'explain_only',
      maxMessagesPerSession: 50,
      maxSessionsPerDay: 10,
      allowErrorHelp: true,
      allowChallenges: true,
      allowConceptChecks: true,
      restrictedDuringExam: true,
    };
  }

  private async getTodayUsage(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM ai_usage_stats
      WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    return result.rows[0] || { totalSessions: 0, totalMessages: 0, totalTokensUsed: 0 };
  }

  private async updateUsageStats(userId: string, tokensUsed: number): Promise<void> {
    await pool.query(
      `INSERT INTO ai_usage_stats (user_id, date, total_messages, total_tokens_used)
      VALUES ($1, CURRENT_DATE, 1, $2)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        total_messages = ai_usage_stats.total_messages + 1,
        total_tokens_used = ai_usage_stats.total_tokens_used + $2,
        updated_at = NOW()`,
      [userId, tokensUsed]
    );
  }

  private async isAssessmentProctored(assessmentId: string): Promise<boolean> {
    // This would query the assessment table to check if proctoring is enabled
    // For now, return false
    return false;
  }

  private detectViolation(prompt: string): {
    type: string;
    severity: string;
    warningMessage: string;
  } | null {
    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes('write the code') ||
      lowerPrompt.includes('write code for') ||
      lowerPrompt.includes('give me the code') ||
      lowerPrompt.includes('show me the code') ||
      lowerPrompt.includes('complete this code') ||
      lowerPrompt.includes('finish this code')
    ) {
      return {
        type: 'code_generation',
        severity: 'medium',
        warningMessage:
          "I can't write code for you - that would prevent you from learning! Instead, let's break down the problem together. What part are you stuck on?",
      };
    }

    if (
      lowerPrompt.includes('what is the answer') ||
      lowerPrompt.includes('give me the answer') ||
      lowerPrompt.includes('tell me the solution') ||
      lowerPrompt.includes('what should i put')
    ) {
      return {
        type: 'direct_answer',
        severity: 'medium',
        warningMessage:
          "I'm here to help you discover the answer, not give it to you. What approaches have you tried so far?",
      };
    }

    if (
      lowerPrompt.includes('this is an exam') ||
      lowerPrompt.includes('this is a test') ||
      lowerPrompt.includes('assessment question')
    ) {
      return {
        type: 'exam_help',
        severity: 'high',
        warningMessage:
          '⚠️ I cannot help with exam or assessment questions. Please complete the assessment using only your own knowledge.',
      };
    }

    return null;
  }

  private async logSafetyViolation(params: {
    sessionId?: string;
    messageId?: string;
    violationType: string;
    studentPrompt: string;
    aiResponse?: string;
    actionTaken: string;
    severity: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO ai_safety_logs (
        session_id, message_id, violation_type, student_prompt,
        ai_response, action_taken, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.sessionId,
        params.messageId,
        params.violationType,
        params.studentPrompt,
        params.aiResponse,
        params.actionTaken,
        params.severity,
      ]
    );
  }

  private classifyError(errorMessage: string, language: string): string {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('syntax')) return 'syntax';
    if (msg.includes('undefined') || msg.includes('not defined')) return 'runtime';
    if (msg.includes('type') || msg.includes('cannot')) return 'type';
    if (msg.includes('index') || msg.includes('out of range')) return 'index';
    if (msg.includes('null') || msg.includes('none')) return 'null_reference';
    if (msg.includes('import') || msg.includes('module')) return 'import';

    return 'general';
  }

  private generateResourceLinks(language: string, errorType: string): string[] {
    const baseLinks: { [key: string]: string[] } = {
      python: ['https://docs.python.org/3/', 'https://stackoverflow.com/questions/tagged/python'],
      javascript: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'https://javascript.info/'],
      java: ['https://docs.oracle.com/javase/', 'https://www.baeldung.com/'],
    };

    return baseLinks[language.toLowerCase()] || ['https://stackoverflow.com/'];
  }

  private extractSuggestedFix(explanation: string): string {
    const lines = explanation.split('\n');
    const fixSection = lines.filter(line =>
      line.toLowerCase().includes('try') ||
      line.toLowerCase().includes('check') ||
      line.toLowerCase().includes('look at')
    );
    return fixSection.join('\n') || 'Review the explanation above for guidance.';
  }

  private detectMessageType(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('question') || lower.includes('?')) return 'question';
    if (lower.includes('explain') || lower.includes('understand')) return 'explanation';
    if (lower.includes('hint') || lower.includes('try')) return 'hint';
    if (lower.includes('challenge') || lower.includes('what if')) return 'challenge';
    if (lower.includes('error') || lower.includes('bug')) return 'error_help';

    return 'general';
  }

  private detectChallengeType(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('performance') || lower.includes('faster') || lower.includes('optimize'))
      return 'performance';
    if (lower.includes('edge case') || lower.includes('negative') || lower.includes('zero'))
      return 'edge_case';
    if (lower.includes('scale') || lower.includes('million') || lower.includes('large'))
      return 'scalability';
    if (lower.includes('security') || lower.includes('safe') || lower.includes('attack'))
      return 'security';

    return 'abstraction';
  }

  private estimateDifficulty(studentCode: string, challengePrompt: string): number {
    const codeLines = studentCode.split('\n').length;
    const challengeWords = challengePrompt.split(' ').length;

    if (codeLines < 20 && challengeWords < 50) return 2;
    if (codeLines < 50 && challengeWords < 100) return 3;
    if (codeLines < 100) return 4;
    return 5;
  }

  private async generateSessionSummary(history: ChatMessage[]): Promise<string> {
    const conversationText = history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Summarize this AI tutoring session in 2-3 sentences. Focus on what the student learned and accomplished:

${conversationText}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 150,
    });

    return completion.choices[0].message.content || 'Session completed.';
  }

  private async extractLearningObjectives(history: ChatMessage[]): Promise<string[]> {
    const conversationText = history
      .filter(msg => msg.role !== 'system')
      .map(msg => msg.content)
      .join(' ');

    const keywords = [
      'recursion', 'iteration', 'loops', 'arrays', 'objects', 'functions',
      'classes', 'inheritance', 'polymorphism', 'async', 'promises',
      'callbacks', 'closures', 'scope', 'hoisting', 'algorithms',
      'data structures', 'big-o', 'complexity', 'sorting', 'searching'
    ];

    return keywords.filter(keyword =>
      conversationText.toLowerCase().includes(keyword)
    );
  }

  // Row mappers
  private mapSessionRow(row: any): ChatSession {
    return {
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      contextType: row.context_type,
      startedAt: row.started_at,
      totalMessages: row.total_messages,
      studentCodeContext: row.student_code_context,
      isActive: row.is_active,
    };
  }

  private mapMessageRow(row: any): ChatMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      messageType: row.message_type,
      codeSnippet: row.code_snippet,
      tokensUsed: row.tokens_used,
      responseTimeMs: row.response_time_ms,
      createdAt: row.created_at,
    };
  }

  private mapErrorExplanationRow(row: any): ErrorExplanation {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      errorMessage: row.error_message,
      errorType: row.error_type,
      language: row.language,
      studentCode: row.student_code,
      lineNumber: row.line_number,
      aiExplanation: row.ai_explanation,
      suggestedFix: row.suggested_fix,
      learningResourceLinks: row.learning_resource_links,
      wasHelpful: row.was_helpful,
      resolvedIndependently: row.resolved_independently,
    };
  }

  private mapExtensionChallengeRow(row: any): ExtensionChallenge {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      baseProblemId: row.base_problem_id,
      studentCode: row.student_code,
      challengePrompt: row.challenge_prompt,
      challengeType: row.challenge_type,
      difficultyLevel: row.difficulty_level,
      accepted: row.accepted,
      completed: row.completed,
    };
  }
}

export const aiTutorService = new AITutorService();
