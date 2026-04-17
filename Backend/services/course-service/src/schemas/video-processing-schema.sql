-- Video Processing & Streaming Infrastructure Schema
-- Video transcoding, adaptive streaming (HLS/DASH), thumbnails, subtitles, analytics, CDN

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE video_status AS ENUM ('uploading', 'uploaded', 'queued', 'processing', 'ready', 'failed', 'archived');
CREATE TYPE transcoding_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE video_quality AS ENUM ('240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'audio_only');
CREATE TYPE streaming_protocol AS ENUM ('hls', 'dash', 'progressive', 'rtmp');
CREATE TYPE subtitle_format AS ENUM ('srt', 'vtt', 'ass', 'sbv');
CREATE TYPE subtitle_source AS ENUM ('manual', 'auto_generated', 'imported', 'ai_translated');
CREATE TYPE thumbnail_type AS ENUM ('auto_generated', 'custom', 'ai_selected');
CREATE TYPE video_visibility AS ENUM ('public', 'unlisted', 'private', 'draft');

-- ========================================
-- 2. VIDEO UPLOADS
-- ========================================

CREATE TABLE IF NOT EXISTS video_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Identity
  video_title VARCHAR(500) NOT NULL,
  video_description TEXT,
  video_slug VARCHAR(255) UNIQUE,

  -- Content Reference
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Upload Details
  original_filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL, -- Bytes
  mime_type VARCHAR(100),

  -- Storage
  storage_path VARCHAR(1000) NOT NULL,
  storage_provider VARCHAR(50) DEFAULT 's3', -- 's3', 'gcs', 'azure', 'local'
  storage_bucket VARCHAR(255),
  storage_key VARCHAR(1000),

  -- Video Metadata
  duration_seconds NUMERIC, -- Duration in seconds
  width INTEGER,
  height INTEGER,
  frame_rate NUMERIC,
  bitrate BIGINT, -- Bits per second
  codec VARCHAR(50),
  format VARCHAR(50),

  -- Audio Metadata
  audio_codec VARCHAR(50),
  audio_bitrate INTEGER,
  audio_channels INTEGER,
  audio_sample_rate INTEGER,

  -- Status
  status video_status DEFAULT 'uploading',
  visibility video_visibility DEFAULT 'private',

  -- Processing
  transcoding_progress INTEGER DEFAULT 0, -- 0-100
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_error TEXT,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  total_watch_time_seconds BIGINT DEFAULT 0,
  avg_completion_rate NUMERIC DEFAULT 0, -- 0-1

  -- SEO
  thumbnail_url VARCHAR(1000),
  preview_url VARCHAR(1000), -- Short preview clip
  poster_url VARCHAR(1000), -- Poster image

  -- CDN
  cdn_enabled BOOLEAN DEFAULT true,
  cdn_url VARCHAR(1000),

  -- Metadata
  metadata JSONB,
  tags TEXT[],

  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_videos_status ON video_uploads(status);
CREATE INDEX idx_videos_course ON video_uploads(course_id);
CREATE INDEX idx_videos_lesson ON video_uploads(lesson_id);
CREATE INDEX idx_videos_slug ON video_uploads(video_slug);
CREATE INDEX idx_videos_uploaded_by ON video_uploads(uploaded_by);
CREATE INDEX idx_videos_visibility ON video_uploads(visibility);

-- ========================================
-- 3. TRANSCODING JOBS
-- ========================================

CREATE TABLE IF NOT EXISTS transcoding_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Job Details
  job_name VARCHAR(255) NOT NULL,
  quality video_quality NOT NULL,
  target_bitrate INTEGER, -- Kbps
  target_resolution VARCHAR(20), -- e.g., "1920x1080"

  -- Transcoding Settings
  codec VARCHAR(50) DEFAULT 'h264', -- 'h264', 'h265', 'vp9', 'av1'
  preset VARCHAR(50) DEFAULT 'medium', -- 'fast', 'medium', 'slow'
  crf INTEGER DEFAULT 23, -- Constant Rate Factor (0-51)
  audio_codec VARCHAR(50) DEFAULT 'aac',
  audio_bitrate INTEGER DEFAULT 128, -- Kbps

  -- Status
  status transcoding_status DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,

  -- Output
  output_path VARCHAR(1000),
  output_file_size BIGINT,
  output_duration_seconds NUMERIC,

  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  processing_time_seconds INTEGER,

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Worker
  worker_id VARCHAR(255),
  worker_instance VARCHAR(255),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcoding_video ON transcoding_jobs(video_id);
CREATE INDEX idx_transcoding_status ON transcoding_jobs(status);
CREATE INDEX idx_transcoding_quality ON transcoding_jobs(quality);
CREATE INDEX idx_transcoding_worker ON transcoding_jobs(worker_id);

-- ========================================
-- 4. VIDEO VARIANTS (Quality Levels)
-- ========================================

CREATE TABLE IF NOT EXISTS video_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Variant Details
  quality video_quality NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bitrate INTEGER NOT NULL, -- Kbps
  frame_rate NUMERIC,

  -- File Details
  file_path VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  codec VARCHAR(50),
  format VARCHAR(50),

  -- Streaming
  streaming_protocol streaming_protocol,
  manifest_url VARCHAR(1000), -- HLS .m3u8 or DASH .mpd
  segment_duration INTEGER DEFAULT 6, -- Seconds per segment

  -- Status
  is_ready BOOLEAN DEFAULT false,

  -- CDN
  cdn_url VARCHAR(1000),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_video ON video_variants(video_id);
CREATE INDEX idx_variants_quality ON video_variants(quality);
CREATE INDEX idx_variants_ready ON video_variants(is_ready);

-- ========================================
-- 5. VIDEO THUMBNAILS
-- ========================================

CREATE TABLE IF NOT EXISTS video_thumbnails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Thumbnail Details
  thumbnail_type thumbnail_type DEFAULT 'auto_generated',
  timestamp_seconds NUMERIC, -- Position in video

  -- Image Details
  image_url VARCHAR(1000) NOT NULL,
  image_path VARCHAR(1000),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,

  -- AI Selection
  ai_score NUMERIC, -- 0-1, quality score from AI
  is_primary BOOLEAN DEFAULT false,

  -- CDN
  cdn_url VARCHAR(1000),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_thumbnails_video ON video_thumbnails(video_id);
CREATE INDEX idx_thumbnails_primary ON video_thumbnails(is_primary) WHERE is_primary = true;
CREATE INDEX idx_thumbnails_type ON video_thumbnails(thumbnail_type);

-- ========================================
-- 6. VIDEO SUBTITLES/CAPTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS video_subtitles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Language
  language_code VARCHAR(10) NOT NULL, -- ISO 639-1 (e.g., 'en', 'es', 'fr')
  language_name VARCHAR(100),

  -- Subtitle Details
  subtitle_format subtitle_format DEFAULT 'vtt',
  source subtitle_source DEFAULT 'manual',

  -- File
  file_path VARCHAR(1000) NOT NULL,
  file_url VARCHAR(1000),
  file_size INTEGER,

  -- Content
  subtitle_content TEXT, -- Full subtitle content

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_auto_generated BOOLEAN DEFAULT false,
  accuracy_score NUMERIC, -- 0-1, for auto-generated

  -- Metadata
  metadata JSONB,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subtitles_video ON video_subtitles(video_id);
CREATE INDEX idx_subtitles_language ON video_subtitles(language_code);
CREATE INDEX idx_subtitles_default ON video_subtitles(is_default) WHERE is_default = true;

-- ========================================
-- 7. VIDEO CHAPTERS/MARKERS
-- ========================================

CREATE TABLE IF NOT EXISTS video_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Chapter Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time_seconds NUMERIC NOT NULL,
  end_time_seconds NUMERIC,

  -- Display Order
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chapters_video ON video_chapters(video_id);
CREATE INDEX idx_chapters_start_time ON video_chapters(start_time_seconds);

-- ========================================
-- 8. VIDEO WATCH SESSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video & User
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Session Details
  session_token VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),

  -- Progress
  current_position_seconds NUMERIC DEFAULT 0,
  furthest_position_seconds NUMERIC DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,

  -- Quality
  quality_watched video_quality,
  quality_changes INTEGER DEFAULT 0, -- Number of quality switches

  -- Playback Stats
  play_count INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,
  seek_count INTEGER DEFAULT 0,
  speed_changes INTEGER DEFAULT 0,
  playback_speed NUMERIC DEFAULT 1.0,

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completion_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMP,

  -- Context
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address VARCHAR(45),
  country VARCHAR(100),

  -- Bandwidth
  avg_bitrate INTEGER, -- Kbps
  buffer_events INTEGER DEFAULT 0,
  total_buffer_time_seconds INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_watch_sessions_video ON video_watch_sessions(video_id);
