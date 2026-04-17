-- AI Socratic Tutor Schema
-- Tracks AI assistant interactions, conversations, and learning patterns

-- Chat Sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  course_id UUID,
  lesson_id UUID,
  assessment_id UUID,
  problem_id UUID,
  context_type VARCHAR(50) NOT NULL, -- 'code_editor', 'error_debugging', 'concept_learning', 'challenge'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  total_messages INT DEFAULT 0,
  student_code_context TEXT, -- Code the student was working on when they started the chat
  session_summary TEXT, -- AI-generated summary of what was learned
  learning_objectives_met TEXT[], -- Array of objectives covered in this session
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual Messages in Chat
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'student', 'assistant', 'system'
  content TEXT NOT NULL,
  message_type VARCHAR(50), -- 'question', 'explanation', 'hint', 'challenge', 'error_help', 'concept_check'
  code_snippet TEXT, -- Any code referenced in this message
  tokens_used INT, -- OpenAI tokens consumed
  response_time_ms INT, -- How long AI took to respond
  sentiment_score DECIMAL(3,2), -- Student frustration/confidence level (-1 to 1)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Error Explanations
CREATE TABLE IF NOT EXISTS ai_error_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES ai_chat_sessions(id),
  error_message TEXT NOT NULL,
  error_type VARCHAR(100), -- 'syntax', 'runtime', 'logic', 'compilation'
  language VARCHAR(50), -- 'python', 'javascript', 'java', etc.
  student_code TEXT NOT NULL,
  line_number INT,
  ai_explanation TEXT NOT NULL,
  suggested_fix TEXT, -- Explanation of how to fix, NOT the actual code
  learning_resource_links TEXT[], -- Links to docs, tutorials
  was_helpful BOOLEAN, -- Student feedback
  resolved_independently BOOLEAN DEFAULT false, -- Did student fix it themselves?
  created_at TIMESTAMP DEFAULT NOW()
);

-- "What If?" Challenges
CREATE TABLE IF NOT EXISTS ai_extension_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES ai_chat_sessions(id),
  base_problem_id UUID, -- Original problem student was working on
  student_code TEXT NOT NULL,
  challenge_prompt TEXT NOT NULL, -- "What if you had to handle 1M records?" "What if inputs were negative?"
  challenge_type VARCHAR(50), -- 'performance', 'edge_case', 'scalability', 'security', 'abstraction'
  difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),
  accepted BOOLEAN DEFAULT false, -- Did student accept the challenge?
  completed BOOLEAN DEFAULT false,
  student_solution TEXT,
  ai_feedback TEXT,
  time_spent_seconds INT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Concept Checks (Socratic questions to verify understanding)
CREATE TABLE IF NOT EXISTS ai_concept_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  concept_name VARCHAR(200) NOT NULL, -- 'recursion', 'big-o-notation', 'closure', 'polymorphism'
  question TEXT NOT NULL,
  student_answer TEXT,
  is_correct BOOLEAN,
  ai_follow_up TEXT, -- Next question or clarification based on answer
  attempts INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Tutor Safety & Compliance Logs
CREATE TABLE IF NOT EXISTS ai_safety_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES ai_chat_sessions(id),
  message_id UUID REFERENCES ai_chat_messages(id),
  violation_type VARCHAR(100) NOT NULL, -- 'code_generation', 'direct_answer', 'exam_help', 'inappropriate'
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  student_prompt TEXT NOT NULL,
  ai_response TEXT,
  action_taken VARCHAR(50), -- 'blocked', 'warned', 'logged', 'instructor_notified'
  instructor_notified BOOLEAN DEFAULT false,
  severity VARCHAR(20) -- 'low', 'medium', 'high', 'critical'
);

-- AI Usage Statistics (for rate limiting and billing)
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sessions INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  total_explanations_requested INT DEFAULT 0,
  total_challenges_generated INT DEFAULT 0,
  avg_session_duration_seconds INT,
  helpfulness_rating DECIMAL(3,2), -- Average of user feedback
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- AI Tutor Configuration (per course/assessment)
CREATE TABLE IF NOT EXISTS ai_tutor_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID,
  assessment_id UUID,
  is_enabled BOOLEAN DEFAULT true,
  mode VARCHAR(50) NOT NULL DEFAULT 'explain_only', -- 'explain_only', 'hints', 'disabled'
  max_messages_per_session INT DEFAULT 50,
  max_sessions_per_day INT DEFAULT 10,
  allow_error_help BOOLEAN DEFAULT true,
  allow_challenges BOOLEAN DEFAULT true,
  allow_concept_checks BOOLEAN DEFAULT true,
  restricted_during_exam BOOLEAN DEFAULT true, -- Disable during proctored exams
  custom_system_prompt TEXT, -- Instructor can customize AI behavior
  blocked_topics TEXT[], -- Topics AI should refuse to help with
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, assessment_id)
);

