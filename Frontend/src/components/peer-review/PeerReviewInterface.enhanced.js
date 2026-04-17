import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Code, Star, MessageSquare, Send, CheckCircle, AlertCircle, Lightbulb, ThumbsUp, FileCode, Award, } from "lucide-react";
import { peerReviewApi, } from "../../api/peer-review.api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import { Modal, ConfirmModal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { cn } from "../../lib/utils";
export const PeerReviewInterface = ({ reviewId, submissionCode, submissionLanguage, onReviewSubmitted, }) => {
    const [review, setReview] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [scores, setScores] = useState({});
    const [comments, setComments] = useState([]);
    const [overallFeedback, setOverallFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [startTime] = useState(Date.now());
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // For adding line comments
    const [selectedLine, setSelectedLine] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [commentType, setCommentType] = useState("suggestion");
    const toast = useToast();
    const codeLines = submissionCode.split("\n");
    useEffect(() => {
        loadReviewData();
    }, [reviewId]);
    const loadReviewData = async () => {
        try {
            const reviewData = await peerReviewApi.getReview(reviewId);
            setReview(reviewData);
            const rubricCriteria = await peerReviewApi.getRubricCriteria(reviewData.rubricId);
            setCriteria(rubricCriteria);
            const existingComments = await peerReviewApi.getReviewComments(reviewId);
            setComments(existingComments);
            // Start the review
            if (reviewData.status === "pending") {
                await peerReviewApi.startReview(reviewId);
                setReview({ ...reviewData, status: "in_progress" });
            }
        }
        catch (err) {
            setError(err.message || "Failed to load review data");
            toast.error("Failed to load review", err.message);
        }
    };
    const handleScoreChange = (criterionId, score, feedback) => {
        setScores((prev) => ({
            ...prev,
            [criterionId]: { score, feedback },
        }));
    };
    const addLineComment = async () => {
        if (!newComment.trim() || selectedLine === null)
            return;
        try {
            const comment = await peerReviewApi.addComment(reviewId, {
                lineNumber: selectedLine + 1,
                codeSnippet: codeLines[selectedLine],
                comment: newComment,
                commentType,
            });
            setComments((prev) => [...prev, comment]);
            setNewComment("");
            setSelectedLine(null);
            toast.success("Comment added!");
        }
        catch (err) {
            setError(err.message || "Failed to add comment");
            toast.error("Failed to add comment", err.message);
        }
    };
    const submitReview = async () => {
        // Validate
        const missingScores = criteria
            .filter((c) => c.isRequired && !scores[c.id])
            .map((c) => c.name);
        if (missingScores.length > 0) {
            setError(`Please score all required criteria: ${missingScores.join(", ")}`);
            toast.warning("Missing required scores", missingScores.join(", "));
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            // Submit scores
            for (const [criterionId, { score, feedback }] of Object.entries(scores)) {
                await peerReviewApi.submitCriterionScore(reviewId, {
                    criterionId,
                    score,
                    feedback,
                });
            }
            // Submit review
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            await peerReviewApi.submitReview(reviewId, {
                overallFeedback,
                timeSpentSeconds: timeSpent,
            });
            setShowConfirmModal(false);
            setShowSuccessModal(true);
            setTimeout(() => {
                if (onReviewSubmitted)
                    onReviewSubmitted();
            }, 2000);
        }
        catch (err) {
            setError(err.message || "Failed to submit review");
            toast.error("Submission failed", err.message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const progress = (Object.keys(scores).length / criteria.length) * 100;
    const commentTypeConfig = {
        suggestion: {
            icon: Lightbulb,
            color: "text-blue-600",
            bg: "bg-blue-50",
            label: "Suggestion",
        },
        question: {
            icon: MessageSquare,
            color: "text-purple-600",
            bg: "bg-purple-50",
            label: "Question",
        },
        praise: {
            icon: ThumbsUp,
            color: "text-green-600",
            bg: "bg-green-50",
            label: "Praise",
        },
        issue: {
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            label: "Issue",
        },
    };
    if (!review) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading review..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [_jsx(Card, { variant: "elevated", className: "mb-6 backdrop-blur-md bg-white/90", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3", children: [_jsx(FileCode, { className: "w-8 h-8 text-primary-600" }), "Peer Code Review"] }), _jsx("p", { className: "text-gray-600", children: "Review the code carefully and provide constructive feedback using the rubric below." })] }), _jsx(Badge, { variant: "info", size: "lg", dot: true, children: "In Progress" })] }), _jsxs("div", { className: "mt-6", children: [_jsx(Progress, { value: progress, label: "Review Progress", showLabel: true, variant: progress === 100 ? "success" : "default" }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: [Object.keys(scores).length, " of ", criteria.length, " criteria scored"] })] }), error && (_jsxs("div", { className: "mt-4 p-4 bg-danger-50 border-l-4 border-danger-500 rounded-lg flex items-start gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-danger-700", children: error })] }))] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { className: "space-y-4", children: _jsxs(Card, { variant: "elevated", className: "backdrop-blur-md bg-white/90", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Code, { className: "w-5 h-5 text-primary-600" }), "Submitted Code"] }), _jsx(Badge, { variant: "default", size: "sm", children: submissionLanguage })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "bg-gray-900 rounded-xl overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700", children: [_jsxs("span", { className: "text-xs text-gray-400 font-mono", children: ["main.", submissionLanguage] }), _jsxs("span", { className: "text-xs text-gray-400", children: [codeLines.length, " lines"] })] }), _jsx("div", { className: "overflow-x-auto custom-scrollbar", style: { maxHeight: "500px" }, children: codeLines.map((line, index) => {
                                                                const lineComments = comments.filter((c) => c.lineNumber === index + 1);
                                                                const hasComment = lineComments.length > 0;
                                                                const isSelected = selectedLine === index;
                                                                return (_jsxs("div", { children: [_jsxs("div", { onClick: () => setSelectedLine(index), className: cn("flex items-start hover:bg-gray-800 cursor-pointer transition-colors", isSelected &&
                                                                                "bg-primary-900/30 border-l-4 border-primary-500", hasComment && "bg-yellow-900/20"), children: [_jsx("span", { className: "w-12 flex-shrink-0 text-right pr-4 py-2 text-gray-500 text-xs font-mono select-none", children: index + 1 }), _jsx("pre", { className: "flex-1 py-2 text-sm text-gray-100 font-mono", children: _jsx("code", { children: line || " " }) })] }), hasComment && (_jsx("div", { className: "bg-yellow-900/30 border-l-4 border-yellow-500 ml-12 p-3 space-y-2", children: lineComments.map((comment) => {
                                                                                const config = commentTypeConfig[comment.commentType] || commentTypeConfig.suggestion;
                                                                                const Icon = config.icon;
                                                                                return (_jsxs("div", { className: "flex items-start gap-2 text-sm", children: [_jsx(Icon, { className: cn("w-4 h-4 flex-shrink-0 mt-0.5", config.color) }), _jsxs("div", { children: [_jsx(Badge, { variant: "warning", size: "sm", children: config.label }), _jsx("p", { className: "text-gray-200 mt-1", children: comment.comment })] })] }, comment.id));
                                                                            }) }))] }, index));
                                                            }) })] }), selectedLine !== null && (_jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 animate-fade-in", children: [_jsxs("p", { className: "text-sm font-semibold text-blue-900 mb-3", children: ["Add comment to line ", selectedLine + 1] }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex gap-2", children: Object.entries(commentTypeConfig).map(([type, config]) => {
                                                                        const Icon = config.icon;
                                                                        return (_jsxs("button", { onClick: () => setCommentType(type), className: cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all", commentType === type
                                                                                ? `${config.bg} ${config.color} border-2 border-current scale-105`
                                                                                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300"), children: [_jsx(Icon, { className: "w-4 h-4" }), config.label] }, type));
                                                                    }) }), _jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Write your comment...", className: "w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-lg text-sm custom-scrollbar focus:outline-none", rows: 3 }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: addLineComment, size: "sm", variant: "primary", icon: _jsx(Send, { className: "w-4 h-4" }), children: "Add Comment" }), _jsx(Button, { onClick: () => setSelectedLine(null), size: "sm", variant: "ghost", children: "Cancel" })] })] })] }))] })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "space-y-3", children: criteria.map((criterion, index) => {
                                            const currentScore = scores[criterion.id];
                                            const isScored = !!currentScore;
                                            return (_jsxs(Card, { variant: isScored ? "elevated" : "bordered", className: cn("animate-fade-in transition-all", isScored &&
                                                    "border-2 border-success-300 bg-success-50/50"), style: { animationDelay: `${index * 50}ms` }, children: [_jsx(CardHeader, { children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [criterion.name, criterion.isRequired && (_jsx(Badge, { variant: "danger", size: "sm", children: "Required" })), isScored && (_jsx(CheckCircle, { className: "w-5 h-5 text-success-600" }))] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: criterion.description }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Weight: ", (criterion.weight * 100).toFixed(0), "% \u2022 Max Score: ", criterion.maxScore] })] }) }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: ["Score (1-", criterion.maxScore, ")"] }), _jsx("div", { className: "flex gap-2", children: Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map((score) => (_jsx("button", { onClick: () => handleScoreChange(criterion.id, score, currentScore?.feedback || ""), className: cn("p-2 rounded-lg transition-all hover:scale-110", currentScore?.score >= score
                                                                                ? "text-warning-500"
                                                                                : "text-gray-300 hover:text-gray-400"), children: _jsx(Star, { className: "w-8 h-8", fill: currentScore?.score >= score
                                                                                    ? "currentColor"
                                                                                    : "none" }) }, score))) }), currentScore && (_jsxs("p", { className: "text-sm font-semibold text-warning-700 mt-2", children: ["Score: ", currentScore.score, " / ", criterion.maxScore] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Feedback for this criterion" }), _jsx("textarea", { value: currentScore?.feedback || "", onChange: (e) => handleScoreChange(criterion.id, currentScore?.score || 0, e.target.value), placeholder: "Explain your score...", className: "w-full px-3 py-2 border-2 border-gray-200 focus:border-primary-500 rounded-lg text-sm custom-scrollbar focus:outline-none", rows: 3 })] })] })] }, criterion.id));
                                        }) }), _jsxs(Card, { variant: "elevated", className: "backdrop-blur-md bg-white/90", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-primary-600" }), "Overall Feedback"] }) }), _jsx(CardContent, { children: _jsx("textarea", { value: overallFeedback, onChange: (e) => setOverallFeedback(e.target.value), placeholder: "Provide overall feedback on the submission...", className: "w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm custom-scrollbar focus:outline-none", rows: 6 }) }), _jsx(CardFooter, { children: _jsx(Button, { onClick: () => setShowConfirmModal(true), disabled: progress < 100 || isSubmitting, fullWidth: true, size: "lg", variant: progress === 100 ? "success" : "primary", icon: _jsx(CheckCircle, { className: "w-5 h-5" }), loading: isSubmitting, children: progress === 100
                                                        ? "Submit Review"
                                                        : `Complete ${criteria.length - Object.keys(scores).length} more criteria` }) })] })] })] })] }), _jsx(ConfirmModal, { isOpen: showConfirmModal, onClose: () => setShowConfirmModal(false), onConfirm: submitReview, title: "Submit Review?", message: "Are you sure you want to submit this review? You won't be able to edit it after submission.", confirmText: "Submit Review", variant: "primary", loading: isSubmitting }), _jsx(Modal, { isOpen: showSuccessModal, onClose: () => setShowSuccessModal(false), size: "sm", showCloseButton: false, children: _jsxs("div", { className: "text-center py-6", children: [_jsx("div", { className: "inline-flex p-6 bg-success-100 rounded-full mb-4 animate-bounce-in", children: _jsx(Award, { className: "w-16 h-16 text-success-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Review Submitted!" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Thank you for your thoughtful feedback. Your peer will benefit from your insights!" }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["\u2713 ", comments.length, " comments added"] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["\u2713 ", criteria.length, " criteria scored"] }), _jsx("p", { className: "text-sm text-gray-500", children: "\u2713 Overall feedback provided" })] })] }) })] }));
};
