/**
 * Keystroke Recording Utility
 * Records all keystrokes for session replay and pattern analysis
 */
export class KeystrokeRecorder {
    sessionId;
    userId;
    startTime;
    events = [];
    lastKeystrokeTime = 0;
    keyIntervals = [];
    isRecording = false;
    onBatchReady;
    batchSize = 50; // Send to server every 50 events
    recordAllKeys = false; // Only record typing events by default
    constructor(sessionId, userId, recordAllKeys = false, onBatchReady) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.recordAllKeys = recordAllKeys;
        this.onBatchReady = onBatchReady;
        this.startTime = Date.now();
    }
    /**
     * Start recording keystrokes
     */
    startRecording(editorElement) {
        this.isRecording = true;
        this.startTime = Date.now();
        const listeners = [];
        // ====================================================================
        // Keydown Events
        // ====================================================================
        const keydownHandler = (e) => {
            if (!this.isRecording)
                return;
            const now = Date.now();
            const timestampMs = now - this.startTime;
            // Calculate interval
            if (this.lastKeystrokeTime > 0) {
                const interval = now - this.lastKeystrokeTime;
                this.keyIntervals.push(interval);
            }
            this.lastKeystrokeTime = now;
            // Detect modifiers
            const modifiers = [];
            if (e.ctrlKey)
                modifiers.push("ctrl");
            if (e.shiftKey)
                modifiers.push("shift");
            if (e.altKey)
                modifiers.push("alt");
            if (e.metaKey)
                modifiers.push("meta");
            // Detect special keys
            const specialKeys = [
                "Control",
                "Shift",
                "Alt",
                "Meta",
                "CapsLock",
                "Tab",
                "Escape",
                "F1",
                "F2",
                "F3",
                "F4",
                "F5",
                "F6",
                "F7",
                "F8",
                "F9",
                "F10",
                "F11",
                "F12",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "PageUp",
                "PageDown",
                "Home",
                "End",
                "Insert",
            ];
            const isSpecialKey = specialKeys.includes(e.key);
            // Skip special keys unless recordAllKeys is true
            if (isSpecialKey && !this.recordAllKeys) {
                return;
            }
            // Get cursor position
            const selection = window.getSelection();
            const cursorPosition = selection?.anchorOffset;
            const range = selection?.getRangeAt(0);
            const selectionStart = range?.startOffset;
            const selectionEnd = range?.endOffset;
            // Determine what character was inserted
            let charInserted;
            let charsDeleted;
            if (e.key === "Backspace" || e.key === "Delete") {
                // Detect deleted characters
                const selectedText = selection?.toString();
                if (selectedText && selectedText.length > 0) {
                    charsDeleted = selectedText;
                }
                else {
                    charsDeleted = " "; // Single character deletion
                }
            }
            else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                // Regular character
                charInserted = e.key;
            }
            else if (e.key === "Enter") {
                charInserted = "\n";
            }
            else if (e.key === "Tab") {
                charInserted = "\t";
            }
            // Record event
            const event = {
                timestampMs,
                eventType: "keydown",
                keyCode: e.keyCode,
                keyName: e.key,
                isSpecialKey,
                modifiers: modifiers.join(","),
                cursorPosition,
                selectionStart,
                selectionEnd,
                charInserted,
                charsDeleted,
            };
            this.events.push(event);
            // Check for suspicious burst
            this.detectSuspiciousBurst();
            // Send batch if ready
            if (this.events.length >= this.batchSize && this.onBatchReady) {
                this.onBatchReady([...this.events]);
                this.events = []; // Clear after sending
            }
        };
        editorElement.addEventListener("keydown", keydownHandler);
        listeners.push({
            element: editorElement,
            event: "keydown",
            handler: keydownHandler,
        });
        // ====================================================================
        // Paste/Cut/Copy Events
        // ====================================================================
        const clipboardHandler = (e) => {
            if (!this.isRecording)
                return;
            const now = Date.now();
            const timestampMs = now - this.startTime;
            const eventType = e.type;
            const selection = window.getSelection();
            const cursorPosition = selection?.anchorOffset;
            let charInserted;
            if (eventType === "paste") {
                const clipboardData = e.clipboardData?.getData("text");
                charInserted = clipboardData;
            }
            const event = {
                timestampMs,
                eventType,
                keyName: eventType,
                isSpecialKey: true,
                modifiers: "",
                cursorPosition,
                charInserted,
            };
            this.events.push(event);
            if (this.events.length >= this.batchSize && this.onBatchReady) {
                this.onBatchReady([...this.events]);
                this.events = [];
            }
        };
        editorElement.addEventListener("paste", clipboardHandler);
        editorElement.addEventListener("cut", clipboardHandler);
        editorElement.addEventListener("copy", clipboardHandler);
        listeners.push({
            element: editorElement,
            event: "paste",
            handler: clipboardHandler,
        });
        listeners.push({
            element: editorElement,
            event: "cut",
            handler: clipboardHandler,
        });
        listeners.push({
            element: editorElement,
            event: "copy",
            handler: clipboardHandler,
        });
        // Return cleanup function
        return () => {
            this.stopRecording();
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        };
    }
    /**
     * Stop recording
     */
    stopRecording() {
        this.isRecording = false;
        // Send remaining events
        if (this.events.length > 0 && this.onBatchReady) {
            this.onBatchReady([...this.events]);
            this.events = [];
        }
    }
    /**
     * Detect suspicious typing burst (potential paste)
     */
    detectSuspiciousBurst() {
        const recentEvents = this.events.slice(-20); // Last 20 events
        const timeSpan = recentEvents.length > 0
            ? recentEvents[recentEvents.length - 1].timestampMs -
                recentEvents[0].timestampMs
            : 0;
        // If 20+ keystrokes in less than 1 second = suspicious
        if (recentEvents.length >= 20 && timeSpan < 1000) {
            console.warn("[KeystrokeRecorder] Suspicious typing burst detected:", {
                eventCount: recentEvents.length,
                timeSpan,
            });
            return true;
        }
        return false;
    }
    /**
     * Calculate typing speed (words per minute)
     */
    getTypingSpeedWPM() {
        const totalChars = this.events.filter((e) => e.charInserted).length;
        const totalMinutes = (Date.now() - this.startTime) / 60000;
        const words = totalChars / 5; // Average word length = 5 characters
        return totalMinutes > 0 ? words / totalMinutes : 0;
    }
    /**
     * Calculate average key interval
     */
    getAvgKeyIntervalMs() {
        if (this.keyIntervals.length === 0)
            return 0;
        const sum = this.keyIntervals.reduce((a, b) => a + b, 0);
        return sum / this.keyIntervals.length;
    }
    /**
     * Count pauses (>5 seconds)
     */
    getPauseCount() {
        return this.keyIntervals.filter((interval) => interval > 5000).length;
    }
    /**
     * Get session summary
     */
    getSessionSummary() {
        const totalKeystrokes = this.events.filter((e) => !e.isSpecialKey).length;
        const totalDeletions = this.events.filter((e) => e.keyName === "Backspace" || e.keyName === "Delete").length;
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startedAt: new Date(this.startTime),
            totalKeystrokes,
            totalDeletions,
            avgTypingSpeedWPM: this.getTypingSpeedWPM(),
            avgKeyIntervalMs: this.getAvgKeyIntervalMs(),
            pauseCount: this.getPauseCount(),
            suspiciousBurst: this.detectSuspiciousBurst(),
        };
    }
    /**
     * Get all events (for export/replay)
     */
    getAllEvents() {
        return [...this.events];
    }
    /**
     * Replay session (for debugging/review)
     */
    async replaySession(events, onEvent, speedMultiplier = 1) {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const nextEvent = events[i + 1];
            onEvent(event);
            // Wait for the time interval before next event
            if (nextEvent) {
                const delay = (nextEvent.timestampMs - event.timestampMs) / speedMultiplier;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
}
/**
 * React Hook for Keystroke Recording
 */
export function useKeystrokeRecorder(sessionId, userId, recordAllKeys = false, onBatchReady) {
    const recorder = new KeystrokeRecorder(sessionId, userId, recordAllKeys, onBatchReady);
    return {
        recorder,
        startRecording: (element) => recorder.startRecording(element),
        stopRecording: () => recorder.stopRecording(),
        getSessionSummary: () => recorder.getSessionSummary(),
    };
}
/**
 * Analyze keystroke patterns for anomalies
 */
export class KeystrokePatternAnalyzer {
    /**
     * Detect typing speed anomalies
     */
    static detectSpeedAnomaly(currentSpeedWPM, baselineSpeedWPM, threshold = 1.5) {
        return currentSpeedWPM > baselineSpeedWPM * threshold;
    }
    /**
     * Detect pattern deviations
     */
    static detectPatternDeviation(currentIntervalMs, baselineIntervalMs, threshold = 0.7) {
        return currentIntervalMs < baselineIntervalMs * threshold;
    }
    /**
     * Calculate consistency score (0-100)
     */
    static calculateConsistencyScore(intervals) {
        if (intervals.length < 10)
            return 100; // Not enough data
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        // Lower standard deviation = more consistent = higher score
        const coefficientOfVariation = stdDev / mean;
        const score = Math.max(0, 100 - coefficientOfVariation * 100);
        return Math.round(score);
    }
    /**
     * Detect AI-generated code patterns in typing
     */
    static detectAICodePattern(events) {
        const reasons = [];
        let suspicionScore = 0;
        // Check for large paste events
        const pasteEvents = events.filter((e) => e.eventType === "paste" && e.charInserted && e.charInserted.length > 50);
        if (pasteEvents.length > 0) {
            suspicionScore += 30;
            reasons.push(`Detected ${pasteEvents.length} large paste event(s)`);
        }
        // Check for typing bursts
        const typingBurst = this.detectTypingBurst(events);
        if (typingBurst) {
            suspicionScore += 40;
            reasons.push("Detected suspicious typing burst");
        }
        // Check for perfect code with no corrections
        const deletionRate = events.filter((e) => e.keyName === "Backspace" || e.keyName === "Delete")
            .length / events.length;
        if (deletionRate < 0.05 && events.length > 100) {
            suspicionScore += 20;
            reasons.push("Unusually low error/correction rate");
        }
        // Check for sudden long pause followed by burst
        const intervals = [];
        for (let i = 1; i < events.length; i++) {
            intervals.push(events[i].timestampMs - events[i - 1].timestampMs);
        }
        const hasLongPauseBeforeBurst = intervals.some((interval, i) => {
            if (interval > 30000) {
                // 30 second pause
                // Check if next 20 intervals are all < 100ms (burst)
                const nextIntervals = intervals.slice(i + 1, i + 21);
                return (nextIntervals.length >= 20 && nextIntervals.every((int) => int < 100));
            }
            return false;
        });
        if (hasLongPauseBeforeBurst) {
            suspicionScore += 30;
            reasons.push("Detected long pause followed by typing burst (possible AI query + paste)");
        }
        return {
            isLikelyAI: suspicionScore >= 50,
            confidence: Math.min(suspicionScore, 100) / 100,
            reasons,
        };
    }
    /**
     * Detect typing burst
     */
    static detectTypingBurst(events) {
        for (let i = 0; i < events.length - 20; i++) {
            const window = events.slice(i, i + 20);
            const timeSpan = window[window.length - 1].timestampMs - window[0].timestampMs;
            if (timeSpan < 1000) {
                return true; // 20 keystrokes in < 1 second
            }
        }
        return false;
    }
}
