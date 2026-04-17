import { Request, Response } from 'express';
import { MobileSyncService } from '../services/mobile-sync.service';
import { Pool } from 'pg';

export class MobileSyncController {
  private syncService: MobileSyncService;

  constructor(pool: Pool) {
    this.syncService = new MobileSyncService(pool);
  }

  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.syncService.registerDevice(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register device' });
    }
  };

  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const devices = await this.syncService.getDevices(user_id);
      res.json({ devices });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  };

  enqueueSyncItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.syncService.enqueueSyncItem(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to enqueue sync item' });
    }
  };

  getPendingSyncItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const items = await this.syncService.getPendingSyncItems(device_id);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sync items' });
    }
  };

  getDeltaChanges = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id, entity_type, since_version } = req.query;
      const changes = await this.syncService.getDeltaChanges(
        device_id as string,
        entity_type as string,
        parseInt(since_version as string)
      );
      res.json({ changes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch delta changes' });
    }
  };

  createOfflineDownload = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = await this.syncService.createOfflineDownload(req.body);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create download' });
    }
  };

  sendPushNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await this.syncService.sendPushNotification(req.body);
      res.json({ devices_notified: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  };

  getSyncConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const conflicts = await this.syncService.getSyncConflicts(device_id);
      res.json({ conflicts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conflicts' });
    }
  };

  resolveConflict = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conflict_id } = req.params;
      const { resolution } = req.body;
      await this.syncService.resolveConflict(conflict_id, resolution);
      res.json({ message: 'Conflict resolved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resolve conflict' });
    }
  };

  checkFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    try {
      const { feature_key, user_id, platform } = req.query;
      const enabled = await this.syncService.checkFeatureFlag(
        feature_key as string,
        user_id as string,
        platform as string
      );
      res.json({ enabled });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check feature flag' });
    }
  };
}
