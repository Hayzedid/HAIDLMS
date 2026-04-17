-- ============================================================================
-- HAIDLMS: STREAKS & DAILY CHALLENGES SCHEMA
-- ============================================================================
-- This schema handles daily learning streaks, daily challenges, streak rewards,
-- and engagement consistency tracking
-- ============================================================================

-- ============================================================================
-- STREAK TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Current streak
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Dates
  last_activity_date DATE,
  streak_start_date DATE,
  longest_streak_start_date DATE,
  longest_streak_end_date DATE,

  -- Streak protection
  streak_freezes_available INTEGER DEFAULT 0,
  streak_freezes_used INTEGER DEFAULT 0,
  last_freeze_used_date DATE,

  -- Milestones
  milestones_reached JSONB DEFAULT '[]', -- [7, 30, 100, 365]

  -- Stats
  total_active_days INTEGER DEFAULT 0,
  weekly_streak_count INTEGER DEFAULT 0, -- Days active this week
  monthly_streak_count INTEGER DEFAULT 0, -- Days active this month

  -- Notifications
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '20:00:00',
  last_reminder_sent_at TIMESTAMP,

  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX idx_user_streaks_longest ON user_streaks(longest_streak DESC);
CREATE INDEX idx_user_streaks_last_activity ON user_streaks(last_activity_date);

-- ============================================================================
-- STREAK ACTIVITIES
-- ============================================================================

-- Log of activities that count toward streaks
CREATE TABLE IF NOT EXISTS streak_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity details
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- lesson_complete, quiz_pass, video_watch, assignment_submit
  activity_count INTEGER DEFAULT 1, -- Number of qualifying activities this day

  -- Related entities
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  assessment_id UUID REFERENCES assessments(id),

  -- Streak impact
  contributed_to_streak BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_streak_activities_user ON streak_activities(user_id);
CREATE INDEX idx_streak_activities_date ON streak_activities(activity_date DESC);
CREATE INDEX idx_streak_activities_user_date ON streak_activities(user_id, activity_date DESC);

-- ============================================================================
-- STREAK MILESTONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS streak_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Milestone details
  milestone_name VARCHAR(100) NOT NULL,
  milestone_code VARCHAR(50) UNIQUE NOT NULL,
  days_required INTEGER NOT NULL,

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES digital_badges(id),
  streak_freeze_reward INTEGER DEFAULT 0, -- Extra freezes awarded

  -- Display
  icon_url TEXT,
  celebration_message TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streak_milestones_days ON streak_milestones(days_required);
CREATE INDEX idx_streak_milestones_code ON streak_milestones(milestone_code);

-- ============================================================================
-- USER MILESTONE ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streak_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES streak_milestones(id),

  -- Achievement details
  achieved_at TIMESTAMP DEFAULT NOW(),
  streak_count_at_achievement INTEGER NOT NULL,

  -- Rewards claimed
  rewards_claimed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, milestone_id)
);

CREATE INDEX idx_user_streak_milestones_user ON user_streak_milestones(user_id);
CREATE INDEX idx_user_streak_milestones_achieved ON user_streak_milestones(achieved_at DESC);

-- ============================================================================
-- DAILY CHALLENGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Challenge details
  challenge_name VARCHAR(100) NOT NULL,
  challenge_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,

  -- Challenge type
  challenge_type VARCHAR(50) NOT NULL, -- complete_lessons, pass_quiz, watch_videos, post_comment, help_peer
  difficulty VARCHAR(20) DEFAULT 'easy', -- easy, medium, hard

  -- Requirements
  target_count INTEGER NOT NULL, -- Number of activities needed
  time_limit_minutes INTEGER, -- Optional time constraint

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  bonus_multiplier NUMERIC(3, 2) DEFAULT 1.0, -- Multiplier if completed early/perfectly

  -- Rotation
  rotation_group VARCHAR(50), -- Group challenges for rotation (e.g., 'beginner', 'advanced')
  weight INTEGER DEFAULT 1, -- Probability weight for selection

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_challenges_code ON daily_challenges(challenge_code);
CREATE INDEX idx_daily_challenges_type ON daily_challenges(challenge_type);
CREATE INDEX idx_daily_challenges_active ON daily_challenges(is_active);

