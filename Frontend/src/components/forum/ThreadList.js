import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Eye, Clock, Award, Pin, Lock, CheckCircle, Plus } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const ThreadList = ({ categoryId, courseId }) => {
    const navigate = useNavigate();
    const [threads, setThreads] = useState([]);
    const [sortBy, setSortBy] = useState('recent');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
    useEffect(() => {
        loadThreads();
    }, [categoryId, sortBy, pagination.offset]);
    const loadThreads = async () => {
        try {
            setLoading(true);
            const params = {
                sortBy,
                limit: pagination.limit,
                offset: pagination.offset,
            };
            if (categoryId)
                params.categoryId = categoryId;
            const response = await axios.get(`${API_URL}/api/forum/threads`, { params });
            setThreads(response.data.data);
            setPagination(response.data.pagination);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load threads');
        }
        finally {
            setLoading(false);
        }
    };
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60)
            return 'just now';
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800)
            return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };
    const sortOptions = [
        { value: 'recent', label: 'Recent Activity' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'unanswered', label: 'Unanswered' },
        { value: 'bounty', label: 'Bounty' },
    ];
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Discussions" }), _jsx("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", children: sortOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("button", { onClick: () => navigate('/forum/new-thread'), className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-5 h-5" }), "New Thread"] })] }), threads.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [_jsx(MessageSquare, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "No discussions yet" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Be the first to start a conversation!" }), _jsxs("button", { onClick: () => navigate('/forum/new-thread'), className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-5 h-5" }), "Start Discussion"] })] })) : (_jsx("div", { className: "space-y-3", children: threads.map((thread) => (_jsx("div", { onClick: () => navigate(`/forum/thread/${thread.id}`), className: "bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 p-4", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: thread.author_avatar ? (_jsx("img", { src: thread.author_avatar, alt: thread.author_name, className: "w-12 h-12 rounded-full" })) : (_jsx("div", { className: "w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center", children: _jsx("span", { className: "text-indigo-600 font-semibold text-lg", children: thread.author_name.charAt(0) }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start gap-2 mb-2", children: [thread.is_pinned && (_jsx(Pin, { className: "w-4 h-4 text-amber-500 flex-shrink-0 mt-1" })), thread.is_locked && (_jsx(Lock, { className: "w-4 h-4 text-gray-500 flex-shrink-0 mt-1" })), _jsx("h3", { className: "text-lg font-semibold text-gray-800 hover:text-indigo-600 flex-1", children: thread.title }), thread.is_question && (_jsx("span", { className: `px-2 py-1 text-xs font-medium rounded ${thread.has_accepted_answer
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'}`, children: thread.has_accepted_answer ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "Answered"] })) : ('Question') })), thread.bounty_points > 0 && (_jsxs("span", { className: "px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded flex items-center gap-1", children: [_jsx(Award, { className: "w-3 h-3" }), "+", thread.bounty_points] }))] }), thread.tags && thread.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1 mb-2", children: thread.tags.slice(0, 5).map((tag, idx) => (_jsx("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded", children: tag }, idx))) })), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-500", children: [_jsx("span", { className: "font-medium text-gray-700", children: thread.author_name }), thread.author_reputation > 0 && (_jsxs("span", { className: "flex items-center gap-1 text-amber-600", children: [_jsx(Award, { className: "w-3 h-3" }), thread.author_reputation] })), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-4 h-4" }), formatTimeAgo(thread.last_activity_at)] })] })] }), _jsx("div", { className: "flex-shrink-0 flex flex-col items-end gap-2 text-sm", children: _jsxs("div", { className: "flex items-center gap-3 text-gray-600", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), thread.reply_count] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "w-4 h-4" }), thread.view_count] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(ThumbsUp, { className: "w-4 h-4" }), thread.score] })] }) })] }) }, thread.id))) })), pagination.total > pagination.limit && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPagination({
                            ...pagination,
                            offset: Math.max(0, pagination.offset - pagination.limit),
                        }), disabled: pagination.offset === 0, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "Previous" }), _jsxs("span", { className: "text-sm text-gray-600", children: [Math.floor(pagination.offset / pagination.limit) + 1, " of", ' ', Math.ceil(pagination.total / pagination.limit)] }), _jsx("button", { onClick: () => setPagination({
                            ...pagination,
                            offset: pagination.offset + pagination.limit,
                        }), disabled: pagination.offset + pagination.limit >= pagination.total, className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "Next" })] }))] }));
};
