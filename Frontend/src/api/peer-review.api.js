import apiClient from './client';
const COURSE_SERVICE_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const peerReviewApi = {
    // Rubric Management
    async createRubric(data) {
        const response = await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/rubrics`, data);
        return response.data.data;
    },
    async getRubric(rubricId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}`);
        return response.data.data;
    },
    async getCourseRubrics(courseId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/courses/${courseId}/rubrics`);
        return response.data.data;
    },
    async createCriterion(rubricId, data) {
        const response = await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/criteria`, data);
        return response.data.data;
    },
    async getRubricCriteria(rubricId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/criteria`);
        return response.data.data;
    },
    // Reviewer Assignments
    async assignReviewers(rubricId, data) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/assign`, data);
    },
    async getReviewerAssignments(reviewerId, status) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/reviewers/${reviewerId}/assignments`, { params: { status } });
        return response.data.data;
    },
    // Review Workflow
    async startReview(reviewId) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/start`);
    },
    async submitCriterionScore(reviewId, data) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/scores`, data);
    },
    async addComment(reviewId, data) {
        const response = await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/comments`, data);
        return response.data.data;
    },
    async getReviewComments(reviewId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/comments`);
        return response.data.data;
    },
    async submitReview(reviewId, data) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/submit`, data);
    },
    async getReview(reviewId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}`);
        return response.data.data;
    },
    async getSubmissionReviews(submissionId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/submissions/${submissionId}/reviews`);
        return response.data.data;
    },
    // Reviewer Performance
    async getReviewerStats(userId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/reviewers/${userId}/stats`);
        return response.data.data;
    },
    async rateReviewHelpfulness(reviewId, isHelpful) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/rate`, {
            isHelpful,
        });
    },
    // Disputes
    async createDispute(reviewId, data) {
        const response = await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/dispute`, data);
        return response.data.data;
    },
    async getDisputes(status) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/disputes`, {
            params: { status },
        });
        return response.data.data;
    },
    async resolveDispute(disputeId, data) {
        await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/disputes/${disputeId}/resolve`, data);
    },
    // Views
    async getPendingReviews(reviewerId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/pending-reviews`, {
            params: { reviewerId },
        });
        return response.data.data;
    },
    async getSubmissionsAwaitingReviews(authorId) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/awaiting-reviews`, {
            params: { authorId },
        });
        return response.data.data;
    },
    async getHighQualityReviewers(limit = 20) {
        const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/high-quality-reviewers`, { params: { limit } });
        return response.data.data;
    },
};
