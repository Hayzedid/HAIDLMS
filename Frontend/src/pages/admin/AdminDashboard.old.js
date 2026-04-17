import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthStore } from '../../store/authStore';
export default function AdminDashboard() {
    const { user } = useAuthStore();
    return (_jsxs("div", { style: { padding: '2rem' }, children: [_jsx("h1", { children: "Admin Dashboard" }), _jsxs("p", { children: ["Welcome, ", user?.firstName, ". Platform management tools coming soon."] })] }));
}
