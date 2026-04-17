import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  LogOut,
  Settings,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";

interface NavbarProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuClick,
  isSidebarOpen,
}) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const profileRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>

            {/* Logo */}
            <Link
              to={user ? "/dashboard" : "/"}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                TechLearn
              </span>
            </Link>

            {/* Search Bar - Hidden on small screens */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center flex-1 max-w-md"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Right Section */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <NotificationCenter />

              {/* Profile Dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar
                    src={user.avatar || undefined}
                    name={user.name}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search - Show below navbar on small screens */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
      </div>
    </nav>
  );
};
