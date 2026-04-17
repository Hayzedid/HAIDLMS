import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseApi, Enrollment } from '../../api/course.api';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const response = await courseApi.getMyEnrollments({ status: 'active' });
      setEnrollments(response.data.data);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Welcome back, {user?.firstName}!</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* My Courses */}
        <div>
          <h2>My Courses</h2>
          {loading ? (
            <p>Loading...</p>
          ) : enrollments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <p>You're not enrolled in any courses yet.</p>
              <Link to="/courses" style={{ color: '#1a56db' }}>Browse Catalog</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {enrollments.map((enrollment: any) => (
                <Link
                  key={enrollment.id}
                  to={`/courses/${enrollment.course_id}/learn`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '1rem',
                  }}
                >
                  {enrollment.cover_image_url && (
                    <img src={enrollment.cover_image_url} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{enrollment.course_title}</h3>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                      Progress: {enrollment.progress_percent?.toFixed(0)}%
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${enrollment.progress_percent || 0}%`,
                        backgroundColor: '#10b981',
                      }}></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link
              to="/courses"
              style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong>Browse Courses</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
                Explore our course catalog
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
