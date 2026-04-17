import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Calendar, MapPin, Link as LinkIcon, Github, Linkedin, Twitter, Edit, Award, BookOpen, Trophy, Target, TrendingUp, } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Tabs, Progress, } from '../../components/ui';
export default function ProfilePage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    // Mock data
    const profileData = {
        name: user?.name || 'John Doe',
        email: user?.email || 'john@example.com',
        role: user?.role || 'student',
        avatar: user?.avatar,
        bio: 'Passionate about learning and building great software. Currently focused on full-stack development and cloud technologies.',
        location: 'San Francisco, CA',
        joinedDate: 'January 2024',
        website: 'https://johndoe.dev',
        github: 'johndoe',
        linkedin: 'johndoe',
        twitter: '@johndoe',
    };
    const stats = {
        coursesEnrolled: 12,
        coursesCompleted: 8,
        certificates: 5,
        learningStreak: 15,
        totalPoints: 2450,
        rank: 156,
    };
    const enrolledCourses = [
        {
            id: '1',
            title: 'Complete React Developer Course',
            progress: 75,
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
        },
        {
            id: '2',
            title: 'Advanced TypeScript Patterns',
            progress: 45,
            thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
        },
        {
            id: '3',
            title: 'Node.js Microservices',
            progress: 90,
            thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
        },
    ];
    const achievements = [
        {
            id: '1',
            title: 'Fast Learner',
            description: 'Completed 5 courses in 30 days',
            icon: _jsx(TrendingUp, { className: "w-8 h-8" }),
            color: 'primary',
            earnedDate: '2024-03-15',
        },
        {
            id: '2',
            title: 'Code Master',
            description: 'Solved 100 coding challenges',
            icon: _jsx(Trophy, { className: "w-8 h-8" }),
            color: 'warning',
            earnedDate: '2024-03-10',
        },
        {
            id: '3',
            title: 'Team Player',
            description: 'Completed 20 peer reviews',
            icon: _jsx(Award, { className: "w-8 h-8" }),
            color: 'success',
            earnedDate: '2024-03-05',
        },
        {
            id: '4',
            title: 'Consistent',
            description: '30-day learning streak',
            icon: _jsx(Target, { className: "w-8 h-8" }),
            color: 'accent',
            earnedDate: '2024-02-28',
        },
    ];
    const recentActivity = [
        {
            type: 'completed',
            message: 'Completed lesson: React Hooks Deep Dive',
            time: '2 hours ago',
        },
        {
            type: 'achievement',
            message: 'Earned achievement: Fast Learner',
            time: '1 day ago',
        },
        {
            type: 'review',
            message: 'Submitted peer review for Advanced TypeScript',
            time: '2 days ago',
        },
        {
            type: 'enrolled',
            message: 'Enrolled in System Design Fundamentals',
            time: '3 days ago',
        },
    ];
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'courses', label: 'Courses', badge: stats.coursesEnrolled },
        { id: 'achievements', label: 'Achievements', badge: achievements.length },
        { id: 'activity', label: 'Activity' },
    ];
    return (_jsxs(AppLayout, { children: [_jsx(Card, { className: "mb-8", children: _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-start gap-8", children: [_jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx(Avatar, { src: profileData.avatar, name: profileData.name, size: "2xl", className: "ring-4 ring-primary-100" }), _jsx(Link, { to: "/settings", children: _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(Edit, { className: "w-4 h-4" }), children: "Edit Profile" }) })] }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: profileData.name }), _jsx(Badge, { variant: "info", className: "mb-4 capitalize", children: profileData.role })] }) }), _jsx("p", { className: "text-gray-600 mb-6 max-w-2xl", children: profileData.bio }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(Mail, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: profileData.email })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm", children: ["Joined ", profileData.joinedDate] })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(MapPin, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: profileData.location })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-600", children: [_jsx(LinkIcon, { className: "w-4 h-4" }), _jsx("a", { href: profileData.website, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-primary-600 hover:underline", children: profileData.website })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("a", { href: `https://github.com/${profileData.github}`, target: "_blank", rel: "noopener noreferrer", className: "p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors", children: _jsx(Github, { className: "w-5 h-5 text-gray-700" }) }), _jsx("a", { href: `https://linkedin.com/in/${profileData.linkedin}`, target: "_blank", rel: "noopener noreferrer", className: "p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors", children: _jsx(Linkedin, { className: "w-5 h-5 text-gray-700" }) }), _jsx("a", { href: `https://twitter.com/${profileData.twitter}`, target: "_blank", rel: "noopener noreferrer", className: "p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors", children: _jsx(Twitter, { className: "w-5 h-5 text-gray-700" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 md:min-w-[300px]", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold text-primary-600", children: stats.coursesCompleted }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Completed" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold text-warning-600", children: stats.certificates }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Certificates" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("p", { className: "text-3xl font-bold text-success-600", children: stats.learningStreak }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Day Streak" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsxs("p", { className: "text-3xl font-bold text-accent-600", children: ["#", stats.rank] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Rank" })] }) })] })] }) }) }), _jsx("div", { className: "mb-6", children: _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "underline" }) }), activeTab === 'overview' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Learning Progress" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Course Completion" }), _jsxs("span", { className: "text-sm font-bold text-gray-900", children: [stats.coursesCompleted, "/", stats.coursesEnrolled] })] }), _jsx(Progress, { value: (stats.coursesCompleted / stats.coursesEnrolled) * 100, className: "h-2" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Total Points" }), _jsx("span", { className: "text-sm font-bold text-gray-900", children: stats.totalPoints })] }), _jsx(Progress, { value: 65, className: "h-2" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Current Courses" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: enrolledCourses.map((course) => (_jsxs(Link, { to: `/courses/${course.id}/learn`, className: "flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx("img", { src: course.thumbnail, alt: course.title, className: "w-24 h-16 object-cover rounded-lg flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: course.title }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Progress" }), _jsxs("span", { className: "font-semibold text-gray-900", children: [course.progress, "%"] })] }), _jsx(Progress, { value: course.progress, className: "h-1.5 mt-2" })] })] }, course.id))) }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Achievements" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: achievements.slice(0, 3).map((achievement) => {
                                                const colorClasses = {
                                                    primary: 'bg-primary-100 text-primary-600',
                                                    warning: 'bg-warning-100 text-warning-600',
                                                    success: 'bg-success-100 text-success-600',
                                                    accent: 'bg-accent-100 text-accent-600',
                                                };
                                                return (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[achievement.color]}`, children: achievement.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-1", children: achievement.title }), _jsx("p", { className: "text-sm text-gray-600", children: achievement.description })] })] }, achievement.id));
                                            }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: recentActivity.map((activity, index) => (_jsxs("div", { className: "flex items-start gap-3 text-sm", children: [_jsx("div", { className: "w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-gray-900", children: activity.message }), _jsx("p", { className: "text-gray-500 text-xs mt-1", children: activity.time })] })] }, index))) }) })] })] })] })), activeTab === 'courses' && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: enrolledCourses.map((course) => (_jsx(Link, { to: `/courses/${course.id}/learn`, children: _jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-all", children: [_jsx("img", { src: course.thumbnail, alt: course.title, className: "w-full h-40 object-cover" }), _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: course.title }), _jsxs("div", { className: "flex items-center justify-between text-sm mb-2", children: [_jsx("span", { className: "text-gray-600", children: "Progress" }), _jsxs("span", { className: "font-semibold text-gray-900", children: [course.progress, "%"] })] }), _jsx(Progress, { value: course.progress, className: "h-2" })] })] }) }, course.id))) })), activeTab === 'achievements' && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: achievements.map((achievement) => {
                    const colorClasses = {
                        primary: 'from-primary-400 to-primary-600',
                        warning: 'from-warning-400 to-warning-600',
                        success: 'from-success-400 to-success-600',
                        accent: 'from-accent-400 to-accent-600',
                    };
                    return (_jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-all", children: [_jsx("div", { className: `bg-gradient-to-br ${colorClasses[achievement.color]} p-8 flex items-center justify-center text-white`, children: achievement.icon }), _jsxs(CardContent, { className: "p-6", children: [_jsx("h3", { className: "font-bold text-gray-900 mb-2", children: achievement.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: achievement.description }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Earned on ", new Date(achievement.earnedDate).toLocaleDateString()] })] })] }, achievement.id));
                }) })), activeTab === 'activity' && (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx("div", { className: "space-y-6", children: recentActivity.map((activity, index) => (_jsxs("div", { className: "flex items-start gap-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0", children: [_jsx("div", { className: "w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(BookOpen, { className: "w-5 h-5 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-gray-900 font-medium", children: activity.message }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: activity.time })] })] }, index))) }) }) }))] }));
}
