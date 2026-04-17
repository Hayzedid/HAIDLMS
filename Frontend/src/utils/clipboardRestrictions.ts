/**
 * Clipboard Restrictions Utility
 * Blocks copy/paste operations in the IDE and logs attempts
 */

export interface ClipboardConfig {
  pasteEnabled: boolean;
  copyEnabled: boolean;
  cutEnabled: boolean;
  dragDropEnabled: boolean;
  allowPasteFromWithinIDE: boolean;
  allowCopyToSubmit: boolean;
  showWarningOnAttempt: boolean;
  warningMessage: string;
  logAllAttempts: boolean;
}

export interface ClipboardAttempt {
  attemptType: 'copy' | 'cut' | 'paste' | 'drag_drop' | 'right_click_paste';
  source: string;
  blocked: boolean;
  contentLength?: number;
  timestamp: Date;
}

export class ClipboardRestrictionManager {
  private config: ClipboardConfig;
  private sessionId: string;
  private userId: string;
  private onAttemptLogged?: (attempt: ClipboardAttempt) => void;
  private internalClipboard: string = ''; // Internal clipboard for within-IDE copy/paste

  constructor(
    config: ClipboardConfig,
    sessionId: string,
    userId: string,
    onAttemptLogged?: (attempt: ClipboardAttempt) => void
  ) {
    this.config = config;
    this.sessionId = sessionId;
    this.userId = userId;
    this.onAttemptLogged = onAttemptLogged;
  }

  /**
   * Initialize clipboard restrictions on an editor element
   */
  initializeRestrictions(editorElement: HTMLElement): () => void {
    const listeners: Array<{ element: any; event: string; handler: any }> = [];

    // ====================================================================
    // Keyboard Shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, Cmd+C, Cmd+V, Cmd+X)
    // ====================================================================
    const keydownHandler = (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
      const isCut = (e.ctrlKey || e.metaKey) && e.key === 'x';

      if (isCopy) {
        this.handleCopyAttempt(e, 'keyboard_shortcut');
      } else if (isPaste) {
        this.handlePasteAttempt(e, 'keyboard_shortcut');
      } else if (isCut) {
        this.handleCutAttempt(e, 'keyboard_shortcut');
      }
    };

    editorElement.addEventListener('keydown', keydownHandler);
    listeners.push({ element: editorElement, event: 'keydown', handler: keydownHandler });

    // ====================================================================
    // Context Menu (Right-Click)
    // ====================================================================
    const contextMenuHandler = (e: MouseEvent) => {
      e.preventDefault();

      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;

      // Show custom context menu or warning
      if (this.config.showWarningOnAttempt) {
        this.showWarning('Right-click menu is disabled for this assessment.');
      }

      // Log attempt
      this.logAttempt({
        attemptType: 'right_click_paste',
        source: 'context_menu',
        blocked: true,
        timestamp: new Date(),
      });
    };

    editorElement.addEventListener('contextmenu', contextMenuHandler);
    listeners.push({ element: editorElement, event: 'contextmenu', handler: contextMenuHandler });

    // ====================================================================
    // Clipboard API Events
    // ====================================================================
    const copyHandler = (e: ClipboardEvent) => {
      this.handleCopyAttempt(e, 'clipboard_api');
    };

    const pasteHandler = (e: ClipboardEvent) => {
      this.handlePasteAttempt(e, 'clipboard_api');
    };

    const cutHandler = (e: ClipboardEvent) => {
      this.handleCutAttempt(e, 'clipboard_api');
    };

    editorElement.addEventListener('copy', copyHandler);
    editorElement.addEventListener('paste', pasteHandler);
    editorElement.addEventListener('cut', cutHandler);

    listeners.push({ element: editorElement, event: 'copy', handler: copyHandler });
    listeners.push({ element: editorElement, event: 'paste', handler: pasteHandler });
    listeners.push({ element: editorElement, event: 'cut', handler: cutHandler });

    // ====================================================================
    // Drag & Drop
    // ====================================================================
    if (!this.config.dragDropEnabled) {
      const dropHandler = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.config.showWarningOnAttempt) {
          this.showWarning('Drag and drop is disabled for this assessment.');
        }

        this.logAttempt({
          attemptType: 'drag_drop',
          source: 'drag_drop',
          blocked: true,
          timestamp: new Date(),
        });
      };

      const dragOverHandler = (e: DragEvent) => {
        e.preventDefault(); // Prevent default to allow drop
      };

      editorElement.addEventListener('drop', dropHandler);
      editorElement.addEventListener('dragover', dragOverHandler);

