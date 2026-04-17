import apiClient from "./client";

export const studyGroupsApi = {
  getAllGroups: (params?: { search?: string }) =>
    apiClient.get("/api/courses/study-groups", { params }).then((r) => r.data),

  getGroupById: (groupId: string) =>
    apiClient.get(`/api/courses/study-groups/${groupId}`).then((r) => r.data),

  createGroup: (data: any) =>
    apiClient.post("/api/courses/study-groups", data).then((r) => r.data),

  updateGroup: (groupId: string, data: any) =>
    apiClient
      .patch(`/api/courses/study-groups/${groupId}`, data)
      .then((r) => r.data),

  deleteGroup: (groupId: string) =>
    apiClient
      .delete(`/api/courses/study-groups/${groupId}`)
      .then((r) => r.data),

  joinGroup: (groupId: string) =>
    apiClient
      .post(`/api/courses/study-groups/${groupId}/join`, {})
      .then((r) => r.data),

  leaveGroup: (groupId: string) =>
    apiClient
      .post(`/api/courses/study-groups/${groupId}/leave`, {})
      .then((r) => r.data),

  getGroupMessages: (groupId: string) =>
    apiClient
      .get(`/api/courses/study-groups/${groupId}/messages`)
      .then((r) => r.data),

  sendGroupMessage: (groupId: string, content: string) =>
    apiClient
      .post(`/api/courses/study-groups/${groupId}/messages`, { content })
      .then((r) => r.data),

  getGroupMembers: (groupId: string) =>
    apiClient
      .get(`/api/courses/study-groups/${groupId}/members`)
      .then((r) => r.data),
};
