import apiClient from './client';

export interface ProctoringSession {
  id: string;
  assessment_id: string;
  user_id: string;
  session_token: string;
  proctoring_mode: 'live' | 'recorded' | 'ai_automated' | 'hybrid' | 'no_proctoring';
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'terminated' | 'cancelled';
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  violation_count?: number;
  max_severity?: string;
  created_at: string;
  updated_at: string;
}

export interface Violation {
  id: string;
  session_id: string;
  user_id: string;
  violation_type: 'multiple_faces' | 'no_face' | 'face_not_recognized' | 'looking_away' |
    'suspicious_audio' | 'tab_switch' | 'window_switch' | 'prohibited_app' |
    'external_monitor' | 'mobile_device_detected' | 'unauthorized_person' |
    'screen_sharing_stopped' | 'browser_exit' | 'copy_paste' | 'suspicious_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  snapshot_url?: string;
  violation_description?: string;
  detected_at: string;
}

export interface FaceCapture {
  id: string;
  session_id: string;
  user_id: string;
  image_url: string;
  faces_detected: number;
  face_match_score?: number;
  captured_at: string;
}

export interface IdentityVerification {
  id: string;
  session_id: string;
  user_id: string;
  verification_method: 'face_match' | 'id_document' | 'knowledge_based' | 'biometric' | 'multi_factor';
  is_verified?: boolean;
  confidence?: number;
  face_photo_url?: string;
  initiated_at: string;
  verified_at?: string;
}

export interface PlagiarismCheck {
  id: string;
  submission_id: string;
  user_id: string;
  assessment_id: string;
  similarity_percent?: number;
  is_plagiarized?: boolean;
  matched_sources?: string[];
  initiated_at: string;
  completed_at?: string;
}

export interface BrowserLockdown {
  id: string;
  session_id: string;
  user_id: string;
  browser_name?: string;
  lockdown_level: 'strict' | 'moderate' | 'basic';
  lockdown_started_at: string;
  last_heartbeat?: string;
}

export interface HighRiskSession extends ProctoringSession {
  risk_score: number;
  risk_level: 'extreme' | 'very_high' | 'high' | 'elevated';
}

export const proctoringApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{ healthy: boolean; metrics: any }>('/proctoring/health'),

  // Sessions
  createSession: (data: {
    assessment_id: string;
    user_id: string;
    session_token: string;
    proctoring_mode: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/sessions', data),

  getSessions: (params?: {
    user_id?: string;
    assessment_id?: string;
    status?: string;
    proctoring_mode?: string;
  }) =>
    apiClient.get<{ sessions: ProctoringSession[]; count: number }>('/proctoring/sessions', { params }),

  getSessionById: (sessionId: string) =>
    apiClient.get<ProctoringSession>(`/proctoring/sessions/${sessionId}`),

  updateSessionStatus: (sessionId: string, status: string) =>
    apiClient.put<{ message: string; session_id: string; status: string }>(
      `/proctoring/sessions/${sessionId}/status`,
      { status }
    ),

  // Violations
  recordViolation: (data: {
    session_id: string;
    user_id: string;
    violation_type: string;
    severity: string;
    snapshot_url?: string;
    violation_description?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/violations', data),

  getViolations: (sessionId: string) =>
    apiClient.get<{
      session_id: string;
      violations: Violation[];
      summary: {
        total_violations: number;
        by_severity: Record<string, number>;
        most_common_type: string;
      };
    }>(`/proctoring/violations/${sessionId}`),

  // Face Recognition
  recordFaceCapture: (data: {
    session_id: string;
    user_id: string;
    image_url: string;
    faces_detected: number;
    face_match_score?: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/face/capture', data),

  getFaceCaptures: (sessionId: string, limit?: number) =>
    apiClient.get<{ session_id: string; captures: FaceCapture[]; count: number }>(
      `/proctoring/face/captures/${sessionId}`,
      { params: { limit } }
    ),

  // Identity Verification
  verifyIdentity: (data: {
    session_id: string;
    user_id: string;
    verification_method: string;
    face_photo_url?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/identity/verify', data),

  updateVerificationResult: (verificationId: string, data: {
    is_verified: boolean;
    confidence: number;
  }) =>
    apiClient.put<{ message: string; verification_id: string; is_verified: boolean }>(
      `/proctoring/identity/${verificationId}/result`,
      data
    ),

  // Plagiarism
  checkPlagiarism: (data: {
    submission_id: string;
    user_id: string;
    assessment_id: string;
    content_text: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/plagiarism/check', data),

  updatePlagiarismResult: (checkId: string, data: {
    similarity_percent: number;
    is_plagiarized: boolean;
    matched_sources?: string[];
  }) =>
    apiClient.put<{ message: string; check_id: string; is_plagiarized: boolean }>(
      `/proctoring/plagiarism/${checkId}/result`,
      data
    ),

  getPlagiarismChecks: (params?: {
    submission_id?: string;
    user_id?: string;
    is_plagiarized?: boolean;
  }) =>
    apiClient.get<{ checks: PlagiarismCheck[]; count: number }>(
      '/proctoring/plagiarism/checks',
      { params }
    ),

  // Risk Analysis
  getHighRiskSessions: () =>
    apiClient.get<{ high_risk_sessions: HighRiskSession[]; count: number }>(
      '/proctoring/risk/high-risk-sessions'
    ),

  // Browser Lockdown
  recordBrowserLockdown: (data: {
    session_id: string;
    user_id: string;
    browser_name?: string;
    lockdown_level: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/proctoring/lockdown', data),

  updateLockdownHeartbeat: (lockdownId: string) =>
    apiClient.post<{ message: string; lockdown_id: string }>(
      `/proctoring/lockdown/${lockdownId}/heartbeat`
    ),
};
