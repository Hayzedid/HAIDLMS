import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { learningHealthApi, } from '../../api/learning-health.api';
export const StudentHealthDashboard = ({ userId, courseId }) => {
    const [healthData, setHealthData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        loadHealthData();
    }, [userId, courseId]);
    const loadHealthData = async () => {
        try {
            setIsLoading(true);
            const data = await learningHealthApi.getUserHealthScore(userId, courseId);
            setHealthData(data);
        }
        catch (err) {
            setError(err.message || 'Failed to load health data');
        }
        finally {
            setIsLoading(false);
        }
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getScoreGradient = (score) => {
        if (score >= 80)
            return 'from-green-500 to-emerald-500';
        if (score >= 60)
            return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };
    const getRiskBadge = (riskLevel) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800',
        };
        return colors[riskLevel] || colors.low;
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "p-6 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error }));
    }
    if (!healthData) {
        return (_jsx("div", { className: "p-6 bg-gray-50 rounded-lg text-gray-600", children: "No health data available yet." }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow-lg p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-4", children: "Your Learning Health Score" }), _jsx("div", { className: `text-7xl font-bold mb-4 bg-gradient-to-r ${getScoreGradient(healthData.overallScore)} bg-clip-text text-transparent`, children: healthData.overallScore.toFixed(0) }), _jsxs("div", { className: "flex items-center justify-center space-x-4", children: [_jsxs("span", { className: `px-4 py-2 rounded-full text-sm font-semibold ${getRiskBadge(healthData.riskLevel)}`, children: ["Risk Level: ", healthData.riskLevel.toUpperCase()] }), healthData.interventionRecommended && (_jsx("span", { className: "px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold", children: "\uD83D\uDCDA Support Available" }))] }), _jsxs("p", { className: "text-sm text-gray-500 mt-4", children: ["Last updated: ", new Date(healthData.lastCalculated).toLocaleString()] })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800 mb-4", children: "Health Components" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: healthData.components.map((component) => (_jsxs("div", { className: `p-4 rounded-lg border-2 ${component.status === 'healthy'
                                ? 'border-green-200 bg-green-50'
                                : component.status === 'warning'
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : 'border-red-200 bg-red-50'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-semibold text-gray-800", children: component.name }), _jsx("span", { className: `text-2xl font-bold ${getScoreColor(component.score)}`, children: component.score.toFixed(0) })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mb-2", children: _jsx("div", { className: `h-2 rounded-full ${component.status === 'healthy'
                                            ? 'bg-green-600'
                                            : component.status === 'warning'
                                                ? 'bg-yellow-600'
                                                : 'bg-red-600'}`, style: { width: `${component.score}%` } }) }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: ["Weight: ", (component.weight * 100).toFixed(0), "%"] }), _jsxs("p", { className: "mt-1 text-xs", children: ["Status:", ' ', _jsx("span", { className: component.status === 'healthy'
                                                        ? 'text-green-700 font-semibold'
                                                        : component.status === 'warning'
                                                            ? 'text-yellow-700 font-semibold'
                                                            : 'text-red-700 font-semibold', children: component.status.toUpperCase() })] })] }), component.details && Object.keys(component.details).length > 0 && (_jsx("div", { className: "mt-3 pt-3 border-t border-gray-300", children: _jsxs("details", { className: "text-xs text-gray-600", children: [_jsx("summary", { className: "cursor-pointer font-semibold hover:text-gray-800", children: "View Details" }), _jsx("div", { className: "mt-2 space-y-1", children: Object.entries(component.details).map(([key, value]) => (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "capitalize", children: [key.replace(/_/g, ' '), ":"] }), _jsx("span", { className: "font-medium", children: String(value) })] }, key))) })] }) }))] }, component.name))) })] }), healthData.interventionRecommended && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-blue-900 mb-3", children: "\uD83D\uDCDA Recommended Actions" }), _jsx("p", { className: "text-blue-800 mb-4", children: "Based on your health score, we recommend focusing on the following areas:" }), _jsx("ul", { className: "space-y-2", children: healthData.components
                            .filter(c => c.status !== 'healthy')
                            .map((component, idx) => (_jsxs("li", { className: "flex items-start", children: [_jsx("span", { className: "text-blue-600 mr-2", children: "\u2022" }), _jsxs("span", { className: "text-blue-900", children: [_jsxs("strong", { children: [component.name, ":"] }), " Consider reviewing this area to improve your score."] })] }, idx))) }), _jsx("div", { className: "mt-4 p-3 bg-white rounded border border-blue-300", children: _jsxs("p", { className: "text-sm text-blue-900", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Tip:" }), " Contact your instructor if you need additional support or guidance."] }) })] })), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: "\u2139\uFE0F About Your Health Score" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Your Learning Health Score is a composite metric that combines multiple aspects of your learning journey:" }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-1", children: [_jsxs("li", { children: [_jsx("strong", { children: "Video Accountability:" }), " How engaged you are with video content"] }), _jsxs("li", { children: [_jsx("strong", { children: "Spaced Repetition:" }), " Your consistency with review sessions"] }), _jsxs("li", { children: [_jsx("strong", { children: "IDE Integrity:" }), " Your coding practices and academic integrity"] }), _jsxs("li", { children: [_jsx("strong", { children: "Assessment Performance:" }), " Your quiz and test scores"] }), _jsxs("li", { children: [_jsx("strong", { children: "Peer Review:" }), " Your participation in peer code reviews"] })] }), _jsx("p", { className: "text-sm text-gray-600 mt-3", children: "A healthy score indicates you're on track for success in this course!" })] }), _jsx("button", { onClick: loadHealthData, className: "w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition", children: "\uD83D\uDD04 Refresh Health Score" })] }));
};
