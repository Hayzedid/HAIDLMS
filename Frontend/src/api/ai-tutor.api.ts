import apiClient from "./client";

export interface ChatSession {
  id: string;
  userId: string;
  contextType: string;
  contextId?: string;
  studentCodeContext?: string;
  isActive: boolean;
  messageCount: number;
  sessionSummary?: string;
  learningObjectivesMet?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "student" | "tutor";
  content: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt: string;
}

export interface ErrorExplanation {
  id: string;
  userId: string;
  errorMessage: string;
  codeContext: string;
  language: string;
  explanation: string;
  errorType?: string;
  guidingQuestions: string[];
  hints: string[];
  resourceLinks?: string[];
  createdAt: string;
}

export interface ExtensionChallenge {
  id: string;
  userId: string;
  baseCode: string;
  language: string;
  challengePrompt: string;
  learningObjectives: string[];
  difficulty: string;
  hints?: string[];
  isCompleted: boolean;
  createdAt: string;
}

export interface ConceptCheck {
  id: string;
  sessionId: string;
  question: string;
  correctAnswer: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  feedback?: string;
  createdAt: string;
}

export interface LearningPatterns {
  userId: string;
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  errorTypes: Record<string, number>;
  conceptsStruggling: string[];
  independenceScore: number;
  lastSessionAt: string;
  createdAt: string;
}

export interface UsageStats {
  userId: string;
  totalSessions: number;
  totalMessages: number;
  totalTokensUsed: number;
  dailyMessageCount: number;
  lastResetAt: string;
}

const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:4005";

export const aiTutorApi = {
  // Chat Session Management
  async startChatSession(data: {
    contextType: "lesson" | "assessment" | "ide" | "general";
    contextId?: string;
    studentCodeContext?: string;
  }): Promise<ChatSession> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/sessions/start`,
      data,
    );
    return response.data.data;
  },

  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}/messages`,
      { content },
    );
    return response.data.data;
  },

  async endChatSession(sessionId: string): Promise<void> {
    await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}/end`,
    );
  },

  async getChatSession(sessionId: string): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  }> {
    const response = await apiClient.get(
      `${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}`,
    );
    return response.data.data;
  },

  async getUserSessions(
    status?: "active" | "completed",
  ): Promise<ChatSession[]> {
    const response = await apiClient.get(
      `${AI_SERVICE_URL}/api/ai-tutor/sessions`,
      {
        params: { status },
      },
    );
    return response.data.data;
  },

  // Error Explanation
  async explainError(data: {
    errorMessage: string;
    codeContext: string;
    language: string;
    stackTrace?: string;
  }): Promise<ErrorExplanation> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/error-explanation`,
      data,
    );
    return response.data.data;
  },

  // Extension Challenges
  async generateChallenge(data: {
    baseCode: string;
    language: string;
    difficulty?: "easy" | "medium" | "hard";
  }): Promise<ExtensionChallenge> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/challenges/generate`,
      data,
    );
    return response.data.data;
  },

  async acceptChallenge(challengeId: string): Promise<void> {
    await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/challenges/${challengeId}/accept`,
    );
  },

  async submitChallengeSolution(
    challengeId: string,
    solution: string,
  ): Promise<{ feedback: string; passed: boolean }> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/challenges/${challengeId}/submit`,
      { solution },
    );
    return response.data.data;
  },

  // Concept Checks
  async generateConceptCheck(
    sessionId: string,
    topic: string,
  ): Promise<ConceptCheck> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/concept-check/generate`,
      { sessionId, topic },
    );
    return response.data.data;
  },

  async answerConceptCheck(
    conceptCheckId: string,
    answer: string,
  ): Promise<{ isCorrect: boolean; feedback: string }> {
    const response = await apiClient.post(
      `${AI_SERVICE_URL}/api/ai-tutor/concept-check/${conceptCheckId}/answer`,
      { answer },
    );
    return response.data.data;
  },

  // Learning Patterns & Analytics
  async getLearningPatterns(): Promise<LearningPatterns> {
    const response = await apiClient.get(
      `${AI_SERVICE_URL}/api/ai-tutor/learning-patterns`,
    );
    return response.data.data;
  },

  async getUsageStats(): Promise<UsageStats> {
    const response = await apiClient.get(
      `${AI_SERVICE_URL}/api/ai-tutor/usage-stats`,
    );
    return response.data.data;
  },

  async getSafetyLogs(): Promise<any[]> {
    const response = await apiClient.get(
      `${AI_SERVICE_URL}/api/ai-tutor/safety-logs`,
    );
    return response.data.data;
  },
};