-- ============================================================================
-- USER DAILY CHALLENGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id),

  -- Assignment
  assigned_date DATE NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- Progress
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  progress_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Completion
  status VARCHAR(50) DEFAULT 'active', -- active, completed, expired, skipped
  completed_at TIMESTAMP,
  completion_time_seconds INTEGER, -- Time taken to complete

  -- Rewards
  points_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  bonus_applied BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, challenge_id, assigned_date)
);

CREATE INDEX idx_user_daily_challenges_user ON user_daily_challenges(user_id);
CREATE INDEX idx_user_daily_challenges_status ON user_daily_challenges(status);
CREATE INDEX idx_user_daily_challenges_date ON user_daily_challenges(assigned_date DESC);
CREATE INDEX idx_user_daily_challenges_active ON user_daily_challenges(user_id, status, assigned_date);

-- ============================================================================
-- CHALLENGE PROGRESS LOG
-- ============================================================================

-- Detailed log of challenge progress events
CREATE TABLE IF NOT EXISTS challenge_progress_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_challenge_id UUID NOT NULL REFERENCES user_daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Progress event
  progress_increment INTEGER NOT NULL,
  total_progress_after INTEGER NOT NULL,

  -- Related activity
  activity_type VARCHAR(50),
  activity_id UUID, -- ID of lesson, quiz, etc.

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_challenge_progress_user_challenge ON challenge_progress_log(user_challenge_id);
CREATE INDEX idx_challenge_progress_user ON challenge_progress_log(user_id);

-- ============================================================================
-- STREAK FREEZE LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS streak_freeze_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Freeze details
  freeze_date DATE NOT NULL,
  freeze_type VARCHAR(50) DEFAULT 'manual', -- manual, auto, earned

  -- Reason
  reason TEXT,

  -- Status
  was_successful BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_streak_freeze_log_user ON streak_freeze_log(user_id);
CREATE INDEX idx_streak_freeze_log_date ON streak_freeze_log(freeze_date DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Streak leaderboard (top current streaks)
CREATE OR REPLACE VIEW current_streak_leaders AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  us.current_streak,
  us.longest_streak,
  us.streak_start_date,
  us.total_active_days,
  ROW_NUMBER() OVER (ORDER BY us.current_streak DESC) as rank
FROM user_streaks us
JOIN users u ON us.user_id = u.id
WHERE us.current_streak > 0
ORDER BY us.current_streak DESC
LIMIT 100;

-- Active daily challenges summary
CREATE OR REPLACE VIEW active_daily_challenges_summary AS
SELECT
  dc.*,
  COUNT(udc.id) as total_assignments,
  COUNT(CASE WHEN udc.status = 'completed' THEN 1 END) as completed_count,
  ROUND(AVG(udc.progress_percentage), 2) as avg_progress,
  ROUND(COUNT(CASE WHEN udc.status = 'completed' THEN 1 END)::NUMERIC / NULLIF(COUNT(udc.id), 0) * 100, 2) as completion_rate
FROM daily_challenges dc
LEFT JOIN user_daily_challenges udc ON dc.id = udc.challenge_id AND udc.assigned_date = CURRENT_DATE
WHERE dc.is_active = true
GROUP BY dc.id;

-- User streak stats
CREATE OR REPLACE VIEW user_streak_stats AS
SELECT
  u.id as user_id,
  u.email,
  us.current_streak,
  us.longest_streak,
  us.total_active_days,
  us.weekly_streak_count,
  us.monthly_streak_count,
  us.streak_freezes_available,
  COUNT(DISTINCT usm.id) as milestones_achieved,
  (SELECT COUNT(*) FROM user_daily_challenges WHERE user_id = u.id AND status = 'completed') as challenges_completed
FROM users u
LEFT JOIN user_streaks us ON u.id = us.user_id
LEFT JOIN user_streak_milestones usm ON u.id = usm.user_id
GROUP BY u.id, u.email, us.current_streak, us.longest_streak, us.total_active_days, us.weekly_streak_count, us.monthly_streak_count, us.streak_freezes_available;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_activity_date DATE
)
RETURNS void AS $$
DECLARE
  v_streak RECORD;
  v_days_since_last_activity INTEGER;
  v_new_milestone INTEGER;
