import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { peerReviewApi, } from '../../api/peer-review.api';
export const PeerReviewInterface = ({ reviewId, submissionCode, submissionLanguage, onReviewSubmitted, }) => {
    const [review, setReview] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [scores, setScores] = useState({});
    const [comments, setComments] = useState([]);
    const [overallFeedback, setOverallFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [startTime] = useState(Date.now());
    // For adding line comments
    const [selectedLine, setSelectedLine] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState('suggestion');
    const codeLines = submissionCode.split('\n');
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
            if (reviewData.status === 'pending') {
                await peerReviewApi.startReview(reviewId);
                setReview({ ...reviewData, status: 'in_progress' });
            }
        }
        catch (err) {
            setError(err.message || 'Failed to load review data');
        }
    };
    const handleScoreChange = (criterionId, score, feedback) => {
        setScores(prev => ({
            ...prev,
            [criterionId]: { score, feedback },
        }));
    };
    const addLineComment = async () => {
        if (!newComment.trim() || selectedLine === null)
            return;
        try {
            const comment = await peerReviewApi.addComment(reviewId, {
                lineNumber: selectedLine + 1, // Convert to 1-indexed
                codeSnippet: codeLines[selectedLine],
                comment: newComment,
                commentType,
            });
            setComments(prev => [...prev, comment]);
            setNewComment('');
            setSelectedLine(null);
        }
        catch (err) {
            setError(err.message || 'Failed to add comment');
        }
    };
    const submitReview = async () => {
        // Validate all required criteria are scored
        const missingScores = criteria
            .filter(c => c.isRequired && !scores[c.id])
            .map(c => c.name);
        if (missingScores.length > 0) {
            setError(`Please score all required criteria: ${missingScores.join(', ')}`);
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            // Submit criterion scores
            for (const [criterionId, { score, feedback }] of Object.entries(scores)) {
                await peerReviewApi.submitCriterionScore(reviewId, {
                    criterionId,
                    score,
                    feedback,
                });
            }
            // Submit overall review
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            await peerReviewApi.submitReview(reviewId, {
                overallFeedback,
                timeSpentSeconds: timeSpent,
            });
            if (onReviewSubmitted)
                onReviewSubmitted();
        }
        catch (err) {
            setError(err.message || 'Failed to submit review');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!review) {
        return _jsx("div", { className: "text-center py-8", children: "Loading review..." });
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Code Review" }), _jsx("p", { className: "text-gray-600", children: "Review the code carefully and provide constructive feedback using the rubric below." }), error && (_jsx("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Submitted Code" }), _jsx("div", { className: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto", children: codeLines.map((line, idx) => (_jsxs("div", { className: `flex hover:bg-gray-800 ${selectedLine === idx ? 'bg-blue-900' : ''}`, onClick: () => setSelectedLine(idx), children: [_jsx("span", { className: "text-gray-500 select-none w-12 text-right pr-4", children: idx + 1 }), _jsx("span", { className: "flex-1", children: line || ' ' }), comments.filter(c => c.lineNumber === idx + 1).length > 0 && (_jsx("span", { className: "text-yellow-400 ml-2", children: "\uD83D\uDCAC" }))] }, idx))) }), selectedLine !== null && (_jsxs("div", { className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("h4", { className: "font-semibold mb-2", children: ["Add Comment to Line ", selectedLine + 1] }), _jsxs("select", { value: commentType, onChange: (e) => setCommentType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg mb-2", children: [_jsx("option", { value: "suggestion", children: "\uD83D\uDCA1 Suggestion" }), _jsx("option", { value: "question", children: "\u2753 Question" }), _jsx("option", { value: "praise", children: "\uD83D\uDC4D Praise" }), _jsx("option", { value: "issue", children: "\u26A0\uFE0F Issue" })] }), _jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Write your comment...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg", rows: 3 }), _jsxs("div", { className: "flex justify-end space-x-2 mt-2", children: [_jsx("button", { onClick: () => setSelectedLine(null), className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg", children: "Cancel" }), _jsx("button", { onClick: addLineComment, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Add Comment" })] })] })), comments.length > 0 && (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("h4", { className: "font-semibold", children: ["Your Comments (", comments.length, ")"] }), comments.map(comment => (_jsxs("div", { className: "p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("span", { className: "font-mono text-gray-600", children: ["Line ", comment.lineNumber] }), _jsx("span", { className: "text-xs px-2 py-1 bg-white rounded", children: comment.commentType })] }), _jsx("p", { className: "mt-1 text-gray-700", children: comment.comment })] }, comment.id)))] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Evaluation Criteria" }), _jsx("div", { className: "space-y-6", children: criteria.map(criterion => (_jsxs("div", { className: "pb-6 border-b border-gray-200 last:border-0", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-800", children: criterion.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: criterion.description }), criterion.examples && (_jsxs("p", { className: "text-xs text-gray-500 mt-1 italic", children: ["Examples: ", criterion.examples] }))] }), _jsxs("span", { className: "text-xs text-gray-500", children: ["Weight: ", criterion.weight, "x"] })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "flex space-x-2 mb-2", children: Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(score => (_jsxs("button", { onClick: () => handleScoreChange(criterion.id, score, scores[criterion.id]?.feedback || ''), className: `flex-1 py-2 px-3 rounded-lg font-semibold transition ${scores[criterion.id]?.score === score
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [score, criterion.scoreLabels?.[score] && (_jsx("span", { className: "block text-xs font-normal mt-1", children: criterion.scoreLabels[score] }))] }, score))) }), _jsx("textarea", { value: scores[criterion.id]?.feedback || '', onChange: (e) => handleScoreChange(criterion.id, scores[criterion.id]?.score || 0, e.target.value), placeholder: "Explain your score...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", rows: 2 })] })] }, criterion.id))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Overall Feedback" }), _jsx("textarea", { value: overallFeedback, onChange: (e) => setOverallFeedback(e.target.value), placeholder: "Provide overall feedback on the submission...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg", rows: 6 })] }), _jsx("button", { onClick: submitReview, disabled: isSubmitting, className: "w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 transition", children: isSubmitting ? 'Submitting Review...' : 'Submit Review' })] })] })] }));
};
