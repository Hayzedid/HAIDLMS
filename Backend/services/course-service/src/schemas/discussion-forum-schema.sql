-- Discussion Forums & Q&A System Schema
-- Community engagement, peer learning, and instructor support

-- ========================================
-- 1. FORUM CATEGORIES
-- ========================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For organization-wide forums

  -- Category Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) NOT NULL,
  icon VARCHAR(50), -- Icon name for UI
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color

  -- Hierarchy
  parent_category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,

  -- Permissions
  is_public BOOLEAN DEFAULT false, -- Public forums visible to all
  requires_enrollment BOOLEAN DEFAULT true, -- Must be enrolled in course
  posting_allowed BOOLEAN DEFAULT true,
  is_qa_mode BOOLEAN DEFAULT false, -- Q&A mode (like Stack Overflow)

  -- Moderation
  is_moderated BOOLEAN DEFAULT false,
  moderator_ids UUID[], -- User IDs of moderators

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(course_id, slug)
);

CREATE INDEX idx_forum_categories_course ON forum_categories(course_id);
CREATE INDEX idx_forum_categories_org ON forum_categories(organization_id);
CREATE INDEX idx_forum_categories_parent ON forum_categories(parent_category_id);

-- ========================================
-- 2. DISCUSSION THREADS
-- ========================================

CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Thread Details
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'markdown', -- 'markdown', 'html', 'plaintext'

  -- Thread Type
  thread_type VARCHAR(50) DEFAULT 'discussion', -- 'discussion', 'question', 'announcement'
  tags TEXT[], -- Array of tags for filtering

  -- Question-specific (for Q&A mode)
  is_question BOOLEAN DEFAULT false,
  has_accepted_answer BOOLEAN DEFAULT false,
  accepted_answer_id UUID, -- Reference to reply
  bounty_points INTEGER DEFAULT 0, -- Gamification points offered

  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- No new replies
  is_closed BOOLEAN DEFAULT false, -- Marked as resolved
  is_deleted BOOLEAN DEFAULT false, -- Soft delete
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_count INTEGER DEFAULT 0,
  moderation_status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'spam'
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  moderation_notes TEXT,

  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  -- Timestamps
  last_activity_at TIMESTAMP DEFAULT NOW(),
  last_reply_at TIMESTAMP,
  last_reply_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threads_category ON discussion_threads(category_id);
CREATE INDEX idx_threads_author ON discussion_threads(author_id);
CREATE INDEX idx_threads_type ON discussion_threads(thread_type);
CREATE INDEX idx_threads_question ON discussion_threads(is_question, has_accepted_answer);
CREATE INDEX idx_threads_activity ON discussion_threads(last_activity_at DESC);
CREATE INDEX idx_threads_tags ON discussion_threads USING GIN(tags);
CREATE INDEX idx_threads_moderation ON discussion_threads(moderation_status);

-- ========================================
-- 3. THREAD REPLIES
-- ========================================

CREATE TABLE IF NOT EXISTS thread_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES thread_replies(id) ON DELETE CASCADE, -- For nested replies

  -- Reply Content
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'markdown',

  -- Question Answers
  is_answer BOOLEAN DEFAULT false, -- Potential answer to question
  is_accepted_answer BOOLEAN DEFAULT false, -- Accepted by question author
  accepted_at TIMESTAMP,

  -- Status
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_count INTEGER DEFAULT 0,
  moderation_status VARCHAR(20) DEFAULT 'approved',
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,

  -- Engagement
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  is_instructor_reply BOOLEAN DEFAULT false, -- Mark instructor responses
  is_ai_reply BOOLEAN DEFAULT false, -- AI tutor responses

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON thread_replies(thread_id);
CREATE INDEX idx_replies_author ON thread_replies(author_id);
CREATE INDEX idx_replies_parent ON thread_replies(parent_reply_id);
CREATE INDEX idx_replies_created ON thread_replies(created_at DESC);
CREATE INDEX idx_replies_answer ON thread_replies(is_answer, is_accepted_answer);

-- ========================================
-- 4. VOTES (Upvotes/Downvotes)
-- ========================================

CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Votable entity (thread or reply)
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES thread_replies(id) ON DELETE CASCADE,

  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),

  created_at TIMESTAMP DEFAULT NOW(),

  -- User can only vote once per item
  CONSTRAINT unique_thread_vote UNIQUE (user_id, thread_id),
  CONSTRAINT unique_reply_vote UNIQUE (user_id, reply_id),

  -- Must vote on either thread or reply, not both
  CONSTRAINT vote_target_check CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX idx_votes_user ON forum_votes(user_id);
CREATE INDEX idx_votes_thread ON forum_votes(thread_id);
CREATE INDEX idx_votes_reply ON forum_votes(reply_id);

-- ========================================
-- 5. THREAD FOLLOWERS
-- ========================================

CREATE TABLE IF NOT EXISTS thread_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification Preferences
  notify_on_reply BOOLEAN DEFAULT true,
  notify_on_answer BOOLEAN DEFAULT true,

  followed_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(thread_id, user_id)
);

