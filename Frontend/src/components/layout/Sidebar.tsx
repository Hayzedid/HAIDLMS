import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Code,
  Users,
  BarChart3,
  MessageSquare,
  Trophy,
  Calendar,
  Settings,
  ShieldCheck,
  GraduationCap,
  GitBranch,
  Bell,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  roles?: string[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard' },
    { label: 'My Courses', icon: <BookOpen className="w-5 h-5" />, href: '/my-courses' },
    { label: 'Browse Courses', icon: <GraduationCap className="w-5 h-5" />, href: '/courses' },
    { label: 'Code Playground', icon: <Code className="w-5 h-5" />, href: '/playground' },
    { label: 'AI Tutor', icon: <MessageSquare className="w-5 h-5" />, href: '/ai-tutor' },
    { label: 'Peer Review', icon: <Users className="w-5 h-5" />, href: '/peer-review' },
    { label: 'Leaderboard', icon: <Trophy className="w-5 h-5" />, href: '/leaderboard' },
    { label: 'Learning Health', icon: <BarChart3 className="w-5 h-5" />, href: '/health' },
    { label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/notifications', badge: 3 },
  ];

  const instructorNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/instructor/dashboard' },
    { label: 'My Courses', icon: <BookOpen className="w-5 h-5" />, href: '/instructor/courses' },
    { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/instructor/analytics' },
    { label: 'Student Health', icon: <Users className="w-5 h-5" />, href: '/instructor/health' },
    { label: 'Integrity Review', icon: <ShieldCheck className="w-5 h-5" />, href: '/instructor/integrity' },
    { label: 'GitHub Import', icon: <GitBranch className="w-5 h-5" />, href: '/instructor/github-import' },
    { label: 'Course Insights', icon: <BarChart3 className="w-5 h-5" />, href: '/instructor/insights' },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Admin Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin/dashboard' },
    { label: 'User Management', icon: <Users className="w-5 h-5" />, href: '/admin/users' },
    { label: 'Course Moderation', icon: <BookOpen className="w-5 h-5" />, href: '/admin/courses' },
    { label: 'System Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/admin/analytics' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/admin/settings' },
  ];

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

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

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-1">
          {/* User Role Badge */}
          {user && (
            <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                {user.role}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {user.name}
              </p>
            </div>
          )}

          {/* Navigation Links */}
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => {
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold bg-danger-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Bottom Links */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Quick Stats (Optional) */}
        {user?.role === 'student' && (
          <div className="p-4 mx-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your Progress
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Courses Enrolled</span>
                <span className="font-semibold text-gray-900">8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-gray-900">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-gray-900">5</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
