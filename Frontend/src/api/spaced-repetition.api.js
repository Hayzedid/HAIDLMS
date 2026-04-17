import axios from 'axios';
const BASE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4005';
/**
 * Initialize spaced repetition schedule for content
 */
export async function initializeSchedule(userId, contentId, contentType) {
    const response = await axios.post(`${BASE_URL}/api/spaced-repetition/schedules`, {
        userId,
        contentId,
        contentType,
    });
    return response.data;
}
/**
 * Get schedule for specific content
 */
export async function getSchedule(userId, contentId, contentType) {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/schedules/${userId}/${contentId}/${contentType}`);
    return response.data;
}
/**
 * Record review response (quality 0-5)
 */
export async function recordReview(scheduleId, quality, timeSpentSeconds) {
    const response = await axios.post(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/review`, {
        quality,
        timeSpentSeconds,
    });
    return response.data;
}
/**
 * Get due reviews (need to be reviewed now)
 */
export async function getDueReviews() {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/reviews/due`);
    return response.data;
}
/**
 * Get upcoming reviews (in next N days)
 */
export async function getUpcomingReviews(days = 7) {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/reviews/upcoming`, {
        params: { days },
    });
    return response.data;
}
/**
 * Pause schedule until a specific date
 */
export async function pauseSchedule(scheduleId, pauseUntil) {
    await axios.post(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/pause`, {
        pauseUntil: pauseUntil.toISOString(),
    });
}
/**
 * Resume paused schedule
 */
export async function resumeSchedule(scheduleId) {
    await axios.post(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/resume`);
}
/**
 * Deactivate schedule (stop reviews)
 */
export async function deactivateSchedule(scheduleId) {
    await axios.delete(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}`);
}
/**
 * Get schedule statistics
 */
export async function getScheduleStats() {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/stats`);
    return response.data;
}
/**
 * Get retention metrics
 */
export async function getRetentionMetrics() {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/retention`);
    return response.data;
}
/**
 * Get learning health score
 */
export async function getLearningHealthScore() {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/health`);
    return response.data;
}
/**
 * Get review sessions history
 */
export async function getReviewSessions(days = 30) {
    const response = await axios.get(`${BASE_URL}/api/spaced-repetition/sessions`, {
        params: { days },
    });
    return response.data;
}
export const spacedRepetitionApi = {
    initializeSchedule,
    getSchedule,
    recordReview,
    getDueReviews,
    getUpcomingReviews,
    pauseSchedule,
    resumeSchedule,
    deactivateSchedule,
    getScheduleStats,
    getRetentionMetrics,
    getLearningHealthScore,
    getReviewSessions,
};
