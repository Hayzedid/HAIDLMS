import { Router } from 'express';
import { MobileSyncControllerEnhanced } from '../controllers/mobile-sync.controller.enhanced';
import { Pool } from 'pg';

export const createMobileSyncRoutesEnhanced = (pool: Pool): Router => {
  const router = Router();
  const controller = new MobileSyncControllerEnhanced(pool);

  /**
   * @swagger
   * /api/mobile/health:
   *   get:
   *     summary: Mobile sync health check
   *     tags: [Mobile Sync - System]
   *     responses:
   *       200:
   *         description: System healthy with sync metrics
   */
  router.get('/health', controller.mobileSyncHealthCheck);

  /**
   * @swagger
   * /api/mobile/devices:
   *   post:
   *     summary: Register mobile device (Enhanced)
   *     tags: [Mobile Sync - Devices]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id, device_id, device_platform]
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               device_id:
   *                 type: string
   *               device_name:
   *                 type: string
   *               device_platform:
   *                 type: string
   *                 enum: [ios, android, web, desktop]
   *               push_token:
   *                 type: string
   *     responses:
   *       201:
   *         description: Device registered (upsert)
   */
  router.post('/devices', controller.registerDevice);

  /**
   * @swagger
   * /api/mobile/devices/{user_id}:
   *   get:
   *     summary: Get user devices with activity (Enhanced)
   *     tags: [Mobile Sync - Devices]
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of devices with pending sync items and downloads
   */
  router.get('/devices/:user_id', controller.getDevices);

  /**
   * @swagger
   * /api/mobile/devices/{device_id}/deactivate:
   *   post:
   *     summary: Deactivate device (NEW)
   *     tags: [Mobile Sync - Devices]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id]
   *             properties:
   *               user_id:
   *                 type: string
   *     responses:
   *       200:
   *         description: Device deactivated
   */
  router.post('/devices/:device_id/deactivate', controller.deactivateDevice);

  /**
   * @swagger
   * /api/mobile/sync/enqueue:
   *   post:
   *     summary: Enqueue sync item (Enhanced)
   *     tags: [Mobile Sync - Sync Queue]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [device_id, user_id, operation, entity_type, entity_id, data_payload, client_version]
   *             properties:
   *               device_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               operation:
   *                 type: string
   *                 enum: [create, update, delete, bulk]
   *               entity_type:
   *                 type: string
   *               entity_id:
   *                 type: string
   *               data_payload:
   *                 type: object
   *               client_version:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Sync item enqueued
   */
  router.post('/sync/enqueue', controller.enqueueSyncItem);

  /**
   * @swagger
   * /api/mobile/sync/pending/{device_id}:
   *   get:
   *     summary: Get pending sync items with priority (Enhanced)
   *     tags: [Mobile Sync - Sync Queue]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Pending sync items sorted by priority
   */
  router.get('/sync/pending/:device_id', controller.getPendingSyncItems);

  /**
   * @swagger
   * /api/mobile/sync/{sync_id}/complete:
   *   post:
   *     summary: Mark sync item as completed (Enhanced)
   *     tags: [Mobile Sync - Sync Queue]
   *     parameters:
   *       - in: path
   *         name: sync_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Sync item marked as completed
   */
  router.post('/sync/:sync_id/complete', controller.markSyncItemCompleted);

  /**
   * @swagger
   * /api/mobile/sync/{sync_id}/fail:
   *   post:
   *     summary: Mark sync item as failed (NEW)
   *     tags: [Mobile Sync - Sync Queue]
   *     parameters:
   *       - in: path
   *         name: sync_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [error_message]
   *             properties:
   *               error_message:
   *                 type: string
   *     responses:
   *       200:
   *         description: Sync item marked as failed
   */
  router.post('/sync/:sync_id/fail', controller.markSyncItemFailed);

  /**
   * @swagger
   * /api/mobile/sync/{device_id}/delta:
   *   get:
   *     summary: Get delta changes with metadata (Enhanced)
   *     tags: [Mobile Sync - Delta Sync]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: entity_type
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: since_version
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Delta changes with current version and pagination info
   */
  router.get('/sync/:device_id/delta', controller.getDeltaChanges);

  /**
   * @swagger
   * /api/mobile/sync/{device_id}/checkpoint:
   *   post:
   *     summary: Update sync checkpoint (Enhanced)
   *     tags: [Mobile Sync - Delta Sync]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [entity_type, version]
   *             properties:
   *               entity_type:
   *                 type: string
   *               version:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Sync checkpoint updated
   */
  router.post('/sync/:device_id/checkpoint', controller.updateSyncCheckpoint);

  /**
   * @swagger
   * /api/mobile/offline/downloads:
   *   post:
   *     summary: Create offline download (Enhanced)
   *     tags: [Mobile Sync - Offline]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [device_id, user_id, resource_type, resource_id, file_url]
   *             properties:
   *               device_id:
   *                 type: string
   *               user_id:
   *                 type: string
   *               resource_type:
   *                 type: string
   *               resource_id:
   *                 type: string
   *               file_url:
   *                 type: string
   *     responses:
   *       201:
   *         description: Offline download created (or existing returned)
   */
  router.post('/offline/downloads', controller.createOfflineDownload);

  /**
   * @swagger
   * /api/mobile/offline/downloads/{device_id}:
   *   get:
   *     summary: Get offline downloads with status (Enhanced)
   *     tags: [Mobile Sync - Offline]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, downloading, completed, failed]
   *     responses:
   *       200:
   *         description: List of offline downloads
   */
  router.get('/offline/downloads/:device_id', controller.getOfflineDownloads);

  /**
   * @swagger
   * /api/mobile/offline/downloads/{download_id}/status:
   *   put:
   *     summary: Update download status (NEW)
   *     tags: [Mobile Sync - Offline]
   *     parameters:
   *       - in: path
   *         name: download_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [status]
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, downloading, completed, failed]
   *               progress:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Download status updated
   */
  router.put('/offline/downloads/:download_id/status', controller.updateDownloadStatus);

  /**
   * @swagger
   * /api/mobile/push:
   *   post:
   *     summary: Send push notification (Enhanced)
   *     tags: [Mobile Sync - Push]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [user_id, title, body]
   *             properties:
   *               user_id:
   *                 type: string
   *               title:
   *                 type: string
   *               body:
   *                 type: string
   *               action_type:
   *                 type: string
   *     responses:
   *       200:
   *         description: Push notification sent to active devices
   */
  router.post('/push', controller.sendPushNotification);

  /**
   * @swagger
   * /api/mobile/conflicts/{conflict_id}/resolve:
   *   post:
   *     summary: Resolve sync conflict (Enhanced)
   *     tags: [Mobile Sync - Conflicts]
   *     parameters:
   *       - in: path
   *         name: conflict_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [resolution]
   *             properties:
   *               resolution:
   *                 type: string
   *                 enum: [accept_server, accept_client, merge, manual]
   *               resolved_data:
   *                 type: object
   *     responses:
   *       200:
   *         description: Conflict resolved
   */
  router.post('/conflicts/:conflict_id/resolve', controller.resolveConflict);

  /**
   * @swagger
   * /api/mobile/conflicts/{device_id}:
   *   get:
   *     summary: Get sync conflicts with details (Enhanced)
   *     tags: [Mobile Sync - Conflicts]
   *     parameters:
   *       - in: path
   *         name: device_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Unresolved conflicts with time information
   */
  router.get('/conflicts/:device_id', controller.getSyncConflicts);

  /**
   * @swagger
   * /api/mobile/features/check:
   *   get:
   *     summary: Check feature flag with logging (Enhanced)
   *     tags: [Mobile Sync - Features]
   *     parameters:
   *       - in: query
   *         name: feature_key
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: platform
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: app_version
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Feature flag status
   */
  router.get('/features/check', controller.checkFeatureFlag);

  return router;
};
