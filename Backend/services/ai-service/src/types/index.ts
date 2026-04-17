export type TutorMode = 'socratic' | 'direct' | 'hints' | 'review';

export type MessageRole = 'system' | 'user' | 'assistant';

export type ContentType = 'course' | 'lesson' | 'quiz' | 'assignment';

export interface TutorMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TutorSession {
  id: string;
  userId: string;
  courseId?: string;
  problemId?: string;
  mode: TutorMode;
  context: string;
  messages: TutorMessage[];
  codeSnapshot?: string;
  language?: string;
  startedAt: Date;
  endedAt?: Date;
  hintDepth: number;
  isActive: boolean;
}

export interface TutorRequest {
  sessionId?: string;
  userId: string;
  message: string;
  code?: string;
  language?: string;
  problemContext?: string;
  courseId?: string;
  problemId?: string;
  mode?: TutorMode;
}

export interface TutorResponse {
  sessionId: string;
  message: string;
  hints?: string[];
  codeReview?: CodeReview;
  resources?: Resource[];
  shouldEndSession: boolean;
}

export interface CodeReview {
  overall: string;
  strengths: string[];
  improvements: string[];
  bugs?: Bug[];
  performanceIssues?: string[];
  securityIssues?: string[];
  bestPractices?: string[];
}

export interface Bug {
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
}

export interface Resource {
  title: string;
  url?: string;
  type: 'documentation' | 'tutorial' | 'video' | 'article';
  relevance: number;
}

export interface CodeExplanation {
  id: string;
  userId: string;
  submissionId: string;
  code: string;
  language: string;
  videoUrl?: string;
  transcription?: string;
  analysis: ExplanationAnalysis;
  score: number;
  comprehensionLevel: 'poor' | 'fair' | 'good' | 'excellent';
  redFlags: string[];
  createdAt: Date;
}

export interface ExplanationAnalysis {
  understandsLogic: boolean;
  understandsDataStructures: boolean;
  understandsAlgorithm: boolean;
  canExplainEdgeCases: boolean;
  usesCorrectTerminology: boolean;
  overallComprehension: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface VivaRequest {
  userId: string;
  submissionId: string;
  code: string;
  language: string;
  videoData?: string; // base64 or URL
  transcription?: string;
}

export interface CourseOutline {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  prerequisites: string[];
  learningObjectives: string[];
  modules: CourseModule[];
}

export interface CourseModule {
  title: string;
  description: string;
  lessons: Lesson[];
  estimatedDuration: string;
}

export interface Lesson {
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text' | 'code' | 'quiz';
  estimatedDuration: string;
  resources?: Resource[];
}

export interface QuizGeneration {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes?: QuestionType[];
}

export interface QuestionType {
  type: 'multiple_choice' | 'true_false' | 'code_completion' | 'code_output' | 'short_answer';
  count: number;
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalPoints: number;
  passingScore: number;
  timeLimit?: number;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType['type'];
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  codeSnippet?: string;
  language?: string;
}

export interface ContentGenerationRequest {
  type: ContentType;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: string;
  duration?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  includeQuiz?: boolean;
  includeAssignments?: boolean;
}

export interface ContentGenerationResponse {
  id: string;
  type: ContentType;
  content: any; // CourseOutline | Lesson | GeneratedQuiz
  quality: number;
  generatedAt: Date;
  metadata: Record<string, any>;
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysisType: 'review' | 'explain' | 'improve' | 'debug';
  context?: string;
}

export interface CodeAnalysisResponse {
  analysis: string;
  codeReview?: CodeReview;
  improvements?: CodeImprovement[];
  explanation?: string;
  debugSuggestions?: string[];
}

export interface CodeImprovement {
  original: string;
  improved: string;
  reason: string;
  category: 'performance' | 'readability' | 'security' | 'best_practice';
}
