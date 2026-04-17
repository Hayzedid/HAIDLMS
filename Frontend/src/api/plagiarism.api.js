import axios from 'axios';
const BASE_URL = import.meta.env.VITE_INTEGRITY_SERVICE_URL || 'http://localhost:4008';
/**
 * Submit code for plagiarism check
 */
export async function submitCode(data) {
    const response = await axios.post(`${BASE_URL}/api/plagiarism/submit`, data);
    return response.data.data;
}
/**
 * Get submission by ID
 */
export async function getSubmission(submissionId) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/submissions/${submissionId}`);
    return response.data.data;
}
/**
 * Get user submissions
 */
export async function getUserSubmissions(userId, assessmentId) {
    const params = assessmentId ? { assessmentId } : {};
    const response = await axios.get(`${BASE_URL}/api/plagiarism/submissions/user/${userId}`, {
        params,
    });
    return response.data.data;
}
/**
 * Get flagged submissions (instructor view)
 */
export async function getFlaggedSubmissions(limit = 100) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/flagged`, {
        params: { limit },
    });
    return response.data.data;
}
/**
 * Get plagiarism matches for a submission
 */
export async function getMatches(submissionId) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/matches/${submissionId}`);
    return response.data.data;
}
/**
 * Trigger MOSS check for assessment
 */
export async function triggerMossCheck(assessmentId, problemId) {
    await axios.post(`${BASE_URL}/api/plagiarism/moss/check`, {
        assessmentId,
        problemId,
    });
}
/**
 * Get MOSS report URL
 */
export async function getMossReportUrl(submissionId) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/moss/report/${submissionId}`);
    return response.data.data.reportUrl;
}
/**
 * Update submission review
 */
export async function updateReview(submissionId, data) {
    await axios.patch(`${BASE_URL}/api/plagiarism/submissions/${submissionId}/review`, data);
}
/**
 * Get assessment plagiarism statistics
 */
export async function getAssessmentStats(assessmentId) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/stats/assessment/${assessmentId}`);
    return response.data.data;
}
/**
 * Get course plagiarism statistics
 */
export async function getCourseStats(courseId) {
    const response = await axios.get(`${BASE_URL}/api/plagiarism/stats/course/${courseId}`);
    return response.data.data;
}
export const plagiarismApi = {
    submitCode,
    getSubmission,
    getUserSubmissions,
    getFlaggedSubmissions,
    getMatches,
    triggerMossCheck,
    getMossReportUrl,
    updateReview,
    getAssessmentStats,
    getCourseStats,
};
