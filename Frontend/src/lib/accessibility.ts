/**
 * Accessibility Utilities for WCAG AA Compliance
 */

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Checks if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

  if (focusableTags.includes(tagName)) {
    return !element.hasAttribute('disabled');
  }

  return element.hasAttribute('tabindex');
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Checks if color contrast meets WCAG AA standards
 * Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if contrast meets WCAG AA standards
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minimumRatio = isLargeText ? 3 : 4.5;
  return ratio >= minimumRatio;
}

/**
 * Generates a unique ID for accessibility labels
 */
let idCounter = 0;
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Creates skip to content link
 */
export function createSkipLink(targetId: string, label: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg';
  skipLink.textContent = label;

  return skipLink;
}

/**
 * Manages focus restoration after modal close
 */
export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;

  saveFocus() {
    this.previousActiveElement = document.activeElement as HTMLElement;
  }

  restoreFocus() {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }
}

/**
 * Adds keyboard navigation to a list
 */
export function addKeyboardListNavigation(
  listElement: HTMLElement,
  onSelect?: (index: number) => void
) {
  const items = getFocusableElements(listElement);
  let currentIndex = 0;

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex]?.focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items[currentIndex]?.focus();
        break;

      case 'Home':
        event.preventDefault();
        currentIndex = 0;
        items[currentIndex]?.focus();
        break;

      case 'End':
        event.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex]?.focus();
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(currentIndex);
        break;
    }
  };

  listElement.addEventListener('keydown', handleKeyDown);

  return () => {
    listElement.removeEventListener('keydown', handleKeyDown);
  };
}
