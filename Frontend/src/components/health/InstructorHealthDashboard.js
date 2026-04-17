import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { learningHealthApi, } from '../../api/learning-health.api';
export const InstructorHealthDashboard = ({ courseId }) => {
    const [summary, setSummary] = useState(null);
    const [atRiskLearners, setAtRiskLearners] = useState([]);
    const [selectedLearner, setSelectedLearner] = useState(null);
    const [nudge, setNudge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterRisk, setFilterRisk] = useState('all');
    useEffect(() => {
        loadDashboardData();
    }, [courseId]);
    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const [summaryData, learnersData] = await Promise.all([
                learningHealthApi.getDashboardSummary(courseId),
                learningHealthApi.getAtRiskLearners(courseId),
            ]);
            setSummary(summaryData);
            setAtRiskLearners(learnersData);
        }
        catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        }
        finally {
            setIsLoading(false);
        }
    };
    const generateNudge = async (learner) => {
        try {
            setSelectedLearner(learner);
            const nudgeData = await learningHealthApi.generateInstructorNudge(learner.userId, courseId);
            setNudge(nudgeData);
        }
        catch (err) {
            setError(err.message || 'Failed to generate nudge');
        }
    };
    const filteredLearners = filterRisk === 'all'
        ? atRiskLearners
        : atRiskLearners.filter(l => l.riskLevel === filterRisk);
    const getRiskColor = (riskLevel) => {
        const colors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800',
        };
        return colors[riskLevel] || colors.low;
    };
    const getRiskIcon = (riskLevel) => {
        const icons = {
            low: '✅',
            medium: '⚠️',
            high: '🔴',
            critical: '🚨',
        };
        return icons[riskLevel] || '•';
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "p-6 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error }));
    }
    if (!summary) {
        return (_jsx("div", { className: "p-6 bg-gray-50 rounded-lg text-gray-600", children: "No dashboard data available." }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Enrolled" }), _jsx("p", { className: "text-3xl font-bold text-gray-800", children: summary.totalEnrolled })] }), _jsx("div", { className: "text-4xl", children: "\uD83D\uDC65" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Healthy" }), _jsx("p", { className: "text-3xl font-bold text-green-600", children: summary.healthyCount })] }), _jsx("div", { className: "text-4xl", children: "\u2705" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "At Risk" }), _jsx("p", { className: "text-3xl font-bold text-orange-600", children: summary.atRiskCount })] }), _jsx("div", { className: "text-4xl", children: "\u26A0\uFE0F" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "At Risk %" }), _jsxs("p", { className: "text-3xl font-bold text-red-600", children: [summary.atRiskPercentage, "%"] })] }), _jsx("div", { className: "text-4xl", children: "\uD83D\uDCCA" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800 mb-4", children: "Risk Distribution" }), _jsxs("div", { className: "grid grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-red-600", children: summary.riskDistribution.critical }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Critical" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-orange-600", children: summary.riskDistribution.high }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "High" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-yellow-600", children: summary.riskDistribution.medium }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Medium" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-green-600", children: summary.riskDistribution.low }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Low" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800", children: "At-Risk Learners" }), _jsx("div", { className: "flex space-x-2", children: ['all', 'critical', 'high', 'medium'].map(risk => (_jsx("button", { onClick: () => setFilterRisk(risk), className: `px-3 py-1 rounded-lg text-sm font-semibold transition ${filterRisk === risk
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: risk === 'all' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1) }, risk))) })] }), _jsx("div", { className: "space-y-2", children: filteredLearners.length === 0 ? (_jsx("p", { className: "text-center text-gray-600 py-8", children: "No at-risk learners in this category \uD83C\uDF89" })) : (filteredLearners.map(learner => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("span", { className: "text-2xl", children: getRiskIcon(learner.riskLevel) }), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-gray-800", children: ["Student ", learner.userId.slice(0, 8), "..."] }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${getRiskColor(learner.riskLevel)}`, children: learner.riskLevel.toUpperCase() }), _jsxs("span", { className: "text-sm text-gray-600", children: ["Health Score: ", _jsx("strong", { children: learner.healthScore.toFixed(0) })] })] })] })] }), learner.flags.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-xs font-semibold text-gray-700 mb-1", children: "Concerns:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: learner.flags.map((flag, idx) => (_jsx("span", { className: "px-2 py-1 bg-red-50 text-red-700 rounded text-xs", children: flag }, idx))) })] })), learner.recommendations.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-xs font-semibold text-gray-700 mb-1", children: "Recommendations:" }), _jsx("ul", { className: "text-xs text-gray-600 space-y-1", children: learner.recommendations.map((rec, idx) => (_jsxs("li", { children: ["\u2022 ", rec] }, idx))) })] }))] }), _jsx("button", { onClick: () => generateNudge(learner), className: "ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition", children: "Generate Nudge" })] }) }, learner.userId)))) })] }), nudge && selectedLearner && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800", children: "Instructor Nudge for Student" }), _jsx("button", { onClick: () => {
                                            setNudge(null);
                                            setSelectedLearner(null);
                                        }, className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: `inline-block px-3 py-1 rounded-lg text-sm font-semibold ${nudge.priority === 'high'
                                            ? 'bg-red-100 text-red-800'
                                            : nudge.priority === 'medium'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'}`, children: ["Priority: ", nudge.priority.toUpperCase()] }), _jsx("div", { className: "p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsx("p", { className: "text-sm text-gray-800 whitespace-pre-wrap", children: nudge.message }) }), _jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-gray-800 mb-2", children: "Component Scores:" }), _jsx("div", { className: "space-y-2", children: nudge.components.map((comp, idx) => (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-700", children: comp.name }), _jsxs("span", { className: `font-semibold ${comp.score >= 70 ? 'text-green-600' :
                                                                comp.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`, children: [comp.score.toFixed(0), "% (", comp.status, ")"] })] }, idx))) })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: () => {
                                                    // Here you would send the nudge via email/notification
                                                    alert('Nudge would be sent to the student');
                                                    setNudge(null);
                                                    setSelectedLearner(null);
                                                }, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition", children: "Send Nudge" }), _jsx("button", { onClick: () => {
                                                    setNudge(null);
                                                    setSelectedLearner(null);
                                                }, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition", children: "Cancel" })] })] })] }) }) }))] }));
};
