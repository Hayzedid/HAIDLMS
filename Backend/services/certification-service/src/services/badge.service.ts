import { Pool } from 'pg';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as NodeRSA from 'node-rsa';

interface BadgeClass {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  level: string;
  tags: string[];
}

interface BadgeAssertion {
  id: string;
  badgeClassId: string;
  recipientId: string;
  issuedOn: Date;
  signature: string;
  badgeHash: string;
  verificationUrl: string;
  achievementScore?: number;
  achievementPercentile?: number;
  evidenceUrl?: string;
  evidenceNarrative?: string;
}

interface VerificationResult {
  isValid: boolean;
  badge?: any;
  error?: string;
  verifiedAt: Date;
}

export class BadgeService {
  constructor(private pool: Pool) {}

  // ========================================
  // 1. RSA KEY MANAGEMENT
  // ========================================

  async generateRSAKeyPair(keySize: number = 2048): Promise<{
    keyId: string;
    publicKey: string;
    privateKey: string;
  }> {
    // Generate RSA key pair
    const key = new NodeRSA({ b: keySize });
    key.generateKeyPair();

    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');

    // Generate key ID
    const keyId = `techlearn-${new Date().getFullYear()}-${Date.now().toString(36)}`;

    // Encrypt private key for storage
    const { encryptedKey, iv } = this.encryptPrivateKey(privateKey);

    // Store in database
    const query = `
      INSERT INTO badge_key_pairs (
        key_id, public_key, private_key_encrypted, encryption_iv,
        key_size, is_primary, is_active
      )
      VALUES ($1, $2, $3, $4, $5, true, true)
      RETURNING key_id
    `;

    await this.pool.query(query, [keyId, publicKey, encryptedKey, iv, keySize]);

    // Deactivate previous primary keys
    await this.pool.query(
      `UPDATE badge_key_pairs
       SET is_primary = false
       WHERE key_id != $1 AND is_primary = true`,
      [keyId]
    );

    return { keyId, publicKey, privateKey };
  }

  async getPrimaryKeyPair(): Promise<{
    keyId: string;
    publicKey: string;
    privateKey: string;
  } | null> {
    const query = `
      SELECT key_id, public_key, private_key_encrypted, encryption_iv
      FROM badge_key_pairs
      WHERE is_active = true AND is_primary = true
      LIMIT 1
    `;

    const result = await this.pool.query(query);

    if (!result.rows[0]) {
      return null;
    }

    const { key_id, public_key, private_key_encrypted, encryption_iv } = result.rows[0];

    const privateKey = this.decryptPrivateKey(private_key_encrypted, encryption_iv);

    return {
      keyId: key_id,
      publicKey: public_key,
      privateKey,
    };
  }

  async getPublicKey(keyId: string): Promise<string | null> {
    const query = 'SELECT public_key FROM badge_key_pairs WHERE key_id = $1';
    const result = await this.pool.query(query, [keyId]);
    return result.rows[0]?.public_key || null;
  }

  // ========================================
  // 2. BADGE ISSUANCE
  // ========================================

