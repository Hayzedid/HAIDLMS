import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  Edit,
  Award,
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
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
  Tabs,
  Progress,
} from '../../components/ui';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'achievements' | 'activity'>('overview');

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
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'primary',
      earnedDate: '2024-03-15',
    },
    {
      id: '2',
      title: 'Code Master',
      description: 'Solved 100 coding challenges',
      icon: <Trophy className="w-8 h-8" />,
      color: 'warning',
      earnedDate: '2024-03-10',
    },
    {
      id: '3',
      title: 'Team Player',
      description: 'Completed 20 peer reviews',
      icon: <Award className="w-8 h-8" />,
      color: 'success',
      earnedDate: '2024-03-05',
    },
    {
      id: '4',
      title: 'Consistent',
      description: '30-day learning streak',
      icon: <Target className="w-8 h-8" />,
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

  return (
    <AppLayout>
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center gap-4">
              <Avatar
                src={profileData.avatar}
                name={profileData.name}
                size="2xl"
                className="ring-4 ring-primary-100"
              />
              <Link to="/settings">
                <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />}>
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profileData.name}
                  </h1>
                  <Badge variant="info" className="mb-4 capitalize">
                    {profileData.role}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-600 mb-6 max-w-2xl">
                {profileData.bio}
              </p>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {profileData.joinedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profileData.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <LinkIcon className="w-4 h-4" />
                  <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                    {profileData.website}
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                <a
                  href={`https://github.com/${profileData.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Github className="w-5 h-5 text-gray-700" />
                </a>
                <a
                  href={`https://linkedin.com/in/${profileData.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-gray-700" />
                </a>
                <a
                  href={`https://twitter.com/${profileData.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-gray-700" />
                </a>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:min-w-[300px]">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary-600">{stats.coursesCompleted}</p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning-600">{stats.certificates}</p>
                  <p className="text-sm text-gray-600 mt-1">Certificates</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success-600">{stats.learningStreak}</p>
                  <p className="text-sm text-gray-600 mt-1">Day Streak</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent-600">#{stats.rank}</p>
                  <p className="text-sm text-gray-600 mt-1">Rank</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Course Completion</span>
                      <span className="text-sm font-bold text-gray-900">
                        {stats.coursesCompleted}/{stats.coursesEnrolled}
                      </span>
                    </div>
                    <Progress value={(stats.coursesCompleted / stats.coursesEnrolled) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Points</span>
                      <span className="text-sm font-bold text-gray-900">{stats.totalPoints}</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Current Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <Link key={course.id} to={`/courses/${course.id}/learn`} className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 mt-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.slice(0, 3).map((achievement) => {
                    const colorClasses: Record<string, string> = {
                      primary: 'bg-primary-100 text-primary-600',
                      warning: 'bg-warning-100 text-warning-600',
                      success: 'bg-success-100 text-success-600',
                      accent: 'bg-accent-100 text-accent-600',
                    };

                    return (
                      <div key={achievement.id} className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[achievement.color]}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900">{activity.message}</p>
                        <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}/learn`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{course.title}</h3>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const colorClasses: Record<string, string> = {
              primary: 'from-primary-400 to-primary-600',
              warning: 'from-warning-400 to-warning-600',
              success: 'from-success-400 to-success-600',
              accent: 'from-accent-400 to-accent-600',
            };

            return (
              <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className={`bg-gradient-to-br ${colorClasses[achievement.color]} p-8 flex items-center justify-center text-white`}>
                  {achievement.icon}
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  <p className="text-xs text-gray-500">
                    Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
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
