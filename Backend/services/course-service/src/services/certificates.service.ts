import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateCertificateTemplateParams {
  name: string;
  description?: string;
  templateType?: string;
  createdBy: string;
  organizationId?: string;
  layout: any;
  backgroundImageUrl?: string;
  borderStyle?: string;
  colorScheme?: any;
  titleText?: string;
  bodyTemplate?: string;
  footerText?: string;
  organizationLogoUrl?: string;
  signatureImages?: string[];
  signatoryNames?: string[];
  signatoryTitles?: string[];
  pageSize?: string;
  orientation?: string;
  includeQrCode?: boolean;
  includeVerificationUrl?: boolean;
  tags?: string[];
}

interface IssueCertificateParams {
  templateId: string;
  userId: string;
  recipientName: string;
  recipientEmail?: string;
  courseId?: string;
  assessmentId?: string;
  courseName?: string;
  completionDate?: string;
  finalGrade?: number;
  finalScore?: number;
  hoursCompleted?: number;
  skillsEarned?: string[];
  customFields?: any;
  issueDate?: string;
  expirationDate?: string;
}

interface CreateBadgeParams {
  name: string;
  description: string;
  badgeType?: string;
  imageUrl: string;
  iconUrl?: string;
  color?: string;
  createdBy: string;
  organizationId?: string;
  criteriaDescription: string;
  earningCriteria?: any;
  courseId?: string;
  assessmentId?: string;
  skillTags?: string[];
  rarity?: string;
  pointsValue?: number;
  isStackable?: boolean;
  maxEarners?: number;
  tags?: string[];
}

// ============================================================================
// CERTIFICATES SERVICE
// ============================================================================

export class CertificatesService {
  // ========================================
  // CERTIFICATE TEMPLATES
  // ========================================

  async createCertificateTemplate(params: CreateCertificateTemplateParams): Promise<any> {
    const {
      name,
      description,
      templateType = 'completion',
      createdBy,
      organizationId,
      layout,
      backgroundImageUrl,
      borderStyle,
      colorScheme,
      titleText,
      bodyTemplate,
      footerText,
      organizationLogoUrl,
      signatureImages,
      signatoryNames,
      signatoryTitles,
      pageSize = 'A4',
      orientation = 'landscape',
      includeQrCode = true,
      includeVerificationUrl = true,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO certificate_templates (
        name, description, template_type, created_by, organization_id,
        layout, background_image_url, border_style, color_scheme,
        title_text, body_template, footer_text, organization_logo_url,
        signature_images, signatory_names, signatory_titles,
        page_size, orientation, include_qr_code, include_verification_url, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        name, description, templateType, createdBy, organizationId || null,
        JSON.stringify(layout), backgroundImageUrl, borderStyle,
        colorScheme ? JSON.stringify(colorScheme) : null,
        titleText, bodyTemplate, footerText, organizationLogoUrl,
        signatureImages || [], signatoryNames || [], signatoryTitles || [],
        pageSize, orientation, includeQrCode, includeVerificationUrl, tags || []
      ]
    );

    return result.rows[0];
  }

