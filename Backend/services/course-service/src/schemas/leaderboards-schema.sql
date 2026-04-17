-- ============================================================================
-- HAIDLMS: LEADERBOARDS & RANKINGS SCHEMA
-- ============================================================================
-- This schema handles leaderboards, rankings, competitions, and competitive
-- features for user engagement
-- ============================================================================

-- ============================================================================
-- LEADERBOARD DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Leaderboard details
  leaderboard_name VARCHAR(100) NOT NULL,
  leaderboard_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  -- Type and scope
  leaderboard_type VARCHAR(50) NOT NULL, -- points, xp, streak, completion, speed, accuracy
  scope_type VARCHAR(50) NOT NULL, -- global, course, organization, custom

  -- Specific scope
  course_id UUID REFERENCES courses(id),
  organization_id UUID REFERENCES organizations(id),

  -- Time period
  time_period VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, yearly, all_time, custom
  period_start TIMESTAMP,
  period_end TIMESTAMP,

  -- Ranking criteria
  ranking_metric VARCHAR(50) NOT NULL, -- total_points, total_xp, current_streak, courses_completed, etc.
  ranking_order VARCHAR(10) DEFAULT 'DESC', -- DESC or ASC

  -- Display
  max_display_count INTEGER DEFAULT 100,
  show_ranks BOOLEAN DEFAULT true,
  show_scores BOOLEAN DEFAULT true,
  show_avatars BOOLEAN DEFAULT true,

  -- Privacy
  privacy_level VARCHAR(50) DEFAULT 'public', -- public, friends_only, opt_in
  allow_anonymous BOOLEAN DEFAULT false,

  -- Rewards
  has_rewards BOOLEAN DEFAULT false,
  top_n_rewards JSONB, -- [{rank: 1, reward: {...}}, ...]

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Reset schedule (for recurring leaderboards)
  auto_reset BOOLEAN DEFAULT false,
  reset_frequency VARCHAR(50), -- daily, weekly, monthly

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_code ON leaderboards(leaderboard_code);
CREATE INDEX idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX idx_leaderboards_scope ON leaderboards(scope_type);
CREATE INDEX idx_leaderboards_course ON leaderboards(course_id);
CREATE INDEX idx_leaderboards_active ON leaderboards(is_active);

-- ============================================================================
-- LEADERBOARD ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ranking
  rank INTEGER,
  score NUMERIC(10, 2) NOT NULL, -- Points, XP, or other metric
  previous_rank INTEGER,
  rank_change INTEGER, -- Positive = moved up, negative = moved down

  -- Additional metrics
  metrics JSONB DEFAULT '{}', -- Additional data like completion_rate, accuracy, etc.

  -- Display
  display_name VARCHAR(255),
  avatar_url TEXT,
  is_hidden BOOLEAN DEFAULT false, -- User opted out of public display

  -- Dates
  first_entry_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(leaderboard_id, user_id)
);

CREATE INDEX idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX idx_leaderboard_entries_score ON leaderboard_entries(leaderboard_id, score DESC);

-- ============================================================================
-- COMPETITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Competition details
  competition_name VARCHAR(100) NOT NULL,
  competition_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  rules TEXT,

  -- Competition type
  competition_type VARCHAR(50) NOT NULL, -- course_race, quiz_battle, challenge, tournament

  -- Scope
  course_ids UUID[], -- Null = all courses
  organization_id UUID REFERENCES organizations(id),

  -- Participation
  participation_type VARCHAR(50) DEFAULT 'open', -- open, invite_only, registration_required
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,

  -- Entry requirements
  min_level_required INTEGER DEFAULT 1,
  entry_fee_points INTEGER DEFAULT 0,

  -- Duration
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  registration_deadline TIMESTAMP,

  -- Winning criteria
  winning_metric VARCHAR(50) NOT NULL, -- points_earned, completion_speed, accuracy, streak
  target_score NUMERIC(10, 2), -- Optional target score

  -- Prizes
  prize_pool JSONB DEFAULT '[]', -- Array of prizes for different ranks
  winner_rewards JSONB,

  -- Status
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, completed, canceled
  is_featured BOOLEAN DEFAULT false,

  -- Results
  winner_user_id UUID REFERENCES users(id),
  results_finalized_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_competitions_code ON competitions(competition_code);
CREATE INDEX idx_competitions_type ON competitions(competition_type);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_dates ON competitions(start_date, end_date);

