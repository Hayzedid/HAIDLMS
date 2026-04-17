import apiClient from "./client";
export const studyGroupsApi = {
    getAllGroups: (params) => apiClient.get("/api/courses/study-groups", { params }).then((r) => r.data),
    getGroupById: (groupId) => apiClient.get(`/api/courses/study-groups/${groupId}`).then((r) => r.data),
    createGroup: (data) => apiClient.post("/api/courses/study-groups", data).then((r) => r.data),
    updateGroup: (groupId, data) => apiClient
        .patch(`/api/courses/study-groups/${groupId}`, data)
        .then((r) => r.data),
    deleteGroup: (groupId) => apiClient
        .delete(`/api/courses/study-groups/${groupId}`)
        .then((r) => r.data),
    joinGroup: (groupId) => apiClient
        .post(`/api/courses/study-groups/${groupId}/join`, {})
        .then((r) => r.data),
    leaveGroup: (groupId) => apiClient
        .post(`/api/courses/study-groups/${groupId}/leave`, {})
        .then((r) => r.data),
    getGroupMessages: (groupId) => apiClient
        .get(`/api/courses/study-groups/${groupId}/messages`)
        .then((r) => r.data),
    sendGroupMessage: (groupId, content) => apiClient
        .post(`/api/courses/study-groups/${groupId}/messages`, { content })
        .then((r) => r.data),
    getGroupMembers: (groupId) => apiClient
        .get(`/api/courses/study-groups/${groupId}/members`)
        .then((r) => r.data),
};
