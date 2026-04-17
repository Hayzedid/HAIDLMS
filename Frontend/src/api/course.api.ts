import apiClient from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  category_name?: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  status: "draft" | "review" | "published" | "archived";
  instructorId: string;
  coverImageUrl?: string;
  trailerVideoUrl?: string;
  estimatedDurationHours?: number;
  priceCents: number;
  isFeatured: boolean;
  enrollmentLimit?: number;
  tags?: string[];
  language: string;
  totalEnrollments?: number;
  averageRating?: number;
  totalReviews?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Aliases for common property names
  rating?: number;
  enrollmentCount?: number;
  duration?: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  displayOrder: number;
  durationMinutes?: number;
  isPublished: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  lessonType: "video" | "text" | "code" | "quiz" | "audio";
  displayOrder: number;
  durationMinutes?: number;
  videoUrl?: string;
  videoProvider?: string;
  contentMarkdown?: string;
  isPreview: boolean;
  isPublished: boolean;
  // Optional properties for enhanced lesson types
  audioUrl?: string;
  programmingLanguage?: string;
  codeTemplate?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: "active" | "completed" | "dropped" | "expired";
  progressPercent: number;
  enrolledAt: string;
  lastAccessedAt?: string;
  completedAt?: string;
}

export interface LessonProgress {
  id: string;
  lessonId: string;
  isCompleted: boolean;
  completionPercent: number;
  timeSpentSeconds: number;
  lastPositionSeconds?: number;
  score?: number;
  lastAccessedAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  reviewText?: string;
  instructorResponse?: string;
  createdAt: string;
}

export const courseApi = {
  // Categories
  getCategories: () =>
    apiClient.get<{ data: Category[] }>("/courses/categories"),

  // Courses
  listCourses: (params?: {
    categoryId?: string;
    skillLevel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<{
      data: Course[];
      total: number;
      page: number;
      limit: number;
    }>("/courses", { params }),

  getCourse: (id: string) =>
    apiClient.get<{
      data: Course & { modules?: Module[]; prerequisites?: any[] };
    }>(`/courses/${id}`),

  createCourse: (data: Partial<Course>) =>
    apiClient.post<{ data: Course }>("/courses", data),

  updateCourse: (id: string, data: Partial<Course>) =>
    apiClient.patch<{ data: Course }>(`/courses/${id}`, data),

  deleteCourse: (id: string) => apiClient.delete(`/courses/${id}`),

  publishCourse: (id: string, status: "published" | "draft" | "archived") =>
    apiClient.patch(`/courses/${id}/publish`, { status }),

  // Modules
  createModule: (courseId: string, data: Partial<Module>) =>
    apiClient.post<{ data: Module }>(`/courses/${courseId}/modules`, data),

  updateModule: (id: string, data: Partial<Module>) =>
    apiClient.patch<{ data: Module }>(`/modules/${id}`, data),

  deleteModule: (id: string) => apiClient.delete(`/modules/${id}`),

  reorderModules: (courseId: string, moduleIds: string[]) =>
    apiClient.post(`/courses/${courseId}/modules/reorder`, { moduleIds }),

  // Lessons
  getLesson: (id: string) => apiClient.get<{ data: Lesson }>(`/lessons/${id}`),

  createLesson: (moduleId: string, data: Partial<Lesson>) =>
    apiClient.post<{ data: Lesson }>(
      `/lessons/modules/${moduleId}/lessons`,
      data,
    ),

  updateLesson: (id: string, data: Partial<Lesson>) =>
    apiClient.patch<{ data: Lesson }>(`/lessons/${id}`, data),

  deleteLesson: (id: string) => apiClient.delete(`/lessons/${id}`),

  reorderLessons: (moduleId: string, lessonIds: string[]) =>
    apiClient.post(`/lessons/modules/${moduleId}/lessons/reorder`, {
      lessonIds,
    }),

  // Enrollment
  enrollInCourse: (courseId: string) =>
    apiClient.post<{ data: Enrollment }>(`/courses/${courseId}/enroll`),

  getMyEnrollments: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<{ data: Enrollment[]; total: number }>("/my-enrollments", {
      params,
    }),

  getEnrollmentDetails: (courseId: string) =>
    apiClient.get<{ data: Enrollment & { lessonProgress?: LessonProgress[] } }>(
      `/courses/${courseId}/enrollment`,
    ),

  dropEnrollment: (courseId: string) =>
    apiClient.delete(`/courses/${courseId}/enrollment`),

  // Progress
  completeLesson: (
    lessonId: string,
    data: {
      completionPercent?: number;
      timeSpentSeconds?: number;
      lastPositionSeconds?: number;
      score?: number;
    },
  ) =>
    apiClient.post<{ data: LessonProgress }>(
      `/lessons/${lessonId}/complete`,
      data,
    ),

  getLessonProgress: (lessonId: string) =>
    apiClient.get<{ data: LessonProgress }>(`/lessons/${lessonId}/progress`),

  getCourseProgress: (courseId: string) =>
    apiClient.get<{ data: any }>(`/courses/${courseId}/progress`),

  getNextLesson: (courseId: string) =>
    apiClient.get<{ data: Lesson | null }>(`/courses/${courseId}/next-lesson`),

  // Reviews
  getCourseReviews: (
    courseId: string,
    params?: { page?: number; limit?: number },
  ) =>
    apiClient.get<{ data: Review[]; total: number }>(
      `/courses/${courseId}/reviews`,
      { params },
    ),

  createReview: (
    courseId: string,
    data: { rating: number; reviewText?: string },
  ) => apiClient.post<{ data: Review }>(`/courses/${courseId}/reviews`, data),

  updateReview: (id: string, data: { rating?: number; reviewText?: string }) =>
    apiClient.patch(`/reviews/${id}`, data),

  deleteReview: (id: string) => apiClient.delete(`/reviews/${id}`),

  respondToReview: (id: string, instructorResponse: string) =>
    apiClient.post(`/reviews/${id}/respond`, { instructorResponse }),

  // Upload
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ data: { url: string; key: string } }>(
      "/upload/image",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ data: { url: string; key: string } }>(
      "/upload/video",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },

  getPresignedUploadUrl: (
    fileName: string,
    fileType: string,
    folder?: string,
  ) =>
    apiClient.post<{ data: { url: string; key: string } }>(
      "/upload/presigned-url",
      {
        fileName,
        fileType,
        folder,
      },
    ),

  // Advanced Search
  searchCourses: (filters: {
    query?: string;
    category?: string;
    level?: "beginner" | "intermediate" | "advanced" | "";
    rating?: number;
    priceRange?: [number, number];
    instructor?: string;
    sortBy?: "relevance" | "popularity" | "rating" | "newest" | "price";
  }) => {
    const params: any = {};
    if (filters.query) params.search = filters.query;
    if (filters.category) params.categoryId = filters.category;
    if (filters.level) params.skillLevel = filters.level;
    if (filters.rating) params.minRating = filters.rating;
    if (filters.priceRange) {
      params.minPrice = filters.priceRange[0];
      params.maxPrice = filters.priceRange[1];
    }
    if (filters.sortBy) params.sort = filters.sortBy;

    return apiClient
      .get<{ data: Course[]; total: number }>("/courses/search", { params })
      .then((r) => r.data?.data || []);
  },
};
