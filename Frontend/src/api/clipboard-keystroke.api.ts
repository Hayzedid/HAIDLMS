import apiClient from "./client";

export interface ClipboardAttempt {
  id: string;
  userId: string;
  sessionId: string;
  lessonId?: string;
  assessmentId?: string;
  problemId?: string;
  attemptType: "copy" | "cut" | "paste" | "drag_drop" | "right_click_paste";
  source: string;
  blocked: boolean;
  contentLength?: number;
  contentHash?: string;
  cursorPosition?: number;
  selectedTextLength?: number;
  fileName?: string;
  lineNumber?: number;
  detectedBy: string;
  createdAt: string;
}

export interface ClipboardStats {
  totalAttempts: number;
  blockedAttempts: number;
  pasteAttempts: number;
  copyAttempts: number;
  cutAttempts: number;
  uniquePastes: number;
  avgContentLength: number;
}

export interface KeystrokeSession {
  id: string;
  userId: string;
  lessonId?: string;
  assessmentId?: string;
  problemId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  isActive: boolean;
  totalKeystrokes: number;
  totalDeletions: number;
  totalCopyAttempts: number;
  totalPasteAttempts: number;
  avgTypingSpeedWPM?: number;
  avgKeyIntervalMs?: number;
  pauseCount: number;
  longestPauseSeconds?: number;
  linesWritten: number;
  charsWritten: number;
  charsDeleted: number;
  hasSuspiciousBurst: boolean;
  hasLongIdle: boolean;
  consistencyScore?: number;
  finalCode?: string;
  language?: string;
}

export interface KeystrokeEvent {
  id?: string;
  sessionId: string;
  timestampMs: number;
  eventType: string;
  keyCode?: number;
  keyName: string;
  isSpecialKey: boolean;
  modifiers?: string;
  cursorPosition?: number;
  lineNumber?: number;
  columnNumber?: number;
  selectionStart?: number;
  selectionEnd?: number;
  charInserted?: string;
  charsDeleted?: string;
}

export interface TypingPatterns {
  userId: string;
  avgTypingSpeedWPM: number;
  stdDevTypingSpeed: number;
  avgKeyIntervalMs: number;
  stdDevKeyInterval: number;
  sessionsAnalyzed: number;
  lastCalculatedAt: string;
}

export interface IntegrityFlag {
  id: string;
  userId: string;
  sessionId: string;
  assessmentId?: string;
  flagType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: any;
  reviewed: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
  actionTaken?: string;
  reviewedAt?: string;
  createdAt: string;
}

const IDE_SERVICE_URL =
  import.meta.env.VITE_IDE_SERVICE_URL || "http://localhost:4003";

export const clipboardKeystrokeApi = {
  // Clipboard Tracking
  async logClipboardAttempt(data: {
    sessionId: string;
    lessonId?: string;
    assessmentId?: string;
    problemId?: string;
    attemptType: "copy" | "cut" | "paste" | "drag_drop" | "right_click_paste";
    source: string;
    blocked: boolean;
    contentLength?: number;
    content?: string;
    cursorPosition?: number;
    selectedTextLength?: number;
    fileName?: string;
    lineNumber?: number;
    detectedBy: string;
  }): Promise<ClipboardAttempt> {
    const response = await apiClient.post(
      `${IDE_SERVICE_URL}/api/clipboard/log-attempt`,
      data,
    );
    return response.data.data;
  },

  async getSessionAttempts(sessionId: string): Promise<ClipboardAttempt[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/clipboard/session/${sessionId}`,
    );
    return response.data.data;
  },

  async getAssessmentAttempts(
    assessmentId: string,
    userId?: string,
  ): Promise<ClipboardAttempt[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/clipboard/assessment/${assessmentId}`,
      { params: { userId } },
    );
    return response.data.data;
  },

  async getUserClipboardStats(
    userId: string,
    assessmentId?: string,
  ): Promise<ClipboardStats> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/clipboard/stats/${userId}`,
      {
        params: { assessmentId },
      },
    );
    return response.data.data;
  },

  // Keystroke Session Management
  async startKeystrokeSession(data: {
    lessonId?: string;
    assessmentId?: string;
    problemId?: string;
  }): Promise<KeystrokeSession> {
    const response = await apiClient.post(
      `${IDE_SERVICE_URL}/api/keystroke/start-session`,
      data,
    );
    return response.data.data;
  },

  async endKeystrokeSession(
    sessionId: string,
    data: {
      finalCode?: string;
      language?: string;
      avgTypingSpeedWPM?: number;
      avgKeyIntervalMs?: number;
      consistencyScore?: number;
    },
  ): Promise<void> {
    await apiClient.post(
      `${IDE_SERVICE_URL}/api/keystroke/end-session/${sessionId}`,
      data,
    );
  },

  async logKeystrokeEvents(events: KeystrokeEvent[]): Promise<void> {
    await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/log-events`, {
      events,
    });
  },

  async getKeystrokeSession(sessionId: string): Promise<KeystrokeSession> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/session/${sessionId}`,
    );
    return response.data.data;
  },

  async getKeystrokeEvents(
    sessionId: string,
    limit = 10000,
  ): Promise<KeystrokeEvent[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/events/${sessionId}`,
      {
        params: { limit },
      },
    );
    return response.data.data;
  },

  // Typing Patterns & Analysis
  async getTypingPatterns(userId: string): Promise<TypingPatterns> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/patterns/${userId}`,
    );
    return response.data.data;
  },

  async getTypingBaseline(userId: string): Promise<TypingPatterns> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/baseline/${userId}`,
    );
    return response.data.data;
  },

  async getIntegrityConcerns(
    userId?: string,
    assessmentId?: string,
  ): Promise<KeystrokeSession[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/integrity-concerns`,
      {
        params: { userId, assessmentId },
      },
    );
    return response.data.data;
  },

  async getPatternDeviations(userId?: string): Promise<any[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/pattern-deviations`,
      {
        params: { userId },
      },
    );
    return response.data.data;
  },

  // Integrity Flags
  async flagSession(data: {
    userId: string;
    sessionId: string;
    assessmentId?: string;
    flagType: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    evidence: any;
  }): Promise<void> {
    await apiClient.post(`${IDE_SERVICE_URL}/api/keystroke/flag-session`, data);
  },

  async getIntegrityFlags(params: {
    userId?: string;
    sessionId?: string;
    assessmentId?: string;
    severity?: string;
    reviewed?: boolean;
    limit?: number;
  }): Promise<IntegrityFlag[]> {
    const response = await apiClient.get(
      `${IDE_SERVICE_URL}/api/keystroke/integrity-flags`,
      {
        params,
      },
    );
    return response.data.data;
  },

  async reviewIntegrityFlag(
    flagId: string,
    data: {
      reviewNotes: string;
      actionTaken: string;
    },
  ): Promise<void> {
    await apiClient.post(
      `${IDE_SERVICE_URL}/api/keystroke/review-flag/${flagId}`,
      data,
    );
  },
};
