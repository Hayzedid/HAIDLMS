import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Code, Users, BarChart3, MessageSquare, Trophy, Settings, ShieldCheck, GraduationCap, GitBranch, Bell, } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
export const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const studentNavItems = [
        { label: 'Dashboard', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), href: '/dashboard' },
        { label: 'My Courses', icon: _jsx(BookOpen, { className: "w-5 h-5" }), href: '/my-courses' },
        { label: 'Browse Courses', icon: _jsx(GraduationCap, { className: "w-5 h-5" }), href: '/courses' },
        { label: 'Code Playground', icon: _jsx(Code, { className: "w-5 h-5" }), href: '/playground' },
        { label: 'AI Tutor', icon: _jsx(MessageSquare, { className: "w-5 h-5" }), href: '/ai-tutor' },
        { label: 'Peer Review', icon: _jsx(Users, { className: "w-5 h-5" }), href: '/peer-review' },
        { label: 'Leaderboard', icon: _jsx(Trophy, { className: "w-5 h-5" }), href: '/leaderboard' },
        { label: 'Learning Health', icon: _jsx(BarChart3, { className: "w-5 h-5" }), href: '/health' },
        { label: 'Notifications', icon: _jsx(Bell, { className: "w-5 h-5" }), href: '/notifications', badge: 3 },
    ];
    const instructorNavItems = [
        { label: 'Dashboard', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), href: '/instructor/dashboard' },
        { label: 'My Courses', icon: _jsx(BookOpen, { className: "w-5 h-5" }), href: '/instructor/courses' },
        { label: 'Analytics', icon: _jsx(BarChart3, { className: "w-5 h-5" }), href: '/instructor/analytics' },
        { label: 'Student Health', icon: _jsx(Users, { className: "w-5 h-5" }), href: '/instructor/health' },
        { label: 'Integrity Review', icon: _jsx(ShieldCheck, { className: "w-5 h-5" }), href: '/instructor/integrity' },
        { label: 'GitHub Import', icon: _jsx(GitBranch, { className: "w-5 h-5" }), href: '/instructor/github-import' },
        { label: 'Course Insights', icon: _jsx(BarChart3, { className: "w-5 h-5" }), href: '/instructor/insights' },
    ];
    const adminNavItems = [
        { label: 'Admin Dashboard', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), href: '/admin/dashboard' },
        { label: 'User Management', icon: _jsx(Users, { className: "w-5 h-5" }), href: '/admin/users' },
        { label: 'Course Moderation', icon: _jsx(BookOpen, { className: "w-5 h-5" }), href: '/admin/courses' },
        { label: 'System Analytics', icon: _jsx(BarChart3, { className: "w-5 h-5" }), href: '/admin/analytics' },
        { label: 'Settings', icon: _jsx(Settings, { className: "w-5 h-5" }), href: '/admin/settings' },
    ];
    const getNavItems = () => {
        if (!user)
            return [];
        switch (user.role) {
            case 'admin':
                return adminNavItems;
            case 'instructor':
                return instructorNavItems;
            case 'student':
            default:
                return studentNavItems;
        }
    };
    const navItems = getNavItems();
    return (_jsxs(_Fragment, { children: [isOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-40 lg:hidden", onClick: onClose })), _jsxs("aside", { className: cn('fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out overflow-y-auto', isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'), children: [_jsxs("nav", { className: "p-4 space-y-1", children: [user && (_jsxs("div", { className: "mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg", children: [_jsx("p", { className: "text-xs font-medium text-primary-600 uppercase tracking-wide", children: user.role }), _jsx("p", { className: "text-sm font-semibold text-gray-900 mt-0.5", children: user.name })] })), navItems.map((item) => (_jsxs(NavLink, { to: item.href, onClick: () => {
                                    // Close sidebar on mobile after navigation
                                    if (window.innerWidth < 1024) {
                                        onClose();
                                    }
                                }, className: ({ isActive }) => cn('flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium', isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-100'), children: [_jsxs("div", { className: "flex items-center gap-3", children: [item.icon, _jsx("span", { children: item.label })] }), item.badge && (_jsx("span", { className: "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold bg-danger-500 text-white rounded-full", children: item.badge }))] }, item.href))), _jsx("div", { className: "my-4 border-t border-gray-200" }), _jsxs(NavLink, { to: "/settings", onClick: onClose, className: ({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium', isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-100'), children: [_jsx(Settings, { className: "w-5 h-5" }), _jsx("span", { children: "Settings" })] })] }), user?.role === 'student' && (_jsxs("div", { className: "p-4 mx-4 mb-4 bg-gray-50 rounded-lg border border-gray-200", children: [_jsx("h3", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Your Progress" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Courses Enrolled" }), _jsx("span", { className: "font-semibold text-gray-900", children: "8" })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Completed" }), _jsx("span", { className: "font-semibold text-gray-900", children: "3" })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "In Progress" }), _jsx("span", { className: "font-semibold text-gray-900", children: "5" })] })] })] }))] })] }));
};
