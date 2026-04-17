import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookOpen, Trophy, MessageSquare, User, Settings, LogOut, X, } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Avatar, Badge } from "../ui";
export const MobileMenu = ({ isOpen, onClose }) => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => {
        clearAuth();
        onClose();
        navigate("/login");
    };
    const menuItems = [
        {
            icon: _jsx(Home, { className: "w-5 h-5" }),
            label: "Dashboard",
            path: "/dashboard",
        },
        {
            icon: _jsx(BookOpen, { className: "w-5 h-5" }),
            label: "Courses",
            path: "/courses",
        },
        {
            icon: _jsx(Trophy, { className: "w-5 h-5" }),
            label: "Leaderboard",
            path: "/leaderboard",
        },
        {
            icon: _jsx(MessageSquare, { className: "w-5 h-5" }),
            label: "Forum",
            path: "/forum",
        },
    ];
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black/50 z-[90] lg:hidden" }), _jsxs(motion.div, { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" }, transition: { type: "spring", damping: 30, stiffness: 300 }, className: "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[91] shadow-2xl lg:hidden overflow-y-auto", children: [_jsxs("div", { className: "p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-bold", children: "Menu" }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), user && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Avatar, { name: user.name, src: user.avatar || undefined, size: "md" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: user.name }), _jsx(Badge, { variant: "info", className: "text-xs mt-1 capitalize", children: user.role })] })] }))] }), _jsxs("nav", { className: "p-4", children: [menuItems.map((item) => (_jsxs(Link, { to: item.path, onClick: onClose, className: "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium", children: [item.icon, _jsx("span", { children: item.label })] }, item.path))), _jsx("div", { className: "my-4 border-t border-gray-200" }), _jsxs(Link, { to: "/profile", onClick: onClose, className: "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium", children: [_jsx(User, { className: "w-5 h-5" }), _jsx("span", { children: "Profile" })] }), _jsxs(Link, { to: "/settings", onClick: onClose, className: "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium", children: [_jsx(Settings, { className: "w-5 h-5" }), _jsx("span", { children: "Settings" })] }), _jsx("div", { className: "my-4 border-t border-gray-200" }), _jsxs("button", { onClick: handleLogout, className: "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-danger-50 transition-colors text-danger-600 font-medium w-full", children: [_jsx(LogOut, { className: "w-5 h-5" }), _jsx("span", { children: "Logout" })] })] })] })] })) }));
};
