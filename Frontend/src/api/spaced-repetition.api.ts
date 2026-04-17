import axios from 'axios';

const BASE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

/**
 * Spaced Repetition API Client
 */

export interface SpacedRepetitionSchedule {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'lesson' | 'module' | 'course';
  easinessFactor: number;
  repetitionNumber: number;
  intervalDays: number;
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  reviewCount: number;
  qualityHistory: Array<{
    date: string;
    quality: number;
    interval: number;
  }>;
  isActive: boolean;
  pausedUntil?: Date;
}

export interface RetentionMetrics {
  userId: string;
  retentionScore: number;
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  onTimeReviews: number;
  lateReviews: number;
  missedReviews: number;
  averageQuality: number;
  isCramming: boolean;
  crammingScore: number;
  lastActivityDate?: Date;
}

export interface LearningHealthScore {
  score: number;
  metrics: RetentionMetrics;
  recommendations: string[];
}

export interface ReviewSession {
  date: Date;
  reviewCount: number;
  averageQuality: number;
  timeSpentMinutes: number;
}

export interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  dueToday: number;
  upcomingWeek: number;
  averageEF: number;
  totalReviews: number;
}

/**
 * Initialize spaced repetition schedule for content
 */
export async function initializeSchedule(
  userId: string,
  contentId: string,
  contentType: 'lesson' | 'module' | 'course'
): Promise<SpacedRepetitionSchedule> {
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
export async function getSchedule(
  userId: string,
  contentId: string,
  contentType: string
): Promise<SpacedRepetitionSchedule> {
  const response = await axios.get(
    `${BASE_URL}/api/spaced-repetition/schedules/${userId}/${contentId}/${contentType}`
  );
  return response.data;
}

/**
 * Record review response (quality 0-5)
 */
export async function recordReview(
  scheduleId: string,
  quality: number,
  timeSpentSeconds?: number
): Promise<SpacedRepetitionSchedule> {
  const response = await axios.post(
    `${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/review`,
    {
      quality,
      timeSpentSeconds,
    }
  );
  return response.data;
}

/**
 * Get due reviews (need to be reviewed now)
 */
export async function getDueReviews(): Promise<SpacedRepetitionSchedule[]> {
  const response = await axios.get(`${BASE_URL}/api/spaced-repetition/reviews/due`);
  return response.data;
}

/**
 * Get upcoming reviews (in next N days)
 */
export async function getUpcomingReviews(days = 7): Promise<SpacedRepetitionSchedule[]> {
  const response = await axios.get(`${BASE_URL}/api/spaced-repetition/reviews/upcoming`, {
    params: { days },
  });
  return response.data;
}

/**
 * Pause schedule until a specific date
 */
export async function pauseSchedule(scheduleId: string, pauseUntil: Date): Promise<void> {
  await axios.post(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/pause`, {
    pauseUntil: pauseUntil.toISOString(),
  });
}

/**
 * Resume paused schedule
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  await axios.post(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}/resume`);
}

/**
 * Deactivate schedule (stop reviews)
 */
export async function deactivateSchedule(scheduleId: string): Promise<void> {
  await axios.delete(`${BASE_URL}/api/spaced-repetition/schedules/${scheduleId}`);
}

/**
 * Get schedule statistics
 */
export async function getScheduleStats(): Promise<ScheduleStats> {
  const response = await axios.get(`${BASE_URL}/api/spaced-repetition/stats`);
  return response.data;
}

/**
 * Get retention metrics
 */
export async function getRetentionMetrics(): Promise<RetentionMetrics> {
  const response = await axios.get(`${BASE_URL}/api/spaced-repetition/retention`);
  return response.data;
}

/**
 * Get learning health score
 */
export async function getLearningHealthScore(): Promise<LearningHealthScore> {
  const response = await axios.get(`${BASE_URL}/api/spaced-repetition/health`);
  return response.data;
}

/**
 * Get review sessions history
 */
export async function getReviewSessions(days = 30): Promise<ReviewSession[]> {
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
