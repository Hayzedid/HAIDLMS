-- ============================================================================
-- HAIDLMS: GAMIFICATION & REWARDS SCHEMA
-- ============================================================================
-- This schema handles points, XP, levels, achievements, rewards, and
-- gamification mechanics to drive user engagement
-- ============================================================================

-- ============================================================================
-- USER POINTS & XP
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Points
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0, -- Points not yet spent
  lifetime_points INTEGER DEFAULT 0, -- Total earned across all time

  -- Experience Points (XP)
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,

  -- Level progress
  level_progress_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,

  -- Rankings
  global_rank INTEGER,
  course_ranks JSONB DEFAULT '{}', -- {courseId: rank}

  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX idx_user_points_level ON user_points(current_level DESC);
CREATE INDEX idx_user_points_streak ON user_points(current_streak DESC);

-- ============================================================================
-- POINT EARNING RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Rule details
  rule_name VARCHAR(100) NOT NULL,
  rule_code VARCHAR(50) UNIQUE NOT NULL, -- lesson_complete, quiz_pass, streak_7day, etc.
  description TEXT,

  -- Points awarded
  points INTEGER NOT NULL,
  xp INTEGER NOT NULL,

  -- Rule type
  rule_type VARCHAR(50) NOT NULL, -- activity, achievement, social, streak
  action_type VARCHAR(100), -- complete_lesson, pass_assessment, comment, like, share

  -- Limits
  max_per_day INTEGER,
  max_per_week INTEGER,
  max_total INTEGER, -- Null = unlimited

  -- Multipliers (optional)
  has_multiplier BOOLEAN DEFAULT false,
  multiplier_conditions JSONB, -- Conditions for bonus points

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_point_rules_code ON point_rules(rule_code);
CREATE INDEX idx_point_rules_type ON point_rules(rule_type);
CREATE INDEX idx_point_rules_active ON point_rules(is_active);

-- ============================================================================
-- POINT TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- earned, spent, bonus, penalty, adjustment
  points_change INTEGER NOT NULL, -- Positive for earning, negative for spending
  xp_change INTEGER DEFAULT 0,

  -- Source
  source_type VARCHAR(50), -- lesson, assessment, achievement, reward, streak, social
  source_id UUID, -- ID of the related entity
  rule_id UUID REFERENCES point_rules(id),

  -- Related entities
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  assessment_id UUID REFERENCES assessments(id),
  achievement_id UUID,

  -- Description
  description TEXT,

  -- Balances after transaction
  points_balance INTEGER,
  xp_balance INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_source ON point_transactions(source_type, source_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);

-- ============================================================================
-- LEVELS & PROGRESSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS level_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Level details
  level_number INTEGER UNIQUE NOT NULL,
  level_name VARCHAR(100), -- Beginner, Intermediate, Advanced, Expert, Master, etc.

  -- XP requirements
  xp_required INTEGER NOT NULL, -- Total XP needed to reach this level
  xp_to_next INTEGER, -- XP needed from this level to next

  -- Rewards
  rewards JSONB DEFAULT '[]', -- Rewards unlocked at this level
  unlocked_features JSONB DEFAULT '[]', -- Features unlocked

  -- Visuals
  badge_icon_url TEXT,
  badge_color VARCHAR(20),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_level_definitions_number ON level_definitions(level_number);

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement details
  achievement_name VARCHAR(100) NOT NULL,
  achievement_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Category
  category VARCHAR(50) NOT NULL, -- learning, social, streak, milestone, special
  difficulty VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary

  -- Criteria
  criteria JSONB NOT NULL, -- Requirements to earn achievement
  criteria_description TEXT,

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID REFERENCES digital_badges(id),

  -- Visuals
  icon_url TEXT,
  color VARCHAR(20),

  -- Progress tracking
  is_progressive BOOLEAN DEFAULT false, -- True for achievements with multiple steps
  total_steps INTEGER, -- For progressive achievements

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false, -- Hidden until earned

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_achievements_code ON achievements(achievement_code);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_difficulty ON achievements(difficulty);

-- ============================================================================
-- USER ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),

  -- Progress
  progress INTEGER DEFAULT 0, -- For progressive achievements
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,

  -- Related context
  course_id UUID REFERENCES courses(id),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX idx_user_achievements_date ON user_achievements(completed_at DESC);

-- ============================================================================
-- REWARDS CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reward details
  reward_name VARCHAR(100) NOT NULL,
  reward_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Category
  reward_type VARCHAR(50) NOT NULL, -- discount, feature_unlock, cosmetic, physical, badge, certificate

  -- Cost
  points_cost INTEGER NOT NULL,

  -- Reward value
  reward_value JSONB, -- Discount code, feature flag, item details, etc.

  -- Availability
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER, -- Null = unlimited
  stock_remaining INTEGER,
  max_per_user INTEGER DEFAULT 1,

  -- Requirements
  min_level_required INTEGER DEFAULT 1,
  required_achievements UUID[], -- Must have these achievements to unlock

  -- Visuals
  image_url TEXT,
  icon_url TEXT,

  -- Dates
  available_from TIMESTAMP,
  available_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_code ON rewards(reward_code);
