import axios from 'axios';
const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:4006';
const analyticsApi = axios.create({
    baseURL: ANALYTICS_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add auth token to requests
analyticsApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// API functions
/**
 * Track event
 */
export async function trackEvent(payload) {
    return analyticsApi.post('/api/tracking/event', payload);
}
/**
 * Track multiple events
 */
export async function trackBatchEvents(events) {
    return analyticsApi.post('/api/tracking/batch', { events });
}
/**
 * Get user events
 */
export async function getUserEvents(params) {
    return analyticsApi.get('/api/tracking/events', { params });
}
/**
 * Get event counts
 */
export async function getEventCounts(params) {
    return analyticsApi.get('/api/tracking/events/counts', { params });
}
/**
 * Get active session
 */
export async function getActiveSession() {
    return analyticsApi.get('/api/tracking/session');
}
/**
 * End session
 */
export async function endSession() {
    return analyticsApi.post('/api/tracking/session/end');
}
/**
 * Get session history
 */
export async function getSessionHistory(params) {
    return analyticsApi.get('/api/tracking/sessions/history', { params });
}
/**
 * Get student dashboard
 */
export async function getStudentDashboard() {
    return analyticsApi.get('/api/dashboard/student');
}
/**
 * Get instructor dashboard
 */
export async function getInstructorDashboard() {
    return analyticsApi.get('/api/dashboard/instructor');
}
/**
 * Get admin dashboard
 */
export async function getAdminDashboard() {
    return analyticsApi.get('/api/dashboard/admin');
}
/**
 * Get time series data
 */
export async function getTimeSeriesData(params) {
    return analyticsApi.get('/api/dashboard/timeseries', { params });
}
/**
 * Get comparison data
 */
export async function getComparisonData(days) {
    return analyticsApi.get('/api/dashboard/comparison', {
        params: { days },
    });
}
/**
 * Get user analytics
 */
export async function getUserAnalytics() {
    return analyticsApi.get('/api/analytics/user');
}
/**
 * Get course analytics
 */
export async function getCourseAnalytics(courseId) {
    return analyticsApi.get(`/api/analytics/course/${courseId}`);
}
/**
 * Get learning insights
 */
export async function getLearningInsights(courseId) {
    return analyticsApi.get(`/api/analytics/course/${courseId}/insights`);
}
/**
 * Get learning path recommendations
 */
export async function getLearningPathRecommendations(courseId) {
    return analyticsApi.get(`/api/analytics/course/${courseId}/recommendations`);
}
/**
 * Update learning metrics
 */
export async function updateLearningMetrics(courseId) {
    return analyticsApi.post(`/api/analytics/course/${courseId}/metrics/update`);
}
/**
 * Get retention metrics
 */
export async function getRetentionMetrics(days) {
    return analyticsApi.get('/api/analytics/retention', {
        params: { days },
    });
}
/**
 * Get at-risk users
 */
export async function getAtRiskUsers(params) {
    return analyticsApi.get('/api/analytics/at-risk', { params });
}
/**
 * Connect to real-time analytics WebSocket
 */
export function connectAnalyticsWebSocket(token, onMessage) {
    const wsUrl = ANALYTICS_API_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/analytics?token=${token}`);
    ws.onopen = () => {
        console.log('Analytics WebSocket connected');
    };
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            onMessage(message);
        }
        catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    };
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    ws.onclose = () => {
        console.log('Analytics WebSocket disconnected');
    };
    return ws;
}
/**
 * Subscribe to metrics
 */
export function subscribeToMetrics(ws, metrics) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'subscribe', metrics }));
    }
}
/**
 * Unsubscribe from metrics
 */
export function unsubscribeFromMetrics(ws, metrics) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', metrics }));
    }
}
/**
 * Request immediate metric update
 */
export function requestMetricUpdate(ws, metric) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'request_update', metric }));
    }
}
export default analyticsApi;
