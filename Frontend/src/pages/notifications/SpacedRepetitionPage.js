import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notification.api';
export default function SpacedRepetitionPage() {
    const [dueReviews, setDueReviews] = useState([]);
    const [upcomingReviews, setUpcomingReviews] = useState([]);
    const [stats, setStats] = useState({
        totalSchedules: 0,
        activeSchedules: 0,
        dueToday: 0,
        upcomingWeek: 0,
        averageEF: 2.5,
        totalReviews: 0,
    });
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [dueResponse, upcomingResponse, statsResponse] = await Promise.all([
                notificationApi.getDueReviews(),
                notificationApi.getUpcomingReviews(7),
                notificationApi.getSpacedRepStats(),
            ]);
            setDueReviews(dueResponse.data.data);
            setUpcomingReviews(upcomingResponse.data.data);
            setStats(statsResponse.data.data);
        }
        catch (error) {
            console.error('Failed to load spaced repetition data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleReview = async (scheduleId, quality) => {
        setReviewingId(scheduleId);
        try {
            await notificationApi.recordReview(scheduleId, quality);
            await loadData(); // Reload to get updated schedules
            alert('Review recorded! Next review scheduled.');
        }
        catch (error) {
            console.error('Failed to record review:', error);
            alert('Failed to record review');
        }
        finally {
            setReviewingId(null);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === today.toDateString())
            return 'Today';
        if (date.toDateString() === tomorrow.toDateString())
            return 'Tomorrow';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
    };
    if (loading) {
        return (_jsx("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: _jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Loading spaced repetition data..." }) }));
    }
    return (_jsxs("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h1", { style: { fontSize: '32px', fontWeight: 700, marginBottom: '8px' }, children: "\uD83D\uDCDA Spaced Repetition Reviews" }), _jsx("p", { style: { fontSize: '16px', color: '#6b7280' }, children: "Review your learning material at optimal intervals for long-term retention" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }, children: [_jsxs("div", { style: { padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }, children: [_jsx("div", { style: { fontSize: '14px', color: '#3b82f6', fontWeight: 500, marginBottom: '4px' }, children: "Due Today" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 700, color: '#1e40af' }, children: stats.dueToday })] }), _jsxs("div", { style: { padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }, children: [_jsx("div", { style: { fontSize: '14px', color: '#10b981', fontWeight: 500, marginBottom: '4px' }, children: "Upcoming (7 days)" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 700, color: '#047857' }, children: stats.upcomingWeek })] }), _jsxs("div", { style: { padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }, children: [_jsx("div", { style: { fontSize: '14px', color: '#f59e0b', fontWeight: 500, marginBottom: '4px' }, children: "Total Reviews" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 700, color: '#d97706' }, children: stats.totalReviews })] }), _jsxs("div", { style: { padding: '20px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }, children: [_jsx("div", { style: { fontSize: '14px', color: '#8b5cf6', fontWeight: 500, marginBottom: '4px' }, children: "Avg Easiness" }), _jsx("div", { style: { fontSize: '32px', fontWeight: 700, color: '#6d28d9' }, children: stats.averageEF.toFixed(2) })] })] }), dueReviews.length > 0 && (_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: 600, marginBottom: '16px' }, children: ["Due for Review (", dueReviews.length, ")"] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: dueReviews.map((review) => (_jsxs("div", { style: {
                                padding: '20px',
                                backgroundColor: 'white',
                                border: '2px solid #3b82f6',
                                borderRadius: '8px',
                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsxs("h3", { style: { fontSize: '18px', fontWeight: 600, marginBottom: '8px' }, children: [review.contentType.charAt(0).toUpperCase() + review.contentType.slice(1), ":", ' ', review.contentId] }), _jsxs("div", { style: { fontSize: '14px', color: '#6b7280' }, children: ["Review #", review.reviewCount + 1, " \u2022 Last reviewed:", ' ', review.lastReviewedAt
                                                            ? formatDate(review.lastReviewedAt)
                                                            : 'Never'] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' }, children: "Easiness Factor" }), _jsx("div", { style: { fontSize: '20px', fontWeight: 600, color: '#3b82f6' }, children: review.easinessFactor.toFixed(2) })] })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }, children: "How well did you remember this?" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }, children: [
                                                { quality: 0, label: 'Complete blackout', color: '#dc2626' },
                                                { quality: 1, label: 'Incorrect', color: '#ea580c' },
                                                { quality: 2, label: 'Incorrect but familiar', color: '#f59e0b' },
                                                { quality: 3, label: 'Correct with difficulty', color: '#eab308' },
                                                { quality: 4, label: 'Correct with hesitation', color: '#84cc16' },
                                                { quality: 5, label: 'Perfect recall', color: '#10b981' },
                                            ].map(({ quality, label, color }) => (_jsxs("button", { onClick: () => handleReview(review.id, quality), disabled: reviewingId === review.id, style: {
                                                    padding: '12px 8px',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: 'white',
                                                    backgroundColor: reviewingId === review.id ? '#9ca3af' : color,
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: reviewingId === review.id ? 'not-allowed' : 'pointer',
                                                    textAlign: 'center',
                                                    lineHeight: '1.2',
                                                }, title: label, children: [_jsx("div", { style: { fontSize: '18px', marginBottom: '4px' }, children: quality }), _jsx("div", { style: { fontSize: '10px', opacity: 0.9 }, children: label })] }, quality))) })] })] }, review.id))) })] })), upcomingReviews.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: 600, marginBottom: '16px' }, children: ["Upcoming Reviews (", upcomingReviews.length, ")"] }), _jsx("div", { style: {
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }, children: upcomingReviews.map((review, index) => (_jsxs("div", { style: {
                                padding: '16px 20px',
                                borderBottom: index < upcomingReviews.length - 1 ? '1px solid #f3f4f6' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontSize: '16px', fontWeight: 500, marginBottom: '4px' }, children: [review.contentType.charAt(0).toUpperCase() + review.contentType.slice(1), ":", ' ', review.contentId] }), _jsxs("div", { style: { fontSize: '14px', color: '#6b7280' }, children: ["Review #", review.reviewCount + 1, " \u2022 Interval: ", review.intervalDays, " days"] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 600, color: '#3b82f6', marginBottom: '2px' }, children: formatDate(review.nextReviewAt) }), _jsxs("div", { style: { fontSize: '12px', color: '#6b7280' }, children: ["EF: ", review.easinessFactor.toFixed(2)] })] })] }, review.id))) })] })), dueReviews.length === 0 && upcomingReviews.length === 0 && (_jsxs("div", { style: { padding: '64px 32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\uD83D\uDCDA" }), _jsx("h3", { style: { fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }, children: "No reviews scheduled" }), _jsx("p", { style: { fontSize: '14px', color: '#6b7280' }, children: "Complete lessons to start building your spaced repetition schedule" })] }))] }));
}
