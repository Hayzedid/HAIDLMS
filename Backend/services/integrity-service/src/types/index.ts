export type WatchEventType =
  | 'play'
  | 'pause'
  | 'seek'
  | 'tab_blur'
  | 'tab_focus'
  | 'window_blur'
  | 'window_focus'
  | 'fullscreen_enter'
  | 'fullscreen_exit';

export type CheckpointResult = 'correct' | 'incorrect' | 'skipped' | 'timeout';

export type ProctoringEventType =
  | 'session_start'
  | 'session_end'
  | 'face_detected'
  | 'face_lost'
  | 'multiple_faces'
  | 'no_face'
  | 'tab_switch'
  | 'screen_share_stopped'
  | 'suspicious_behavior'
  | 'audio_detected'
  | 'exam_submitted';

export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'requires_review';

export type PlagiarismStatus = 'pending' | 'clean' | 'suspicious' | 'plagiarized' | 'under_review';

export type KeystrokeEventType = 'keydown' | 'keyup' | 'paste' | 'cut' | 'copy' | 'focus' | 'blur';

export interface VideoWatchSession {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  videoUrl: string;
  videoDuration: number;
  startedAt: Date;
  endedAt?: Date;
  totalWatchTime: number;
  completionPercentage: number;
  passedThreshold: boolean;
  seekCount: number;
  tabSwitchCount: number;
  violations: any[];
  isValid: boolean;
}

export interface VideoWatchEvent {
  sessionId: string;
  eventType: WatchEventType;
  timestampMs: number;
  clientTimestamp: Date;
  durationMs?: number;
  fromPosition?: number;
  toPosition?: number;
  metadata?: Record<string, any>;
}

export interface ComprehensionCheckpoint {
  id: string;
  courseId: string;
  lessonId: string;
  videoTimestamp: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  isActive: boolean;
}

export interface ProctoringSession {
  id: string;
  userId: string;
  assessmentId: string;
  assessmentType: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  webcamEnabled: boolean;
  screenRecordingEnabled: boolean;
  browserLockdownEnabled: boolean;
  faceVerificationRequired: boolean;
  initialVerificationStatus: VerificationStatus;
  finalVerificationStatus: VerificationStatus;
  suspiciousEventsCount: number;
  violations: any[];
  isFlagged: boolean;
  proctorReviewStatus: string;
  proctorNotes?: string;
  recordingUrl?: string;
}

export interface ProctoringEvent {
  sessionId: string;
  eventType: ProctoringEventType;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  description?: string;
  metadata?: Record<string, any>;
  screenshotUrl?: string;
  faceImageUrl?: string;
}

export interface BiometricProfile {
  id: string;
  userId: string;
  photoIdUrl?: string;
  profilePhotoUrl?: string;
  faceEncodings?: Buffer;
  alternateEncodings?: any[];
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  lastVerified?: Date;
}

export interface KeystrokeSession {
  id: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  totalKeystrokes: number;
  pasteCount: number;
  copyCount: number;
  typingSpeedWpm?: number;
  pauseCount: number;
  avgPauseDuration?: number;
  finalCode?: string;
  characterCount: number;
  lineCount: number;
  isSuspicious: boolean;
  analysis?: Record<string, any>;
}

export interface KeystrokeEvent {
  sessionId: string;
  eventType: KeystrokeEventType;
  key?: string;
  timestampMs: number;
  cursorPosition?: number;
  lineNumber?: number;
  columnNumber?: number;
  codeLength?: number;
  metadata?: Record<string, any>;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
  code: string;
  fileName?: string;
  submittedAt: Date;
  plagiarismStatus: PlagiarismStatus;
  similarityScore?: number;
  matchedSubmissions?: any[];
  mossReportUrl?: string;
  aiAnalysis?: Record<string, any>;
  isFlagged: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface PlagiarismMatch {
  id: string;
  submission1Id: string;
  submission2Id: string;
  similarityScore: number;
  matchingLines: number;
  totalLines: number;
  algorithm: string;
  matchDetails?: Record<string, any>;
}

export interface IntegrityScore {
  userId: string;
  overallScore: number;
  videoAccountabilityScore: number;
  proctoringScore: number;
  plagiarismScore: number;
  behaviorScore: number;
  totalViolations: number;
  majorViolations: number;
  minorViolations: number;
  lastViolationDate?: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: any[];
}

export interface ViolationLog {
  id: string;
  userId: string;
  violationType: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  context?: Record<string, any>;
  relatedSessionId?: string;
  actionTaken?: string;
  scorePenalty: number;
  notified: boolean;
  reviewed: boolean;
  createdAt: Date;
}

// Request/Response types
export interface CreateVideoSessionRequest {
  userId: string;
  courseId: string;
  lessonId: string;
  videoUrl: string;
  videoDuration: number;
}

export interface TrackVideoEventRequest {
  sessionId: string;
  eventType: WatchEventType;
  timestampMs: number;
  durationMs?: number;
  fromPosition?: number;
  toPosition?: number;
  metadata?: Record<string, any>;
}

export interface StartProctoringRequest {
  userId: string;
  assessmentId: string;
  assessmentType: string;
  webcamEnabled: boolean;
  screenRecordingEnabled: boolean;
  browserLockdownEnabled: boolean;
  faceVerificationRequired: boolean;
}

export interface TrackProctoringEventRequest {
  sessionId: string;
  eventType: ProctoringEventType;
  severity: 'info' | 'warning' | 'critical';
  description?: string;
  metadata?: Record<string, any>;
}

export interface VerifyFaceRequest {
  userId: string;
  sessionId?: string;
  imageData: string; // base64
  attemptType: 'initial' | 'periodic' | 'challenge';
}

export interface StartKeystrokeSessionRequest {
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
}

export interface TrackKeystrokeRequest {
  sessionId: string;
  eventType: KeystrokeEventType;
  key?: string;
  timestampMs: number;
  cursorPosition?: number;
  lineNumber?: number;
  columnNumber?: number;
  codeLength?: number;
}

export interface SubmitCodeRequest {
  userId: string;
  assessmentId: string;
  problemId: string;
  language: string;
  code: string;
  fileName?: string;
  keystrokeSessionId?: string;
}

export interface CheckPlagiarismRequest {
  submissionId: string;
  checkExternal?: boolean;
}
