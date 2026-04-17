import apiClient from "./client";
export const liveClassApi = {
    getAllClasses: (status) => apiClient
        .get(`/api/courses/live-classes?status=${status}`)
        .then((r) => r.data),
    getClassById: (classId) => apiClient.get(`/api/courses/live-classes/${classId}`).then((r) => r.data),
    joinClass: (classId) => apiClient
        .post(`/api/courses/live-classes/${classId}/join`, {})
        .then((r) => r.data),
    getRecording: (classId) => apiClient
        .get(`/api/courses/live-classes/${classId}/recording`)
        .then((r) => r.data),
    createClass: (data) => apiClient.post("/api/courses/live-classes", data).then((r) => r.data),
    updateClass: (classId, data) => apiClient
        .patch(`/api/courses/live-classes/${classId}`, data)
        .then((r) => r.data),
    deleteClass: (classId) => apiClient
        .delete(`/api/courses/live-classes/${classId}`)
        .then((r) => r.data),
};
