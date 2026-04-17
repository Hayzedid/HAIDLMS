import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { certificationApi } from "../../api/certification.api";
import { Award, Share2, Download } from "lucide-react";
export const CertificationGalleryPage = () => {
    const [filterType, setFilterType] = useState("all");
    const { data: badges, isLoading } = useQuery({
        queryKey: ["userBadges"],
        queryFn: () => certificationApi.getUserBadges(),
    });
    const shareToLinkedIn = (badgeId) => {
        certificationApi.generateLinkedInShareUrl(badgeId);
    };
    const downloadBadge = (badgeId) => {
        window.open(`/api/certification/badges/${badgeId}/download`, "_blank");
    };
    const filtered = !badges?.length
        ? []
        : filterType === "all"
            ? badges
            : filterType === "badges"
                ? badges.filter((b) => b.type === "badge")
                : badges.filter((b) => b.type === "certificate");
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Award, { className: "w-8 h-8 text-blue-600" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Certifications & Badges" })] }), _jsx("p", { className: "text-gray-600", children: "Showcase your achievements and credentials" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Total Achievements" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: badges?.length || 0 })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Badges Earned" }), _jsx("p", { className: "text-3xl font-bold text-blue-600", children: badges?.filter((b) => b.type === "badge").length || 0 })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Certificates" }), _jsx("p", { className: "text-3xl font-bold text-green-600", children: badges?.filter((b) => b.type === "certificate").length || 0 })] })] }), _jsx("div", { className: "flex gap-4 mb-6", children: ["all", "badges", "certificates"].map((type) => (_jsx("button", { onClick: () => setFilterType(type), className: `px-4 py-2 rounded-lg font-medium transition ${filterType === type
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`, children: type.charAt(0).toUpperCase() + type.slice(1) }, type))) }), isLoading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : filtered.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center text-gray-600", children: [_jsx(Award, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsxs("p", { children: ["No ", filterType === "all" ? "achievements" : filterType, " yet. Complete courses to earn badges!"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filtered.map((badge) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden", children: [_jsx("div", { className: "aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6", children: _jsxs("div", { className: "text-center", children: [_jsx(Award, { className: "w-16 h-16 text-blue-600 mx-auto mb-2" }), _jsx("p", { className: "font-bold text-gray-900", children: badge.name })] }) }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: badge.description }), _jsx("div", { className: "flex items-center gap-2 text-xs text-gray-500 mb-4", children: _jsxs("span", { children: ["Earned: ", new Date(badge.issuedAt).toLocaleDateString()] }) }), badge.issuer && (_jsxs("p", { className: "text-xs font-medium text-gray-700 mb-4", children: ["Issuer: ", badge.issuer] })), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => downloadBadge(badge.badgeHash), className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm", children: [_jsx(Download, { className: "w-4 h-4" }), " Download"] }), _jsxs("button", { onClick: () => shareToLinkedIn(badge.badgeHash), className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm", children: [_jsx(Share2, { className: "w-4 h-4" }), " Share"] })] }), badge.credentialUrl && (_jsx("a", { href: badge.credentialUrl, target: "_blank", rel: "noopener noreferrer", className: "mt-2 block text-center text-xs text-blue-600 hover:underline", children: "View Credential" }))] })] }, badge.id))) }))] }) }));
};
export default CertificationGalleryPage;
