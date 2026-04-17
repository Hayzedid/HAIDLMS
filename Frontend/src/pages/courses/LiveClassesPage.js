import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveClassApi } from "../../api/live-classes.api";
import { Play, Users, Clock, MapPin } from "lucide-react";
// Helper function to format time distance
const formatTimeDistance = (date) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)
        return "just now";
    if (diffMins < 60)
        return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
        return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};
export const LiveClassesPage = () => {
    const [filter, setFilter] = useState("upcoming");
    const { data: classes, isLoading, error, } = useQuery({
        queryKey: ["live-classes", filter],
        queryFn: () => liveClassApi.getAllClasses(filter),
    });
    const handleJoinClass = async (classId) => {
        try {
            const response = await liveClassApi.joinClass(classId);
            window.open(response.zoomUrl, "_blank");
        }
        catch (err) {
            console.error("Failed to join class:", err);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "live":
                return "bg-red-100 text-red-800";
            case "upcoming":
                return "bg-blue-100 text-blue-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Live Classes" }), _jsx("p", { className: "text-gray-600", children: "Join interactive learning sessions with instructors" })] }), _jsx("div", { className: "bg-white rounded-lg shadow mb-6 p-4", children: _jsx("div", { className: "flex gap-4", children: ["upcoming", "live", "completed"].map((f) => (_jsx("button", { onClick: () => setFilter(f), className: `px-4 py-2 rounded-lg font-medium transition ${filter === f
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`, children: f.charAt(0).toUpperCase() + f.slice(1) }, f))) }) }), isLoading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : error ? (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: "Failed to load classes. Please try again." })) : !classes?.length ? (_jsxs("div", { className: "bg-gray-100 rounded-lg p-12 text-center text-gray-600", children: ["No ", filter, " classes found"] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: classes.map((liveClass) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(liveClass.status)}`, children: liveClass.status.toUpperCase() }) }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: liveClass.title }), _jsxs("div", { className: "space-y-3 text-sm text-gray-600 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsxs("span", { children: [liveClass.startTime, " \u00B7 ", liveClass.duration, " mins"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), _jsxs("span", { children: [liveClass.participantCount, "/", liveClass.maxParticipants, " ", "participants"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4" }), _jsx("span", { className: "text-gray-700 font-medium", children: liveClass.instructor.name })] })] }), _jsx("p", { className: "text-gray-700 mb-4", children: liveClass.topic }), liveClass.status === "live" && (_jsxs("button", { onClick: () => handleJoinClass(liveClass.id), className: "w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition", children: [_jsx(Play, { className: "w-4 h-4" }), "Join Now"] })), liveClass.status === "upcoming" && (_jsx("button", { onClick: () => handleJoinClass(liveClass.id), className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition", children: "Enroll Now" })), liveClass.status === "completed" &&
                                        liveClass.recordingUrl && (_jsx("a", { href: liveClass.recordingUrl, target: "_blank", rel: "noopener noreferrer", className: "w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg block text-center transition", children: "Watch Recording" }))] })] }, liveClass.id))) }))] }) }));
};
export default LiveClassesPage;