CREATE INDEX idx_rewards_type ON rewards(reward_type);
CREATE INDEX idx_rewards_active ON rewards(is_active);
CREATE INDEX idx_rewards_cost ON rewards(points_cost);

-- ============================================================================
-- REWARD REDEMPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redemption_code VARCHAR(100) UNIQUE NOT NULL,

  -- User and reward
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),

  -- Points spent
  points_spent INTEGER NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, fulfilled, canceled, expired

  -- Fulfillment
  fulfilled_at TIMESTAMP,
  fulfilled_by UUID REFERENCES users(id),
  fulfillment_notes TEXT,

  -- Expiration
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reward_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_code ON reward_redemptions(redemption_code);

-- ============================================================================
-- QUESTS & CHALLENGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quest details
  quest_name VARCHAR(100) NOT NULL,
  quest_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Category
  quest_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, special, story
  difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard, expert

  -- Objectives
  objectives JSONB NOT NULL, -- Array of tasks to complete
  total_objectives INTEGER NOT NULL,

  -- Rewards
  points_reward INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 0,
  additional_rewards JSONB DEFAULT '[]', -- Badges, items, etc.

  -- Requirements
  min_level_required INTEGER DEFAULT 1,
  prerequisite_quests UUID[], -- Must complete these first

  -- Availability
  is_active BOOLEAN DEFAULT true,
  is_repeatable BOOLEAN DEFAULT false,
  cooldown_hours INTEGER, -- Time before can repeat

  -- Dates
  available_from TIMESTAMP,
  available_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quests_code ON quests(quest_code);
CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_active ON quests(is_active);

