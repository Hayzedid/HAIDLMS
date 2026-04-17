import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Code, Trophy, Target, TrendingUp, Clock, Play, ChevronRight, Star, Award, Zap, } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { courseApi } from "../../api/course.api";
import { AppLayout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Skeleton, } from "../../components/ui";
export default function StudentDashboard() {
    const { user } = useAuthStore();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLearningHours: 0,
        currentStreak: 0,
        totalPoints: 0,
    });
    useEffect(() => {
        loadDashboardData();
    }, []);
    const loadDashboardData = async () => {
        try {
            const response = await courseApi.getMyEnrollments({ status: "active" });
            const enrollmentData = response.data.data;
            setEnrollments(enrollmentData);
            // Calculate stats
            const completed = enrollmentData.filter((e) => e.status === "completed").length;
            const inProgress = enrollmentData.filter((e) => e.status === "active").length;
            setStats({
                totalCourses: enrollmentData.length,
                completedCourses: completed,
                inProgressCourses: inProgress,
                totalLearningHours: 47, // This would come from backend
                currentStreak: 7, // This would come from backend
                totalPoints: 1250, // This would come from backend
            });
        }
        catch (error) {
            console.error("Failed to load dashboard data:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return "Good morning";
        if (hour < 18)
            return "Good afternoon";
        return "Good evening";
    };
    // Get courses in progress (sorted by recent activity)
    const continueLearning = enrollments
        .filter((e) => e.status === "active")
        .slice(0, 1);
    // Mock recommended courses
    const recommendedCourses = [
        {
            id: "1",
            title: "Advanced React Patterns",
            instructor: "Sarah Johnson",
            rating: 4.8,
            students: 12500,
            thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        },
        {
            id: "2",
            title: "System Design Fundamentals",
            instructor: "Michael Chen",
            rating: 4.9,
            students: 8900,
            thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
        },
    ];
    if (loading) {
        return (_jsx(AppLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-48 w-full" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" }), _jsx(Skeleton, { className: "h-32" })] })] }) }));
    }
    return (_jsxs(AppLayout, { children: [_jsx("div", { className: "bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl", children: _jsxs("div", { className: "flex items-start justify-between flex-wrap gap-6", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h1", { className: "text-3xl md:text-4xl font-bold mb-2", children: [getGreeting(), ", ", user?.firstName, "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-primary-100 text-lg mb-6", children: "Ready to continue your learning journey?" }), continueLearning.length > 0 && (_jsx(Link, { to: `/courses/${continueLearning[0].courseId}/learn`, children: _jsxs(Button, { size: "lg", variant: "secondary", className: "shadow-lg", children: [_jsx(Play, { className: "w-5 h-5 mr-2" }), "Continue Learning"] }) }))] }), _jsxs("div", { className: "flex gap-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.currentStreak }), _jsx("div", { className: "text-sm text-primary-100", children: "Day Streak \uD83D\uDD25" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.totalPoints }), _jsx("div", { className: "text-sm text-primary-100", children: "Total Points" })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Enrolled Courses" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalCourses })] }), _jsx("div", { className: "w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center", children: _jsx(BookOpen, { className: "w-6 h-6 text-primary-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-success-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), stats.inProgressCourses, " in progress"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Completed" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.completedCourses })] }), _jsx("div", { className: "w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center", children: _jsx(Trophy, { className: "w-6 h-6 text-success-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), ((stats.completedCourses / stats.totalCourses) * 100).toFixed(0), "% completion rate"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Learning Hours" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: stats.totalLearningHours })] }), _jsx("div", { className: "w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center", children: _jsx(Clock, { className: "w-6 h-6 text-accent-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Zap, { className: "w-4 h-4 mr-1" }), "This month"] })] }) }), _jsx(Card, { className: "hover:shadow-lg transition-shadow", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Achievements" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: "8" })] }), _jsx("div", { className: "w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center", children: _jsx(Award, { className: "w-6 h-6 text-warning-600" }) })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-gray-600", children: [_jsx(Star, { className: "w-4 h-4 mr-1" }), "2 more to unlock"] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-8", children: [continueLearning.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Play, { className: "w-5 h-5 text-primary-600" }), "Continue Learning"] }) }), _jsx(CardContent, { children: continueLearning.map((enrollment) => (_jsxs(Link, { to: `/courses/${enrollment.course_id}/learn`, className: "flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group", children: [enrollment.cover_image_url ? (_jsx("img", { src: enrollment.cover_image_url, alt: enrollment.course_title, className: "w-32 h-20 object-cover rounded-lg flex-shrink-0" })) : (_jsx("div", { className: "w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(BookOpen, { className: "w-8 h-8 text-gray-400" }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors", children: enrollment.course_title }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Last activity: 2 hours ago" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Progress" }), _jsxs("span", { className: "font-semibold text-gray-900", children: [enrollment.progress_percent?.toFixed(0) || 0, "%"] })] }), _jsx(Progress, { value: enrollment.progress_percent || 0, className: "h-2" })] })] }), _jsx(ChevronRight, { className: "w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 self-center" })] }, enrollment.id))) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "My Courses" }), _jsx(Link, { to: "/my-courses", children: _jsxs(Button, { variant: "ghost", size: "sm", children: ["View All", _jsx(ChevronRight, { className: "w-4 h-4 ml-1" })] }) })] }) }), _jsx(CardContent, { children: enrollments.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No courses yet" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Start your learning journey by enrolling in a course" }), _jsx(Link, { to: "/courses", children: _jsx(Button, { variant: "primary", children: "Browse Courses" }) })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: enrollments.slice(0, 4).map((enrollment) => (_jsx(Link, { to: `/courses/${enrollment.course_id}/learn`, className: "group", children: _jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-primary-300", children: [enrollment.cover_image_url ? (_jsx("img", { src: enrollment.cover_image_url, alt: enrollment.course_title, className: "w-full h-32 object-cover" })) : (_jsx("div", { className: "w-full h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center", children: _jsx(BookOpen, { className: "w-12 h-12 text-white" }) })), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2", children: enrollment.course_title }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Progress" }), _jsxs("span", { className: "font-semibold text-gray-900", children: [enrollment.progress_percent?.toFixed(0) || 0, "%"] })] }), _jsx(Progress, { value: enrollment.progress_percent || 0, className: "h-1.5" })] }), _jsx(Badge, { variant: enrollment.status === "completed"
                                                                        ? "success"
                                                                        : "info", className: "mt-3", children: enrollment.status === "completed"
                                                                        ? "Completed"
                                                                        : "In Progress" })] })] }) }, enrollment.id))) })) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Link, { to: "/courses", children: _jsxs(Button, { variant: "ghost", fullWidth: true, className: "justify-start", children: [_jsx(BookOpen, { className: "w-5 h-5 mr-3 text-primary-600" }), _jsx("span", { children: "Browse Courses" })] }) }), _jsx(Link, { to: "/playground", children: _jsxs(Button, { variant: "ghost", fullWidth: true, className: "justify-start", children: [_jsx(Code, { className: "w-5 h-5 mr-3 text-success-600" }), _jsx("span", { children: "Code Playground" })] }) }), _jsx(Link, { to: "/ai-tutor", children: _jsxs(Button, { variant: "ghost", fullWidth: true, className: "justify-start", children: [_jsx(Zap, { className: "w-5 h-5 mr-3 text-accent-600" }), _jsx("span", { children: "AI Tutor" })] }) }), _jsx(Link, { to: "/leaderboard", children: _jsxs(Button, { variant: "ghost", fullWidth: true, className: "justify-start", children: [_jsx(Trophy, { className: "w-5 h-5 mr-3 text-warning-600" }), _jsx("span", { children: "Leaderboard" })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recommended for You" }) }), _jsxs(CardContent, { className: "space-y-4", children: [recommendedCourses.map((course) => (_jsx(Link, { to: `/courses/${course.id}`, className: "block group", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("img", { src: course.thumbnail, alt: course.title, className: "w-20 h-20 object-cover rounded-lg flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold text-sm text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2", children: course.title }), _jsx("p", { className: "text-xs text-gray-600 mb-1", children: course.instructor }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsxs("div", { className: "flex items-center text-warning-600", children: [_jsx(Star, { className: "w-3 h-3 fill-current mr-0.5" }), course.rating] }), _jsx("span", { className: "text-gray-400", children: "\u2022" }), _jsxs("span", { className: "text-gray-600", children: [course.students.toLocaleString(), " students"] })] })] })] }) }, course.id))), _jsx(Link, { to: "/courses", children: _jsxs(Button, { variant: "ghost", size: "sm", fullWidth: true, children: ["View More", _jsx(ChevronRight, { className: "w-4 h-4 ml-1" })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(Trophy, { className: "w-4 h-4 text-success-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-gray-900 font-medium", children: "Achievement Unlocked!" }), _jsx("p", { className: "text-xs text-gray-600", children: "First Course Completed" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "2 days ago" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(BookOpen, { className: "w-4 h-4 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-gray-900 font-medium", children: "Lesson Completed" }), _jsx("p", { className: "text-xs text-gray-600", children: "React Hooks Deep Dive" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "3 days ago" })] })] })] })] })] })] })] }));
}
