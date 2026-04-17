import apiClient from "./client";

export interface KnowledgeConcept {
  id: string;
  name: string;
  description?: string;
  cognitive_level:
    | "remember"
    | "understand"
    | "apply"
    | "analyze"
    | "evaluate"
    | "create";
  created_at: string;
  prerequisite_count?: number;
  dependent_count?: number;
}

export interface ConceptPrerequisite {
  prerequisite_id: string;
  dependent_id: string;
  prerequisite_name?: string;
  dependent_name?: string;
}

export interface LearnerProfile {
  id: string;
  user_id: string;
  learning_style?: string;
  created_at: string;
  updated_at: string;
  mastered_concepts?: number;
  learning_concepts?: number;
  total_practice_sessions?: number;
}

export interface ConceptMastery {
  id: string;
  user_id: string;
  concept_id: string;
  concept_name?: string;
  current_level: number;
  practice_count: number;
  last_practiced_at?: string;
  mastery_status: "mastered" | "proficient" | "learning" | "novice";
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  target_concept_id: string;
  target_concept_name?: string;
  status: "active" | "completed" | "abandoned";
  progress_percentage: number;
  step_count?: number;
  completed_steps?: number;
  created_at: string;
}

export interface ConceptReview {
  concept_id: string;
  concept_name: string;
  current_level: number;
  last_practiced_at: string;
  days_since_practice: number;
  priority: "urgent" | "high" | "medium" | "low";
}

export const adaptiveLearningApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{ healthy: boolean; metrics: any }>("/adaptive/health"),

  // Knowledge Concepts
  createConcept: (data: {
    name: string;
    description?: string;
    cognitive_level: string;
  }) =>
    apiClient.post<{ id: string; message: string }>("/adaptive/concepts", data),

  getConcepts: () =>
    apiClient.get<{ concepts: KnowledgeConcept[]; count: number }>(
      "/adaptive/concepts",
    ),

  getConceptById: (conceptId: string) =>
    apiClient.get<KnowledgeConcept>(`/adaptive/concepts/${conceptId}`),

  linkConcepts: (prerequisiteId: string, dependentId: string) =>
    apiClient.post<{ id: string; message: string }>("/adaptive/concepts/link", {
      prerequisite_id: prerequisiteId,
      dependent_id: dependentId,
    }),

  getConceptPrerequisites: (conceptId: string) =>
    apiClient.get<{
      concept_id: string;
      prerequisites: ConceptPrerequisite[];
      count: number;
    }>(`/adaptive/concepts/${conceptId}/prerequisites`),

  // Learner Profile
  createOrUpdateLearnerProfile: (data: {
    user_id: string;
    learning_style?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>("/adaptive/profile", data),

  getLearnerProfile: (userId: string) =>
    apiClient.get<LearnerProfile>(`/adaptive/profile/${userId}`),

  // Concept Mastery
  updateMastery: (data: {
    user_id: string;
    concept_id: string;
    performance_score: number;
  }) =>
    apiClient.post<{
      message: string;
      current_level: number;
      mastery_status: string;
    }>("/adaptive/mastery", data),

  getMastery: (userId: string) =>
    apiClient.get<{
      user_id: string;
      mastery: ConceptMastery[];
      count: number;
    }>(`/adaptive/mastery/${userId}`),

  // Learning Paths
  generatePath: (data: { user_id: string; target_concept_id: string }) =>
    apiClient.post<{ id: string; message: string }>(
      "/adaptive/paths/generate",
      data,
    ),

  getLearningPaths: (userId: string, status?: string) =>
    apiClient.get<{ user_id: string; paths: LearningPath[]; count: number }>(
      `/adaptive/paths/${userId}`,
      { params: { status } },
    ),

  // Recommendations
  getRecommendations: (userId: string, limit?: number) =>
    apiClient.get<{ user_id: string; recommendations: any[]; count: number }>(
      `/adaptive/recommendations/${userId}`,
      { params: { limit } },
    ),

  // Spaced Repetition
  getReviewConcepts: (userId: string) =>
    apiClient.get<{
      user_id: string;
      review_concepts: ConceptReview[];
      count: number;
    }>(`/adaptive/review/${userId}`),

  // Adaptive Pathways (high-level overview)
  getAdaptivePathways: (userId?: string) =>
    apiClient.get<{
      pathways?: any[];
      activePathways?: number;
      avgProgress?: number;
      learnngStreak?: number;
      completionRate?: number;
      analyticsData?: any[];
    }>(`/adaptive/pathways${userId ? `/${userId}` : ""}`),
};