CREATE INDEX idx_watch_sessions_user ON video_watch_sessions(user_id);
CREATE INDEX idx_watch_sessions_started ON video_watch_sessions(started_at DESC);
CREATE INDEX idx_watch_sessions_completed ON video_watch_sessions(is_completed);

-- ========================================
-- 9. VIDEO ANALYTICS EVENTS
-- ========================================

CREATE TABLE IF NOT EXISTS video_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session Reference
  session_id UUID NOT NULL REFERENCES video_watch_sessions(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event Type
  event_type VARCHAR(50) NOT NULL, -- 'play', 'pause', 'seek', 'quality_change', 'buffer', 'complete'

  -- Event Data
  timestamp_seconds NUMERIC NOT NULL, -- Position in video
  event_data JSONB,

  -- Context
  quality video_quality,
  playback_speed NUMERIC,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_session ON video_analytics_events(session_id);
CREATE INDEX idx_analytics_video ON video_analytics_events(video_id);
CREATE INDEX idx_analytics_event_type ON video_analytics_events(event_type);
CREATE INDEX idx_analytics_timestamp ON video_analytics_events(timestamp_seconds);

-- ========================================
-- 10. VIDEO ENGAGEMENT HEATMAP
-- ========================================

CREATE TABLE IF NOT EXISTS video_engagement_heatmap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Video Reference
  video_id UUID NOT NULL REFERENCES video_uploads(id) ON DELETE CASCADE,

  -- Time Bucket (e.g., every 10 seconds)
  time_bucket_start NUMERIC NOT NULL,
  time_bucket_end NUMERIC NOT NULL,

  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,
  replay_count INTEGER DEFAULT 0, -- Times viewers rewatched this segment
  skip_count INTEGER DEFAULT 0, -- Times viewers skipped this segment

  -- Interaction
  pause_count INTEGER DEFAULT 0,
  seek_from_count INTEGER DEFAULT 0,
  seek_to_count INTEGER DEFAULT 0,

  -- Engagement Score
  engagement_score NUMERIC, -- Calculated score 0-1

  last_updated TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_video_time_bucket UNIQUE (video_id, time_bucket_start)
);

