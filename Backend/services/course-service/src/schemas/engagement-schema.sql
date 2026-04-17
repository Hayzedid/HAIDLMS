-- ============================================================================
-- ENGAGEMENT & SOCIAL FEATURES SCHEMA
-- ============================================================================
-- Tables for user profiles, follows, likes, shares, kudos, activity feeds,
-- and engagement analytics

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Profile Info
  bio TEXT,
  tagline VARCHAR(200),
  location VARCHAR(200),
  website_url VARCHAR(500),
  twitter_handle VARCHAR(100),
  linkedin_url VARCHAR(500),
  github_username VARCHAR(100),

  -- Profile Settings
  is_public BOOLEAN DEFAULT true,
  show_email BOOLEAN DEFAULT false,
  show_progress BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  allow_follows BOOLEAN DEFAULT true,

  -- Stats (denormalized for quick access)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_kudos_received INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_public ON user_profiles(is_public) WHERE is_public = true;

-- ============================================================================
-- USER FOLLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- ============================================================================
-- ENGAGEMENT ACTIVITIES
-- ============================================================================

CREATE TYPE engagement_type AS ENUM (
  'like',
  'view',
  'bookmark',
  'share',
  'comment',
  'upvote',
  'downvote'
);

CREATE TYPE engagement_target_type AS ENUM (
  'course',
  'lesson',
  'assessment',
  'forum_post',
  'forum_reply',
  'portfolio_project',
  'achievement',
  'user_profile'
);

CREATE TABLE IF NOT EXISTS engagement_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  engagement_type engagement_type NOT NULL,
  target_type engagement_target_type NOT NULL,
  target_id UUID NOT NULL,

  -- Optional metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, engagement_type, target_type, target_id)
);

CREATE INDEX idx_engagement_user ON engagement_activities(user_id);
CREATE INDEX idx_engagement_target ON engagement_activities(target_type, target_id);
CREATE INDEX idx_engagement_type ON engagement_activities(engagement_type);
CREATE INDEX idx_engagement_created ON engagement_activities(created_at DESC);

-- ============================================================================
-- KUDOS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  kudos_type VARCHAR(100) NOT NULL, -- 'helpful', 'inspiring', 'knowledgeable', 'supportive', etc.
  message TEXT,

  -- Context
  related_type VARCHAR(50), -- 'forum_post', 'peer_review', etc.
  related_id UUID,

  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),

  CHECK (sender_id != recipient_id)
);

CREATE INDEX idx_kudos_sender ON kudos(sender_id);
CREATE INDEX idx_kudos_recipient ON kudos(recipient_id, created_at DESC);
CREATE INDEX idx_kudos_type ON kudos(kudos_type);
CREATE INDEX idx_kudos_public ON kudos(is_public) WHERE is_public = true;

-- ============================================================================
-- CONTENT SHARES
-- ============================================================================

CREATE TYPE share_platform AS ENUM (
  'twitter',
  'facebook',
  'linkedin',
  'whatsapp',
  'email',
  'copy_link',
  'internal'
);

CREATE TABLE IF NOT EXISTS content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  target_type engagement_target_type NOT NULL,
  target_id UUID NOT NULL,

  platform share_platform NOT NULL,
  share_url TEXT,
  share_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_shares_user ON content_shares(user_id);
CREATE INDEX idx_content_shares_target ON content_shares(target_type, target_id);
CREATE INDEX idx_content_shares_platform ON content_shares(platform);

-- ============================================================================
-- USER BOOKMARKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  target_type engagement_target_type NOT NULL,
  target_id UUID NOT NULL,

  -- Organization
  folder_name VARCHAR(200),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_folder ON user_bookmarks(user_id, folder_name);

-- ============================================================================
-- ACTIVITY FEED
-- ============================================================================

CREATE TYPE activity_type AS ENUM (
  'course_enrolled',
  'course_completed',
  'lesson_completed',
  'assessment_passed',
  'achievement_earned',
  'badge_earned',
  'milestone_reached',
  'level_up',
  'streak_milestone',
  'project_published',
  'forum_post_created',
  'peer_review_completed',
  'certificate_earned',
  'kudos_received',
  'competition_won',
  'user_followed'
);