-- ============================================================================
-- COMPETITION PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS competition_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Registration
  registered_at TIMESTAMP DEFAULT NOW(),
  registration_status VARCHAR(50) DEFAULT 'registered', -- registered, confirmed, withdrawn

  -- Performance
  current_score NUMERIC(10, 2) DEFAULT 0,
  current_rank INTEGER,
  metrics JSONB DEFAULT '{}',

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,

  -- Prize
  prize_won JSONB,
  prize_claimed BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(competition_id, user_id)
);

CREATE INDEX idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX idx_competition_participants_user ON competition_participants(user_id);
CREATE INDEX idx_competition_participants_rank ON competition_participants(competition_id, current_rank);
CREATE INDEX idx_competition_participants_score ON competition_participants(competition_id, current_score DESC);

-- ============================================================================
-- USER PRIVACY SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Global privacy
  show_on_global_leaderboards BOOLEAN DEFAULT true,
  show_on_course_leaderboards BOOLEAN DEFAULT true,
  show_on_org_leaderboards BOOLEAN DEFAULT true,

  -- Display settings
  use_real_name BOOLEAN DEFAULT true,
  use_anonymous_name BOOLEAN DEFAULT false,
  anonymous_display_name VARCHAR(100),

  -- Competition settings
  allow_competition_invites BOOLEAN DEFAULT true,
  auto_join_course_competitions BOOLEAN DEFAULT false,

  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_leaderboard_privacy_user ON leaderboard_privacy_settings(user_id);

-- ============================================================================
-- RANKING SNAPSHOTS
-- ============================================================================

-- Historical snapshots of rankings for tracking changes over time
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Snapshot data
  snapshot_date DATE NOT NULL,
  rank INTEGER NOT NULL,
  score NUMERIC(10, 2) NOT NULL,
  metrics JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(leaderboard_id, user_id, snapshot_date)
);

