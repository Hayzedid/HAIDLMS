import apiClient from './client';
export const mobileSyncApi = {
    // Health check
    healthCheck: () => apiClient.get('/mobile/health'),
    // Device Management
    registerDevice: (data) => apiClient.post('/mobile/devices', data),
    getDevices: (userId) => apiClient.get(`/mobile/devices/${userId}`),
    deactivateDevice: (deviceId, userId) => apiClient.post(`/mobile/devices/${deviceId}/deactivate`, { user_id: userId }),
    // Sync Queue
    enqueueSyncItem: (data) => apiClient.post('/mobile/sync/enqueue', data),
    getPendingSyncItems: (deviceId, limit) => apiClient.get(`/mobile/sync/pending/${deviceId}`, { params: { limit } }),
    markSyncItemCompleted: (syncId) => apiClient.post(`/mobile/sync/${syncId}/complete`),
    markSyncItemFailed: (syncId, errorMessage) => apiClient.post(`/mobile/sync/${syncId}/fail`, { error_message: errorMessage }),
    // Delta Sync
    getDeltaChanges: (deviceId, entityType, sinceVersion) => apiClient.get(`/mobile/sync/${deviceId}/delta`, {
        params: { entity_type: entityType, since_version: sinceVersion }
    }),
    updateSyncCheckpoint: (deviceId, entityType, version) => apiClient.post(`/mobile/sync/${deviceId}/checkpoint`, { entity_type: entityType, version }),
    // Offline Downloads
    createOfflineDownload: (data) => apiClient.post('/mobile/offline/downloads', data),
    getOfflineDownloads: (deviceId, status) => apiClient.get(`/mobile/offline/downloads/${deviceId}`, { params: { status } }),
    updateDownloadStatus: (downloadId, status, progress) => apiClient.put(`/mobile/offline/downloads/${downloadId}/status`, { status, progress }),
    // Push Notifications
    sendPushNotification: (data) => apiClient.post('/mobile/push', data),
    // Conflict Resolution
    resolveConflict: (conflictId, resolution, resolvedData) => apiClient.post(`/mobile/conflicts/${conflictId}/resolve`, { resolution, resolved_data: resolvedData }),
    getSyncConflicts: (deviceId) => apiClient.get(`/mobile/conflicts/${deviceId}`),
    // Feature Flags
    checkFeatureFlag: (featureKey, userId, platform, appVersion) => apiClient.get('/mobile/features/check', { params: { feature_key: featureKey, user_id: userId, platform, app_version: appVersion } }),
};