  async issueBadge(data: {
    badgeClassId: string;
    recipientId: string;
    achievementScore?: number;
    achievementPercentile?: number;
    completionTimeHours?: number;
    evidenceUrl?: string;
    evidenceNarrative?: string;
  }): Promise<BadgeAssertion> {
    // Get badge class details
    const badgeClass = await this.getBadgeClass(data.badgeClassId);
    if (!badgeClass) {
      throw new Error('Badge class not found');
    }

    // Get recipient details
    const recipient = await this.getRecipient(data.recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Generate badge content
    const badgeContent = this.generateBadgeContent({
      badgeClass,
      recipient,
      ...data,
    });

    // Sign badge with RSA
    const keyPair = await this.getPrimaryKeyPair();
    if (!keyPair) {
      throw new Error('No active RSA key pair found');
    }

    const signature = this.signBadge(badgeContent, keyPair.privateKey);

    // Generate public key URL
    const publicKeyUrl = `https://techlearn.com/api/badges/keys/${keyPair.keyId}`;

    // Store badge assertion
    const query = `
      INSERT INTO badge_assertions (
        badge_class_id, recipient_id, signature, signature_algorithm,
        public_key_url, achievement_score, achievement_percentile,
        completion_time_hours, evidence_url, evidence_narrative
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.badgeClassId,
      data.recipientId,
      signature,
      'RSA-SHA256',
      publicKeyUrl,
      data.achievementScore,
      data.achievementPercentile,
      data.completionTimeHours,
      data.evidenceUrl,
      data.evidenceNarrative,
    ];

    const result = await this.pool.query(query, values);

    return result.rows[0];
  }

  async batchIssueBadges(
    badgeClassId: string,
    recipientIds: string[],
    options?: {
      achievementScores?: Record<string, number>;
      evidenceUrls?: Record<string, string>;
    }
  ): Promise<BadgeAssertion[]> {
    const badges: BadgeAssertion[] = [];

    for (const recipientId of recipientIds) {
      const badge = await this.issueBadge({
        badgeClassId,
        recipientId,
        achievementScore: options?.achievementScores?.[recipientId],
        evidenceUrl: options?.evidenceUrls?.[recipientId],
      });

      badges.push(badge);
    }

    return badges;
  }

  // ========================================
  // 3. BADGE VERIFICATION
  // ========================================

  async verifyBadge(badgeHash: string, verifierIp?: string): Promise<VerificationResult> {
    const startTime = Date.now();

    try {
      // Get badge assertion
      const query = 'SELECT * FROM badge_assertions WHERE badge_hash = $1';
      const result = await this.pool.query(query, [badgeHash]);

      if (!result.rows[0]) {
        await this.logVerification(badgeHash, false, 'NOT_FOUND', 'Badge not found', verifierIp);
        return {
          isValid: false,
          error: 'Badge not found',
          verifiedAt: new Date(),
        };
      }

      const assertion = result.rows[0];

      // Check if revoked
      if (assertion.is_revoked) {
        await this.logVerification(
          badgeHash,
          false,
          'REVOKED',
          `Badge revoked: ${assertion.revocation_reason}`,
          verifierIp,
          assertion.id
        );
        return {
          isValid: false,
          error: `Badge has been revoked: ${assertion.revocation_reason}`,
          verifiedAt: new Date(),
        };
      }

      // Check if expired
      if (assertion.expires && new Date(assertion.expires) < new Date()) {
        await this.logVerification(
          badgeHash,
          false,
          'EXPIRED',
          'Badge has expired',
          verifierIp,
          assertion.id
        );
        return {
          isValid: false,
          error: 'Badge has expired',
          verifiedAt: new Date(),
        };
      }

      // Verify signature
      const keyId = assertion.public_key_url.split('/').pop();
      const publicKey = await this.getPublicKey(keyId);

      if (!publicKey) {
        await this.logVerification(
          badgeHash,
          false,
          'KEY_NOT_FOUND',
          'Public key not found',
          verifierIp,
          assertion.id
        );
        return {
          isValid: false,
          error: 'Public key not found',
          verifiedAt: new Date(),
        };
      }

      // Regenerate badge content and verify signature
      const badgeClass = await this.getBadgeClass(assertion.badge_class_id);
      const recipient = await this.getRecipient(assertion.recipient_id);

      const badgeContent = this.generateBadgeContent({
        badgeClass,
        recipient,
        badgeClassId: assertion.badge_class_id,
        recipientId: assertion.recipient_id,
        achievementScore: assertion.achievement_score,
        achievementPercentile: assertion.achievement_percentile,
        evidenceUrl: assertion.evidence_url,
        evidenceNarrative: assertion.evidence_narrative,
      });

      const isValidSignature = this.verifySignature(
        badgeContent,
        assertion.signature,
        publicKey
      );

      const verificationTime = Date.now() - startTime;

      if (isValidSignature) {
        await this.logVerification(
          badgeHash,
          true,
          'signature',
          null,
          verifierIp,
          assertion.id,
          verificationTime
        );

        // Generate Open Badges 2.0 JSON
        const openBadgeJson = await this.generateOpenBadgeJson(assertion.id);

        return {
          isValid: true,
          badge: {
            ...assertion,
            badgeClass,
            recipient: {
              name: recipient.full_name,
              email: recipient.email,
            },
            openBadgeJson,
          },
          verifiedAt: new Date(),
        };
      } else {
        await this.logVerification(
          badgeHash,
          false,
          'INVALID_SIGNATURE',
          'Signature verification failed',
          verifierIp,
          assertion.id,
          verificationTime
        );

        return {
          isValid: false,
          error: 'Invalid signature',
          verifiedAt: new Date(),
        };
      }
    } catch (error: any) {
      await this.logVerification(
        badgeHash,
        false,
        'ERROR',
        error.message,
        verifierIp,
        null,
        Date.now() - startTime
      );

      return {
        isValid: false,
        error: error.message,
        verifiedAt: new Date(),
      };
    }
  }

  // ========================================
  // 4. BADGE REVOCATION
  // ========================================

  async revokeBadge(badgeHash: string, reason: string): Promise<void> {
    const query = `
      UPDATE badge_assertions
      SET is_revoked = true, revoked_at = NOW(), revocation_reason = $2
      WHERE badge_hash = $1
    `;

    await this.pool.query(query, [badgeHash, reason]);
  }

  async revokeBadgesByRecipient(recipientId: string, reason: string): Promise<number> {
    const query = `
      UPDATE badge_assertions
      SET is_revoked = true, revoked_at = NOW(), revocation_reason = $2
      WHERE recipient_id = $1 AND is_revoked = false
    `;

    const result = await this.pool.query(query, [recipientId, reason]);
    return result.rowCount || 0;
  }

  // ========================================
  // 5. LINKEDIN INTEGRATION
  // ========================================

  async generateLinkedInShareUrl(badgeHash: string): Promise<string> {
    const badge = await this.getBadgeByHash(badgeHash);
    if (!badge) {
      throw new Error('Badge not found');
    }

    // LinkedIn Share URL format
    const shareUrl = `https://www.linkedin.com/profile/add`;
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: badge.badge_name,
      organizationId: '12345678', // TechLearn LinkedIn Org ID
      issueYear: new Date(badge.issued_on).getFullYear().toString(),
      issueMonth: (new Date(badge.issued_on).getMonth() + 1).toString(),
      certUrl: `https://techlearn.com/badges/verify/${badgeHash}`,
      certId: badgeHash,
    });

