import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Instructor Dashboard</h1>
      <p>Welcome, {user?.firstName}!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
        <Link
          to="/instructor/courses"
          style={{
            padding: '2rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
          <strong>My Courses</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
            View and manage your courses
          </p>
        </Link>

        <Link
          to="/instructor/courses/new"
          style={{
            padding: '2rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'inherit',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</div>
          <strong>Create Course</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
            Build a new course
          </p>
        </Link>

        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <strong>Analytics</strong>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }}>
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
