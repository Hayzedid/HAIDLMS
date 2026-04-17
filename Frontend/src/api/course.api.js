import apiClient from "./client";
export const courseApi = {
    // Categories
    getCategories: () => apiClient.get("/courses/categories"),
    // Courses
    listCourses: (params) => apiClient.get("/courses", { params }),
    getCourse: (id) => apiClient.get(`/courses/${id}`),
    createCourse: (data) => apiClient.post("/courses", data),
    updateCourse: (id, data) => apiClient.patch(`/courses/${id}`, data),
    deleteCourse: (id) => apiClient.delete(`/courses/${id}`),
    publishCourse: (id, status) => apiClient.patch(`/courses/${id}/publish`, { status }),
    // Modules
    createModule: (courseId, data) => apiClient.post(`/courses/${courseId}/modules`, data),
    updateModule: (id, data) => apiClient.patch(`/modules/${id}`, data),
    deleteModule: (id) => apiClient.delete(`/modules/${id}`),
    reorderModules: (courseId, moduleIds) => apiClient.post(`/courses/${courseId}/modules/reorder`, { moduleIds }),
    // Lessons
    getLesson: (id) => apiClient.get(`/lessons/${id}`),
    createLesson: (moduleId, data) => apiClient.post(`/lessons/modules/${moduleId}/lessons`, data),
    updateLesson: (id, data) => apiClient.patch(`/lessons/${id}`, data),
    deleteLesson: (id) => apiClient.delete(`/lessons/${id}`),
    reorderLessons: (moduleId, lessonIds) => apiClient.post(`/lessons/modules/${moduleId}/lessons/reorder`, {
        lessonIds,
    }),
    // Enrollment
    enrollInCourse: (courseId) => apiClient.post(`/courses/${courseId}/enroll`),
    getMyEnrollments: (params) => apiClient.get("/my-enrollments", {
        params,
    }),
    getEnrollmentDetails: (courseId) => apiClient.get(`/courses/${courseId}/enrollment`),
    dropEnrollment: (courseId) => apiClient.delete(`/courses/${courseId}/enrollment`),
    // Progress
    completeLesson: (lessonId, data) => apiClient.post(`/lessons/${lessonId}/complete`, data),
    getLessonProgress: (lessonId) => apiClient.get(`/lessons/${lessonId}/progress`),
    getCourseProgress: (courseId) => apiClient.get(`/courses/${courseId}/progress`),
    getNextLesson: (courseId) => apiClient.get(`/courses/${courseId}/next-lesson`),
    // Reviews
    getCourseReviews: (courseId, params) => apiClient.get(`/courses/${courseId}/reviews`, { params }),
    createReview: (courseId, data) => apiClient.post(`/courses/${courseId}/reviews`, data),
    updateReview: (id, data) => apiClient.patch(`/reviews/${id}`, data),
    deleteReview: (id) => apiClient.delete(`/reviews/${id}`),
    respondToReview: (id, instructorResponse) => apiClient.post(`/reviews/${id}/respond`, { instructorResponse }),
    // Upload
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post("/upload/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    uploadVideo: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.post("/upload/video", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getPresignedUploadUrl: (fileName, fileType, folder) => apiClient.post("/upload/presigned-url", {
        fileName,
        fileType,
        folder,
    }),
    // Advanced Search
    searchCourses: (filters) => {
        const params = {};
        if (filters.query)
            params.search = filters.query;
        if (filters.category)
            params.categoryId = filters.category;
        if (filters.level)
            params.skillLevel = filters.level;
        if (filters.rating)
            params.minRating = filters.rating;
        if (filters.priceRange) {
            params.minPrice = filters.priceRange[0];
            params.maxPrice = filters.priceRange[1];
        }
        if (filters.sortBy)
            params.sort = filters.sortBy;
        return apiClient
            .get("/courses/search", { params })
            .then((r) => r.data?.data || []);
    },
};
