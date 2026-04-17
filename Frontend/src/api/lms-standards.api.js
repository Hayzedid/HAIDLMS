import apiClient from './client';
export const lmsStandardsApi = {
    // Health check
    healthCheck: () => apiClient.get('/lms-standards/health'),
    // SCORM Packages
    createSCORMPackage: (data) => apiClient.post('/lms-standards/scorm/packages', data),
    getSCORMPackageById: (packageId) => apiClient.get(`/lms-standards/scorm/packages/${packageId}`),
    validateSCORMPackage: (packageId) => apiClient.post(`/lms-standards/scorm/packages/${packageId}/validate`),
    // SCORM Attempts
    createSCORMAttempt: (data) => apiClient.post('/lms-standards/scorm/attempts', data),
    updateSCORMAttempt: (attemptId, data) => apiClient.put(`/lms-standards/scorm/attempts/${attemptId}`, data),
    getSCORMAttemptProgress: (userId, packageId) => apiClient.get('/lms-standards/scorm/attempts/progress', {
        params: { user_id: userId, package_id: packageId }
    }),
    // LTI Consumers
    createLTIConsumer: (data) => apiClient.post('/lms-standards/lti/consumers', data),
    validateLTIRequest: (data) => apiClient.post('/lms-standards/lti/validate', data),
    // LTI Grades
    recordLTIGrade: (data) => apiClient.post('/lms-standards/lti/grades', data),
    // xAPI Statements
    recordXAPIStatement: (data) => apiClient.post('/lms-standards/xapi/statements', data),
    getXAPILearnerProfile: (actorId) => apiClient.get(`/lms-standards/xapi/learner-profile/${actorId}`),
    // Content Export
    createContentExport: (data) => apiClient.post('/lms-standards/exports', data),
    updateContentExportProgress: (exportId, progressPercent, status) => apiClient.put(`/lms-standards/exports/${exportId}/progress`, { progress_percent: progressPercent, status }),
};
