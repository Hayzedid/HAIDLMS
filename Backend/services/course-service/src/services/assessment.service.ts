import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateAssessmentParams {
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assessmentType?: string;
  createdBy: string;
  availableFrom?: string;
  availableUntil?: string;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  randomQuestionCount?: number;
  showResultsImmediately?: boolean;
  showCorrectAnswers?: boolean;
  showFeedback?: boolean;
  oneQuestionPerPage?: boolean;
  passingScore?: number;
  enableProctoring?: boolean;
  requireWebcam?: boolean;
  lockdownBrowser?: boolean;
  detectTabSwitching?: boolean;
  preventCopyPaste?: boolean;
  password?: string;
  tags?: string[];
}

interface CreateQuestionParams {
  assessmentId?: string;
  questionBankId?: string;
  questionText: string;
  questionType: string;
  orderIndex?: number;
  points?: number;
  difficultyLevel?: string;
  imageUrl?: string;
  videoUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  correctAnswer?: string;
  correctAnswers?: string[];
  caseSensitive?: boolean;
  matchingPairs?: any;
  testCases?: any;
  starterCode?: string;
  generalFeedback?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  hint?: string;
  tags?: string[];
}

interface CreateQuestionOptionParams {
  questionId: string;
  optionText: string;
  orderIndex: number;
  isCorrect: boolean;
  feedback?: string;
  points?: number;
}

// ============================================================================
// ASSESSMENT SERVICE
// ============================================================================

export class AssessmentService {
  // ========================================
  // ASSESSMENTS
  // ========================================

  async createAssessment(params: CreateAssessmentParams): Promise<any> {
    const {
      courseId,
      moduleId,
      lessonId,
      title,
      description,
      instructions,
      assessmentType = 'quiz',
      createdBy,
      availableFrom,
      availableUntil,
      timeLimitMinutes,
      maxAttempts,
      shuffleQuestions = false,
      shuffleOptions = false,
      randomQuestionCount,
      showResultsImmediately = true,
      showCorrectAnswers = true,
      showFeedback = true,
      oneQuestionPerPage = false,
      passingScore,
      enableProctoring = false,
      requireWebcam = false,
      lockdownBrowser = false,
      detectTabSwitching = false,
      preventCopyPaste = false,
      password,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO assessments (
        course_id, module_id, lesson_id, title, description, instructions,
        assessment_type, created_by, available_from, available_until,
        time_limit_minutes, max_attempts, shuffle_questions, shuffle_options,
        random_question_count, show_results_immediately, show_correct_answers,
        show_feedback, one_question_per_page, passing_score, enable_proctoring,
        require_webcam, lockdown_browser, detect_tab_switching, prevent_copy_paste,
        password, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        courseId || null, moduleId || null, lessonId || null, title, description, instructions,
        assessmentType, createdBy, availableFrom, availableUntil,
        timeLimitMinutes, maxAttempts, shuffleQuestions, shuffleOptions,
        randomQuestionCount, showResultsImmediately, showCorrectAnswers,
        showFeedback, oneQuestionPerPage, passingScore, enableProctoring,
        requireWebcam, lockdownBrowser, detectTabSwitching, preventCopyPaste,
        password, tags || []
      ]
    );

    return result.rows[0];
  }

