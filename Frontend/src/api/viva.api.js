import axios from "axios";
const BASE_URL = import.meta.env.VITE_INTEGRITY_SERVICE_URL || "http://localhost:4008";
/**
 * Create viva request for specific student
 */
export async function createVivaRequest(data) {
    const response = await axios.post(`${BASE_URL}/api/viva/requests`, data);
    return response.data.data;
}
/**
 * Random selection of students for viva
 */
export async function selectRandomStudents(assessmentId, problemId, percentage, instructions, deadlineHours = 48) {
    const response = await axios.post(`${BASE_URL}/api/viva/select/random`, {
        assessmentId,
        problemId,
        percentage,
        instructions,
        deadlineHours,
    });
    return response.data.data;
}
/**
 * Select flagged submissions for viva
 */
export async function selectFlaggedStudents(assessmentId, problemId, similarityThreshold = 0.75, instructions, deadlineHours = 48) {
    const response = await axios.post(`${BASE_URL}/api/viva/select/flagged`, {
        assessmentId,
        problemId,
        similarityThreshold,
        instructions,
        deadlineHours,
    });
    return response.data.data;
}
/**
 * Submit video explanation
 */
export async function submitVideoExplanation(vivaRequestId, videoUrl, videoDurationSeconds, studentNotes) {
    const response = await axios.post(`${BASE_URL}/api/viva/requests/${vivaRequestId}/submit`, {
        videoUrl,
        videoDurationSeconds,
        studentNotes,
    });
    return response.data.data;
}
/**
 * Review video explanation
 */
export async function reviewVideoExplanation(vivaRequestId, data) {
    const response = await axios.post(`${BASE_URL}/api/viva/requests/${vivaRequestId}/review`, data);
    return response.data.data;
}
/**
 * Get viva request by ID
 */
export async function getVivaRequest(id) {
    const response = await axios.get(`${BASE_URL}/api/viva/requests/${id}`);
    return response.data.data;
}
/**
 * Get pending viva requests for student
 */
export async function getStudentPendingRequests() {
    const response = await axios.get(`${BASE_URL}/api/viva/student/pending`);
    return response.data.data;
}
/**
 * Get overdue viva requests for student
 */
export async function getStudentOverdueRequests() {
    const response = await axios.get(`${BASE_URL}/api/viva/student/overdue`);
    return response.data.data;
}
/**
 * Get vivas needing review (instructor view)
 */
export async function getInstructorPendingReviews(limit = 50) {
    const response = await axios.get(`${BASE_URL}/api/viva/instructor/pending-review`, {
        params: { limit },
    });
    return response.data.data;
}
/**
 * Get all viva requests for assessment
 */
export async function getAssessmentVivaRequests(assessmentId, status) {
    const response = await axios.get(`${BASE_URL}/api/viva/assessment/${assessmentId}`, {
        params: status ? { status } : {},
    });
    return response.data.data;
}
/**
 * Get viva statistics for assessment
 */
export async function getAssessmentStatistics(assessmentId) {
    const response = await axios.get(`${BASE_URL}/api/viva/assessment/${assessmentId}/stats`);
    return response.data.data;
}
/**
 * Waive viva requirement
 */
export async function waiveVivaRequest(vivaRequestId, reason) {
    await axios.post(`${BASE_URL}/api/viva/requests/${vivaRequestId}/waive`, {
        reason,
    });
}
/**
 * Get list of assessments with viva requirements
 */
export async function getAssessments() {
    const response = await axios.get(`${BASE_URL}/api/viva/assessments`);
    return response.data.data || [];
}
export const vivaApi = {
    createVivaRequest,
    selectRandomStudents,
    selectFlaggedStudents,
    submitVideoExplanation,
    reviewVideoExplanation,
    getVivaRequest,
    getStudentPendingRequests,
    getStudentOverdueRequests,
    getInstructorPendingReviews,
    getAssessmentVivaRequests,
    getAssessmentStatistics,
    getAssessments,
    waiveVivaRequest,
};