      listeners.push({ element: editorElement, event: 'drop', handler: dropHandler });
      listeners.push({ element: editorElement, event: 'dragover', handler: dragOverHandler });
    }

    // ====================================================================
    // CSP Meta Tag (if not already set by server)
    // ====================================================================
    this.enforceCSP();

    // Return cleanup function
    return () => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    };
  }

  /**
   * Handle copy attempts
   */
  private handleCopyAttempt(e: Event, source: string): void {
    if (!this.config.copyEnabled) {
      e.preventDefault();
      e.stopPropagation();

      if (this.config.showWarningOnAttempt) {
        this.showWarning(this.config.warningMessage || 'Copy is disabled for this assessment.');
      }

      this.logAttempt({
        attemptType: 'copy',
        source,
        blocked: true,
        timestamp: new Date(),
      });
    } else if (this.config.allowPasteFromWithinIDE) {
      // Allow copy to internal clipboard
      const selection = window.getSelection();
      if (selection) {
        this.internalClipboard = selection.toString();
      }

      // Still block system clipboard
      e.preventDefault();

      this.logAttempt({
        attemptType: 'copy',
        source,
        blocked: false,
        contentLength: this.internalClipboard.length,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle paste attempts
   */
  private handlePasteAttempt(e: Event, source: string): void {
    e.preventDefault();
    e.stopPropagation();

    if (!this.config.pasteEnabled) {
      if (this.config.allowPasteFromWithinIDE && this.internalClipboard) {
        // Allow paste from internal clipboard
        this.insertTextAtCursor(this.internalClipboard);

        this.logAttempt({
          attemptType: 'paste',
          source: 'internal_clipboard',
          blocked: false,
          contentLength: this.internalClipboard.length,
          timestamp: new Date(),
        });
      } else {
        if (this.config.showWarningOnAttempt) {
          this.showWarning(this.config.warningMessage || 'Paste is disabled for this assessment.');
        }

        this.logAttempt({
          attemptType: 'paste',
          source,
          blocked: true,
          timestamp: new Date(),
        });
      }
    } else {
      // Paste enabled - allow but log
      const clipboardData = (e as ClipboardEvent).clipboardData;
      const pastedText = clipboardData?.getData('text') || '';

      this.logAttempt({
        attemptType: 'paste',
        source,
        blocked: false,
        contentLength: pastedText.length,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle cut attempts
   */
  private handleCutAttempt(e: Event, source: string): void {
    if (!this.config.cutEnabled) {
      e.preventDefault();
      e.stopPropagation();

      if (this.config.showWarningOnAttempt) {
        this.showWarning('Cut is disabled for this assessment.');
      }

      this.logAttempt({
        attemptType: 'cut',
        source,
        blocked: true,
        timestamp: new Date(),
      });
    } else {
      // Allow cut but log
      const selection = window.getSelection();
      const cutText = selection?.toString() || '';

      this.logAttempt({
        attemptType: 'cut',
        source,
        blocked: false,
        contentLength: cutText.length,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Enforce Content Security Policy to block Clipboard API
   */
  private enforceCSP(): void {
    // Check if CSP meta tag already exists
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    if (!existingCSP && !this.config.pasteEnabled) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "clipboard-read 'none'; clipboard-write 'none'";
      document.head.appendChild(meta);
    }
  }

  /**
   * Insert text at cursor position (for internal clipboard)
   */
  private insertTextAtCursor(text: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));

    // Move cursor to end of inserted text
    range.setStartAfter(range.endContainer);
    range.setEndAfter(range.endContainer);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Show warning message to user
   */
  private showWarning(message: string): void {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ef4444;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: sans-serif;
      font-size: 14px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = `⚠️ ${message}`;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease-out';
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /**
   * Log clipboard attempt
   */
  private logAttempt(attempt: ClipboardAttempt): void {
    if (this.config.logAllAttempts && this.onAttemptLogged) {
      this.onAttemptLogged(attempt);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[ClipboardRestriction]', attempt);
    }
  }

  /**
   * Get internal clipboard (for within-IDE copy/paste)
   */
  getInternalClipboard(): string {
    return this.internalClipboard;
  }

  /**
   * Set internal clipboard
   */
  setInternalClipboard(text: string): void {
    this.internalClipboard = text;
  }

  /**
   * Clear internal clipboard
   */
  clearInternalClipboard(): void {
    this.internalClipboard = '';
  }
}

/**
 * React Hook for Clipboard Restrictions
 */
export function useClipboardRestrictions(
  config: ClipboardConfig,
  sessionId: string,
  userId: string,
  onAttemptLogged?: (attempt: ClipboardAttempt) => void
): {
  manager: ClipboardRestrictionManager;
  initializeRestrictions: (element: HTMLElement) => () => void;
} {
  const manager = new ClipboardRestrictionManager(config, sessionId, userId, onAttemptLogged);

  return {
    manager,
    initializeRestrictions: (element: HTMLElement) => manager.initializeRestrictions(element),
  };
}

/**
 * Default restricted configuration
 */
export const RESTRICTED_CONFIG: ClipboardConfig = {
  pasteEnabled: false,
  copyEnabled: false,
  cutEnabled: false,
  dragDropEnabled: false,
  allowPasteFromWithinIDE: true,
  allowCopyToSubmit: false,
  showWarningOnAttempt: true,
  warningMessage: 'Copy/paste is disabled for this assessment. Type your code manually.',
  logAllAttempts: true,
};

/**
 * Permissive configuration (for non-restricted sessions)
 */
export const PERMISSIVE_CONFIG: ClipboardConfig = {
  pasteEnabled: true,
  copyEnabled: true,
  cutEnabled: true,
  dragDropEnabled: true,
  allowPasteFromWithinIDE: true,
  allowCopyToSubmit: true,
  showWarningOnAttempt: false,
  warningMessage: '',
  logAllAttempts: false,
};
