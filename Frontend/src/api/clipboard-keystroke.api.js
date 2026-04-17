import apiClient from "./client";
const IDE_SERVICE_URL = import.meta.env.VITE_IDE_SERVICE_URL || "http://localhost:4003";
export const clipboardKeystrokeApi = {
    // Clipboard Tracking
    async logClipboardAttempt(data) {
        const response = await apiClient.post(`${IDE_SERVICE_URL}/api/clipboard/log-attempt`, data);
        return response.data.data;
    },
    async getSessionAttempts(sessionId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/clipboard/session/${sessionId}`);
        return response.data.data;
    },
    async getAssessmentAttempts(assessmentId, userId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/clipboard/assessment/${assessmentId}`, { params: { userId } });
        return response.data.data;
    },
    async getUserClipboardStats(userId, assessmentId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/clipboard/stats/${userId}`, {
            params: { assessmentId },
        });
        return response.data.data;
    },
    // Keystroke Session Management
    async startKeystrokeSession(data) {
        const response = await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/start-session`, data);
        return response.data.data;
    },
    async endKeystrokeSession(sessionId, data) {
        await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/end-session/${sessionId}`, data);
    },
    async logKeystrokeEvents(events) {
        await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/log-events`, {
            events,
        });
    },
    async getKeystrokeSession(sessionId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/session/${sessionId}`);
        return response.data.data;
    },
    async getKeystrokeEvents(sessionId, limit = 10000) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/events/${sessionId}`, {
            params: { limit },
        });
        return response.data.data;
    },
    // Typing Patterns & Analysis
    async getTypingPatterns(userId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/patterns/${userId}`);
        return response.data.data;
    },
    async getTypingBaseline(userId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/baseline/${userId}`);
        return response.data.data;
    },
    async getIntegrityConcerns(userId, assessmentId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/integrity-concerns`, {
            params: { userId, assessmentId },
        });
        return response.data.data;
    },
    async getPatternDeviations(userId) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/pattern-deviations`, {
            params: { userId },
        });
        return response.data.data;
    },
    // Integrity Flags
    async flagSession(data) {
        await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/flag-session`, data);
    },
    async getIntegrityFlags(params) {
        const response = await apiClient.get(`${IDE_SERVICE_URL}/api/keystroke/integrity-flags`, {
            params,
        });
        return response.data.data;
    },
    async reviewIntegrityFlag(flagId, data) {
        await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/review-flag/${flagId}`, data);
    },
};
