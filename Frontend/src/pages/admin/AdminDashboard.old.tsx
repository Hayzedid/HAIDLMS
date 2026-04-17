import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.firstName}. Platform management tools coming soon.</p>
    </div>
  );
}
