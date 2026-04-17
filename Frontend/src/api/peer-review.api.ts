import apiClient from './client';

export interface ReviewRubric {
  id: string;
  courseId: string;
  assessmentId?: string;
  name: string;
  description?: string;
  minReviewsRequired: number;
  allowSelfReview: boolean;
  anonymizeReviewers: boolean;
  anonymizeCodeAuthors: boolean;
  submissionDeadline?: string;
  reviewDeadline?: string;
  runMossCheck: boolean;
  mossSimilarityThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface RubricCriterion {
  id: string;
  rubricId: string;
  name: string;
  description: string;
  displayOrder: number;
  weight: number;
  maxScore: number;
  scoreLabels?: Record<string, string>;
  examples?: string;
  isRequired: boolean;
}

export interface CodeReview {
  id: string;
  rubricId: string;
  submissionId: string;
  authorId: string;
  reviewerId: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'disputed' | 'resolved';
  overallScore?: number;
  overallFeedback?: string;
  startedAt?: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
  isFlaggedForCollusion: boolean;
  collusionSimilarityScore?: number;
  isHelpful?: boolean;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  fileName?: string;
  lineNumber: number;
  lineEndNumber?: number;
  codeSnippet?: string;
  comment: string;
  commentType?: 'suggestion' | 'question' | 'praise' | 'issue' | 'critical';
  severity?: 'low' | 'medium' | 'high';
  authorResponse?: string;
  isResolved: boolean;
}

export interface ReviewerStats {
  userId: string;
  totalReviewsCompleted: number;
  totalReviewsAssigned: number;
  onTimeReviews: number;
  lateReviews: number;
  avgTimeSpentSeconds: number;
  avgCommentCount: number;
  avgHelpfulnessRating: number;
  instructorQualityRating?: number;
  completionRate: number;
  onTimeRate: number;
  collusionFlags: number;
  qualityFlags: number;
}

export interface ReviewDispute {
  id: string;
  reviewId: string;
  authorId: string;
  reviewerId: string;
  reason: string;
  description: string;
  requestedOutcome?: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolution?: string;
  resolutionAction?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  openedAt: string;
}

const COURSE_SERVICE_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

export const peerReviewApi = {
  // Rubric Management
  async createRubric(data: Partial<ReviewRubric>): Promise<ReviewRubric> {
    const response = await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/rubrics`, data);
    return response.data.data;
  },

  async getRubric(rubricId: string): Promise<ReviewRubric> {
    const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}`);
    return response.data.data;
  },

  async getCourseRubrics(courseId: string): Promise<ReviewRubric[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/courses/${courseId}/rubrics`
    );
    return response.data.data;
  },

  async createCriterion(rubricId: string, data: Partial<RubricCriterion>): Promise<RubricCriterion> {
    const response = await apiClient.post(
      `${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/criteria`,
      data
    );
    return response.data.data;
  },

  async getRubricCriteria(rubricId: string): Promise<RubricCriterion[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/criteria`
    );
    return response.data.data;
  },

  // Reviewer Assignments
  async assignReviewers(
    rubricId: string,
    data: {
      submissionIds: string[];
      reviewsPerSubmission?: number;
      algorithm?: 'round-robin' | 'random' | 'quality-based';
    }
  ): Promise<void> {
    await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/rubrics/${rubricId}/assign`, data);
  },

  async getReviewerAssignments(
    reviewerId: string,
    status?: string
  ): Promise<CodeReview[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/reviewers/${reviewerId}/assignments`,
      { params: { status } }
    );
    return response.data.data;
  },

  // Review Workflow
  async startReview(reviewId: string): Promise<void> {
    await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/start`);
  },

  async submitCriterionScore(
    reviewId: string,
    data: { criterionId: string; score: number; feedback?: string }
  ): Promise<void> {
    await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/scores`, data);
  },

  async addComment(reviewId: string, data: Partial<ReviewComment>): Promise<ReviewComment> {
    const response = await apiClient.post(
      `${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/comments`,
      data
    );
    return response.data.data;
  },

  async getReviewComments(reviewId: string): Promise<ReviewComment[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/comments`
    );
    return response.data.data;
  },

  async submitReview(
    reviewId: string,
    data: { overallFeedback?: string; timeSpentSeconds?: number }
  ): Promise<void> {
    await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/submit`, data);
  },

  async getReview(reviewId: string): Promise<CodeReview> {
    const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}`);
    return response.data.data;
  },

  async getSubmissionReviews(submissionId: string): Promise<CodeReview[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/submissions/${submissionId}/reviews`
    );
    return response.data.data;
  },

  // Reviewer Performance
  async getReviewerStats(userId: string): Promise<ReviewerStats> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/reviewers/${userId}/stats`
    );
    return response.data.data;
  },

  async rateReviewHelpfulness(reviewId: string, isHelpful: boolean): Promise<void> {
    await apiClient.post(`${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/rate`, {
      isHelpful,
    });
  },

  // Disputes
  async createDispute(
    reviewId: string,
    data: {
      authorId: string;
      reviewerId: string;
      reason: string;
      description: string;
      requestedOutcome?: string;
    }
  ): Promise<ReviewDispute> {
    const response = await apiClient.post(
      `${COURSE_SERVICE_URL}/api/peer-review/reviews/${reviewId}/dispute`,
      data
    );
    return response.data.data;
  },

  async getDisputes(status?: string): Promise<ReviewDispute[]> {
    const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/disputes`, {
      params: { status },
    });
    return response.data.data;
  },

  async resolveDispute(
    disputeId: string,
    data: {
      resolvedBy: string;
      resolution: string;
      resolutionAction: 'no_change' | 'score_adjusted' | 'review_removed' | 're_review_assigned';
      newScore?: number;
    }
  ): Promise<void> {
    await apiClient.post(
      `${COURSE_SERVICE_URL}/api/peer-review/disputes/${disputeId}/resolve`,
      data
    );
  },

  // Views
  async getPendingReviews(reviewerId?: string): Promise<any[]> {
    const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/pending-reviews`, {
      params: { reviewerId },
    });
    return response.data.data;
  },

  async getSubmissionsAwaitingReviews(authorId?: string): Promise<any[]> {
    const response = await apiClient.get(`${COURSE_SERVICE_URL}/api/peer-review/awaiting-reviews`, {
      params: { authorId },
    });
    return response.data.data;
  },

  async getHighQualityReviewers(limit = 20): Promise<any[]> {
    const response = await apiClient.get(
      `${COURSE_SERVICE_URL}/api/peer-review/high-quality-reviewers`,
      { params: { limit } }
    );
    return response.data.data;
  },
};
