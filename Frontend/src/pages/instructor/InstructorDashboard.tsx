import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  GitBranch,
  BarChart3,
  Eye,
  Star,
  MessageSquare,
  ShieldCheck,
  Clock,
  Award,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Badge, Avatar, Skeleton } from '../../components/ui';

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgRating: number;
  pendingReviews: number;
  activeStudents: number;
}

interface Course {
  id: string;
  title: string;
  enrollments: number;
  rating: number;
  revenue: number;
  status: 'published' | 'draft' | 'review';
  thumbnail?: string;
}

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
    pendingReviews: 0,
    activeStudents: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
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
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your courses today
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/instructor/github-import')}
              icon={<GitBranch className="w-5 h-5" />}
            >
              Import from GitHub
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/instructor/courses/new')}
              icon={<Plus className="w-5 h-5" />}
            >
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.activeStudents} active this month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-success-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Activity className="w-4 h-4 mr-1" />
              {courses.filter(c => c.status === 'published').length} published
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgRating}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-warning-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Award className="w-4 h-4 mr-1" />
              Based on 847 reviews
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - My Courses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/instructor/courses/new">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                      <Plus className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      Create Course
                    </p>
                  </div>
                </Link>

                <Link to="/instructor/github-import">
                  <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group">
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-success-200 transition-colors">
                      <GitBranch className="w-6 h-6 text-success-600" />
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-success-600 transition-colors">
                      GitHub Import
                    </p>
                  </div>
                </Link>

                <Link to="/instructor/analytics">
                  <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center cursor-pointer group">
                    <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-200 transition-colors">
                      <BarChart3 className="w-6 h-6 text-accent-600" />
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-accent-600 transition-colors">
                      View Analytics
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Courses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Courses</CardTitle>
                <Link to="/instructor/courses">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/instructor/courses/${course.id}/edit`}
                    className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all group"
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                          {course.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <Users className="w-4 h-4 mr-1" />
                            Students
                          </div>
                          <p className="font-semibold text-gray-900">{course.enrollments}</p>
                        </div>

                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <Star className="w-4 h-4 mr-1" />
                            Rating
                          </div>
                          <p className="font-semibold text-gray-900">{course.rating} / 5.0</p>
                        </div>

                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Revenue
                          </div>
                          <p className="font-semibold text-gray-900">${course.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 self-center" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">Student engagement and revenue trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to="/instructor/integrity"
                className="flex items-center justify-between p-3 bg-danger-50 border border-danger-200 rounded-lg hover:bg-danger-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-danger-600" />
                  <div>
                    <p className="text-sm font-semibold text-danger-900">
                      Integrity Reviews
                    </p>
                    <p className="text-xs text-danger-700">{stats.pendingReviews} pending</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-danger-600" />
              </Link>

              <div className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-warning-600" />
                  <div>
                    <p className="text-sm font-semibold text-warning-900">
                      Student Questions
                    </p>
                    <p className="text-xs text-warning-700">8 unanswered</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-semibold text-primary-900">
                      Course Reviews
                    </p>
                    <p className="text-xs text-primary-700">3 new reviews</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                const colorClasses: Record<string, string> = {
                  primary: 'bg-primary-100 text-primary-600',
                  warning: 'bg-warning-100 text-warning-600',
                  success: 'bg-success-100 text-success-600',
                  info: 'bg-gray-100 text-gray-600',
                };

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/instructor/help">
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  Teaching Guide
                </Button>
              </Link>
              <Link to="/instructor/best-practices">
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  Best Practices
                </Button>
              </Link>
              <Link to="/instructor/support">
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  Get Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
