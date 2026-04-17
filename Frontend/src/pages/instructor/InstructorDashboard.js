import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, GitBranch, BarChart3, Eye, Star, MessageSquare, ShieldCheck, Award, ChevronRight, Activity, } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from '../../components/ui';
export default function InstructorDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        avgRating: 0,
        pendingReviews: 0,
        activeStudents: 0,
    });
    const [courses, setCourses] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    useEffect(() => {
        loadDashboardData();
    }, []);
    const loadDashboardData = async () => {
        try {
            // Mock data - would come from API
            setStats({
                totalCourses: 8,
                totalStudents: 1247,
                totalRevenue: 45600,
                avgRating: 4.7,
                pendingReviews: 12,
                activeStudents: 834,
            });
            setCourses([
                {
                    id: '1',
                    title: 'Complete React Developer Course',
                    enrollments: 456,
                    rating: 4.8,
                    revenue: 15200,
                    status: 'published',
                    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
                },
                {
                    id: '2',
                    title: 'Advanced TypeScript Patterns',
                    enrollments: 289,
                    rating: 4.9,
                    revenue: 9800,
                    status: 'published',
                    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
                },
                {
                    id: '3',
                    title: 'Node.js Microservices',
                    enrollments: 502,
                    rating: 4.6,
                    revenue: 20600,
                    status: 'published',
                    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
                },
            ]);
            setRecentActivity([
                {
                    type: 'enrollment',
                    message: '15 new enrollments today',
                    time: '2 hours ago',
                    icon: Users,
                    color: 'primary',
                },
                {
                    type: 'review',
                    message: '3 new reviews submitted',
                    time: '5 hours ago',
                    icon: Star,
                    color: 'warning',
                },
                {
                    type: 'question',
                    message: '8 student questions pending',
                    time: '1 day ago',
                    icon: MessageSquare,
                    color: 'info',
                },
            ]);
        }
        catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 18)
            return 'Good afternoon';
        return 'Good evening';
    };
    if (loading) {
        return (_jsx(AppLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-32 w-full" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" })] })] }) }));
    }
    return (_jsxs(AppLayout, { children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: [getGreeting(), ", ", user?.name, "!"] }), _jsx("p", { className: "text-gray-600", children: "Here's what's happening with your courses today" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "ghost", onClick: () => navigate('/instructor/github-import'), icon: _jsx(GitBranch, { className: "w-5 h-5" }), children: "Import from GitHub" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/instructor/courses/new'), icon: _jsx(Plus, { className: "w-5 h-5" }), children: "Create Course" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Students" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalStudents.toLocaleString() })] }), _jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center", children: _jsx(Users, { className: "w-6 h-6 text-primary-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-success-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), stats.activeStudents, " active this month"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Courses" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalCourses })] }), _jsx("div", { className: "w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center", children: _jsx(BookOpen, { className: "w-6 h-6 text-success-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Activity, { className: "w-4 h-4 mr-1" }), courses.filter(c => c.status === 'published').length, " published"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Revenue" }), _jsxs("p", { className: "text-3xl font-bold text-gray-900", children: ["$", stats.totalRevenue.toLocaleString()] })] }), _jsx("div", { className: "w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center", children: _jsx(DollarSign, { className: "w-6 h-6 text-accent-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-success-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), "+12% from last month"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Avg Rating" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.avgRating })] }), _jsx("div", { className: "w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center", children: _jsx(Star, { className: "w-6 h-6 text-warning-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Award, { className: "w-4 h-4 mr-1" }), "Based on 847 reviews"] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: [_jsx(Link, { to: "/instructor/courses/new", children: _jsxs("div", { className: "p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group", children: [_jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors", children: _jsx(Plus, { className: "w-6 h-6 text-primary-600" }) }), _jsx("p", { className: "font-semibold text-gray-900 group-hover:text-primary-600 transition-colors", children: "Create Course" })] }) }), _jsx(Link, { to: "/instructor/github-import", children: _jsxs("div", { className: "p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group", children: [_jsx("div", { className: "w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-success-200 transition-colors", children: _jsx(GitBranch, { className: "w-6 h-6 text-success-600" }) }), _jsx("p", { className: "font-semibold text-gray-900 group-hover:text-success-600 transition-colors", children: "GitHub Import" })] }) }), _jsx(Link, { to: "/instructor/analytics", children: _jsxs("div", { className: "p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group", children: [_jsx("div", { className: "w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-200 transition-colors", children: _jsx(BarChart3, { className: "w-6 h-6 text-accent-600" }) }), _jsx("p", { className: "font-semibold text-gray-900 group-hover:text-accent-600 transition-colors", children: "View Analytics" })] }) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "My Courses" }), _jsx(Link, { to: "/instructor/courses", children: _jsxs(Button, { variant: "ghost", size: "sm", children: ["View All", _jsx(ChevronRight, { className: "w-4 h-4 ml-1" })] }) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: courses.map((course) => (_jsxs(Link, { to: `/instructor/courses/${course.id}/edit`, className: "flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all group", children: [course.thumbnail ? (_jsx("img", { src: course.thumbnail, alt: course.title, className: "w-32 h-24 object-cover rounded-lg flex-shrink-0" })) : (_jsx("div", { className: "w-32 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(BookOpen, { className: "w-12 h-12 text-white" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1", children: course.title }), _jsx(Badge, { variant: course.status === 'published' ? 'success' : 'warning', children: course.status })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center text-gray-600 mb-1", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "Students"] }), _jsx("p", { className: "font-semibold text-gray-900", children: course.enrollments })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center text-gray-600 mb-1", children: [_jsx(Star, { className: "w-4 h-4 mr-1" }), "Rating"] }), _jsxs("p", { className: "font-semibold text-gray-900", children: [course.rating, " / 5.0"] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center text-gray-600 mb-1", children: [_jsx(DollarSign, { className: "w-4 h-4 mr-1" }), "Revenue"] }), _jsxs("p", { className: "font-semibold text-gray-900", children: ["$", course.revenue.toLocaleString()] })] })] })] }), _jsx(ChevronRight, { className: "w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 self-center" })] }, course.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Performance Overview" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 font-medium", children: "Chart visualization coming soon" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Student engagement and revenue trends" })] }) }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Pending Tasks" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Link, { to: "/instructor/integrity", className: "flex items-center justify-between p-3 bg-danger-50 border border-danger-200 rounded-lg hover:bg-danger-100 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ShieldCheck, { className: "w-5 h-5 text-danger-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-danger-900", children: "Integrity Reviews" }), _jsxs("p", { className: "text-xs text-danger-700", children: [stats.pendingReviews, " pending"] })] })] }), _jsx(ChevronRight, { className: "w-5 h-5 text-danger-600" })] }), _jsx("div", { className: "flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(MessageSquare, { className: "w-5 h-5 text-warning-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-warning-900", children: "Student Questions" }), _jsx("p", { className: "text-xs text-warning-700", children: "8 unanswered" })] })] }) }), _jsx("div", { className: "flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Eye, { className: "w-5 h-5 text-primary-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-primary-900", children: "Course Reviews" }), _jsx("p", { className: "text-xs text-primary-700", children: "3 new reviews" })] })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { className: "space-y-3", children: recentActivity.map((activity, index) => {
                                            const Icon = activity.icon;
                                            const colorClasses = {
                                                primary: 'bg-primary-100 text-primary-600',
                                                warning: 'bg-warning-100 text-warning-600',
                                                success: 'bg-success-100 text-success-600',
                                                info: 'bg-gray-100 text-gray-600',
                                            };
                                            return (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`, children: _jsx(Icon, { className: "w-4 h-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-gray-900 font-medium", children: activity.message }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: activity.time })] })] }, index));
                                        }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resources" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsx(Link, { to: "/instructor/help", children: _jsx(Button, { variant: "ghost", size: "sm", fullWidth: true, className: "justify-start", children: "Teaching Guide" }) }), _jsx(Link, { to: "/instructor/best-practices", children: _jsx(Button, { variant: "ghost", size: "sm", fullWidth: true, className: "justify-start", children: "Best Practices" }) }), _jsx(Link, { to: "/instructor/support", children: _jsx(Button, { variant: "ghost", size: "sm", fullWidth: true, className: "justify-start", children: "Get Support" }) })] })] })] })] })] }));
}
