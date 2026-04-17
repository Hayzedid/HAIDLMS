import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Hides content visually but keeps it accessible to screen readers
 */
export const VisuallyHidden = ({ children, focusable = false, }) => {
    return (_jsx("span", { className: focusable ? 'sr-only-focusable' : 'sr-only', children: children }));
};
