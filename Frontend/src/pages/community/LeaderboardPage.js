import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Star, TrendingUp, Award, Zap, Target, } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { AppLayout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle, Avatar, Badge, Tabs, Skeleton, } from "../../components/ui";
import { cn } from "../../lib/utils";
export default function LeaderboardPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("global");
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    useEffect(() => {
        loadLeaderboard();
    }, [activeTab]);
    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            // Mock data - would come from API
            const mockData = [
                {
                    rank: 1,
                    userId: "1",
                    name: "Sarah Johnson",
                    avatar: undefined,
                    points: 5280,
                    coursesCompleted: 24,
                    streak: 45,
                    badges: 18,
                    change: 2,
                },
                {
                    rank: 2,
                    userId: "2",
                    name: "Michael Chen",
                    avatar: undefined,
                    points: 4950,
                    coursesCompleted: 21,
                    streak: 38,
                    badges: 15,
                    change: -1,
                },
                {
                    rank: 3,
                    userId: "3",
                    name: "Emily Davis",
                    avatar: undefined,
                    points: 4720,
                    coursesCompleted: 19,
                    streak: 42,
                    badges: 16,
                    change: 1,
                },
                {
                    rank: 4,
                    userId: "4",
                    name: "Alex Martinez",
                    avatar: undefined,
                    points: 4380,
                    coursesCompleted: 18,
                    streak: 31,
                    badges: 14,
                    change: 0,
                },
                {
                    rank: 5,
                    userId: "5",
                    name: "Jessica Lee",
                    avatar: undefined,
                    points: 4120,
                    coursesCompleted: 17,
                    streak: 28,
                    badges: 13,
                    change: 3,
                },
                // More entries...
                {
                    rank: 156,
                    userId: user?.id || "",
                    name: user?.name || "You",
                    avatar: user?.avatar || undefined,
                    points: 2450,
                    coursesCompleted: 8,
                    streak: 15,
                    badges: 8,
                    change: 5,
                },
            ];
            setLeaderboard(mockData.slice(0, 50));
            setCurrentUserRank(mockData.find((entry) => entry.userId === user?.id) || null);
        }
        catch (error) {
            console.error("Failed to load leaderboard:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return _jsx(Crown, { className: "w-6 h-6 text-warning-500" });
            case 2:
                return _jsx(Medal, { className: "w-6 h-6 text-gray-400" });
            case 3:
                return _jsx(Medal, { className: "w-6 h-6 text-amber-600" });
            default:
                return null;
        }
    };
    const getRankBadgeColor = (rank) => {
        if (rank === 1)
            return "from-warning-400 to-warning-600";
        if (rank === 2)
            return "from-gray-300 to-gray-500";
        if (rank === 3)
            return "from-amber-400 to-amber-600";
        return "from-gray-200 to-gray-400";
    };
    const topAchievements = [
        {
            id: "1",
            name: "Course Completions",
            icon: _jsx(Trophy, { className: "w-8 h-8" }),
            color: "from-warning-400 to-warning-600",
            count: currentUserRank?.coursesCompleted || 0,
        },
        {
            id: "2",
            name: "Learning Streak",
            icon: _jsx(Zap, { className: "w-8 h-8" }),
            color: "from-primary-400 to-primary-600",
            count: currentUserRank?.streak || 0,
        },
        {
            id: "3",
            name: "Total Points",
            icon: _jsx(Star, { className: "w-8 h-8" }),
            color: "from-accent-400 to-accent-600",
            count: currentUserRank?.points || 0,
        },
        {
            id: "4",
            name: "Badges Earned",
            icon: _jsx(Award, { className: "w-8 h-8" }),
            color: "from-success-400 to-success-600",
            count: currentUserRank?.badges || 0,
        },
    ];
    const tabs = [
        { id: "global", label: "All Time" },
        { id: "weekly", label: "This Week" },
        { id: "monthly", label: "This Month" },
        { id: "friends", label: "Friends" },
    ];
    return (_jsxs(AppLayout, { children: [_jsx("div", { className: "bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl", children: _jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center", children: _jsx(Trophy, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold", children: "Leaderboard" }), _jsx("p", { className: "text-warning-100 text-lg", children: "Compete with learners worldwide" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [currentUserRank && (_jsx(Card, { className: "bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: `w-16 h-16 bg-gradient-to-br ${getRankBadgeColor(currentUserRank.rank)} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`, children: ["#", currentUserRank.rank] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600 mb-1", children: "Your Rank" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: currentUserRank.name }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm text-gray-600", children: [_jsxs("span", { children: [currentUserRank.points, " points"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [currentUserRank.coursesCompleted, " courses"] })] })] })] }), currentUserRank.change !== 0 && (_jsxs("div", { className: cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold", currentUserRank.change > 0
                                                    ? "bg-success-100 text-success-700"
                                                    : "bg-danger-100 text-danger-700"), children: [_jsx(TrendingUp, { className: cn("w-4 h-4", currentUserRank.change < 0 && "rotate-180") }), Math.abs(currentUserRank.change)] }))] }) }) })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Rankings" }), _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "pills", size: "sm" })] }) }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "space-y-4", children: [...Array(10)].map((_, i) => (_jsx(Skeleton, { className: "h-20" }, i))) })) : (_jsx("div", { className: "space-y-3", children: leaderboard.map((entry) => {
                                                const isCurrentUser = entry.userId === user?.id;
                                                const isTopThree = entry.rank <= 3;
                                                return (_jsxs("div", { className: cn("flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-md", isCurrentUser
                                                        ? "bg-primary-50 border-2 border-primary-200"
                                                        : "bg-gray-50 hover:bg-gray-100", isTopThree && "shadow-md"), children: [_jsx("div", { className: "flex items-center justify-center w-16 flex-shrink-0", children: getRankIcon(entry.rank) || (_jsxs("div", { className: cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg", isTopThree
                                                                    ? `bg-gradient-to-br ${getRankBadgeColor(entry.rank)} text-white shadow-lg`
                                                                    : "bg-gray-200 text-gray-700"), children: ["#", entry.rank] })) }), _jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [_jsx(Avatar, { name: entry.name, src: entry.avatar, size: "md" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsxs("p", { className: "font-semibold text-gray-900 truncate", children: [entry.name, isCurrentUser && (_jsx("span", { className: "text-primary-600 ml-2", children: "(You)" }))] }), isTopThree && (_jsxs(Badge, { variant: "warning", className: "text-xs", children: ["Top ", entry.rank] }))] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Star, { className: "w-4 h-4 fill-warning-500 text-warning-500" }), entry.points, " pts"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [entry.coursesCompleted, " courses"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Zap, { className: "w-4 h-4 text-primary-600" }), entry.streak, " days"] })] })] })] }), entry.change !== 0 && (_jsxs("div", { className: cn("flex items-center gap-1 text-sm font-semibold", entry.change > 0
                                                                ? "text-success-600"
                                                                : "text-danger-600"), children: [_jsx(TrendingUp, { className: cn("w-4 h-4", entry.change < 0 && "rotate-180") }), Math.abs(entry.change)] }))] }, entry.userId));
                                            }) })) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Your Stats" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 gap-4", children: topAchievements.map((achievement) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: `w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg`, children: achievement.icon }), _jsx("p", { className: "text-2xl font-bold text-gray-900 mb-1", children: achievement.count }), _jsx("p", { className: "text-xs text-gray-600", children: achievement.name })] }, achievement.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "How Points Work" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Trophy, { className: "w-5 h-5 text-success-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: "Complete a Course" }), _jsx("p", { className: "text-xs text-gray-600", children: "+500 points" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Target, { className: "w-5 h-5 text-primary-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: "Complete a Lesson" }), _jsx("p", { className: "text-xs text-gray-600", children: "+50 points" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Zap, { className: "w-5 h-5 text-warning-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: "Daily Streak" }), _jsx("p", { className: "text-xs text-gray-600", children: "+10 points/day" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx(Award, { className: "w-5 h-5 text-accent-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900 text-sm", children: "Earn Achievement" }), _jsx("p", { className: "text-xs text-gray-600", children: "+100 points" })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Top Contributors" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-warning-400 to-warning-600 rounded-full flex items-center justify-center", children: _jsx(Crown, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900 text-sm", children: "Most Helpful" }), _jsx("p", { className: "text-xs text-gray-600", children: "Sarah Johnson" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center", children: _jsx(Star, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900 text-sm", children: "Top Reviewer" }), _jsx("p", { className: "text-xs text-gray-600", children: "Michael Chen" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center", children: _jsx(Trophy, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900 text-sm", children: "Fastest Learner" }), _jsx("p", { className: "text-xs text-gray-600", children: "Emily Davis" })] })] })] }) })] })] })] })] }));
}
