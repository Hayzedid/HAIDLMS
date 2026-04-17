import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
export default function InstructorDashboard() {
    const { user } = useAuthStore();
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx("h1", { children: "Instructor Dashboard" }), _jsxs("p", { children: ["Welcome, ", user?.firstName, "!"] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }, children: [_jsxs(Link, { to: "/instructor/courses", style: {
                            padding: '2rem',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'inherit',
                            textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\uD83D\uDCDA" }), _jsx("strong", { children: "My Courses" }), _jsx("p", { style: { margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }, children: "View and manage your courses" })] }), _jsxs(Link, { to: "/instructor/courses/new", style: {
                            padding: '2rem',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'inherit',
                            textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "+" }), _jsx("strong", { children: "Create Course" }), _jsx("p", { style: { margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }, children: "Build a new course" })] }), _jsxs("div", { style: {
                            padding: '2rem',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\uD83D\uDCCA" }), _jsx("strong", { children: "Analytics" }), _jsx("p", { style: { margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }, children: "Coming soon" })] })] })] }));
}
