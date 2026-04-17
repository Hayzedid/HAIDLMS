import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Play,
  ChevronRight,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { courseApi, Enrollment } from "../../api/course.api";
import { AppLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Progress,
  Badge,
  Avatar,
  Skeleton,
} from "../../components/ui";
import { cn } from "../../lib/utils";

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLearningHours: number;
  currentStreak: number;
  totalPoints: number;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LearningStats>({
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
      const completed = enrollmentData.filter(
        (e: any) => e.status === "completed",
      ).length;
      const inProgress = enrollmentData.filter(
        (e: any) => e.status === "active",
      ).length;

      setStats({
        totalCourses: enrollmentData.length,
        completedCourses: completed,
        inProgressCourses: inProgress,
        totalLearningHours: 47, // This would come from backend
        currentStreak: 7, // This would come from backend
        totalPoints: 1250, // This would come from backend
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get courses in progress (sorted by recent activity)
  const continueLearning = enrollments
    .filter((e: any) => e.status === "active")
    .slice(0, 1);

  // Mock recommended courses
  const recommendedCourses = [
    {
      id: "1",
      title: "Advanced React Patterns",
      instructor: "Sarah Johnson",
      rating: 4.8,
      students: 12500,
      thumbnail:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
    },
    {
      id: "2",
      title: "System Design Fundamentals",
      instructor: "Michael Chen",
      rating: 4.9,
      students: 8900,
      thumbnail:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Hero Section - Personalized Greeting */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {user?.firstName}! 👋
            </h1>
            <p className="text-primary-100 text-lg mb-6">
              Ready to continue your learning journey?
            </p>

            {continueLearning.length > 0 && (
              <Link to={`/courses/${continueLearning[0].courseId}/learn`}>
                <Button size="lg" variant="secondary" className="shadow-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Continue Learning
                </Button>
              </Link>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-primary-100">Day Streak 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalPoints}</div>
              <div className="text-sm text-primary-100">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Enrolled Courses
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.inProgressCourses} in progress
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completedCourses}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-1" />
              {((stats.completedCourses / stats.totalCourses) * 100).toFixed(0)}
              % completion rate
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Learning Hours
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalLearningHours}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Zap className="w-4 h-4 mr-1" />
              This month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Achievements
                </p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 mr-1" />2 more to unlock
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - My Courses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning Section */}
          {continueLearning.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary-600" />
                  Continue Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                {continueLearning.map((enrollment: any) => (
                  <Link
                    key={enrollment.id}
                    to={`/courses/${enrollment.course_id}/learn`}
                    className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    {enrollment.cover_image_url ? (
                      <img
                        src={enrollment.cover_image_url}
                        alt={enrollment.course_title}
                        className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {enrollment.course_title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Last activity: 2 hours ago
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">
                            {enrollment.progress_percent?.toFixed(0) || 0}%
                          </span>
                        </div>
                        <Progress
                          value={enrollment.progress_percent || 0}
                          className="h-2"
                        />
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 self-center" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* All My Courses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Courses</CardTitle>
                <Link to="/my-courses">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No courses yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start your learning journey by enrolling in a course
                  </p>
                  <Link to="/courses">
                    <Button variant="primary">Browse Courses</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.slice(0, 4).map((enrollment: any) => (
                    <Link
                      key={enrollment.id}
                      to={`/courses/${enrollment.course_id}/learn`}
                      className="group"
                    >
                      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-primary-300">
                        {enrollment.cover_image_url ? (
                          <img
                            src={enrollment.cover_image_url}
                            alt={enrollment.course_title}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-white" />
                          </div>
                        )}

                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {enrollment.course_title}
                          </h3>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-semibold text-gray-900">
                                {enrollment.progress_percent?.toFixed(0) || 0}%
                              </span>
                            </div>
                            <Progress
                              value={enrollment.progress_percent || 0}
                              className="h-1.5"
                            />
                          </div>

                          <Badge
                            variant={
                              enrollment.status === "completed"
                                ? "success"
                                : "info"
                            }
                            className="mt-3"
                          >
                            {enrollment.status === "completed"
                              ? "Completed"
                              : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Actions & Recommendations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/courses">
                <Button variant="ghost" fullWidth className="justify-start">
                  <BookOpen className="w-5 h-5 mr-3 text-primary-600" />
                  <span>Browse Courses</span>
                </Button>
              </Link>

              <Link to="/playground">
                <Button variant="ghost" fullWidth className="justify-start">
                  <Code className="w-5 h-5 mr-3 text-success-600" />
                  <span>Code Playground</span>
                </Button>
              </Link>

              <Link to="/ai-tutor">
                <Button variant="ghost" fullWidth className="justify-start">
                  <Zap className="w-5 h-5 mr-3 text-accent-600" />
                  <span>AI Tutor</span>
                </Button>
              </Link>

              <Link to="/leaderboard">
                <Button variant="ghost" fullWidth className="justify-start">
                  <Trophy className="w-5 h-5 mr-3 text-warning-600" />
                  <span>Leaderboard</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block group"
                >
                  <div className="flex gap-3">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1">
                        {course.instructor}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center text-warning-600">
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {course.rating}
                        </div>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          {course.students.toLocaleString()} students
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              <Link to="/courses">
                <Button variant="ghost" size="sm" fullWidth>
                  View More
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    Achievement Unlocked!
                  </p>
                  <p className="text-xs text-gray-600">
                    First Course Completed
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    Lesson Completed
                  </p>
                  <p className="text-xs text-gray-600">React Hooks Deep Dive</p>
                  <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