BEGIN
  -- Get or create user streak record
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;

  IF v_streak.id IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date, total_active_days)
    VALUES (p_user_id, 1, 1, p_activity_date, p_activity_date, 1);
    RETURN;
  END IF;

  -- Check if activity already logged for this date
  IF EXISTS (SELECT 1 FROM streak_activities WHERE user_id = p_user_id AND activity_date = p_activity_date) THEN
    RETURN; -- Already counted for today
  END IF;

  -- Calculate days since last activity
  v_days_since_last_activity := p_activity_date - v_streak.last_activity_date;

  IF v_days_since_last_activity = 1 THEN
    -- Consecutive day - increment streak
    UPDATE user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = p_activity_date,
        total_active_days = total_active_days + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Check for milestones
    SELECT days_required INTO v_new_milestone
    FROM streak_milestones
    WHERE days_required = v_streak.current_streak + 1 AND is_active = true;

    IF v_new_milestone IS NOT NULL THEN
      PERFORM award_streak_milestone(p_user_id, v_new_milestone);
    END IF;

  ELSIF v_days_since_last_activity = 0 THEN
    -- Same day activity - just update total days if needed
    RETURN;

  ELSIF v_days_since_last_activity = 2 AND v_streak.streak_freezes_available > 0 THEN
    -- 1 day gap - auto-use streak freeze if available
    UPDATE user_streaks
    SET current_streak = current_streak + 1,
        last_activity_date = p_activity_date,
        total_active_days = total_active_days + 1,
        streak_freezes_available = streak_freezes_available - 1,
        streak_freezes_used = streak_freezes_used + 1,
        last_freeze_used_date = p_activity_date - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log freeze usage
    INSERT INTO streak_freeze_log (user_id, freeze_date, freeze_type, reason)
    VALUES (p_user_id, p_activity_date - 1, 'auto', 'Automatic freeze for 1-day gap');

  ELSE
    -- Streak broken - reset
    UPDATE user_streaks
    SET current_streak = 1,
        last_activity_date = p_activity_date,
        streak_start_date = p_activity_date,
        total_active_days = total_active_days + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Update weekly and monthly counts
  UPDATE user_streaks
  SET weekly_streak_count = (
    SELECT COUNT(DISTINCT activity_date)
    FROM streak_activities
    WHERE user_id = p_user_id
      AND activity_date >= DATE_TRUNC('week', CURRENT_DATE)
  ),
  monthly_streak_count = (
    SELECT COUNT(DISTINCT activity_date)
    FROM streak_activities
    WHERE user_id = p_user_id
      AND activity_date >= DATE_TRUNC('month', CURRENT_DATE)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Award streak milestone
CREATE OR REPLACE FUNCTION award_streak_milestone(
  p_user_id UUID,
  p_days_required INTEGER
)
RETURNS void AS $$
DECLARE
  v_milestone RECORD;
  v_current_streak INTEGER;
BEGIN
  -- Get milestone
  SELECT * INTO v_milestone
  FROM streak_milestones
  WHERE days_required = p_days_required AND is_active = true;

  IF v_milestone.id IS NULL THEN
    RETURN;
  END IF;

  -- Get current streak
  SELECT current_streak INTO v_current_streak FROM user_streaks WHERE user_id = p_user_id;

  -- Record achievement
  INSERT INTO user_streak_milestones (user_id, milestone_id, streak_count_at_achievement)
  VALUES (p_user_id, v_milestone.id, v_current_streak)
  ON CONFLICT (user_id, milestone_id) DO NOTHING;

  -- Award points and XP
  IF v_milestone.points_reward > 0 OR v_milestone.xp_reward > 0 THEN
    PERFORM award_points(
      p_user_id,
      v_milestone.points_reward,
      v_milestone.xp_reward,
      'earned',
      'streak_milestone',
      v_milestone.id,
      'Streak milestone: ' || v_milestone.milestone_name
    );
  END IF;

  -- Award streak freezes
  IF v_milestone.streak_freeze_reward > 0 THEN
    UPDATE user_streaks
    SET streak_freezes_available = streak_freezes_available + v_milestone.streak_freeze_reward
    WHERE user_id = p_user_id;
  END IF;

  -- Award badge if configured
  IF v_milestone.badge_id IS NOT NULL THEN
    INSERT INTO badge_awards (badge_id, user_id, award_reason)
    VALUES (v_milestone.badge_id, p_user_id, 'Streak milestone: ' || v_milestone.milestone_name)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Assign daily challenges
CREATE OR REPLACE FUNCTION assign_daily_challenges(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_challenge RECORD;
  v_challenge_count INTEGER := 3; -- Number of daily challenges
  v_assigned_count INTEGER := 0;
BEGIN
  -- Check if challenges already assigned for today
  IF EXISTS (
    SELECT 1 FROM user_daily_challenges
    WHERE user_id = p_user_id AND assigned_date = CURRENT_DATE
  ) THEN
    RETURN;
  END IF;

  -- Assign random active challenges
  FOR v_challenge IN
    SELECT * FROM daily_challenges
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT v_challenge_count
  LOOP
    INSERT INTO user_daily_challenges (
      user_id, challenge_id, assigned_date, expires_at, target_progress
    ) VALUES (
      p_user_id,
      v_challenge.id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 day',
      v_challenge.target_count
    );

    v_assigned_count := v_assigned_count + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_type VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_user_challenge RECORD;
BEGIN
  -- Find active challenge of this type for today
  FOR v_user_challenge IN
    SELECT udc.*
    FROM user_daily_challenges udc
    JOIN daily_challenges dc ON udc.challenge_id = dc.id
    WHERE udc.user_id = p_user_id
      AND udc.assigned_date = CURRENT_DATE
      AND udc.status = 'active'
      AND dc.challenge_type = p_challenge_type
  LOOP
    -- Update progress
    UPDATE user_daily_challenges
    SET current_progress = LEAST(current_progress + p_increment, target_progress),
        progress_percentage = ROUND(LEAST((current_progress + p_increment)::NUMERIC / target_progress * 100, 100), 2),
        updated_at = NOW()
    WHERE id = v_user_challenge.id;

    -- Log progress
    INSERT INTO challenge_progress_log (user_challenge_id, user_id, progress_increment, total_progress_after)
    VALUES (v_user_challenge.id, p_user_id, p_increment, v_user_challenge.current_progress + p_increment);

    -- Check for completion
    IF v_user_challenge.current_progress + p_increment >= v_user_challenge.target_progress THEN
      PERFORM complete_daily_challenge(v_user_challenge.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Complete daily challenge
CREATE OR REPLACE FUNCTION complete_daily_challenge(p_user_challenge_id UUID)
RETURNS void AS $$
DECLARE
  v_user_challenge RECORD;
  v_challenge RECORD;
BEGIN
  -- Get challenge details
  SELECT udc.*, dc.points_reward, dc.xp_reward, dc.bonus_multiplier
  INTO v_user_challenge
  FROM user_daily_challenges udc
  JOIN daily_challenges dc ON udc.challenge_id = dc.id
  WHERE udc.id = p_user_challenge_id;

  IF v_user_challenge.status != 'active' THEN
    RETURN;
  END IF;

  -- Mark as completed
  UPDATE user_daily_challenges
  SET status = 'completed',
      completed_at = NOW(),
      points_earned = v_user_challenge.points_reward,
      xp_earned = v_user_challenge.xp_reward,
      updated_at = NOW()
  WHERE id = p_user_challenge_id;

  -- Award points and XP
  IF v_user_challenge.points_reward > 0 OR v_user_challenge.xp_reward > 0 THEN
    PERFORM award_points(
      v_user_challenge.user_id,
      v_user_challenge.points_reward,
      v_user_challenge.xp_reward,
      'earned',
      'daily_challenge',
      v_user_challenge.challenge_id,
      'Daily challenge completed'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Expire old challenges
CREATE OR REPLACE FUNCTION expire_old_challenges()
RETURNS void AS $$
BEGIN
  UPDATE user_daily_challenges
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_streak_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_streaks_updated
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_timestamp();

CREATE TRIGGER daily_challenges_updated
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_timestamp();

CREATE TRIGGER user_daily_challenges_updated
  BEFORE UPDATE ON user_daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_timestamp();
