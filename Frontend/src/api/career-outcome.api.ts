import apiClient from "./client";

export const careerApi = {
  getCareerOutcomes: () =>
    apiClient.get("/api/courses/career-outcomes").then((r) => r.data),

  getRecommendedJobs: () =>
    apiClient
      .get("/api/courses/career-outcomes/recommended")
      .then((r) => r.data),

  searchJobs: (params: any) =>
    apiClient
      .get("/api/courses/career-outcomes/search", { params })
      .then((r) => r.data),

  getJobDetails: (jobId: string) =>
    apiClient
      .get(`/api/courses/career-outcomes/jobs/${jobId}`)
      .then((r) => r.data),

  applyForJob: (jobId: string) =>
    apiClient
      .post(`/api/courses/career-outcomes/jobs/${jobId}/apply`, {})
      .then((r) => r.data),

  getCareerPathway: () =>
    apiClient.get("/api/courses/career-outcomes/pathway").then((r) => r.data),

  getSalaryInsights: () =>
    apiClient
      .get("/api/courses/career-outcomes/salary-insights")
      .then((r) => r.data),
};