  async getAssessment(assessmentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT a.*, u.name as creator_name, c.title as course_title
      FROM assessments a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.id = $1`,
      [assessmentId]
    );

    return result.rows[0];
  }

  async listAssessments(filters: any = {}): Promise<{ assessments: any[]; total: number }> {
    const {
      courseId,
      moduleId,
      lessonId,
      assessmentType,
      status,
      createdBy,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT a.*, u.name as creator_name, c.title as course_title
      FROM assessments a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (courseId) {
      query += ` AND a.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (moduleId) {
      query += ` AND a.module_id = $${paramIndex}`;
      params.push(moduleId);
      paramIndex++;
    }

    if (lessonId) {
      query += ` AND a.lesson_id = $${paramIndex}`;
      params.push(lessonId);
      paramIndex++;
    }

    if (assessmentType) {
      query += ` AND a.assessment_type = $${paramIndex}`;
      params.push(assessmentType);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (createdBy) {
      query += ` AND a.created_by = $${paramIndex}`;
      params.push(createdBy);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT a.*, u.name as creator_name, c.title as course_title', 'SELECT COUNT(DISTINCT a.id) as total');

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      assessments: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async updateAssessment(assessmentId: string, updates: any): Promise<any> {
    const allowedFields = [
      'title', 'description', 'instructions', 'assessment_type', 'available_from', 'available_until',
      'time_limit_minutes', 'max_attempts', 'shuffle_questions', 'shuffle_options',
      'random_question_count', 'show_results_immediately', 'show_correct_answers',
      'show_feedback', 'one_question_per_page', 'passing_score', 'enable_proctoring',
      'require_webcam', 'lockdown_browser', 'detect_tab_switching', 'prevent_copy_paste',
      'password', 'status', 'tags', 'grade_released'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(assessmentId);
    const result = await pool.query(
      `UPDATE assessments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteAssessment(assessmentId: string): Promise<void> {
    await pool.query(`DELETE FROM assessments WHERE id = $1`, [assessmentId]);
  }

  async publishAssessment(assessmentId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE assessments SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *`,
      [assessmentId]
    );
    return result.rows[0];
  }

  async getAssessmentSummary(assessmentId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM assessment_summary WHERE id = $1`,
      [assessmentId]
    );
    return result.rows[0];
  }

  // ========================================
  // QUESTIONS
  // ========================================

  async createQuestion(params: CreateQuestionParams): Promise<any> {
    const {
      assessmentId,
      questionBankId,
      questionText,
      questionType,
      orderIndex = 0,
      points = 1,
      difficultyLevel,
      imageUrl,
      videoUrl,
      codeSnippet,
      codeLanguage,
      correctAnswer,
      correctAnswers,
      caseSensitive = false,
      matchingPairs,
      testCases,
      starterCode,
      generalFeedback,
      correctFeedback,
      incorrectFeedback,
      hint,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO questions (
        assessment_id, question_bank_id, question_text, question_type, order_index,
        points, difficulty_level, image_url, video_url, code_snippet, code_language,
        correct_answer, correct_answers, case_sensitive, matching_pairs, test_cases,
        starter_code, general_feedback, correct_feedback, incorrect_feedback, hint, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        assessmentId || null, questionBankId || null, questionText, questionType, orderIndex,
        points, difficultyLevel, imageUrl, videoUrl, codeSnippet, codeLanguage,
        correctAnswer, correctAnswers || [], caseSensitive,
        matchingPairs ? JSON.stringify(matchingPairs) : null,
        testCases ? JSON.stringify(testCases) : null,
        starterCode, generalFeedback, correctFeedback, incorrectFeedback, hint, tags || []
      ]
    );

    // Update assessment statistics
    if (assessmentId) {
      await pool.query(`SELECT update_assessment_statistics($1)`, [assessmentId]);
    }

    return result.rows[0];
  }

  async getQuestion(questionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM questions WHERE id = $1`,
      [questionId]
    );
    return result.rows[0];
  }

  async listQuestions(assessmentId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_index, created_at`,
      [assessmentId]
    );
    return result.rows;
  }

  async updateQuestion(questionId: string, updates: any): Promise<any> {
    const allowedFields = [
      'question_text', 'question_type', 'order_index', 'points', 'difficulty_level',
      'image_url', 'video_url', 'code_snippet', 'code_language', 'correct_answer',
      'correct_answers', 'case_sensitive', 'matching_pairs', 'test_cases', 'starter_code',
      'general_feedback', 'correct_feedback', 'incorrect_feedback', 'hint', 'tags'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(questionId);
    const result = await pool.query(
      `UPDATE questions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM questions WHERE id = $1 RETURNING assessment_id`,
      [questionId]
    );

    // Update assessment statistics
    if (result.rows[0]?.assessment_id) {
      await pool.query(`SELECT update_assessment_statistics($1)`, [result.rows[0].assessment_id]);
    }
  }

  // ========================================
  // QUESTION OPTIONS
  // ========================================

  async createQuestionOption(params: CreateQuestionOptionParams): Promise<any> {
    const { questionId, optionText, orderIndex, isCorrect, feedback, points = 0 } = params;

    const result = await pool.query(
      `INSERT INTO question_options (question_id, option_text, order_index, is_correct, feedback, points)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [questionId, optionText, orderIndex, isCorrect, feedback, points]
    );

    return result.rows[0];
  }

  async listQuestionOptions(questionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM question_options WHERE question_id = $1 ORDER BY order_index`,
      [questionId]
    );
    return result.rows;
  }

  async deleteQuestionOption(optionId: string): Promise<void> {
    await pool.query(`DELETE FROM question_options WHERE id = $1`, [optionId]);
  }

  // ========================================
  // ASSESSMENT ATTEMPTS
  // ========================================

  async startAttempt(assessmentId: string, userId: string): Promise<any> {
    // Get attempt number
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM assessment_attempts WHERE assessment_id = $1 AND user_id = $2`,
      [assessmentId, userId]
    );

    const attemptNumber = parseInt(countResult.rows[0].count, 10) + 1;

    // Check max attempts
    const assessmentResult = await pool.query(
      `SELECT max_attempts FROM assessments WHERE id = $1`,
      [assessmentId]
    );

    const maxAttempts = assessmentResult.rows[0]?.max_attempts;
    if (maxAttempts && attemptNumber > maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    // Create attempt
    const result = await pool.query(
      `INSERT INTO assessment_attempts (assessment_id, user_id, attempt_number, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING *`,
      [assessmentId, userId, attemptNumber]
    );

    return result.rows[0];
  }

  async getAttempt(attemptId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM student_assessment_results WHERE attempt_id = $1`,
      [attemptId]
    );
    return result.rows[0];
  }

  async listUserAttempts(assessmentId: string, userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM student_assessment_results
      WHERE assessment_id = $1 AND user_id = $2
      ORDER BY attempt_number DESC`,
      [assessmentId, userId]
    );
    return result.rows;
  }

  async listAllAttempts(assessmentId: string, filters: any = {}): Promise<any[]> {
    const { status, limit = 100, offset = 0 } = filters;

    let query = `
      SELECT * FROM student_assessment_results
      WHERE assessment_id = $1
    `;

    const params: any[] = [assessmentId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async submitAttempt(attemptId: string): Promise<any> {
    await pool.query(`SELECT submit_assessment_attempt($1)`, [attemptId]);
    return this.getAttempt(attemptId);
  }

  async updateAttemptStatus(attemptId: string, status: string): Promise<any> {
    const result = await pool.query(
      `UPDATE assessment_attempts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, attemptId]
    );
    return result.rows[0];
  }

  // ========================================
  // ANSWERS
  // ========================================

  async saveAnswer(params: any): Promise<any> {
    const {
      attemptId,
      questionId,
      answerText,
      selectedOptionId,
      selectedOptionIds,
      matchingPairs,
      codeAnswer,
      timeSpentSeconds
    } = params;

    // Get question points
    const questionResult = await pool.query(
      `SELECT points FROM questions WHERE id = $1`,
      [questionId]
    );

    const pointsPossible = questionResult.rows[0]?.points || 0;

    const result = await pool.query(
      `INSERT INTO assessment_answers (
        attempt_id, question_id, answer_text, selected_option_id, selected_option_ids,
        matching_pairs, code_answer, time_spent_seconds, points_possible
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET
        answer_text = $3,
        selected_option_id = $4,
        selected_option_ids = $5,
        matching_pairs = $6,
        code_answer = $7,
        time_spent_seconds = $8,
        answered_at = NOW()
      RETURNING *`,
      [
        attemptId, questionId, answerText, selectedOptionId || null, selectedOptionIds || [],
        matchingPairs ? JSON.stringify(matchingPairs) : null,
        codeAnswer, timeSpentSeconds, pointsPossible
      ]
    );

    return result.rows[0];
  }

  async getAttemptAnswers(attemptId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT aa.*, q.question_text, q.question_type, q.points as question_points
      FROM assessment_answers aa
      JOIN questions q ON aa.question_id = q.id
      WHERE aa.attempt_id = $1
      ORDER BY q.order_index`,
      [attemptId]
    );
    return result.rows;
  }

  // ========================================
  // GRADING
  // ========================================

  async autoGradeAttempt(attemptId: string): Promise<void> {
    await pool.query(`SELECT auto_grade_attempt($1)`, [attemptId]);
  }

  async manualGradeAnswer(answerId: string, pointsEarned: number, feedback: string, gradedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE assessment_answers
      SET points_earned = $1,
          feedback = $2,
          manually_graded = true,
          graded_by = $3,
          graded_at = NOW()
      WHERE id = $4
      RETURNING *`,
      [pointsEarned, feedback, gradedBy, answerId]
    );

    // Recalculate attempt score
    const answer = result.rows[0];
    if (answer) {
      await pool.query(`SELECT calculate_assessment_score($1)`, [answer.attempt_id]);
    }

    return result.rows[0];
  }

  async completeGrading(attemptId: string, gradedBy: string, instructorFeedback?: string): Promise<any> {
    const result = await pool.query(
      `UPDATE assessment_attempts
      SET status = 'graded',
          manually_graded = true,
          graded_by = $1,
          graded_at = NOW(),
          instructor_feedback = $2
      WHERE id = $3
      RETURNING *`,
      [gradedBy, instructorFeedback, attemptId]
    );

    return result.rows[0];
  }

  // ========================================
  // PROCTORING
  // ========================================

  async logProctoringEvent(attemptId: string, eventType: string, eventData: any, severity: string = 'low'): Promise<any> {
    const result = await pool.query(
      `INSERT INTO proctoring_events (attempt_id, event_type, event_data, severity)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [attemptId, eventType, JSON.stringify(eventData), severity]
    );

    // Update attempt counters
    if (eventType === 'tab_switch') {
      await pool.query(
        `UPDATE assessment_attempts SET tab_switches = tab_switches + 1 WHERE id = $1`,
        [attemptId]
      );
    }

    if (severity === 'high') {
      await pool.query(
        `UPDATE assessment_attempts
        SET suspicious_activity_count = suspicious_activity_count + 1,
            flagged_for_review = true
        WHERE id = $1`,
        [attemptId]
      );
    }

    return result.rows[0];
  }

  async getProctoringEvents(attemptId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM proctoring_events WHERE attempt_id = $1 ORDER BY timestamp`,
      [attemptId]
    );
    return result.rows;
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getQuestionAnalytics(questionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM question_analytics WHERE question_id = $1`,
      [questionId]
    );
    return result.rows[0];
  }

  async getAssessmentAnalytics(assessmentId: string): Promise<any> {
    const summary = await this.getAssessmentSummary(assessmentId);

    const questionAnalytics = await pool.query(
      `SELECT * FROM question_analytics WHERE assessment_id = $1`,
      [assessmentId]
    );

    return {
      summary,
      questions: questionAnalytics.rows
    };
  }
}

export const assessmentService = new AssessmentService();
