import { Request, Response } from 'express';
import { contentVersioningService } from '../services/content-versioning.service';

export class ContentVersioningController {
  async createVersion(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const version = await contentVersioningService.createVersion({
        ...req.body,
        createdBy: userId
      });

      res.status(201).json({ success: true, data: version });
    } catch (error: any) {
      console.error('[createVersion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getVersions(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const { status, limit } = req.query;

      const versions = await contentVersioningService.getVersions(contentType, contentId, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ success: true, data: versions });
    } catch (error: any) {
      console.error('[getVersions] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getVersion(req: Request, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;
      const version = await contentVersioningService.getVersion(versionId);

      if (!version) {
        res.status(404).json({ success: false, message: 'Version not found' });
        return;
      }

      res.json({ success: true, data: version });
    } catch (error: any) {
      console.error('[getVersion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCurrentVersion(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const version = await contentVersioningService.getCurrentVersion(contentType, contentId);

      res.json({ success: true, data: version });
    } catch (error: any) {
      console.error('[getCurrentVersion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async publishVersion(req: Request, res: Response): Promise<void> {
    try {
      const { versionId } = req.params;
      const userId = (req as any).user?.userId;

      const version = await contentVersioningService.publishVersion({
        versionId,
        publishedBy: userId,
        scheduledPublishAt: req.body.scheduledPublishAt
      });

      res.json({ success: true, data: version });
    } catch (error: any) {
      console.error('[publishVersion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async rollbackVersion(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId, versionId } = req.params;
      const userId = (req as any).user?.userId;
      const { reason } = req.body;

      const rollbackId = await contentVersioningService.rollbackVersion(
        contentType,
        contentId,
        versionId,
        reason,
        userId
      );

      res.json({ success: true, data: { rollbackId } });
    } catch (error: any) {
      console.error('[rollbackVersion] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async requestApproval(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const approval = await contentVersioningService.requestApproval({
        ...req.body,
        requestedBy: userId
      });

      res.status(201).json({ success: true, data: approval });
    } catch (error: any) {
      console.error('[requestApproval] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getApprovals(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const approvals = await contentVersioningService.getApprovals({
        requestedFrom: userId,
        status: req.query.status as string
      });

      res.json({ success: true, data: approvals });
    } catch (error: any) {
      console.error('[getApprovals] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async reviewApproval(req: Request, res: Response): Promise<void> {
    try {
      const { approvalId } = req.params;
      const userId = (req as any).user?.userId;

      const approval = await contentVersioningService.reviewApproval({
        approvalId,
        reviewedBy: userId,
        ...req.body
      });

      res.json({ success: true, data: approval });
    } catch (error: any) {
      console.error('[reviewApproval] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async lockContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const userId = (req as any).user?.userId;

      const lockId = await contentVersioningService.lockContent(
        contentType,
        contentId,
        userId,
        req.body.durationMinutes
      );

      res.json({ success: true, data: { lockId } });
    } catch (error: any) {
      console.error('[lockContent] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async unlockContent(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const userId = (req as any).user?.userId;

      const success = await contentVersioningService.unlockContent(contentType, contentId, userId);

      res.json({ success, message: success ? 'Content unlocked' : 'Failed to unlock content' });
    } catch (error: any) {
      console.error('[unlockContent] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async compareVersions(req: Request, res: Response): Promise<void> {
    try {
      const { contentType, contentId } = req.params;
      const { versionAId, versionBId } = req.body;
      const userId = (req as any).user?.userId;

      const comparison = await contentVersioningService.compareVersions(
        contentType,
        contentId,
        versionAId,
        versionBId,
        userId
      );

      res.json({ success: true, data: comparison });
    } catch (error: any) {
      console.error('[compareVersions] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const contentVersioningController = new ContentVersioningController();
