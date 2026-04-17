import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
export default function ProtectedRoute({ allowedRoles }) {
    const { user, accessToken } = useAuthStore();
    const location = useLocation();
    if (!accessToken || !user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if wrong role
        if (user.role === 'admin')
            return _jsx(Navigate, { to: "/admin/dashboard", replace: true });
        if (user.role === 'instructor')
            return _jsx(Navigate, { to: "/instructor/dashboard", replace: true });
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(Outlet, {});
}
