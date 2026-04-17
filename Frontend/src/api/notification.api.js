import axios from './client';
// ── API Functions ──────────────────────────────────────────────────────────
/**
 * Get user's in-app notifications
 */
export async function getNotifications(options) {
    return axios.get('/api/notifications/in-app', { params: options });
}
/**
 * Get unread notification count
 */
export async function getUnreadCount() {
    return axios.get('/api/notifications/in-app/unread-count');
}
/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
    return axios.post(`/api/notifications/${notificationId}/read`);
}
/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
    return axios.post('/api/notifications/in-app/read-all');
}
/**
 * Delete notification
 */
export async function deleteNotification(notificationId) {
    return axios.delete(`/api/notifications/${notificationId}`);
}
/**
 * Get notification preferences
 */
export async function getPreferences() {
    return axios.get('/api/notifications/preferences');
}
/**
 * Update notification preferences
 */
export async function updatePreferences(preferences) {
    return axios.patch('/api/notifications/preferences', preferences);
}
/**
 * Get due reviews (spaced repetition)
 */
export async function getDueReviews() {
    return axios.get('/api/spaced-repetition/reviews/due');
}
/**
 * Get upcoming reviews
 */
export async function getUpcomingReviews(days = 7) {
    return axios.get('/api/spaced-repetition/reviews/upcoming', {
        params: { days },
    });
}
/**
 * Record review response
 */
export async function recordReview(scheduleId, quality) {
    return axios.post(`/api/spaced-repetition/schedules/${scheduleId}/review`, { quality });
}
/**
 * Get spaced repetition statistics
 */
export async function getSpacedRepStats() {
    return axios.get('/api/spaced-repetition/stats');
}
/**
 * Connect to notification WebSocket
 */
export function connectNotificationWebSocket(token, onMessage) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'localhost:4005';
    const ws = new WebSocket(`${protocol}//${host}/ws/notifications?token=${token}`);
    ws.onopen = () => {
        console.log('[notifications] WebSocket connected');
    };
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            onMessage(message);
        }
        catch (error) {
            console.error('[notifications] Failed to parse WebSocket message:', error);
        }
    };
    ws.onerror = (error) => {
        console.error('[notifications] WebSocket error:', error);
    };
    ws.onclose = () => {
        console.log('[notifications] WebSocket disconnected');
    };
    return ws;
}
/**
 * Send message to WebSocket
 */
export function sendWebSocketMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}
export const notificationApi = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    getDueReviews,
    getUpcomingReviews,
    recordReview,
    getSpacedRepStats,
    connectNotificationWebSocket,
    sendWebSocketMessage,
};
