import axios from './client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  subject?: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  slackEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  typePreferences: Record<string, any>;
  emailDigest: boolean;
  digestFrequency: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  slackWebhookUrl?: string;
  slackChannel?: string;
  phoneNumber?: string;
}

export interface SpacedRepetitionSchedule {
  id: string;
  userId: string;
  contentId: string;
  contentType: string;
  easinessFactor: number;
  repetitionNumber: number;
  intervalDays: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  reviewCount: number;
  qualityHistory: Array<{
    date: string;
    quality: number;
    interval: number;
  }>;
  isActive: boolean;
  pausedUntil?: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

/**
 * Get user's in-app notifications
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  includeRead?: boolean;
}) {
  return axios.get<{ data: { notifications: Notification[]; total: number } }>(
    '/api/notifications/in-app',
    { params: options }
  );
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  return axios.get<{ data: { count: number } }>('/api/notifications/in-app/unread-count');
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
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
export async function deleteNotification(notificationId: string) {
  return axios.delete(`/api/notifications/${notificationId}`);
}

/**
 * Get notification preferences
 */
export async function getPreferences() {
  return axios.get<{ data: NotificationPreferences }>('/api/notifications/preferences');
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  preferences: Partial<Omit<NotificationPreferences, 'id' | 'userId'>>
) {
  return axios.patch<{ data: NotificationPreferences }>('/api/notifications/preferences', preferences);
}

/**
 * Get due reviews (spaced repetition)
 */
export async function getDueReviews() {
  return axios.get<{ data: SpacedRepetitionSchedule[] }>('/api/spaced-repetition/reviews/due');
}

/**
 * Get upcoming reviews
 */
export async function getUpcomingReviews(days: number = 7) {
  return axios.get<{ data: SpacedRepetitionSchedule[] }>('/api/spaced-repetition/reviews/upcoming', {
    params: { days },
  });
}

/**
 * Record review response
 */
export async function recordReview(scheduleId: string, quality: number) {
  return axios.post<{ data: SpacedRepetitionSchedule }>(
    `/api/spaced-repetition/schedules/${scheduleId}/review`,
    { quality }
  );
}

/**
 * Get spaced repetition statistics
 */
export async function getSpacedRepStats() {
  return axios.get<{
    data: {
      totalSchedules: number;
      activeSchedules: number;
      dueToday: number;
      upcomingWeek: number;
      averageEF: number;
      totalReviews: number;
    };
  }>('/api/spaced-repetition/stats');
}

// ── WebSocket Helper ───────────────────────────────────────────────────────

export interface WebSocketMessage {
  type: 'connected' | 'notification' | 'unread_count' | 'pong' | 'error';
  timestamp: number;
  data?: any;
}

export type NotificationHandler = (message: WebSocketMessage) => void;

/**
 * Connect to notification WebSocket
 */
export function connectNotificationWebSocket(
  token: string,
  onMessage: NotificationHandler
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'localhost:4005';
  const ws = new WebSocket(`${protocol}//${host}/ws/notifications?token=${token}`);

  ws.onopen = () => {
    console.log('[notifications] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
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
export function sendWebSocketMessage(
  ws: WebSocket,
  message: {
    type: 'mark_read' | 'mark_all_read' | 'ping';
    notificationId?: string;
  }
) {
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
