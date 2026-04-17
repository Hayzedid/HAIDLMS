import pool from '../db/pool';
import * as crypto from 'crypto';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress: string;
  userAgent?: string;
  countryCode?: string;
  city?: string;
  expiresAt: Date;
}

interface CreateSecurityAlertParams {
  userId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  details?: any;
  ipAddress?: string;
  sessionId?: string;
}

interface CreateIPRuleParams {
  organizationId?: string;
  userId?: string;
  ipAddress?: string;
  ipRange?: string;
  countryCode?: string;
  action: string;
  priority?: number;
  description?: string;
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
}

// ============================================================================
// SECURITY SERVICE
// ============================================================================

export class SecurityService {
  // ========================================
  // PASSWORD MANAGEMENT
  // ========================================

  async getPasswordPolicy(organizationId?: string): Promise<any> {
    let query = `SELECT * FROM password_policies WHERE `;

    if (organizationId) {
      query += `organization_id = $1`;
      const result = await pool.query(query, [organizationId]);
      if (result.rows.length > 0) return result.rows[0];
    }

    // Fall back to default policy
    query = `SELECT * FROM password_policies WHERE is_default = true`;
    const result = await pool.query(query);
    return result.rows[0];
  }

  async validatePassword(password: string, userId: string, organizationId?: string): Promise<{ valid: boolean; errors: string[] }> {
    const policy = await this.getPasswordPolicy(organizationId);
    const errors: string[] = [];

    // Length check
    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`);
    }
    if (password.length > policy.max_length) {
      errors.push(`Password must be no more than ${policy.max_length} characters long`);
    }

    // Character requirements
    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (policy.require_special_chars) {
      const specialChars = policy.special_chars_list.split('');
      const hasSpecial = specialChars.some(char => password.includes(char));
      if (!hasSpecial) {
        errors.push('Password must contain at least one special character');
      }
    }

    // Repeated characters
    if (policy.prevent_repeated_chars) {
      const maxRepeated = policy.max_repeated_chars;
      const repeatedPattern = new RegExp(`(.)\\1{${maxRepeated},}`);
      if (repeatedPattern.test(password)) {
        errors.push(`Password cannot contain more than ${maxRepeated} repeated characters`);
      }
    }

    // Check password history
    if (userId) {
      const passwordHash = this.hashPassword(password);
      const inHistory = await this.isPasswordInHistory(userId, passwordHash);
      if (inHistory) {
        errors.push('Password has been used recently. Please choose a different password');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async canChangePassword(userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT can_change_password($1) as can_change`,
      [userId]
    );
    return result.rows[0]?.can_change || false;
  }

  async isPasswordInHistory(userId: string, passwordHash: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT is_password_in_history($1, $2) as in_history`,
      [userId, passwordHash]
    );
    return result.rows[0]?.in_history || false;
  }

  async savePasswordHistory(
    userId: string,
    passwordHash: string,
    changedBy?: string,
    changeReason?: string,
    ipAddress?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO password_history (user_id, password_hash, changed_by, change_reason, ip_address)
      VALUES ($1, $2, $3, $4, $5)`,
      [userId, passwordHash, changedBy, changeReason, ipAddress]
    );
  }

  async getPasswordHistory(userId: string, limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string, ipAddress: string, userAgent?: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashPassword(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, token_hash, expires_at, requested_ip, requested_user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, token, tokenHash, expiresAt, ipAddress, userAgent]
    );

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<any> {
    const tokenHash = this.hashPassword(token);

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
      WHERE token_hash = $1
        AND is_used = false
        AND expires_at > NOW()`,
      [tokenHash]
    );

    return result.rows[0];
  }

  async usePasswordResetToken(tokenId: string, ipAddress: string, userAgent?: string): Promise<void> {
    await pool.query(
      `UPDATE password_reset_tokens
      SET is_used = true, used_at = NOW(), used_ip = $2, used_user_agent = $3
      WHERE id = $1`,
      [tokenId, ipAddress, userAgent]
    );
  }

  // ========================================
  // MULTI-FACTOR AUTHENTICATION
  // ========================================

  async setupMFA(userId: string, method: string): Promise<any> {
    const totpSecret = this.generateTOTPSecret();

    const result = await pool.query(
      `INSERT INTO mfa_settings (user_id, primary_method, totp_secret)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET primary_method = $2, totp_secret = $3, updated_at = NOW()
      RETURNING *`,
      [userId, method, totpSecret]
    );

    return result.rows[0];
  }

  async enableMFA(userId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE mfa_settings
      SET is_enabled = true, enabled_at = NOW(), totp_verified_at = NOW()
      WHERE user_id = $1
      RETURNING *`,
      [userId]
    );

    return result.rows[0];
  }

  async disableMFA(userId: string): Promise<void> {
    await pool.query(
      `UPDATE mfa_settings
      SET is_enabled = false, disabled_at = NOW()
      WHERE user_id = $1`,
      [userId]
    );

    // Create security alert
    await this.createSecurityAlert({
      userId,
      alertType: 'mfa_disabled',
      severity: 'high',
      title: 'MFA Disabled',
      message: 'Multi-factor authentication has been disabled on your account'
    });
  }

  async getMFASettings(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM mfa_settings WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  async verifyMFA(userId: string, method: string, code: string): Promise<boolean> {
    const settings = await this.getMFASettings(userId);
    let isValid = false;

    if (method === 'totp') {
      isValid = this.verifyTOTP(settings.totp_secret, code);
    } else if (method === 'backup_codes') {
      isValid = await this.verifyBackupCode(userId, code);
    }

    // Log verification attempt
    await pool.query(
      `INSERT INTO mfa_verifications (user_id, method, was_successful)
      VALUES ($1, $2, $3)`,
      [userId, method, isValid]
    );

    if (isValid) {
      await pool.query(
        `UPDATE mfa_settings SET last_used_at = NOW() WHERE user_id = $1`,
        [userId]
      );
    }

    return isValid;
  }

  async generateBackupCodes(userId: string, count: number = 10): Promise<string[]> {
    const codes: string[] = [];

    // Delete old backup codes
    await pool.query(`DELETE FROM mfa_backup_codes WHERE user_id = $1`, [userId]);

    // Generate new codes
    for (let i = 0; i < count; i++) {
      const code = this.generateBackupCode();
      const codeHash = this.hashPassword(code);

      await pool.query(
        `INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, codeHash]
      );

      codes.push(code);
    }

    // Update MFA settings
    await pool.query(
      `UPDATE mfa_settings
      SET backup_codes_generated_at = NOW(), backup_codes_count = $2
      WHERE user_id = $1`,
      [userId, count]
    );

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const codeHash = this.hashPassword(code);

    const result = await pool.query(
      `SELECT * FROM mfa_backup_codes
      WHERE user_id = $1 AND code_hash = $2 AND is_used = false`,
      [userId, codeHash]
    );

    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE mfa_backup_codes SET is_used = true, used_at = NOW() WHERE id = $1`,
        [result.rows[0].id]
      );
      return true;
    }

    return false;
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async createSession(params: CreateSessionParams): Promise<any> {
    const {
      userId,
      sessionToken,
      refreshToken,
      deviceName,
      deviceType,
      browser,
      os,
      ipAddress,
      userAgent,
      countryCode,
      city,
      expiresAt
    } = params;

    const result = await pool.query(
      `INSERT INTO user_sessions (
        user_id, session_token, refresh_token, device_name, device_type,
        browser, os, ip_address, user_agent, country_code, city, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        sessionToken,
        refreshToken,
        deviceName,
        deviceType,
        browser,
        os,
        ipAddress,
        userAgent,
        countryCode,
        city,
        expiresAt
      ]
    );

    return result.rows[0];
  }

  async getSession(sessionToken: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM user_sessions WHERE session_token = $1 AND status = 'active'`,
      [sessionToken]
    );
    return result.rows[0];
  }

  async getUserSessions(userId: string, activeOnly: boolean = true): Promise<any[]> {
    let query = `SELECT * FROM user_sessions WHERE user_id = $1`;

    if (activeOnly) {
      query += ` AND status = 'active'`;
    }

    query += ` ORDER BY last_activity_at DESC`;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await pool.query(
      `UPDATE user_sessions
      SET last_activity_at = NOW(), activity_count = activity_count + 1
      WHERE id = $1`,
      [sessionId]
    );
  }

  async revokeSession(sessionId: string, revokedBy?: string, reason?: string): Promise<void> {
    await pool.query(
      `UPDATE user_sessions
      SET status = 'revoked', revoked_at = NOW(), revoked_by = $2, revoke_reason = $3
      WHERE id = $1`,
      [sessionId, revokedBy, reason]
    );
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    let query = `UPDATE user_sessions SET status = 'revoked', revoked_at = NOW()
      WHERE user_id = $1 AND status = 'active'`;

    const params: any[] = [userId];

    if (exceptSessionId) {
      query += ` AND id != $2`;
      params.push(exceptSessionId);
    }

    const result = await pool.query(query, params);
    return result.rowCount || 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await pool.query(`SELECT cleanup_expired_sessions()`);
    return result.rows[0]?.cleanup_expired_sessions || 0;
  }

  async getActiveSessions(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM active_sessions_overview LIMIT 100`);
    return result.rows;
  }

  // ========================================
  // IP RULES
  // ========================================

  async createIPRule(params: CreateIPRuleParams): Promise<any> {
    const {
      organizationId,
      userId,
      ipAddress,
      ipRange,
      countryCode,
      action,
      priority = 0,
      description,
      validFrom,
      validUntil,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO ip_rules (
        organization_id, user_id, ip_address, ip_range, country_code,
        action, priority, description, valid_from, valid_until, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        organizationId,
        userId,
        ipAddress,
        ipRange,
        countryCode,
        action,
        priority,
        description,
        validFrom,
        validUntil,
        createdBy
      ]
    );

    return result.rows[0];
  }

  async checkIPRule(ipAddress: string, userId?: string, organizationId?: string): Promise<string> {
    const result = await pool.query(
      `SELECT check_ip_rule($1, $2, $3) as action`,
      [ipAddress, userId, organizationId]
    );
    return result.rows[0]?.action || 'allow';
  }

  async listIPRules(filters: any = {}): Promise<any[]> {
    const { organizationId, userId, action, isActive = true } = filters;

    let query = `SELECT * FROM ip_rules WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (organizationId) {
      query += ` AND organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY priority DESC, created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async deleteIPRule(ruleId: string): Promise<void> {
    await pool.query(`DELETE FROM ip_rules WHERE id = $1`, [ruleId]);
  }

  // ========================================
  // TRUSTED DEVICES
  // ========================================

  async trustDevice(
    userId: string,
    deviceFingerprint: string,
    deviceName: string,
    deviceType: string,
    browser: string,
    os: string,
    ipAddress: string,
    trustDurationDays: number = 30
  ): Promise<any> {
    const trustExpiresAt = new Date(Date.now() + trustDurationDays * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO trusted_devices (
        user_id, device_fingerprint, device_name, device_type,
        browser, os, ip_address, trust_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, device_fingerprint) DO UPDATE
      SET last_used_at = NOW(), last_used_ip = $7, usage_count = trusted_devices.usage_count + 1
      RETURNING *`,
      [userId, deviceFingerprint, deviceName, deviceType, browser, os, ipAddress, trustExpiresAt]
    );

    return result.rows[0];
  }

  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT * FROM trusted_devices
      WHERE user_id = $1
        AND device_fingerprint = $2
        AND is_trusted = true
        AND (trust_expires_at IS NULL OR trust_expires_at > NOW())`,
      [userId, deviceFingerprint]
    );

    return result.rows.length > 0;
  }

  async getTrustedDevices(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM trusted_devices WHERE user_id = $1 AND is_trusted = true ORDER BY last_used_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async revokeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    await pool.query(
      `UPDATE trusted_devices SET is_trusted = false WHERE user_id = $1 AND id = $2`,
      [userId, deviceId]
    );
  }

  // ========================================
  // SECURITY ALERTS
  // ========================================

  async createSecurityAlert(params: CreateSecurityAlertParams): Promise<string> {
    const {
      userId,
      alertType,
      severity,
      title,
      message,
      details,
      ipAddress,
      sessionId
    } = params;

    const result = await pool.query(
      `INSERT INTO security_alerts (
        user_id, alert_type, severity, title, message, details, ip_address, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        userId,
        alertType,
        severity,
        title,
        message,
        details ? JSON.stringify(details) : null,
        ipAddress,
        sessionId
      ]
    );

    return result.rows[0].id;
  }

  async getUserSecurityAlerts(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    let query = `SELECT * FROM security_alerts WHERE user_id = $1`;

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await pool.query(
      `UPDATE security_alerts SET is_read = true WHERE id = $1`,
      [alertId]
    );
  }

  async dismissAlert(alertId: string): Promise<void> {
    await pool.query(
      `UPDATE security_alerts SET is_dismissed = true WHERE id = $1`,
      [alertId]
    );
  }

  async getSecurityAlertsSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM security_alerts_summary`);
    return result.rows;
  }

  // ========================================
  // STATISTICS & VIEWS
  // ========================================

  async getMFAAdoptionStats(): Promise<any> {
    const result = await pool.query(`SELECT * FROM mfa_adoption_stats`);
    return result.rows[0];
  }

  async getPasswordPolicyCompliance(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM password_policy_compliance LIMIT 100`);
    return result.rows;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }

  private generateBackupCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private verifyTOTP(secret: string, code: string): boolean {
    // Simplified TOTP verification
    // In production, use a library like 'speakeasy' or 'otplib'
    return code.length === 6;
  }
}

export const securityService = new SecurityService();
