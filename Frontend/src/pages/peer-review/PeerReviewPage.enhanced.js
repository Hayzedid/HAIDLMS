import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { FileCode, CheckCircle2, Clock, AlertTriangle, Award, Users, } from "lucide-react";
import { peerReviewApi } from "../../api/peer-review.api";
import { PeerReviewInterface } from "../../components/peer-review/PeerReviewInterface.enhanced";
import { Card, CardHeader, CardTitle, CardContent, } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { cn, formatRelativeTime } from "../../lib/utils";
export const PeerReviewPage = () => {
    const { user } = useAuth();
    const [pendingReviews, setPendingReviews] = useState([]);
    const [submittedReviews, setSubmittedReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("pending");
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
                peerReviewApi.getReviewerAssignments(user?.id || "", "submitted"),
            ]);
            setPendingReviews(pending);
            setSubmittedReviews(assignments);
        }
        catch (err) {
            setError(err.message || "Failed to load reviews");
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
    if (selectedReview) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [_jsx(Button, { onClick: () => setSelectedReview(null), variant: "ghost", size: "lg", className: "mb-6", children: "\u2190 Back to Reviews" }), _jsx(PeerReviewInterface, { reviewId: selectedReview.review_id, submissionCode: "// Sample code - would load from backend\\nfunction example() {\\n  return 'Hello World';\\n}", submissionLanguage: "javascript", onReviewSubmitted: handleReviewSubmitted })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsxs("div", { className: "inline-flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg", children: _jsx(FileCode, { className: "w-8 h-8 text-white" }) }), _jsx("h1", { className: "text-4xl font-display font-bold text-gray-900", children: "Peer Code Reviews" })] }), _jsx("p", { className: "text-lg text-gray-600 max-w-2xl mx-auto", children: "Review your classmates' code and provide constructive feedback" })] }), error && (_jsxs("div", { className: "mb-6 p-4 bg-danger-50 border-l-4 border-danger-500 rounded-xl text-danger-700 flex items-center gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 flex-shrink-0" }), error] })), _jsx("div", { className: "mb-8 flex justify-center", children: _jsxs("div", { className: "bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg inline-flex gap-2", children: [_jsxs("button", { onClick: () => setActiveTab("pending"), className: cn("flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all", activeTab === "pending"
                                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-105"
                                    : "text-gray-600 hover:bg-gray-100"), children: [_jsx(Clock, { className: "w-5 h-5" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "text-sm font-bold", children: "Pending" }), _jsxs("div", { className: cn("text-xs", activeTab === "pending"
                                                    ? "text-orange-100"
                                                    : "text-gray-500"), children: [pendingReviews.length, " to review"] })] })] }), _jsxs("button", { onClick: () => setActiveTab("submitted"), className: cn("flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all", activeTab === "submitted"
                                    ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg scale-105"
                                    : "text-gray-600 hover:bg-gray-100"), children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "text-sm font-bold", children: "Submitted" }), _jsxs("div", { className: cn("text-xs", activeTab === "submitted"
                                                    ? "text-green-100"
                                                    : "text-gray-500"), children: [submittedReviews.length, " completed"] })] })] })] }) }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(Spinner, { size: "xl", label: "Loading reviews..." }) })) : activeTab === "pending" ? (_jsx("div", { className: "space-y-4 animate-fade-in", children: pendingReviews.length === 0 ? (_jsx(EmptyState, { icon: Award, title: "All Caught Up!", description: "You don't have any pending reviews at the moment. Great job staying on top of your peer reviews!" })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: pendingReviews.map((review, index) => (_jsxs(Card, { variant: "elevated", hover: true, className: cn("backdrop-blur-md bg-white/90 animate-fade-in-up", review.is_overdue && "border-2 border-danger-300"), style: { animationDelay: `${index * 50}ms` }, children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(FileCode, { className: "w-6 h-6 text-blue-600" }) }), review.is_overdue && (_jsx(Badge, { variant: "danger", size: "sm", children: "OVERDUE" }))] }), _jsx(CardTitle, { className: "text-lg", children: review.rubric_name }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Submission #", review.submission_id.slice(0, 8)] })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Clock, { className: "w-4 h-4 text-gray-400" }), _jsxs("span", { className: "text-gray-600", children: ["Due ", formatRelativeTime(review.due_at)] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Users, { className: "w-4 h-4 text-gray-400" }), _jsxs("span", { className: "text-gray-600", children: [review.min_reviews_required, " reviews required"] })] })] }) }), _jsx("div", { className: "p-4 pt-0", children: _jsx(Button, { onClick: () => handleStartReview(review), fullWidth: true, variant: "primary", size: "lg", children: "Start Review" }) })] }, review.review_id))) })) })) : (_jsx("div", { className: "space-y-4 animate-fade-in", children: submittedReviews.length === 0 ? (_jsx(EmptyState, { icon: FileCode, title: "No Submitted Reviews Yet", description: "Your completed reviews will appear here. Start reviewing to help your peers!" })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: submittedReviews.map((review, index) => (_jsxs(Card, { variant: "elevated", className: "backdrop-blur-md bg-white/90 animate-fade-in-up", style: { animationDelay: `${index * 50}ms` }, children: [_jsx(CardHeader, { children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-success-100 rounded-lg", children: _jsx(CheckCircle2, { className: "w-6 h-6 text-success-600" }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: "Review Completed" }), _jsx(Badge, { variant: "success", size: "sm", className: "mt-1", children: "SUBMITTED" })] })] }) }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Submission:" }), " #", review.submissionId.slice(0, 8)] }), review.overallScore && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex items-center", children: Array.from({ length: 5 }).map((_, i) => (_jsx(Award, { className: cn("w-5 h-5", i < review.overallScore
                                                                ? "text-warning-500 fill-current"
                                                                : "text-gray-300") }, i))) }), _jsxs("span", { className: "text-sm font-semibold text-gray-700", children: [review.overallScore.toFixed(1), " / 5.0"] })] })), _jsxs("p", { className: "text-xs text-gray-500", children: ["Submitted ", formatRelativeTime(review.submittedAt)] }), review.isFlaggedForCollusion && (_jsx("div", { className: "p-3 bg-danger-50 border-l-4 border-danger-500 rounded", children: _jsxs("p", { className: "text-xs text-danger-700 font-semibold flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), "Flagged for review (similarity:", " ", (review.collusionSimilarityScore * 100).toFixed(1), "%)"] }) }))] }) })] }, review.id))) })) })), _jsx(Card, { variant: "elevated", className: "mt-12 backdrop-blur-md bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("h3", { className: "text-xl font-bold text-blue-900 mb-4 flex items-center gap-2", children: [_jsx(FileCode, { className: "w-6 h-6" }), "Peer Review Guidelines"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Badge, { variant: "success", size: "sm", children: "\u2713" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-900", children: "Be Constructive" }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Provide helpful suggestions, not just criticism" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Badge, { variant: "success", size: "sm", children: "\u2713" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-900", children: "Be Specific" }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Reference specific lines and explain your reasoning" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Badge, { variant: "success", size: "sm", children: "\u2713" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-900", children: "Be Respectful" }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Remember there's a person behind the code" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Badge, { variant: "success", size: "sm", children: "\u2713" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-900", children: "Follow the Rubric" }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Use the provided criteria to guide your review" })] })] })] }), _jsx("div", { className: "mt-4 p-4 bg-white/60 rounded-xl border border-blue-300", children: _jsxs("p", { className: "text-sm text-blue-900 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), _jsxs("span", { children: [_jsx("strong", { children: "Academic Integrity:" }), " Your reviews may be cross-checked against your own code for academic integrity. Don't copy code you're reviewing!"] })] }) })] }) })] }) }));
};
