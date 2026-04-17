import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_INTEGRITY_SERVICE_URL || "http://localhost:4008";

/**
 * Code Explain / Viva Mode API Client
 */

export interface VivaRequest {
  id: string;
  submissionId: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  requestedBy: string;
  selectionType: "random" | "flagged" | "all" | "manual";
  reason?: string;
  instructions?: string;
  requestedAt: Date;
  dueAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  status:
    | "pending"
    | "submitted"
    | "under_review"
    | "graded"
    | "expired"
    | "waived";
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoTranscript?: string;
  studentNotes?: string;
  reviewedBy?: string;
  explanationScore?: number;
  comprehensionLevel?: "poor" | "fair" | "good" | "excellent";
  reviewNotes?: string;
  authenticityVerified?: boolean;
  isLate: boolean;
  isIncomplete: boolean;
  requiresResubmit: boolean;
}

export interface VivaStatistics {
  assessmentId: string;
  totalRequests: number;
  totalSubmitted: number;
  totalGraded: number;
  totalExpired: number;
  avgSubmissionHours: number;
  avgExplanationScore: number;
  authenticityVerifiedCount: number;
}

/**
 * Create viva request for specific student
 */
export async function createVivaRequest(data: {
  submissionId: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  selectionType?: string;
  reason?: string;
  instructions?: string;
  deadlineHours?: number;
}): Promise<VivaRequest> {
  const response = await axios.post(`${BASE_URL}/api/viva/requests`, data);
  return response.data.data;
}

/**
 * Random selection of students for viva
 */
export async function selectRandomStudents(
  assessmentId: string,
  problemId: string,
  percentage: number,
  instructions?: string,
  deadlineHours = 48,
): Promise<VivaRequest[]> {
  const response = await axios.post(`${BASE_URL}/api/viva/select/random`, {
    assessmentId,
    problemId,
    percentage,
    instructions,
    deadlineHours,
  });
  return response.data.data;
}

/**
 * Select flagged submissions for viva
 */
export async function selectFlaggedStudents(
  assessmentId: string,
  problemId: string,
  similarityThreshold = 0.75,
  instructions?: string,
  deadlineHours = 48,
): Promise<VivaRequest[]> {
  const response = await axios.post(`${BASE_URL}/api/viva/select/flagged`, {
    assessmentId,
    problemId,
    similarityThreshold,
    instructions,
    deadlineHours,
  });
  return response.data.data;
}

/**
 * Submit video explanation
 */
export async function submitVideoExplanation(
  vivaRequestId: string,
  videoUrl: string,
  videoDurationSeconds: number,
  studentNotes?: string,
): Promise<VivaRequest> {
  const response = await axios.post(
    `${BASE_URL}/api/viva/requests/${vivaRequestId}/submit`,
    {
      videoUrl,
      videoDurationSeconds,
      studentNotes,
    },
  );
  return response.data.data;
}

/**
 * Review video explanation
 */
export async function reviewVideoExplanation(
  vivaRequestId: string,
  data: {
    explanationScore: number;
    comprehensionLevel: "poor" | "fair" | "good" | "excellent";
    reviewNotes: string;
    authenticityVerified: boolean;
    requiresResubmit?: boolean;
  },
): Promise<VivaRequest> {
  const response = await axios.post(
    `${BASE_URL}/api/viva/requests/${vivaRequestId}/review`,
    data,
  );
  return response.data.data;
}

/**
 * Get viva request by ID
 */
export async function getVivaRequest(id: string): Promise<VivaRequest> {
  const response = await axios.get(`${BASE_URL}/api/viva/requests/${id}`);
  return response.data.data;
}

/**
 * Get pending viva requests for student
 */
export async function getStudentPendingRequests(): Promise<VivaRequest[]> {
  const response = await axios.get(`${BASE_URL}/api/viva/student/pending`);
  return response.data.data;
}

/**
 * Get overdue viva requests for student
 */
export async function getStudentOverdueRequests(): Promise<VivaRequest[]> {
  const response = await axios.get(`${BASE_URL}/api/viva/student/overdue`);
  return response.data.data;
}

/**
 * Get vivas needing review (instructor view)
 */
export async function getInstructorPendingReviews(
  limit = 50,
): Promise<VivaRequest[]> {
  const response = await axios.get(
    `${BASE_URL}/api/viva/instructor/pending-review`,
    {
      params: { limit },
    },
  );
  return response.data.data;
}

/**
 * Get all viva requests for assessment
 */
export async function getAssessmentVivaRequests(
  assessmentId: string,
  status?: string,
): Promise<VivaRequest[]> {
  const response = await axios.get(
    `${BASE_URL}/api/viva/assessment/${assessmentId}`,
    {
      params: status ? { status } : {},
    },
  );
  return response.data.data;
}

/**
 * Get viva statistics for assessment
 */
export async function getAssessmentStatistics(
  assessmentId: string,
): Promise<VivaStatistics> {
  const response = await axios.get(
    `${BASE_URL}/api/viva/assessment/${assessmentId}/stats`,
  );
  return response.data.data;
}

/**
 * Waive viva requirement
 */
export async function waiveVivaRequest(
  vivaRequestId: string,
  reason: string,
): Promise<void> {
  await axios.post(`${BASE_URL}/api/viva/requests/${vivaRequestId}/waive`, {
    reason,
  });
}

/**
 * Get list of assessments with viva requirements
 */
export async function getAssessments(): Promise<
  Array<{
    id: string;
    name: string;
    totalRequests?: number;
    pending?: number;
    submitted?: number;
  }>
> {
  const response = await axios.get(`${BASE_URL}/api/viva/assessments`);
  return response.data.data || [];
}

export const vivaApi = {
  createVivaRequest,
  selectRandomStudents,
  selectFlaggedStudents,
  submitVideoExplanation,
  reviewVideoExplanation,
  getVivaRequest,
  getStudentPendingRequests,
  getStudentOverdueRequests,
  getInstructorPendingReviews,
  getAssessmentVivaRequests,
  getAssessmentStatistics,
  getAssessments,
  waiveVivaRequest,
};
