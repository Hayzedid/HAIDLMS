import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, MessageSquare, Award, CheckCircle, Pin, Lock, Reply, Eye } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const ThreadView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [thread, setThread] = useState(null);
    const [replies, setReplies] = useState([]);
    const [userVote, setUserVote] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const currentUserId = localStorage.getItem('userId'); // Assuming stored on login
    useEffect(() => {
        loadThread();
    }, [id]);
    const loadThread = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.get(`${API_URL}/api/forum/threads/${id}`, config);
            setThread(response.data.data.thread);
            setReplies(response.data.data.replies);
            setUserVote(response.data.data.userVote);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load thread');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVote = async (entityType, entityId, voteType) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            await axios.post(`${API_URL}/api/forum/${entityType}/${entityId}/vote`, { voteType }, { headers: { Authorization: `Bearer ${token}` } });
            // Reload to update counts
            await loadThread();
        }
        catch (err) {
            console.error('Vote failed:', err);
        }
    };
    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim())
            return;
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            await axios.post(`${API_URL}/api/forum/threads/${id}/replies`, { content: replyContent, isAnswer: thread?.is_question }, { headers: { Authorization: `Bearer ${token}` } });
            setReplyContent('');
            await loadThread();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to post reply');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleAcceptAnswer = async (replyId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            await axios.post(`${API_URL}/api/forum/threads/${id}/accept-answer/${replyId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            await loadThread();
        }
        catch (err) {
            console.error('Failed to accept answer:', err);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error || !thread) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error || 'Thread not found' }));
    }
    return (_jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: [_jsx("div", { className: "bg-gray-50 border-b px-6 py-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [thread.is_pinned && _jsx(Pin, { className: "w-4 h-4 text-amber-500" }), thread.is_locked && _jsx(Lock, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600", children: thread.category_name })] }), _jsx("h1", { className: "text-2xl font-bold text-gray-800 mb-2", children: thread.title }), thread.tags && thread.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: thread.tags.map((tag, idx) => (_jsx("span", { className: "px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded", children: tag }, idx))) }))] }), thread.is_question && (_jsx("span", { className: `px-3 py-1 text-sm font-medium rounded ${thread.has_accepted_answer
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'}`, children: thread.has_accepted_answer ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Answered"] })) : ('Question') }))] }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex gap-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("button", { onClick: () => handleVote('thread', thread.id, 'upvote'), className: `p-2 rounded-lg transition ${userVote === 'upvote'
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'hover:bg-gray-100 text-gray-600'}`, children: _jsx(ThumbsUp, { className: "w-6 h-6" }) }), _jsx("span", { className: "text-xl font-bold text-gray-800", children: thread.score }), _jsx("button", { onClick: () => handleVote('thread', thread.id, 'downvote'), className: `p-2 rounded-lg transition ${userVote === 'downvote'
                                                ? 'bg-red-100 text-red-600'
                                                : 'hover:bg-gray-100 text-gray-600'}`, children: _jsx(ThumbsDown, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "prose max-w-none mb-6", children: _jsx("p", { className: "whitespace-pre-wrap", children: thread.content }) }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t", children: [_jsxs("div", { className: "flex items-center gap-3", children: [thread.author_avatar ? (_jsx("img", { src: thread.author_avatar, alt: thread.author_name, className: "w-10 h-10 rounded-full" })) : (_jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center", children: _jsx("span", { className: "text-indigo-600 font-semibold", children: thread.author_name.charAt(0) }) })), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-gray-800", children: thread.author_name }), _jsxs("div", { className: "text-sm text-gray-500", children: [formatDate(thread.created_at), thread.author_reputation > 0 && (_jsxs("span", { className: "ml-2 text-amber-600", children: [_jsx(Award, { className: "w-3 h-3 inline mr-1" }), thread.author_reputation] }))] })] })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "w-4 h-4" }), thread.view_count, " views"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), thread.reply_count, " replies"] })] })] })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-800 mb-6", children: [thread.reply_count, " ", thread.reply_count === 1 ? 'Reply' : 'Replies'] }), _jsx("div", { className: "space-y-6", children: replies.map((reply) => (_jsxs("div", { className: "flex gap-6 pb-6 border-b last:border-0", children: [_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("button", { onClick: () => handleVote('reply', reply.id, 'upvote'), className: "p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition", children: _jsx(ThumbsUp, { className: "w-5 h-5" }) }), _jsx("span", { className: "text-lg font-semibold text-gray-800", children: reply.upvote_count - reply.downvote_count }), _jsx("button", { onClick: () => handleVote('reply', reply.id, 'downvote'), className: "p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition", children: _jsx(ThumbsDown, { className: "w-5 h-5" }) }), thread.is_question &&
                                            !thread.has_accepted_answer &&
                                            thread.author_id === currentUserId && (_jsx("button", { onClick: () => handleAcceptAnswer(reply.id), className: "mt-2 p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition", title: "Accept as answer", children: _jsx(CheckCircle, { className: "w-5 h-5" }) }))] }), _jsxs("div", { className: "flex-1", children: [reply.is_accepted_answer && (_jsxs("div", { className: "mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "font-semibold", children: "Accepted Answer" })] })), reply.is_instructor_reply && (_jsxs("div", { className: "mb-3 inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded", children: [_jsx(Award, { className: "w-4 h-4" }), "Instructor"] })), _jsx("div", { className: "prose max-w-none mb-4", children: _jsx("p", { className: "whitespace-pre-wrap", children: reply.content }) }), _jsxs("div", { className: "flex items-center gap-3", children: [reply.author_avatar ? (_jsx("img", { src: reply.author_avatar, alt: reply.author_name, className: "w-8 h-8 rounded-full" })) : (_jsx("div", { className: "w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center", children: _jsx("span", { className: "text-indigo-600 text-sm font-semibold", children: reply.author_name.charAt(0) }) })), _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "font-semibold text-gray-800", children: reply.author_name }), reply.author_reputation > 0 && (_jsxs("span", { className: "ml-2 text-amber-600", children: [_jsx(Award, { className: "w-3 h-3 inline mr-1" }), reply.author_reputation] })), _jsx("span", { className: "ml-2 text-gray-500", children: formatDate(reply.created_at) })] })] })] })] }, reply.id))) })] }), !thread.is_locked && (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Your Answer" }), _jsxs("form", { onSubmit: handleReply, children: [_jsx("textarea", { value: replyContent, onChange: (e) => setReplyContent(e.target.value), placeholder: "Write your reply...", rows: 6, className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("div", { className: "flex justify-end gap-3 mt-4", children: _jsxs("button", { type: "submit", disabled: submitting || !replyContent.trim(), className: "flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: [_jsx(Reply, { className: "w-5 h-5" }), submitting ? 'Posting...' : 'Post Reply'] }) })] })] })), thread.is_locked && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 flex items-center gap-2", children: [_jsx(Lock, { className: "w-5 h-5" }), _jsx("span", { children: "This thread is locked. No new replies can be added." })] }))] }));
};
