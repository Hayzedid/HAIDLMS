-- Content Versioning & Publishing System Schema
-- Version control, publishing workflow, and content management

-- ========================================
-- 1. ENUM TYPES
-- ========================================

CREATE TYPE content_status AS ENUM ('draft', 'in_review', 'published', 'archived', 'scheduled');
CREATE TYPE version_change_type AS ENUM ('major', 'minor', 'patch', 'draft');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');
CREATE TYPE content_type AS ENUM ('course', 'module', 'lesson', 'assessment', 'resource');

-- ========================================
-- 2. CONTENT VERSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL, -- Reference to the actual content (course, module, lesson)

  -- Version Info
  version_number VARCHAR(50) NOT NULL, -- e.g., "1.0.0", "2.1.3"
  version_major INTEGER NOT NULL,
  version_minor INTEGER NOT NULL,
  version_patch INTEGER NOT NULL,
  change_type version_change_type NOT NULL,

  -- Status
  status content_status DEFAULT 'draft',
  is_current BOOLEAN DEFAULT false, -- Current active version
  is_published BOOLEAN DEFAULT false,

  -- Content Snapshot
  content_data JSONB NOT NULL, -- Full content snapshot at this version

  -- Change Information
  change_summary VARCHAR(500),
  change_description TEXT,
  breaking_changes TEXT[],

  -- Publishing
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_publish_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Author
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_versions_content ON content_versions(content_type, content_id);
CREATE INDEX idx_content_versions_version ON content_versions(version_number);
CREATE INDEX idx_content_versions_status ON content_versions(status);
CREATE INDEX idx_content_versions_current ON content_versions(is_current) WHERE is_current = true;
CREATE INDEX idx_content_versions_published ON content_versions(is_published) WHERE is_published = true;
CREATE INDEX idx_content_versions_scheduled ON content_versions(scheduled_publish_at) WHERE status = 'scheduled';

-- ========================================
-- 3. VERSION CHANGELOG
-- ========================================

CREATE TABLE IF NOT EXISTS version_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Version Reference
  version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Change Details
  change_category VARCHAR(100), -- 'content', 'metadata', 'structure', 'media'
  change_type VARCHAR(50), -- 'added', 'modified', 'removed'
  field_path VARCHAR(255), -- JSON path to changed field
  old_value JSONB,
  new_value JSONB,

  -- Metadata
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_changelog_version ON version_changelog(version_id);
CREATE INDEX idx_changelog_content ON version_changelog(content_type, content_id);
CREATE INDEX idx_changelog_category ON version_changelog(change_category);
CREATE INDEX idx_changelog_changed ON version_changelog(changed_at DESC);

-- ========================================
-- 4. CONTENT APPROVALS
-- ========================================

CREATE TABLE IF NOT EXISTS content_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Version Reference
  version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Approval Details
  approval_status approval_status DEFAULT 'pending',

  -- Reviewer
  requested_from UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP DEFAULT NOW(),

  -- Response
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  changes_requested TEXT[],

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approvals_version ON content_approvals(version_id);
CREATE INDEX idx_approvals_content ON content_approvals(content_type, content_id);
CREATE INDEX idx_approvals_status ON content_approvals(approval_status);
CREATE INDEX idx_approvals_requested_from ON content_approvals(requested_from);
CREATE INDEX idx_approvals_pending ON content_approvals(approval_status, requested_from)
  WHERE approval_status = 'pending';

-- ========================================
-- 5. CONTENT LOCKS (for editing)
-- ========================================

CREATE TABLE IF NOT EXISTS content_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Lock Details
  locked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,

  -- Lock Reason
  lock_reason VARCHAR(255),

  CONSTRAINT unique_content_lock UNIQUE (content_type, content_id)
);

CREATE INDEX idx_locks_content ON content_locks(content_type, content_id);
CREATE INDEX idx_locks_user ON content_locks(locked_by);
CREATE INDEX idx_locks_expires ON content_locks(expires_at);

-- ========================================
-- 6. PUBLISHING SCHEDULES
-- ========================================

