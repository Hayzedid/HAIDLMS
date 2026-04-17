import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getInstructorPendingReviews, getAssessmentVivaRequests, getAssessmentStatistics, reviewVideoExplanation, waiveVivaRequest, } from '../../api/viva.api';
export default function InstructorVivaDashboard({ instructorId, assessmentId }) {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    // Review form state
    const [explanationScore, setExplanationScore] = useState(0);
    const [comprehensionLevel, setComprehensionLevel] = useState('fair');
    const [reviewNotes, setReviewNotes] = useState('');
    const [authenticityVerified, setAuthenticityVerified] = useState(false);
    const [requiresResubmit, setRequiresResubmit] = useState(false);
    // Filter state
    const [statusFilter, setStatusFilter] = useState('submitted');
    useEffect(() => {
        loadData();
    }, [instructorId, assessmentId, statusFilter]);
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (assessmentId) {
                // Load assessment-specific data
                const [requests, stats] = await Promise.all([
                    getAssessmentVivaRequests(assessmentId, statusFilter),
                    getAssessmentStatistics(assessmentId),
                ]);
                setPendingReviews(requests);
                setStatistics(stats);
            }
            else {
                // Load instructor's pending reviews
                const requests = await getInstructorPendingReviews(50);
                setPendingReviews(requests.filter((r) => r.status === 'submitted'));
            }
        }
        catch (err) {
            console.error('[InstructorVivaDashboard] Error loading data:', err);
            setError(err.message || 'Failed to load viva requests');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSelectRequest = (request) => {
        setSelectedRequest(request);
        setExplanationScore(request.explanationScore || 0);
        setComprehensionLevel(request.comprehensionLevel || 'fair');
        setReviewNotes(request.reviewNotes || '');
        setAuthenticityVerified(request.authenticityVerified || false);
        setRequiresResubmit(request.requiresResubmit || false);
    };
    const handleSubmitReview = async () => {
        if (!selectedRequest)
            return;
        if (explanationScore < 0 || explanationScore > 100) {
            alert('Score must be between 0 and 100');
            return;
        }
        if (!reviewNotes.trim()) {
            alert('Please provide review notes');
            return;
        }
        setIsSubmitting(true);
        try {
            await reviewVideoExplanation(selectedRequest.id, {
                explanationScore,
                comprehensionLevel,
                reviewNotes,
                authenticityVerified,
                requiresResubmit,
            });
            alert('✅ Review submitted successfully!');
            // Reload data
            loadData();
            setSelectedRequest(null);
            resetForm();
        }
        catch (err) {
            console.error('[InstructorVivaDashboard] Error submitting review:', err);
            alert('Failed to submit review');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleWaive = async () => {
        if (!selectedRequest)
            return;
        const reason = prompt('Enter reason for waiving this requirement:');
        if (!reason)
            return;
        setIsSubmitting(true);
        try {
            await waiveVivaRequest(selectedRequest.id, reason);
            alert('✅ Requirement waived successfully!');
            // Reload data
            loadData();
            setSelectedRequest(null);
            resetForm();
        }
        catch (err) {
            console.error('[InstructorVivaDashboard] Error waiving request:', err);
            alert('Failed to waive requirement');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const resetForm = () => {
        setExplanationScore(0);
        setComprehensionLevel('fair');
        setReviewNotes('');
        setAuthenticityVerified(false);
        setRequiresResubmit(false);
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return '#22c55e';
        if (score >= 60)
            return '#eab308';
        return '#ef4444';
    };
    const getComprehensionColor = (level) => {
        switch (level) {
            case 'excellent': return '#22c55e';
            case 'good': return '#84cc16';
            case 'fair': return '#eab308';
            case 'poor': return '#ef4444';
            default: return '#64748b';
        }
    };
    if (isLoading) {
        return (_jsxs("div", { style: { padding: '3rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '1rem' }, children: "\uD83C\uDFA5" }), _jsx("div", { style: { fontSize: '18px', color: '#64748b' }, children: "Loading viva requests..." })] }));
    }
    if (error) {
        return (_jsxs("div", { style: {
                padding: '2rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
            }, children: [_jsx("strong", { children: "Error:" }), " ", error] }));
    }
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }, children: [_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h1", { style: { marginBottom: '0.5rem' }, children: "\uD83C\uDFA5 Code Explanation Reviews" }), _jsx("p", { style: { color: '#64748b' }, children: "Review student video explanations and verify code authorship" }), _jsx("button", { onClick: loadData, style: {
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }, children: "\uD83D\uDD04 Refresh" })] }), statistics && (_jsxs("div", { style: {
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }, children: [_jsx("h2", { style: { marginBottom: '1.5rem' }, children: "\uD83D\uDCCA Assessment Statistics" }), _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1.5rem',
                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Total Requests" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }, children: statistics.totalRequests })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Submitted" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }, children: statistics.totalSubmitted })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Graded" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }, children: statistics.totalGraded })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Expired" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }, children: statistics.totalExpired })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Avg Submission Time" }), _jsxs("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }, children: [Math.round(statistics.avgSubmissionHours), "h"] })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Avg Score" }), _jsxs("div", { style: {
                                            fontSize: '32px',
                                            fontWeight: 'bold',
                                            color: getScoreColor(statistics.avgExplanationScore),
                                        }, children: [Math.round(statistics.avgExplanationScore), "%"] })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "Authenticity Verified" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }, children: statistics.authenticityVerifiedCount })] })] })] })), assessmentId && (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("label", { style: { marginRight: '1rem', fontWeight: '500' }, children: "Filter by status:" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), style: {
                            padding: '0.5rem 1rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '14px',
                        }, children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "submitted", children: "Submitted" }), _jsx("option", { value: "under_review", children: "Under Review" }), _jsx("option", { value: "graded", children: "Graded" }), _jsx("option", { value: "expired", children: "Expired" }), _jsx("option", { value: "waived", children: "Waived" })] })] })), pendingReviews.length === 0 ? (_jsxs("div", { style: {
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '4rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }, children: [_jsx("div", { style: { fontSize: '64px', marginBottom: '1rem' }, children: "\u2705" }), _jsx("h2", { style: { marginBottom: '0.5rem' }, children: "No Pending Reviews" }), _jsx("p", { style: { color: '#64748b' }, children: "All video explanations have been reviewed." })] })) : selectedRequest ? (
            /* Review Interface */
            _jsxs("div", { style: {
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }, children: [_jsx("div", { style: { marginBottom: '2rem' }, children: _jsx("button", { onClick: () => setSelectedRequest(null), style: {
                                padding: '0.5rem 1rem',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }, children: "\u2190 Back to List" }) }), _jsx("h2", { style: { marginBottom: '1rem' }, children: "Review Video Explanation" }), _jsxs("div", { style: {
                            padding: '1.5rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                        }, children: [_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Student ID:" }), " ", selectedRequest.userId] }), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Submission ID:" }), " ", selectedRequest.submissionId] }), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Selection Type:" }), " ", selectedRequest.selectionType] }), selectedRequest.reason && (_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Reason:" }), " ", selectedRequest.reason] })), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Submitted:" }), " ", selectedRequest.submittedAt ? new Date(selectedRequest.submittedAt).toLocaleString() : 'N/A'] }), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Duration:" }), " ", selectedRequest.videoDurationSeconds ? Math.floor(selectedRequest.videoDurationSeconds / 60) : 0, " minutes"] }), selectedRequest.isLate && (_jsx("div", { style: { color: '#ef4444', fontWeight: 'bold' }, children: "\u26A0\uFE0F LATE SUBMISSION" }))] }), selectedRequest.studentNotes && (_jsxs("div", { style: {
                            padding: '1.5rem',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                        }, children: [_jsx("h4", { style: { marginTop: 0 }, children: "Student Notes:" }), _jsx("p", { style: { margin: 0 }, children: selectedRequest.studentNotes })] })), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h4", { children: "Video Explanation" }), selectedRequest.videoUrl ? (_jsx("video", { src: selectedRequest.videoUrl, controls: true, style: {
                                    width: '100%',
                                    maxWidth: '800px',
                                    borderRadius: '8px',
                                    backgroundColor: '#000',
                                } })) : (_jsx("div", { style: {
                                    padding: '3rem',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: '#64748b',
                                }, children: "No video URL available" }))] }), selectedRequest.videoTranscript && (_jsxs("div", { style: {
                            padding: '1.5rem',
                            backgroundColor: '#fefce8',
                            border: '1px solid #fef08a',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                        }, children: [_jsx("h4", { style: { marginTop: 0 }, children: "Auto-Generated Transcript:" }), _jsx("p", { style: { margin: 0, fontSize: '14px', lineHeight: '1.6' }, children: selectedRequest.videoTranscript })] })), _jsxs("div", { style: {
                            padding: '2rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                        }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Submit Review" }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }, children: "Explanation Score (0-100)" }), _jsx("input", { type: "number", min: "0", max: "100", value: explanationScore, onChange: (e) => setExplanationScore(parseInt(e.target.value) || 0), style: {
                                            width: '150px',
                                            padding: '0.75rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                        } }), _jsxs("div", { style: {
                                            marginTop: '0.5rem',
                                            fontSize: '14px',
                                            color: getScoreColor(explanationScore),
                                            fontWeight: 'bold',
                                        }, children: [explanationScore >= 80 && '✅ Excellent', explanationScore >= 60 && explanationScore < 80 && '⚠️ Good', explanationScore < 60 && '❌ Needs Improvement'] })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }, children: "Comprehension Level" }), _jsxs("select", { value: comprehensionLevel, onChange: (e) => setComprehensionLevel(e.target.value), style: {
                                            padding: '0.75rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            width: '200px',
                                        }, children: [_jsx("option", { value: "poor", children: "Poor" }), _jsx("option", { value: "fair", children: "Fair" }), _jsx("option", { value: "good", children: "Good" }), _jsx("option", { value: "excellent", children: "Excellent" })] })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }, children: "Review Notes *" }), _jsx("textarea", { value: reviewNotes, onChange: (e) => setReviewNotes(e.target.value), rows: 6, style: {
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                        }, placeholder: "Provide detailed feedback on the student's explanation..." })] }), _jsx("div", { style: { marginBottom: '1.5rem' }, children: _jsxs("label", { style: { display: 'flex', alignItems: 'center', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: authenticityVerified, onChange: (e) => setAuthenticityVerified(e.target.checked), style: { marginRight: '0.75rem', width: '20px', height: '20px', cursor: 'pointer' } }), _jsx("span", { style: { fontWeight: 'bold' }, children: "Authenticity Verified - Student demonstrated genuine understanding" })] }) }), _jsx("div", { style: { marginBottom: '1.5rem' }, children: _jsxs("label", { style: { display: 'flex', alignItems: 'center', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: requiresResubmit, onChange: (e) => setRequiresResubmit(e.target.checked), style: { marginRight: '0.75rem', width: '20px', height: '20px', cursor: 'pointer' } }), _jsx("span", { style: { fontWeight: 'bold', color: '#ef4444' }, children: "Requires Resubmission - Explanation was insufficient" })] }) })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("button", { onClick: handleSubmitReview, disabled: isSubmitting || !reviewNotes.trim(), style: {
                                    padding: '1rem 2rem',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: isSubmitting || !reviewNotes.trim() ? '#94a3b8' : '#2da44e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isSubmitting || !reviewNotes.trim() ? 'not-allowed' : 'pointer',
                                }, children: isSubmitting ? 'Submitting...' : '✅ Submit Review' }), _jsx("button", { onClick: handleWaive, disabled: isSubmitting, style: {
                                    padding: '1rem 2rem',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    backgroundColor: isSubmitting ? '#94a3b8' : '#eab308',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                }, children: "Waive Requirement" })] })] })) : (
            /* Requests List */
            _jsxs("div", { style: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                }, children: [_jsx("div", { style: {
                            padding: '1.5rem',
                            backgroundColor: '#1e293b',
                            color: 'white',
                        }, children: _jsxs("h3", { style: { margin: 0 }, children: ["\uD83D\uDCCB Submissions Needing Review (", pendingReviews.length, ")"] }) }), _jsx("div", { children: pendingReviews.map((request) => (_jsx("div", { style: {
                                padding: '1.5rem',
                                borderBottom: '1px solid #e2e8f0',
                            }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px' }, children: request.userId }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }, children: ["Submitted: ", request.submittedAt ? new Date(request.submittedAt).toLocaleString() : 'N/A'] }), _jsxs("div", { style: { fontSize: '14px', marginBottom: '0.5rem' }, children: ["Duration: ", request.videoDurationSeconds ? Math.floor(request.videoDurationSeconds / 60) : 0, " minutes"] }), request.selectionType === 'flagged' && (_jsx("div", { style: { fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }, children: "\uD83D\uDEA9 Flagged for Plagiarism" })), request.isLate && (_jsx("div", { style: { fontSize: '13px', color: '#f59e0b', fontStyle: 'italic' }, children: "\u26A0\uFE0F Late Submission" }))] }), _jsx("button", { onClick: () => handleSelectRequest(request), style: {
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                        }, children: "\uD83C\uDFA5 Review Video" })] }) }, request.id))) })] }))] }));
}
