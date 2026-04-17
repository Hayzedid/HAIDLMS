/**
 * Browser Lockdown Utility
 * Prevents cheating during proctored exams by restricting browser actions
 */
export class BrowserLockdown {
    config;
    isLocked = false;
    listeners = [];
    visibilityHandler;
    fullscreenHandler;
    constructor(config = {}) {
        this.config = {
            blockContextMenu: true,
            blockKeyboardShortcuts: true,
            blockCopyPaste: true,
            blockPrint: true,
            blockDevTools: true,
            requireFullscreen: true,
            blockTabSwitch: true,
            ...config,
        };
    }
    /**
     * Activate browser lockdown
     */
    activate() {
        if (this.isLocked) {
            console.warn("[Lockdown] Already activated");
            return false;
        }
        try {
            // Enter fullscreen if required
            if (this.config.requireFullscreen) {
                this.enterFullscreen();
            }
            // Block context menu
            if (this.config.blockContextMenu) {
                this.blockContextMenu();
            }
            // Block keyboard shortcuts
            if (this.config.blockKeyboardShortcuts) {
                this.blockKeyboardShortcuts();
            }
            // Block copy/paste
            if (this.config.blockCopyPaste) {
                this.blockCopyPaste();
            }
            // Block print
            if (this.config.blockPrint) {
                this.blockPrint();
            }
            // Monitor tab visibility
            if (this.config.blockTabSwitch) {
                this.monitorTabVisibility();
            }
            // Monitor fullscreen exit
            if (this.config.requireFullscreen) {
                this.monitorFullscreenExit();
            }
            // Block DevTools (best effort)
            if (this.config.blockDevTools) {
                this.detectDevTools();
            }
            this.isLocked = true;
            console.log("[Lockdown] Activated successfully");
            return true;
        }
        catch (error) {
            console.error("[Lockdown] Activation failed:", error);
            return false;
        }
    }
    /**
     * Deactivate browser lockdown
     */
    deactivate() {
        if (!this.isLocked) {
            console.warn("[Lockdown] Not currently active");
            return;
        }
        // Remove all event listeners
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
        // Remove visibility handler
        if (this.visibilityHandler) {
            document.removeEventListener("visibilitychange", this.visibilityHandler);
            this.visibilityHandler = undefined;
        }
        // Remove fullscreen handler
        if (this.fullscreenHandler) {
            document.removeEventListener("fullscreenchange", this.fullscreenHandler);
            this.fullscreenHandler = undefined;
        }
        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((error) => {
                console.error("[Lockdown] Failed to exit fullscreen:", error);
            });
        }
        this.isLocked = false;
        console.log("[Lockdown] Deactivated successfully");
    }
    /**
     * Check if lockdown is active
     */
    isActive() {
        return this.isLocked;
    }
    // Private methods
    enterFullscreen() {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().catch((error) => {
                console.error("[Lockdown] Fullscreen request failed:", error);
                this.reportViolation("fullscreen_denied");
            });
        }
        else {
            console.warn("[Lockdown] Fullscreen API not supported");
        }
    }
    blockContextMenu() {
        const handler = (e) => {
            e.preventDefault();
            this.reportViolation("context_menu_blocked");
            return false;
        };
        document.addEventListener("contextmenu", handler);
        this.listeners.push({ element: document, event: "contextmenu", handler });
    }
    blockKeyboardShortcuts() {
        const handler = (e) => {
            const blockedKeys = [
                "F12", // DevTools
                "I", // Inspect Element (Ctrl+Shift+I)
                "J", // Console (Ctrl+Shift+J)
                "C", // Console (Ctrl+Shift+C)
                "U", // View Source (Ctrl+U)
                "S", // Save Page (Ctrl+S)
                "P", // Print (Ctrl+P)
                "F", // Find (Ctrl+F)
                "Tab", // Window switching (Alt+Tab partially blocked)
            ];
            // Block F12
            if (e.key === "F12") {
                e.preventDefault();
                this.reportViolation("devtools_shortcut_blocked");
                return false;
            }
            // Block Ctrl+Shift+I/J/C (DevTools)
            if (e.ctrlKey &&
                e.shiftKey &&
                ["I", "J", "C"].includes(e.key.toUpperCase())) {
                e.preventDefault();
                this.reportViolation("devtools_shortcut_blocked");
                return false;
            }
            // Block Ctrl+U (View Source)
            if (e.ctrlKey && e.key.toUpperCase() === "U") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
            // Block Ctrl+S (Save)
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
            // Block Ctrl+P (Print)
            if (e.ctrlKey && e.key.toUpperCase() === "P") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
            // Block Ctrl+F (Find)
            if (e.ctrlKey && e.key.toUpperCase() === "F") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
            // Block Alt+Tab (partial - browser limitations)
            if (e.altKey && e.key === "Tab") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
            // Block Ctrl+Tab (browser tab switching)
            if (e.ctrlKey && e.key === "Tab") {
                e.preventDefault();
                this.reportViolation("keyboard_shortcut_blocked");
                return false;
            }
        };
        document.addEventListener("keydown", handler);
        this.listeners.push({ element: document, event: "keydown", handler });
    }
    blockCopyPaste() {
        const copyHandler = (e) => {
            e.preventDefault();
            this.reportViolation("copy_blocked");
            return false;
        };
        const pasteHandler = (e) => {
            e.preventDefault();
            this.reportViolation("paste_blocked");
            return false;
        };
        const cutHandler = (e) => {
            e.preventDefault();
            this.reportViolation("cut_blocked");
            return false;
        };
        document.addEventListener("copy", copyHandler);
        document.addEventListener("paste", pasteHandler);
        document.addEventListener("cut", cutHandler);
        this.listeners.push({
            element: document,
            event: "copy",
            handler: copyHandler,
        });
        this.listeners.push({
            element: document,
            event: "paste",
            handler: pasteHandler,
        });
        this.listeners.push({
            element: document,
            event: "cut",
            handler: cutHandler,
        });
    }
    blockPrint() {
        const handler = () => {
            this.reportViolation("print_blocked");
        };
        window.addEventListener("beforeprint", handler);
        this.listeners.push({ element: window, event: "beforeprint", handler });
        // Override window.print
        const originalPrint = window.print;
        window.print = () => {
            this.reportViolation("print_blocked");
            // Don't call original print
        };
    }
    monitorTabVisibility() {
        this.visibilityHandler = () => {
            if (document.hidden) {
                this.reportViolation("tab_hidden");
            }
            else {
                this.reportViolation("tab_visible");
            }
        };
        document.addEventListener("visibilitychange", this.visibilityHandler);
    }
    monitorFullscreenExit() {
        this.fullscreenHandler = () => {
            if (!document.fullscreenElement) {
                this.reportViolation("fullscreen_exit");
                // Try to re-enter fullscreen
                setTimeout(() => {
                    if (this.isLocked && this.config.requireFullscreen) {
                        this.enterFullscreen();
                    }
                }, 100);
            }
        };
        document.addEventListener("fullscreenchange", this.fullscreenHandler);
    }
    detectDevTools() {
        // DevTools detection is imperfect but can detect some cases
        const threshold = 160;
        let isOpen = false;
        const check = () => {
            if (!this.isLocked)
                return;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            if (widthThreshold || heightThreshold) {
                if (!isOpen) {
                    isOpen = true;
                    this.reportViolation("devtools_opened");
                }
            }
            else {
                if (isOpen) {
                    isOpen = false;
                }
            }
        };
        // Check periodically
        const interval = setInterval(check, 1000);
        // Store interval for cleanup
        this.devToolsInterval = interval;
    }
    reportViolation(violation) {
        console.warn(`[Lockdown] Violation: ${violation}`);
        if (this.config.onViolation) {
            this.config.onViolation(violation);
        }
    }
    /**
     * Cleanup on destroy
     */
    destroy() {
        this.deactivate();
        // Clear DevTools interval
        if (this.devToolsInterval) {
            clearInterval(this.devToolsInterval);
            this.devToolsInterval = null;
        }
    }
}
/**
 * Create and activate browser lockdown
 */
export function activateBrowserLockdown(config) {
    const lockdown = new BrowserLockdown(config);
    lockdown.activate();
    return lockdown;
}
/**
 * Check if browser supports required features
 */
export function checkBrowserCompatibility() {
    const hasFullscreen = typeof document.documentElement.requestFullscreen !== "undefined";
    const hasVisibility = typeof document.hidden !== "undefined";
    return {
        fullscreen: hasFullscreen,
        visibility: hasVisibility,
        supported: hasFullscreen && hasVisibility,
    };
}
