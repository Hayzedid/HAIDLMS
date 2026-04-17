import apiClient from "./client";
export const adaptiveLearningApi = {
    // Health check
    healthCheck: () => apiClient.get("/adaptive/health"),
    // Knowledge Concepts
    createConcept: (data) => apiClient.post("/adaptive/concepts", data),
    getConcepts: () => apiClient.get("/adaptive/concepts"),
    getConceptById: (conceptId) => apiClient.get(`/adaptive/concepts/${conceptId}`),
    linkConcepts: (prerequisiteId, dependentId) => apiClient.post("/adaptive/concepts/link", {
        prerequisite_id: prerequisiteId,
        dependent_id: dependentId,
    }),
    getConceptPrerequisites: (conceptId) => apiClient.get(`/adaptive/concepts/${conceptId}/prerequisites`),
    // Learner Profile
    createOrUpdateLearnerProfile: (data) => apiClient.post("/adaptive/profile", data),
    getLearnerProfile: (userId) => apiClient.get(`/adaptive/profile/${userId}`),
    // Concept Mastery
    updateMastery: (data) => apiClient.post("/adaptive/mastery", data),
    getMastery: (userId) => apiClient.get(`/adaptive/mastery/${userId}`),
    // Learning Paths
    generatePath: (data) => apiClient.post("/adaptive/paths/generate", data),
    getLearningPaths: (userId, status) => apiClient.get(`/adaptive/paths/${userId}`, { params: { status } }),
    // Recommendations
    getRecommendations: (userId, limit) => apiClient.get(`/adaptive/recommendations/${userId}`, { params: { limit } }),
    // Spaced Repetition
    getReviewConcepts: (userId) => apiClient.get(`/adaptive/review/${userId}`),
    // Adaptive Pathways (high-level overview)
    getAdaptivePathways: (userId) => apiClient.get(`/adaptive/pathways${userId ? `/${userId}` : ""}`),
};