CREATE INDEX idx_ranking_snapshots_leaderboard ON ranking_snapshots(leaderboard_id);
CREATE INDEX idx_ranking_snapshots_user ON ranking_snapshots(user_id);
CREATE INDEX idx_ranking_snapshots_date ON ranking_snapshots(snapshot_date DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Global points leaderboard
CREATE OR REPLACE VIEW global_points_leaderboard AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  up.total_points as score,
  ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank
FROM user_points up
JOIN users u ON up.user_id = u.id
ORDER BY up.total_points DESC
LIMIT 100;

-- Global XP leaderboard
CREATE OR REPLACE VIEW global_xp_leaderboard AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  up.total_xp as score,
  up.current_level,
  ROW_NUMBER() OVER (ORDER BY up.total_xp DESC) as rank
FROM user_points up
JOIN users u ON up.user_id = u.id
ORDER BY up.total_xp DESC
LIMIT 100;

-- Global streak leaderboard
CREATE OR REPLACE VIEW global_streak_leaderboard AS
SELECT
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  up.current_streak as score,
  up.longest_streak,
  ROW_NUMBER() OVER (ORDER BY up.current_streak DESC) as rank
FROM user_points up
JOIN users u ON up.user_id = u.id
WHERE up.current_streak > 0
ORDER BY up.current_streak DESC
LIMIT 100;

-- Course completion leaderboard (by course)
CREATE OR REPLACE VIEW course_completion_leaderboard AS
SELECT
  e.course_id,
  c.title as course_title,
  u.id as user_id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  p.completion_percentage as score,
  p.lessons_completed,
  ROW_NUMBER() OVER (PARTITION BY e.course_id ORDER BY p.completion_percentage DESC, p.last_activity_at DESC) as rank
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
LEFT JOIN progress p ON e.user_id = p.user_id AND e.course_id = p.course_id
WHERE p.completion_percentage > 0
ORDER BY e.course_id, rank;

-- Active competitions summary
CREATE OR REPLACE VIEW active_competitions_summary AS
SELECT
  c.*,
  COUNT(cp.id) as total_participants,
  CASE
    WHEN c.max_participants IS NOT NULL THEN
      ROUND((COUNT(cp.id)::NUMERIC / c.max_participants) * 100, 2)
    ELSE NULL
  END as capacity_percentage,
  (c.end_date - NOW()) as time_remaining
FROM competitions c
LEFT JOIN competition_participants cp ON c.id = cp.competition_id AND cp.registration_status != 'withdrawn'
WHERE c.status = 'active'
GROUP BY c.id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(p_leaderboard_id UUID)
RETURNS void AS $$
DECLARE
  v_leaderboard RECORD;
  v_entry RECORD;
  v_new_rank INTEGER;
BEGIN
  SELECT * INTO v_leaderboard FROM leaderboards WHERE id = p_leaderboard_id;

  IF v_leaderboard.id IS NULL THEN
    RETURN;
  END IF;

  -- Update ranks based on score
  FOR v_entry IN
    SELECT id, score, rank as current_rank
    FROM leaderboard_entries
    WHERE leaderboard_id = p_leaderboard_id
    ORDER BY score DESC
  LOOP
    v_new_rank := (
      SELECT COUNT(*) + 1
      FROM leaderboard_entries
      WHERE leaderboard_id = p_leaderboard_id AND score > v_entry.score
    );

    UPDATE leaderboard_entries
    SET rank = v_new_rank,
        previous_rank = v_entry.current_rank,
        rank_change = CASE
          WHEN v_entry.current_rank IS NOT NULL THEN v_entry.current_rank - v_new_rank
          ELSE 0
        END,
        last_updated_at = NOW()
    WHERE id = v_entry.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add or update leaderboard entry
CREATE OR REPLACE FUNCTION upsert_leaderboard_entry(
  p_leaderboard_id UUID,
  p_user_id UUID,
  p_score NUMERIC,
  p_metrics JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_user RECORD;
  v_privacy RECORD;
BEGIN
  -- Get user info
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  -- Get privacy settings
  SELECT * INTO v_privacy FROM leaderboard_privacy_settings WHERE user_id = p_user_id;

  -- Insert or update entry
  INSERT INTO leaderboard_entries (
    leaderboard_id, user_id, score, metrics,
    display_name, is_hidden
  ) VALUES (
    p_leaderboard_id, p_user_id, p_score, p_metrics,
    CASE
      WHEN v_privacy.use_anonymous_name THEN v_privacy.anonymous_display_name
      ELSE v_user.first_name || ' ' || v_user.last_name
    END,
    NOT COALESCE(v_privacy.show_on_global_leaderboards, true)
  )
  ON CONFLICT (leaderboard_id, user_id)
  DO UPDATE SET
    score = p_score,
    metrics = p_metrics,
    last_updated_at = NOW()
  RETURNING id INTO v_entry_id;

  -- Update rankings
  PERFORM update_leaderboard_rankings(p_leaderboard_id);

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Get user rank in leaderboard
CREATE OR REPLACE FUNCTION get_user_rank(
  p_leaderboard_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  rank INTEGER,
  score NUMERIC,
  total_entries INTEGER,
  percentile NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.rank,
    le.score,
    (SELECT COUNT(*)::INTEGER FROM leaderboard_entries WHERE leaderboard_id = p_leaderboard_id) as total_entries,
    CASE
      WHEN (SELECT COUNT(*) FROM leaderboard_entries WHERE leaderboard_id = p_leaderboard_id) > 0 THEN
        ROUND((1 - (le.rank::NUMERIC / (SELECT COUNT(*) FROM leaderboard_entries WHERE leaderboard_id = p_leaderboard_id))) * 100, 2)
      ELSE 0
    END as percentile
  FROM leaderboard_entries le
  WHERE le.leaderboard_id = p_leaderboard_id AND le.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create daily snapshot
CREATE OR REPLACE FUNCTION create_ranking_snapshot()
RETURNS void AS $$
BEGIN
  INSERT INTO ranking_snapshots (leaderboard_id, user_id, snapshot_date, rank, score, metrics)
  SELECT
    leaderboard_id,
    user_id,
    CURRENT_DATE,
    rank,
    score,
    metrics
  FROM leaderboard_entries
  ON CONFLICT (leaderboard_id, user_id, snapshot_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leaderboard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leaderboards_updated
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_timestamp();

CREATE TRIGGER competitions_updated
  BEFORE UPDATE ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_timestamp();

-- Update competition participant count
CREATE OR REPLACE FUNCTION update_competition_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE competitions
    SET current_participants = current_participants + 1
    WHERE id = NEW.competition_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE competitions
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.competition_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.registration_status = 'withdrawn' AND OLD.registration_status != 'withdrawn' THEN
      UPDATE competitions
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = NEW.competition_id;
    ELSIF NEW.registration_status != 'withdrawn' AND OLD.registration_status = 'withdrawn' THEN
      UPDATE competitions
      SET current_participants = current_participants + 1
      WHERE id = NEW.competition_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competition_participants_count
  AFTER INSERT OR UPDATE OR DELETE ON competition_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_competition_participant_count();

-- Auto-update competition status based on dates
CREATE OR REPLACE FUNCTION auto_update_competition_status()
RETURNS void AS $$
BEGIN
  -- Start upcoming competitions
  UPDATE competitions
  SET status = 'active'
  WHERE status = 'upcoming'
    AND start_date <= NOW()
    AND end_date > NOW();

  -- End active competitions
  UPDATE competitions
  SET status = 'completed'
  WHERE status = 'active'
    AND end_date <= NOW();
END;
$$ LANGUAGE plpgsql;
