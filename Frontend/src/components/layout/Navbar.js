import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, Settings, BookOpen, LayoutDashboard, Menu, X, } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { NotificationCenter } from "../notifications/NotificationCenter";
import { useAuthStore } from "../../store/authStore";
export const Navbar = ({ onMenuClick, isSidebarOpen, }) => {
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const profileRef = React.useRef(null);
    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current &&
                !profileRef.current.contains(event.target)) {
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
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
        }
    };
    return (_jsxs("nav", { className: "fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 lg:px-6", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center gap-4 flex-1", children: [_jsx("button", { onClick: onMenuClick, className: "lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors", "aria-label": "Toggle menu", children: isSidebarOpen ? (_jsx(X, { className: "w-6 h-6 text-gray-700" })) : (_jsx(Menu, { className: "w-6 h-6 text-gray-700" })) }), _jsxs(Link, { to: user ? "/dashboard" : "/", className: "flex items-center gap-2 flex-shrink-0", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-md", children: _jsx(BookOpen, { className: "w-6 h-6 text-white" }) }), _jsx("span", { className: "text-xl font-bold text-gray-900 hidden sm:block", children: "TechLearn" })] }), _jsx("form", { onSubmit: handleSearch, className: "hidden md:flex items-center flex-1 max-w-md", children: _jsxs("div", { className: "relative w-full", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search courses...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }) })] }), user ? (_jsxs("div", { className: "flex items-center gap-2 sm:gap-4", children: [_jsx(NotificationCenter, {}), _jsxs("div", { ref: profileRef, className: "relative", children: [_jsxs("button", { onClick: () => setIsProfileOpen(!isProfileOpen), className: "flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsx(Avatar, { src: user.avatar || undefined, name: user.name, size: "sm" }), _jsx("span", { className: "hidden sm:block text-sm font-medium text-gray-700", children: user.name })] }), isProfileOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in", children: [_jsxs("div", { className: "px-4 py-3 border-b border-gray-200", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900", children: user.name }), _jsx("p", { className: "text-xs text-gray-500", children: user.email })] }), _jsxs(Link, { to: "/dashboard", onClick: () => setIsProfileOpen(false), className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors", children: [_jsx(LayoutDashboard, { className: "w-4 h-4" }), "Dashboard"] }), _jsxs(Link, { to: "/profile", onClick: () => setIsProfileOpen(false), className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors", children: [_jsx(User, { className: "w-4 h-4" }), "My Profile"] }), _jsxs(Link, { to: "/settings", onClick: () => setIsProfileOpen(false), className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] }), _jsx("div", { className: "border-t border-gray-200 my-1" }), _jsxs("button", { onClick: () => {
                                                        setIsProfileOpen(false);
                                                        handleLogout();
                                                    }, className: "flex items-center gap-3 w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), "Logout"] })] }))] })] })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/login"), children: "Login" }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => navigate("/register"), children: "Sign Up" })] }))] }) }), _jsx("div", { className: "md:hidden px-4 pb-3", children: _jsxs("form", { onSubmit: handleSearch, className: "relative w-full", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search courses...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }) })] }));
};
