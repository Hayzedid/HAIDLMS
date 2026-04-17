import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { getStudentPendingRequests, getStudentOverdueRequests, submitVideoExplanation, } from '../../api/viva.api';
export default function StudentVivaDashboard({ userId, onVideoRecorded }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [overdueRequests, setOverdueRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [studentNotes, setStudentNotes] = useState('');
    const fileInputRef = useRef(null);
    useEffect(() => {
        loadData();
    }, [userId]);
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [pending, overdue] = await Promise.all([
                getStudentPendingRequests(),
                getStudentOverdueRequests(),
            ]);
            setPendingRequests(pending);
            setOverdueRequests(overdue);
        }
        catch (err) {
            console.error('[StudentVivaDashboard] Error loading data:', err);
            setError(err.message || 'Failed to load viva requests');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type (video)
            if (!file.type.startsWith('video/')) {
                alert('Please select a video file');
                return;
            }
            // Validate file size (max 500MB)
            if (file.size > 500 * 1024 * 1024) {
                alert('Video file must be less than 500MB');
                return;
            }
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
        }
    };
    const handleSubmit = async () => {
        if (!selectedRequest)
            return;
        if (!videoFile && !videoUrl) {
            alert('Please select or upload a video file');
            return;
        }
        setIsSubmitting(true);
        try {
            // In production: Upload video to S3 first
            // const uploadedUrl = await uploadVideoToS3(videoFile);
            // For now, use mock URL or user-provided URL
            const finalVideoUrl = videoUrl || 'https://example.com/videos/mock-url.mp4';
            // Get video duration (would be extracted from actual video in production)
            const videoDuration = videoFile ? Math.floor(videoFile.size / 100000) : 300; // Mock duration
            await submitVideoExplanation(selectedRequest.id, finalVideoUrl, videoDuration, studentNotes);
            alert('✅ Video explanation submitted successfully!');
            // Reload data
            loadData();
            setSelectedRequest(null);
            setVideoFile(null);
            setVideoUrl('');
            setStudentNotes('');
        }
        catch (err) {
            console.error('[StudentVivaDashboard] Error submitting video:', err);
            alert('Failed to submit video explanation');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const formatTimeRemaining = (dueAt) => {
        const now = new Date().getTime();
        const due = new Date(dueAt).getTime();
        const diff = due - now;
        if (diff < 0)
            return 'OVERDUE';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days} day${days > 1 ? 's' : ''} remaining`;
        return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
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
    const allRequests = [...pendingRequests, ...overdueRequests];
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }, children: [_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h1", { style: { marginBottom: '0.5rem' }, children: "\uD83C\uDFA5 Code Explanation Requests" }), _jsx("p", { style: { color: '#64748b' }, children: "Record video explanations of your code to demonstrate understanding" }), _jsx("button", { onClick: loadData, style: {
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }, children: "\uD83D\uDD04 Refresh" })] }), allRequests.length === 0 ? (_jsxs("div", { style: {
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '4rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }, children: [_jsx("div", { style: { fontSize: '64px', marginBottom: '1rem' }, children: "\u2705" }), _jsx("h2", { style: { marginBottom: '0.5rem' }, children: "No Pending Requests" }), _jsx("p", { style: { color: '#64748b' }, children: "You have no code explanation requests at this time." })] })) : selectedRequest ? (
            /* Upload/Record Interface */
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
                            }, children: "\u2190 Back to Requests" }) }), _jsx("h2", { style: { marginBottom: '1rem' }, children: "Record Video Explanation" }), _jsxs("div", { style: {
                            padding: '1.5rem',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                        }, children: [_jsx("h4", { style: { marginTop: 0 }, children: "Instructions:" }), _jsx("p", { children: selectedRequest.instructions || 'Explain your code and demonstrate your understanding.' }), _jsxs("div", { style: { marginTop: '1rem', fontSize: '14px', color: '#64748b' }, children: [_jsx("strong", { children: "Tips:" }), _jsxs("ul", { style: { marginLeft: '1.5rem', marginTop: '0.5rem' }, children: [_jsx("li", { children: "Show your screen with your code visible" }), _jsx("li", { children: "Walk through your logic step-by-step" }), _jsx("li", { children: "Explain key decisions and trade-offs" }), _jsx("li", { children: "Be prepared to answer why you chose this approach" })] })] })] }), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h4", { children: "Upload Video" }), _jsx("p", { style: { fontSize: '14px', color: '#64748b', marginBottom: '1rem' }, children: "Record using OBS, Loom, or your preferred screen recording tool, then upload here." }), _jsx("input", { ref: fileInputRef, type: "file", accept: "video/*", onChange: handleFileSelect, style: { display: 'none' } }), _jsx("button", { onClick: () => fileInputRef.current?.click(), style: {
                                    padding: '1rem 2rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    marginRight: '1rem',
                                }, children: "\uD83D\uDCC1 Choose Video File" }), videoFile && (_jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem' }, children: "Selected File:" }), _jsx("div", { children: videoFile.name }), _jsxs("div", { style: { fontSize: '14px', color: '#64748b' }, children: ["Size: ", (videoFile.size / (1024 * 1024)).toFixed(2), " MB"] }), videoUrl && (_jsx("video", { src: videoUrl, controls: true, style: {
                                            width: '100%',
                                            maxWidth: '600px',
                                            marginTop: '1rem',
                                            borderRadius: '8px',
                                        } }))] }))] }), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("label", { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }, children: "Additional Notes (Optional)" }), _jsx("textarea", { value: studentNotes, onChange: (e) => setStudentNotes(e.target.value), rows: 4, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                }, placeholder: "Any additional context or clarifications..." })] }), _jsx("div", { children: _jsx("button", { onClick: handleSubmit, disabled: !videoFile || isSubmitting, style: {
                                padding: '1rem 3rem',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                backgroundColor: !videoFile || isSubmitting ? '#94a3b8' : '#2da44e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: !videoFile || isSubmitting ? 'not-allowed' : 'pointer',
                            }, children: isSubmitting ? 'Submitting...' : '✅ Submit Video Explanation' }) })] })) : (
            /* Requests List */
            _jsxs("div", { children: [overdueRequests.length > 0 && (_jsx("div", { style: { marginBottom: '2rem' }, children: _jsxs("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                            }, children: [_jsx("div", { style: {
                                        padding: '1.5rem',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                    }, children: _jsxs("h3", { style: { margin: 0 }, children: ["\u26A0\uFE0F Overdue Requests (", overdueRequests.length, ")"] }) }), _jsx("div", { children: overdueRequests.map((request) => (_jsx("div", { style: {
                                            padding: '1.5rem',
                                            borderBottom: '1px solid #e2e8f0',
                                        }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px', color: '#dc2626' }, children: "OVERDUE - Submit Immediately" }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }, children: ["Due: ", new Date(request.dueAt).toLocaleString()] }), _jsxs("div", { style: { fontSize: '14px' }, children: [request.instructions?.substring(0, 100), "..."] })] }), _jsx("button", { onClick: () => setSelectedRequest(request), style: {
                                                        padding: '0.75rem 1.5rem',
                                                        backgroundColor: '#dc2626',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                    }, children: "Submit Now" })] }) }, request.id))) })] }) })), pendingRequests.length > 0 && (_jsx("div", { children: _jsxs("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                            }, children: [_jsx("div", { style: {
                                        padding: '1.5rem',
                                        backgroundColor: '#1e293b',
                                        color: 'white',
                                    }, children: _jsxs("h3", { style: { margin: 0 }, children: ["\uD83D\uDCCB Pending Requests (", pendingRequests.length, ")"] }) }), _jsx("div", { children: pendingRequests.map((request) => (_jsx("div", { style: {
                                            padding: '1.5rem',
                                            borderBottom: '1px solid #e2e8f0',
                                        }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px' }, children: "Code Explanation Required" }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }, children: ["Due: ", new Date(request.dueAt).toLocaleString(), " (", formatTimeRemaining(request.dueAt), ")"] }), _jsxs("div", { style: { fontSize: '14px', marginBottom: '0.5rem' }, children: [request.instructions?.substring(0, 150), "..."] }), request.reason && (_jsxs("div", { style: { fontSize: '13px', color: '#f59e0b', fontStyle: 'italic' }, children: ["Reason: ", request.reason] }))] }), _jsx("button", { onClick: () => setSelectedRequest(request), style: {
                                                        padding: '0.75rem 1.5rem',
                                                        backgroundColor: '#2da44e',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap',
                                                    }, children: "\uD83D\uDCF9 Record Explanation" })] }) }, request.id))) })] }) }))] }))] }));
}
