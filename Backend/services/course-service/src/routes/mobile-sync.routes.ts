import { Router } from 'express';
import { MobileSyncController } from '../controllers/mobile-sync.controller';
import { Pool } from 'pg';

export const createMobileSyncRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new MobileSyncController(pool);

  // Device Management
  router.post('/devices/register', controller.registerDevice);
  router.get('/devices/:user_id', controller.getDevices);

  // Sync Queue
  router.post('/sync/enqueue', controller.enqueueSyncItem);
  router.get('/sync/pending/:device_id', controller.getPendingSyncItems);
  router.get('/sync/delta', controller.getDeltaChanges);

  // Offline Downloads
  router.post('/offline/downloads', controller.createOfflineDownload);

  // Push Notifications
  router.post('/push/send', controller.sendPushNotification);

  // Conflict Resolution
  router.get('/conflicts/:device_id', controller.getSyncConflicts);
  router.post('/conflicts/:conflict_id/resolve', controller.resolveConflict);

  // Feature Flags
  router.get('/features/check', controller.checkFeatureFlag);

  return router;
};
