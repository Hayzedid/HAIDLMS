-- Direct Messaging & Chat System Schema
-- Real-time communication for student-instructor-admin

-- ========================================
-- 1. CONVERSATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Conversation Type
  type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group'

  -- Group Conversation Details
  title VARCHAR(255), -- For group conversations
  description TEXT,
  avatar_url VARCHAR(500),

  -- Creator
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Settings
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,

  -- Metadata
  metadata JSONB, -- Custom fields like course_id, thread_id for context

  -- Last Activity
  last_message_at TIMESTAMP,
  last_message_preview TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_archived ON conversations(is_archived);

-- ========================================
-- 2. CONVERSATION PARTICIPANTS
-- ========================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role in Conversation
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'

  -- Status
  is_active BOOLEAN DEFAULT true,
  left_at TIMESTAMP,

  -- Notifications
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMP,

  -- Read Status
  last_read_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,

  -- Participation
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conv_participants_active ON conversation_participants(user_id, is_active);
CREATE INDEX idx_conv_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- ========================================
-- 3. MESSAGES
-- ========================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Content
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'file', 'image', 'video', 'audio', 'code'

  -- Reply/Thread
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reply_count INTEGER DEFAULT 0,

  -- Attachments
  attachments JSONB, -- [{name, url, size, type}]

  -- Formatting
  mentions UUID[], -- User IDs mentioned in message
  metadata JSONB, -- For rich content (code language, link previews, etc.)

  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,

  -- Delivery Status
  sent_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_mentions ON messages USING GIN (mentions);
CREATE INDEX idx_messages_deleted ON messages(conversation_id, is_deleted) WHERE is_deleted = false;

-- ========================================
-- 4. MESSAGE REACTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reaction
  emoji VARCHAR(10) NOT NULL, -- '👍', '❤️', '😂', '😮', '😢', '🎉'

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);

-- ========================================
-- 5. MESSAGE READ RECEIPTS
-- ========================================

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  read_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_message_receipts_user ON message_read_receipts(user_id);

-- ========================================
-- 6. TYPING INDICATORS
-- ========================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  is_typing BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 seconds',

  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_expires ON typing_indicators(expires_at);

-- ========================================
-- 7. MESSAGE ATTACHMENTS
-- ========================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- File Info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL, -- bytes
  file_url VARCHAR(500) NOT NULL,

  -- Thumbnails (for images/videos)
  thumbnail_url VARCHAR(500),

  -- Metadata
  width INTEGER, -- For images
  height INTEGER,
  duration_seconds INTEGER, -- For videos/audio

  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_attachments_conversation ON message_attachments(conversation_id);
CREATE INDEX idx_attachments_uploaded_by ON message_attachments(uploaded_by);
CREATE INDEX idx_attachments_created ON message_attachments(created_at DESC);

-- ========================================
-- 8. MESSAGE SEARCH INDEX
-- ========================================

CREATE TABLE IF NOT EXISTS message_search_index (
  message_id UUID PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Searchable Content
  search_vector TSVECTOR,
  content_plain TEXT, -- Stripped of formatting

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_message_search_vector ON message_search_index USING GIN (search_vector);
CREATE INDEX idx_message_search_conversation ON message_search_index(conversation_id);
CREATE INDEX idx_message_search_sender ON message_search_index(sender_id);

-- ========================================
-- 9. CONVERSATION SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS conversation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Permissions
  allow_new_members BOOLEAN DEFAULT true,
  allow_member_invite BOOLEAN DEFAULT true,
  allow_member_leave BOOLEAN DEFAULT true,

  -- Moderation
  require_approval_for_messages BOOLEAN DEFAULT false,
  slow_mode_seconds INTEGER DEFAULT 0, -- 0 = disabled
  max_message_length INTEGER DEFAULT 5000,

  -- File Sharing
  allow_file_upload BOOLEAN DEFAULT true,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[], -- ['image', 'video', 'document', 'audio']

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conv_settings_conversation ON conversation_settings(conversation_id);

-- ========================================
-- 10. BLOCKED USERS
-- ========================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  reason TEXT,

  blocked_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_user_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_user_id);

-- ========================================
-- 11. VIEWS
-- ========================================

-- View: User Conversations
CREATE OR REPLACE VIEW user_conversations AS
SELECT
  c.id AS conversation_id,
  c.type,
  c.title,
  c.description,
  c.avatar_url,
  c.created_by,
  c.last_message_at,
  c.last_message_preview,
  cp.user_id,
  cp.role,
  cp.is_active,
  cp.is_muted,
  cp.last_read_at,
  cp.unread_count,
  cp.last_seen_at,
  -- For direct conversations, get the other participant
  CASE
    WHEN c.type = 'direct' THEN (
      SELECT u.full_name
      FROM conversation_participants cp2
      JOIN users u ON cp2.user_id = u.id
      WHERE cp2.conversation_id = c.id
        AND cp2.user_id != cp.user_id
      LIMIT 1
    )
    ELSE c.title
  END AS display_name,
  CASE
    WHEN c.type = 'direct' THEN (
      SELECT u.avatar_url
      FROM conversation_participants cp2
      JOIN users u ON cp2.user_id = u.id
      WHERE cp2.conversation_id = c.id
        AND cp2.user_id != cp.user_id
      LIMIT 1
    )
    ELSE c.avatar_url
  END AS display_avatar,
  (
    SELECT COUNT(*)
    FROM conversation_participants
    WHERE conversation_id = c.id AND is_active = true
  ) AS participant_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.is_active = true
  AND c.is_archived = false;

