import { useEffect } from 'react';
export function useKeyboardNavigation(options) {
    const { onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, enabled = true, } = options;
    useEffect(() => {
        if (!enabled)
            return;
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'Escape':
                    onEscape?.();
                    break;
                case 'Enter':
                    onEnter?.();
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    onArrowUp?.();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    onArrowDown?.();
                    break;
                case 'ArrowLeft':
                    onArrowLeft?.();
                    break;
                case 'ArrowRight':
                    onArrowRight?.();
                    break;
                case 'Tab':
                    if (!event.shiftKey) {
                        onTab?.();
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);
}
