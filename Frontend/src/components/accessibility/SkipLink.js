import { jsx as _jsx } from "react/jsx-runtime";
export const SkipLink = ({ targetId, label = 'Skip to main content', }) => {
    return (_jsx("a", { href: `#${targetId}`, className: "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:font-semibold focus:outline-none focus:ring-4 focus:ring-primary-300", children: label }));
};