CREATE INDEX idx_heatmap_video ON video_engagement_heatmap(video_id);
CREATE INDEX idx_heatmap_engagement ON video_engagement_heatmap(engagement_score DESC);

-- ========================================
-- 11. STREAMING SESSIONS (Live Streaming)
-- ========================================

CREATE TABLE IF NOT EXISTS streaming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Stream Identity
  stream_title VARCHAR(500) NOT NULL,
  stream_description TEXT,

  -- Course Integration
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,

  -- Stream Details
  stream_key VARCHAR(255) NOT NULL UNIQUE,
  rtmp_url VARCHAR(1000),
  playback_url VARCHAR(1000),

  -- Status
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Metrics
  peak_concurrent_viewers INTEGER DEFAULT 0,
  total_unique_viewers INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0, -- Chat messages

  -- Recording
  is_recorded BOOLEAN DEFAULT true,
  recording_url VARCHAR(1000),
  recording_video_id UUID REFERENCES video_uploads(id) ON DELETE SET NULL,

  -- Settings
  visibility video_visibility DEFAULT 'private',
  chat_enabled BOOLEAN DEFAULT true,
  max_viewers INTEGER,

  -- Metadata
  metadata JSONB,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streaming_live ON streaming_sessions(is_live);
CREATE INDEX idx_streaming_creator ON streaming_sessions(created_by);
CREATE INDEX idx_streaming_course ON streaming_sessions(course_id);

