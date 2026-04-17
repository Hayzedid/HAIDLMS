import pool from '../db/pool';
import { PoolClient } from 'pg';

interface PortfolioSettings {
  userId: string;
  isPublic: boolean;
  customUrlSlug?: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  personalWebsite?: string;
  emailPublic?: string;
  themeColor?: string;
  themeStyle?: string;
  layoutType?: string;
  featuredProjects?: string[];
  featuredBadges?: string[];
  featuredSkills?: string[];
  showCourses?: boolean;
  showBadges?: boolean;
  showProjects?: boolean;
  showSkills?: boolean;
  showActivity?: boolean;
  showPeerReviews?: boolean;
  showContactForm?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}

interface PortfolioProject {
  id?: string;
  userId: string;
  title: string;
  description: string;
  detailedDescription?: string;
  projectType?: string;
  liveUrl?: string;
  repositoryUrl?: string;
  demoVideoUrl?: string;
  thumbnailUrl?: string;
  screenshotUrls?: string[];
  videoEmbedUrl?: string;
  technologies: string[];
  skillsDemonstrated?: string[];
  courseId?: string;
  assessmentId?: string;
  linesOfCode?: number;
  completionTimeHours?: number;
  finalGrade?: number;
  peerReviewRating?: number;
  keyFeatures?: string[];
  challengesOvercome?: string;
  lessonsLearned?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  displayOrder?: number;
  completedAt?: Date;
}

interface CompetencyScore {
  userId: string;
  skillName: string;
  skillCategory?: string;
  proficiencyLevel: string;
  proficiencyScore: number;
  coursesCompleted?: number;
  projectsCompleted?: number;
  assessmentsPassed?: number;
  badgesEarned?: number;
  peerReviewsGiven?: number;
  validatedByInstructor?: boolean;
  endorsedByPeers?: number;
}

interface PortfolioView {
  portfolioUserId: string;
  viewerIp?: string;
  viewerCountry?: string;
  viewerCity?: string;
  viewerUserAgent?: string;
  referrerUrl?: string;
  referrerSource?: string;
}

interface Endorsement {
  portfolioUserId: string;
  endorserUserId: string;
  skillName: string;
  endorsementMessage?: string;
  workedTogetherOn?: string;
  isPublic?: boolean;
}

export class PortfolioService {
  // ========================================
  // PORTFOLIO SETTINGS
  // ========================================

