import apiClient from "./client";
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:4005";
export const aiTutorApi = {
    // Chat Session Management
    async startChatSession(data) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/sessions/start`, data);
        return response.data.data;
    },
    async sendMessage(sessionId, content) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}/messages`, { content });
        return response.data.data;
    },
    async endChatSession(sessionId) {
        await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}/end`);
    },
    async getChatSession(sessionId) {
        const response = await apiClient.get(`${AI_SERVICE_URL}/api/ai-tutor/sessions/${sessionId}`);
        return response.data.data;
    },
    async getUserSessions(status) {
        const response = await apiClient.get(`${AI_SERVICE_URL}/api/ai-tutor/sessions`, {
            params: { status },
        });
        return response.data.data;
    },
    // Error Explanation
    async explainError(data) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/error-explanation`, data);
        return response.data.data;
    },
    // Extension Challenges
    async generateChallenge(data) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/challenges/generate`, data);
        return response.data.data;
    },
    async acceptChallenge(challengeId) {
        await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/challenges/${challengeId}/accept`);
    },
    async submitChallengeSolution(challengeId, solution) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/challenges/${challengeId}/submit`, { solution });
        return response.data.data;
    },
    // Concept Checks
    async generateConceptCheck(sessionId, topic) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/concept-check/generate`, { sessionId, topic });
        return response.data.data;
    },
    async answerConceptCheck(conceptCheckId, answer) {
        const response = await apiClient.post(`${AI_SERVICE_URL}/api/ai-tutor/concept-check/${conceptCheckId}/answer`, { answer });
        return response.data.data;
    },
    // Learning Patterns & Analytics
    async getLearningPatterns() {
        const response = await apiClient.get(`${AI_SERVICE_URL}/api/ai-tutor/learning-patterns`);
        return response.data.data;
    },
    async getUsageStats() {
        const response = await apiClient.get(`${AI_SERVICE_URL}/api/ai-tutor/usage-stats`);
        return response.data.data;
    },
    async getSafetyLogs() {
        const response = await apiClient.get(`${AI_SERVICE_URL}/api/ai-tutor/safety-logs`);
        return response.data.data;
    },
};
