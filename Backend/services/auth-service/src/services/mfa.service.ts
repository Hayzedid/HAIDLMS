import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

interface MFASettings {
  id: string;
  userId: string;
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  mfaMethods: string[];
  primaryMethod: string;
  totpSecret?: string;
}

interface WebAuthnCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
  deviceType: string;
}

interface TrustedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  isTrusted: boolean;
  trustExpiresAt?: Date;
}

export class MFAService {
  constructor(private pool: Pool) {}

  // ========================================
  // 1. TOTP (Time-Based One-Time Password)
  // ========================================

  async enableTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: 'HAIDLMS',
      issuer: 'TechLearn LMS',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Store secret in database
    const query = `
      INSERT INTO mfa_settings (user_id, totp_secret, mfa_methods)
      VALUES ($1, $2, ARRAY['totp'])
      ON CONFLICT (user_id)
      DO UPDATE SET
        totp_secret = $2,
        mfa_methods = ARRAY_APPEND(mfa_settings.mfa_methods, 'totp'),
        updated_at = NOW()
    `;

    await this.pool.query(query, [userId, secret.base32]);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const query = 'SELECT totp_secret FROM mfa_settings WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    if (!result.rows[0]?.totp_secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: result.rows[0].totp_secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before and after
    });

    if (verified) {
      await this.pool.query(
        'UPDATE mfa_settings SET totp_last_used_at = NOW() WHERE user_id = $1',
        [userId]
      );
    }

    // Log verification attempt
    await this.logMFAAttempt(userId, 'totp', token, verified);

    return verified;
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    // Generate 10 backup codes
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      hashedCodes.push(this.hashCode(code));
    }

    const query = `
      UPDATE mfa_settings
      SET
        totp_backup_codes = $2,
        recovery_codes_generated_at = NOW(),
        recovery_codes_remaining = 10
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId, hashedCodes]);

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const query = 'SELECT totp_backup_codes FROM mfa_settings WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);

    if (!result.rows[0]?.totp_backup_codes) {
      return false;
    }

    const hashedCode = this.hashCode(code);
    const backupCodes = result.rows[0].totp_backup_codes;

    if (backupCodes.includes(hashedCode)) {
      // Remove used code
      const newCodes = backupCodes.filter((c: string) => c !== hashedCode);

      await this.pool.query(
        `UPDATE mfa_settings
         SET totp_backup_codes = $2, recovery_codes_remaining = $3
         WHERE user_id = $1`,
        [userId, newCodes, newCodes.length]
      );

      await this.logMFAAttempt(userId, 'backup_code', code, true);
      return true;
    }

    await this.logMFAAttempt(userId, 'backup_code', code, false);
    return false;
  }

  // ========================================
  // 2. WEBAUTHN / FIDO2
  // ========================================

  async registerWebAuthnCredential(
    userId: string,
    credentialId: string,
    publicKey: string,
    deviceName: string,
    deviceType: 'platform' | 'cross-platform'
  ): Promise<WebAuthnCredential> {
    const query = `
      INSERT INTO webauthn_credentials (
        user_id, credential_id, public_key, device_name, device_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;

    const values = [userId, credentialId, publicKey, deviceName, deviceType];
    const result = await this.pool.query(query, values);

    // Add webauthn to MFA methods
    await this.pool.query(
      `INSERT INTO mfa_settings (user_id, mfa_methods)
       VALUES ($1, ARRAY['webauthn'])
       ON CONFLICT (user_id)
       DO UPDATE SET mfa_methods = ARRAY_APPEND(mfa_settings.mfa_methods, 'webauthn')`,
      [userId]
    );

    return result.rows[0];
  }

  async getUserWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const query = `
      SELECT * FROM webauthn_credentials
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async verifyWebAuthnCredential(
    credentialId: string,
    signature: string,
    clientData: string
  ): Promise<boolean> {
    // In a real implementation, you'd verify the signature using the public key
    // This is a placeholder that demonstrates the flow

    const query = `
      SELECT * FROM webauthn_credentials
      WHERE credential_id = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [credentialId]);

    if (!result.rows[0]) {
      return false;
    }

    // Update usage statistics
    await this.pool.query(
      `UPDATE webauthn_credentials
       SET counter = counter + 1, last_used_at = NOW(), times_used = times_used + 1
       WHERE credential_id = $1`,
      [credentialId]
    );

    await this.logMFAAttempt(result.rows[0].user_id, 'webauthn', credentialId, true);

    return true;
  }

  async revokeWebAuthnCredential(credentialId: string, reason: string): Promise<void> {
    await this.pool.query(
      `UPDATE webauthn_credentials
       SET is_active = false, revoked_at = NOW(), revocation_reason = $2
       WHERE credential_id = $1`,
      [credentialId, reason]
    );
  }

  // ========================================
  // 3. DEVICE TRUST MANAGEMENT
  // ========================================

  async registerDevice(
    userId: string,
    deviceFingerprint: string,
    deviceInfo: any,
    ipAddress: string
  ): Promise<TrustedDevice> {
    const query = `
      INSERT INTO trusted_devices (
        user_id, device_fingerprint, device_name, user_agent,
        os_name, os_version, browser_name, browser_version, device_type,
        ip_address_first, ip_address_last, is_trusted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, false)
      ON CONFLICT (user_id, device_fingerprint)
      DO UPDATE SET
        last_used_at = NOW(),
        times_used = trusted_devices.times_used + 1,
        ip_address_last = $10
      RETURNING *
    `;

    const values = [
      userId,
      deviceFingerprint,
      deviceInfo.name || 'Unknown Device',
      deviceInfo.userAgent,
      deviceInfo.os,
      deviceInfo.osVersion,
      deviceInfo.browser,
      deviceInfo.browserVersion,
      deviceInfo.deviceType || 'desktop',
      ipAddress,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async trustDevice(userId: string, deviceFingerprint: string, duration Days: number = 30): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await this.pool.query(
      `UPDATE trusted_devices
       SET is_trusted = true, trust_level = 'full', trust_expires_at = $3
       WHERE user_id = $1 AND device_fingerprint = $2`,
      [userId, deviceFingerprint, expiresAt]
    );
  }

  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const query = `
      SELECT is_trusted, trust_expires_at
      FROM trusted_devices
      WHERE user_id = $1 AND device_fingerprint = $2 AND is_active = true
    `;

    const result = await this.pool.query(query, [userId, deviceFingerprint]);

    if (!result.rows[0]) {
      return false;
    }

    const { is_trusted, trust_expires_at } = result.rows[0];

    if (is_trusted && trust_expires_at && new Date(trust_expires_at) > new Date()) {
      return true;
    }

    return false;
  }

  async revokeDeviceTrust(deviceId: string, reason: string): Promise<void> {
    await this.pool.query(
      `UPDATE trusted_devices
       SET is_trusted = false, trust_level = 'revoked', revoked_at = NOW(), revocation_reason = $2
       WHERE id = $1`,
      [deviceId, reason]
    );
  }

  // ========================================
  // 4. SESSION MANAGEMENT
  // ========================================

  async createSession(
    userId: string,
    sessionToken: string,
    refreshToken: string,
    deviceFingerprint: string,
    ipAddress: string,
    mfaVerified: boolean,
    mfaMethod?: string
  ): Promise<void> {
    const query = `
      INSERT INTO active_sessions (
        user_id, session_token, refresh_token, device_fingerprint,
        ip_address, mfa_verified, mfa_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.pool.query(query, [
      userId,
      sessionToken,
      refreshToken,
      deviceFingerprint,
      ipAddress,
      mfaVerified,
      mfaMethod,
    ]);
  }

  async getActiveSessionsCount(userId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM active_sessions WHERE user_id = $1 AND is_active = true';
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  async terminateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    let query = `
      UPDATE active_sessions
      SET is_active = false, logged_out_at = NOW(), force_logout = true
      WHERE user_id = $1 AND is_active = true
    `;

    const params = [userId];

    if (exceptSessionId) {
      query += ' AND id != $2';
      params.push(exceptSessionId);
    }

    await this.pool.query(query, params);
  }

  // ========================================
  // 5. MFA CONFIGURATION
  // ========================================

  async getMFASettings(userId: string): Promise<MFASettings | null> {
    const query = 'SELECT * FROM mfa_settings WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async enableMFA(userId: string, primaryMethod: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO mfa_settings (user_id, mfa_enabled, primary_method)
       VALUES ($1, true, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET mfa_enabled = true, primary_method = $2, updated_at = NOW()`,
      [userId, primaryMethod]
    );
  }

  async disableMFA(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE mfa_settings SET mfa_enabled = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
  }

  // ========================================
  // 6. EXAM SECURITY TRACKING
  // ========================================

  async trackExamSession(
    userId: string,
    assessmentId: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<string> {
    const query = `
      INSERT INTO exam_session_security (
        user_id, assessment_id, ip_address_start, device_fingerprint_start
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const result = await this.pool.query(query, [userId, assessmentId, ipAddress, deviceFingerprint]);
    return result.rows[0].id;
  }

  async checkExamIPChange(
    examSessionId: string,
    newIpAddress: string
  ): Promise<{ violation: boolean }> {
    const query = `
      SELECT ip_address_start, ip_changes_count
      FROM exam_session_security
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [examSessionId]);

    if (!result.rows[0]) {
      throw new Error('Exam session not found');
    }

    const { ip_address_start, ip_changes_count } = result.rows[0];

    if (ip_address_start !== newIpAddress) {
      // Flag IP change
      await this.pool.query(
        `UPDATE exam_session_security
         SET
           ip_changes_count = ip_changes_count + 1,
           ip_violation = true,
           flagged_for_review = true,
           ip_address_changes = ip_address_changes || jsonb_build_object(
             'timestamp', NOW(),
             'old_ip', $2,
             'new_ip', $3
           )
         WHERE id = $1`,
        [examSessionId, ip_address_start, newIpAddress]
      );

      return { violation: true };
    }

    return { violation: false };
  }

  // ========================================
  // 7. HELPER FUNCTIONS
  // ========================================

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async logMFAAttempt(
    userId: string,
    method: string,
    code: string,
    successful: boolean
  ): Promise<void> {
    const hashedCode = this.hashCode(code);

    await this.pool.query(
      `INSERT INTO mfa_verification_attempts (
        user_id, mfa_method, code_entered, is_successful
      ) VALUES ($1, $2, $3, $4)`,
      [userId, method, hashedCode, successful]
    );
  }

  async logSecurityEvent(
    userId: string,
    eventType: string,
    eventCategory: string,
    severity: string,
    wasSuccessful: boolean,
    details: any
  ): Promise<void> {
    await this.pool.query(
      'SELECT log_security_event($1, $2, $3, $4, $5, $6, $7)',
      [userId, eventType, eventCategory, severity, null, wasSuccessful, JSON.stringify(details)]
    );
  }
}
