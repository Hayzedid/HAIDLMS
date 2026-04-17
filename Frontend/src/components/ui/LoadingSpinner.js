import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader } from "lucide-react";
export const LoadingSpinner = ({ size = "md", fullScreen = false, message, }) => {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-12 h-12",
        lg: "w-16 h-16",
    };
    const content = (_jsxs("div", { className: "flex flex-col items-center justify-center gap-2", children: [_jsx(Loader, { className: `${sizeClasses[size]} animate-spin text-blue-600` }), message && _jsx("p", { className: "text-gray-600 text-sm mt-2", children: message })] }));
    if (fullScreen) {
        return (_jsx("div", { className: "fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50", children: content }));
    }
    return content;
};
export default LoadingSpinner;
