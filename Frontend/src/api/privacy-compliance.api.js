import apiClient from "./client";
export const privacyComplianceApi = {
    // Health check
    healthCheck: () => apiClient.get("/privacy/health"),
    // Consent Management
    grantConsent: (data) => apiClient.post("/privacy/consent/grant", data),
    withdrawConsent: (userId, consentType) => apiClient.post("/privacy/consent/withdraw", {
        user_id: userId,
        consent_type: consentType,
    }),
    getUserConsents: (userId, status) => apiClient.get(`/privacy/consent/user/${userId}`, { params: { status } }),
    checkConsent: (userId, purpose) => apiClient.get("/privacy/consent/check", {
        params: { user_id: userId, purpose },
    }),
    // Privacy Requests (GDPR/CCPA)
    createPrivacyRequest: (data) => apiClient.post("/privacy/requests", data),
    getPrivacyRequestById: (requestId) => apiClient.get(`/privacy/requests/${requestId}`),
    updatePrivacyRequestStatus: (requestId, data) => apiClient.put(`/privacy/requests/${requestId}/status`, data),
    getOverdueRequests: () => apiClient.get("/privacy/requests/overdue"),
    // Data Retention
    createRetentionPolicy: (data) => apiClient.post("/privacy/retention/policies", data),
    executeRetentionPolicy: (policyId, executedBy) => apiClient.post(`/privacy/retention/policies/${policyId}/execute`, {
        executed_by: executedBy,
    }),
    getRetentionSummary: () => apiClient.get("/privacy/retention/summary"),
    // Data Deletion
    logDataDeletion: (data) => apiClient.post("/privacy/deletion/log", data),
    // Data Anonymization
    anonymizeUserData: (userId, initiatedBy) => apiClient.post(`/privacy/anonymize/${userId}`, {
        initiated_by: initiatedBy,
    }),
    // Convenience methods for GDPR flows
    exportPersonalData: () => apiClient.get("/privacy/user/export-data").then((r) => r.data),
    deleteAccount: (password) => apiClient
        .post("/privacy/user/delete-account", { password })
        .then((r) => r.data),
};
