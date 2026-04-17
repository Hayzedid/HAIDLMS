import { useState, useEffect } from 'react';
import { notificationApi, SpacedRepetitionSchedule } from '../../api/notification.api';

export default function SpacedRepetitionPage() {
  const [dueReviews, setDueReviews] = useState<SpacedRepetitionSchedule[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<SpacedRepetitionSchedule[]>([]);
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    dueToday: 0,
    upcomingWeek: 0,
    averageEF: 2.5,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Failed to load spaced repetition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (scheduleId: string, quality: number) => {
    setReviewingId(scheduleId);
    try {
      await notificationApi.recordReview(scheduleId, quality);
      await loadData(); // Reload to get updated schedules
      alert('Review recorded! Next review scheduled.');
    } catch (error) {
      console.error('Failed to record review:', error);
      alert('Failed to record review');
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
          Loading spaced repetition data...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          📚 Spaced Repetition Reviews
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Review your learning material at optimal intervals for long-term retention
        </p>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 500, marginBottom: '4px' }}>
            Due Today
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e40af' }}>
            {stats.dueToday}
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 500, marginBottom: '4px' }}>
            Upcoming (7 days)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#047857' }}>
            {stats.upcomingWeek}
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 500, marginBottom: '4px' }}>
            Total Reviews
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#d97706' }}>
            {stats.totalReviews}
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
          <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 500, marginBottom: '4px' }}>
            Avg Easiness
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#6d28d9' }}>
            {stats.averageEF.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Due Reviews */}
      {dueReviews.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Due for Review ({dueReviews.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dueReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                      {review.contentType.charAt(0).toUpperCase() + review.contentType.slice(1)}:{' '}
                      {review.contentId}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      Review #{review.reviewCount + 1} • Last reviewed:{' '}
                      {review.lastReviewedAt
                        ? formatDate(review.lastReviewedAt)
                        : 'Never'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Easiness Factor
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#3b82f6' }}>
                      {review.easinessFactor.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Quality Buttons */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#374151' }}>
                    How well did you remember this?
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {[
                      { quality: 0, label: 'Complete blackout', color: '#dc2626' },
                      { quality: 1, label: 'Incorrect', color: '#ea580c' },
                      { quality: 2, label: 'Incorrect but familiar', color: '#f59e0b' },
                      { quality: 3, label: 'Correct with difficulty', color: '#eab308' },
                      { quality: 4, label: 'Correct with hesitation', color: '#84cc16' },
                      { quality: 5, label: 'Perfect recall', color: '#10b981' },
                    ].map(({ quality, label, color }) => (
                      <button
                        key={quality}
                        onClick={() => handleReview(review.id, quality)}
                        disabled={reviewingId === review.id}
                        style={{
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
                        }}
                        title={label}
                      >
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{quality}</div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {upcomingReviews.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Upcoming Reviews ({upcomingReviews.length})
          </h2>

          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {upcomingReviews.map((review, index) => (
              <div
                key={review.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < upcomingReviews.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                    {review.contentType.charAt(0).toUpperCase() + review.contentType.slice(1)}:{' '}
                    {review.contentId}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Review #{review.reviewCount + 1} • Interval: {review.intervalDays} days
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6', marginBottom: '2px' }}>
                    {formatDate(review.nextReviewAt)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    EF: {review.easinessFactor.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dueReviews.length === 0 && upcomingReviews.length === 0 && (
        <div style={{ padding: '64px 32px', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
            No reviews scheduled
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Complete lessons to start building your spaced repetition schedule
          </p>
        </div>
      )}
    </div>
  );
}
