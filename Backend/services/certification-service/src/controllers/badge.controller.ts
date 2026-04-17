import { Request, Response } from 'express';
import { BadgeService } from '../services/badge.service';
import { pool } from '../config/db';

const badgeService = new BadgeService(pool);

export class BadgeController {
  // Issue a badge to a user
  async issueBadge(req: Request, res: Response): Promise<void> {
    try {
      const badge = await badgeService.issueBadge(req.body);

      res.status(201).json({
        success: true,
        message: 'Badge issued successfully',
        data: badge,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to issue badge',
      });
    }
  }

  // Batch issue badges
  async batchIssueBadges(req: Request, res: Response): Promise<void> {
    try {
      const { badgeClassId, recipientIds, options } = req.body;
      const badges = await badgeService.batchIssueBadges(badgeClassId, recipientIds, options);

      res.status(201).json({
        success: true,
        message: `${badges.length} badges issued successfully`,
        data: badges,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to issue badges',
      });
    }
  }

  // Verify a badge by hash
  async verifyBadge(req: Request, res: Response): Promise<void> {
    try {
      const { badgeHash } = req.params;
      const verifierIp = req.ip;

      const result = await badgeService.verifyBadge(badgeHash, verifierIp);

      if (result.isValid) {
        res.status(200).json({
          success: true,
          message: 'Badge is valid',
          data: result,
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.error || 'Badge is invalid',
          data: result,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Verification failed',
      });
    }
  }

  // Get Open Badges 2.0 JSON
  async getOpenBadgeJson(req: Request, res: Response): Promise<void> {
    try {
      const { badgeHash } = req.params;
      const badgeJson = await badgeService.getOpenBadgeJsonByHash(badgeHash);

      res.status(200).json(badgeJson);
    } catch (error: any) {
      res.status(404).json({
        error: 'Badge not found',
        message: error.message,
      });
    }
  }

  // Get public key for verification
  async getPublicKey(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const publicKey = await badgeService.getPublicKey(keyId);

      if (!publicKey) {
        res.status(404).json({
          success: false,
          message: 'Public key not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          keyId,
          publicKey,
          algorithm: 'RSA-SHA256',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get public key',
      });
    }
  }

  // Get user's badges
  async getUserBadges(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const badges = await badgeService.getUserBadges(userId);

      res.status(200).json({
        success: true,
        data: badges,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user badges',
      });
    }
  }

  // Generate LinkedIn share URL
  async generateLinkedInShareUrl(req: Request, res: Response): Promise<void> {
    try {
      const { badgeHash } = req.params;
      const linkedInUrl = await badgeService.generateLinkedInShareUrl(badgeHash);

      res.status(200).json({
        success: true,
        data: {
          linkedInUrl,
          badgeHash,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate LinkedIn share URL',
      });
    }
  }

  // Track LinkedIn share
  async trackLinkedInShare(req: Request, res: Response): Promise<void> {
    try {
      const { badgeHash } = req.params;
      const { postId } = req.body;

      await badgeService.trackLinkedInShare(badgeHash, postId);

      res.status(200).json({
        success: true,
        message: 'LinkedIn share tracked successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to track LinkedIn share',
      });
    }
  }

  // Revoke a badge
  async revokeBadge(req: Request, res: Response): Promise<void> {
    try {
      const { badgeHash } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Revocation reason is required',
        });
        return;
      }

      await badgeService.revokeBadge(badgeHash, reason);

      res.status(200).json({
        success: true,
        message: 'Badge revoked successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to revoke badge',
      });
    }
  }

  // Get badge statistics
  async getBadgeStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { badgeClassId } = req.params;
      const stats = await badgeService.getBadgeStatistics(badgeClassId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get badge statistics',
      });
    }
  }

  // Generate RSA key pair (Admin only)
  async generateKeyPair(req: Request, res: Response): Promise<void> {
    try {
      const { keySize } = req.body;
      const keyPair = await badgeService.generateRSAKeyPair(keySize || 2048);

      res.status(201).json({
        success: true,
        message: 'RSA key pair generated successfully',
        data: {
          keyId: keyPair.keyId,
          publicKey: keyPair.publicKey,
          // Never expose private key in response
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate key pair',
      });
    }
  }
}
