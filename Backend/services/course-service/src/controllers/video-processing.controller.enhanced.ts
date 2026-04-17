import { Request, Response } from 'express';
import { VideoProcessingServiceEnhanced } from '../services/video-processing.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('VideoProcessingController');

export class VideoProcessingControllerEnhanced {
  private videoService: VideoProcessingServiceEnhanced;

  constructor(pool: Pool) {
    this.videoService = new VideoProcessingServiceEnhanced(pool);
  }

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);
    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });
    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  createVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const videoId = await this.videoService.createVideoWithValidation(req.body);
      res.status(201).json({ id: videoId, message: 'Video upload record created' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create video');
    }
  };

  getVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { course_id, lesson_id, status, limit } = req.query;
      const videos = await this.videoService.getVideosWithFilters({
        course_id: course_id as string,
        lesson_id: lesson_id as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({ videos, count: videos.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get videos');
    }
  };

  getVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const video = await this.videoService.getVideoByIdWithValidation(video_id);
      res.json(video);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get video');
    }
  };

  updateVideoStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const { status, progress } = req.body;
      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }
      await this.videoService.updateVideoStatusWithValidation(video_id, status, progress);
      res.json({ message: 'Video status updated', video_id, status });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update video status');
    }
  };

  createTranscodingJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = await this.videoService.createTranscodingJobWithValidation(req.body);
      res.status(201).json({ id: jobId, message: 'Transcoding job created' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create transcoding job');
    }
  };

  getTranscodingJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id, status } = req.query;
      const jobs = await this.videoService.getTranscodingJobsWithStatus(
        video_id as string,
        status as string
      );
      res.json({ jobs, count: jobs.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get transcoding jobs');
    }
  };

  updateTranscodingJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { job_id } = req.params;
      const { status, error_message } = req.body;
      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }
      await this.videoService.updateTranscodingJobStatus(job_id, status, error_message);
      res.json({ message: 'Transcoding job status updated', job_id, status });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update transcoding job status');
    }
  };

  createVideoVariant = async (req: Request, res: Response): Promise<void> => {
    try {
      const variantId = await this.videoService.createVideoVariantWithValidation(req.body);
      res.status(201).json({ id: variantId, message: 'Video variant created' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create video variant');
    }
  };

  getVideoVariants = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const variants = await this.videoService.getVideoVariants(video_id);
      res.json({ video_id, variants, count: variants.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get video variants');
    }
  };

  addSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const subtitleId = await this.videoService.addSubtitleWithValidation(req.body);
      res.status(201).json({ id: subtitleId, message: 'Subtitle added' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Add subtitle');
    }
  };

  getVideoSubtitles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const subtitles = await this.videoService.getVideoSubtitles(video_id);
      res.json({ video_id, subtitles, count: subtitles.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get subtitles');
    }
  };

  createWatchSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id, user_id } = req.body;
      if (!video_id) {
        res.status(400).json({ error: 'video_id is required' });
        return;
      }
      const sessionId = await this.videoService.createWatchSessionWithValidation(video_id, user_id);
      res.status(201).json({ session_id: sessionId });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create watch session');
    }
  };

  updateWatchSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.params;
      await this.videoService.updateWatchSessionWithValidation(session_id, req.body);
      res.json({ message: 'Watch session updated', session_id });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update watch session');
    }
  };

  getVideoAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.query;
      const analytics = await this.videoService.getVideoAnalyticsWithMetrics(video_id as string);
      res.json({ analytics, count: analytics.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get video analytics');
    }
  };

  getEngagementHeatmap = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const heatmap = await this.videoService.getEngagementHeatmapWithInsights(video_id);
      res.json(heatmap);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get engagement heatmap');
    }
  };

  videoProcessingHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.videoService.getVideoProcessingHealthCheck();
      res.json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Video processing health check');
    }
  };
}
