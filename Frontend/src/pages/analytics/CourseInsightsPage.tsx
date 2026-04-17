import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLearningInsights, LearningInsights } from '../../api/analytics.api';
import { MetricsCard, InsightsCard } from '../../components/analytics';

export default function CourseInsightsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadInsights();
    }
  }, [courseId]);

  const loadInsights = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      const response = await getLearningInsights(courseId);
      setInsights(response.data.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
          Loading course insights...
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
          Failed to load insights
        </div>
      </div>
    );
  }

  const { metrics, insights: insightsList, estimatedCompletionDate, predictedSuccessRate } = insights;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          📈 Course Insights
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Detailed analytics and personalized recommendations for your course
        </p>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <MetricsCard
          title="Progress"
          value={`${metrics.progress_percentage.toFixed(1)}%`}
          subtitle={`${metrics.lessons_completed} / ${metrics.total_lessons} lessons`}
          icon="📚"
          color="blue"
        />

        <MetricsCard
          title="Engagement Score"
          value={metrics.engagement_score.toFixed(1)}
          subtitle="Out of 100"
          icon="🔥"
          color={metrics.engagement_score >= 70 ? 'green' : metrics.engagement_score >= 40 ? 'yellow' : 'red'}
        />

        <MetricsCard
          title="Assessment Score"
          value={metrics.avg_assessment_score ? `${metrics.avg_assessment_score.toFixed(1)}%` : 'N/A'}
          subtitle={metrics.assessments_attempted > 0 ? `${metrics.assessments_passed} / ${metrics.assessments_attempted} passed` : 'No assessments yet'}
          icon="🎓"
          color={metrics.avg_assessment_score >= 80 ? 'green' : metrics.avg_assessment_score >= 60 ? 'yellow' : 'red'}
        />

        <MetricsCard
          title="Learning Velocity"
          value={`${metrics.lessons_per_week.toFixed(1)}/week`}
          subtitle="Lessons per week"
          icon="⚡"
          color="purple"
        />
      </div>

      {/* Prediction Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <MetricsCard
          title="Success Prediction"
          value={`${predictedSuccessRate.toFixed(0)}%`}
          subtitle="Likelihood of completion"
          icon="🎯"
          color={predictedSuccessRate >= 80 ? 'green' : predictedSuccessRate >= 50 ? 'yellow' : 'red'}
        />

        <MetricsCard
          title="Estimated Completion"
          value={estimatedCompletionDate ? formatDate(new Date(estimatedCompletionDate)) : 'N/A'}
          subtitle={estimatedCompletionDate ? `${getDaysUntil(new Date(estimatedCompletionDate))} days remaining` : 'Keep learning!'}
          icon="📅"
          color="blue"
        />

        <MetricsCard
          title="Time Invested"
          value={`${Math.floor(metrics.time_spent_minutes / 60)}h ${metrics.time_spent_minutes % 60}m`}
          subtitle={`Avg: ${metrics.avg_session_duration_minutes.toFixed(0)}m per session`}
          icon="⏱️"
          color="purple"
        />

        <MetricsCard
          title="Days Active"
          value={metrics.days_active}
          subtitle="Learning days"
          icon="📆"
          color="green"
        />
      </div>

      {/* At Risk Warning */}
      {metrics.at_risk && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#b91c1c' }}>
              At Risk Alert
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
            Your learning metrics suggest you may need additional support to complete this course.
            Check the insights below for personalized recommendations.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Course Progress</h3>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>
            {metrics.progress_percentage.toFixed(1)}%
          </span>
        </div>

        <div
          style={{
            height: '24px',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${metrics.progress_percentage}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
          <div>
            <strong>{metrics.lessons_completed}</strong> lessons completed
          </div>
          <div>
            <strong>{metrics.total_lessons - metrics.lessons_completed}</strong> remaining
          </div>
        </div>
      </div>

      {/* Insights */}
      {insightsList && insightsList.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <InsightsCard insights={insightsList} />
        </div>
      )}

      {/* Module Progress */}
      {metrics.total_modules > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Module Completion
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: '12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(metrics.modules_completed / metrics.total_modules) * 100}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              {metrics.modules_completed} / {metrics.total_modules}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
