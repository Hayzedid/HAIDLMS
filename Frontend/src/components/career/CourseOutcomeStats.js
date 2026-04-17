import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { TrendingUp, Briefcase, DollarSign, Clock, Award, Star, Users } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const CourseOutcomeStats = ({ courseId }) => {
    const [stats, setStats] = useState(null);
    const [recentOutcomes, setRecentOutcomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        loadStats();
    }, [courseId]);
    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/career-outcomes/course/${courseId}/stats`);
            setStats(response.data.data.stats);
            setRecentOutcomes(response.data.data.recentOutcomes || []);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load outcome stats');
        }
        finally {
            setLoading(false);
        }
    };
    const getOutcomeTypeLabel = (type) => {
        const labels = {
            hired: 'Got Hired',
            promoted: 'Promoted',
            role_change: 'Changed Role',
            salary_increase: 'Salary Increase',
            started_business: 'Started Business',
        };
        return labels[type] || type;
    };
    const getOutcomeColor = (type) => {
        const colors = {
            hired: 'bg-green-100 text-green-700',
            promoted: 'bg-blue-100 text-blue-700',
            role_change: 'bg-purple-100 text-purple-700',
            salary_increase: 'bg-amber-100 text-amber-700',
            started_business: 'bg-indigo-100 text-indigo-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error || !stats || stats.total_outcomes === 0) {
        return null; // Don't show section if no outcomes yet
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Career Outcomes" }), _jsx("p", { className: "text-green-100", children: "Real results from students who completed this course" })] }), _jsx("div", { className: "w-16 h-16 bg-white/20 rounded-full flex items-center justify-center", children: _jsx(TrendingUp, { className: "w-10 h-10 text-white" }) })] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600 mb-2", children: [_jsx(Users, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Total Outcomes" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: stats.total_outcomes }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "Verified successes" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-600 mb-2", children: [_jsx(Briefcase, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Got Hired" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: stats.hired_count }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [((stats.hired_count / stats.total_outcomes) * 100).toFixed(0), "% of outcomes"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-600 mb-2", children: [_jsx(TrendingUp, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Promoted" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: stats.promoted_count }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [((stats.promoted_count / stats.total_outcomes) * 100).toFixed(0), "% of outcomes"] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-amber-600 mb-2", children: [_jsx(Clock, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Avg Time" })] }), _jsx("div", { className: "text-3xl font-bold text-gray-900", children: Math.round(stats.avg_time_to_outcome) }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "Days to outcome" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [stats.median_salary_range && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-amber-600 mb-4", children: [_jsx(DollarSign, { className: "w-6 h-6" }), _jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Median Salary Range" })] }), _jsx("div", { className: "text-2xl font-bold text-gray-900", children: stats.median_salary_range }), _jsxs("p", { className: "text-sm text-gray-600 mt-2", children: ["Based on ", stats.salary_increase_count, " reported salary outcomes"] })] })), stats.top_companies && stats.top_companies.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-indigo-600 mb-4", children: [_jsx(Award, { className: "w-6 h-6" }), _jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Top Companies" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: stats.top_companies.slice(0, 10).map((company, idx) => (_jsx("span", { className: "px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium", children: company }, idx))) })] }))] }), stats.top_job_titles && stats.top_job_titles.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-purple-600 mb-4", children: [_jsx(Briefcase, { className: "w-6 h-6" }), _jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Common Job Titles" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: stats.top_job_titles.slice(0, 12).map((title, idx) => (_jsx("span", { className: "px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium", children: title }, idx))) })] })), recentOutcomes.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2", children: [_jsx(Star, { className: "w-6 h-6 text-yellow-500" }), "Recent Success Stories"] }), _jsx("div", { className: "space-y-4", children: recentOutcomes.map((outcome) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: outcome.avatar_url ? (_jsx("img", { src: outcome.avatar_url, alt: outcome.full_name, className: "w-12 h-12 rounded-full" })) : (_jsx("div", { className: "w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center", children: _jsx("span", { className: "text-indigo-600 font-semibold text-lg", children: outcome.full_name.charAt(0) }) })) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-800", children: outcome.full_name }), _jsxs("p", { className: "text-sm text-gray-600", children: [outcome.new_job_title, outcome.new_company && ` at ${outcome.new_company}`] })] }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(outcome.outcome_type)}`, children: getOutcomeTypeLabel(outcome.outcome_type) })] }), outcome.testimonial_text && (_jsxs("p", { className: "text-sm text-gray-700 italic mb-2", children: ["\"", outcome.testimonial_text, "\""] })), _jsxs("div", { className: "flex items-center gap-4 text-xs text-gray-500", children: [_jsx("span", { children: new Date(outcome.outcome_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            year: 'numeric',
                                                        }) }), outcome.time_to_outcome_days !== null && (_jsxs("span", { children: [_jsx(Clock, { className: "w-3 h-3 inline mr-1" }), outcome.time_to_outcome_days, " days after completion"] }))] })] })] }) }, outcome.id))) })] }))] }));
};
