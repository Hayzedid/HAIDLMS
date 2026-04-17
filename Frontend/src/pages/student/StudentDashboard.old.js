import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseApi } from '../../api/course.api';
export default function StudentDashboard() {
    const { user } = useAuthStore();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadEnrollments();
    }, []);
    const loadEnrollments = async () => {
        try {
            const response = await courseApi.getMyEnrollments({ status: 'active' });
            setEnrollments(response.data.data);
        }
        catch (error) {
            console.error('Failed to load enrollments:', error);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }, children: [_jsxs("h1", { children: ["Welcome back, ", user?.firstName, "!"] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }, children: [_jsxs("div", { children: [_jsx("h2", { children: "My Courses" }), loading ? (_jsx("p", { children: "Loading..." })) : enrollments.length === 0 ? (_jsxs("div", { style: { padding: '2rem', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }, children: [_jsx("p", { children: "You're not enrolled in any courses yet." }), _jsx(Link, { to: "/courses", style: { color: '#1a56db' }, children: "Browse Catalog" })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: enrollments.map((enrollment) => (_jsxs(Link, { to: `/courses/${enrollment.course_id}/learn`, style: {
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        display: 'flex',
                                        gap: '1rem',
                                    }, children: [enrollment.cover_image_url && (_jsx("img", { src: enrollment.cover_image_url, alt: "", style: { width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' } })), _jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { style: { margin: '0 0 0.5rem 0' }, children: enrollment.course_title }), _jsxs("div", { style: { fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }, children: ["Progress: ", enrollment.progress_percent?.toFixed(0), "%"] }), _jsx("div", { style: {
                                                        height: '6px',
                                                        backgroundColor: '#e0e0e0',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                    }, children: _jsx("div", { style: {
                                                            height: '100%',
                                                            width: `${enrollment.progress_percent || 0}%`,
                                                            backgroundColor: '#10b981',
                                                        } }) })] })] }, enrollment.id))) }))] }), _jsxs("div", { children: [_jsx("h2", { children: "Quick Actions" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: _jsxs(Link, { to: "/courses", style: {
                                        padding: '1rem',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }, children: [_jsx("strong", { children: "Browse Courses" }), _jsx("p", { style: { margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#666' }, children: "Explore our course catalog" })] }) })] })] })] }));
}