  async getPortfolioByUsername(username: string): Promise<any> {
    const client = await pool.connect();
    try {
      // Get portfolio settings by custom slug or user ID
      const settingsQuery = `
        SELECT
          ps.*,
          u.id as user_id,
          u.full_name,
          u.email,
          u.avatar_url as user_avatar
        FROM portfolio_settings ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.custom_url_slug = $1 AND ps.is_public = true
      `;

      const settingsResult = await client.query(settingsQuery, [username]);

      if (settingsResult.rows.length === 0) {
        throw new Error('Portfolio not found or not public');
      }

      const settings = settingsResult.rows[0];
      const userId = settings.user_id;

      // Get projects
      const projectsQuery = `
        SELECT
          id, title, description, thumbnail_url, technologies,
          live_url, repository_url, completed_at, peer_review_rating
        FROM portfolio_projects
        WHERE user_id = $1 AND is_public = true
        ORDER BY is_featured DESC, display_order ASC, completed_at DESC
      `;
      const projectsResult = await client.query(projectsQuery, [userId]);

      // Get skills
      const skillsQuery = `
        SELECT
          skill_name, proficiency_level, proficiency_score, endorsed_by_peers
        FROM competency_scores
        WHERE user_id = $1
        ORDER BY proficiency_score DESC, endorsed_by_peers DESC
        LIMIT 20
      `;
      const skillsResult = await client.query(skillsQuery, [userId]);

      // Get activity
      const activityQuery = `
        SELECT
          id, activity_type, activity_title, activity_date,
          icon_name, icon_color
        FROM portfolio_activity
        WHERE user_id = $1 AND is_public = true
        ORDER BY activity_date DESC
        LIMIT 50
      `;
      const activityResult = await client.query(activityQuery, [userId]);

      // Get stats
      const statsResult = await client.query(
        'SELECT * FROM get_portfolio_stats($1)',
        [userId]
      );
      const stats = statsResult.rows[0] || {};

      return {
        user: {
          id: userId,
          fullName: settings.full_name,
          email: settings.email,
        },
        settings: {
          displayName: settings.display_name || settings.full_name,
          headline: settings.headline,
          bio: settings.bio,
          avatarUrl: settings.avatar_url || settings.user_avatar,
          location: settings.location,
          linkedinUrl: settings.linkedin_url,
          githubUrl: settings.github_url,
          personalWebsite: settings.personal_website,
          emailPublic: settings.email_public,
          themeColor: settings.theme_color,
          viewCount: settings.view_count,
        },
        projects: projectsResult.rows.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          thumbnailUrl: p.thumbnail_url,
          technologies: p.technologies || [],
          liveUrl: p.live_url,
          repositoryUrl: p.repository_url,
          completedAt: p.completed_at,
          peerReviewRating: p.peer_review_rating,
        })),
        skills: skillsResult.rows.map(s => ({
          skillName: s.skill_name,
          proficiencyLevel: s.proficiency_level,
          proficiencyScore: s.proficiency_score,
          endorsedByPeers: s.endorsed_by_peers,
        })),
        activity: activityResult.rows.map(a => ({
          id: a.id,
          activityType: a.activity_type,
          activityTitle: a.activity_title,
          activityDate: a.activity_date,
          iconName: a.icon_name,
          iconColor: a.icon_color,
        })),
        stats: {
          totalCourses: stats.total_courses || 0,
          totalProjects: stats.total_projects || 0,
          totalBadges: stats.total_badges || 0,
          totalSkills: stats.total_skills || 0,
        },
      };
    } finally {
      client.release();
    }
  }

  async getPortfolioSettings(userId: string): Promise<any> {
    const query = `
      SELECT * FROM portfolio_settings WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // Create default settings if none exist
      return this.createDefaultSettings(userId);
    }

    return result.rows[0];
  }

  async createDefaultSettings(userId: string): Promise<any> {
    // Get user info for defaults
    const userQuery = 'SELECT full_name, email FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    // Generate custom URL slug from full name
    const slug = user.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const query = `
      INSERT INTO portfolio_settings (
        user_id, is_public, custom_url_slug, display_name
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      true,
      slug,
      user.full_name,
    ]);

    return result.rows[0];
  }

  async updatePortfolioSettings(
    userId: string,
    settings: Partial<PortfolioSettings>
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && key !== 'userId') {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(userId);

    const query = `
      UPDATE portfolio_settings
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Create settings if they don't exist
      return this.createDefaultSettings(userId);
    }

    return result.rows[0];
  }

  async checkSlugAvailability(slug: string, userId?: string): Promise<boolean> {
    let query = 'SELECT id FROM portfolio_settings WHERE custom_url_slug = $1';
    const params: any[] = [slug];

    if (userId) {
      query += ' AND user_id != $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows.length === 0;
  }

  // ========================================
  // PORTFOLIO PROJECTS
  // ========================================

  async getProjects(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM portfolio_projects
      WHERE user_id = $1
      ORDER BY is_featured DESC, display_order ASC, completed_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async getProjectById(projectId: string, userId: string): Promise<any> {
    const query = `
      SELECT * FROM portfolio_projects
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [projectId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return result.rows[0];
  }

  async createProject(project: PortfolioProject): Promise<any> {
    const query = `
      INSERT INTO portfolio_projects (
        user_id, title, description, detailed_description, project_type,
        live_url, repository_url, demo_video_url, thumbnail_url,
        screenshot_urls, video_embed_url, technologies, skills_demonstrated,
        course_id, assessment_id, lines_of_code, completion_time_hours,
        final_grade, peer_review_rating, key_features, challenges_overcome,
        lessons_learned, is_featured, is_public, display_order, completed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      RETURNING *
    `;

    const values = [
      project.userId,
      project.title,
      project.description,
      project.detailedDescription,
      project.projectType,
      project.liveUrl,
      project.repositoryUrl,
      project.demoVideoUrl,
      project.thumbnailUrl,
      project.screenshotUrls,
      project.videoEmbedUrl,
      project.technologies,
      project.skillsDemonstrated,
      project.courseId,
      project.assessmentId,
      project.linesOfCode,
      project.completionTimeHours,
      project.finalGrade,
      project.peerReviewRating,
      project.keyFeatures,
      project.challengesOvercome,
      project.lessonsLearned,
      project.isFeatured || false,
      project.isPublic !== false,
      project.displayOrder || 0,
      project.completedAt,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<PortfolioProject>
  ): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'userId') {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(projectId, userId);

    const query = `
      UPDATE portfolio_projects
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Project not found');
    }

    return result.rows[0];
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM portfolio_projects
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [projectId, userId]);

    if (result.rowCount === 0) {
      throw new Error('Project not found');
    }
  }

  // ========================================
  // COMPETENCY SCORES
  // ========================================

  async getCompetencyScores(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM competency_scores
      WHERE user_id = $1
      ORDER BY proficiency_score DESC, endorsed_by_peers DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async updateCompetencyScore(score: CompetencyScore): Promise<any> {
    const query = `
      INSERT INTO competency_scores (
        user_id, skill_name, skill_category, proficiency_level,
        proficiency_score, courses_completed, projects_completed,
        assessments_passed, badges_earned, peer_reviews_given,
        validated_by_instructor, endorsed_by_peers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, skill_name)
      DO UPDATE SET
        skill_category = EXCLUDED.skill_category,
        proficiency_level = EXCLUDED.proficiency_level,
        proficiency_score = EXCLUDED.proficiency_score,
        courses_completed = EXCLUDED.courses_completed,
        projects_completed = EXCLUDED.projects_completed,
        assessments_passed = EXCLUDED.assessments_passed,
        badges_earned = EXCLUDED.badges_earned,
        peer_reviews_given = EXCLUDED.peer_reviews_given,
        validated_by_instructor = EXCLUDED.validated_by_instructor,
        last_used_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      score.userId,
      score.skillName,
      score.skillCategory,
      score.proficiencyLevel,
      score.proficiencyScore,
      score.coursesCompleted || 0,
      score.projectsCompleted || 0,
      score.assessmentsPassed || 0,
      score.badgesEarned || 0,
      score.peerReviewsGiven || 0,
      score.validatedByInstructor || false,
      score.endorsedByPeers || 0,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async calculateSkillProficiency(userId: string, skillName: string): Promise<number> {
    const query = 'SELECT calculate_skill_proficiency($1, $2) as score';
    const result = await pool.query(query, [userId, skillName]);
    return result.rows[0].score;
  }

  // ========================================
  // ACTIVITY TIMELINE
  // ========================================

  async getActivity(userId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM portfolio_activity
      WHERE user_id = $1 AND is_public = true
      ORDER BY activity_date DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  async createActivity(activity: {
    userId: string;
    activityType: string;
    activityTitle: string;
    activityDescription?: string;
    relatedCourseId?: string;
    relatedProjectId?: string;
    relatedBadgeId?: string;
    iconName?: string;
    iconColor?: string;
    isHighlighted?: boolean;
    isPublic?: boolean;
    activityDate?: Date;
  }): Promise<any> {
    const query = `
      INSERT INTO portfolio_activity (
        user_id, activity_type, activity_title, activity_description,
        related_course_id, related_project_id, related_badge_id,
        icon_name, icon_color, is_highlighted, is_public, activity_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      activity.userId,
      activity.activityType,
      activity.activityTitle,
      activity.activityDescription,
      activity.relatedCourseId,
      activity.relatedProjectId,
      activity.relatedBadgeId,
      activity.iconName,
      activity.iconColor,
      activity.isHighlighted || false,
      activity.isPublic !== false,
      activity.activityDate || new Date(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // PORTFOLIO VIEWS
  // ========================================

  async trackView(view: PortfolioView): Promise<void> {
    const query = `
      INSERT INTO portfolio_views (
        portfolio_user_id, viewer_ip, viewer_country, viewer_city,
        viewer_user_agent, referrer_url, referrer_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      view.portfolioUserId,
      view.viewerIp,
      view.viewerCountry,
      view.viewerCity,
      view.viewerUserAgent,
      view.referrerUrl,
      view.referrerSource,
    ];

    await pool.query(query, values);
  }

  async getViewAnalytics(userId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_ip) as unique_visitors,
        COUNT(DISTINCT DATE(viewed_at)) as days_with_views,
        referrer_source,
        COUNT(*) as source_count
      FROM portfolio_views
      WHERE portfolio_user_id = $1
      GROUP BY referrer_source
      ORDER BY source_count DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ========================================
  // ENDORSEMENTS
  // ========================================

  async getEndorsements(userId: string): Promise<any[]> {
    const query = `
      SELECT
        pe.*,
        u.full_name as endorser_name,
        u.avatar_url as endorser_avatar
      FROM portfolio_endorsements pe
      JOIN users u ON pe.endorser_user_id = u.id
      WHERE pe.portfolio_user_id = $1 AND pe.is_public = true
      ORDER BY pe.endorsed_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async createEndorsement(endorsement: Endorsement): Promise<any> {
    const query = `
      INSERT INTO portfolio_endorsements (
        portfolio_user_id, endorser_user_id, skill_name,
        endorsement_message, worked_together_on, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (portfolio_user_id, endorser_user_id, skill_name)
      DO UPDATE SET
        endorsement_message = EXCLUDED.endorsement_message,
        worked_together_on = EXCLUDED.worked_together_on,
        endorsed_at = NOW()
      RETURNING *
    `;

    const values = [
      endorsement.portfolioUserId,
      endorsement.endorserUserId,
      endorsement.skillName,
      endorsement.endorsementMessage,
      endorsement.workedTogetherOn,
      endorsement.isPublic !== false,
    ];

    const result = await pool.query(query, values);

    // Increment endorsement count in competency_scores
    await pool.query(
      `UPDATE competency_scores
       SET endorsed_by_peers = endorsed_by_peers + 1
       WHERE user_id = $1 AND skill_name = $2`,
      [endorsement.portfolioUserId, endorsement.skillName]
    );

    return result.rows[0];
  }

  // ========================================
  // STATS
  // ========================================

  async getPortfolioStats(userId: string): Promise<any> {
    const query = 'SELECT * FROM get_portfolio_stats($1)';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  }
}

export const portfolioService = new PortfolioService();
