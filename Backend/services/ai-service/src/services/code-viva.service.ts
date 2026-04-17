import OpenAI from 'openai';
import { CodeExplanation, VivaRequest, ExplanationAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Code Viva Service
 * Analyzes student code explanations to verify understanding
 */
class CodeVivaService {
  private openai: OpenAI;
  private explanations: Map<string, CodeExplanation> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze code explanation
   */
  async analyzeExplanation(request: VivaRequest): Promise<CodeExplanation> {
    try {
      // If video provided, transcribe it first
      let transcription = request.transcription;
      if (request.videoData && !transcription) {
        transcription = await this.transcribeVideo(request.videoData);
      }

      if (!transcription) {
        throw new Error('No explanation transcription provided');
      }

      // Analyze the explanation
      const analysis = await this.performAnalysis(request.code, request.language, transcription);

      // Calculate overall score
      const score = this.calculateScore(analysis);

      // Determine comprehension level
      const comprehensionLevel = this.determineComprehensionLevel(score);

      // Identify red flags
      const redFlags = this.identifyRedFlags(analysis, transcription);

      const explanation: CodeExplanation = {
        id: uuidv4(),
        userId: request.userId,
        submissionId: request.submissionId,
        code: request.code,
        language: request.language,
        videoUrl: typeof request.videoData === 'string' && request.videoData.startsWith('http') ? request.videoData : undefined,
        transcription,
        analysis,
        score,
        comprehensionLevel,
        redFlags,
        createdAt: new Date(),
      };

      this.explanations.set(explanation.id, explanation);

      return explanation;
    } catch (error) {
      console.error('Code viva analysis error:', error);
      throw error;
    }
  }

  /**
   * Transcribe video explanation (placeholder)
   */
  private async transcribeVideo(videoData: string): Promise<string> {
    // In production, use OpenAI Whisper API or similar service
    // For now, return placeholder

    console.log('Video transcription would happen here');
    // const transcription = await this.openai.audio.transcriptions.create({
    //   file: videoData,
    //   model: "whisper-1",
    // });

    return 'Placeholder transcription - integrate Whisper API in production';
  }

  /**
   * Perform comprehensive analysis
   */
  private async performAnalysis(code: string, language: string, explanation: string): Promise<ExplanationAnalysis> {
    const prompt = `You are evaluating a student's understanding of their own code.

**Code submitted:**
\`\`\`${language}
${code}
\`\`\`

**Student's explanation:**
"${explanation}"

Analyze whether the student truly understands their code. Evaluate:

1. **Logic Understanding**: Can they explain the flow and logic correctly?
2. **Data Structures**: Do they understand what data structures are used and why?
3. **Algorithm**: Can they explain the algorithm/approach?
4. **Edge Cases**: Do they mention or understand edge cases?
5. **Terminology**: Are they using correct programming terminology?

Provide your analysis as JSON:
{
  "understandsLogic": boolean,
  "understandsDataStructures": boolean,
  "understandsAlgorithm": boolean,
  "canExplainEdgeCases": boolean,
  "usesCorrectTerminology": boolean,
  "overallComprehension": number (0-100),
  "strengths": [array of strings - what they explained well],
  "weaknesses": [array of strings - what they struggled with or missed],
  "suggestions": [array of strings - specific areas to study]
}

Red flags that suggest they don't understand the code:
- Vague explanations ("it just works", "I'm not sure")
- Incorrect terminology
- Can't explain why certain code is there
- Confuses concepts
- Contradicts themselves`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Low temperature for consistent evaluation
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        understandsLogic: analysis.understandsLogic || false,
        understandsDataStructures: analysis.understandsDataStructures || false,
        understandsAlgorithm: analysis.understandsAlgorithm || false,
        canExplainEdgeCases: analysis.canExplainEdgeCases || false,
        usesCorrectTerminology: analysis.usesCorrectTerminology || false,
        overallComprehension: analysis.overallComprehension || 0,
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error('Failed to analyze code explanation');
    }
  }

  /**
   * Calculate score from analysis
   */
  private calculateScore(analysis: ExplanationAnalysis): number {
    let score = analysis.overallComprehension;

    // Bonus points for comprehensive understanding
    const criteriaScore = [
      analysis.understandsLogic,
      analysis.understandsDataStructures,
      analysis.understandsAlgorithm,
      analysis.canExplainEdgeCases,
      analysis.usesCorrectTerminology,
    ].filter(Boolean).length;

    score = (score * 0.7) + (criteriaScore * 6); // Max 100

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine comprehension level
   */
  private determineComprehensionLevel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Identify red flags
   */
  private identifyRedFlags(analysis: ExplanationAnalysis, transcription: string): string[] {
    const flags: string[] = [];

    // Check for vague language
    const vagueTerms = ['just works', 'i think', 'maybe', 'not sure', 'kind of', 'basically'];
    for (const term of vagueTerms) {
      if (transcription.toLowerCase().includes(term)) {
        flags.push(`Uses vague language: "${term}"`);
      }
    }

    // Check for lack of understanding
    if (!analysis.understandsLogic) {
      flags.push('Cannot explain code logic');
    }

    if (!analysis.understandsAlgorithm) {
      flags.push('Does not understand the algorithm');
    }

    if (!analysis.usesCorrectTerminology) {
      flags.push('Incorrect or missing technical terminology');
    }

    // Check for contradictions
    if (transcription.toLowerCase().includes('but actually') || transcription.toLowerCase().includes('no wait')) {
      flags.push('Contradicts themselves during explanation');
    }

    // Very short explanation
    if (transcription.split(' ').length < 50) {
      flags.push('Explanation too brief - lacks detail');
    }

    // Overall low comprehension
    if (analysis.overallComprehension < 50) {
      flags.push('Poor overall comprehension of code');
    }

    return flags;
  }

  /**
   * Get explanation
   */
  getExplanation(explanationId: string): CodeExplanation | undefined {
    return this.explanations.get(explanationId);
  }

  /**
   * Get user explanations
   */
  getUserExplanations(userId: string): CodeExplanation[] {
    return Array.from(this.explanations.values()).filter((exp) => exp.userId === userId);
  }

  /**
   * Get flagged explanations
   */
  getFlaggedExplanations(): CodeExplanation[] {
    return Array.from(this.explanations.values()).filter(
      (exp) => exp.comprehensionLevel === 'poor' || exp.redFlags.length > 2
    );
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovementPlan(explanationId: string): Promise<{
    areasToStudy: string[];
    practiceProblems: string[];
    resources: string[];
  }> {
    const explanation = this.explanations.get(explanationId);

    if (!explanation) {
      throw new Error('Explanation not found');
    }

    const prompt = `A student showed these weaknesses in explaining their ${explanation.language} code:

${explanation.analysis.weaknesses.join('\n')}

Red flags identified:
${explanation.redFlags.join('\n')}

Generate a personalized improvement plan:
1. Specific topics/concepts to study (array)
2. Practice problems they should work on (array)
3. Learning resources (array)

Return as JSON with keys: areasToStudy, practiceProblems, resources`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Improvement plan generation error:', error);
      return {
        areasToStudy: explanation.analysis.suggestions,
        practiceProblems: [],
        resources: [],
      };
    }
  }

  /**
   * Compare code with explanation
   */
  async detectDiscrepancies(code: string, language: string, explanation: string): Promise<{
    codeFeatures: string[];
    explainedFeatures: string[];
    missingExplanations: string[];
    unexplainedCode: string[];
  }> {
    const prompt = `Compare this code with the student's explanation to find discrepancies:

**Code:**
\`\`\`${language}
${code}
\`\`\`

**Explanation:**
"${explanation}"

Identify:
1. Key features/concepts present in the code
2. What features the student explained
3. What they missed explaining
4. Code segments they didn't mention at all

Return as JSON with keys: codeFeatures, explainedFeatures, missingExplanations, unexplainedCode`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Discrepancy detection error:', error);
      return {
        codeFeatures: [],
        explainedFeatures: [],
        missingExplanations: [],
        unexplainedCode: [],
      };
    }
  }
}

export const codeVivaService = new CodeVivaService();