-- Student Learning Patterns (derived from AI interactions)
CREATE TABLE IF NOT EXISTS ai_learning_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  weak_concepts TEXT[], -- Concepts student frequently asks about
  strong_concepts TEXT[], -- Concepts student demonstrates mastery in
  common_error_types TEXT[], -- Types of errors they make repeatedly
  avg_time_to_debug_minutes DECIMAL(6,2),
  independence_score DECIMAL(5,2), -- 0-100: How often they solve problems independently
  asks_before_trying BOOLEAN DEFAULT false, -- Flag for students who ask AI before attempting
  learns_from_mistakes BOOLEAN DEFAULT true, -- Whether they make same mistakes repeatedly
  prefers_hints_vs_explanations VARCHAR(20) DEFAULT 'balanced',
  last_analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_course ON ai_chat_sessions(course_id);
CREATE INDEX idx_ai_chat_sessions_active ON ai_chat_sessions(is_active);
CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created ON ai_chat_messages(created_at);
CREATE INDEX idx_ai_error_explanations_user ON ai_error_explanations(user_id);
CREATE INDEX idx_ai_extension_challenges_user ON ai_extension_challenges(user_id);
CREATE INDEX idx_ai_extension_challenges_accepted ON ai_extension_challenges(accepted, completed);
CREATE INDEX idx_ai_safety_logs_session ON ai_safety_logs(session_id);
CREATE INDEX idx_ai_safety_logs_severity ON ai_safety_logs(severity);
CREATE INDEX idx_ai_usage_stats_user_date ON ai_usage_stats(user_id, date);
CREATE INDEX idx_ai_learning_patterns_user ON ai_learning_patterns(user_id);

-- Trigger to update session message count
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_chat_sessions
  SET total_messages = total_messages + 1,
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_message_count
AFTER INSERT ON ai_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_session_message_count();

-- Trigger to update daily usage stats
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_usage_stats (user_id, date, total_sessions)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_sessions = ai_usage_stats.total_sessions + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_usage_stats
AFTER INSERT ON ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_ai_usage_stats();

-- View: Active sessions needing summary generation
CREATE OR REPLACE VIEW active_sessions_for_summary AS
SELECT
  cs.id,
  cs.user_id,
  cs.context_type,
  cs.started_at,
  cs.total_messages,
  cs.student_code_context,
  COUNT(cm.id) as message_count
FROM ai_chat_sessions cs
LEFT JOIN ai_chat_messages cm ON cm.session_id = cs.id
WHERE cs.is_active = true
  AND cs.ended_at IS NULL
  AND cs.started_at < NOW() - INTERVAL '30 minutes'
GROUP BY cs.id;

-- View: Student help-seeking patterns
CREATE OR REPLACE VIEW student_help_patterns AS
SELECT
  cs.user_id,
  COUNT(DISTINCT cs.id) as total_sessions,
  COUNT(DISTINCT DATE(cs.started_at)) as days_active,
  AVG(cs.total_messages) as avg_messages_per_session,
  COUNT(DISTINCT ee.id) as total_error_helps,
  COUNT(DISTINCT ec.id) as total_challenges_attempted,
  COUNT(DISTINCT CASE WHEN ec.completed = true THEN ec.id END) as challenges_completed,
  AVG(CASE WHEN ee.was_helpful IS NOT NULL THEN
    CASE WHEN ee.was_helpful THEN 1 ELSE 0 END
  END) as helpfulness_rate
FROM ai_chat_sessions cs
LEFT JOIN ai_error_explanations ee ON ee.user_id = cs.user_id
LEFT JOIN ai_extension_challenges ec ON ec.user_id = cs.user_id
GROUP BY cs.user_id;

-- View: Most common errors by language
CREATE OR REPLACE VIEW common_errors_by_language AS
SELECT
  language,
  error_type,
  COUNT(*) as occurrence_count,
  AVG(CASE WHEN resolved_independently THEN 1 ELSE 0 END) as independence_rate,
  AVG(CASE WHEN was_helpful IS NOT NULL THEN
    CASE WHEN was_helpful THEN 1 ELSE 0 END
  END) as helpfulness_rate
FROM ai_error_explanations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY language, error_type
ORDER BY occurrence_count DESC;

-- Comments
COMMENT ON TABLE ai_chat_sessions IS 'Tracks AI tutor chat sessions with context';
COMMENT ON TABLE ai_chat_messages IS 'Individual messages in AI tutor conversations';
COMMENT ON TABLE ai_error_explanations IS 'AI explanations of coding errors (never provides fixes)';
COMMENT ON TABLE ai_extension_challenges IS 'What if? challenges to extend student thinking';
COMMENT ON TABLE ai_concept_checks IS 'Socratic questions to verify understanding';
COMMENT ON TABLE ai_safety_logs IS 'Tracks violations like code generation attempts';
COMMENT ON TABLE ai_usage_stats IS 'Daily usage statistics per user for rate limiting';
COMMENT ON TABLE ai_tutor_config IS 'Configuration per course/assessment';
COMMENT ON TABLE ai_learning_patterns IS 'Derived learning patterns from AI interactions';