  async getCertificateTemplate(templateId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM certificate_templates WHERE id = $1`,
      [templateId]
    );
    return result.rows[0];
  }

  async listCertificateTemplates(filters: any = {}): Promise<{ templates: any[]; total: number }> {
    const { organizationId, templateType, isActive, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM certificate_templates WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (templateType) {
      query += ` AND template_type = $${paramIndex}`;
      params.push(templateType);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      templates: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async updateCertificateTemplate(templateId: string, updates: any): Promise<any> {
    const allowedFields = [
      'name', 'description', 'layout', 'background_image_url', 'border_style',
      'color_scheme', 'title_text', 'body_template', 'footer_text',
      'organization_logo_url', 'signature_images', 'signatory_names',
      'signatory_titles', 'page_size', 'orientation', 'is_active', 'tags'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(templateId);
    const result = await pool.query(
      `UPDATE certificate_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async deleteCertificateTemplate(templateId: string): Promise<void> {
    await pool.query(`UPDATE certificate_templates SET is_active = false WHERE id = $1`, [templateId]);
  }

  // ========================================
  // ISSUE CERTIFICATES
  // ========================================

  async issueCertificate(params: IssueCertificateParams): Promise<any> {
    const {
      templateId,
      userId,
      recipientName,
      recipientEmail,
      courseId,
      assessmentId,
      courseName,
      completionDate,
      finalGrade,
      finalScore,
      hoursCompleted,
      skillsEarned,
      customFields,
      issueDate,
      expirationDate
    } = params;

    // Generate certificate number
    const certNumberResult = await pool.query(`SELECT generate_certificate_number() as cert_number`);
    const certificateNumber = certNumberResult.rows[0].cert_number;

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    const result = await pool.query(
      `INSERT INTO issued_certificates (
        template_id, user_id, recipient_name, recipient_email, course_id, assessment_id,
        certificate_number, verification_code, issue_date, expiration_date,
        course_name, completion_date, final_grade, final_score, hours_completed,
        skills_earned, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        templateId, userId, recipientName, recipientEmail, courseId || null, assessmentId || null,
        certificateNumber, verificationCode, issueDate || new Date().toISOString().split('T')[0],
        expirationDate || null,
        courseName, completionDate, finalGrade, finalScore, hoursCompleted,
        skillsEarned || [], customFields ? JSON.stringify(customFields) : null
      ]
    );

    const certificate = result.rows[0];

    // Generate verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.credential_id}`;
    await pool.query(
      `UPDATE issued_certificates SET verification_url = $1 WHERE id = $2`,
      [verificationUrl, certificate.id]
    );

    return { ...certificate, verification_url: verificationUrl };
  }

  async getCertificate(certificateId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM active_certificates WHERE id = $1`,
      [certificateId]
    );
    return result.rows[0];
  }

  async listUserCertificates(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_certificates WHERE user_id = $1 ORDER BY issue_date DESC`,
      [userId]
    );
    return result.rows;
  }

  async verifyCertificate(credentialId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM issued_certificates WHERE credential_id = $1`,
      [credentialId]
    );

    const certificate = result.rows[0];

    if (!certificate) {
      return { valid: false, status: 'not_found' };
    }

    if (certificate.status === 'revoked') {
      return { valid: false, status: 'revoked', certificate };
    }

    if (certificate.expiration_date && new Date(certificate.expiration_date) < new Date()) {
      return { valid: false, status: 'expired', certificate };
    }

    if (certificate.status !== 'issued' || !certificate.is_active) {
      return { valid: false, status: 'invalid', certificate };
    }

    return { valid: true, status: 'valid', certificate };
  }

  async logVerification(credentialId: string, method: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const certResult = await pool.query(
      `SELECT id FROM issued_certificates WHERE credential_id = $1`,
      [credentialId]
    );

    const certificateId = certResult.rows[0]?.id;
    const result = certificateId ? 'valid' : 'not_found';

    await pool.query(
      `INSERT INTO certificate_verification_log (
        certificate_id, credential_id, verification_method, verification_result,
        ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [certificateId || null, credentialId, method, result, ipAddress, userAgent]
    );

    // Increment view count
    if (certificateId) {
      await pool.query(
        `UPDATE issued_certificates SET view_count = view_count + 1 WHERE id = $1`,
        [certificateId]
      );
    }
  }

  async revokeCertificate(certificateId: string, revokedBy: string, reason: string): Promise<void> {
    await pool.query(
      `SELECT revoke_certificate($1, $2, $3)`,
      [certificateId, revokedBy, reason]
    );
  }

  async shareCertificate(certificateId: string, userId: string, platform: string, shareUrl?: string): Promise<any> {
    const result = await pool.query(
      `INSERT INTO certificate_shares (certificate_id, shared_by, platform, share_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [certificateId, userId, platform, shareUrl]
    );

    // Increment share count
    await pool.query(
      `UPDATE issued_certificates SET share_count = share_count + 1 WHERE id = $1`,
      [certificateId]
    );

    return result.rows[0];
  }

  // ========================================
  // DIGITAL BADGES
  // ========================================

  async createBadge(params: CreateBadgeParams): Promise<any> {
    const {
      name,
      description,
      badgeType = 'achievement',
      imageUrl,
      iconUrl,
      color,
      createdBy,
      organizationId,
      criteriaDescription,
      earningCriteria,
      courseId,
      assessmentId,
      skillTags,
      rarity,
      pointsValue = 0,
      isStackable = false,
      maxEarners,
      tags
    } = params;

    const result = await pool.query(
      `INSERT INTO digital_badges (
        name, description, badge_type, image_url, icon_url, color,
        created_by, organization_id, criteria_description, earning_criteria,
        course_id, assessment_id, skill_tags, rarity, points_value,
        is_stackable, max_earners, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name, description, badgeType, imageUrl, iconUrl, color,
        createdBy, organizationId || null, criteriaDescription,
        earningCriteria ? JSON.stringify(earningCriteria) : null,
        courseId || null, assessmentId || null, skillTags || [],
        rarity, pointsValue, isStackable, maxEarners, tags || []
      ]
    );

    return result.rows[0];
  }

  async getBadge(badgeId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM digital_badges WHERE id = $1`,
      [badgeId]
    );
    return result.rows[0];
  }

  async listBadges(filters: any = {}): Promise<{ badges: any[]; total: number }> {
    const { badgeType, courseId, organizationId, isActive, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM digital_badges WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (badgeType) {
      query += ` AND badge_type = $${paramIndex}`;
      params.push(badgeType);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIndex - 1))
    ]);

    return {
      badges: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10)
    };
  }

  async awardBadge(badgeId: string, userId: string, awardedBy?: string, reason?: string, context?: any): Promise<any> {
    const verificationCode = this.generateVerificationCode();

    const result = await pool.query(
      `INSERT INTO badge_awards (
        badge_id, user_id, awarded_by, award_reason, verification_code,
        course_id, assessment_id, certificate_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        badgeId, userId, awardedBy || null, reason,
        verificationCode,
        context?.courseId || null,
        context?.assessmentId || null,
        context?.certificateId || null
      ]
    );

    return result.rows[0];
  }

