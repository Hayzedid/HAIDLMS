import { useState, useEffect } from 'react';
import {
  getDueReviews,
  getUpcomingReviews,
  getLearningHealthScore,
  getRetentionMetrics,
  getScheduleStats,
  SpacedRepetitionSchedule,
  LearningHealthScore,
  RetentionMetrics,
  ScheduleStats,
} from '../../api/spaced-repetition.api';

interface Props {
  userId: string;
  onStartReview?: (schedule: SpacedRepetitionSchedule) => void;
}

export default function SpacedRepetitionDashboard({ userId, onStartReview }: Props) {
  const [dueReviews, setDueReviews] = useState<SpacedRepetitionSchedule[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<SpacedRepetitionSchedule[]>([]);
  const [healthScore, setHealthScore] = useState<LearningHealthScore | null>(null);
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('[SpacedRepetitionDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#fbbf24'; // Yellow
    if (score >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📚</div>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading your learning data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>📚 Your Learning Dashboard</h1>
        <p style={{ color: '#64748b' }}>Track your progress and stay consistent with spaced repetition</p>
        <button
          onClick={loadData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Learning Health Score */}
      {healthScore && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: `3px solid ${getHealthColor(healthScore.score)}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Learning Health Score</h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Your overall learning effectiveness and consistency
              </p>

              {/* Recommendations */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '14px', color: '#64748b' }}>
                  Personalized Recommendations:
                </h4>
                <ul style={{ marginLeft: '1.5rem', marginBottom: 0 }}>
                  {healthScore.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Score Circle */}
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: getHealthColor(healthScore.score) + '20',
                border: `8px solid ${getHealthColor(healthScore.score)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: getHealthColor(healthScore.score),
                  lineHeight: 1,
                }}
              >
                {Math.round(healthScore.score)}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: getHealthColor(healthScore.score),
                  marginTop: '0.5rem',
                }}
              >
                {getHealthLabel(healthScore.score)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {metrics && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {/* Current Streak */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
              🔥 Current Streak
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
              {metrics.currentStreak}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              days • longest: {metrics.longestStreak} days
            </div>
          </div>

          {/* Due Today */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
              📅 Due Today
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>
              {stats.dueToday}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              of {stats.activeSchedules} active
            </div>
          </div>

          {/* Retention Score */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
              🧠 Retention Score
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: getHealthColor(metrics.retentionScore),
              }}
            >
              {Math.round(metrics.retentionScore)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>out of 100</div>
          </div>

          {/* Total Reviews */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
              ✅ Total Reviews
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>
              {metrics.totalReviews}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              avg quality: {metrics.averageQuality.toFixed(1)}/5
            </div>
          </div>

          {/* Cramming Alert */}
          {metrics.isCramming && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '2px solid #ef4444',
              }}
            >
              <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '0.5rem' }}>
                ⚠️ Cramming Detected
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626' }}>
                {metrics.crammingScore}%
              </div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>
                Spread out your reviews!
              </div>
            </div>
          )}
        </div>
      )}

      {/* Due Reviews Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0 }}>📍 Reviews Due Now ({dueReviews.length})</h3>
            {dueReviews.length > 0 && (
              <button
                onClick={() => dueReviews[0] && onStartReview?.(dueReviews[0])}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Start Reviewing
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {dueReviews.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🎉</div>
                <div style={{ fontSize: '18px' }}>All caught up! No reviews due right now.</div>
              </div>
            ) : (
              dueReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => onStartReview?.(review)}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f8fafc')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'white')
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px' }}>
                        {review.contentType.toUpperCase()}: {review.contentId.substring(0, 8)}...
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                        Repetition #{review.repetitionNumber} • Easiness: {review.easinessFactor.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Last reviewed:{' '}
                        {review.lastReviewedAt
                          ? new Date(review.lastReviewedAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem',
                        }}
                      >
                        OVERDUE
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {review.reviewCount} previous reviews
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Reviews */}
      <div>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#1e293b',
              color: 'white',
            }}
          >
            <h3 style={{ margin: 0 }}>📆 Upcoming Reviews (Next 7 Days)</h3>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {upcomingReviews.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No upcoming reviews scheduled
              </div>
            ) : (
              upcomingReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {review.contentType.toUpperCase()}: {review.contentId.substring(0, 8)}...
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Repetition #{review.repetitionNumber} • Next interval: {review.intervalDays} days
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#dbeafe',
                          color: '#3b82f6',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {new Date(review.nextReviewAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
