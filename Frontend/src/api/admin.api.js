import apiClient from "./client";
export const adminApi = {
    getDashboardStats: () => apiClient.get("/api/admin/stats").then((r) => r.data),
    getUsers: (params) => apiClient.get("/api/admin/users", { params }).then((r) => r.data),
    getUserById: (userId) => apiClient.get(`/api/admin/users/${userId}`).then((r) => r.data),
    updateUser: (userId, data) => apiClient.patch(`/api/admin/users/${userId}`, data).then((r) => r.data),
    deleteUser: (userId) => apiClient.delete(`/api/admin/users/${userId}`).then((r) => r.data),
    getCourseStats: () => apiClient.get("/api/admin/courses/stats").then((r) => r.data),
    getEnrollmentStats: () => apiClient.get("/api/admin/enrollments/stats").then((r) => r.data),
    getFlaggedContent: () => apiClient.get("/api/admin/flagged-content").then((r) => r.data),
    reviewFlaggedItem: (itemId, action, reason) => apiClient
        .post(`/api/admin/flagged-content/${itemId}/review`, { action, reason })
        .then((r) => r.data),
    getSystemLogs: (params) => apiClient.get("/api/admin/logs", { params }).then((r) => r.data),
    getSecurityAlerts: () => apiClient.get("/api/admin/security/alerts").then((r) => r.data),
    getAnalyticsReport: (params) => apiClient
        .get("/api/admin/reports/analytics", { params })
        .then((r) => r.data),
    exportData: (format) => apiClient.get(`/api/admin/export?format=${format}`).then((r) => r.data),
    sendSystemNotification: (data) => apiClient.post("/api/admin/notifications/system", data).then((r) => r.data),
    // Organization Branding
    getOrganizationBranding: () => apiClient.get("/api/admin/branding").then((r) => r.data),
    updateOrganizationBranding: (data) => apiClient.patch("/api/admin/branding", data).then((r) => r.data),
    uploadBrandingLogo: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient
            .post("/api/admin/branding/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
            .then((r) => r.data);
    },
    getBrandingPreview: () => apiClient.get("/api/admin/branding/preview").then((r) => r.data),
};