CREATE TABLE IF NOT EXISTS publishing_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Version Reference
  version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Schedule Details
  scheduled_for TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
  published_at TIMESTAMP,
  failed_reason TEXT,

  -- Notifications
  notify_users UUID[],
  notification_sent BOOLEAN DEFAULT false,

  -- Scheduled By
  scheduled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedules_version ON publishing_schedules(version_id);
CREATE INDEX idx_schedules_content ON publishing_schedules(content_type, content_id);
CREATE INDEX idx_schedules_time ON publishing_schedules(scheduled_for);
CREATE INDEX idx_schedules_status ON publishing_schedules(status);

-- ========================================
-- 7. CONTENT DRAFTS (Working copies)
-- ========================================

CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  base_version_id UUID REFERENCES content_versions(id) ON DELETE CASCADE,

  -- Draft Content
  draft_data JSONB NOT NULL,

  -- Draft Metadata
  draft_name VARCHAR(255),
  draft_description TEXT,

  -- Auto-save
  is_autosave BOOLEAN DEFAULT false,
  last_saved_at TIMESTAMP DEFAULT NOW(),

  -- Owner
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drafts_content ON content_drafts(content_type, content_id);
CREATE INDEX idx_drafts_creator ON content_drafts(created_by);
CREATE INDEX idx_drafts_base_version ON content_drafts(base_version_id);
CREATE INDEX idx_drafts_updated ON content_drafts(updated_at DESC);

-- ========================================
-- 8. VERSION COMPARISONS
-- ========================================

CREATE TABLE IF NOT EXISTS version_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Versions Being Compared
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  version_a_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  version_b_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,

  -- Comparison Results
  diff_data JSONB NOT NULL, -- Structured diff between versions
  similarity_score NUMERIC, -- 0-100

  -- Statistics
  fields_added INTEGER DEFAULT 0,
  fields_modified INTEGER DEFAULT 0,
  fields_removed INTEGER DEFAULT 0,

  -- Requested By
  compared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  compared_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comparisons_content ON version_comparisons(content_type, content_id);
CREATE INDEX idx_comparisons_versions ON version_comparisons(version_a_id, version_b_id);

-- ========================================
-- 9. CONTENT ROLLBACK HISTORY
-- ========================================

CREATE TABLE IF NOT EXISTS content_rollbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,

  -- Rollback Details
  from_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  to_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,

  -- Reason
  rollback_reason TEXT NOT NULL,

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Performed By
  rolled_back_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  rolled_back_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rollbacks_content ON content_rollbacks(content_type, content_id);
CREATE INDEX idx_rollbacks_from ON content_rollbacks(from_version_id);
CREATE INDEX idx_rollbacks_to ON content_rollbacks(to_version_id);
CREATE INDEX idx_rollbacks_time ON content_rollbacks(rolled_back_at DESC);

-- ========================================
-- 10. CONTENT TAGS & METADATA
-- ========================================

CREATE TABLE IF NOT EXISTS content_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content Reference
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  version_id UUID REFERENCES content_versions(id) ON DELETE CASCADE,

  -- Metadata
  tags TEXT[],
  categories TEXT[],
  keywords TEXT[],

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255),

  -- Localization
  language VARCHAR(10) DEFAULT 'en',
  translations JSONB, -- Map of language codes to content IDs

  -- Custom Fields
  custom_fields JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_content_metadata UNIQUE (content_type, content_id)
);

CREATE INDEX idx_metadata_content ON content_metadata(content_type, content_id);
CREATE INDEX idx_metadata_version ON content_metadata(version_id);
CREATE INDEX idx_metadata_tags ON content_metadata USING GIN(tags);
CREATE INDEX idx_metadata_slug ON content_metadata(slug);
CREATE INDEX idx_metadata_language ON content_metadata(language);

-- ========================================
-- 11. FUNCTIONS
-- ========================================

