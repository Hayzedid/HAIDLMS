import axios from 'axios';

const BASE_URL = import.meta.env.VITE_INTEGRITY_SERVICE_URL || 'http://localhost:4008';

/**
 * Plagiarism Detection API Client
 */

export interface CodeSubmission {
  id: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
  code: string;
  fileName?: string;
  submittedAt: string;
  plagiarismStatus: 'pending' | 'clean' | 'suspicious' | 'plagiarized' | 'under_review';
  similarityScore?: number;
  matchedSubmissions?: any[];
  mossReportUrl?: string;
  aiAnalysis?: any;
  isFlagged: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface PlagiarismMatch {
  id: string;
  submission1_id: string;
  submission2_id: string;
  similarity_score: number;
  matching_lines: number;
  total_lines: number;
  algorithm: string;
  match_details: any;
  user1_id: string;
  user2_id: string;
  code1: string;
  code2: string;
}

export interface PlagiarismStats {
  total_submissions: number;
  flagged_submissions: number;
  confirmed_plagiarism: number;
  suspicious_submissions: number;
  clean_submissions: number;
  avg_similarity_score: number;
  max_similarity_score: number;
  total_matches: number;
  plagiarism_rate: string;
}

/**
 * Submit code for plagiarism check
 */
export async function submitCode(data: {
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
  code: string;
  fileName?: string;
}): Promise<CodeSubmission> {
  const response = await axios.post(`${BASE_URL}/api/plagiarism/submit`, data);
  return response.data.data;
}

/**
 * Get submission by ID
 */
export async function getSubmission(submissionId: string): Promise<CodeSubmission> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/submissions/${submissionId}`);
  return response.data.data;
}

/**
 * Get user submissions
 */
export async function getUserSubmissions(
  userId: string,
  assessmentId?: string
): Promise<CodeSubmission[]> {
  const params = assessmentId ? { assessmentId } : {};
  const response = await axios.get(`${BASE_URL}/api/plagiarism/submissions/user/${userId}`, {
    params,
  });
  return response.data.data;
}

/**
 * Get flagged submissions (instructor view)
 */
export async function getFlaggedSubmissions(limit = 100): Promise<CodeSubmission[]> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/flagged`, {
    params: { limit },
  });
  return response.data.data;
}

/**
 * Get plagiarism matches for a submission
 */
export async function getMatches(submissionId: string): Promise<PlagiarismMatch[]> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/matches/${submissionId}`);
  return response.data.data;
}

/**
 * Trigger MOSS check for assessment
 */
export async function triggerMossCheck(assessmentId: string, problemId: string): Promise<void> {
  await axios.post(`${BASE_URL}/api/plagiarism/moss/check`, {
    assessmentId,
    problemId,
  });
}

/**
 * Get MOSS report URL
 */
export async function getMossReportUrl(submissionId: string): Promise<string> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/moss/report/${submissionId}`);
  return response.data.data.reportUrl;
}

/**
 * Update submission review
 */
export async function updateReview(
  submissionId: string,
  data: {
    reviewedBy: string;
    reviewNotes: string;
    plagiarismStatus?: 'pending' | 'clean' | 'suspicious' | 'plagiarized' | 'under_review';
  }
): Promise<void> {
  await axios.patch(`${BASE_URL}/api/plagiarism/submissions/${submissionId}/review`, data);
}

/**
 * Get assessment plagiarism statistics
 */
export async function getAssessmentStats(assessmentId: string): Promise<PlagiarismStats> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/stats/assessment/${assessmentId}`);
  return response.data.data;
}

/**
 * Get course plagiarism statistics
 */
export async function getCourseStats(courseId: string): Promise<any> {
  const response = await axios.get(`${BASE_URL}/api/plagiarism/stats/course/${courseId}`);
  return response.data.data;
}

export const plagiarismApi = {
  submitCode,
  getSubmission,
  getUserSubmissions,
  getFlaggedSubmissions,
  getMatches,
  triggerMossCheck,
  getMossReportUrl,
  updateReview,
  getAssessmentStats,
  getCourseStats,
};
