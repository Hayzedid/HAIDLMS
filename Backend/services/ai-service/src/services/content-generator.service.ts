import OpenAI from 'openai';
import {
  CourseOutline,
  GeneratedQuiz,
  ContentGenerationRequest,
  ContentGenerationResponse,
  QuizGeneration,
  QuizQuestion,
  Lesson,
  CourseModule,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Content Generator Service
 * Creates course outlines, lessons, and quizzes
 */
class ContentGeneratorService {
  private openai: OpenAI;
  private readonly QUALITY_THRESHOLD = parseFloat(process.env.CONTENT_QUALITY_THRESHOLD || '0.7');

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate complete course outline
   */
  async generateCourseOutline(params: {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    targetAudience?: string;
    learningObjectives?: string[];
    prerequisites?: string[];
  }): Promise<CourseOutline> {
    const prompt = `Create a comprehensive course outline for: "${params.topic}"

Level: ${params.level}
${params.duration ? `Duration: ${params.duration}` : ''}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}
${params.learningObjectives?.length ? `Learning Objectives:\n${params.learningObjectives.join('\n')}` : ''}
${params.prerequisites?.length ? `Prerequisites:\n${params.prerequisites.join('\n')}` : ''}

Generate a structured course with:
1. Course title and description
2. Prerequisites list
3. Overall learning objectives
4. Multiple modules (5-8 modules)
5. Each module should have:
   - Title and description
   - 3-6 lessons
   - Each lesson with title, description, content outline, type (video/text/code/quiz), estimated duration

Return as JSON with structure:
{
  "title": string,
  "description": string,
  "level": "${params.level}",
  "duration": string,
  "prerequisites": array,
  "learningObjectives": array,
  "modules": [
    {
      "title": string,
      "description": string,
      "estimatedDuration": string,
      "lessons": [
        {
          "title": string,
          "description": string,
          "content": string (outline),
          "type": "video"|"text"|"code"|"quiz",
          "estimatedDuration": string
        }
      ]
    }
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer creating high-quality educational content.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const outline = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        title: outline.title || `${params.topic} Course`,
        description: outline.description || '',
        level: params.level,
        duration: outline.duration || params.duration || 'Self-paced',
        prerequisites: outline.prerequisites || params.prerequisites || [],
        learningObjectives: outline.learningObjectives || params.learningObjectives || [],
        modules: outline.modules || [],
      };
    } catch (error) {
      console.error('Course outline generation error:', error);
      throw new Error('Failed to generate course outline');
    }
  }

  /**
   * Generate lesson content
   */
  async generateLesson(params: {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    type: 'video' | 'text' | 'code';
    duration?: string;
    learningObjectives?: string[];
  }): Promise<Lesson> {
    const contentPrompts = {
      video: 'Create a detailed video script with timestamps, scenes, and visual descriptions.',
      text: 'Write comprehensive educational text content with examples and explanations.',
      code: 'Create a coding lesson with explanations, code examples, and practice exercises.',
    };

    const prompt = `Create a ${params.level} level lesson on "${params.topic}".

Type: ${params.type}
${params.duration ? `Duration: ${params.duration}` : ''}
${params.learningObjectives?.length ? `Learning Objectives:\n${params.learningObjectives.join('\n')}` : ''}

${contentPrompts[params.type]}

Return as JSON:
{
  "title": string,
  "description": string,
  "content": string (the full lesson content),
  "type": "${params.type}",
  "estimatedDuration": string,
  "resources": [
    {
      "title": string,
      "url": string (optional),
      "type": "documentation"|"tutorial"|"video"|"article",
      "relevance": number (0-1)
    }
  ]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator creating engaging, educational lesson content.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Lesson generation error:', error);
      throw new Error('Failed to generate lesson');
    }
  }

  /**
   * Generate quiz
   */
  async generateQuiz(params: QuizGeneration): Promise<GeneratedQuiz> {
    const prompt = `Create a ${params.difficulty} difficulty quiz on "${params.topic}".

Number of questions: ${params.questionCount}
${params.questionTypes?.length ? `Question types: ${params.questionTypes.map(t => `${t.count} ${t.type}`).join(', ')}` : 'Mix of question types'}

Generate diverse, educational questions that test understanding, not just memorization.

Include:
- Multiple choice questions
- True/false questions
- Code completion questions (where applicable)
- Code output prediction questions (where applicable)
- Short answer questions

Each question should have:
- Clear, unambiguous question text
- Options (if applicable)
- Correct answer
- Detailed explanation of why the answer is correct
- Point value (1-5 based on difficulty)
- Code snippet (if relevant)

Return as JSON:
{
  "title": string,
  "description": string,
  "questions": [
    {
      "id": string (uuid),
      "type": "multiple_choice"|"true_false"|"code_completion"|"code_output"|"short_answer",
      "question": string,
      "options": array (if applicable),
      "correctAnswer": string,
      "explanation": string,
      "points": number,
      "difficulty": "${params.difficulty}",
      "codeSnippet": string (optional),
      "language": string (optional)
    }
  ],
  "totalPoints": number,
  "passingScore": number,
  "timeLimit": number (minutes, optional)
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating educational assessments that test true understanding.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8, // Higher temp for diverse questions
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const quiz = JSON.parse(completion.choices[0].message.content || '{}');

      // Ensure all questions have IDs
      if (quiz.questions) {
        quiz.questions = quiz.questions.map((q: any) => ({
          ...q,
          id: q.id || uuidv4(),
        }));
      }

      return quiz as GeneratedQuiz;
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Generate assignment/project
   */
  async generateAssignment(params: {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration?: string;
    includeStarterCode?: boolean;
    language?: string;
  }): Promise<{
    title: string;
    description: string;
    requirements: string[];
    rubric: Array<{ criterion: string; points: number; description: string }>;
    hints: string[];
    starterCode?: string;
    testCases?: Array<{ input: string; expectedOutput: string }>;
  }> {
    const prompt = `Create a ${params.level} level programming assignment on "${params.topic}".

${params.duration ? `Estimated time: ${params.duration}` : ''}
${params.language ? `Language: ${params.language}` : ''}
${params.includeStarterCode ? 'Include starter code template' : ''}

Generate:
1. Clear assignment title and description
2. Specific requirements (what must be implemented)
3. Grading rubric with criteria and point values
4. Helpful hints (without giving away the solution)
5. ${params.includeStarterCode ? 'Starter code template' : ''}
6. Test cases with inputs and expected outputs

Return as JSON with keys: title, description, requirements, rubric, hints, starterCode, testCases`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are creating challenging but fair programming assignments.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Assignment generation error:', error);
      throw new Error('Failed to generate assignment');
    }
  }

  /**
   * Enhance existing content
   */
  async enhanceContent(params: {
    content: string;
    contentType: 'lesson' | 'quiz' | 'assignment';
    improvementAreas: string[];
  }): Promise<string> {
    const prompt = `Improve this ${params.contentType} content based on these areas:

${params.improvementAreas.join('\n')}

**Current content:**
${params.content}

**Enhanced version:**`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are improving educational content for clarity, engagement, and effectiveness.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      return completion.choices[0].message.content || params.content;
    } catch (error) {
      console.error('Content enhancement error:', error);
      return params.content;
    }
  }

  /**
   * Generate learning path
   */
  async generateLearningPath(params: {
    startTopic: string;
    endGoal: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    timeAvailable?: string;
  }): Promise<{
    path: Array<{ step: number; topic: string; duration: string; resources: string[] }>;
    totalDuration: string;
    milestones: string[];
  }> {
    const prompt = `Create a learning path from "${params.startTopic}" to "${params.endGoal}".

Current level: ${params.currentLevel}
${params.timeAvailable ? `Time available: ${params.timeAvailable}` : ''}

Design a step-by-step path with:
- Sequential topics to learn
- Estimated duration for each step
- Key resources/courses for each step
- Major milestones along the way

Return as JSON with keys: path (array of steps), totalDuration, milestones`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a career advisor creating personalized learning paths.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Learning path generation error:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  /**
   * Validate generated content quality
   */
  async validateContentQuality(content: string, contentType: string): Promise<{
    qualityScore: number;
    issues: string[];
    suggestions: string[];
    passesThreshold: boolean;
  }> {
    const prompt = `Evaluate the quality of this ${contentType} content:

${content}

Rate on:
1. Clarity and coherence
2. Educational value
3. Accuracy
4. Engagement
5. Completeness

Provide:
- Quality score (0-1)
- List of issues found
- Suggestions for improvement

Return as JSON with keys: qualityScore, issues, suggestions`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const validation = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        qualityScore: validation.qualityScore || 0,
        issues: validation.issues || [],
        suggestions: validation.suggestions || [],
        passesThreshold: (validation.qualityScore || 0) >= this.QUALITY_THRESHOLD,
      };
    } catch (error) {
      console.error('Quality validation error:', error);
      return {
        qualityScore: 0,
        issues: ['Unable to validate'],
        suggestions: [],
        passesThreshold: false,
      };
    }
  }
}

export const contentGeneratorService = new ContentGeneratorService();
