import { useState, useEffect } from 'react';
import { getStudentDashboard, StudentDashboard } from '../../api/analytics.api';
import { MetricsCard, ProgressChart, StreakCalendar } from '../../components/analytics';

export default function AnalyticsDashboardPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await getStudentDashboard();
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
          Loading analytics dashboard...
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
          Failed to load dashboard
        </div>
      </div>
    );
  }

  const { overview, activeCourses, recentActivity, streakCalendar, weeklyTrend } = dashboard;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          📊 Analytics Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Track your learning progress and performance metrics
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
          title="Engagement Score"
          value={overview.engagementScore.toFixed(1)}
          subtitle="Out of 100"
          icon="🔥"
          color="blue"
        />

        <MetricsCard
          title="Health Score"
          value={overview.healthScore.toFixed(1)}
          subtitle="Overall wellness"
          icon="💪"
          color={overview.healthScore >= 70 ? 'green' : overview.healthScore >= 40 ? 'yellow' : 'red'}
        />

        <MetricsCard
          title="Learning Streak"
          value={`${overview.streakDays} days`}
          subtitle={`Best: ${overview.longestStreak} days`}
          icon="🔥"
          color="green"
        />

        <MetricsCard
          title="Total Time"
          value={`${Math.floor(overview.totalTimeMinutes / 60)}h ${overview.totalTimeMinutes % 60}m`}
          subtitle="Learning time"
          icon="⏱️"
          color="purple"
        />
      </div>

      {/* Secondary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <MetricsCard
          title="Courses Enrolled"
          value={overview.coursesEnrolled}
          color="blue"
        />

        <MetricsCard
          title="Courses Completed"
          value={overview.coursesCompleted}
          subtitle={`${overview.coursesEnrolled > 0 ? ((overview.coursesCompleted / overview.coursesEnrolled) * 100).toFixed(0) : 0}% completion rate`}
          color="green"
        />

        <MetricsCard
          title="Lessons Completed"
          value={overview.lessonsCompleted}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Weekly Activity Trend */}
        {weeklyTrend && weeklyTrend.length > 0 && (
          <ProgressChart
            title="Weekly Activity Trend"
            type="line"
            data={weeklyTrend.map((w: any) => ({
              label: new Date(w.week).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              value: parseInt(w.lessons_completed, 10),
            }))}
          />
        )}

        {/* Time Distribution */}
        {dashboard.timeDistribution && dashboard.timeDistribution.length > 0 && (
          <ProgressChart
            title="Time by Course"
            data={dashboard.timeDistribution.map((c: any, idx: number) => ({
              label: `Course ${idx + 1}`,
              value: c.time_spent_minutes,
            }))}
          />
        )}
      </div>

      {/* Learning Streak Calendar */}
      {streakCalendar && streakCalendar.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <StreakCalendar data={streakCalendar} />
        </div>
      )}

      {/* Active Courses */}
      {activeCourses && activeCourses.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Active Courses
          </h2>

          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {activeCourses.map((course: any, index: number) => (
              <div
                key={course.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < activeCourses.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>
                    Course {index + 1}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                    <span>Progress: {course.progress_percentage.toFixed(1)}%</span>
                    <span>Time: {Math.floor(course.time_spent_minutes / 60)}h {course.time_spent_minutes % 60}m</span>
                    <span>Engagement: {course.engagement_score.toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ width: '120px' }}>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${course.progress_percentage}%`,
                        backgroundColor: course.progress_percentage >= 100 ? '#10b981' : '#3b82f6',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Recent Activity
          </h2>

          <div
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {recentActivity.slice(0, 10).map((activity: any, index: number) => {
              const eventIcons: Record<string, string> = {
                lesson_complete: '✅',
                course_enroll: '📚',
                assessment_complete: '🎓',
                video_complete: '🎥',
                default: '📌',
              };

              const icon = eventIcons[activity.event_type] || eventIcons.default;
              const timestamp = new Date(activity.created_at);
              const timeAgo = formatTimeAgo(timestamp);

              return (
                <div
                  key={index}
                  style={{
                    padding: '12px 20px',
                    borderBottom: index < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '20px' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {formatEventType(activity.event_type)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{timeAgo}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
