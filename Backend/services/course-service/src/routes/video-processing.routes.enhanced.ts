import { Router } from 'express';
import { VideoProcessingControllerEnhanced } from '../controllers/video-processing.controller.enhanced';
import { Pool } from 'pg';

export const createVideoProcessingRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new VideoProcessingControllerEnhanced(pool);

  /**
   * @swagger
   * /api/video/health:
   *   get:
   *     summary: Video processing health check
   *     tags: [Video Processing - System]
   *     responses:
   *       200:
   *         description: System healthy with metrics
   */
  router.get('/health', controller.videoProcessingHealthCheck);

  /**
   * @swagger
   * /api/video/uploads:
   *   post:
   *     summary: Create video upload record (Enhanced)
   *     tags: [Video Processing - Uploads]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [video_title, original_filename, file_size, storage_path]
   *             properties:
   *               video_title:
   *                 type: string
   *               original_filename:
   *                 type: string
   *               file_size:
   *                 type: integer
   *                 maximum: 10737418240
   *               storage_path:
   *                 type: string
   *               course_id:
   *                 type: string
   *                 format: uuid
   *               lesson_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Video created
   */
  router.post('/uploads', controller.createVideo);

  /**
   * @swagger
   * /api/video/uploads:
   *   get:
   *     summary: Get videos with filters (Enhanced)
   *     tags: [Video Processing - Uploads]
   *     parameters:
   *       - in: query
   *         name: course_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: lesson_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, processing, completed, failed]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *     responses:
   *       200:
   *         description: List of videos
   */
  router.get('/uploads', controller.getVideos);

  /**
   * @swagger
   * /api/video/uploads/{video_id}:
   *   get:
   *     summary: Get video by ID (NEW)
   *     tags: [Video Processing - Uploads]
   *     parameters:
   *       - in: path
   *         name: video_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Video details
   *       404:
   *         description: Video not found
   */
  router.get('/uploads/:video_id', controller.getVideoById);

  /**
   * @swagger
   * /api/video/uploads/{video_id}/status:
   *   put:
   *     summary: Update video status (Enhanced)
   *     tags: [Video Processing - Uploads]
   *     parameters:
   *       - in: path
   *         name: video_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, processing, completed, failed]
   *               progress:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *     responses:
   *       200:
   *         description: Status updated
   */
  router.put('/uploads/:video_id/status', controller.updateVideoStatus);

  /**
   * @swagger
   * /api/video/transcoding:
   *   post:
   *     summary: Create transcoding job (Enhanced)
   *     tags: [Video Processing - Transcoding]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [video_id, quality, target_bitrate]
   *             properties:
   *               video_id:
   *                 type: string
   *                 format: uuid
   *               quality:
   *                 type: string
   *                 enum: ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'audio_only']
   *               target_bitrate:
   *                 type: integer
   *                 minimum: 128
   *                 maximum: 50000
   *     responses:
   *       201:
   *         description: Transcoding job created
   */
  router.post('/transcoding', controller.createTranscodingJob);

  /**
   * @swagger
   * /api/video/transcoding:
   *   get:
   *     summary: Get transcoding jobs (Enhanced)
   *     tags: [Video Processing - Transcoding]
   *     parameters:
   *       - in: query
   *         name: video_id
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of transcoding jobs
   */
  router.get('/transcoding', controller.getTranscodingJobs);

  /**
   * @swagger
   * /api/video/transcoding/{job_id}/status:
   *   put:
   *     summary: Update transcoding job status (NEW)
   *     tags: [Video Processing - Transcoding]
   *     parameters:
   *       - in: path
   *         name: job_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, processing, completed, failed]
   *               error_message:
   *                 type: string
   *     responses:
   *       200:
   *         description: Status updated
   */
  router.put('/transcoding/:job_id/status', controller.updateTranscodingJobStatus);

  /**
   * @swagger
   * /api/video/variants:
   *   post:
   *     summary: Create video variant (Enhanced)
   *     tags: [Video Processing - Variants]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [video_id, quality, width, height, bitrate, file_path, file_size]
   *     responses:
   *       201:
   *         description: Variant created
   */
  router.post('/variants', controller.createVideoVariant);

  /**
   * @swagger
   * /api/video/variants/{video_id}:
   *   get:
   *     summary: Get video variants (Enhanced)
   *     tags: [Video Processing - Variants]
   *     parameters:
   *       - in: path
   *         name: video_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of video variants
   */
  router.get('/variants/:video_id', controller.getVideoVariants);

  /**
   * @swagger
   * /api/video/subtitles:
   *   post:
   *     summary: Add subtitle (Enhanced)
   *     tags: [Video Processing - Subtitles]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [video_id, language_code, file_path, subtitle_content]
   *             properties:
   *               video_id:
   *                 type: string
   *                 format: uuid
   *               language_code:
   *                 type: string
   *                 pattern: '^[a-z]{2}$'
   *               file_path:
   *                 type: string
   *               subtitle_content:
   *                 type: string
   *               source:
   *                 type: string
   *                 enum: [manual, auto_generated, imported, ai_translated]
   *     responses:
   *       201:
   *         description: Subtitle added
   */
  router.post('/subtitles', controller.addSubtitle);

  /**
   * @swagger
   * /api/video/subtitles/{video_id}:
   *   get:
   *     summary: Get video subtitles (Enhanced)
   *     tags: [Video Processing - Subtitles]
   *     parameters:
   *       - in: path
   *         name: video_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of subtitles
   */
  router.get('/subtitles/:video_id', controller.getVideoSubtitles);

  /**
   * @swagger
   * /api/video/watch:
   *   post:
   *     summary: Create watch session (Enhanced)
   *     tags: [Video Processing - Watch Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [video_id]
   *             properties:
   *               video_id:
   *                 type: string
   *                 format: uuid
   *               user_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Watch session created
   */
  router.post('/watch', controller.createWatchSession);

  /**
   * @swagger
   * /api/video/watch/{session_id}:
   *   put:
   *     summary: Update watch session (Enhanced)
   *     tags: [Video Processing - Watch Sessions]
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               current_position_seconds:
   *                 type: integer
   *               quality_watched:
   *                 type: string
   *               completed:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Watch session updated
   */
  router.put('/watch/:session_id', controller.updateWatchSession);

  /**
   * @swagger
   * /api/video/analytics:
   *   get:
   *     summary: Get video analytics (Enhanced)
   *     tags: [Video Processing - Analytics]
   *     parameters:
   *       - in: query
   *         name: video_id
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Video analytics
   */
  router.get('/analytics', controller.getVideoAnalytics);

  /**
   * @swagger
   * /api/video/analytics/{video_id}/heatmap:
   *   get:
   *     summary: Get engagement heatmap with insights (Enhanced)
   *     tags: [Video Processing - Analytics]
   *     parameters:
   *       - in: path
   *         name: video_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Engagement heatmap with drop-off points
   */
  router.get('/analytics/:video_id/heatmap', controller.getEngagementHeatmap);

  return router;
};
