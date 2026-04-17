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

// Types
export interface TrackEventPayload {
  eventType: string;
  courseId?: string;
  lessonId?: string;
  moduleId?: string;
  assessmentId?: string;
  properties?: Record<string, any>;
  pageUrl?: string;
  referrer?: string;
  pageLoadTime?: number;
}

export interface UserAnalytics {
  engagementScore: number;
  healthScore: number;
  streakDays: number;
  longestStreak: number;
  completionRate: number;
  learningVelocity: number;
  timeMetrics: {
    totalMinutes: number;
    avgSessionMinutes: number;
    avgDailyMinutes: number;
    peakHour: number;
  };
  trends: {
    engagementTrend: number;
    performanceTrend: number;
  };
}

export interface StudentDashboard {
  overview: {
    engagementScore: number;
    healthScore: number;
    totalTimeMinutes: number;
    coursesEnrolled: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    streakDays: number;
    longestStreak: number;
  };
  activeCourses: any[];
  recentActivity: any[];
  streakCalendar: any[];
  upcomingDeadlines: any[];
  achievements: any[];
  timeDistribution: any[];
  weeklyTrend: any[];
}

export interface LearningInsights {
  metrics: any;
  insights: Array<{
    type: 'info' | 'warning' | 'success';
    title: string;
    message: string;
    suggestions: string[];
  }>;
  estimatedCompletionDate: string | null;
  predictedSuccessRate: number;
}

// API functions

/**
 * Track event
 */
export async function trackEvent(payload: TrackEventPayload) {
  return analyticsApi.post('/api/tracking/event', payload);
}

/**
 * Track multiple events
 */
export async function trackBatchEvents(events: TrackEventPayload[]) {
  return analyticsApi.post('/api/tracking/batch', { events });
}

/**
 * Get user events
 */
export async function getUserEvents(params?: {
  eventType?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}) {
  return analyticsApi.get('/api/tracking/events', { params });
}

/**
 * Get event counts
 */
export async function getEventCounts(params?: {
  startDate?: string;
  endDate?: string;
}) {
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
export async function getSessionHistory(params?: {
  limit?: number;
  offset?: number;
}) {
  return analyticsApi.get('/api/tracking/sessions/history', { params });
}

/**
 * Get student dashboard
 */
export async function getStudentDashboard() {
  return analyticsApi.get<{ data: StudentDashboard }>('/api/dashboard/student');
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
export async function getTimeSeriesData(params: {
  metric: string;
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}) {
  return analyticsApi.get('/api/dashboard/timeseries', { params });
}

/**
 * Get comparison data
 */
export async function getComparisonData(days?: number) {
  return analyticsApi.get('/api/dashboard/comparison', {
    params: { days },
  });
}

/**
 * Get user analytics
 */
export async function getUserAnalytics() {
  return analyticsApi.get<{ data: UserAnalytics }>('/api/analytics/user');
}

/**
 * Get course analytics
 */
export async function getCourseAnalytics(courseId: string) {
  return analyticsApi.get(`/api/analytics/course/${courseId}`);
}

/**
 * Get learning insights
 */
export async function getLearningInsights(courseId: string) {
  return analyticsApi.get<{ data: LearningInsights }>(
    `/api/analytics/course/${courseId}/insights`
  );
}

/**
 * Get learning path recommendations
 */
export async function getLearningPathRecommendations(courseId: string) {
  return analyticsApi.get(`/api/analytics/course/${courseId}/recommendations`);
}

/**
 * Update learning metrics
 */
export async function updateLearningMetrics(courseId: string) {
  return analyticsApi.post(`/api/analytics/course/${courseId}/metrics/update`);
}

/**
 * Get retention metrics
 */
export async function getRetentionMetrics(days?: number) {
  return analyticsApi.get('/api/analytics/retention', {
    params: { days },
  });
}

/**
 * Get at-risk users
 */
export async function getAtRiskUsers(params?: {
  healthScore?: number;
  engagementScore?: number;
  daysInactive?: number;
}) {
  return analyticsApi.get('/api/analytics/at-risk', { params });
}

/**
 * Connect to real-time analytics WebSocket
 */
export function connectAnalyticsWebSocket(
  token: string,
  onMessage: (message: any) => void
): WebSocket {
  const wsUrl = ANALYTICS_API_URL.replace('http', 'ws');
  const ws = new WebSocket(`${wsUrl}/ws/analytics?token=${token}`);

  ws.onopen = () => {
    console.log('Analytics WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
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
export function subscribeToMetrics(ws: WebSocket, metrics: string[]) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', metrics }));
  }
}

/**
 * Unsubscribe from metrics
 */
export function unsubscribeFromMetrics(ws: WebSocket, metrics: string[]) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'unsubscribe', metrics }));
  }
}

/**
 * Request immediate metric update
 */
export function requestMetricUpdate(ws: WebSocket, metric: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'request_update', metric }));
  }
}

export default analyticsApi;