CREATE TABLE IF NOT EXISTS activity_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  activity_type activity_type NOT NULL,
  activity_data JSONB NOT NULL,

  -- Visibility
  is_public BOOLEAN DEFAULT true,

  -- Engagement tracking
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_feeds_user ON activity_feeds(user_id, created_at DESC);
CREATE INDEX idx_activity_feeds_public ON activity_feeds(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX idx_activity_feeds_type ON activity_feeds(activity_type);

-- ============================================================================
-- ENGAGEMENT SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Score Components
  activity_score INTEGER DEFAULT 0,
  social_score INTEGER DEFAULT 0,
  contribution_score INTEGER DEFAULT 0,
  consistency_score INTEGER DEFAULT 0,

  -- Overall Score
  total_score INTEGER DEFAULT 0,
  score_rank INTEGER,
  score_percentile NUMERIC(5,2),

  -- Last Updated
  last_calculated_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_engagement_scores_user ON engagement_scores(user_id);
CREATE INDEX idx_engagement_scores_total ON engagement_scores(total_score DESC);
CREATE INDEX idx_engagement_scores_rank ON engagement_scores(score_rank);

-- ============================================================================
-- ENGAGEMENT ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engagement_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Activity Metrics
  lessons_completed INTEGER DEFAULT 0,
  assessments_taken INTEGER DEFAULT 0,
  forum_posts INTEGER DEFAULT 0,
  forum_replies INTEGER DEFAULT 0,
  peer_reviews INTEGER DEFAULT 0,

  -- Social Metrics
  likes_given INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  shares_made INTEGER DEFAULT 0,
  kudos_given INTEGER DEFAULT 0,
  kudos_received INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,

  -- Engagement Metrics
  session_duration_minutes INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_engagement_analytics_user ON engagement_analytics(user_id, date DESC);
CREATE INDEX idx_engagement_analytics_date ON engagement_analytics(date DESC);

-- ============================================================================
-- USER ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  activity_type VARCHAR(100) NOT NULL,
  activity_details JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON user_activity_log(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Follow a user
CREATE OR REPLACE FUNCTION follow_user(
  p_follower_id UUID,
  p_following_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_profile user_profiles%ROWTYPE;
BEGIN
  -- Check if following user allows follows
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_following_id;

  IF NOT FOUND OR NOT v_profile.allow_follows THEN
    RAISE EXCEPTION 'User does not allow follows';
  END IF;

  -- Create follow relationship
  INSERT INTO user_follows (follower_id, following_id)
  VALUES (p_follower_id, p_following_id)
  ON CONFLICT DO NOTHING;

  -- Update follower counts
  UPDATE user_profiles SET following_count = following_count + 1, updated_at = NOW()
  WHERE user_id = p_follower_id;

  UPDATE user_profiles SET followers_count = followers_count + 1, updated_at = NOW()
  WHERE user_id = p_following_id;

  -- Add to activity feed
  INSERT INTO activity_feeds (user_id, activity_type, activity_data, is_public)
  VALUES (p_follower_id, 'user_followed', jsonb_build_object(
    'following_id', p_following_id
  ), true);

  -- Update engagement analytics
  INSERT INTO engagement_analytics (user_id, date, new_followers)
  VALUES (p_following_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    new_followers = engagement_analytics.new_followers + 1;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Unfollow a user
CREATE OR REPLACE FUNCTION unfollow_user(
  p_follower_id UUID,
  p_following_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_follows
  WHERE follower_id = p_follower_id AND following_id = p_following_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update follower counts
  UPDATE user_profiles SET following_count = following_count - 1, updated_at = NOW()
  WHERE user_id = p_follower_id;

  UPDATE user_profiles SET followers_count = followers_count - 1, updated_at = NOW()
  WHERE user_id = p_following_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Record engagement activity
CREATE OR REPLACE FUNCTION record_engagement(
  p_user_id UUID,
  p_engagement_type engagement_type,
  p_target_type engagement_target_type,
  p_target_id UUID,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_engagement_id UUID;
  v_date DATE := CURRENT_DATE;
BEGIN
  -- Insert engagement activity
  INSERT INTO engagement_activities (user_id, engagement_type, target_type, target_id, metadata)
  VALUES (p_user_id, p_engagement_type, p_target_type, p_target_id, p_metadata)
  ON CONFLICT (user_id, engagement_type, target_type, target_id) DO UPDATE SET
    created_at = NOW(),
    metadata = COALESCE(p_metadata, engagement_activities.metadata)
  RETURNING id INTO v_engagement_id;

  -- Update engagement analytics based on type
  IF p_engagement_type = 'like' THEN
    INSERT INTO engagement_analytics (user_id, date, likes_given)
    VALUES (p_user_id, v_date, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET
      likes_given = engagement_analytics.likes_given + 1;
  ELSIF p_engagement_type = 'share' THEN
    INSERT INTO engagement_analytics (user_id, date, shares_made)
    VALUES (p_user_id, v_date, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET
      shares_made = engagement_analytics.shares_made + 1;
  END IF;

  RETURN v_engagement_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_activity_score INTEGER := 0;
  v_social_score INTEGER := 0;
  v_contribution_score INTEGER := 0;
  v_consistency_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_lessons_count INTEGER;
  v_assessments_count INTEGER;
  v_forum_posts_count INTEGER;
  v_peer_reviews_count INTEGER;
  v_likes_received INTEGER;
  v_kudos_count INTEGER;
  v_followers_count INTEGER;
  v_streak_days INTEGER;
  v_active_days INTEGER;
BEGIN
  -- Activity Score (lessons, assessments, etc.)
  SELECT COUNT(*) INTO v_lessons_count FROM lesson_progress WHERE user_id = p_user_id AND status = 'completed';
  SELECT COUNT(*) INTO v_assessments_count FROM assessment_attempts WHERE user_id = p_user_id AND status = 'completed';
  v_activity_score := (v_lessons_count * 10) + (v_assessments_count * 20);

  -- Social Score (followers, likes, kudos)
  SELECT followers_count, total_likes_received, total_kudos_received
  INTO v_followers_count, v_likes_received, v_kudos_count
  FROM user_profiles WHERE user_id = p_user_id;

  v_social_score := (COALESCE(v_followers_count, 0) * 5) +
                    (COALESCE(v_likes_received, 0) * 2) +
                    (COALESCE(v_kudos_count, 0) * 10);

  -- Contribution Score (forum, peer reviews)
  SELECT COUNT(*) INTO v_forum_posts_count FROM forum_posts WHERE author_id = p_user_id;
  SELECT COUNT(*) INTO v_peer_reviews_count FROM peer_reviews WHERE reviewer_id = p_user_id;
  v_contribution_score := (COALESCE(v_forum_posts_count, 0) * 15) +
                          (COALESCE(v_peer_reviews_count, 0) * 25);

  -- Consistency Score (streak, active days)
  SELECT current_streak INTO v_streak_days FROM user_streaks WHERE user_id = p_user_id;
  SELECT COUNT(DISTINCT date) INTO v_active_days
  FROM engagement_analytics
  WHERE user_id = p_user_id AND date >= CURRENT_DATE - INTERVAL '30 days';

  v_consistency_score := (COALESCE(v_streak_days, 0) * 10) + (COALESCE(v_active_days, 0) * 5);

  -- Total Score
  v_total_score := v_activity_score + v_social_score + v_contribution_score + v_consistency_score;

  -- Upsert score
  INSERT INTO engagement_scores (
    user_id, activity_score, social_score, contribution_score,
    consistency_score, total_score, last_calculated_at
  )
  VALUES (
    p_user_id, v_activity_score, v_social_score, v_contribution_score,
    v_consistency_score, v_total_score, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    activity_score = v_activity_score,
    social_score = v_social_score,
    contribution_score = v_contribution_score,
    consistency_score = v_consistency_score,
    total_score = v_total_score,
    last_calculated_at = NOW(),
    updated_at = NOW();

  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update profile stats on kudos
CREATE OR REPLACE FUNCTION update_kudos_stats() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET
      total_kudos_received = total_kudos_received + 1,
      updated_at = NOW()
    WHERE user_id = NEW.recipient_id;

    -- Update analytics
    INSERT INTO engagement_analytics (user_id, date, kudos_given)
    VALUES (NEW.sender_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET
      kudos_given = engagement_analytics.kudos_given + 1;

    INSERT INTO engagement_analytics (user_id, date, kudos_received)
    VALUES (NEW.recipient_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET
      kudos_received = engagement_analytics.kudos_received + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kudos_stats
  AFTER INSERT ON kudos
  FOR EACH ROW EXECUTE FUNCTION update_kudos_stats();

-- Update like counts on activity feeds
CREATE OR REPLACE FUNCTION update_activity_feed_likes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.engagement_type = 'like' THEN
    -- Increment like count on related activity feed if it exists
    UPDATE activity_feeds SET likes_count = likes_count + 1
    WHERE id = NEW.target_id::UUID AND target_type = 'achievement';
  ELSIF TG_OP = 'DELETE' AND OLD.engagement_type = 'like' THEN
    UPDATE activity_feeds SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.target_id::UUID AND target_type = 'achievement';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activity_feed_likes
  AFTER INSERT OR DELETE ON engagement_activities
  FOR EACH ROW
  WHEN (NEW.engagement_type = 'like' OR OLD.engagement_type = 'like')
  EXECUTE FUNCTION update_activity_feed_likes();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User feed (activities from followed users)
CREATE OR REPLACE VIEW user_feed AS
SELECT
  af.id,
  af.user_id,
  af.activity_type,
  af.activity_data,
  af.is_public,
  af.likes_count,
  af.comments_count,
  af.created_at,
  u.full_name,
  u.email,
  up.tagline,
  EXISTS(
    SELECT 1 FROM engagement_activities ea
    WHERE ea.target_id = af.id::TEXT::UUID
    AND ea.engagement_type = 'like'
  ) as is_liked_by_current_user
FROM activity_feeds af
JOIN users u ON af.user_id = u.id
LEFT JOIN user_profiles up ON af.user_id = up.user_id
WHERE af.is_public = true
ORDER BY af.created_at DESC;

-- Trending content (most engaged)
CREATE OR REPLACE VIEW trending_content AS
SELECT
  target_type,
  target_id,
  COUNT(*) FILTER (WHERE engagement_type = 'like') as likes_count,
  COUNT(*) FILTER (WHERE engagement_type = 'view') as views_count,
  COUNT(*) FILTER (WHERE engagement_type = 'share') as shares_count,
  COUNT(*) FILTER (WHERE engagement_type = 'bookmark') as bookmarks_count,
  COUNT(*) as total_engagements,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_engaged_at
FROM engagement_activities
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY target_type, target_id
ORDER BY total_engagements DESC, unique_users DESC;

-- Top engaged users
CREATE OR REPLACE VIEW top_engaged_users AS
SELECT
  es.user_id,
  es.total_score,
  es.score_rank,
  es.activity_score,
  es.social_score,
  es.contribution_score,
  es.consistency_score,
  u.full_name,
  up.tagline,
  up.followers_count,
  up.total_likes_received,
  up.total_kudos_received
FROM engagement_scores es
JOIN users u ON es.user_id = u.id
LEFT JOIN user_profiles up ON es.user_id = up.user_id
ORDER BY es.total_score DESC;

-- ============================================================================
-- SEED DATA (Optional starter kudos types)
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user profiles with bio, social links, and privacy settings';
COMMENT ON TABLE user_follows IS 'User follow relationships for social features';
COMMENT ON TABLE engagement_activities IS 'Tracks likes, views, shares, bookmarks on various content';
COMMENT ON TABLE kudos IS 'Peer recognition and appreciation system';
COMMENT ON TABLE content_shares IS 'Tracks content sharing across platforms';
COMMENT ON TABLE user_bookmarks IS 'User-saved content organized in folders';
COMMENT ON TABLE activity_feeds IS 'User activity stream for social feed';
COMMENT ON TABLE engagement_scores IS 'Calculated engagement scores for user ranking';
COMMENT ON TABLE engagement_analytics IS 'Daily engagement metrics per user';
COMMENT ON TABLE user_activity_log IS 'Comprehensive log of user activities';
