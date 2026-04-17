import apiClient from "./client";

export const messagingApi = {
  getConversations: () =>
    apiClient.get("/api/courses/messaging/conversations").then((r) => r.data),

  getMessages: (conversationId: string) =>
    apiClient
      .get(`/api/courses/messaging/conversations/${conversationId}/messages`)
      .then((r) => r.data),

  sendMessage: (conversationId: string, content: string) =>
    apiClient
      .post(`/api/courses/messaging/conversations/${conversationId}/messages`, {
        content,
      })
      .then((r) => r.data),

  startConversation: (participantId: string) =>
    apiClient
      .post("/api/courses/messaging/conversations", { participantId })
      .then((r) => r.data),

  deleteConversation: (conversationId: string) =>
    apiClient
      .delete(`/api/courses/messaging/conversations/${conversationId}`)
      .then((r) => r.data),

  markAsRead: (conversationId: string) =>
    apiClient
      .patch(`/api/courses/messaging/conversations/${conversationId}/read`, {})
      .then((r) => r.data),

  searchMessages: (query: string) =>
    apiClient
      .get(`/api/courses/messaging/search?q=${query}`)
      .then((r) => r.data),

  getGroupChat: (groupId: string) =>
    apiClient
      .get(`/api/courses/messaging/groups/${groupId}`)
      .then((r) => r.data),

  sendGroupMessage: (groupId: string, content: string) =>
    apiClient
      .post(`/api/courses/messaging/groups/${groupId}/messages`, { content })
      .then((r) => r.data),
};
