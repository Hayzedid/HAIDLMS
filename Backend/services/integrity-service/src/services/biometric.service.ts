import { pool } from '../db/pool';
import { BiometricProfile, VerifyFaceRequest, VerificationStatus } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Biometric Verification Service
 * Face recognition and identity verification
 */
class BiometricService {
  private readonly FACE_MATCH_THRESHOLD = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.6');
  private readonly STORAGE_PATH = process.env.STORAGE_PATH || './storage';

  constructor() {
    // Ensure storage directory exists
    if (!fs.existsSync(this.STORAGE_PATH)) {
      fs.mkdirSync(this.STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Create or update biometric profile
   */
  async createProfile(params: {
    userId: string;
    photoIdUrl?: string;
    profilePhotoUrl?: string;
    faceEncodings?: Buffer;
  }): Promise<BiometricProfile> {
    const result = await pool.query(
      `INSERT INTO biometric_profiles (
        user_id, photo_id_url, profile_photo_url, face_encodings, verification_status
      )
      VALUES ($1, $2, $3, $4, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET
        photo_id_url = COALESCE(EXCLUDED.photo_id_url, biometric_profiles.photo_id_url),
        profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, biometric_profiles.profile_photo_url),
        face_encodings = COALESCE(EXCLUDED.face_encodings, biometric_profiles.face_encodings),
        updated_at = NOW()
      RETURNING *`,
      [params.userId, params.photoIdUrl, params.profilePhotoUrl, params.faceEncodings]
    );

    return this.mapProfile(result.rows[0]);
  }

  /**
   * Verify face against profile
   */
  async verifyFace(params: VerifyFaceRequest): Promise<{
    verified: boolean;
    matchScore: number;
    verificationStatus: VerificationStatus;
    failureReason?: string;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user's biometric profile
      const profileResult = await client.query(
        'SELECT * FROM biometric_profiles WHERE user_id = $1',
        [params.userId]
      );

      if (profileResult.rows.length === 0) {
        throw new Error('Biometric profile not found. Please set up your profile first.');
      }

      const profile = profileResult.rows[0];

      // Save verification image
      const imageUrl = await this.saveImage(params.imageData, `verification_${params.userId}_${Date.now()}.jpg`);

      // Extract face from image
      const faceData = await this.extractFace(imageUrl);

      if (!faceData.detected) {
        // Log failed attempt
        await client.query(
          `INSERT INTO verification_attempts (
            user_id, session_id, attempt_type, image_url, face_detected, verification_result, failure_reason
          )
          VALUES ($1, $2, $3, $4, false, 'failed', 'No face detected')`,
          [params.userId, params.sessionId, params.attemptType, imageUrl]
        );

        await client.query('COMMIT');

        return {
          verified: false,
          matchScore: 0,
          verificationStatus: 'failed',
          failureReason: 'No face detected in image',
        };
      }

      // Calculate match score (placeholder - would use actual face recognition)
      const matchScore = await this.calculateFaceMatch(profile.face_encodings, faceData.encodings);

      const verified = matchScore >= this.FACE_MATCH_THRESHOLD;
      const verificationStatus: VerificationStatus = verified ? 'verified' : 'failed';

      // Log verification attempt
      await client.query(
        `INSERT INTO verification_attempts (
          user_id, session_id, attempt_type, image_url, face_detected,
          match_score, verification_result, failure_reason
        )
        VALUES ($1, $2, $3, $4, true, $5, $6, $7)`,
        [
          params.userId,
          params.sessionId,
          params.attemptType,
          imageUrl,
          matchScore,
          verificationStatus,
          verified ? null : 'Face did not match profile',
        ]
      );

      // Update profile last verified if successful
      if (verified) {
        await client.query(
          'UPDATE biometric_profiles SET last_verified = NOW() WHERE user_id = $1',
          [params.userId]
        );

        // Update proctoring session if applicable
        if (params.sessionId) {
          await client.query(
            `UPDATE proctoring_sessions
             SET initial_verification_status = 'verified'
             WHERE id = $1 AND initial_verification_status = 'pending'`,
            [params.sessionId]
          );
        }
      } else {
        // Log violation
        await client.query(
          `INSERT INTO violation_logs (
            user_id, violation_type, severity, description, related_session_id, score_penalty
          )
          VALUES ($1, 'biometric_verification_failed', 'major',
                 'Face verification failed during authentication', $2, 5.0)`,
          [params.userId, params.sessionId]
        );
      }

      await client.query('COMMIT');

      return {
        verified,
        matchScore,
        verificationStatus,
        failureReason: verified ? undefined : 'Face did not match profile',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save base64 image to disk
   */
  private async saveImage(base64Data: string, fileName: string): Promise<string> {
    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Process and save image
    const filePath = path.join(this.STORAGE_PATH, fileName);

    await sharp(imageBuffer)
      .resize(640, 480, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    return `/storage/${fileName}`;
  }

  /**
   * Extract face from image
   */
  private async extractFace(imageUrl: string): Promise<{
    detected: boolean;
    faceCount: number;
    encodings?: Buffer;
    confidence?: number;
  }> {
    // This is a placeholder implementation
    // In production, use face-api.js or similar library

    try {
      // Simulate face detection
      // In real implementation, use face-api.js:
      // const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();

      const detected = true; // Placeholder
      const faceCount = 1; // Placeholder
      const confidence = 0.95; // Placeholder

      // Generate placeholder encodings
      const encodings = Buffer.from(JSON.stringify({ placeholder: 'face_encoding_data' }));

      return {
        detected,
        faceCount,
        encodings,
        confidence,
      };
    } catch (error) {
      console.error('Face extraction failed:', error);
      return {
        detected: false,
        faceCount: 0,
      };
    }
  }

  /**
   * Calculate face match score
   */
  private async calculateFaceMatch(profileEncodings: Buffer | null, currentEncodings: Buffer | undefined): Promise<number> {
    if (!profileEncodings || !currentEncodings) {
      return 0;
    }

    // This is a placeholder implementation
    // In production, calculate Euclidean distance between face encodings
    // Lower distance = higher similarity

    // Simulate match calculation
    const randomScore = 0.7 + Math.random() * 0.3; // 0.7-1.0 for demo

    return randomScore;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<BiometricProfile | null> {
    const result = await pool.query(
      'SELECT * FROM biometric_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapProfile(result.rows[0]);
  }

  /**
   * Get verification attempts
   */
  async getVerificationAttempts(userId: string, limit = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM verification_attempts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Verify profile (admin action)
   */
  async verifyProfile(userId: string, verifiedBy: string, status: VerificationStatus): Promise<void> {
    await pool.query(
      `UPDATE biometric_profiles
       SET verification_status = $1,
           verified_at = NOW(),
           verified_by = $2,
           updated_at = NOW()
       WHERE user_id = $3`,
      [status, verifiedBy, userId]
    );
  }

  /**
   * Get unverified profiles
   */
  async getUnverifiedProfiles(limit = 100): Promise<BiometricProfile[]> {
    const result = await pool.query(
      `SELECT * FROM biometric_profiles
       WHERE verification_status IN ('pending', 'requires_review')
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapProfile);
  }

  /**
   * Map database row to BiometricProfile
   */
  private mapProfile(row: any): BiometricProfile {
    return {
      id: row.id,
      userId: row.user_id,
      photoIdUrl: row.photo_id_url,
      profilePhotoUrl: row.profile_photo_url,
      faceEncodings: row.face_encodings,
      alternateEncodings: row.alternate_encodings,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at,
      verifiedBy: row.verified_by,
      lastVerified: row.last_verified,
    };
  }
}

export const biometricService = new BiometricService();
