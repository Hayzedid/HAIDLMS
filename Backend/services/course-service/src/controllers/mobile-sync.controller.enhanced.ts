import { Request, Response } from 'express';
import { MobileSyncServiceEnhanced } from '../services/mobile-sync.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('MobileSyncController');

export class MobileSyncControllerEnhanced {
  private syncService: MobileSyncServiceEnhanced;

  constructor(pool: Pool) {
    this.syncService = new MobileSyncServiceEnhanced(pool);
  }

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);
    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });
    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = await this.syncService.registerDeviceWithValidation(req.body);
      res.status(201).json({ id: deviceId, message: 'Device registered successfully' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Register device');
    }
  };

  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const devices = await this.syncService.getDevicesWithActivity(user_id);
      res.json({ user_id, devices, count: devices.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get devices');
    }
  };

  deactivateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const { user_id } = req.body;
      if (!user_id) {
        res.status(400).json({ error: 'user_id is required' });
        return;
      }
      await this.syncService.deactivateDevice(device_id, user_id);
      res.json({ message: 'Device deactivated successfully', device_id });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Deactivate device');
    }
  };

  enqueueSyncItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const syncId = await this.syncService.enqueueSyncItemWithValidation(req.body);
      res.status(201).json({ id: syncId, message: 'Sync item enqueued' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Enqueue sync item');
    }
  };

  getPendingSyncItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const { limit } = req.query;
      const items = await this.syncService.getPendingSyncItemsWithPriority(
        device_id,
        limit ? parseInt(limit as string) : undefined
      );
      res.json({ device_id, sync_items: items, count: items.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get pending sync items');
    }
  };

  markSyncItemCompleted = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sync_id } = req.params;
      await this.syncService.markSyncItemCompletedWithValidation(sync_id);
      res.json({ message: 'Sync item marked as completed', sync_id });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Mark sync item completed');
    }
  };

  markSyncItemFailed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sync_id } = req.params;
      const { error_message } = req.body;
      if (!error_message) {
        res.status(400).json({ error: 'error_message is required' });
        return;
      }
      await this.syncService.markSyncItemFailed(sync_id, error_message);
      res.json({ message: 'Sync item marked as failed', sync_id });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Mark sync item failed');
    }
  };

  getDeltaChanges = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const { entity_type, since_version } = req.query;
      if (!entity_type || since_version === undefined) {
        res.status(400).json({ error: 'entity_type and since_version are required' });
        return;
      }
      const deltaData = await this.syncService.getDeltaChangesWithMetadata(
        device_id,
        entity_type as string,
        parseInt(since_version as string)
      );
      res.json(deltaData);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get delta changes');
    }
  };

  updateSyncCheckpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const { entity_type, version } = req.body;
      if (!entity_type || version === undefined) {
        res.status(400).json({ error: 'entity_type and version are required' });
        return;
      }
      await this.syncService.updateSyncCheckpointWithValidation(device_id, entity_type, version);
      res.json({ message: 'Sync checkpoint updated', device_id, entity_type, version });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update sync checkpoint');
    }
  };

  createOfflineDownload = async (req: Request, res: Response): Promise<void> => {
    try {
      const downloadId = await this.syncService.createOfflineDownloadWithValidation(req.body);
      res.status(201).json({ id: downloadId, message: 'Offline download created' });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create offline download');
    }
  };

  getOfflineDownloads = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const { status } = req.query;
      const downloads = await this.syncService.getOfflineDownloadsWithStatus(
        device_id,
        status as string
      );
      res.json({ device_id, downloads, count: downloads.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get offline downloads');
    }
  };

  updateDownloadStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { download_id } = req.params;
      const { status, progress } = req.body;
      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }
      await this.syncService.updateDownloadStatus(download_id, status, progress);
      res.json({ message: 'Download status updated', download_id, status });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update download status');
    }
  };

  sendPushNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceCount = await this.syncService.sendPushNotificationWithValidation(req.body);
      res.json({ message: 'Push notification sent', device_count: deviceCount });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Send push notification');
    }
  };

  resolveConflict = async (req: Request, res: Response): Promise<void> => {
    try {
      const { conflict_id } = req.params;
      const { resolution, resolved_data } = req.body;
      if (!resolution) {
        res.status(400).json({ error: 'resolution is required' });
        return;
      }
      await this.syncService.resolveConflictWithValidation(conflict_id, resolution, resolved_data);
      res.json({ message: 'Conflict resolved', conflict_id, resolution });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Resolve conflict');
    }
  };

  getSyncConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { device_id } = req.params;
      const conflicts = await this.syncService.getSyncConflictsWithDetails(device_id);
      res.json({ device_id, conflicts, count: conflicts.length });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get sync conflicts');
    }
  };

  checkFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    try {
      const { feature_key, user_id, platform, app_version } = req.query;
      if (!feature_key || !user_id || !platform) {
        res.status(400).json({ error: 'feature_key, user_id, and platform are required' });
        return;
      }
      const enabled = await this.syncService.checkFeatureFlagWithLogging(
        feature_key as string,
        user_id as string,
        platform as string,
        app_version as string
      );
      res.json({ feature_key, enabled, checked_at: new Date().toISOString() });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Check feature flag');
    }
  };

  mobileSyncHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.syncService.getMobileSyncHealthCheck();
      res.json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Mobile sync health check');
    }
  };
}