-- Function: Create new version
CREATE OR REPLACE FUNCTION create_content_version(
  p_content_type content_type,
  p_content_id UUID,
  p_content_data JSONB,
  p_change_type version_change_type,
  p_change_summary VARCHAR,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_current_version RECORD;
  v_new_major INTEGER;
  v_new_minor INTEGER;
  v_new_patch INTEGER;
  v_version_number VARCHAR(50);
BEGIN
  -- Get current version
  SELECT * INTO v_current_version
  FROM content_versions
  WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND is_current = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate new version number
  IF v_current_version IS NULL THEN
    v_new_major := 1;
    v_new_minor := 0;
    v_new_patch := 0;
  ELSE
    CASE p_change_type
      WHEN 'major' THEN
        v_new_major := v_current_version.version_major + 1;
        v_new_minor := 0;
        v_new_patch := 0;
      WHEN 'minor' THEN
        v_new_major := v_current_version.version_major;
        v_new_minor := v_current_version.version_minor + 1;
        v_new_patch := 0;
      WHEN 'patch' THEN
        v_new_major := v_current_version.version_major;
        v_new_minor := v_current_version.version_minor;
        v_new_patch := v_current_version.version_patch + 1;
      ELSE -- 'draft'
        v_new_major := v_current_version.version_major;
        v_new_minor := v_current_version.version_minor;
        v_new_patch := v_current_version.version_patch;
    END CASE;
  END IF;

  v_version_number := v_new_major || '.' || v_new_minor || '.' || v_new_patch;

  -- Create new version
  INSERT INTO content_versions (
    content_type, content_id, content_data,
    version_number, version_major, version_minor, version_patch,
    change_type, change_summary, status,
    is_current, created_by
  ) VALUES (
    p_content_type, p_content_id, p_content_data,
    v_version_number, v_new_major, v_new_minor, v_new_patch,
    p_change_type, p_change_summary, 'draft',
    false, p_created_by
  )
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Publish version
CREATE OR REPLACE FUNCTION publish_content_version(
  p_version_id UUID,
  p_published_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_version RECORD;
BEGIN
  -- Get version details
  SELECT * INTO v_version
  FROM content_versions
  WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Unpublish current version
  UPDATE content_versions
  SET is_current = false
  WHERE content_type = v_version.content_type
    AND content_id = v_version.content_id
    AND is_current = true;

  -- Publish new version
  UPDATE content_versions
  SET
    status = 'published',
    is_current = true,
    is_published = true,
    published_at = NOW(),
    published_by = p_published_by
  WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Rollback to version
CREATE OR REPLACE FUNCTION rollback_content_version(
  p_content_type content_type,
  p_content_id UUID,
  p_to_version_id UUID,
  p_rollback_reason TEXT,
  p_rolled_back_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_from_version_id UUID;
  v_rollback_id UUID;
BEGIN
  -- Get current version
  SELECT id INTO v_from_version_id
  FROM content_versions
  WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND is_current = true;

  -- Unpublish current version
  UPDATE content_versions
  SET is_current = false
  WHERE id = v_from_version_id;

  -- Publish target version
  UPDATE content_versions
  SET
    is_current = true,
    status = 'published',
    published_at = NOW()
  WHERE id = p_to_version_id;

  -- Record rollback
  INSERT INTO content_rollbacks (
    content_type, content_id,
    from_version_id, to_version_id,
    rollback_reason, rolled_back_by
  ) VALUES (
    p_content_type, p_content_id,
    v_from_version_id, p_to_version_id,
    p_rollback_reason, p_rolled_back_by
  )
  RETURNING id INTO v_rollback_id;

  RETURN v_rollback_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Lock content for editing
CREATE OR REPLACE FUNCTION lock_content(
  p_content_type content_type,
  p_content_id UUID,
  p_locked_by UUID,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_lock_id UUID;
BEGIN
  INSERT INTO content_locks (
    content_type, content_id, locked_by,
    expires_at
  ) VALUES (
    p_content_type, p_content_id, p_locked_by,
    NOW() + (p_duration_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET
    locked_by = EXCLUDED.locked_by,
    locked_at = NOW(),
    expires_at = EXCLUDED.expires_at
  RETURNING id INTO v_lock_id;

  RETURN v_lock_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Unlock content
CREATE OR REPLACE FUNCTION unlock_content(
  p_content_type content_type,
  p_content_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM content_locks
  WHERE content_type = p_content_type
    AND content_id = p_content_id
    AND locked_by = p_user_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if content is locked
CREATE OR REPLACE FUNCTION is_content_locked(
  p_content_type content_type,
  p_content_id UUID
)
RETURNS TABLE(
  is_locked BOOLEAN,
  locked_by UUID,
  locked_at TIMESTAMP,
  expires_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true,
    cl.locked_by,
    cl.locked_at,
    cl.expires_at
  FROM content_locks cl
  WHERE cl.content_type = p_content_type
    AND cl.content_id = p_content_id
    AND cl.expires_at > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TIMESTAMP, NULL::TIMESTAMP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 12. TRIGGERS
-- ========================================

-- Trigger: Clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM content_locks
  WHERE expires_at < NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run periodically (can be triggered by a scheduled job)

-- Trigger: Update version timestamps
CREATE OR REPLACE FUNCTION update_version_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_version_timestamp
BEFORE UPDATE ON content_versions
FOR EACH ROW
EXECUTE FUNCTION update_version_timestamp();

CREATE TRIGGER trigger_update_draft_timestamp
BEFORE UPDATE ON content_drafts
FOR EACH ROW
EXECUTE FUNCTION update_version_timestamp();

-- ========================================
-- 13. VIEWS
-- ========================================

-- View: Current versions
CREATE OR REPLACE VIEW current_content_versions AS
SELECT
  cv.id,
  cv.content_type,
  cv.content_id,
  cv.version_number,
  cv.status,
  cv.published_at,
  u.full_name AS published_by_name,
  cv.created_at
FROM content_versions cv
LEFT JOIN users u ON cv.published_by = u.id
WHERE cv.is_current = true;

-- View: Pending approvals
CREATE OR REPLACE VIEW pending_content_approvals AS
SELECT
  ca.id,
  ca.content_type,
  ca.content_id,
  cv.version_number,
  ca.approval_status,
  ca.requested_from,
  u1.full_name AS requested_from_name,
  ca.requested_by,
  u2.full_name AS requested_by_name,
  ca.requested_at,
  cv.change_summary
FROM content_approvals ca
JOIN content_versions cv ON ca.version_id = cv.id
LEFT JOIN users u1 ON ca.requested_from = u1.id
LEFT JOIN users u2 ON ca.requested_by = u2.id
WHERE ca.approval_status = 'pending'
ORDER BY ca.requested_at ASC;

-- View: Scheduled publishes
CREATE OR REPLACE VIEW upcoming_publishes AS
SELECT
  ps.id,
  ps.content_type,
  ps.content_id,
  cv.version_number,
  ps.scheduled_for,
  ps.status,
  u.full_name AS scheduled_by_name,
  cv.change_summary
FROM publishing_schedules ps
JOIN content_versions cv ON ps.version_id = cv.id
LEFT JOIN users u ON ps.scheduled_by = u.id
WHERE ps.status = 'scheduled'
  AND ps.scheduled_for > NOW()
ORDER BY ps.scheduled_for ASC;

-- View: Content locks
CREATE OR REPLACE VIEW active_content_locks AS
SELECT
  cl.content_type,
  cl.content_id,
  cl.locked_by,
  u.full_name AS locked_by_name,
  cl.locked_at,
  cl.expires_at,
  cl.lock_reason
FROM content_locks cl
JOIN users u ON cl.locked_by = u.id
WHERE cl.expires_at > NOW();

-- View: Version history summary
CREATE OR REPLACE VIEW version_history_summary AS
SELECT
  cv.content_type,
  cv.content_id,
  COUNT(*) AS total_versions,
  MAX(cv.version_number) AS latest_version,
  MAX(cv.published_at) FILTER (WHERE cv.is_published = true) AS last_published_at,
  COUNT(*) FILTER (WHERE cv.status = 'draft') AS draft_count,
  COUNT(*) FILTER (WHERE cv.status = 'published') AS published_count
FROM content_versions cv
GROUP BY cv.content_type, cv.content_id;

COMMENT ON SCHEMA public IS 'Content Versioning & Publishing System - Version control and publishing workflow';