-- ========================================
-- 12. CDN CACHE
-- ========================================

CREATE TABLE IF NOT EXISTS cdn_cache_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Resource Reference
  video_id UUID REFERENCES video_uploads(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,

  -- CDN Details
  cdn_provider VARCHAR(50), -- 'cloudflare', 'cloudfront', 'fastly', 'akamai'
  cdn_url VARCHAR(1000) NOT NULL,
  origin_url VARCHAR(1000) NOT NULL,

  -- Cache Status
  is_cached BOOLEAN DEFAULT false,
  cache_hit_ratio NUMERIC, -- 0-1
  total_requests BIGINT DEFAULT 0,
  total_bytes_served BIGINT DEFAULT 0,

  -- Purge
  last_purged_at TIMESTAMP,
  purge_count INTEGER DEFAULT 0,

  -- TTL
  ttl_seconds INTEGER DEFAULT 86400, -- 24 hours
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cdn_video ON cdn_cache_entries(video_id);
CREATE INDEX idx_cdn_variant ON cdn_cache_entries(variant_id);
CREATE INDEX idx_cdn_cached ON cdn_cache_entries(is_cached);

-- ========================================
-- 13. FUNCTIONS
-- ========================================

-- Function: Update video processing status
CREATE OR REPLACE FUNCTION update_video_status(
  p_video_id UUID,
  p_status video_status,
  p_progress INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE video_uploads
  SET
    status = p_status,
    transcoding_progress = COALESCE(p_progress, transcoding_progress),
    processing_started_at = CASE
      WHEN p_status = 'processing' AND processing_started_at IS NULL THEN NOW()
      ELSE processing_started_at
    END,
    processing_completed_at = CASE
      WHEN p_status IN ('ready', 'failed') THEN NOW()
      ELSE processing_completed_at
    END,
    updated_at = NOW()
  WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Record video view
CREATE OR REPLACE FUNCTION record_video_view(
  p_video_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_watch_time_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Create or update session
  INSERT INTO video_watch_sessions (
    video_id, user_id, total_watch_time_seconds
  ) VALUES (
    p_video_id, p_user_id, p_watch_time_seconds
  )
  RETURNING id INTO v_session_id;

  -- Update video stats
  UPDATE video_uploads
  SET
    view_count = view_count + 1,
    total_watch_time_seconds = total_watch_time_seconds + p_watch_time_seconds,
    updated_at = NOW()
  WHERE id = p_video_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update engagement heatmap
CREATE OR REPLACE FUNCTION update_engagement_heatmap(
  p_video_id UUID,
  p_position_seconds NUMERIC,
  p_event_type VARCHAR
)
RETURNS VOID AS $$
DECLARE
  v_bucket_size INTEGER := 10; -- 10 second buckets
  v_bucket_start NUMERIC;
  v_bucket_end NUMERIC;
BEGIN
  v_bucket_start := FLOOR(p_position_seconds / v_bucket_size) * v_bucket_size;
  v_bucket_end := v_bucket_start + v_bucket_size;

  INSERT INTO video_engagement_heatmap (
    video_id, time_bucket_start, time_bucket_end, view_count
  ) VALUES (
    p_video_id, v_bucket_start, v_bucket_end, 1
  )
  ON CONFLICT (video_id, time_bucket_start)
  DO UPDATE SET
    view_count = video_engagement_heatmap.view_count + 1,
    pause_count = video_engagement_heatmap.pause_count + CASE WHEN p_event_type = 'pause' THEN 1 ELSE 0 END,
    seek_from_count = video_engagement_heatmap.seek_from_count + CASE WHEN p_event_type = 'seek_from' THEN 1 ELSE 0 END,
    seek_to_count = video_engagement_heatmap.seek_to_count + CASE WHEN p_event_type = 'seek_to' THEN 1 ELSE 0 END,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate video completion rate
CREATE OR REPLACE FUNCTION calculate_video_completion_rate(p_video_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_completion_rate NUMERIC;
BEGIN
  SELECT
    AVG(completion_percent) / 100.0
  INTO v_completion_rate
  FROM video_watch_sessions
  WHERE video_id = p_video_id
    AND total_watch_time_seconds > 0;

  RETURN COALESCE(v_completion_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get optimal video quality for bandwidth
CREATE OR REPLACE FUNCTION get_optimal_quality(
  p_video_id UUID,
  p_bandwidth_kbps INTEGER
)
RETURNS video_quality AS $$
DECLARE
  v_quality video_quality;
BEGIN
  SELECT quality
  INTO v_quality
  FROM video_variants
  WHERE video_id = p_video_id
    AND is_ready = true
    AND bitrate <= p_bandwidth_kbps
  ORDER BY bitrate DESC
  LIMIT 1;

  RETURN COALESCE(v_quality, '360p'::video_quality);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 14. TRIGGERS
-- ========================================

-- Trigger: Update video completion rate
CREATE OR REPLACE FUNCTION trigger_update_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_uploads
  SET avg_completion_rate = calculate_video_completion_rate(NEW.video_id)
  WHERE id = NEW.video_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_watch_session_completed
AFTER UPDATE ON video_watch_sessions
FOR EACH ROW
WHEN (OLD.is_completed = false AND NEW.is_completed = true)
EXECUTE FUNCTION trigger_update_completion_rate();

-- ========================================
-- 15. VIEWS
-- ========================================

-- View: Video processing queue
CREATE OR REPLACE VIEW video_processing_queue AS
SELECT
  v.id,
  v.video_title,
  v.status,
  v.transcoding_progress,
  COUNT(tj.id) AS total_jobs,
  COUNT(tj.id) FILTER (WHERE tj.status = 'completed') AS completed_jobs,
  COUNT(tj.id) FILTER (WHERE tj.status = 'failed') AS failed_jobs,
  MIN(tj.created_at) AS oldest_job
FROM video_uploads v
LEFT JOIN transcoding_jobs tj ON v.id = tj.video_id
WHERE v.status IN ('queued', 'processing')
GROUP BY v.id, v.video_title, v.status, v.transcoding_progress
ORDER BY v.created_at ASC;

-- View: Video analytics dashboard
CREATE OR REPLACE VIEW video_analytics_dashboard AS
SELECT
  v.id,
  v.video_title,
  v.duration_seconds,
  v.view_count,
  v.total_watch_time_seconds,
  v.avg_completion_rate,
  COUNT(DISTINCT ws.user_id) AS unique_viewers,
  AVG(ws.completion_percent) AS avg_completion_percent,
  AVG(ws.total_watch_time_seconds) AS avg_watch_time,
  MAX(ws.started_at) AS last_viewed_at
FROM video_uploads v
LEFT JOIN video_watch_sessions ws ON v.id = ws.video_id
WHERE v.status = 'ready'
GROUP BY v.id, v.video_title, v.duration_seconds, v.view_count,
         v.total_watch_time_seconds, v.avg_completion_rate;

-- View: Popular video segments
CREATE OR REPLACE VIEW popular_video_segments AS
SELECT
  v.id AS video_id,
  v.video_title,
  h.time_bucket_start,
  h.time_bucket_end,
  h.engagement_score,
  h.view_count,
  h.replay_count,
  h.skip_count,
  ROUND((h.view_count::NUMERIC / NULLIF(v.view_count, 0)) * 100, 2) AS retention_rate
FROM video_engagement_heatmap h
JOIN video_uploads v ON h.video_id = v.id
WHERE v.view_count > 10
ORDER BY h.engagement_score DESC;

-- View: Transcoding job statistics
CREATE OR REPLACE VIEW transcoding_statistics AS
SELECT
  quality,
  status,
  COUNT(*) AS job_count,
  AVG(processing_time_seconds) AS avg_processing_time,
  AVG(progress_percent) AS avg_progress,
  SUM(CASE WHEN retry_count > 0 THEN 1 ELSE 0 END) AS jobs_with_retries
FROM transcoding_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY quality, status;

COMMENT ON SCHEMA public IS 'Video Processing & Streaming - Transcoding, adaptive streaming, analytics, CDN';
