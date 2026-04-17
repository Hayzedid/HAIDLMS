import { Pool } from 'pg';

export class VideoProcessingService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Video Uploads
  async createVideo(data: {
    video_title: string;
    original_filename: string;
    file_size: number;
    storage_path: string;
    course_id?: string;
    lesson_id?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO video_uploads (video_title, original_filename, file_size, storage_path, course_id, lesson_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.video_title, data.original_filename, data.file_size, data.storage_path, data.course_id || null, data.lesson_id || null]
    );
    return result.rows[0].id;
  }

  async getVideos(filters?: { course_id?: string; status?: string; }): Promise<any[]> {
    let query = `SELECT * FROM video_uploads WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.course_id) {
      query += ` AND course_id = $${paramIndex++}`;
      values.push(filters.course_id);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async updateVideoStatus(video_id: string, status: string, progress?: number): Promise<void> {
    await this.pool.query(
      `SELECT update_video_status($1, $2, $3)`,
      [video_id, status, progress || null]
    );
  }

  // Transcoding Jobs
  async createTranscodingJob(data: {
    video_id: string;
    quality: string;
    target_bitrate: number;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO transcoding_jobs (video_id, job_name, quality, target_bitrate)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.video_id, `Transcode to ${data.quality}`, data.quality, data.target_bitrate]
    );
    return result.rows[0].id;
  }

  async getTranscodingJobs(video_id?: string): Promise<any[]> {
    const query = video_id
      ? `SELECT * FROM transcoding_jobs WHERE video_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM transcoding_jobs ORDER BY created_at DESC LIMIT 100`;
    const result = video_id ? await this.pool.query(query, [video_id]) : await this.pool.query(query);
    return result.rows;
  }

  // Video Variants
  async createVideoVariant(data: {
    video_id: string;
    quality: string;
    width: number;
    height: number;
    bitrate: number;
    file_path: string;
    file_size: number;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO video_variants (video_id, quality, width, height, bitrate, file_path, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.video_id, data.quality, data.width, data.height, data.bitrate, data.file_path, data.file_size]
    );
    return result.rows[0].id;
  }

  // Video Subtitles
  async addSubtitle(data: {
    video_id: string;
    language_code: string;
    file_path: string;
    subtitle_content: string;
    source?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO video_subtitles (video_id, language_code, file_path, subtitle_content, source)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.video_id, data.language_code, data.file_path, data.subtitle_content, data.source || 'manual']
    );
    return result.rows[0].id;
  }

  // Watch Sessions
  async createWatchSession(data: { video_id: string; user_id?: string; }): Promise<string> {
    const result = await this.pool.query(
      `SELECT record_video_view($1, $2, 0) as session_id`,
      [data.video_id, data.user_id || null]
    );
    return result.rows[0].session_id;
  }

  async updateWatchSession(session_id: string, data: {
    current_position_seconds?: number;
    quality_watched?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.current_position_seconds !== undefined) {
      updates.push(`current_position_seconds = $${paramIndex++}`);
      values.push(data.current_position_seconds);
    }

    if (data.quality_watched) {
      updates.push(`quality_watched = $${paramIndex++}`);
      values.push(data.quality_watched);
    }

    if (updates.length === 0) return;

    updates.push(`last_activity_at = NOW()`);
    values.push(session_id);

    const query = `UPDATE video_watch_sessions SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  // Analytics
  async getVideoAnalytics(video_id?: string): Promise<any[]> {
    const query = video_id
      ? `SELECT * FROM video_analytics_dashboard WHERE id = $1`
      : `SELECT * FROM video_analytics_dashboard LIMIT 50`;
    const result = video_id ? await this.pool.query(query, [video_id]) : await this.pool.query(query);
    return result.rows;
  }

  async getEngagementHeatmap(video_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM video_engagement_heatmap WHERE video_id = $1 ORDER BY time_bucket_start`,
      [video_id]
    );
    return result.rows;
  }
}
