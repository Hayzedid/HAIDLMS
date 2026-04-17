import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Award,
  Zap,
  Target,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { AppLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  Badge,
  Tabs,
  Skeleton,
} from "../../components/ui";
import { cn } from "../../lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  points: number;
  coursesCompleted: number;
  streak: number;
  badges: number;
  change: number; // rank change from last week
}

interface Achievement {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "global" | "weekly" | "monthly" | "friends"
  >("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] =
    useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Mock data - would come from API
      const mockData: LeaderboardEntry[] = [
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
      setCurrentUserRank(
        mockData.find((entry) => entry.userId === user?.id) || null,
      );
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-warning-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "from-warning-400 to-warning-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-amber-400 to-amber-600";
    return "from-gray-200 to-gray-400";
  };

  const topAchievements: Achievement[] = [
    {
      id: "1",
      name: "Course Completions",
      icon: <Trophy className="w-8 h-8" />,
      color: "from-warning-400 to-warning-600",
      count: currentUserRank?.coursesCompleted || 0,
    },
    {
      id: "2",
      name: "Learning Streak",
      icon: <Zap className="w-8 h-8" />,
      color: "from-primary-400 to-primary-600",
      count: currentUserRank?.streak || 0,
    },
    {
      id: "3",
      name: "Total Points",
      icon: <Star className="w-8 h-8" />,
      color: "from-accent-400 to-accent-600",
      count: currentUserRank?.points || 0,
    },
    {
      id: "4",
      name: "Badges Earned",
      icon: <Award className="w-8 h-8" />,
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

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-warning-500 to-warning-600 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Leaderboard</h1>
            <p className="text-warning-100 text-lg">
              Compete with learners worldwide
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current User Rank Card */}
          {currentUserRank && (
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${getRankBadgeColor(currentUserRank.rank)} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                    >
                      #{currentUserRank.rank}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Your Rank
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentUserRank.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{currentUserRank.points} points</span>
                        <span>•</span>
                        <span>{currentUserRank.coursesCompleted} courses</span>
                      </div>
                    </div>
                  </div>

                  {currentUserRank.change !== 0 && (
                    <div
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold",
                        currentUserRank.change > 0
                          ? "bg-success-100 text-success-700"
                          : "bg-danger-100 text-danger-700",
                      )}
                    >
                      <TrendingUp
                        className={cn(
                          "w-4 h-4",
                          currentUserRank.change < 0 && "rotate-180",
                        )}
                      />
                      {Math.abs(currentUserRank.change)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rankings</CardTitle>
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={(tabId) => setActiveTab(tabId as any)}
                  variant="pills"
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry) => {
                    const isCurrentUser = entry.userId === user?.id;
                    const isTopThree = entry.rank <= 3;

                    return (
                      <div
                        key={entry.userId}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-md",
                          isCurrentUser
                            ? "bg-primary-50 border-2 border-primary-200"
                            : "bg-gray-50 hover:bg-gray-100",
                          isTopThree && "shadow-md",
                        )}
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center w-16 flex-shrink-0">
                          {getRankIcon(entry.rank) || (
                            <div
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                                isTopThree
                                  ? `bg-gradient-to-br ${getRankBadgeColor(entry.rank)} text-white shadow-lg`
                                  : "bg-gray-200 text-gray-700",
                              )}
                            >
                              #{entry.rank}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar
                            name={entry.name}
                            src={entry.avatar}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {entry.name}
                                {isCurrentUser && (
                                  <span className="text-primary-600 ml-2">
                                    (You)
                                  </span>
                                )}
                              </p>
                              {isTopThree && (
                                <Badge variant="warning" className="text-xs">
                                  Top {entry.rank}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-warning-500 text-warning-500" />
                                {entry.points} pts
                              </span>
                              <span>•</span>
                              <span>{entry.coursesCompleted} courses</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-primary-600" />
                                {entry.streak} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rank Change */}
                        {entry.change !== 0 && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-sm font-semibold",
                              entry.change > 0
                                ? "text-success-600"
                                : "text-danger-600",
                            )}
                          >
                            <TrendingUp
                              className={cn(
                                "w-4 h-4",
                                entry.change < 0 && "rotate-180",
                              )}
                            />
                            {Math.abs(entry.change)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {topAchievements.map((achievement) => (
                  <div key={achievement.id} className="text-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg`}
                    >
                      {achievement.icon}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {achievement.count}
                    </p>
                    <p className="text-xs text-gray-600">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How Points Work */}
          <Card>
            <CardHeader>
              <CardTitle>How Points Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Complete a Course
                  </p>
                  <p className="text-xs text-gray-600">+500 points</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Complete a Lesson
                  </p>
                  <p className="text-xs text-gray-600">+50 points</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Daily Streak
                  </p>
                  <p className="text-xs text-gray-600">+10 points/day</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Earn Achievement
                  </p>
                  <p className="text-xs text-gray-600">+100 points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-warning-400 to-warning-600 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      Most Helpful
                    </p>
                    <p className="text-xs text-gray-600">Sarah Johnson</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      Top Reviewer
                    </p>
                    <p className="text-xs text-gray-600">Michael Chen</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      Fastest Learner
                    </p>
                    <p className="text-xs text-gray-600">Emily Davis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
