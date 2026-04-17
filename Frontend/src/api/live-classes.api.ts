import apiClient from "./client";

export const liveClassApi = {
  getAllClasses: (status: "upcoming" | "live" | "completed") =>
    apiClient
      .get(`/api/courses/live-classes?status=${status}`)
      .then((r) => r.data),

  getClassById: (classId: string) =>
    apiClient.get(`/api/courses/live-classes/${classId}`).then((r) => r.data),

  joinClass: (classId: string) =>
    apiClient
      .post(`/api/courses/live-classes/${classId}/join`, {})
      .then((r) => r.data),

  getRecording: (classId: string) =>
    apiClient
      .get(`/api/courses/live-classes/${classId}/recording`)
      .then((r) => r.data),

  createClass: (data: any) =>
    apiClient.post("/api/courses/live-classes", data).then((r) => r.data),

  updateClass: (classId: string, data: any) =>
    apiClient
      .patch(`/api/courses/live-classes/${classId}`, data)
      .then((r) => r.data),

  deleteClass: (classId: string) =>
    apiClient
      .delete(`/api/courses/live-classes/${classId}`)
      .then((r) => r.data),
};
