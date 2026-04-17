import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { peerReviewApi } from '../../api/peer-review.api';
import { PeerReviewInterface } from '../../components/peer-review/PeerReviewInterface.enhanced';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout';
import { Tabs, Button } from '../../components/ui';
import { Clock, CheckCircle } from 'lucide-react';
export const PeerReviewPage = () => {
    const { user } = useAuth(); // Get current user
    const [pendingReviews, setPendingReviews] = useState([]);
    const [submittedReviews, setSubmittedReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    useEffect(() => {
        if (user) {
            loadReviews();
        }
    }, [user]);
    const loadReviews = async () => {
        try {
            setIsLoading(true);
            const [pending, assignments] = await Promise.all([
                peerReviewApi.getPendingReviews(user?.id),
                peerReviewApi.getReviewerAssignments(user?.id || '', 'submitted'),
            ]);
            setPendingReviews(pending);
            setSubmittedReviews(assignments);
        }
        catch (err) {
            setError(err.message || 'Failed to load reviews');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleStartReview = (review) => {
        setSelectedReview(review);
    };
    const handleReviewSubmitted = () => {
        setSelectedReview(null);
        loadReviews();
    };
    const tabs = [
        {
            id: 'pending',
            label: 'Pending',
            icon: _jsx(Clock, { className: "w-4 h-4" }),
            badge: pendingReviews.length,
        },
        {
            id: 'submitted',
            label: 'Submitted',
            icon: _jsx(CheckCircle, { className: "w-4 h-4" }),
            badge: submittedReviews.length,
        },
    ];
    if (selectedReview) {
        return (_jsxs(AppLayout, { children: [_jsx(Button, { onClick: () => setSelectedReview(null), variant: "ghost", className: "mb-4", children: "\u2190 Back to Reviews" }), _jsx(PeerReviewInterface, { reviewId: selectedReview.review_id, submissionCode: "// Sample code - would load from backend\\nfunction example() {\\n  return 'Hello World';\\n}", submissionLanguage: "javascript", onReviewSubmitted: handleReviewSubmitted })] }));
    }
    return (_jsxs(AppLayout, { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Peer Code Reviews" }), _jsx("p", { className: "text-gray-600", children: "Review your classmates' code and provide constructive feedback" })] }), error && (_jsx("div", { className: "mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700", children: error })), _jsx("div", { className: "mb-6", children: _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "underline" }) }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : activeTab === 'pending' ? (_jsx("div", { className: "space-y-4", children: pendingReviews.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF89" }), _jsx("h3", { className: "text-xl font-semibold text-gray-800 mb-2", children: "All Caught Up!" }), _jsx("p", { className: "text-gray-600", children: "You don't have any pending reviews at the moment." })] })) : (pendingReviews.map((review) => (_jsx("div", { className: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: review.rubric_name }), review.is_overdue && (_jsx("span", { className: "px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold", children: "OVERDUE" }))] }), _jsxs("p", { className: "text-sm text-gray-600 mb-3", children: ["Submission ID: ", review.submission_id.slice(0, 8), "..."] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [_jsxs("span", { children: ["Due: ", new Date(review.due_at).toLocaleDateString()] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [review.min_reviews_required, " reviews required"] })] })] }), _jsx("button", { onClick: () => handleStartReview(review), className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition", children: "Start Review" })] }) }, review.review_id)))) })) : (_jsx("div", { className: "space-y-4", children: submittedReviews.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCCB" }), _jsx("h3", { className: "text-xl font-semibold text-gray-800 mb-2", children: "No Submitted Reviews Yet" }), _jsx("p", { className: "text-gray-600", children: "Your completed reviews will appear here." })] })) : (submittedReviews.map((review) => (_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Review Submitted" }), _jsx("span", { className: "px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold", children: "COMPLETED" })] }), _jsxs("p", { className: "text-sm text-gray-600 mb-2", children: ["Submission ID: ", review.submissionId.slice(0, 8), "..."] }), review.overallScore && (_jsxs("p", { className: "text-sm text-gray-700 mb-2", children: [_jsx("strong", { children: "Overall Score:" }), " ", review.overallScore.toFixed(1), " / 5.0"] })), _jsxs("div", { className: "text-sm text-gray-500", children: ["Submitted: ", review.submittedAt ? new Date(review.submittedAt).toLocaleString() : 'N/A'] }), review.isFlaggedForCollusion && (_jsxs("div", { className: "mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700", children: ["\u26A0\uFE0F Flagged for potential collusion (similarity: ", (review.collusionSimilarityScore * 100).toFixed(1), "%)"] }))] }) }) }, review.id)))) })), _jsxs("div", { className: "mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-primary-900 mb-2", children: "\uD83D\uDCDA Peer Review Guidelines" }), _jsxs("ul", { className: "text-sm text-primary-800 space-y-1", children: [_jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Be Constructive:" }), " Provide helpful suggestions, not just criticism"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Be Specific:" }), " Reference specific lines and explain your reasoning"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Be Respectful:" }), " Remember there's a person behind the code"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Follow the Rubric:" }), " Use the provided criteria to guide your review"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Academic Integrity:" }), " Don't copy code you're reviewing"] })] }), _jsx("div", { className: "mt-4 p-3 bg-white border border-primary-300 rounded", children: _jsxs("p", { className: "text-sm text-primary-900", children: [_jsx("strong", { children: "Note:" }), " Your reviews may be cross-checked against your own code for academic integrity."] }) })] })] }));
};
