import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Trophy,
  MessageSquare,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Avatar, Badge } from "../ui";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    onClose();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "Courses",
      path: "/courses",
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: "Leaderboard",
      path: "/leaderboard",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Forum",
      path: "/forum",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[91] shadow-2xl lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="flex items-center gap-3">
                  <Avatar
                    name={user.name}
                    src={user.avatar || undefined}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <Badge variant="info" className="text-xs mt-1 capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <nav className="p-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="my-4 border-t border-gray-200" />

              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>

              <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>

              <div className="my-4 border-t border-gray-200" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-danger-50 transition-colors text-danger-600 font-medium w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
