import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, DollarSign, Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Shield, Settings, BarChart3, Search, MoreVertical, Eye, Edit, UserCheck, UserX, } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Input, Select, Tabs, Alert, Skeleton, } from '../../components/ui';
import { cn } from '../../lib/utils';
export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        pendingCourses: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        systemHealth: 'healthy',
    });
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    useEffect(() => {
        loadDashboardData();
    }, []);
    const loadDashboardData = async () => {
        try {
            // Mock data - would come from API
            setStats({
                totalUsers: 5847,
                activeUsers: 3421,
                totalCourses: 234,
                pendingCourses: 12,
                totalRevenue: 487500,
                monthlyRevenue: 45600,
                systemHealth: 'healthy',
            });
            setUsers([
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'student',
                    status: 'active',
                    joinedAt: '2024-01-15',
                    lastActive: '2 hours ago',
                },
                {
                    id: '2',
                    name: 'Sarah Johnson',
                    email: 'sarah@example.com',
                    role: 'instructor',
                    status: 'active',
                    joinedAt: '2023-11-20',
                    lastActive: '1 day ago',
                },
                {
                    id: '3',
                    name: 'Mike Chen',
                    email: 'mike@example.com',
                    role: 'student',
                    status: 'suspended',
                    joinedAt: '2024-02-10',
                    lastActive: '1 week ago',
                },
                {
                    id: '4',
                    name: 'Emily Davis',
                    email: 'emily@example.com',
                    role: 'instructor',
                    status: 'active',
                    joinedAt: '2023-12-05',
                    lastActive: '3 hours ago',
                },
                {
                    id: '5',
                    name: 'Alex Thompson',
                    email: 'alex@example.com',
                    role: 'student',
                    status: 'pending',
                    joinedAt: '2024-04-10',
                    lastActive: 'Never',
                },
            ]);
            setCourses([
                {
                    id: '1',
                    title: 'Complete React Developer Course',
                    instructor: 'Sarah Johnson',
                    status: 'published',
                    enrollments: 456,
                    createdAt: '2024-01-15',
                },
                {
                    id: '2',
                    title: 'Advanced TypeScript Patterns',
                    instructor: 'Emily Davis',
                    status: 'pending_review',
                    enrollments: 0,
                    createdAt: '2024-04-08',
                },
                {
                    id: '3',
                    title: 'Node.js Microservices Architecture',
                    instructor: 'Sarah Johnson',
                    status: 'published',
                    enrollments: 289,
                    createdAt: '2024-02-20',
                },
                {
                    id: '4',
                    title: 'Python Data Science Bootcamp',
                    instructor: 'Emily Davis',
                    status: 'draft',
                    enrollments: 0,
                    createdAt: '2024-03-30',
                },
            ]);
            setRecentActivity([
                {
                    type: 'user_registered',
                    message: 'New user registered: Alex Thompson',
                    time: '10 minutes ago',
                    icon: Users,
                    color: 'primary',
                },
                {
                    type: 'course_submitted',
                    message: 'Course submitted for review: Advanced TypeScript',
                    time: '2 hours ago',
                    icon: BookOpen,
                    color: 'warning',
                },
                {
                    type: 'user_suspended',
                    message: 'User suspended: Mike Chen (Violation)',
                    time: '5 hours ago',
                    icon: AlertTriangle,
                    color: 'danger',
                },
                {
                    type: 'course_published',
                    message: 'Course published: React Performance Optimization',
                    time: '1 day ago',
                    icon: CheckCircle,
                    color: 'success',
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
    const handleToggleUserStatus = (userId) => {
        setUsers(users.map(u => u.id === userId
            ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
            : u));
    };
    const handleApproveCourse = (courseId) => {
        setCourses(courses.map(c => c.id === courseId
            ? { ...c, status: 'published' }
            : c));
    };
    const handleRejectCourse = (courseId) => {
        setCourses(courses.map(c => c.id === courseId
            ? { ...c, status: 'rejected' }
            : c));
    };
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    const tabs = [
        { id: 'overview', label: 'Overview', icon: _jsx(Activity, { className: "w-4 h-4" }) },
        { id: 'users', label: 'Users', icon: _jsx(Users, { className: "w-4 h-4" }), badge: stats.totalUsers },
        { id: 'courses', label: 'Courses', icon: _jsx(BookOpen, { className: "w-4 h-4" }), badge: stats.pendingCourses > 0 ? stats.pendingCourses : undefined },
    ];
    if (loading) {
        return (_jsx(AppLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-32 w-full" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" })] })] }) }));
    }
    return (_jsxs(AppLayout, { children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Admin Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Platform management and system monitoring" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Link, { to: "/admin/settings", children: _jsx(Button, { variant: "ghost", icon: _jsx(Settings, { className: "w-5 h-5" }), children: "Settings" }) }), _jsx(Link, { to: "/admin/analytics", children: _jsx(Button, { variant: "primary", icon: _jsx(BarChart3, { className: "w-5 h-5" }), children: "Analytics" }) })] })] }) }), stats.systemHealth !== 'healthy' && (_jsxs(Alert, { variant: stats.systemHealth === 'warning' ? 'warning' : 'danger', className: "mb-6", children: [_jsx("strong", { children: "System Health Alert:" }), " ", stats.systemHealth === 'warning'
                        ? 'Some services are experiencing degraded performance.'
                        : 'Critical system issues detected. Immediate attention required.'] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Users" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalUsers.toLocaleString() })] }), _jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center", children: _jsx(Users, { className: "w-6 h-6 text-primary-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-success-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), stats.activeUsers.toLocaleString(), " active users"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Courses" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalCourses })] }), _jsx("div", { className: "w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center", children: _jsx(BookOpen, { className: "w-6 h-6 text-success-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-warning-600", children: [_jsx(Clock, { className: "w-4 h-4 mr-1" }), stats.pendingCourses, " pending review"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Total Revenue" }), _jsxs("p", { className: "text-3xl font-bold text-gray-900", children: ["$", (stats.totalRevenue / 1000).toFixed(0), "k"] })] }), _jsx("div", { className: "w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center", children: _jsx(DollarSign, { className: "w-6 h-6 text-accent-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-success-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), "$", stats.monthlyRevenue.toLocaleString(), " this month"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "System Health" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 capitalize", children: stats.systemHealth })] }), _jsx("div", { className: cn("w-12 h-12 rounded-lg flex items-center justify-center", stats.systemHealth === 'healthy' && "bg-success-100", stats.systemHealth === 'warning' && "bg-warning-100", stats.systemHealth === 'critical' && "bg-danger-100"), children: _jsx(Activity, { className: cn("w-6 h-6", stats.systemHealth === 'healthy' && "text-success-600", stats.systemHealth === 'warning' && "text-warning-600", stats.systemHealth === 'critical' && "text-danger-600") }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Shield, { className: "w-4 h-4 mr-1" }), "All services operational"] })] }) })] }), _jsx("div", { className: "mb-6", children: _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "underline" }) }), activeTab === 'overview' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: recentActivity.map((activity, index) => {
                                            const Icon = activity.icon;
                                            const colorClasses = {
                                                primary: 'bg-primary-100 text-primary-600',
                                                warning: 'bg-warning-100 text-warning-600',
                                                success: 'bg-success-100 text-success-600',
                                                danger: 'bg-danger-100 text-danger-600',
                                            };
                                            return (_jsxs("div", { className: "flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-gray-900 font-medium", children: activity.message }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: activity.time })] })] }, index));
                                        }) }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Stats" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Active Users Today" }), _jsx("span", { className: "text-lg font-bold text-gray-900", children: "847" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "New Registrations" }), _jsx("span", { className: "text-lg font-bold text-gray-900", children: "23" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Courses Published" }), _jsx("span", { className: "text-lg font-bold text-gray-900", children: "3" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Revenue Today" }), _jsx("span", { className: "text-lg font-bold text-gray-900", children: "$1,245" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "System Status" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "API Server" }), _jsx(Badge, { variant: "success", children: "Operational" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Database" }), _jsx(Badge, { variant: "success", children: "Operational" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "File Storage" }), _jsx(Badge, { variant: "success", children: "Operational" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Email Service" }), _jsx(Badge, { variant: "success", children: "Operational" })] })] })] })] })] })), activeTab === 'users' && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsx(CardTitle, { children: "User Management" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto", children: [_jsx(Input, { placeholder: "Search users...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), leftIcon: _jsx(Search, { className: "w-4 h-4" }), className: "w-full sm:w-64" }), _jsx(Select, { options: [
                                                { value: 'all', label: 'All Roles' },
                                                { value: 'student', label: 'Students' },
                                                { value: 'instructor', label: 'Instructors' },
                                                { value: 'admin', label: 'Admins' },
                                            ], value: filterRole, onChange: (e) => setFilterRole(e.target.value) }), _jsx(Select, { options: [
                                                { value: 'all', label: 'All Status' },
                                                { value: 'active', label: 'Active' },
                                                { value: 'suspended', label: 'Suspended' },
                                                { value: 'pending', label: 'Pending' },
                                            ], value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) })] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "User" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Role" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Status" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Joined" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-semibold text-gray-700", children: "Last Active" }), _jsx("th", { className: "text-right py-3 px-4 text-sm font-semibold text-gray-700", children: "Actions" })] }) }), _jsx("tbody", { children: filteredUsers.map((user) => (_jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Avatar, { name: user.name, size: "sm" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: user.name }), _jsx("p", { className: "text-sm text-gray-600", children: user.email })] })] }) }), _jsx("td", { className: "py-4 px-4", children: _jsx(Badge, { variant: user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'warning' : 'info', children: user.role }) }), _jsx("td", { className: "py-4 px-4", children: _jsx(Badge, { variant: user.status === 'active' ? 'success' :
                                                            user.status === 'suspended' ? 'danger' : 'warning', children: user.status }) }), _jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: new Date(user.joinedAt).toLocaleDateString() }), _jsx("td", { className: "py-4 px-4 text-sm text-gray-600", children: user.lastActive }), _jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", icon: user.status === 'active' ? _jsx(UserX, { className: "w-4 h-4" }) : _jsx(UserCheck, { className: "w-4 h-4" }), onClick: () => handleToggleUserStatus(user.id) })] }) })] }, user.id))) })] }) }) })] })), activeTab === 'courses' && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [_jsx(CardTitle, { children: "Course Moderation" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto", children: [_jsx(Input, { placeholder: "Search courses...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), leftIcon: _jsx(Search, { className: "w-4 h-4" }), className: "w-full sm:w-64" }), _jsx(Select, { options: [
                                                { value: 'all', label: 'All Status' },
                                                { value: 'published', label: 'Published' },
                                                { value: 'pending_review', label: 'Pending Review' },
                                                { value: 'draft', label: 'Draft' },
                                                { value: 'rejected', label: 'Rejected' },
                                            ], value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) })] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: filteredCourses.map((course) => (_jsx("div", { className: "p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: course.title }), _jsx(Badge, { variant: course.status === 'published' ? 'success' :
                                                                course.status === 'pending_review' ? 'warning' :
                                                                    course.status === 'rejected' ? 'danger' : 'neutral', children: course.status.replace('_', ' ') })] }), _jsxs("p", { className: "text-sm text-gray-600 mb-3", children: ["Instructor: ", course.instructor, " \u2022 Created: ", new Date(course.createdAt).toLocaleDateString()] }), _jsx("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: _jsxs("span", { children: [course.enrollments, " enrollments"] }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [course.status === 'pending_review' && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "success", size: "sm", icon: _jsx(CheckCircle, { className: "w-4 h-4" }), onClick: () => handleApproveCourse(course.id), children: "Approve" }), _jsx(Button, { variant: "danger", size: "sm", icon: _jsx(XCircle, { className: "w-4 h-4" }), onClick: () => handleRejectCourse(course.id), children: "Reject" })] })), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(MoreVertical, { className: "w-4 h-4" }) })] })] }) }, course.id))) }) })] }))] }));
}
