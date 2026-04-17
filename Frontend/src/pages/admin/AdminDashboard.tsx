import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  DollarSign,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Settings,
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLayout } from '../../components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  Input,
  Select,
  Tabs,
  Alert,
  Skeleton,
} from '../../components/ui';
import { cn } from '../../lib/utils';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  pendingCourses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
  lastActive: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  status: 'published' | 'draft' | 'pending_review' | 'rejected';
  enrollments: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    pendingCourses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    systemHealth: 'healthy',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' as any }
        : u
    ));
  };

  const handleApproveCourse = (courseId: string) => {
    setCourses(courses.map(c =>
      c.id === courseId
        ? { ...c, status: 'published' as any }
        : c
    ));
  };

  const handleRejectCourse = (courseId: string) => {
    setCourses(courses.map(c =>
      c.id === courseId
        ? { ...c, status: 'rejected' as any }
        : c
    ));
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
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, badge: stats.totalUsers },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" />, badge: stats.pendingCourses > 0 ? stats.pendingCourses : undefined },
  ];

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Platform management and system monitoring
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/admin/settings">
              <Button variant="ghost" icon={<Settings className="w-5 h-5" />}>
                Settings
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="primary" icon={<BarChart3 className="w-5 h-5" />}>
                Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* System Health Alert */}
      {stats.systemHealth !== 'healthy' && (
        <Alert
          variant={stats.systemHealth === 'warning' ? 'warning' : 'danger'}
          className="mb-6"
        >
          <strong>System Health Alert:</strong> {stats.systemHealth === 'warning'
            ? 'Some services are experiencing degraded performance.'
            : 'Critical system issues detected. Immediate attention required.'}
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.activeUsers.toLocaleString()} active users
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
            <div className="mt-4 flex items-center text-sm text-warning-600">
              <Clock className="w-4 h-4 mr-1" />
              {stats.pendingCourses} pending review
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${(stats.totalRevenue / 1000).toFixed(0)}k</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-success-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              ${stats.monthlyRevenue.toLocaleString()} this month
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
                <p className="text-3xl font-bold text-gray-900 capitalize">{stats.systemHealth}</p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                stats.systemHealth === 'healthy' && "bg-success-100",
                stats.systemHealth === 'warning' && "bg-warning-100",
                stats.systemHealth === 'critical' && "bg-danger-100"
              )}>
                <Activity className={cn(
                  "w-6 h-6",
                  stats.systemHealth === 'healthy' && "text-success-600",
                  stats.systemHealth === 'warning' && "text-warning-600",
                  stats.systemHealth === 'critical' && "text-danger-600"
                )} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Shield className="w-4 h-4 mr-1" />
              All services operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          variant="underline"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    const colorClasses: Record<string, string> = {
                      primary: 'bg-primary-100 text-primary-600',
                      warning: 'bg-warning-100 text-warning-600',
                      success: 'bg-success-100 text-success-600',
                      danger: 'bg-danger-100 text-danger-600',
                    };

                    return (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users Today</span>
                  <span className="text-lg font-bold text-gray-900">847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Registrations</span>
                  <span className="text-lg font-bold text-gray-900">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Courses Published</span>
                  <span className="text-lg font-bold text-gray-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Today</span>
                  <span className="text-lg font-bold text-gray-900">$1,245</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Server</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Storage</span>
                  <Badge variant="success">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Service</span>
                  <Badge variant="success">Operational</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>User Management</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full sm:w-64"
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'student', label: 'Students' },
                    { value: 'instructor', label: 'Instructors' },
                    { value: 'admin', label: 'Admins' },
                  ]}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'pending', label: 'Pending' },
                  ]}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Active</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'warning' : 'info'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={
                          user.status === 'active' ? 'success' :
                          user.status === 'suspended' ? 'danger' : 'warning'
                        }>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{user.lastActive}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} />
                          <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            onClick={() => handleToggleUserStatus(user.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Course Moderation</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full sm:w-64"
                />
                <Select
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'published', label: 'Published' },
                    { value: 'pending_review', label: 'Pending Review' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <Badge variant={
                          course.status === 'published' ? 'success' :
                          course.status === 'pending_review' ? 'warning' :
                          course.status === 'rejected' ? 'danger' : 'neutral'
                        }>
                          {course.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Instructor: {course.instructor} • Created: {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{course.enrollments} enrollments</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {course.status === 'pending_review' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckCircle className="w-4 h-4" />}
                            onClick={() => handleApproveCourse(course.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<XCircle className="w-4 h-4" />}
                            onClick={() => handleRejectCourse(course.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} />
                      <Button variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
