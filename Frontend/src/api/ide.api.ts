import axios from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export type Language =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "ruby"
  | "php"
  | "csharp";

export interface ExecutionRequest {
  language: Language;
  code: string;
  stdin?: string;
  timeoutMs?: number;
  memoryLimitMB?: number;
}

export interface ExecutionResult {
  executionId: string;
  status: "completed" | "failed" | "timeout";
  output: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };
  metrics: {
    executionTimeMs: number;
    memoryUsedKB?: number;
  };
  timedOut: boolean;
}

export interface SubmissionRequest {
  lessonId: string;
  courseId: string;
  language: Language;
  code: string;
  fileName?: string;
}

export interface TestResult {
  name: string;
  description?: string;
  passed: boolean;
  isHidden?: boolean;
  points?: number;
  maxPoints?: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTimeMs: number;
  error?: string;
}

export interface SubmissionResult {
  submissionId: string;
  passed: boolean;
  score: number;
  attemptNumber: number;
  tests: {
    passed: number;
    failed: number;
    total: number;
  };
  results: TestResult[];
  executionTimeMs: number;
}

export interface Submission {
  id: string;
  lessonId: string;
  courseId: string;
  language: Language;
  code?: string;
  status: "draft" | "submitted" | "grading" | "passed" | "failed";
  score?: number;
  passed?: boolean;
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
  attemptNumber: number;
  submittedAt?: string;
  createdAt: string;
}

export interface CodeTemplate {
  id: string;
  lessonId: string;
  language: Language;
  starterCode: string;
  solutionCode?: string;
  files?: Array<{
    name: string;
    content: string;
    language: string;
  }>;
  testCommand?: string;
  buildCommand?: string;
}

export interface RunTestsRequest {
  lessonId: string;
  language: Language;
  code: string;
}

export interface RunTestsResult {
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    name: string;
    description?: string;
    passed: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    executionTimeMs: number;
    error?: string;
  }>;
}

// ── API Functions ──────────────────────────────────────────────────────────

/**
 * Execute code in sandbox (non-graded)
 */
export async function executeCode(request: ExecutionRequest) {
  return axios.post<{ data: ExecutionResult }>("/api/ide/execute", request);
}

/**
 * Execute code with streaming output
 * Returns execution ID - client must connect to WebSocket first
 */
export async function executeCodeStream(request: ExecutionRequest) {
  return axios.post<{ data: { executionId: string; message: string } }>(
    "/api/ide/execute-stream",
    request,
  );
}

/**
 * Submit code for grading
 */
export async function submitCode(request: SubmissionRequest) {
  return axios.post<{ data: SubmissionResult }>("/api/ide/submit", request);
}

/**
 * Run visible tests without submitting
 */
export async function runTests(request: RunTestsRequest) {
  return axios.post<{ data: RunTestsResult }>("/api/ide/test", request);
}

/**
 * Get submission details
 */
export async function getSubmission(submissionId: string) {
  return axios.get<{ data: Submission }>(
    `/api/ide/submissions/${submissionId}`,
  );
}

/**
 * List user submissions for a lesson
 */
export async function listSubmissions(lessonId: string) {
  return axios.get<{ data: Submission[] }>(`/api/ide/submissions`, {
    params: { lessonId },
  });
}

/**
 * Get code template for a lesson
 */
export async function getTemplate(lessonId: string, language: Language) {
  return axios.get<{ data: CodeTemplate }>(
    `/api/ide/templates/${lessonId}/${language}`,
  );
}

/**
 * Get all code templates for a lesson (all languages)
 */
export async function getTemplates(lessonId: string) {
  return axios.get<{ data: CodeTemplate[] }>(`/api/ide/templates/${lessonId}`);
}

// ── WebSocket Helpers ──────────────────────────────────────────────────────

export interface StreamMessage {
  type: "status" | "stdout" | "stderr" | "complete" | "error";
  timestamp: number;
  data?: any;
}

export type StreamMessageHandler = (message: StreamMessage) => void;

/**
 * Connect to execution stream WebSocket
 */
export function connectExecutionStream(
  executionId: string,
  onMessage: StreamMessageHandler,
): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.VITE_IDE_SERVICE_URL || "localhost:4003";
  const ws = new WebSocket(
    `${protocol}//${host}/ws/execution?executionId=${executionId}`,
  );

  ws.onmessage = (event) => {
    try {
      const message: StreamMessage = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error("[IDE] Failed to parse stream message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("[IDE] WebSocket error:", error);
  };

  return ws;
}

/**
 * Connect to keystroke tracking WebSocket
 */
export function connectKeystrokeStream(
  sessionId: string,
  userId: string,
): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.VITE_IDE_SERVICE_URL || "localhost:4003";
  const ws = new WebSocket(`${protocol}//${host}/ws/keystrokes`);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "init",
        sessionId,
        userId,
      }),
    );
  };

  return ws;
}

/**
 * Send keystroke event
 */
export function sendKeystroke(
  ws: WebSocket,
  keystroke: {
    key: string;
    keystrokeType: "press" | "delete";
    position: { line: number; column: number };
  },
) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "keystroke",
        timestamp: Date.now(),
        ...keystroke,
      }),
    );
  }
}

export const ideApi = {
  executeCode,
  executeCodeStream,
  submitCode,
  runTests,
  getSubmission,
  listSubmissions,
  getTemplate,
  getTemplates,
  connectExecutionStream,
  connectKeystrokeStream,
  sendKeystroke,
};