-- View: Message Details
CREATE OR REPLACE VIEW message_details AS
SELECT
  m.*,
  u.full_name AS sender_name,
  u.avatar_url AS sender_avatar,
  u.email AS sender_email,
  (
    SELECT COUNT(*)
    FROM message_reactions
    WHERE message_id = m.id
  ) AS reaction_count,
  (
    SELECT COUNT(*)
    FROM message_read_receipts
    WHERE message_id = m.id
  ) AS read_count,
  (
    SELECT json_agg(json_build_object(
      'emoji', emoji,
      'count', count,
      'users', users
    ))
    FROM (
      SELECT
        emoji,
        COUNT(*) AS count,
        array_agg(user_id) AS users
      FROM message_reactions
      WHERE message_id = m.id
      GROUP BY emoji
    ) AS reactions
  ) AS reactions
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.is_deleted = false;

-- ========================================
-- 12. FUNCTIONS
-- ========================================

-- Function: Get or create direct conversation
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = p_user1_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = p_user2_id
  WHERE c.type = 'direct'
    AND c.is_archived = false
  LIMIT 1;

  -- If exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Otherwise, create new conversation
  INSERT INTO conversations (type, created_by)
  VALUES ('direct', p_user1_id)
  RETURNING id INTO v_conversation_id;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (v_conversation_id, p_user1_id),
    (v_conversation_id, p_user2_id);

  -- Create conversation settings
  INSERT INTO conversation_settings (conversation_id)
  VALUES (v_conversation_id);

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update unread counts
CREATE OR REPLACE FUNCTION update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread count for all participants except sender
  UPDATE conversation_participants
  SET unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND is_active = true
    AND (last_read_at IS NULL OR last_read_at < NEW.created_at);

  -- Update conversation last message
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unread_counts
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.is_deleted = false)
EXECUTE FUNCTION update_unread_counts();

-- Function: Mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_message_ids UUID[];
BEGIN
  -- Get unread message IDs
  SELECT array_agg(id) INTO v_message_ids
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_deleted = false
    AND created_at > (
      SELECT COALESCE(last_read_at, '1970-01-01'::TIMESTAMP)
      FROM conversation_participants
      WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
    );

  -- Create read receipts
  IF v_message_ids IS NOT NULL THEN
    INSERT INTO message_read_receipts (message_id, user_id)
    SELECT unnest(v_message_ids), p_user_id
    ON CONFLICT (message_id, user_id) DO NOTHING;

    v_count := array_length(v_message_ids, 1);
  ELSE
    v_count := 0;
  END IF;

  -- Update participant's last_read_at and reset unread_count
  UPDATE conversation_participants
  SET last_read_at = NOW(),
      unread_count = 0,
      updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Search messages
CREATE OR REPLACE FUNCTION search_messages(
  p_user_id UUID,
  p_query TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMP,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    msi.message_id,
    msi.conversation_id,
    msi.sender_id,
    m.content,
    m.created_at,
    ts_rank(msi.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM message_search_index msi
  JOIN messages m ON msi.message_id = m.id
  JOIN conversation_participants cp ON msi.conversation_id = cp.conversation_id
  WHERE cp.user_id = p_user_id
    AND cp.is_active = true
    AND (p_conversation_id IS NULL OR msi.conversation_id = p_conversation_id)
    AND msi.search_vector @@ plainto_tsquery('english', p_query)
    AND m.is_deleted = false
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Update reply count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE messages
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.parent_message_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.parent_message_id IS NOT NULL AND NEW.is_deleted = false)
EXECUTE FUNCTION update_reply_count();

-- Function: Maintain search index
CREATE OR REPLACE FUNCTION maintain_message_search_index()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO message_search_index (message_id, conversation_id, sender_id, search_vector, content_plain)
    VALUES (
      NEW.id,
      NEW.conversation_id,
      NEW.sender_id,
      to_tsvector('english', NEW.content),
      NEW.content
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE message_search_index
    SET search_vector = to_tsvector('english', NEW.content),
        content_plain = NEW.content
    WHERE message_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM message_search_index WHERE message_id = OLD.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintain_search_index
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION maintain_message_search_index();

-- Function: Clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 13. TRIGGERS
-- ========================================

-- Trigger: Update conversation timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

COMMENT ON SCHEMA public IS 'Messaging System - Real-time direct and group messaging';
