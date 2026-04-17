import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { clipboardKeystrokeApi, } from "../../api/clipboard-keystroke.api";
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Clock, } from "lucide-react";
export const PatternAnalysisView = ({ userId, sessionId }) => {
    const [baseline, setBaseline] = useState(null);
    const [deviations, setDeviations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        loadData();
    }, [userId, sessionId]);
    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [baselineData, deviationsData] = await Promise.all([
                clipboardKeystrokeApi.getTypingBaseline(userId),
                clipboardKeystrokeApi.getPatternDeviations(userId),
            ]);
            setBaseline(baselineData);
            setDeviations(deviationsData);
        }
        catch (err) {
            setError(err.message || "Failed to load pattern analysis");
        }
        finally {
            setLoading(false);
        }
    };
    const getSeverityColor = (severity) => {
        const colors = {
            low: "text-blue-600 bg-blue-100",
            medium: "text-yellow-600 bg-yellow-100",
            high: "text-orange-600 bg-orange-100",
            critical: "text-red-600 bg-red-100",
        };
        return colors[severity] || colors.low;
    };
    const getSeverityIcon = (severity) => {
        if (severity === "critical" || severity === "high") {
            return _jsx(AlertTriangle, { className: "w-5 h-5" });
        }
        return _jsx(Activity, { className: "w-5 h-5" });
    };
    const getDeviationIndicator = (percentage) => {
        if (Math.abs(percentage) < 10) {
            return { icon: CheckCircle, color: "text-green-600", label: "Normal" };
        }
        else if (Math.abs(percentage) < 25) {
            return {
                icon: TrendingUp,
                color: "text-yellow-600",
                label: "Minor Deviation",
            };
        }
        else {
            return {
                icon: AlertTriangle,
                color: "text-red-600",
                label: "Significant Deviation",
            };
        }
    };
    const getConsistencyStatus = (score) => {
        if (score >= 80)
            return {
                label: "Excellent",
                color: "text-green-600",
                bg: "bg-green-100",
            };
        if (score >= 60)
            return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
        if (score >= 40)
            return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
        return { label: "Poor", color: "text-red-600", bg: "bg-red-100" };
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Typing Pattern Analysis" }), _jsx("p", { className: "text-gray-600", children: "Baseline patterns and deviations for student coding behavior" })] }), baseline && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Baseline Typing Pattern" }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Last updated:", " ", baseline.lastCalculatedAt
                                        ? new Date(baseline.lastCalculatedAt).toLocaleDateString()
                                        : "N/A"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-indigo-900", children: "Typing Speed" }), _jsx(Activity, { className: "w-5 h-5 text-indigo-600" })] }), _jsx("p", { className: "text-3xl font-bold text-indigo-900", children: baseline.avgTypingSpeedWPM }), _jsx("p", { className: "text-sm text-indigo-700 mt-1", children: "words per minute" })] }), _jsxs("div", { className: `p-4 bg-gradient-to-br rounded-lg border ${getConsistencyStatus(baseline.consistencyScore || 0).bg} border-current`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: `text-sm font-medium ${getConsistencyStatus(baseline.consistencyScore || 0).color}`, children: "Consistency" }), _jsx(CheckCircle, { className: `w-5 h-5 ${getConsistencyStatus(baseline.consistencyScore || 0).color}` })] }), _jsx("p", { className: `text-3xl font-bold ${getConsistencyStatus(baseline.consistencyScore || 0).color}`, children: baseline.consistencyScore || 0 }), _jsx("p", { className: `text-sm mt-1 ${getConsistencyStatus(baseline.consistencyScore || 0).color}`, children: getConsistencyStatus(baseline.consistencyScore || 0).label })] }), _jsxs("div", { className: "p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-purple-900", children: "Avg Burst Size" }), _jsx(TrendingUp, { className: "w-5 h-5 text-purple-600" })] }), _jsx("p", { className: "text-3xl font-bold text-purple-900", children: (baseline.avgKeystrokesPerBurst || 0).toFixed(0) }), _jsx("p", { className: "text-sm text-purple-700 mt-1", children: "keystrokes/burst" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Common Pause Patterns" }), _jsx("p", { className: "text-sm text-gray-600", children: baseline.commonPausePatterns ||
                                            "No significant patterns detected" })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("h4", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Preferred Key Combinations" }), _jsx("p", { className: "text-sm text-gray-600", children: baseline.preferredKeyCombinations ||
                                            "No specific preferences detected" })] })] })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-800", children: ["Pattern Deviations", " ", deviations.length > 0 && `(${deviations.length})`] }), deviations.length === 0 && (_jsxs("span", { className: "flex items-center gap-2 text-green-600 text-sm font-medium", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "No deviations detected"] }))] }), deviations.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-green-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "This session matches the student's typical typing patterns." })] })) : (_jsx("div", { className: "space-y-3", children: deviations.map((deviation, idx) => {
                            const indicator = getDeviationIndicator(deviation.deviationPercentage);
                            const Icon = indicator.icon;
                            return (_jsx("div", { className: `p-4 rounded-lg border-2 ${deviation.severity === "critical" ||
                                    deviation.severity === "high"
                                    ? "border-red-200 bg-red-50"
                                    : deviation.severity === "medium"
                                        ? "border-yellow-200 bg-yellow-50"
                                        : "border-blue-200 bg-blue-50"}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(deviation.severity)}`, children: deviation.severity.toUpperCase() }), _jsx("h4", { className: "font-semibold text-gray-800", children: deviation.deviationType
                                                                .replace(/_/g, " ")
                                                                .toUpperCase() }), _jsxs("div", { className: `flex items-center gap-1 ${indicator.color}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-medium", children: indicator.label })] })] }), _jsx("p", { className: "text-sm text-gray-700 mb-3", children: deviation.description }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Expected:" }), _jsx("span", { className: "ml-2 font-semibold text-gray-900", children: deviation.expectedValue.toFixed(1) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Actual:" }), _jsx("span", { className: "ml-2 font-semibold text-gray-900", children: deviation.actualValue.toFixed(1) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Deviation:" }), _jsxs("span", { className: `ml-2 font-semibold ${Math.abs(deviation.deviationPercentage) > 25
                                                                        ? "text-red-600"
                                                                        : Math.abs(deviation.deviationPercentage) > 10
                                                                            ? "text-yellow-600"
                                                                            : "text-green-600"}`, children: [deviation.deviationPercentage > 0 ? "+" : "", deviation.deviationPercentage.toFixed(1), "%"] })] })] }), _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center gap-2 h-6", children: [_jsx("span", { className: "text-xs text-gray-500 w-16", children: "Expected" }), _jsx("div", { className: "flex-1 bg-gray-200 rounded-full h-full flex items-center", children: _jsx("div", { className: "bg-gray-400 rounded-full h-full", style: { width: "50%" } }) })] }), _jsxs("div", { className: "flex items-center gap-2 h-6 mt-1", children: [_jsx("span", { className: "text-xs text-gray-500 w-16", children: "Actual" }), _jsx("div", { className: "flex-1 bg-gray-200 rounded-full h-full flex items-center", children: _jsx("div", { className: `rounded-full h-full ${Math.abs(deviation.deviationPercentage) > 25
                                                                            ? "bg-red-600"
                                                                            : Math.abs(deviation.deviationPercentage) > 10
                                                                                ? "bg-yellow-600"
                                                                                : "bg-green-600"}`, style: {
                                                                            width: `${Math.min(100, (deviation.actualValue / deviation.expectedValue) * 50)}%`,
                                                                        } }) })] })] })] }), _jsx("div", { className: "ml-4", children: getSeverityIcon(deviation.severity) })] }) }, idx));
                        }) }))] }), _jsxs("div", { className: "bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5" }), "Interpretation Guide"] }), _jsxs("div", { className: "space-y-2 text-sm text-indigo-800", children: [_jsxs("p", { children: [_jsx("strong", { children: "Typing Speed Deviations:" }), " Significant increases may indicate code pasting or AI-generated code insertion."] }), _jsxs("p", { children: [_jsx("strong", { children: "Consistency Drops:" }), " Irregular patterns could suggest external assistance or distraction."] }), _jsxs("p", { children: [_jsx("strong", { children: "Burst Pattern Changes:" }), " Unusual burst sizes often correlate with clipboard usage or copying from external sources."] }), _jsxs("p", { children: [_jsx("strong", { children: "Normal Range:" }), " \u00B110% deviation is typical. \u00B125%+ warrants closer review."] })] })] })] }));
};
