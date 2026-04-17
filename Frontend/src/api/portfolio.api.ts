import apiClient from "./client";

export const portfolioApi = {
  getMyPortfolio: () =>
    apiClient.get("/api/courses/portfolio").then((r) => r.data),

  getPortfolioByUser: (userId: string) =>
    apiClient.get(`/api/courses/portfolio/user/${userId}`).then((r) => r.data),

  addItem: (data: any) =>
    apiClient.post("/api/courses/portfolio", data).then((r) => r.data),

  updateItem: (itemId: string, data: any) =>
    apiClient
      .patch(`/api/courses/portfolio/${itemId}`, data)
      .then((r) => r.data),

  deleteItem: (itemId: string) =>
    apiClient.delete(`/api/courses/portfolio/${itemId}`).then((r) => r.data),

  sharePortfolio: (config: any) =>
    apiClient.post("/api/courses/portfolio/share", config).then((r) => r.data),

  getSharedPortfolio: (shareLinkId: string) =>
    apiClient
      .get(`/api/courses/portfolio/shared/${shareLinkId}`)
      .then((r) => r.data),
};
