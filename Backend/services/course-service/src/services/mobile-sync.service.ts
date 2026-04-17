import { Pool } from 'pg';

export class MobileSyncService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Mobile Devices
  async registerDevice(data: {
    user_id: string;
    device_id: string;
    device_name?: string;
    device_platform: string;
    push_token?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO mobile_devices (user_id, device_id, device_name, device_platform, push_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (device_id) DO UPDATE
       SET last_active_at = NOW(), push_token = $5
       RETURNING id`,
      [data.user_id, data.device_id, data.device_name || null, data.device_platform, data.push_token || null]
    );
    return result.rows[0].id;
  }

  async getDevices(user_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM mobile_devices WHERE user_id = $1 ORDER BY last_active_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Sync Queue
  async enqueueSyncItem(data: {
    device_id: string;
    user_id: string;
    operation: string;
    entity_type: string;
    entity_id: string;
    data_payload: any;
    client_version: number;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO sync_queue (device_id, user_id, operation, entity_type, entity_id, data_payload, client_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.device_id, data.user_id, data.operation, data.entity_type, data.entity_id, JSON.stringify(data.data_payload), data.client_version]
    );
    return result.rows[0].id;
  }

  async getPendingSyncItems(device_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM sync_queue WHERE device_id = $1 AND status = 'pending' ORDER BY priority DESC, created_at ASC`,
      [device_id]
    );
    return result.rows;
  }

  async markSyncItemCompleted(sync_id: string): Promise<void> {
    await this.pool.query(
      `UPDATE sync_queue SET status = 'completed', synced_at = NOW() WHERE id = $1`,
      [sync_id]
    );
  }

  // Delta Changes
  async getDeltaChanges(device_id: string, entity_type: string, since_version: number): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM get_delta_changes($1, $2, $3)`,
      [device_id, entity_type, since_version]
    );
    return result.rows;
  }

  async updateSyncCheckpoint(device_id: string, entity_type: string, version: number): Promise<void> {
    await this.pool.query(
      `SELECT update_sync_checkpoint($1, $2, $3)`,
      [device_id, entity_type, version]
    );
  }

  // Offline Downloads
  async createOfflineDownload(data: {
    device_id: string;
    user_id: string;
    resource_type: string;
    resource_id: string;
    file_url: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO offline_downloads (device_id, user_id, resource_type, resource_id, file_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.device_id, data.user_id, data.resource_type, data.resource_id, data.file_url]
    );
    return result.rows[0].id;
  }

  async getOfflineDownloads(device_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM offline_downloads WHERE device_id = $1 ORDER BY requested_at DESC`,
      [device_id]
    );
    return result.rows;
  }

  // Push Notifications
  async sendPushNotification(data: {
    user_id: string;
    title: string;
    body: string;
    action_type?: string;
  }): Promise<number> {
    const result = await this.pool.query(
      `SELECT send_push_notification($1, $2, $3, $4, '{}') as count`,
      [data.user_id, data.title, data.body, data.action_type || null]
    );
    return result.rows[0].count;
  }

  // Conflict Resolution
  async resolveConflict(conflict_id: string, resolution: string): Promise<void> {
    await this.pool.query(
      `SELECT resolve_sync_conflict($1, $2, NULL)`,
      [conflict_id, resolution]
    );
  }

  async getSyncConflicts(device_id: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM sync_conflicts WHERE device_id = $1 AND is_resolved = false`,
      [device_id]
    );
    return result.rows;
  }

  // Feature Flags
  async checkFeatureFlag(feature_key: string, user_id: string, platform: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT check_feature_flag($1, $2, $3, '1.0.0') as enabled`,
      [feature_key, user_id, platform]
    );
    return result.rows[0].enabled;
  }
}