CREATE INDEX idx_followers_thread ON thread_followers(thread_id);
CREATE INDEX idx_followers_user ON thread_followers(user_id);

-- ========================================
-- 6. FLAGGED CONTENT
-- ========================================

CREATE TABLE IF NOT EXISTS forum_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flagger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Flaggable entity
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES thread_replies(id) ON DELETE CASCADE,

  -- Flag Details
  flag_reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'harassment', 'off-topic', 'other'
  flag_description TEXT,

  -- Resolution
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Can only flag once
  CONSTRAINT unique_thread_flag UNIQUE (flagger_id, thread_id),
  CONSTRAINT unique_reply_flag UNIQUE (flagger_id, reply_id),

  CONSTRAINT flag_target_check CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX idx_flags_flagger ON forum_flags(flagger_id);
CREATE INDEX idx_flags_thread ON forum_flags(thread_id);
CREATE INDEX idx_flags_reply ON forum_flags(reply_id);
CREATE INDEX idx_flags_status ON forum_flags(status);

-- ========================================
-- 7. USER REPUTATION (Gamification)
-- ========================================

CREATE TABLE IF NOT EXISTS forum_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- Null = global reputation

  -- Reputation Points
  total_points INTEGER DEFAULT 0,

  -- Activity Counts
  threads_created INTEGER DEFAULT 0,
  replies_posted INTEGER DEFAULT 0,
  answers_accepted INTEGER DEFAULT 0, -- As question author
  best_answers INTEGER DEFAULT 0, -- Their answers accepted
  helpful_votes_received INTEGER DEFAULT 0,

  -- Achievements
  reputation_level INTEGER DEFAULT 1,
  reputation_rank VARCHAR(50), -- 'Novice', 'Contributor', 'Expert', 'Master'
  badges_earned TEXT[],

  -- Moderation
  helpful_flags INTEGER DEFAULT 0,

  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_reputation_user ON forum_reputation(user_id);
CREATE INDEX idx_reputation_course ON forum_reputation(course_id);
CREATE INDEX idx_reputation_points ON forum_reputation(total_points DESC);

-- ========================================
-- 8. REPUTATION HISTORY
-- ========================================

CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Point Change
  points_change INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'thread_created', 'reply_posted', 'upvote_received', etc.
  description TEXT,

  -- Related Entities
  thread_id UUID REFERENCES discussion_threads(id) ON DELETE SET NULL,
  reply_id UUID REFERENCES thread_replies(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rep_history_user ON reputation_history(user_id);
CREATE INDEX idx_rep_history_created ON reputation_history(created_at DESC);

-- ========================================
-- 9. TRIGGERS
-- ========================================

-- Trigger: Update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE discussion_threads
    SET
      reply_count = reply_count + 1,
      last_activity_at = NOW(),
      last_reply_at = NOW(),
      last_reply_by = NEW.author_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE discussion_threads
    SET reply_count = reply_count - 1
    WHERE id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_reply_count
AFTER INSERT OR UPDATE ON thread_replies
FOR EACH ROW
EXECUTE FUNCTION update_thread_reply_count();

-- Trigger: Update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update thread votes
    IF NEW.thread_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE discussion_threads
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.thread_id;
      ELSE
        UPDATE discussion_threads
        SET downvote_count = downvote_count + 1
        WHERE id = NEW.thread_id;
      END IF;
    END IF;

    -- Update reply votes
    IF NEW.reply_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE thread_replies
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.reply_id;
      ELSE
        UPDATE thread_replies
        SET downvote_count = downvote_count + 1
        WHERE id = NEW.reply_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Revert vote counts on deletion
    IF OLD.thread_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE discussion_threads
        SET upvote_count = upvote_count - 1
        WHERE id = OLD.thread_id;
      ELSE
        UPDATE discussion_threads
        SET downvote_count = downvote_count - 1
        WHERE id = OLD.thread_id;
      END IF;
    END IF;

    IF OLD.reply_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE thread_replies
        SET upvote_count = upvote_count - 1
        WHERE id = OLD.reply_id;
      ELSE
        UPDATE thread_replies
        SET downvote_count = downvote_count - 1
        WHERE id = OLD.reply_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT OR DELETE ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_counts();

-- Trigger: Update follower count
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_threads
    SET follower_count = follower_count + 1
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_threads
    SET follower_count = follower_count - 1
    WHERE id = OLD.thread_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR DELETE ON thread_followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_count();

-- Trigger: Award reputation for activity
CREATE OR REPLACE FUNCTION award_reputation()
RETURNS TRIGGER AS $$
DECLARE
  points INTEGER := 0;
  action_desc TEXT;
BEGIN
  -- Thread created: +5 points
  IF TG_TABLE_NAME = 'discussion_threads' AND TG_OP = 'INSERT' THEN
    points := 5;
    action_desc := 'Created thread: ' || NEW.title;

    INSERT INTO reputation_history (user_id, points_change, action_type, description, thread_id)
    VALUES (NEW.author_id, points, 'thread_created', action_desc, NEW.id);

    UPDATE forum_reputation
    SET
      total_points = total_points + points,
      threads_created = threads_created + 1,
      updated_at = NOW()
    WHERE user_id = NEW.author_id
      AND (course_id IS NULL OR course_id = (SELECT course_id FROM forum_categories WHERE id = NEW.category_id));

  -- Reply posted: +2 points
  ELSIF TG_TABLE_NAME = 'thread_replies' AND TG_OP = 'INSERT' THEN
    points := 2;
    action_desc := 'Posted reply';

    INSERT INTO reputation_history (user_id, points_change, action_type, description, reply_id)
    VALUES (NEW.author_id, points, 'reply_posted', action_desc, NEW.id);

    UPDATE forum_reputation
    SET
      total_points = total_points + points,
      replies_posted = replies_posted + 1,
      updated_at = NOW()
    WHERE user_id = NEW.author_id;

  -- Answer accepted: +15 points to answer author
  ELSIF TG_TABLE_NAME = 'thread_replies' AND TG_OP = 'UPDATE'
        AND OLD.is_accepted_answer = false AND NEW.is_accepted_answer = true THEN
    points := 15;
    action_desc := 'Answer accepted';

    INSERT INTO reputation_history (user_id, points_change, action_type, description, reply_id)
    VALUES (NEW.author_id, points, 'answer_accepted', action_desc, NEW.id);

    UPDATE forum_reputation
    SET
      total_points = total_points + points,
      best_answers = best_answers + 1,
      updated_at = NOW()
    WHERE user_id = NEW.author_id;

  -- Upvote received: +1 point
  ELSIF TG_TABLE_NAME = 'forum_votes' AND TG_OP = 'INSERT' AND NEW.vote_type = 'upvote' THEN
    points := 1;
    action_desc := 'Received upvote';

    DECLARE
      content_author_id UUID;
    BEGIN
      IF NEW.thread_id IS NOT NULL THEN
        SELECT author_id INTO content_author_id FROM discussion_threads WHERE id = NEW.thread_id;
      ELSIF NEW.reply_id IS NOT NULL THEN
        SELECT author_id INTO content_author_id FROM thread_replies WHERE id = NEW.reply_id;
      END IF;

      IF content_author_id IS NOT NULL THEN
        INSERT INTO reputation_history (user_id, points_change, action_type, description)
        VALUES (content_author_id, points, 'upvote_received', action_desc);

        UPDATE forum_reputation
        SET
          total_points = total_points + points,
          helpful_votes_received = helpful_votes_received + 1,
          updated_at = NOW()
        WHERE user_id = content_author_id;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_reputation_threads
AFTER INSERT OR UPDATE ON discussion_threads
FOR EACH ROW
EXECUTE FUNCTION award_reputation();

CREATE TRIGGER trigger_award_reputation_replies
AFTER INSERT OR UPDATE ON thread_replies
FOR EACH ROW
EXECUTE FUNCTION award_reputation();

CREATE TRIGGER trigger_award_reputation_votes
AFTER INSERT ON forum_votes
FOR EACH ROW
EXECUTE FUNCTION award_reputation();

-- ========================================
-- 10. VIEWS
-- ========================================

-- View: Active threads with engagement metrics
CREATE OR REPLACE VIEW active_threads AS
SELECT
  t.*,
  u.full_name AS author_name,
  u.avatar_url AS author_avatar,
  fc.name AS category_name,
  fc.slug AS category_slug,
  COALESCE(r.total_points, 0) AS author_reputation,
  (t.upvote_count - t.downvote_count) AS score
FROM discussion_threads t
JOIN users u ON t.author_id = u.id
JOIN forum_categories fc ON t.category_id = fc.id
LEFT JOIN forum_reputation r ON t.author_id = r.user_id AND r.course_id IS NULL
WHERE t.is_deleted = false
  AND t.moderation_status = 'approved';

-- View: Unanswered questions
CREATE OR REPLACE VIEW unanswered_questions AS
SELECT
  t.*,
  u.full_name AS author_name,
  fc.name AS category_name
FROM discussion_threads t
JOIN users u ON t.author_id = u.id
JOIN forum_categories fc ON t.category_id = fc.id
WHERE t.is_question = true
  AND t.has_accepted_answer = false
  AND t.is_deleted = false
  AND t.is_closed = false
  AND t.moderation_status = 'approved'
ORDER BY t.bounty_points DESC, t.created_at DESC;

-- View: Top contributors (leaderboard)
CREATE OR REPLACE VIEW top_contributors AS
SELECT
  r.user_id,
  u.full_name,
  u.avatar_url,
  r.total_points,
  r.reputation_level,
  r.reputation_rank,
  r.threads_created,
  r.replies_posted,
  r.best_answers,
  r.helpful_votes_received,
  ROW_NUMBER() OVER (ORDER BY r.total_points DESC) AS rank
FROM forum_reputation r
JOIN users u ON r.user_id = u.id
WHERE r.course_id IS NULL
ORDER BY r.total_points DESC;

COMMENT ON SCHEMA public IS 'Discussion Forums & Q&A System - Community engagement and peer learning';