-- ============================================================================
-- USER QUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id),

  -- Progress
  objectives_completed JSONB DEFAULT '[]', -- Array of completed objective IDs
  completion_count INTEGER DEFAULT 0, -- Number of times completed (for repeatable)
  progress_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned, expired
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_progress_at TIMESTAMP,

  -- Next availability (for repeatable)
  next_available_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_quest ON user_quests(quest_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_completed ON user_quests(completed_at DESC);

-- ============================================================================
-- POWER-UPS & BOOSTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS power_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Power-up details
  power_up_name VARCHAR(100) NOT NULL,
  power_up_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Effect
  effect_type VARCHAR(50) NOT NULL, -- xp_boost, point_boost, streak_freeze, hint_reveal
  effect_value NUMERIC(10, 2), -- Multiplier or value
  duration_minutes INTEGER, -- How long the effect lasts

  -- Cost
  points_cost INTEGER NOT NULL,

  -- Limits
  max_active_per_user INTEGER DEFAULT 1,
  cooldown_hours INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Visuals
  icon_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_power_ups_code ON power_ups(power_up_code);
CREATE INDEX idx_power_ups_type ON power_ups(effect_type);

-- ============================================================================
-- USER POWER-UPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_power_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  power_up_id UUID NOT NULL REFERENCES power_ups(id),

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, expired, used
  activated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- Usage
  used_at TIMESTAMP,
  usage_context JSONB, -- Where/how it was used

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_power_ups_user ON user_power_ups(user_id);
CREATE INDEX idx_user_power_ups_status ON user_power_ups(status);
CREATE INDEX idx_user_power_ups_expires ON user_power_ups(expires_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Top users by points
CREATE OR REPLACE VIEW points_leaderboard AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  up.total_points,
  up.current_level,
  up.current_streak,
  up.global_rank,
  ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank
FROM user_points up
JOIN users u ON up.user_id = u.id
ORDER BY up.total_points DESC;

-- Top users by level
CREATE OR REPLACE VIEW level_leaderboard AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  up.current_level,
  up.total_xp,
  up.level_progress_percentage,
  ROW_NUMBER() OVER (ORDER BY up.current_level DESC, up.total_xp DESC) as rank
FROM user_points up
JOIN users u ON up.user_id = u.id
ORDER BY up.current_level DESC, up.total_xp DESC;

-- Achievement completion stats
CREATE OR REPLACE VIEW achievement_stats AS
SELECT
  a.id as achievement_id,
  a.achievement_name,
  a.category,
  a.difficulty,
  COUNT(ua.id) as times_earned,
  COUNT(DISTINCT ua.user_id) as unique_earners,
  ROUND(COUNT(DISTINCT ua.user_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM users), 0) * 100, 2) as completion_rate
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.is_completed = true
GROUP BY a.id, a.achievement_name, a.category, a.difficulty;

-- User achievement summary
CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(ua.id) as total_achievements,
  COUNT(CASE WHEN ua.is_completed = true THEN 1 END) as completed_achievements,
  ROUND(COUNT(CASE WHEN ua.is_completed = true THEN 1 END)::NUMERIC / NULLIF(COUNT(ua.id), 0) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id, u.email;

-- Active quests summary
CREATE OR REPLACE VIEW active_quests_summary AS
SELECT
  q.id as quest_id,
  q.quest_name,
  q.quest_type,
  q.difficulty,
  COUNT(uq.id) as active_users,
  COUNT(CASE WHEN uq.status = 'completed' THEN 1 END) as completed_count,
  ROUND(AVG(uq.progress_percentage), 2) as avg_progress
FROM quests q
LEFT JOIN user_quests uq ON q.id = uq.quest_id
WHERE q.is_active = true
GROUP BY q.id, q.quest_name, q.quest_type, q.difficulty;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Award points to user
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_xp INTEGER,
  p_transaction_type VARCHAR,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_points RECORD;
  v_new_level INTEGER;
BEGIN
  -- Get current points
  SELECT * INTO v_current_points FROM user_points WHERE user_id = p_user_id;

  -- Create user_points record if doesn't exist
  IF v_current_points.id IS NULL THEN
    INSERT INTO user_points (user_id, total_points, available_points, lifetime_points, total_xp)
    VALUES (p_user_id, p_points, p_points, p_points, p_xp)
    RETURNING * INTO v_current_points;
  ELSE
    -- Update points
    UPDATE user_points
    SET total_points = total_points + p_points,
        available_points = available_points + p_points,
        lifetime_points = lifetime_points + GREATEST(p_points, 0),
        total_xp = total_xp + p_xp,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_current_points;
  END IF;

  -- Check for level up
  SELECT level_number INTO v_new_level
  FROM level_definitions
  WHERE xp_required <= v_current_points.total_xp
  ORDER BY level_number DESC
  LIMIT 1;

  IF v_new_level IS NOT NULL AND v_new_level > v_current_points.current_level THEN
    UPDATE user_points
    SET current_level = v_new_level
    WHERE user_id = p_user_id;
  END IF;

  -- Create transaction record
  INSERT INTO point_transactions (
    user_id, transaction_type, points_change, xp_change,
    source_type, source_id, description,
    points_balance, xp_balance
  ) VALUES (
    p_user_id, p_transaction_type, p_points, p_xp,
    p_source_type, p_source_id, p_description,
    v_current_points.total_points + p_points,
    v_current_points.total_xp + p_xp
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Complete achievement
CREATE OR REPLACE FUNCTION complete_achievement(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement RECORD;
  v_user_achievement RECORD;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id;

  IF v_achievement.id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if already completed
  SELECT * INTO v_user_achievement
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;

  IF v_user_achievement.is_completed = true THEN
    RETURN false; -- Already completed
  END IF;

  -- Mark as completed
  IF v_user_achievement.id IS NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id, is_completed, completed_at, progress, created_at)
    VALUES (p_user_id, p_achievement_id, true, NOW(), COALESCE(v_achievement.total_steps, 1), NOW());
  ELSE
    UPDATE user_achievements
    SET is_completed = true, completed_at = NOW(), progress = COALESCE(v_achievement.total_steps, 1)
    WHERE id = v_user_achievement.id;
  END IF;

  -- Award points and XP
  IF v_achievement.points_reward > 0 OR v_achievement.xp_reward > 0 THEN
    PERFORM award_points(
      p_user_id,
      v_achievement.points_reward,
      v_achievement.xp_reward,
      'earned',
      'achievement',
      p_achievement_id,
      'Achievement completed: ' || v_achievement.achievement_name
    );
  END IF;

  -- Award badge if configured
  IF v_achievement.badge_id IS NOT NULL THEN
    INSERT INTO badge_awards (badge_id, user_id, award_reason)
    VALUES (v_achievement.badge_id, p_user_id, 'Achievement: ' || v_achievement.achievement_name);
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Generate redemption code
CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(100);
BEGIN
  v_code := 'REDEEM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gamification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_points_updated
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_timestamp();

CREATE TRIGGER achievements_updated
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_timestamp();

CREATE TRIGGER user_achievements_updated
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification_timestamp();

-- Update quest progress percentage
CREATE OR REPLACE FUNCTION update_quest_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_quest RECORD;
  v_completed_count INTEGER;
BEGIN
  SELECT * INTO v_quest FROM quests WHERE id = NEW.quest_id;

  IF v_quest.id IS NOT NULL THEN
    SELECT COALESCE(jsonb_array_length(NEW.objectives_completed), 0) INTO v_completed_count;
    NEW.progress_percentage := ROUND((v_completed_count::NUMERIC / v_quest.total_objectives) * 100, 2);

    IF v_completed_count >= v_quest.total_objectives AND NEW.status = 'active' THEN
      NEW.status := 'completed';
      NEW.completed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_quests_progress
  BEFORE INSERT OR UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_progress();

-- Update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement RECORD;
BEGIN
  SELECT * INTO v_achievement FROM achievements WHERE id = NEW.achievement_id;

  IF v_achievement.is_progressive = true AND v_achievement.total_steps IS NOT NULL THEN
    IF NEW.progress >= v_achievement.total_steps AND NEW.is_completed = false THEN
      NEW.is_completed := true;
      NEW.completed_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_achievements_progress
  BEFORE INSERT OR UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_progress();
