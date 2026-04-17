import apiClient from './client';

export interface VideoUpload {
  id: string;
  video_title: string;
  original_filename: string;
  file_size: number;
  storage_path: string;
  course_id?: string;
  lesson_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration_seconds?: number;
  uploaded_at: string;
  processed_at?: string;
}

export interface TranscodingJob {
  id: string;
  video_id: string;
  quality: '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'audio_only';
  target_bitrate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface VideoVariant {
  id: string;
  video_id: string;
  quality: string;
  width: number;
  height: number;
  bitrate: number;
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface VideoSubtitle {
  id: string;
  video_id: string;
  language_code: string;
  file_path: string;
  subtitle_content: string;
  source: 'manual' | 'auto_generated' | 'imported' | 'ai_translated';
  created_at: string;
  updated_at: string;
}

export interface WatchSession {
  id: string;
  video_id: string;
  user_id?: string;
  current_position_seconds: number;
  quality_watched?: string;
  completed: boolean;
  started_at: string;
  last_updated_at: string;
}

export interface VideoAnalytics {
  video_id: string;
  total_views: number;
  unique_viewers: number;
  completion_rate: number;
  average_watch_time_seconds: number;
}

export interface EngagementHeatmap {
  video_id: string;
  heatmap: Array<{
    time_bucket_start: number;
    time_bucket_end: number;
    view_count: number;
  }>;
  insights: {
    max_engagement: number;
    min_engagement: number;
    avg_engagement: number;
    drop_off_points: Array<{
      time_seconds: number;
      drop_percentage: number;
    }>;
  };
}

export const videoProcessingApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{ healthy: boolean; metrics: any }>('/video/health'),

  // Video Uploads
  createVideo: (data: {
    video_title: string;
    original_filename: string;
    file_size: number;
    storage_path: string;
    course_id?: string;
    lesson_id?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/video/uploads', data),

  getVideos: (params?: {
    course_id?: string;
    lesson_id?: string;
    status?: string;
    limit?: number;
  }) =>
    apiClient.get<{ videos: VideoUpload[]; count: number }>('/video/uploads', { params }),

  getVideoById: (videoId: string) =>
    apiClient.get<VideoUpload>(`/video/uploads/${videoId}`),

  updateVideoStatus: (videoId: string, status: string, progress?: number) =>
    apiClient.put<{ message: string; video_id: string; status: string }>(
      `/video/uploads/${videoId}/status`,
      { status, progress }
    ),

  // Transcoding
  createTranscodingJob: (data: {
    video_id: string;
    quality: string;
    target_bitrate: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/video/transcoding', data),

  getTranscodingJobs: (params?: {
    video_id?: string;
    status?: string;
  }) =>
    apiClient.get<{ jobs: TranscodingJob[]; count: number }>('/video/transcoding', { params }),

  updateTranscodingJobStatus: (jobId: string, status: string, errorMessage?: string) =>
    apiClient.put<{ message: string; job_id: string; status: string }>(
      `/video/transcoding/${jobId}/status`,
      { status, error_message: errorMessage }
    ),

  // Variants
  createVideoVariant: (data: {
    video_id: string;
    quality: string;
    width: number;
    height: number;
    bitrate: number;
    file_path: string;
    file_size: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/video/variants', data),

  getVideoVariants: (videoId: string) =>
    apiClient.get<{ video_id: string; variants: VideoVariant[]; count: number }>(
      `/video/variants/${videoId}`
    ),

  // Subtitles
  addSubtitle: (data: {
    video_id: string;
    language_code: string;
    file_path: string;
    subtitle_content: string;
    source?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/video/subtitles', data),

  getVideoSubtitles: (videoId: string) =>
    apiClient.get<{ video_id: string; subtitles: VideoSubtitle[]; count: number }>(
      `/video/subtitles/${videoId}`
    ),

  // Watch Sessions
  createWatchSession: (data: {
    video_id: string;
    user_id?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/video/watch', data),

  updateWatchSession: (sessionId: string, data: {
    current_position_seconds?: number;
    quality_watched?: string;
    completed?: boolean;
  }) =>
    apiClient.put<{ message: string; session_id: string }>(
      `/video/watch/${sessionId}`,
      data
    ),

  // Analytics
  getVideoAnalytics: (videoId?: string) =>
    apiClient.get<{ analytics: VideoAnalytics[] }>(
      '/video/analytics',
      { params: { video_id: videoId } }
    ),

  getEngagementHeatmap: (videoId: string) =>
    apiClient.get<EngagementHeatmap>(`/video/analytics/${videoId}/heatmap`),
};
