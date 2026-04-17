import { useEffect, useRef } from 'react';
export function useFocusTrap(isActive = true) {
    const elementRef = useRef(null);
    useEffect(() => {
        if (!isActive || !elementRef.current)
            return;
        const element = elementRef.current;
        const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        // Focus first element when trap is activated
        firstElement?.focus();
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            }
            else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };
        element.addEventListener('keydown', handleKeyDown);
        return () => {
            element.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive]);
    return elementRef;
}
