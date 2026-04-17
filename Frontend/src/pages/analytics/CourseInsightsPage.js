import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLearningInsights } from '../../api/analytics.api';
import { MetricsCard, InsightsCard } from '../../components/analytics';
export default function CourseInsightsPage() {
    const { courseId } = useParams();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (courseId) {
            loadInsights();
        }
    }, [courseId]);
    const loadInsights = async () => {
        if (!courseId)
            return;
        setLoading(true);
        try {
            const response = await getLearningInsights(courseId);
            setInsights(response.data.data);
        }
        catch (error) {
            console.error('Failed to load insights:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: _jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Loading course insights..." }) }));
    }
    if (!insights) {
        return (_jsx("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: _jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Failed to load insights" }) }));
    }
    const { metrics, insights: insightsList, estimatedCompletionDate, predictedSuccessRate } = insights;
    return (_jsxs("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h1", { style: { fontSize: '32px', fontWeight: 700, marginBottom: '8px' }, children: "\uD83D\uDCC8 Course Insights" }), _jsx("p", { style: { fontSize: '16px', color: '#6b7280' }, children: "Detailed analytics and personalized recommendations for your course" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }, children: [_jsx(MetricsCard, { title: "Progress", value: `${metrics.progress_percentage.toFixed(1)}%`, subtitle: `${metrics.lessons_completed} / ${metrics.total_lessons} lessons`, icon: "\uD83D\uDCDA", color: "blue" }), _jsx(MetricsCard, { title: "Engagement Score", value: metrics.engagement_score.toFixed(1), subtitle: "Out of 100", icon: "\uD83D\uDD25", color: metrics.engagement_score >= 70 ? 'green' : metrics.engagement_score >= 40 ? 'yellow' : 'red' }), _jsx(MetricsCard, { title: "Assessment Score", value: metrics.avg_assessment_score ? `${metrics.avg_assessment_score.toFixed(1)}%` : 'N/A', subtitle: metrics.assessments_attempted > 0 ? `${metrics.assessments_passed} / ${metrics.assessments_attempted} passed` : 'No assessments yet', icon: "\uD83C\uDF93", color: metrics.avg_assessment_score >= 80 ? 'green' : metrics.avg_assessment_score >= 60 ? 'yellow' : 'red' }), _jsx(MetricsCard, { title: "Learning Velocity", value: `${metrics.lessons_per_week.toFixed(1)}/week`, subtitle: "Lessons per week", icon: "\u26A1", color: "purple" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
                }, children: [_jsx(MetricsCard, { title: "Success Prediction", value: `${predictedSuccessRate.toFixed(0)}%`, subtitle: "Likelihood of completion", icon: "\uD83C\uDFAF", color: predictedSuccessRate >= 80 ? 'green' : predictedSuccessRate >= 50 ? 'yellow' : 'red' }), _jsx(MetricsCard, { title: "Estimated Completion", value: estimatedCompletionDate ? formatDate(new Date(estimatedCompletionDate)) : 'N/A', subtitle: estimatedCompletionDate ? `${getDaysUntil(new Date(estimatedCompletionDate))} days remaining` : 'Keep learning!', icon: "\uD83D\uDCC5", color: "blue" }), _jsx(MetricsCard, { title: "Time Invested", value: `${Math.floor(metrics.time_spent_minutes / 60)}h ${metrics.time_spent_minutes % 60}m`, subtitle: `Avg: ${metrics.avg_session_duration_minutes.toFixed(0)}m per session`, icon: "\u23F1\uFE0F", color: "purple" }), _jsx(MetricsCard, { title: "Days Active", value: metrics.days_active, subtitle: "Learning days", icon: "\uD83D\uDCC6", color: "green" })] }), metrics.at_risk && (_jsxs("div", { style: {
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    marginBottom: '32px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }, children: [_jsx("span", { style: { fontSize: '24px' }, children: "\u26A0\uFE0F" }), _jsx("h3", { style: { fontSize: '18px', fontWeight: 600, color: '#b91c1c' }, children: "At Risk Alert" })] }), _jsx("p", { style: { fontSize: '14px', color: '#7f1d1d', margin: 0 }, children: "Your learning metrics suggest you may need additional support to complete this course. Check the insights below for personalized recommendations." })] })), _jsxs("div", { style: {
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '32px',
                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }, children: [_jsx("h3", { style: { fontSize: '16px', fontWeight: 600 }, children: "Course Progress" }), _jsxs("span", { style: { fontSize: '16px', fontWeight: 600, color: '#3b82f6' }, children: [metrics.progress_percentage.toFixed(1), "%"] })] }), _jsx("div", { style: {
                            height: '24px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '12px',
                        }, children: _jsx("div", { style: {
                                height: '100%',
                                width: `${metrics.progress_percentage}%`,
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                transition: 'width 0.5s ease',
                            } }) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }, children: [_jsxs("div", { children: [_jsx("strong", { children: metrics.lessons_completed }), " lessons completed"] }), _jsxs("div", { children: [_jsx("strong", { children: metrics.total_lessons - metrics.lessons_completed }), " remaining"] })] })] }), insightsList && insightsList.length > 0 && (_jsx("div", { style: { marginBottom: '32px' }, children: _jsx(InsightsCard, { insights: insightsList }) })), metrics.total_modules > 0 && (_jsxs("div", { style: {
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: 600, marginBottom: '16px' }, children: "Module Completion" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '16px' }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx("div", { style: {
                                        height: '12px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                    }, children: _jsx("div", { style: {
                                            height: '100%',
                                            width: `${(metrics.modules_completed / metrics.total_modules) * 100}%`,
                                            backgroundColor: '#10b981',
                                            transition: 'width 0.3s ease',
                                        } }) }) }), _jsxs("div", { style: { fontSize: '14px', fontWeight: 600, color: '#374151' }, children: [metrics.modules_completed, " / ", metrics.total_modules] })] })] }))] }));
}
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
function getDaysUntil(date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
