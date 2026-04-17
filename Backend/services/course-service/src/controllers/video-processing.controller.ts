import { Request, Response } from 'express';
import { VideoProcessingService } from '../services/video-processing.service';
import { Pool } from 'pg';

export class VideoProcessingController {
  private videoService: VideoProcessingService;

  constructor(pool: Pool) {
    this.videoService = new VideoProcessingService(pool);
  }

  createVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.videoService.createVideo(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create video' });
    }
  };

  getVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const videos = await this.videoService.getVideos(req.query);
      res.json({ videos });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  };

  updateVideoStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.params;
      const { status, progress } = req.body;
      await this.videoService.updateVideoStatus(video_id, status, progress);
      res.json({ message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  };

  createTranscodingJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.videoService.createTranscodingJob(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transcoding job' });
    }
  };

  addSubtitle = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.videoService.addSubtitle(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add subtitle' });
    }
  };

  createWatchSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = await this.videoService.createWatchSession(req.body);
      res.status(201).json({ session_id: sessionId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create session' });
    }
  };

  getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { video_id } = req.query;
      const analytics = await this.videoService.getVideoAnalytics(video_id as string);
      res.json({ analytics });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  };
}
