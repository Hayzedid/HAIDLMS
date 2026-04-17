import apiClient from './client';
const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:4006';
export const learningHealthApi = {
    // Health Score
    async getUserHealthScore(userId, courseId) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/health-score`);
        return response.data.data;
    },
    async getComponentBreakdown(userId, courseId) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/component-breakdown`);
        return response.data.data;
    },
    // At-Risk Learners
    async getAtRiskLearners(courseId, riskLevel) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/at-risk-learners`, { params: { riskLevel } });
        return response.data.data;
    },
    // Instructor Nudges
    async generateInstructorNudge(userId, courseId) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/instructor-nudge`);
        return response.data.data;
    },
    async getInterventionRecommendations(courseId) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/interventions`);
        return response.data.data;
    },
    // Dashboard Summary
    async getDashboardSummary(courseId) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/dashboard-summary`);
        return response.data.data;
    },
    // Health Score Updates
    async updateHealthScore(userId, courseId) {
        await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/update-health-score`);
    },
    async batchUpdateHealthScores(courseId) {
        const response = await apiClient.post(`${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/batch-update`);
        return response.data.data;
    },
    // Trends
    async getHealthScoreTrends(userId, courseId, days = 30) {
        const response = await apiClient.get(`${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/trends`, { params: { days } });
        return response.data.data;
    },
};
