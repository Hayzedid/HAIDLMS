import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Award, Trophy, Medal, TrendingUp } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const Leaderboard = ({ courseId, limit = 50 }) => {
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        loadLeaderboard();
    }, [courseId]);
    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const params = { limit };
            if (courseId)
                params.courseId = courseId;
            const response = await axios.get(`${API_URL}/api/forum/leaderboard`, { params });
            setContributors(response.data.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load leaderboard');
        }
        finally {
            setLoading(false);
        }
    };
    const getRankIcon = (rank) => {
        if (rank === 1)
            return _jsx(Trophy, { className: "w-6 h-6 text-yellow-500" });
        if (rank === 2)
            return _jsx(Medal, { className: "w-6 h-6 text-gray-400" });
        if (rank === 3)
            return _jsx(Medal, { className: "w-6 h-6 text-amber-600" });
        return _jsxs("span", { className: "text-gray-500 font-semibold", children: ["#", rank] });
    };
    const getRankBadgeColor = (rank) => {
        const colors = {
            Novice: 'bg-gray-100 text-gray-700',
            Contributor: 'bg-blue-100 text-blue-700',
            Expert: 'bg-purple-100 text-purple-700',
            Master: 'bg-amber-100 text-amber-700',
        };
        return colors[rank] || 'bg-gray-100 text-gray-700';
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Leaderboard" }), _jsx("p", { className: "text-amber-100", children: "Top contributors in the community" })] }), _jsx(Trophy, { className: "w-16 h-16 text-white opacity-50" })] }) }), contributors.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(Award, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No contributors yet" })] })) : (_jsx("div", { className: "divide-y divide-gray-200", children: contributors.map((contributor) => (_jsx("div", { className: `p-4 hover:bg-gray-50 transition ${contributor.rank <= 3 ? 'bg-amber-50/30' : ''}`, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 flex items-center justify-center", children: getRankIcon(contributor.rank) }), _jsx("div", { className: "flex-shrink-0", children: contributor.avatar_url ? (_jsx("img", { src: contributor.avatar_url, alt: contributor.full_name, className: "w-12 h-12 rounded-full" })) : (_jsx("div", { className: "w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center", children: _jsx("span", { className: "text-indigo-600 font-semibold text-lg", children: contributor.full_name.charAt(0) }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-gray-800 truncate", children: contributor.full_name }), contributor.reputation_rank && (_jsx("span", { className: `px-2 py-0.5 text-xs font-medium rounded ${getRankBadgeColor(contributor.reputation_rank)}`, children: contributor.reputation_rank }))] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [_jsxs("span", { children: [contributor.threads_created, " thread", contributor.threads_created !== 1 ? 's' : ''] }), _jsxs("span", { children: [contributor.replies_posted, " repl", contributor.replies_posted !== 1 ? 'ies' : 'y'] }), contributor.best_answers > 0 && (_jsxs("span", { className: "text-green-600", children: [contributor.best_answers, " best answer", contributor.best_answers !== 1 ? 's' : ''] }))] })] }), _jsxs("div", { className: "flex flex-col items-end", children: [_jsxs("div", { className: "flex items-center gap-1 text-amber-600 font-bold text-lg", children: [_jsx(Award, { className: "w-5 h-5" }), contributor.total_points] }), _jsx("div", { className: "text-xs text-gray-500", children: "reputation" })] })] }) }, contributor.user_id))) })), _jsx("div", { className: "bg-gray-50 px-6 py-4 text-sm text-gray-600", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-700 mb-1", children: "How to earn reputation:" }), _jsxs("ul", { className: "space-y-1 text-xs", children: [_jsx("li", { children: "\u2022 Create a thread: +5 points" }), _jsx("li", { children: "\u2022 Post a reply: +2 points" }), _jsx("li", { children: "\u2022 Your answer is accepted: +15 points" }), _jsx("li", { children: "\u2022 Receive an upvote: +1 point" })] })] })] }) })] }));
};
