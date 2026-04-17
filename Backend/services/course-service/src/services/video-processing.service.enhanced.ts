import { Pool, PoolClient } from 'pg';
import {
  VideoUploadSchema,
  TranscodingJobSchema,
  SubtitleSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('VideoProcessingService');

export class VideoProcessingServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // VIDEO UPLOADS - ENHANCED
  // ========================================

  async createVideoWithValidation(data: any): Promise<string> {
    try {
      const validatedData = VideoUploadSchema.parse(data);
      logger.info('Creating video upload record', {
        video_title: validatedData.video_title,
        file_size: validatedData.file_size
      });

      const result = await this.pool.query(
        `INSERT INTO video_uploads (
          video_title, original_filename, file_size, storage_path,
          course_id, lesson_id
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          validatedData.video_title,
          validatedData.original_filename,
          validatedData.file_size,
          validatedData.storage_path,
          validatedData.course_id || null,
          validatedData.lesson_id || null
        ]
      );

      logger.info('Video upload record created', { video_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create video upload', error, { video_title: data.video_title });
      throw error;
    }
  }

  async getVideoByIdWithValidation(video_id: string): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM video_uploads WHERE id = $1`,
        [video_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Video', video_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch video', error, { video_id });
      throw error;
    }
  }

  async getVideosWithFilters(filters?: {
    course_id?: string;
    lesson_id?: string;
    status?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = `SELECT * FROM video_uploads WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.course_id) {
        query += ` AND course_id = $${paramIndex++}`;
        values.push(filters.course_id);
      }

      if (filters?.lesson_id) {
        query += ` AND lesson_id = $${paramIndex++}`;
        values.push(filters.lesson_id);
      }

      if (filters?.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
      }

      const limit = filters?.limit || 100;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      values.push(limit);

      const result = await this.pool.query(query, values);

      logger.debug('Videos retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch videos', error, filters);
      throw error;
    }
  }

  async updateVideoStatusWithValidation(video_id: string, status: string, progress?: number): Promise<void> {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      if (progress !== undefined && (progress < 0 || progress > 100)) {
        throw new ValidationError('Progress must be between 0 and 100');
      }

      logger.info('Updating video status', { video_id, status, progress });

      // Verify video exists
      await this.getVideoByIdWithValidation(video_id);

      await this.pool.query(
        `SELECT update_video_status($1, $2, $3)`,
        [video_id, status, progress || null]
      );

      logger.info('Video status updated', { video_id, status });
    } catch (error: any) {
      logger.error('Failed to update video status', error, { video_id, status });
      throw error;
    }
  }

  // ========================================
  // TRANSCODING JOBS - ENHANCED
  // ========================================

  async createTranscodingJobWithValidation(data: any): Promise<string> {
    try {
      const validatedData = TranscodingJobSchema.parse(data);
      logger.info('Creating transcoding job', {
        video_id: validatedData.video_id,
        quality: validatedData.quality
      });

      // Verify video exists
      await this.getVideoByIdWithValidation(validatedData.video_id);

      // Check for duplicate active job
      const existingJob = await this.pool.query(
        `SELECT id FROM transcoding_jobs
         WHERE video_id = $1 AND quality = $2 AND status IN ('pending', 'processing')`,
        [validatedData.video_id, validatedData.quality]
      );

      if (existingJob.rows.length > 0) {
        logger.warn('Transcoding job already in progress', {
          video_id: validatedData.video_id,
          quality: validatedData.quality
        });
        return existingJob.rows[0].id;
      }

      const result = await this.pool.query(
        `INSERT INTO transcoding_jobs (
          video_id, job_name, quality, target_bitrate
        ) VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          validatedData.video_id,
          `Transcode to ${validatedData.quality}`,
          validatedData.quality,
          validatedData.target_bitrate
        ]
      );

      logger.info('Transcoding job created', { job_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create transcoding job', error, data);
      throw error;
    }
  }

  async getTranscodingJobsWithStatus(video_id?: string, status?: string): Promise<any[]> {
    try {
      let query = `SELECT * FROM transcoding_jobs WHERE 1=1`;
      const values: any[] = [];
      let paramIndex = 1;

      if (video_id) {
        query += ` AND video_id = $${paramIndex++}`;
        values.push(video_id);
      }

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await this.pool.query(query, values);

      logger.debug('Transcoding jobs retrieved', { count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch transcoding jobs', error, { video_id, status });
      throw error;
    }
  }

  async updateTranscodingJobStatus(job_id: string, status: string, error_message?: string): Promise<void> {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      logger.info('Updating transcoding job status', { job_id, status });

      const updates = [`status = $1`, `updated_at = NOW()`];
      const values: any[] = [status];
      let paramIndex = 2;

      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }

      if (error_message && status === 'failed') {
        updates.push(`error_message = $${paramIndex++}`);
        values.push(error_message);
      }

      values.push(job_id);

      await this.pool.query(
        `UPDATE transcoding_jobs SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      logger.info('Transcoding job status updated', { job_id, status });
    } catch (error: any) {
      logger.error('Failed to update transcoding job status', error, { job_id, status });
      throw error;
    }
  }

  // ========================================
  // VIDEO VARIANTS - ENHANCED
  // ========================================

  async createVideoVariantWithValidation(data: {
    video_id: string;
    quality: string;
    width: number;
    height: number;
    bitrate: number;
    file_path: string;
    file_size: number;
  }): Promise<string> {
    try {
      logger.info('Creating video variant', {
        video_id: data.video_id,
        quality: data.quality
      });

      // Verify video exists
      await this.getVideoByIdWithValidation(data.video_id);

      // Check for duplicate variant
      const existingVariant = await this.pool.query(
        `SELECT id FROM video_variants WHERE video_id = $1 AND quality = $2`,
        [data.video_id, data.quality]
      );

      if (existingVariant.rows.length > 0) {
        logger.warn('Video variant already exists', { video_id: data.video_id, quality: data.quality });
        return existingVariant.rows[0].id;
      }

      const result = await this.pool.query(
        `INSERT INTO video_variants (
          video_id, quality, width, height, bitrate, file_path, file_size
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [data.video_id, data.quality, data.width, data.height, data.bitrate, data.file_path, data.file_size]
      );

      logger.info('Video variant created', { variant_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create video variant', error, data);
      throw error;
    }
  }

  async getVideoVariants(video_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM video_variants WHERE video_id = $1 ORDER BY bitrate DESC`,
        [video_id]
      );

      logger.debug('Video variants retrieved', { video_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch video variants', error, { video_id });
      throw error;
    }
  }

  // ========================================
  // SUBTITLES - ENHANCED
  // ========================================

  async addSubtitleWithValidation(data: any): Promise<string> {
    try {
      const validatedData = SubtitleSchema.parse(data);
      logger.info('Adding video subtitle', {
        video_id: validatedData.video_id,
        language_code: validatedData.language_code,
        source: validatedData.source
      });

      // Verify video exists
      await this.getVideoByIdWithValidation(validatedData.video_id);

      // Check for duplicate subtitle
      const existingSubtitle = await this.pool.query(
        `SELECT id FROM video_subtitles WHERE video_id = $1 AND language_code = $2`,
        [validatedData.video_id, validatedData.language_code]
      );

      if (existingSubtitle.rows.length > 0) {
        logger.warn('Subtitle already exists, updating', {
          video_id: validatedData.video_id,
          language_code: validatedData.language_code
        });

        await this.pool.query(
          `UPDATE video_subtitles
           SET file_path = $1, subtitle_content = $2, source = $3, updated_at = NOW()
           WHERE id = $4`,
          [
            validatedData.file_path,
            validatedData.subtitle_content,
            validatedData.source || 'manual',
            existingSubtitle.rows[0].id
          ]
        );

        return existingSubtitle.rows[0].id;
      }

      const result = await this.pool.query(
        `INSERT INTO video_subtitles (
          video_id, language_code, file_path, subtitle_content, source
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          validatedData.video_id,
          validatedData.language_code,
          validatedData.file_path,
          validatedData.subtitle_content,
          validatedData.source || 'manual'
        ]
      );

      logger.info('Video subtitle added', { subtitle_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to add video subtitle', error, data);
      throw error;
    }
  }

  async getVideoSubtitles(video_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM video_subtitles WHERE video_id = $1 ORDER BY language_code`,
        [video_id]
      );

      logger.debug('Video subtitles retrieved', { video_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch video subtitles', error, { video_id });
      throw error;
    }
  }

  // ========================================
  // WATCH SESSIONS - ENHANCED
  // ========================================

  async createWatchSessionWithValidation(video_id: string, user_id?: string): Promise<string> {
    try {
      logger.info('Creating watch session', { video_id, user_id });

      // Verify video exists
      await this.getVideoByIdWithValidation(video_id);

      const result = await this.pool.query(
        `SELECT record_video_view($1, $2, 0) as session_id`,
        [video_id, user_id || null]
      );

      logger.info('Watch session created', { session_id: result.rows[0].session_id });
      return result.rows[0].session_id;
    } catch (error: any) {
      logger.error('Failed to create watch session', error, { video_id, user_id });
      throw error;
    }
  }

  async updateWatchSessionWithValidation(session_id: string, data: {
    current_position_seconds?: number;
    quality_watched?: string;
    completed?: boolean;
  }): Promise<void> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.current_position_seconds !== undefined) {
        if (data.current_position_seconds < 0) {
          throw new ValidationError('current_position_seconds must be non-negative');
        }
        updates.push(`current_position_seconds = $${paramIndex++}`);
        values.push(data.current_position_seconds);
      }

      if (data.quality_watched) {
        updates.push(`quality_watched = $${paramIndex++}`);
        values.push(data.quality_watched);
      }

      if (data.completed !== undefined) {
        updates.push(`is_completed = $${paramIndex++}`, `completed_at = CASE WHEN $${paramIndex - 1} THEN NOW() ELSE NULL END`);
        values.push(data.completed);
      }

      if (updates.length === 0) {
        logger.warn('No updates provided for watch session', { session_id });
        return;
      }

      updates.push(`last_activity_at = NOW()`);
      values.push(session_id);

      const query = `UPDATE video_watch_sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await this.pool.query(query, values);

      logger.debug('Watch session updated', { session_id });
    } catch (error: any) {
      logger.error('Failed to update watch session', error, { session_id });
      throw error;
    }
  }

  // ========================================
  // ANALYTICS - ENHANCED
  // ========================================

  async getVideoAnalyticsWithMetrics(video_id?: string): Promise<any[]> {
    try {
      const query = video_id
        ? `SELECT * FROM video_analytics_dashboard WHERE id = $1`
        : `SELECT * FROM video_analytics_dashboard ORDER BY total_views DESC LIMIT 50`;

      const result = video_id
        ? await this.pool.query(query, [video_id])
        : await this.pool.query(query);

      logger.debug('Video analytics retrieved', { video_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch video analytics', error, { video_id });
      throw error;
    }
  }

  async getEngagementHeatmapWithInsights(video_id: string): Promise<any> {
    try {
      logger.info('Fetching engagement heatmap', { video_id });

      const result = await this.pool.query(
        `SELECT * FROM video_engagement_heatmap
         WHERE video_id = $1
         ORDER BY time_bucket_start`,
        [video_id]
      );

      // Calculate insights
      let maxViewCount = 0;
      let minViewCount = Infinity;
      let totalViews = 0;
      let dropoffPoints: any[] = [];

      result.rows.forEach((bucket, index) => {
        const viewCount = parseInt(bucket.view_count);
        totalViews += viewCount;

        if (viewCount > maxViewCount) maxViewCount = viewCount;
        if (viewCount < minViewCount) minViewCount = viewCount;

        // Detect drop-off points (>30% decrease from previous bucket)
        if (index > 0) {
          const prevCount = parseInt(result.rows[index - 1].view_count);
          const dropPercent = ((prevCount - viewCount) / prevCount) * 100;

          if (dropPercent > 30) {
            dropoffPoints.push({
              time: bucket.time_bucket_start,
              drop_percent: Math.round(dropPercent)
            });
          }
        }
      });

      const avgViews = result.rows.length > 0 ? totalViews / result.rows.length : 0;

      logger.info('Engagement heatmap computed', {
        video_id,
        bucket_count: result.rows.length,
        dropoff_points: dropoffPoints.length
      });

      return {
        video_id,
        heatmap: result.rows,
        insights: {
          max_view_count: maxViewCount,
          min_view_count: minViewCount === Infinity ? 0 : minViewCount,
          avg_view_count: Math.round(avgViews),
          dropoff_points: dropoffPoints
        }
      };
    } catch (error: any) {
      logger.error('Failed to fetch engagement heatmap', error, { video_id });
      throw error;
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getVideoProcessingHealthCheck(): Promise<any> {
    try {
      const [videos, pendingJobs, failedJobs] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM video_uploads`),
        this.pool.query(`SELECT COUNT(*) as count FROM transcoding_jobs WHERE status IN ('pending', 'processing')`),
        this.pool.query(`SELECT COUNT(*) as count FROM transcoding_jobs WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours'`)
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          total_videos: parseInt(videos.rows[0].count),
          pending_transcoding_jobs: parseInt(pendingJobs.rows[0].count),
          recent_failed_jobs: parseInt(failedJobs.rows[0].count)
        }
      };
    } catch (error: any) {
      logger.error('Failed to get video processing health check', error);
      throw error;
    }
  }
}
