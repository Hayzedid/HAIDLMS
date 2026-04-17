import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
/**
 * ARIA live region for announcing dynamic content changes to screen readers
 */
export const LiveRegion = ({ message, priority = 'polite', clearAfter, className, }) => {
    const [currentMessage, setCurrentMessage] = React.useState(message);
    const timeoutRef = useRef();
    useEffect(() => {
        setCurrentMessage(message);
        if (clearAfter) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                setCurrentMessage('');
            }, clearAfter);
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [message, clearAfter]);
    return (_jsx("div", { role: "status", "aria-live": priority, "aria-atomic": "true", className: cn('sr-only', className), children: currentMessage }));
};
