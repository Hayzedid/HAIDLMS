import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ProgressBar = ({ value, max = 100, label, color = "blue", showPercentage = true, animated = true, }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const colors = {
        blue: "bg-blue-600",
        green: "bg-green-600",
        red: "bg-red-600",
        yellow: "bg-yellow-600",
        purple: "bg-purple-600",
    };
    return (_jsxs("div", { className: "w-full", children: [label && (_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: label }), showPercentage && (_jsxs("span", { className: "text-sm font-semibold text-gray-900", children: [Math.round(percentage), "%"] }))] })), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: `h-full ${colors[color]} ${animated ? "transition-all duration-300" : ""}`, style: { width: `${percentage}%` } }) })] }));
};
export default ProgressBar;
