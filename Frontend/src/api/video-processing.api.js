import apiClient from './client';
export const videoProcessingApi = {
    // Health check
    healthCheck: () => apiClient.get('/video/health'),
    // Video Uploads
    createVideo: (data) => apiClient.post('/video/uploads', data),
    getVideos: (params) => apiClient.get('/video/uploads', { params }),
    getVideoById: (videoId) => apiClient.get(`/video/uploads/${videoId}`),
    updateVideoStatus: (videoId, status, progress) => apiClient.put(`/video/uploads/${videoId}/status`, { status, progress }),
    // Transcoding
    createTranscodingJob: (data) => apiClient.post('/video/transcoding', data),
    getTranscodingJobs: (params) => apiClient.get('/video/transcoding', { params }),
    updateTranscodingJobStatus: (jobId, status, errorMessage) => apiClient.put(`/video/transcoding/${jobId}/status`, { status, error_message: errorMessage }),
    // Variants
    createVideoVariant: (data) => apiClient.post('/video/variants', data),
    getVideoVariants: (videoId) => apiClient.get(`/video/variants/${videoId}`),
    // Subtitles
    addSubtitle: (data) => apiClient.post('/video/subtitles', data),
    getVideoSubtitles: (videoId) => apiClient.get(`/video/subtitles/${videoId}`),
    // Watch Sessions
    createWatchSession: (data) => apiClient.post('/video/watch', data),
    updateWatchSession: (sessionId, data) => apiClient.put(`/video/watch/${sessionId}`, data),
    // Analytics
    getVideoAnalytics: (videoId) => apiClient.get('/video/analytics', { params: { video_id: videoId } }),
    getEngagementHeatmap: (videoId) => apiClient.get(`/video/analytics/${videoId}/heatmap`),
};