  async listUserBadges(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT ba.*, db.name, db.description, db.image_url, db.badge_type, db.rarity, db.points_value
      FROM badge_awards ba
      JOIN digital_badges db ON ba.badge_id = db.id
      WHERE ba.user_id = $1 AND ba.is_revoked = false
      ORDER BY ba.awarded_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async revokeBadgeAward(awardId: string, revokedBy: string, reason: string): Promise<void> {
    await pool.query(
      `UPDATE badge_awards
      SET is_revoked = true, revoked_at = NOW(), revoked_by = $1, revocation_reason = $2
      WHERE id = $3`,
      [revokedBy, reason, awardId]
    );
  }

  async getBadgeLeaderboard(limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM badge_leaderboard LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // ========================================
  // CREDENTIAL WALLET
  // ========================================

  async getOrCreateWallet(userId: string): Promise<any> {
    let result = await pool.query(
      `SELECT * FROM credential_wallets WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO credential_wallets (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
    }

    return result.rows[0];
  }

  async updateWallet(userId: string, updates: any): Promise<any> {
    const allowedFields = [
      'is_public', 'public_url_slug', 'featured_certificates', 'featured_badges',
      'display_order', 'share_with_employers', 'share_with_educators',
      'bio', 'headline', 'website_url', 'linkedin_url'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE credential_wallets SET ${fields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async getPublicWallet(publicUrlSlug: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM credential_wallets WHERE public_url_slug = $1 AND is_public = true`,
      [publicUrlSlug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const wallet = result.rows[0];

    // Get certificates and badges
    const [certificates, badges] = await Promise.all([
      pool.query(
        `SELECT * FROM active_certificates WHERE user_id = $1 ORDER BY issue_date DESC`,
        [wallet.user_id]
      ),
      pool.query(
        `SELECT ba.*, db.* FROM badge_awards ba
        JOIN digital_badges db ON ba.badge_id = db.id
        WHERE ba.user_id = $1 AND ba.is_revoked = false
        ORDER BY ba.awarded_at DESC`,
        [wallet.user_id]
      )
    ]);

    return {
      ...wallet,
      certificates: certificates.rows,
      badges: badges.rows
    };
  }

  // ========================================
  // HELPERS
  // ========================================

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const certificatesService = new CertificatesService();
