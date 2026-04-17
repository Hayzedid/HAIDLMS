import apiClient from './client';

export interface MobileDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  device_platform: 'ios' | 'android' | 'web' | 'desktop';
  push_token?: string;
  is_active: boolean;
  last_sync_at?: string;
  registered_at: string;
  pending_sync_count?: number;
  pending_downloads_count?: number;
}

export interface SyncItem {
  id: string;
  device_id: string;
  user_id: string;
  operation: 'create' | 'update' | 'delete' | 'bulk';
  entity_type: string;
  entity_id: string;
  data_payload: any;
  client_version: number;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  synced_at?: string;
}

export interface OfflineDownload {
  id: string;
  device_id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  file_url: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  file_size_mb?: number;
  downloaded_at?: string;
  created_at: string;
}

export interface SyncConflict {
  id: string;
  device_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  client_data: any;
  server_data: any;
  client_version: number;
  server_version: number;
  resolution?: 'accept_server' | 'accept_client' | 'merge' | 'manual';
  resolved_data?: any;
  detected_at: string;
  resolved_at?: string;
}

export interface DeltaChange {
  operation: 'create' | 'update' | 'delete';
  entity_id: string;
  entity_data?: any;
  version: number;
  changed_at: string;
}

export const mobileSyncApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{ healthy: boolean; metrics: any }>('/mobile/health'),

  // Device Management
  registerDevice: (data: {
    user_id: string;
    device_id: string;
    device_name?: string;
    device_platform: string;
    push_token?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/mobile/devices', data),

  getDevices: (userId: string) =>
    apiClient.get<{ user_id: string; devices: MobileDevice[]; count: number }>(
      `/mobile/devices/${userId}`
    ),

  deactivateDevice: (deviceId: string, userId: string) =>
    apiClient.post<{ message: string; device_id: string }>(
      `/mobile/devices/${deviceId}/deactivate`,
      { user_id: userId }
    ),

  // Sync Queue
  enqueueSyncItem: (data: {
    device_id: string;
    user_id: string;
    operation: string;
    entity_type: string;
    entity_id: string;
    data_payload: any;
    client_version: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/mobile/sync/enqueue', data),

  getPendingSyncItems: (deviceId: string, limit?: number) =>
    apiClient.get<{ device_id: string; sync_items: SyncItem[]; count: number }>(
      `/mobile/sync/pending/${deviceId}`,
      { params: { limit } }
    ),

  markSyncItemCompleted: (syncId: string) =>
    apiClient.post<{ message: string; sync_id: string }>(
      `/mobile/sync/${syncId}/complete`
    ),

  markSyncItemFailed: (syncId: string, errorMessage: string) =>
    apiClient.post<{ message: string; sync_id: string }>(
      `/mobile/sync/${syncId}/fail`,
      { error_message: errorMessage }
    ),

  // Delta Sync
  getDeltaChanges: (deviceId: string, entityType: string, sinceVersion: number) =>
    apiClient.get<{
      device_id: string;
      entity_type: string;
      changes: DeltaChange[];
      current_version: number;
      has_more: boolean;
    }>(`/mobile/sync/${deviceId}/delta`, {
      params: { entity_type: entityType, since_version: sinceVersion }
    }),

  updateSyncCheckpoint: (deviceId: string, entityType: string, version: number) =>
    apiClient.post<{ message: string; device_id: string; entity_type: string; version: number }>(
      `/mobile/sync/${deviceId}/checkpoint`,
      { entity_type: entityType, version }
    ),

  // Offline Downloads
  createOfflineDownload: (data: {
    device_id: string;
    user_id: string;
    resource_type: string;
    resource_id: string;
    file_url: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/mobile/offline/downloads', data),

  getOfflineDownloads: (deviceId: string, status?: string) =>
    apiClient.get<{ device_id: string; downloads: OfflineDownload[]; count: number }>(
      `/mobile/offline/downloads/${deviceId}`,
      { params: { status } }
    ),

  updateDownloadStatus: (downloadId: string, status: string, progress?: number) =>
    apiClient.put<{ message: string; download_id: string; status: string }>(
      `/mobile/offline/downloads/${downloadId}/status`,
      { status, progress }
    ),

  // Push Notifications
  sendPushNotification: (data: {
    user_id: string;
    title: string;
    body: string;
    action_type?: string;
  }) =>
    apiClient.post<{ message: string; device_count: number }>('/mobile/push', data),

  // Conflict Resolution
  resolveConflict: (conflictId: string, resolution: string, resolvedData?: any) =>
    apiClient.post<{ message: string; conflict_id: string; resolution: string }>(
      `/mobile/conflicts/${conflictId}/resolve`,
      { resolution, resolved_data: resolvedData }
    ),

  getSyncConflicts: (deviceId: string) =>
    apiClient.get<{ device_id: string; conflicts: SyncConflict[]; count: number }>(
      `/mobile/conflicts/${deviceId}`
    ),

  // Feature Flags
  checkFeatureFlag: (featureKey: string, userId: string, platform: string, appVersion?: string) =>
    apiClient.get<{ feature_key: string; enabled: boolean; checked_at: string }>(
      '/mobile/features/check',
      { params: { feature_key: featureKey, user_id: userId, platform, app_version: appVersion } }
    ),
};
