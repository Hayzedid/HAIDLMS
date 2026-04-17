import apiClient from "./client";
export const portfolioApi = {
    getMyPortfolio: () => apiClient.get("/api/courses/portfolio").then((r) => r.data),
    getPortfolioByUser: (userId) => apiClient.get(`/api/courses/portfolio/user/${userId}`).then((r) => r.data),
    addItem: (data) => apiClient.post("/api/courses/portfolio", data).then((r) => r.data),
    updateItem: (itemId, data) => apiClient
        .patch(`/api/courses/portfolio/${itemId}`, data)
        .then((r) => r.data),
    deleteItem: (itemId) => apiClient.delete(`/api/courses/portfolio/${itemId}`).then((r) => r.data),
    sharePortfolio: (config) => apiClient.post("/api/courses/portfolio/share", config).then((r) => r.data),
    getSharedPortfolio: (shareLinkId) => apiClient
        .get(`/api/courses/portfolio/shared/${shareLinkId}`)
        .then((r) => r.data),
};
