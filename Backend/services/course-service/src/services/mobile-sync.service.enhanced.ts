import { Pool, PoolClient } from 'pg';
import {
  MobileDeviceSchema,
  SyncItemSchema,
  PushNotificationSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('MobileSyncService');

export class MobileSyncServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // MOBILE DEVICES - ENHANCED
  // ========================================

  async registerDeviceWithValidation(data: any): Promise<string> {
    try {
      const validatedData = MobileDeviceSchema.parse(data);
      logger.info('Registering mobile device', {
        user_id: validatedData.user_id,
        device_platform: validatedData.device_platform
      });

      const result = await this.pool.query(
        `INSERT INTO mobile_devices (
          user_id, device_id, device_name, device_platform, push_token
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (device_id) DO UPDATE
        SET last_active_at = NOW(),
            push_token = $5,
            device_name = COALESCE($3, mobile_devices.device_name),
            updated_at = NOW()
        RETURNING id`,
        [
          validatedData.user_id,
          validatedData.device_id,
          validatedData.device_name || null,
          validatedData.device_platform,
          validatedData.push_token || null
        ]
      );

      logger.info('Mobile device registered', { device_record_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to register mobile device', error, { user_id: data.user_id });
      throw error;
    }
  }

  async getDevicesWithActivity(user_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          md.*,
          COUNT(DISTINCT sq.id) as pending_sync_items,
          COUNT(DISTINCT od.id) as offline_downloads
        FROM mobile_devices md
        LEFT JOIN sync_queue sq ON sq.device_id = md.device_id AND sq.status = 'pending'
        LEFT JOIN offline_downloads od ON od.device_id = md.device_id AND od.status IN ('pending', 'downloading')
        WHERE md.user_id = $1
        GROUP BY md.id
        ORDER BY md.last_active_at DESC
      `, [user_id]);

      logger.debug('Devices retrieved', { user_id, count: result.rows.length });
      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch devices', error, { user_id });
      throw error;
    }
  }

  async deactivateDevice(device_id: string, user_id: string): Promise<void> {
    try {
      logger.info('Deactivating device', { device_id, user_id });

      const result = await this.pool.query(
        `UPDATE mobile_devices SET is_active = false, updated_at = NOW()
         WHERE device_id = $1 AND user_id = $2`,
        [device_id, user_id]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Device', device_id);
      }

      logger.info('Device deactivated', { device_id });
    } catch (error: any) {
      logger.error('Failed to deactivate device', error, { device_id });
      throw error;
    }
  }

  // ========================================
  // SYNC QUEUE - ENHANCED
  // ========================================

  async enqueueSyncItemWithValidation(data: any): Promise<string> {
    try {
      const validatedData = SyncItemSchema.parse(data);
      logger.info('Enqueuing sync item', {
        device_id: validatedData.device_id,
        operation: validatedData.operation,
        entity_type: validatedData.entity_type
      });

      const result = await this.pool.query(
        `INSERT INTO sync_queue (
          device_id, user_id, operation, entity_type, entity_id,
          data_payload, client_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          validatedData.device_id,
          validatedData.user_id,
          validatedData.operation,
          validatedData.entity_type,
          validatedData.entity_id,
          JSON.stringify(validatedData.data_payload),
          validatedData.client_version
        ]
      );

      logger.info('Sync item enqueued', { sync_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to enqueue sync item', error, data);
      throw error;
    }
  }

  async getPendingSyncItemsWithPriority(device_id: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT * FROM sync_queue
        WHERE device_id = $1 AND status = 'pending'
        ORDER BY
          priority DESC,
          CASE operation
            WHEN 'delete' THEN 1
            WHEN 'update' THEN 2
            WHEN 'create' THEN 3
            ELSE 4
          END,
          created_at ASC
        LIMIT $2
      `, [device_id, limit]);

      logger.debug('Pending sync items retrieved', {
        device_id,
        count: result.rows.length
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch pending sync items', error, { device_id });
      throw error;
    }
  }

  async markSyncItemCompletedWithValidation(sync_id: string): Promise<void> {
    try {
      logger.debug('Marking sync item as completed', { sync_id });

      const result = await this.pool.query(
        `UPDATE sync_queue
         SET status = 'completed', synced_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [sync_id]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Pending sync item', sync_id);
      }

      logger.info('Sync item marked as completed', { sync_id });
    } catch (error: any) {
      logger.error('Failed to mark sync item as completed', error, { sync_id });
      throw error;
    }
  }

  async markSyncItemFailed(sync_id: string, error_message: string): Promise<void> {
    try {
      logger.warn('Marking sync item as failed', { sync_id, error_message });

      await this.pool.query(
        `UPDATE sync_queue
         SET status = 'failed', error_message = $1, updated_at = NOW()
         WHERE id = $2`,
        [error_message, sync_id]
      );

      logger.info('Sync item marked as failed', { sync_id });
    } catch (error: any) {
      logger.error('Failed to mark sync item as failed', error, { sync_id });
      throw error;
    }
  }

  // ========================================
  // DELTA CHANGES - ENHANCED
  // ========================================

  async getDeltaChangesWithMetadata(
    device_id: string,
    entity_type: string,
    since_version: number
  ): Promise<any> {
    try {
      logger.info('Fetching delta changes', {
        device_id,
        entity_type,
        since_version
      });

      const result = await this.pool.query(
        `SELECT * FROM get_delta_changes($1, $2, $3)`,
        [device_id, entity_type, since_version]
      );

      // Get current version for client
      const versionResult = await this.pool.query(
        `SELECT MAX(client_version) as current_version
         FROM sync_queue
         WHERE entity_type = $1`,
        [entity_type]
      );

      const currentVersion = versionResult.rows[0]?.current_version || since_version;

      logger.info('Delta changes retrieved', {
        device_id,
        entity_type,
        change_count: result.rows.length,
        current_version: currentVersion
      });

      return {
        changes: result.rows,
        since_version: since_version,
        current_version: currentVersion,
        has_more: result.rows.length >= 100
      };
    } catch (error: any) {
      logger.error('Failed to fetch delta changes', error, {
        device_id,
        entity_type,
        since_version
      });
      throw error;
    }
  }

  async updateSyncCheckpointWithValidation(
    device_id: string,
    entity_type: string,
    version: number
  ): Promise<void> {
    try {
      if (version < 0) {
        throw new ValidationError('Version must be non-negative');
      }

      logger.debug('Updating sync checkpoint', { device_id, entity_type, version });

      await this.pool.query(
        `SELECT update_sync_checkpoint($1, $2, $3)`,
        [device_id, entity_type, version]
      );

      logger.info('Sync checkpoint updated', { device_id, entity_type, version });
    } catch (error: any) {
      logger.error('Failed to update sync checkpoint', error, {
        device_id,
        entity_type,
        version
      });
      throw error;
    }
  }

  // ========================================
  // OFFLINE DOWNLOADS - ENHANCED
  // ========================================

  async createOfflineDownloadWithValidation(data: {
    device_id: string;
    user_id: string;
    resource_type: string;
    resource_id: string;
    file_url: string;
  }): Promise<string> {
    try {
      logger.info('Creating offline download request', {
        device_id: data.device_id,
        resource_type: data.resource_type
      });

      // Check for duplicate
      const existing = await this.pool.query(
        `SELECT id FROM offline_downloads
         WHERE device_id = $1 AND resource_id = $2 AND status IN ('pending', 'downloading', 'completed')`,
        [data.device_id, data.resource_id]
      );

      if (existing.rows.length > 0) {
        logger.warn('Offline download already exists', {
          device_id: data.device_id,
          resource_id: data.resource_id
        });
        return existing.rows[0].id;
      }

      const result = await this.pool.query(
        `INSERT INTO offline_downloads (
          device_id, user_id, resource_type, resource_id, file_url
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [data.device_id, data.user_id, data.resource_type, data.resource_id, data.file_url]
      );

      logger.info('Offline download created', { download_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create offline download', error, data);
      throw error;
    }
  }

  async getOfflineDownloadsWithStatus(device_id: string, status?: string): Promise<any[]> {
    try {
      let query = `SELECT * FROM offline_downloads WHERE device_id = $1`;
      const values: any[] = [device_id];

      if (status) {
        query += ` AND status = $2`;
        values.push(status);
      }

      query += ` ORDER BY requested_at DESC`;

      const result = await this.pool.query(query, values);

      logger.debug('Offline downloads retrieved', {
        device_id,
        count: result.rows.length
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch offline downloads', error, { device_id });
      throw error;
    }
  }

  async updateDownloadStatus(download_id: string, status: string, progress?: number): Promise<void> {
    try {
      const validStatuses = ['pending', 'downloading', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updates = [`status = $1`, `updated_at = NOW()`];
      const values: any[] = [status];
      let paramIndex = 2;

      if (progress !== undefined) {
        updates.push(`progress_percent = $${paramIndex++}`);
        values.push(progress);
      }

      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }

      values.push(download_id);

      await this.pool.query(
        `UPDATE offline_downloads SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      logger.debug('Download status updated', { download_id, status });
    } catch (error: any) {
      logger.error('Failed to update download status', error, { download_id, status });
      throw error;
    }
  }

  // ========================================
  // PUSH NOTIFICATIONS - ENHANCED
  // ========================================

  async sendPushNotificationWithValidation(data: any): Promise<number> {
    try {
      const validatedData = PushNotificationSchema.parse(data);
      logger.info('Sending push notification', {
        user_id: validatedData.user_id,
        title: validatedData.title
      });

      const result = await this.pool.query(
        `SELECT send_push_notification($1, $2, $3, $4, '{}') as count`,
        [
          validatedData.user_id,
          validatedData.title,
          validatedData.body,
          validatedData.action_type || null
        ]
      );

      const deviceCount = result.rows[0].count;
      logger.info('Push notification sent', {
        user_id: validatedData.user_id,
        device_count: deviceCount
      });

      return deviceCount;
    } catch (error: any) {
      logger.error('Failed to send push notification', error, data);
      throw error;
    }
  }

  // ========================================
  // CONFLICT RESOLUTION - ENHANCED
  // ========================================

  async resolveConflictWithValidation(
    conflict_id: string,
    resolution: string,
    resolved_data?: any
  ): Promise<void> {
    try {
      const validResolutions = ['accept_server', 'accept_client', 'merge', 'manual'];
      if (!validResolutions.includes(resolution)) {
        throw new ValidationError(`Invalid resolution. Must be one of: ${validResolutions.join(', ')}`);
      }

      logger.info('Resolving sync conflict', { conflict_id, resolution });

      await this.pool.query(
        `SELECT resolve_sync_conflict($1, $2, $3)`,
        [conflict_id, resolution, resolved_data ? JSON.stringify(resolved_data) : null]
      );

      logger.info('Sync conflict resolved', { conflict_id, resolution });
    } catch (error: any) {
      logger.error('Failed to resolve sync conflict', error, { conflict_id, resolution });
      throw error;
    }
  }

  async getSyncConflictsWithDetails(device_id: string): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          sc.*,
          EXTRACT(EPOCH FROM (NOW() - sc.created_at)) / 3600 as hours_unresolved
        FROM sync_conflicts sc
        WHERE sc.device_id = $1 AND sc.is_resolved = false
        ORDER BY sc.created_at ASC
      `, [device_id]);

      logger.debug('Sync conflicts retrieved', {
        device_id,
        count: result.rows.length
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch sync conflicts', error, { device_id });
      throw error;
    }
  }

  // ========================================
  // FEATURE FLAGS - ENHANCED
  // ========================================

  async checkFeatureFlagWithLogging(
    feature_key: string,
    user_id: string,
    platform: string,
    app_version: string = '1.0.0'
  ): Promise<boolean> {
    try {
      logger.debug('Checking feature flag', { feature_key, user_id, platform });

      const result = await this.pool.query(
        `SELECT check_feature_flag($1, $2, $3, $4) as enabled`,
        [feature_key, user_id, platform, app_version]
      );

      const enabled = result.rows[0].enabled;

      logger.debug('Feature flag checked', { feature_key, enabled });
      return enabled;
    } catch (error: any) {
      logger.error('Failed to check feature flag', error, { feature_key, user_id });
      return false; // Fail gracefully
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getMobileSyncHealthCheck(): Promise<any> {
    try {
      const [devices, pendingSync, conflicts] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM mobile_devices WHERE is_active = true`),
        this.pool.query(`SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`),
        this.pool.query(`SELECT COUNT(*) as count FROM sync_conflicts WHERE is_resolved = false`)
      ]);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          active_devices: parseInt(devices.rows[0].count),
          pending_sync_items: parseInt(pendingSync.rows[0].count),
          unresolved_conflicts: parseInt(conflicts.rows[0].count)
        }
      };
    } catch (error: any) {
      logger.error('Failed to get mobile sync health check', error);
      throw error;
    }
  }
}
