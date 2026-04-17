import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { getStudentDashboard } from '../../api/analytics.api';
import { MetricsCard, ProgressChart, StreakCalendar } from '../../components/analytics';
export default function AnalyticsDashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadDashboard();
    }, []);
    const loadDashboard = async () => {
        setLoading(true);
        try {
            const response = await getStudentDashboard();
            setDashboard(response.data.data);
        }
        catch (error) {
            console.error('Failed to load dashboard:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { style: { maxWidth: '1400px', margin: '0 auto', padding: '24px' }, children: _jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Loading analytics dashboard..." }) }));
    }
    if (!dashboard) {
        return (_jsx("div", { style: { maxWidth: '1400px', margin: '0 auto', padding: '24px' }, children: _jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Failed to load dashboard" }) }));
    }
    const { overview, activeCourses, recentActivity, streakCalendar, weeklyTrend } = dashboard;
    return (_jsxs("div", { style: { maxWidth: '1400px', margin: '0 auto', padding: '24px' }, children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h1", { style: { fontSize: '32px', fontWeight: 700, marginBottom: '8px' }, children: "\uD83D\uDCCA Analytics Dashboard" }), _jsx("p", { style: { fontSize: '16px', color: '#6b7280' }, children: "Track your learning progress and performance metrics" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }, children: [_jsx(MetricsCard, { title: "Engagement Score", value: overview.engagementScore.toFixed(1), subtitle: "Out of 100", icon: "\uD83D\uDD25", color: "blue" }), _jsx(MetricsCard, { title: "Health Score", value: overview.healthScore.toFixed(1), subtitle: "Overall wellness", icon: "\uD83D\uDCAA", color: overview.healthScore >= 70 ? 'green' : overview.healthScore >= 40 ? 'yellow' : 'red' }), _jsx(MetricsCard, { title: "Learning Streak", value: `${overview.streakDays} days`, subtitle: `Best: ${overview.longestStreak} days`, icon: "\uD83D\uDD25", color: "green" }), _jsx(MetricsCard, { title: "Total Time", value: `${Math.floor(overview.totalTimeMinutes / 60)}h ${overview.totalTimeMinutes % 60}m`, subtitle: "Learning time", icon: "\u23F1\uFE0F", color: "purple" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }, children: [_jsx(MetricsCard, { title: "Courses Enrolled", value: overview.coursesEnrolled, color: "blue" }), _jsx(MetricsCard, { title: "Courses Completed", value: overview.coursesCompleted, subtitle: `${overview.coursesEnrolled > 0 ? ((overview.coursesCompleted / overview.coursesEnrolled) * 100).toFixed(0) : 0}% completion rate`, color: "green" }), _jsx(MetricsCard, { title: "Lessons Completed", value: overview.lessonsCompleted, color: "yellow" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }, children: [weeklyTrend && weeklyTrend.length > 0 && (_jsx(ProgressChart, { title: "Weekly Activity Trend", type: "line", data: weeklyTrend.map((w) => ({
                            label: new Date(w.week).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            }),
                            value: parseInt(w.lessons_completed, 10),
                        })) })), dashboard.timeDistribution && dashboard.timeDistribution.length > 0 && (_jsx(ProgressChart, { title: "Time by Course", data: dashboard.timeDistribution.map((c, idx) => ({
                            label: `Course ${idx + 1}`,
                            value: c.time_spent_minutes,
                        })) }))] }), streakCalendar && streakCalendar.length > 0 && (_jsx("div", { style: { marginBottom: '32px' }, children: _jsx(StreakCalendar, { data: streakCalendar }) })), activeCourses && activeCourses.length > 0 && (_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h2", { style: { fontSize: '24px', fontWeight: 600, marginBottom: '16px' }, children: "Active Courses" }), _jsx("div", { style: {
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }, children: activeCourses.map((course, index) => (_jsxs("div", { style: {
                                padding: '16px 20px',
                                borderBottom: index < activeCourses.length - 1 ? '1px solid #f3f4f6' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontSize: '16px', fontWeight: 500, marginBottom: '6px' }, children: ["Course ", index + 1] }), _jsxs("div", { style: { display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }, children: [_jsxs("span", { children: ["Progress: ", course.progress_percentage.toFixed(1), "%"] }), _jsxs("span", { children: ["Time: ", Math.floor(course.time_spent_minutes / 60), "h ", course.time_spent_minutes % 60, "m"] }), _jsxs("span", { children: ["Engagement: ", course.engagement_score.toFixed(1)] })] })] }), _jsx("div", { style: { width: '120px' }, children: _jsx("div", { style: {
                                            height: '8px',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                        }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${course.progress_percentage}%`,
                                                backgroundColor: course.progress_percentage >= 100 ? '#10b981' : '#3b82f6',
                                                transition: 'width 0.3s ease',
                                            } }) }) })] }, course.id))) })] })), recentActivity && recentActivity.length > 0 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '24px', fontWeight: 600, marginBottom: '16px' }, children: "Recent Activity" }), _jsx("div", { style: {
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }, children: recentActivity.slice(0, 10).map((activity, index) => {
                            const eventIcons = {
                                lesson_complete: '✅',
                                course_enroll: '📚',
                                assessment_complete: '🎓',
                                video_complete: '🎥',
                                default: '📌',
                            };
                            const icon = eventIcons[activity.event_type] || eventIcons.default;
                            const timestamp = new Date(activity.created_at);
                            const timeAgo = formatTimeAgo(timestamp);
                            return (_jsxs("div", { style: {
                                    padding: '12px 20px',
                                    borderBottom: index < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }, children: [_jsx("div", { style: { fontSize: '20px' }, children: icon }), _jsx("div", { style: { flex: 1 }, children: _jsx("div", { style: { fontSize: '14px', color: '#374151' }, children: formatEventType(activity.event_type) }) }), _jsx("div", { style: { fontSize: '12px', color: '#9ca3af' }, children: timeAgo })] }, index));
                        }) })] }))] }));
}
function formatTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)
        return 'Just now';
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800)
        return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatEventType(eventType) {
    return eventType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
