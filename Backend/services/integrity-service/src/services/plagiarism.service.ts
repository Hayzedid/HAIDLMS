import { pool } from '../db/pool';
import { CodeSubmission, SubmitCodeRequest, CheckPlagiarismRequest, PlagiarismStatus } from '../types';
import stringSimilarity from 'string-similarity';
import { diff } from 'diff';

/**
 * Plagiarism Detection Service
 * Detects code plagiarism using multiple algorithms
 */
class PlagiarismService {
  private readonly SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.75');

  /**
   * Submit code for plagiarism check
   */
  async submitCode(params: SubmitCodeRequest): Promise<CodeSubmission> {
    const result = await pool.query(
      `INSERT INTO code_submissions (
        user_id, assessment_id, problem_id, language, code, file_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [params.userId, params.assessmentId, params.problemId, params.language, params.code, params.fileName]
    );

    const submission = this.mapSubmission(result.rows[0]);

    // Trigger async plagiarism check
    this.checkPlagiarism({ submissionId: submission.id, checkExternal: true }).catch((err) =>
      console.error('Plagiarism check failed:', err)
    );

    return submission;
  }

  /**
   * Check plagiarism for a submission
   */
  async checkPlagiarism(params: CheckPlagiarismRequest): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get submission
      const submissionResult = await client.query(
        'SELECT * FROM code_submissions WHERE id = $1',
        [params.submissionId]
      );

      if (submissionResult.rows.length === 0) {
        throw new Error('Submission not found');
      }

      const submission = submissionResult.rows[0];

      // Find similar submissions in same assessment
      const similarSubmissions = await this.findSimilarSubmissions(
        client,
        submission.id,
        submission.assessment_id,
        submission.problem_id,
        submission.code,
        submission.language
      );

      // Calculate overall similarity score
      const maxSimilarity =
        similarSubmissions.length > 0 ? Math.max(...similarSubmissions.map((s) => s.similarityScore)) : 0;

      // Determine plagiarism status
      let plagiarismStatus: PlagiarismStatus = 'clean';
      if (maxSimilarity >= 0.95) {
        plagiarismStatus = 'plagiarized';
      } else if (maxSimilarity >= this.SIMILARITY_THRESHOLD) {
        plagiarismStatus = 'suspicious';
      }

      // Update submission
      await client.query(
        `UPDATE code_submissions
         SET plagiarism_status = $1,
             similarity_score = $2,
             matched_submissions = $3,
             is_flagged = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [
          plagiarismStatus,
          maxSimilarity,
          JSON.stringify(similarSubmissions),
          plagiarismStatus === 'plagiarized',
          params.submissionId,
        ]
      );

      // Log violation if plagiarized
      if (plagiarismStatus === 'plagiarized') {
        await client.query(
          `INSERT INTO violation_logs (
            user_id, violation_type, severity, description, score_penalty
          )
          VALUES ($1, 'code_plagiarism', 'critical', $2, 15.0)`,
          [submission.user_id, `Code plagiarism detected with ${(maxSimilarity * 100).toFixed(0)}% similarity`]
        );

        // Update integrity score
        await client.query('SELECT update_integrity_score($1, $2, $3)', [
          submission.user_id,
          'code_plagiarism',
          'critical',
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find similar submissions
   */
  private async findSimilarSubmissions(
    client: any,
    currentSubmissionId: string,
    assessmentId: string,
    problemId: string,
    code: string,
    language: string
  ): Promise<any[]> {
    // Get all other submissions for the same problem
    const result = await client.query(
      `SELECT * FROM code_submissions
       WHERE assessment_id = $1
       AND problem_id = $2
       AND language = $3
       AND id != $4
       AND plagiarism_status != 'plagiarized'`,
      [assessmentId, problemId, language, currentSubmissionId]
    );

    const otherSubmissions = result.rows;
    const matches: any[] = [];

    // Normalize current code
    const normalizedCurrentCode = this.normalizeCode(code);

    for (const otherSubmission of otherSubmissions) {
      const normalizedOtherCode = this.normalizeCode(otherSubmission.code);

      // Calculate similarity
      const similarityScore = this.calculateSimilarity(normalizedCurrentCode, normalizedOtherCode);

      if (similarityScore >= this.SIMILARITY_THRESHOLD) {
        // Count matching lines
        const { matchingLines, totalLines } = this.countMatchingLines(code, otherSubmission.code);

        // Save match
        await client.query(
          `INSERT INTO plagiarism_matches (
            submission1_id, submission2_id, similarity_score,
            matching_lines, total_lines, algorithm, match_details
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            currentSubmissionId,
            otherSubmission.id,
            similarityScore,
            matchingLines,
            totalLines,
            'string_similarity',
            JSON.stringify({
              method: 'levenshtein',
              normalized: true,
            }),
          ]
        );

        matches.push({
          submissionId: otherSubmission.id,
          userId: otherSubmission.user_id,
          similarityScore,
          matchingLines,
          totalLines,
        });
      }
    }

    return matches;
  }

  /**
   * Normalize code for comparison
   */
  private normalizeCode(code: string): string {
    return (
      code
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '')
        .replace(/#.*/g, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Convert to lowercase
        .toLowerCase()
        // Remove common variable prefixes
        .replace(/\b(my|the|temp|tmp)\w+/g, 'var')
        .trim()
    );
  }

  /**
   * Calculate code similarity
   */
  private calculateSimilarity(code1: string, code2: string): number {
    // Use Dice coefficient from string-similarity
    return stringSimilarity.compareTwoStrings(code1, code2);
  }

  /**
   * Count matching lines
   */
  private countMatchingLines(code1: string, code2: string): { matchingLines: number; totalLines: number } {
    const lines1 = code1.split('\n').filter((line) => line.trim().length > 0);
    const lines2 = code2.split('\n').filter((line) => line.trim().length > 0);

    const normalizedLines1 = lines1.map((line) => this.normalizeCode(line));
    const normalizedLines2 = lines2.map((line) => this.normalizeCode(line));

    let matchingLines = 0;

    for (const line1 of normalizedLines1) {
      if (normalizedLines2.includes(line1)) {
        matchingLines++;
      }
    }

    return {
      matchingLines,
      totalLines: Math.max(lines1.length, lines2.length),
    };
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId: string): Promise<CodeSubmission | null> {
    const result = await pool.query('SELECT * FROM code_submissions WHERE id = $1', [submissionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSubmission(result.rows[0]);
  }

  /**
   * Get user submissions
   */
  async getUserSubmissions(userId: string, assessmentId?: string): Promise<CodeSubmission[]> {
    let query = 'SELECT * FROM code_submissions WHERE user_id = $1';
    const params: any[] = [userId];

    if (assessmentId) {
      query += ' AND assessment_id = $2';
      params.push(assessmentId);
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await pool.query(query, params);
    return result.rows.map(this.mapSubmission);
  }

  /**
   * Get flagged submissions
   */
  async getFlaggedSubmissions(limit = 100): Promise<CodeSubmission[]> {
    const result = await pool.query(
      `SELECT * FROM code_submissions
       WHERE is_flagged = true
       ORDER BY similarity_score DESC, submitted_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapSubmission);
  }

  /**
   * Get plagiarism matches for submission
   */
  async getMatches(submissionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT
         pm.*,
         s1.user_id as user1_id,
         s2.user_id as user2_id,
         s1.code as code1,
         s2.code as code2
       FROM plagiarism_matches pm
       JOIN code_submissions s1 ON s1.id = pm.submission1_id
       JOIN code_submissions s2 ON s2.id = pm.submission2_id
       WHERE pm.submission1_id = $1 OR pm.submission2_id = $1
       ORDER BY pm.similarity_score DESC`,
      [submissionId]
    );

    return result.rows;
  }

  /**
   * Analyze code pattern (for building user signature)
   */
  async analyzeCodePattern(userId: string, language: string, code: string): Promise<void> {
    // Extract patterns
    const patterns = this.extractCodePatterns(code);

    // Check if pattern exists
    const existingResult = await pool.query(
      'SELECT * FROM code_patterns WHERE user_id = $1 AND language = $2',
      [userId, language]
    );

    if (existingResult.rows.length > 0) {
      // Update existing pattern
      const existing = existingResult.rows[0];
      const merged = this.mergePatterns(existing.pattern_signature, patterns);

      await pool.query(
        `UPDATE code_patterns
         SET pattern_signature = $1,
             samples_analyzed = samples_analyzed + 1,
             last_updated = NOW()
         WHERE user_id = $2 AND language = $3`,
        [JSON.stringify(merged), userId, language]
      );
    } else {
      // Create new pattern
      await pool.query(
        `INSERT INTO code_patterns (
          user_id, language, pattern_signature, common_variable_names,
          common_function_names, indentation_style, avg_line_length
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          language,
          JSON.stringify(patterns),
          JSON.stringify(patterns.variableNames),
          JSON.stringify(patterns.functionNames),
          patterns.indentationStyle,
          patterns.avgLineLength,
        ]
      );
    }
  }

  /**
   * Extract code patterns
   */
  private extractCodePatterns(code: string): any {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

    // Variable names
    const variablePattern = /\b(const|let|var|int|string|float|double)\s+(\w+)/g;
    const variableNames: string[] = [];
    let match;
    while ((match = variablePattern.exec(code)) !== null) {
      variableNames.push(match[2]);
    }

    // Function names
    const functionPattern = /\bfunction\s+(\w+)|def\s+(\w+)|func\s+(\w+)/g;
    const functionNames: string[] = [];
    while ((match = functionPattern.exec(code)) !== null) {
      functionNames.push(match[1] || match[2] || match[3]);
    }

    // Indentation style
    const spacesCount = code.match(/\n {2,4}\S/g)?.length || 0;
    const tabsCount = code.match(/\n\t+\S/g)?.length || 0;
    const indentationStyle = spacesCount > tabsCount ? 'spaces' : 'tabs';

    // Average line length
    const avgLineLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length;

    return {
      variableNames: [...new Set(variableNames)].slice(0, 20),
      functionNames: [...new Set(functionNames)].slice(0, 20),
      indentationStyle,
      avgLineLength: avgLineLength.toFixed(2),
      lineCount: lines.length,
      commentFrequency: (code.match(/\/\/|\/\*|#/g) || []).length / lines.length,
    };
  }

  /**
   * Merge patterns
   */
  private mergePatterns(existing: any, newPattern: any): any {
    return {
      variableNames: [...new Set([...existing.variableNames, ...newPattern.variableNames])].slice(0, 20),
      functionNames: [...new Set([...existing.functionNames, ...newPattern.functionNames])].slice(0, 20),
      indentationStyle: newPattern.indentationStyle,
      avgLineLength: ((parseFloat(existing.avgLineLength) + parseFloat(newPattern.avgLineLength)) / 2).toFixed(2),
      lineCount: newPattern.lineCount,
      commentFrequency: newPattern.commentFrequency,
    };
  }

  /**
   * Update submission review
   */
  async updateReview(
    submissionId: string,
    params: {
      reviewedBy: string;
      reviewNotes: string;
      plagiarismStatus?: PlagiarismStatus;
    }
  ): Promise<void> {
    let query = `UPDATE code_submissions
                 SET reviewed_by = $1,
                     reviewed_at = NOW(),
                     review_notes = $2`;
    const values: any[] = [params.reviewedBy, params.reviewNotes];

    if (params.plagiarismStatus) {
      query += ', plagiarism_status = $3';
      values.push(params.plagiarismStatus);
    }

    query += ' WHERE id = $' + (values.length + 1);
    values.push(submissionId);

    await pool.query(query, values);
  }

  /**
   * Map database row to CodeSubmission
   */
  private mapSubmission(row: any): CodeSubmission {
    return {
      id: row.id,
      userId: row.user_id,
      assessmentId: row.assessment_id,
      problemId: row.problem_id,
      language: row.language,
      code: row.code,
      fileName: row.file_name,
      submittedAt: row.submitted_at,
      plagiarismStatus: row.plagiarism_status,
      similarityScore: row.similarity_score ? parseFloat(row.similarity_score) : undefined,
      matchedSubmissions: row.matched_submissions,
      mossReportUrl: row.moss_report_url,
      aiAnalysis: row.ai_analysis,
      isFlagged: row.is_flagged,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
    };
  }
}

export const plagiarismService = new PlagiarismService();
