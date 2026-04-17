import { Router } from 'express';
import { VideoProcessingController } from '../controllers/video-processing.controller';
import { Pool } from 'pg';

export const createVideoProcessingRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new VideoProcessingController(pool);

  // Video Management
  router.post('/videos', controller.createVideo);
  router.get('/videos', controller.getVideos);
  router.put('/videos/:video_id/status', controller.updateVideoStatus);

  // Transcoding
  router.post('/transcoding/jobs', controller.createTranscodingJob);

  // Subtitles
  router.post('/subtitles', controller.addSubtitle);

  // Watch Sessions
  router.post('/watch/sessions', controller.createWatchSession);

  // Analytics
  router.get('/analytics', controller.getAnalytics);

  return router;
};