    const linkedInUrl = `${shareUrl}?${params.toString()}`;

    // Update badge with LinkedIn URL
    await this.pool.query(
      `UPDATE badge_assertions
       SET linkedin_share_url = $2
       WHERE badge_hash = $1`,
      [badgeHash, linkedInUrl]
    );

    return linkedInUrl;
  }

  async trackLinkedInShare(
    badgeHash: string,
    postId?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE badge_assertions
       SET linkedin_shared_at = NOW(), linkedin_post_id = $2
       WHERE badge_hash = $1`,
      [badgeHash, postId]
    );

    // Log sharing activity
    const badge = await this.getBadgeByHash(badgeHash);
    if (badge) {
      await this.pool.query(
        `INSERT INTO badge_sharing_activity (
          badge_assertion_id, user_id, platform, platform_post_id
        ) VALUES ($1, $2, 'linkedin', $3)`,
        [badge.id, badge.recipient_id, postId]
      );
    }
  }

  // ========================================
  // 6. OPEN BADGES 2.0 JSON
  // ========================================

  async generateOpenBadgeJson(assertionId: string): Promise<any> {
    const query = 'SELECT generate_open_badge_json($1) AS badge_json';
    const result = await this.pool.query(query, [assertionId]);
    return result.rows[0]?.badge_json;
  }

  async getOpenBadgeJsonByHash(badgeHash: string): Promise<any> {
    const badge = await this.getBadgeByHash(badgeHash);
    if (!badge) {
      throw new Error('Badge not found');
    }

    return await this.generateOpenBadgeJson(badge.id);
  }

  // ========================================
  // 7. HELPER FUNCTIONS
  // ========================================

  private generateBadgeContent(data: any): string {
    return JSON.stringify({
      badgeClassId: data.badgeClassId,
      recipientId: data.recipientId,
      recipientEmail: data.recipient.email,
      badgeName: data.badgeClass.name,
      issuedOn: new Date().toISOString(),
      achievementScore: data.achievementScore,
    });
  }

  private signBadge(content: string, privateKey: string): string {
    const key = new NodeRSA(privateKey);
    const signature = key.sign(content, 'base64', 'utf8');
    return signature;
  }

  private verifySignature(
    content: string,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const key = new NodeRSA(publicKey);
      return key.verify(content, signature, 'utf8', 'base64');
    } catch (error) {
      return false;
    }
  }

  private encryptPrivateKey(privateKey: string): {
    encryptedKey: string;
    iv: string;
  } {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.BADGE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
    };
  }

  private decryptPrivateKey(encryptedKey: string, ivHex: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.BADGE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private async getBadgeClass(badgeClassId: string): Promise<any> {
    const query = 'SELECT * FROM badge_classes WHERE id = $1';
    const result = await this.pool.query(query, [badgeClassId]);
    return result.rows[0];
  }

  private async getRecipient(recipientId: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [recipientId]);
    return result.rows[0];
  }

  private async getBadgeByHash(badgeHash: string): Promise<any> {
    const query = `
      SELECT ba.*, bc.name as badge_name
      FROM badge_assertions ba
      JOIN badge_classes bc ON ba.badge_class_id = bc.id
      WHERE ba.badge_hash = $1
    `;
    const result = await this.pool.query(query, [badgeHash]);
    return result.rows[0];
  }

  private async logVerification(
    badgeHash: string,
    isValid: boolean,
    method: string,
    error: string | null,
    verifierIp?: string,
    assertionId?: string,
    verificationTimeMs?: number
  ): Promise<void> {
    const query = `
      INSERT INTO badge_verification_log (
        badge_hash, badge_assertion_id, verifier_ip, is_valid,
        verification_method, error_code, error_message, verification_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.pool.query(query, [
      badgeHash,
      assertionId,
      verifierIp,
      isValid,
      method,
      isValid ? null : method,
      error,
      verificationTimeMs,
    ]);
  }

  // ========================================
  // 8. STATISTICS & REPORTING
  // ========================================

  async getUserBadges(userId: string): Promise<any[]> {
    const query = `
      SELECT * FROM public_badge_portfolio
      WHERE user_id = $1
      ORDER BY issued_on DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getBadgeStatistics(badgeClassId?: string): Promise<any> {
    let query = 'SELECT * FROM badge_statistics';
    const params: any[] = [];

    if (badgeClassId) {
      query += ' WHERE badge_class_id = $1';
      params.push(badgeClassId);
    }

    const result = await this.pool.query(query, params);
    return badgeClassId ? result.rows[0] : result.rows;
  }
}
