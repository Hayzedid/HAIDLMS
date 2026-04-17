import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getFlaggedSubmissions, getMatches, updateReview, triggerMossCheck, getMossReportUrl, getAssessmentStats, } from '../../api/plagiarism.api';
import CodeComparison from './CodeComparison';
export default function PlagiarismDashboard({ assessmentId, instructorId, showStats = true, }) {
    const [submissions, setSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewStatus, setReviewStatus] = useState('clean');
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [mossChecking, setMossChecking] = useState(false);
    useEffect(() => {
        loadData();
    }, [assessmentId]);
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Load flagged submissions
            const flaggedSubs = await getFlaggedSubmissions(100);
            setSubmissions(flaggedSubs);
            // Load assessment stats if assessmentId provided
            if (assessmentId && showStats) {
                const assessmentStats = await getAssessmentStats(assessmentId);
                setStats(assessmentStats);
            }
        }
        catch (err) {
            console.error('[PlagiarismDashboard] Error loading data:', err);
            setError(err.message || 'Failed to load plagiarism data');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSelectSubmission = async (submission) => {
        setSelectedSubmission(submission);
        setSelectedMatch(null);
        setReviewNotes(submission.reviewNotes || '');
        setReviewStatus(submission.plagiarismStatus);
        // Load matches for this submission
        try {
            const submissionMatches = await getMatches(submission.id);
            setMatches(submissionMatches);
            // Auto-select first match if available
            if (submissionMatches.length > 0) {
                setSelectedMatch(submissionMatches[0]);
            }
        }
        catch (err) {
            console.error('[PlagiarismDashboard] Error loading matches:', err);
        }
    };
    const handleSaveReview = async () => {
        if (!selectedSubmission)
            return;
        setIsSavingReview(true);
        try {
            await updateReview(selectedSubmission.id, {
                reviewedBy: instructorId,
                reviewNotes,
                plagiarismStatus: reviewStatus,
            });
            // Update local state
            setSubmissions((prev) => prev.map((sub) => sub.id === selectedSubmission.id
                ? {
                    ...sub,
                    reviewedBy: instructorId,
                    reviewNotes,
                    plagiarismStatus: reviewStatus,
                    reviewedAt: new Date().toISOString(),
                }
                : sub));
            alert('Review saved successfully');
        }
        catch (err) {
            console.error('[PlagiarismDashboard] Error saving review:', err);
            alert('Failed to save review');
        }
        finally {
            setIsSavingReview(false);
        }
    };
    const handleTriggerMoss = async () => {
        if (!assessmentId) {
            alert('Assessment ID is required to trigger MOSS check');
            return;
        }
        const problemId = prompt('Enter Problem ID:');
        if (!problemId)
            return;
        setMossChecking(true);
        try {
            await triggerMossCheck(assessmentId, problemId);
            alert('MOSS check initiated. This may take several minutes. Refresh to see results.');
        }
        catch (err) {
            console.error('[PlagiarismDashboard] Error triggering MOSS:', err);
            alert('Failed to trigger MOSS check');
        }
        finally {
            setMossChecking(false);
        }
    };
    const handleViewMossReport = async () => {
        if (!selectedSubmission)
            return;
        try {
            const reportUrl = await getMossReportUrl(selectedSubmission.id);
            window.open(reportUrl, '_blank');
        }
        catch (err) {
            alert('MOSS report not available for this submission');
        }
    };
    const getSeverityBadge = (status) => {
        const colors = {
            pending: '#94a3b8',
            clean: '#10b981',
            suspicious: '#fbbf24',
            plagiarized: '#dc2626',
            under_review: '#3b82f6',
        };
        return (_jsx("span", { style: {
                padding: '0.25rem 0.75rem',
                backgroundColor: colors[status] + '20',
                color: colors[status],
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
            }, children: status.replace('_', ' ') }));
    };
    if (isLoading) {
        return (_jsxs("div", { style: { padding: '2rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '1rem' }, children: "\uD83D\uDD0D" }), _jsx("div", { style: { fontSize: '18px', color: '#64748b' }, children: "Loading plagiarism data..." })] }));
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
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }, children: [_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h1", { style: { marginBottom: '0.5rem' }, children: "Plagiarism Detection Dashboard" }), _jsx("p", { style: { color: '#64748b', marginBottom: '1rem' }, children: "Review flagged submissions and manage plagiarism cases" }), _jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("button", { onClick: loadData, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }, children: "\uD83D\uDD04 Refresh" }), assessmentId && (_jsx("button", { onClick: handleTriggerMoss, disabled: mossChecking, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: mossChecking ? '#94a3b8' : '#2da44e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: mossChecking ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                }, children: mossChecking ? '⏳ Running MOSS...' : '🔬 Run MOSS Check' }))] })] }), showStats && stats && (_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                }, children: [_jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }, children: stats.total_submissions }), _jsx("div", { style: { fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }, children: "Total Submissions" })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }, children: stats.confirmed_plagiarism }), _jsx("div", { style: { fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }, children: "Confirmed Plagiarism" })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }, children: stats.suspicious_submissions }), _jsx("div", { style: { fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }, children: "Suspicious" })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }, children: stats.plagiarism_rate }), _jsx("div", { style: { fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }, children: "Plagiarism Rate" })] })] })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }, children: [_jsx("div", { children: _jsxs("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                            }, children: [_jsxs("div", { style: {
                                        padding: '1rem 1.5rem',
                                        backgroundColor: '#1e293b',
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }, children: ["Flagged Submissions (", submissions.length, ")"] }), _jsx("div", { style: { maxHeight: '600px', overflowY: 'auto' }, children: submissions.length === 0 ? (_jsx("div", { style: { padding: '2rem', textAlign: 'center', color: '#64748b' }, children: "No flagged submissions found" })) : (submissions.map((sub) => (_jsxs("div", { onClick: () => handleSelectSubmission(sub), style: {
                                            padding: '1rem 1.5rem',
                                            borderBottom: '1px solid #e2e8f0',
                                            cursor: 'pointer',
                                            backgroundColor: selectedSubmission?.id === sub.id ? '#f0f9ff' : 'white',
                                        }, children: [_jsxs("div", { style: {
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '0.5rem',
                                                }, children: [_jsx("strong", { style: { fontSize: '14px' }, children: sub.fileName || 'Untitled' }), getSeverityBadge(sub.plagiarismStatus)] }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }, children: ["User ID: ", sub.userId.substring(0, 8), "..."] }), sub.similarityScore !== undefined && (_jsxs("div", { style: {
                                                    fontSize: '13px',
                                                    fontWeight: 'bold',
                                                    color: sub.similarityScore >= 0.9
                                                        ? '#dc2626'
                                                        : sub.similarityScore >= 0.75
                                                            ? '#f59e0b'
                                                            : '#fbbf24',
                                                }, children: ["Similarity: ", (sub.similarityScore * 100).toFixed(0), "%"] })), sub.reviewedBy && (_jsx("div", { style: {
                                                    fontSize: '12px',
                                                    color: '#10b981',
                                                    marginTop: '0.25rem',
                                                }, children: "\u2713 Reviewed" }))] }, sub.id)))) })] }) }), _jsx("div", { children: !selectedSubmission ? (_jsxs("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                padding: '3rem',
                                textAlign: 'center',
                            }, children: [_jsx("div", { style: { fontSize: '64px', marginBottom: '1rem' }, children: "\uD83D\uDC48" }), _jsx("div", { style: { fontSize: '18px', color: '#64748b' }, children: "Select a submission to view details" })] })) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { style: {
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        padding: '1.5rem',
                                    }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Submission Details" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }, children: "Status" }), getSeverityBadge(selectedSubmission.plagiarismStatus)] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }, children: "Similarity Score" }), _jsx("div", { style: { fontWeight: 'bold' }, children: selectedSubmission.similarityScore
                                                                ? (selectedSubmission.similarityScore * 100).toFixed(1) + '%'
                                                                : 'N/A' })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }, children: "Language" }), _jsx("div", { children: selectedSubmission.language })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }, children: "Submitted At" }), _jsx("div", { children: new Date(selectedSubmission.submittedAt).toLocaleString() })] })] }), selectedSubmission.mossReportUrl && (_jsx("button", { onClick: handleViewMossReport, style: {
                                                marginTop: '1rem',
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '500',
                                            }, children: "View MOSS Report" }))] }), matches.length > 0 && (_jsxs("div", { style: {
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        padding: '1.5rem',
                                    }, children: [_jsxs("h3", { style: { marginTop: 0 }, children: ["Similar Submissions (", matches.length, ")"] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: matches.map((match) => (_jsx("div", { onClick: () => setSelectedMatch(match), style: {
                                                    padding: '1rem',
                                                    backgroundColor: selectedMatch?.id === match.id ? '#f0f9ff' : '#f8fafc',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    border: selectedMatch?.id === match.id
                                                        ? '2px solid #3b82f6'
                                                        : '1px solid #e2e8f0',
                                                }, children: _jsxs("div", { style: {
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 'bold', marginBottom: '0.25rem' }, children: ["User ", match.user2_id.substring(0, 8), "..."] }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b' }, children: [match.matching_lines, " of ", match.total_lines, " lines matched"] })] }), _jsxs("div", { style: {
                                                                fontSize: '24px',
                                                                fontWeight: 'bold',
                                                                color: match.similarity_score >= 0.9
                                                                    ? '#dc2626'
                                                                    : match.similarity_score >= 0.75
                                                                        ? '#f59e0b'
                                                                        : '#fbbf24',
                                                            }, children: [(match.similarity_score * 100).toFixed(0), "%"] })] }) }, match.id))) })] })), selectedMatch && (_jsx(CodeComparison, { code1: selectedMatch.code1, code2: selectedMatch.code2, fileName1: `User ${selectedMatch.user1_id.substring(0, 8)}`, fileName2: `User ${selectedMatch.user2_id.substring(0, 8)}`, language: selectedSubmission.language, similarityScore: selectedMatch.similarity_score, matchingLines: selectedMatch.matching_lines, totalLines: selectedMatch.total_lines })), _jsxs("div", { style: {
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        padding: '1.5rem',
                                    }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Instructor Review" }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' }, children: "Status" }), _jsxs("select", { value: reviewStatus, onChange: (e) => setReviewStatus(e.target.value), style: {
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                    }, children: [_jsx("option", { value: "clean", children: "Clean" }), _jsx("option", { value: "suspicious", children: "Suspicious" }), _jsx("option", { value: "plagiarized", children: "Plagiarized" }), _jsx("option", { value: "under_review", children: "Under Review" })] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: '500' }, children: "Review Notes" }), _jsx("textarea", { value: reviewNotes, onChange: (e) => setReviewNotes(e.target.value), rows: 4, style: {
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        fontFamily: 'inherit',
                                                        resize: 'vertical',
                                                    }, placeholder: "Enter your review notes here..." })] }), _jsx("button", { onClick: handleSaveReview, disabled: isSavingReview, style: {
                                                padding: '0.75rem 2rem',
                                                backgroundColor: isSavingReview ? '#94a3b8' : '#2da44e',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: isSavingReview ? 'not-allowed' : 'pointer',
                                                fontWeight: '500',
                                                width: '100%',
                                            }, children: isSavingReview ? 'Saving...' : 'Save Review' }), selectedSubmission.reviewedBy && (_jsxs("div", { style: {
                                                marginTop: '1rem',
                                                padding: '1rem',
                                                backgroundColor: '#f0fdf4',
                                                border: '1px solid #bbf7d0',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                            }, children: [_jsxs("div", { style: { fontWeight: 'bold', marginBottom: '0.25rem' }, children: ["Last reviewed by: ", selectedSubmission.reviewedBy.substring(0, 8), "..."] }), selectedSubmission.reviewedAt && (_jsx("div", { style: { color: '#64748b' }, children: new Date(selectedSubmission.reviewedAt).toLocaleString() }))] }))] })] })) })] })] }));
}
