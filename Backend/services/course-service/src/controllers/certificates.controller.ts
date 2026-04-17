import { Request, Response } from 'express';
import { certificatesService } from '../services/certificates.service';

export class CertificatesController {
  // ========================================
  // CERTIFICATE TEMPLATES
  // ========================================

  async createCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.name || !params.layout) {
        res.status(400).json({ success: false, message: 'Name and layout are required' });
        return;
      }

      const template = await certificatesService.createCertificateTemplate(params);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('[createCertificateTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create certificate template' });
    }
  }

  async getCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const template = await certificatesService.getCertificateTemplate(id);

      if (!template) {
        res.status(404).json({ success: false, message: 'Certificate template not found' });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[getCertificateTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get certificate template' });
    }
  }

  async listCertificateTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, templateType, isActive, limit, offset } = req.query;

      const filters: any = {};
      if (organizationId) filters.organizationId = organizationId as string;
      if (templateType) filters.templateType = templateType as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await certificatesService.listCertificateTemplates(filters);
      res.json({ success: true, data: result.templates, total: result.total });
    } catch (error: any) {
      console.error('[listCertificateTemplates] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list certificate templates' });
    }
  }

  async updateCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const template = await certificatesService.updateCertificateTemplate(id, updates);
      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[updateCertificateTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update certificate template' });
    }
  }

  async deleteCertificateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await certificatesService.deleteCertificateTemplate(id);
      res.json({ success: true, message: 'Certificate template deleted successfully' });
    } catch (error: any) {
      console.error('[deleteCertificateTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete certificate template' });
    }
  }

  // ========================================
  // ISSUE CERTIFICATES
  // ========================================

  async issueCertificate(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body;

      if (!params.templateId || !params.userId || !params.recipientName) {
        res.status(400).json({ success: false, message: 'Template ID, user ID, and recipient name are required' });
        return;
      }

      const certificate = await certificatesService.issueCertificate(params);
      res.status(201).json({ success: true, data: certificate });
    } catch (error: any) {
      console.error('[issueCertificate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to issue certificate' });
    }
  }

  async getCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const certificate = await certificatesService.getCertificate(id);

      if (!certificate) {
        res.status(404).json({ success: false, message: 'Certificate not found' });
        return;
      }

      res.json({ success: true, data: certificate });
    } catch (error: any) {
      console.error('[getCertificate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get certificate' });
    }
  }

  async listUserCertificates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const certificates = await certificatesService.listUserCertificates(userId);
      res.json({ success: true, data: certificates });
    } catch (error: any) {
      console.error('[listUserCertificates] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list user certificates' });
    }
  }

  async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const verification = await certificatesService.verifyCertificate(credentialId);

      // Log verification
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      await certificatesService.logVerification(credentialId, 'url', ipAddress, userAgent);

      res.json({ success: true, data: verification });
    } catch (error: any) {
      console.error('[verifyCertificate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to verify certificate' });
    }
  }

  async revokeCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!reason) {
        res.status(400).json({ success: false, message: 'Revocation reason is required' });
        return;
      }

      await certificatesService.revokeCertificate(id, userId, reason);
      res.json({ success: true, message: 'Certificate revoked successfully' });
    } catch (error: any) {
      console.error('[revokeCertificate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke certificate' });
    }
  }

  async shareCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { platform, shareUrl } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!platform) {
        res.status(400).json({ success: false, message: 'Platform is required' });
        return;
      }

      const share = await certificatesService.shareCertificate(id, userId, platform, shareUrl);
      res.json({ success: true, data: share });
    } catch (error: any) {
      console.error('[shareCertificate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to share certificate' });
    }
  }

  // ========================================
  // DIGITAL BADGES
  // ========================================

  async createBadge(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.name || !params.description || !params.imageUrl || !params.criteriaDescription) {
        res.status(400).json({ success: false, message: 'Name, description, image URL, and criteria description are required' });
        return;
      }

      const badge = await certificatesService.createBadge(params);
      res.status(201).json({ success: true, data: badge });
    } catch (error: any) {
      console.error('[createBadge] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create badge' });
    }
  }

  async getBadge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const badge = await certificatesService.getBadge(id);

      if (!badge) {
        res.status(404).json({ success: false, message: 'Badge not found' });
        return;
      }

      res.json({ success: true, data: badge });
    } catch (error: any) {
      console.error('[getBadge] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get badge' });
    }
  }

  async listBadges(req: Request, res: Response): Promise<void> {
    try {
      const { badgeType, courseId, organizationId, isActive, limit, offset } = req.query;

      const filters: any = {};
      if (badgeType) filters.badgeType = badgeType as string;
      if (courseId) filters.courseId = courseId as string;
      if (organizationId) filters.organizationId = organizationId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const result = await certificatesService.listBadges(filters);
      res.json({ success: true, data: result.badges, total: result.total });
    } catch (error: any) {
      console.error('[listBadges] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list badges' });
    }
  }

  async awardBadge(req: Request, res: Response): Promise<void> {
    try {
      const { badgeId } = req.params;
      const awardedBy = (req as any).user?.userId;
      const { userId, reason, context } = req.body;

      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      const award = await certificatesService.awardBadge(badgeId, userId, awardedBy, reason, context);
      res.status(201).json({ success: true, data: award });
    } catch (error: any) {
      console.error('[awardBadge] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to award badge' });
    }
  }

  async listUserBadges(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const badges = await certificatesService.listUserBadges(userId);
      res.json({ success: true, data: badges });
    } catch (error: any) {
      console.error('[listUserBadges] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list user badges' });
    }
  }

  async revokeBadgeAward(req: Request, res: Response): Promise<void> {
    try {
      const { awardId } = req.params;
      const userId = (req as any).user?.userId;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!reason) {
        res.status(400).json({ success: false, message: 'Revocation reason is required' });
        return;
      }

      await certificatesService.revokeBadgeAward(awardId, userId, reason);
      res.json({ success: true, message: 'Badge award revoked successfully' });
    } catch (error: any) {
      console.error('[revokeBadgeAward] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke badge award' });
    }
  }

  async getBadgeLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const leaderboard = await certificatesService.getBadgeLeaderboard(limit);
      res.json({ success: true, data: leaderboard });
    } catch (error: any) {
      console.error('[getBadgeLeaderboard] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get badge leaderboard' });
    }
  }

  // ========================================
  // CREDENTIAL WALLET
  // ========================================

  async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const wallet = await certificatesService.getOrCreateWallet(userId);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      console.error('[getWallet] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get wallet' });
    }
  }

  async updateWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updates = req.body;
      const wallet = await certificatesService.updateWallet(userId, updates);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      console.error('[updateWallet] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update wallet' });
    }
  }

  async getPublicWallet(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const wallet = await certificatesService.getPublicWallet(slug);

      if (!wallet) {
        res.status(404).json({ success: false, message: 'Wallet not found or not public' });
        return;
      }

      res.json({ success: true, data: wallet });
    } catch (error: any) {
      console.error('[getPublicWallet] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get public wallet' });
    }
  }
}

export const certificatesController = new CertificatesController();
