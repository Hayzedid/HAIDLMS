import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { peerReviewApi } from '../../api/peer-review.api';
import { AlertTriangle, CheckCircle, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';
export const DisputeManagement = ({ userRole, userId }) => {
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Resolution form (instructor only)
    const [resolution, setResolution] = useState('');
    const [resolutionAction, setResolutionAction] = useState('no_change');
    const [newScore, setNewScore] = useState(undefined);
    useEffect(() => {
        loadDisputes();
    }, []);
    useEffect(() => {
        if (selectedDispute) {
            loadReviewDetails(selectedDispute.reviewId);
        }
    }, [selectedDispute]);
    const loadDisputes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await peerReviewApi.getDisputes(userRole === 'instructor' ? undefined : 'open,under_review');
            // Filter by user if student
            const filteredDisputes = userRole === 'student' ? data.filter(d => d.authorId === userId) : data;
            setDisputes(filteredDisputes);
        }
        catch (err) {
            setError(err.message || 'Failed to load disputes');
        }
        finally {
            setLoading(false);
        }
    };
    const loadReviewDetails = async (reviewId) => {
        try {
            const reviewData = await peerReviewApi.getReview(reviewId);
            setReview(reviewData);
        }
        catch (err) {
            console.error('Failed to load review:', err);
        }
    };
    const resolveDispute = async () => {
        if (!selectedDispute)
            return;
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            await peerReviewApi.resolveDispute(selectedDispute.id, {
                resolvedBy: userId,
                resolution,
                resolutionAction,
                newScore,
            });
            setSuccess('Dispute resolved successfully!');
            setSelectedDispute(null);
            setResolution('');
            setNewScore(undefined);
            await loadDisputes();
        }
        catch (err) {
            setError(err.message || 'Failed to resolve dispute');
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusBadge = (status) => {
        const badges = {
            open: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Open' },
            under_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText, label: 'Under Review' },
            resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Resolved' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
        };
        const badge = badges[status] || badges.open;
        const Icon = badge.icon;
        return (_jsxs("span", { className: `px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium flex items-center gap-1`, children: [_jsx(Icon, { className: "w-4 h-4" }), badge.label] }));
    };
    if (loading && disputes.length === 0) {
        return (_jsx("div", { className: "max-w-7xl mx-auto p-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading disputes..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-800 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-7 h-7 text-amber-600" }), "Review Disputes"] }), _jsx("p", { className: "text-gray-600 mt-1", children: userRole === 'instructor'
                                            ? 'Review and resolve student disputes'
                                            : 'View your dispute submissions and resolutions' })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-3xl font-bold text-gray-900", children: disputes.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Disputes" })] })] }), error && (_jsx("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), success && (_jsx("div", { className: "mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700", children: success }))] }), disputes.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [_jsx(CheckCircle, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "No disputes" }), _jsx("p", { className: "text-gray-500", children: userRole === 'instructor'
                            ? 'No peer review disputes to resolve.'
                            : 'You have no active disputes.' })] })) : (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4", children: ["Disputes (", disputes.length, ")"] }), _jsx("div", { className: "space-y-3", children: disputes.map(dispute => (_jsxs("button", { onClick: () => setSelectedDispute(dispute), className: `w-full text-left p-4 rounded-lg border-2 transition ${selectedDispute?.id === dispute.id
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("span", { className: "font-semibold text-gray-800", children: ["Review #", dispute.reviewId.slice(-6)] }), getStatusBadge(dispute.status)] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: dispute.reason }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Opened: ", new Date(dispute.openedAt).toLocaleDateString()] })] }, dispute.id))) })] }), _jsx("div", { className: "lg:col-span-2 space-y-6", children: selectedDispute ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Dispute Details" }), getStatusBadge(selectedDispute.status)] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-1", children: "Reason" }), _jsx("p", { className: "text-gray-900", children: selectedDispute.reason })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("p", { className: "text-gray-600", children: selectedDispute.description })] }), selectedDispute.requestedOutcome && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-1", children: "Requested Outcome" }), _jsx("p", { className: "text-gray-600", children: selectedDispute.requestedOutcome })] })), review && (_jsxs("div", { className: "pt-4 border-t", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-2", children: "Review Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Overall Score:" }), _jsx("span", { className: "ml-2 font-semibold", children: review.overallScore?.toFixed(1) || 'N/A' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Time Spent:" }), _jsx("span", { className: "ml-2 font-semibold", children: review.timeSpentSeconds
                                                                                ? `${Math.floor(review.timeSpentSeconds / 60)} min`
                                                                                : 'N/A' })] })] })] })), selectedDispute.status === 'resolved' && (_jsxs("div", { className: "pt-4 border-t bg-green-50 -m-6 p-6 mt-4", children: [_jsxs("h4", { className: "text-sm font-medium text-green-800 mb-2 flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "Resolution"] }), _jsx("p", { className: "text-green-700 mb-2", children: selectedDispute.resolution }), _jsxs("div", { className: "text-sm text-green-600", children: [_jsxs("p", { children: ["Action: ", selectedDispute.resolutionAction?.replace(/_/g, ' ')] }), _jsxs("p", { children: ["Resolved by ", selectedDispute.resolvedBy, " on", ' ', selectedDispute.resolvedAt
                                                                            ? new Date(selectedDispute.resolvedAt).toLocaleDateString()
                                                                            : 'N/A'] })] })] })), selectedDispute.status === 'rejected' && (_jsxs("div", { className: "pt-4 border-t bg-red-50 -m-6 p-6 mt-4", children: [_jsxs("h4", { className: "text-sm font-medium text-red-800 mb-2 flex items-center gap-2", children: [_jsx(XCircle, { className: "w-5 h-5" }), "Dispute Rejected"] }), _jsx("p", { className: "text-red-700", children: selectedDispute.resolution })] }))] })] }), userRole === 'instructor' &&
                                    (selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4 flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-indigo-600" }), "Resolve Dispute"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Resolution Action *" }), _jsxs("select", { value: resolutionAction, onChange: (e) => setResolutionAction(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "no_change", children: "No Change - Original review stands" }), _jsx("option", { value: "score_adjusted", children: "Score Adjusted" }), _jsx("option", { value: "review_removed", children: "Review Removed" }), _jsx("option", { value: "re_review_assigned", children: "Re-review Assigned" })] })] }), resolutionAction === 'score_adjusted' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "New Score *" }), _jsx("input", { type: "number", min: "0", max: "100", value: newScore || '', onChange: (e) => setNewScore(parseFloat(e.target.value)), placeholder: "Enter new score (0-100)", className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Resolution Notes *" }), _jsx("textarea", { value: resolution, onChange: (e) => setResolution(e.target.value), placeholder: "Explain your decision and reasoning...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg", rows: 4 })] }), _jsx("button", { onClick: resolveDispute, disabled: !resolution || loading || (resolutionAction === 'score_adjusted' && !newScore), className: "w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 transition", children: loading ? 'Resolving...' : 'Resolve Dispute' })] })] }))] })) : (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [_jsx(AlertTriangle, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "Select a dispute" }), _jsx("p", { className: "text-gray-500", children: "Choose a dispute from the list to view details" })] })) })] }))] }));
};
