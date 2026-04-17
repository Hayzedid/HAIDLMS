import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { clipboardKeystrokeApi, } from '../../api/clipboard-keystroke.api';
export const IntegrityReviewDashboard = ({ assessmentId }) => {
    const [flags, setFlags] = useState([]);
    const [selectedFlag, setSelectedFlag] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [clipboardAttempts, setClipboardAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterReviewed, setFilterReviewed] = useState('unreviewed');
    // Review form
    const [reviewNotes, setReviewNotes] = useState('');
    const [actionTaken, setActionTaken] = useState('no_action');
    useEffect(() => {
        loadFlags();
    }, [assessmentId, filterSeverity, filterReviewed]);
    const loadFlags = async () => {
        try {
            setIsLoading(true);
            const params = {};
            if (assessmentId)
                params.assessmentId = assessmentId;
            if (filterSeverity !== 'all')
                params.severity = filterSeverity;
            if (filterReviewed === 'reviewed')
                params.reviewed = true;
            if (filterReviewed === 'unreviewed')
                params.reviewed = false;
            const flagsData = await clipboardKeystrokeApi.getIntegrityFlags(params);
            setFlags(flagsData);
        }
        catch (err) {
            setError(err.message || 'Failed to load flags');
        }
        finally {
            setIsLoading(false);
        }
    };
    const viewFlagDetails = async (flag) => {
        try {
            setSelectedFlag(flag);
            const [session, attempts] = await Promise.all([
                clipboardKeystrokeApi.getKeystrokeSession(flag.sessionId),
                clipboardKeystrokeApi.getSessionAttempts(flag.sessionId),
            ]);
            setSessionData(session);
            setClipboardAttempts(attempts);
        }
        catch (err) {
            setError(err.message || 'Failed to load session details');
        }
    };
    const submitReview = async () => {
        if (!selectedFlag || !reviewNotes.trim()) {
            setError('Please provide review notes');
            return;
        }
        try {
            await clipboardKeystrokeApi.reviewIntegrityFlag(selectedFlag.id, {
                reviewNotes,
                actionTaken,
            });
            // Refresh flags list
            await loadFlags();
            // Close modal
            setSelectedFlag(null);
            setSessionData(null);
            setClipboardAttempts([]);
            setReviewNotes('');
            setActionTaken('no_action');
        }
        catch (err) {
            setError(err.message || 'Failed to submit review');
        }
    };
    const getSeverityBadge = (severity) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800',
        };
        return colors[severity] || colors.low;
    };
    const getSeverityIcon = (severity) => {
        const icons = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🔴',
            critical: '🚨',
        };
        return icons[severity] || 'ℹ️';
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-4", children: "Integrity Review Dashboard" }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Severity" }), _jsx("div", { className: "flex space-x-2", children: ['all', 'critical', 'high', 'medium', 'low'].map(severity => (_jsx("button", { onClick: () => setFilterSeverity(severity), className: `px-3 py-1 rounded-lg text-sm font-semibold transition ${filterSeverity === severity
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1) }, severity))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsx("div", { className: "flex space-x-2", children: ['all', 'unreviewed', 'reviewed'].map(status => (_jsx("button", { onClick: () => setFilterReviewed(status), className: `px-3 py-1 rounded-lg text-sm font-semibold transition ${filterReviewed === status
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1) }, status))) })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: ["Integrity Flags (", flags.length, ")"] }), flags.length === 0 ? (_jsx("p", { className: "text-center text-gray-600 py-8", children: "No integrity flags found \uD83C\uDF89" })) : (_jsx("div", { className: "space-y-3", children: flags.map(flag => (_jsx("div", { className: `border rounded-lg p-4 transition ${flag.reviewed
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-orange-200 bg-orange-50'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("span", { className: "text-2xl", children: getSeverityIcon(flag.severity) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(flag.severity)}`, children: flag.severity.toUpperCase() }), _jsx("span", { className: "text-sm font-semibold text-gray-800", children: flag.flagType.replace(/_/g, ' ').toUpperCase() }), flag.reviewed && (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold", children: "\u2713 Reviewed" }))] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: flag.description })] })] }), _jsxs("div", { className: "text-xs text-gray-500 space-y-1 mt-2", children: [_jsxs("p", { children: ["Session: ", flag.sessionId.slice(0, 8), "..."] }), _jsxs("p", { children: ["Flagged: ", new Date(flag.createdAt).toLocaleString()] }), flag.reviewed && flag.reviewedBy && (_jsxs("p", { children: ["Reviewed by: ", flag.reviewedBy.slice(0, 8), "... at ", new Date(flag.reviewedAt).toLocaleString()] }))] }), flag.reviewed && flag.reviewNotes && (_jsxs("div", { className: "mt-2 p-2 bg-white border border-gray-200 rounded text-sm", children: [_jsx("p", { className: "font-semibold text-gray-700", children: "Review Notes:" }), _jsx("p", { className: "text-gray-600 mt-1", children: flag.reviewNotes }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Action: ", flag.actionTaken] })] }))] }), !flag.reviewed && (_jsx("button", { onClick: () => viewFlagDetails(flag), className: "ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition", children: "Review" }))] }) }, flag.id))) }))] }), selectedFlag && sessionData && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-gray-800", children: "Review Integrity Flag" }), _jsx("button", { onClick: () => {
                                            setSelectedFlag(null);
                                            setSessionData(null);
                                            setClipboardAttempts([]);
                                        }, className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("span", { className: "text-2xl", children: getSeverityIcon(selectedFlag.severity) }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(selectedFlag.severity)}`, children: selectedFlag.severity.toUpperCase() }), _jsx("span", { className: "font-semibold text-gray-800", children: selectedFlag.flagType.replace(/_/g, ' ').toUpperCase() })] }), _jsx("p", { className: "text-sm text-gray-800", children: selectedFlag.description }), selectedFlag.evidence && (_jsxs("details", { className: "mt-2 text-xs", children: [_jsx("summary", { className: "cursor-pointer font-semibold", children: "Evidence" }), _jsx("pre", { className: "mt-1 p-2 bg-white rounded text-gray-700 overflow-x-auto", children: JSON.stringify(selectedFlag.evidence, null, 2) })] }))] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Total Keystrokes" }), _jsx("p", { className: "text-lg font-bold text-gray-800", children: sessionData.totalKeystrokes })] }), _jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Typing Speed" }), _jsxs("p", { className: "text-lg font-bold text-gray-800", children: [sessionData.avgTypingSpeedWPM?.toFixed(0) || 'N/A', " WPM"] })] }), _jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Paste Attempts" }), _jsx("p", { className: "text-lg font-bold text-gray-800", children: sessionData.totalPasteAttempts })] }), _jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Suspicious Bursts" }), _jsx("p", { className: "text-lg font-bold text-gray-800", children: sessionData.hasSuspiciousBurst ? 'Yes' : 'No' })] })] }), clipboardAttempts.length > 0 && (_jsxs("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsxs("h4", { className: "font-semibold text-gray-800 mb-2", children: ["Clipboard Attempts (", clipboardAttempts.length, ")"] }), _jsxs("div", { className: "space-y-1 text-sm", children: [clipboardAttempts.slice(0, 5).map((attempt, idx) => (_jsxs("div", { className: "flex justify-between text-gray-700", children: [_jsx("span", { children: attempt.attemptType.toUpperCase() }), _jsx("span", { children: attempt.blocked ? '🚫 Blocked' : '✅ Allowed' }), _jsx("span", { className: "text-xs text-gray-500", children: new Date(attempt.createdAt).toLocaleTimeString() })] }, idx))), clipboardAttempts.length > 5 && (_jsxs("p", { className: "text-xs text-gray-500 text-center mt-2", children: ["...and ", clipboardAttempts.length - 5, " more"] }))] })] })), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-semibold text-gray-800 mb-3", children: "Your Review" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Action Taken" }), _jsxs("select", { value: actionTaken, onChange: (e) => setActionTaken(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "no_action", children: "No Action - False Positive" }), _jsx("option", { value: "warning_issued", children: "Warning Issued" }), _jsx("option", { value: "grade_penalty", children: "Grade Penalty Applied" }), _jsx("option", { value: "academic_integrity_violation", children: "Academic Integrity Violation" }), _jsx("option", { value: "requires_further_investigation", children: "Requires Further Investigation" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Review Notes *" }), _jsx("textarea", { value: reviewNotes, onChange: (e) => setReviewNotes(e.target.value), placeholder: "Explain your decision and any actions taken...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg", rows: 4 })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: submitReview, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition", children: "Submit Review" }), _jsx("button", { onClick: () => {
                                                                    setSelectedFlag(null);
                                                                    setSessionData(null);
                                                                    setClipboardAttempts([]);
                                                                }, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition", children: "Cancel" })] })] })] })] })] }) }) }))] }));
};
