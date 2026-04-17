import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type UserRole = 'student' | 'instructor' | 'admin';

interface Props {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if wrong role
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
