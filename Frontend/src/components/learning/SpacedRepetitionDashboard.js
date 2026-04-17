import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getDueReviews, getUpcomingReviews, getLearningHealthScore, getRetentionMetrics, getScheduleStats, } from '../../api/spaced-repetition.api';
export default function SpacedRepetitionDashboard({ userId, onStartReview }) {
    const [dueReviews, setDueReviews] = useState([]);
    const [upcomingReviews, setUpcomingReviews] = useState([]);
    const [healthScore, setHealthScore] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadData();
    }, [userId]);
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [due, upcoming, health, retention, statistics] = await Promise.all([
                getDueReviews(),
                getUpcomingReviews(7),
                getLearningHealthScore(),
                getRetentionMetrics(),
                getScheduleStats(),
            ]);
            setDueReviews(due);
            setUpcomingReviews(upcoming);
            setHealthScore(health);
            setMetrics(retention);
            setStats(statistics);
        }
        catch (err) {
            console.error('[SpacedRepetitionDashboard] Error loading data:', err);
            setError(err.message || 'Failed to load dashboard data');
        }
        finally {
            setIsLoading(false);
        }
    };
    const getHealthColor = (score) => {
        if (score >= 80)
            return '#10b981'; // Green
        if (score >= 60)
            return '#fbbf24'; // Yellow
        if (score >= 40)
            return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };
    const getHealthLabel = (score) => {
        if (score >= 80)
            return 'Excellent';
        if (score >= 60)
            return 'Good';
        if (score >= 40)
            return 'Fair';
        return 'Needs Improvement';
    };
    if (isLoading) {
        return (_jsxs("div", { style: { padding: '3rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '1rem' }, children: "\uD83D\uDCDA" }), _jsx("div", { style: { fontSize: '18px', color: '#64748b' }, children: "Loading your learning data..." })] }));
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
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }, children: [_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h1", { style: { marginBottom: '0.5rem' }, children: "\uD83D\uDCDA Your Learning Dashboard" }), _jsx("p", { style: { color: '#64748b' }, children: "Track your progress and stay consistent with spaced repetition" }), _jsx("button", { onClick: loadData, style: {
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                        }, children: "\uD83D\uDD04 Refresh" })] }), healthScore && (_jsx("div", { style: {
                    marginBottom: '2rem',
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: `3px solid ${getHealthColor(healthScore.score)}`,
                }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("h2", { style: { marginTop: 0, marginBottom: '0.5rem' }, children: "Learning Health Score" }), _jsx("p", { style: { color: '#64748b', marginBottom: '1.5rem' }, children: "Your overall learning effectiveness and consistency" }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("h4", { style: { marginBottom: '0.75rem', fontSize: '14px', color: '#64748b' }, children: "Personalized Recommendations:" }), _jsx("ul", { style: { marginLeft: '1.5rem', marginBottom: 0 }, children: healthScore.recommendations.map((rec, idx) => (_jsx("li", { style: { marginBottom: '0.5rem' }, children: rec }, idx))) })] })] }), _jsxs("div", { style: {
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                backgroundColor: getHealthColor(healthScore.score) + '20',
                                border: `8px solid ${getHealthColor(healthScore.score)}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: [_jsx("div", { style: {
                                        fontSize: '48px',
                                        fontWeight: 'bold',
                                        color: getHealthColor(healthScore.score),
                                        lineHeight: 1,
                                    }, children: Math.round(healthScore.score) }), _jsx("div", { style: {
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: getHealthColor(healthScore.score),
                                        marginTop: '0.5rem',
                                    }, children: getHealthLabel(healthScore.score) })] })] }) })), metrics && stats && (_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                }, children: [_jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "\uD83D\uDD25 Current Streak" }), _jsx("div", { style: { fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }, children: metrics.currentStreak }), _jsxs("div", { style: { fontSize: '12px', color: '#64748b' }, children: ["days \u2022 longest: ", metrics.longestStreak, " days"] })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "\uD83D\uDCC5 Due Today" }), _jsx("div", { style: { fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }, children: stats.dueToday }), _jsxs("div", { style: { fontSize: '12px', color: '#64748b' }, children: ["of ", stats.activeSchedules, " active"] })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "\uD83E\uDDE0 Retention Score" }), _jsx("div", { style: {
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: getHealthColor(metrics.retentionScore),
                                }, children: Math.round(metrics.retentionScore) }), _jsx("div", { style: { fontSize: '12px', color: '#64748b' }, children: "out of 100" })] }), _jsxs("div", { style: {
                            backgroundColor: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }, children: "\u2705 Total Reviews" }), _jsx("div", { style: { fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }, children: metrics.totalReviews }), _jsxs("div", { style: { fontSize: '12px', color: '#64748b' }, children: ["avg quality: ", metrics.averageQuality.toFixed(1), "/5"] })] }), metrics.isCramming && (_jsxs("div", { style: {
                            backgroundColor: '#fef2f2',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid #ef4444',
                        }, children: [_jsx("div", { style: { fontSize: '14px', color: '#dc2626', marginBottom: '0.5rem' }, children: "\u26A0\uFE0F Cramming Detected" }), _jsxs("div", { style: { fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }, children: [metrics.crammingScore, "%"] }), _jsx("div", { style: { fontSize: '12px', color: '#991b1b' }, children: "Spread out your reviews!" })] }))] })), _jsx("div", { style: { marginBottom: '2rem' }, children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                    }, children: [_jsxs("div", { style: {
                                padding: '1.5rem',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("h3", { style: { margin: 0 }, children: ["\uD83D\uDCCD Reviews Due Now (", dueReviews.length, ")"] }), dueReviews.length > 0 && (_jsx("button", { onClick: () => dueReviews[0] && onStartReview?.(dueReviews[0]), style: {
                                        padding: '0.5rem 1.5rem',
                                        backgroundColor: 'white',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }, children: "Start Reviewing" }))] }), _jsx("div", { style: { maxHeight: '400px', overflowY: 'auto' }, children: dueReviews.length === 0 ? (_jsxs("div", { style: { padding: '3rem', textAlign: 'center', color: '#64748b' }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '1rem' }, children: "\uD83C\uDF89" }), _jsx("div", { style: { fontSize: '18px' }, children: "All caught up! No reviews due right now." })] })) : (dueReviews.map((review) => (_jsx("div", { onClick: () => onStartReview?.(review), style: {
                                    padding: '1.5rem',
                                    borderBottom: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = '#f8fafc'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'white'), children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px' }, children: [review.contentType.toUpperCase(), ": ", review.contentId.substring(0, 8), "..."] }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }, children: ["Repetition #", review.repetitionNumber, " \u2022 Easiness: ", review.easinessFactor.toFixed(2)] }), _jsxs("div", { style: { fontSize: '12px', color: '#64748b' }, children: ["Last reviewed:", ' ', review.lastReviewedAt
                                                            ? new Date(review.lastReviewedAt).toLocaleDateString()
                                                            : 'Never'] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: {
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#dc2626',
                                                        borderRadius: '999px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                    }, children: "OVERDUE" }), _jsxs("div", { style: { fontSize: '12px', color: '#64748b' }, children: [review.reviewCount, " previous reviews"] })] })] }) }, review.id)))) })] }) }), _jsx("div", { children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                    }, children: [_jsx("div", { style: {
                                padding: '1.5rem',
                                backgroundColor: '#1e293b',
                                color: 'white',
                            }, children: _jsx("h3", { style: { margin: 0 }, children: "\uD83D\uDCC6 Upcoming Reviews (Next 7 Days)" }) }), _jsx("div", { style: { maxHeight: '400px', overflowY: 'auto' }, children: upcomingReviews.length === 0 ? (_jsx("div", { style: { padding: '2rem', textAlign: 'center', color: '#64748b' }, children: "No upcoming reviews scheduled" })) : (upcomingReviews.map((review) => (_jsx("div", { style: {
                                    padding: '1.5rem',
                                    borderBottom: '1px solid #e2e8f0',
                                }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 'bold', marginBottom: '0.5rem' }, children: [review.contentType.toUpperCase(), ": ", review.contentId.substring(0, 8), "..."] }), _jsxs("div", { style: { fontSize: '13px', color: '#64748b' }, children: ["Repetition #", review.repetitionNumber, " \u2022 Next interval: ", review.intervalDays, " days"] })] }), _jsx("div", { style: { textAlign: 'right' }, children: _jsx("div", { style: {
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: '#dbeafe',
                                                    color: '#3b82f6',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                }, children: new Date(review.nextReviewAt).toLocaleDateString() }) })] }) }, review.id)))) })] }) })] }));
}
