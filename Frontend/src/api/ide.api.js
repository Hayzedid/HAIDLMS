import axios from "./client";
// ── API Functions ──────────────────────────────────────────────────────────
/**
 * Execute code in sandbox (non-graded)
 */
export async function executeCode(request) {
    return axios.post("/api/ide/execute", request);
}
/**
 * Execute code with streaming output
 * Returns execution ID - client must connect to WebSocket first
 */
export async function executeCodeStream(request) {
    return axios.post("/api/ide/execute-stream", request);
}
/**
 * Submit code for grading
 */
export async function submitCode(request) {
    return axios.post("/api/ide/submit", request);
}
/**
 * Run visible tests without submitting
 */
export async function runTests(request) {
    return axios.post("/api/ide/test", request);
}
/**
 * Get submission details
 */
export async function getSubmission(submissionId) {
    return axios.get(`/api/ide/submissions/${submissionId}`);
}
/**
 * List user submissions for a lesson
 */
export async function listSubmissions(lessonId) {
    return axios.get(`/api/ide/submissions`, {
        params: { lessonId },
    });
}
/**
 * Get code template for a lesson
 */
export async function getTemplate(lessonId, language) {
    return axios.get(`/api/ide/templates/${lessonId}/${language}`);
}
/**
 * Get all code templates for a lesson (all languages)
 */
export async function getTemplates(lessonId) {
    return axios.get(`/api/ide/templates/${lessonId}`);
}
/**
 * Connect to execution stream WebSocket
 */
export function connectExecutionStream(executionId, onMessage) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_IDE_SERVICE_URL || "localhost:4003";
    const ws = new WebSocket(`${protocol}//${host}/ws/execution?executionId=${executionId}`);
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            onMessage(message);
        }
        catch (error) {
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
export function connectKeystrokeStream(sessionId, userId) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_IDE_SERVICE_URL || "localhost:4003";
    const ws = new WebSocket(`${protocol}//${host}/ws/keystrokes`);
    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "init",
            sessionId,
            userId,
        }));
    };
    return ws;
}
/**
 * Send keystroke event
 */
export function sendKeystroke(ws, keystroke) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "keystroke",
            timestamp: Date.now(),
            ...keystroke,
        }));
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
