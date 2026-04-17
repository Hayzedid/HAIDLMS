import apiClient from './client';
export const proctoringApi = {
    // Health check
    healthCheck: () => apiClient.get('/proctoring/health'),
    // Sessions
    createSession: (data) => apiClient.post('/proctoring/sessions', data),
    getSessions: (params) => apiClient.get('/proctoring/sessions', { params }),
    getSessionById: (sessionId) => apiClient.get(`/proctoring/sessions/${sessionId}`),
    updateSessionStatus: (sessionId, status) => apiClient.put(`/proctoring/sessions/${sessionId}/status`, { status }),
    // Violations
    recordViolation: (data) => apiClient.post('/proctoring/violations', data),
    getViolations: (sessionId) => apiClient.get(`/proctoring/violations/${sessionId}`),
    // Face Recognition
    recordFaceCapture: (data) => apiClient.post('/proctoring/face/capture', data),
    getFaceCaptures: (sessionId, limit) => apiClient.get(`/proctoring/face/captures/${sessionId}`, { params: { limit } }),
    // Identity Verification
    verifyIdentity: (data) => apiClient.post('/proctoring/identity/verify', data),
    updateVerificationResult: (verificationId, data) => apiClient.put(`/proctoring/identity/${verificationId}/result`, data),
    // Plagiarism
    checkPlagiarism: (data) => apiClient.post('/proctoring/plagiarism/check', data),
    updatePlagiarismResult: (checkId, data) => apiClient.put(`/proctoring/plagiarism/${checkId}/result`, data),
    getPlagiarismChecks: (params) => apiClient.get('/proctoring/plagiarism/checks', { params }),
    // Risk Analysis
    getHighRiskSessions: () => apiClient.get('/proctoring/risk/high-risk-sessions'),
    // Browser Lockdown
    recordBrowserLockdown: (data) => apiClient.post('/proctoring/lockdown', data),
    updateLockdownHeartbeat: (lockdownId) => apiClient.post(`/proctoring/lockdown/${lockdownId}/heartbeat`),
};
