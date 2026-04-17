import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, Share2, Download, ExternalLink, Copy } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_CERTIFICATION_SERVICE_URL || 'http://localhost:4005';
export const BadgeShowcase = ({ userId }) => {
    const [badges, setBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    useEffect(() => {
        loadBadges();
    }, [userId]);
    const loadBadges = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/badges/users/${userId}`);
            setBadges(response.data.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load badges');
        }
        finally {
            setLoading(false);
        }
    };
    const shareToLinkedIn = async (badgeHash) => {
        try {
            const response = await axios.get(`${API_URL}/api/badges/${badgeHash}/linkedin-share`);
            const linkedInUrl = response.data.data.linkedInUrl;
            window.open(linkedInUrl, '_blank');
            // Track share
            await axios.post(`${API_URL}/api/badges/${badgeHash}/linkedin-share`, {});
        }
        catch (err) {
            console.error('Failed to share to LinkedIn:', err);
        }
    };
    const copyVerificationLink = (verificationUrl) => {
        navigator.clipboard.writeText(verificationUrl);
    };
    const downloadBadge = (badge) => {
        // Create a link to download badge JSON (Open Badges 2.0)
        window.open(`${API_URL}/api/badges/json/${badge.badgeHash}`, '_blank');
    };
    const getCategoryIcon = (category) => {
        const icons = {
            completion: Award,
            achievement: Shield,
            skill: CheckCircle,
            recognition: Award,
        };
        const Icon = icons[category] || Award;
        return _jsx(Icon, { className: "w-6 h-6" });
    };
    const getCategoryColor = (category) => {
        const colors = {
            completion: 'from-blue-500 to-blue-600',
            achievement: 'from-purple-500 to-purple-600',
            skill: 'from-green-500 to-green-600',
            recognition: 'from-amber-500 to-amber-600',
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };
    const getLevelBadge = (level) => {
        const levels = {
            beginner: { bg: 'bg-blue-100', text: 'text-blue-700' },
            intermediate: { bg: 'bg-green-100', text: 'text-green-700' },
            advanced: { bg: 'bg-purple-100', text: 'text-purple-700' },
            expert: { bg: 'bg-red-100', text: 'text-red-700' },
        };
        const style = levels[level] || levels.beginner;
        return (_jsx("span", { className: `px-2 py-1 ${style.bg} ${style.text} text-xs rounded-full font-semibold`, children: level.toUpperCase() }));
    };
    const filteredBadges = filterCategory === 'all'
        ? badges
        : badges.filter((b) => b.category === filterCategory);
    const categories = ['all', ...Array.from(new Set(badges.map((b) => b.category)))];
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-2", children: "Verified Badges" }), _jsxs("p", { className: "text-indigo-100", children: [badges.length, " cryptographically verified achievement", badges.length !== 1 ? 's' : ''] })] }), _jsx("div", { className: "w-16 h-16 bg-white/20 rounded-full flex items-center justify-center", children: _jsx(Shield, { className: "w-10 h-10 text-white" }) })] }) }), categories.length > 1 && (_jsx("div", { className: "flex flex-wrap gap-2", children: categories.map((category) => (_jsx("button", { onClick: () => setFilterCategory(category), className: `px-4 py-2 rounded-lg font-medium transition ${filterCategory === category
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: category === 'all' ? 'All Badges' : category.charAt(0).toUpperCase() + category.slice(1) }, category))) })), filteredBadges.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Award, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "No badges yet" }), _jsx("p", { className: "text-gray-500", children: "Complete courses and achievements to earn badges!" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredBadges.map((badge) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden", onClick: () => setSelectedBadge(badge), children: [_jsx("div", { className: `bg-gradient-to-br ${getCategoryColor(badge.category)} p-6 flex items-center justify-center`, children: _jsx("div", { className: "w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg", children: badge.badgeImage ? (_jsx("img", { src: badge.badgeImage, alt: badge.badgeName, className: "w-20 h-20" })) : (_jsx("div", { className: "text-indigo-600", children: getCategoryIcon(badge.category) })) }) }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-bold text-gray-800 flex-1", children: badge.badgeName }), getLevelBadge(badge.level)] }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: badge.badgeDescription }), _jsx("div", { className: "flex flex-wrap gap-1 mb-3", children: badge.tags.slice(0, 3).map((tag, idx) => (_jsx("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded", children: tag }, idx))) }), badge.achievementScore && (_jsxs("div", { className: "mb-3 p-2 bg-green-50 rounded border border-green-200", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-green-700 font-medium", children: "Score:" }), _jsxs("span", { className: "text-green-900 font-bold", children: [badge.achievementScore, "%"] })] }), badge.achievementPercentile && (_jsxs("div", { className: "text-xs text-green-600 mt-1", children: ["Top ", (100 - badge.achievementPercentile).toFixed(0), "% of learners"] }))] })), _jsxs("div", { className: "text-xs text-gray-500", children: ["Issued: ", new Date(badge.issuedOn).toLocaleDateString()] })] })] }, badge.assertionId))) })), selectedBadge && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: `bg-gradient-to-br ${getCategoryColor(selectedBadge.category)} p-8 text-white`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("div", { className: "w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg", children: selectedBadge.badgeImage ? (_jsx("img", { src: selectedBadge.badgeImage, alt: selectedBadge.badgeName, className: "w-16 h-16" })) : (_jsx("div", { className: "text-indigo-600", children: getCategoryIcon(selectedBadge.category) })) }), _jsx("button", { onClick: () => setSelectedBadge(null), className: "text-white hover:bg-white/20 rounded-lg p-2", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("h2", { className: "text-2xl font-bold mb-2", children: selectedBadge.badgeName }), _jsx("p", { className: "text-white/90", children: selectedBadge.badgeDescription })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-800 font-semibold mb-2", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), "Cryptographically Verified"] }), _jsx("p", { className: "text-sm text-green-700 mb-3", children: "This badge is secured with RSA-SHA256 signatures and can be independently verified by anyone." }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: selectedBadge.verificationUrl, readOnly: true, className: "flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm" }), _jsx("button", { onClick: () => copyVerificationLink(selectedBadge.verificationUrl), className: "p-2 bg-green-600 text-white rounded hover:bg-green-700", title: "Copy verification link", children: _jsx(Copy, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => window.open(selectedBadge.verificationUrl, '_blank'), className: "p-2 bg-green-600 text-white rounded hover:bg-green-700", title: "Verify badge", children: _jsx(ExternalLink, { className: "w-5 h-5" }) })] })] }), selectedBadge.achievementScore && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "Achievement Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Score" }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: [selectedBadge.achievementScore, "%"] })] }), selectedBadge.achievementPercentile && (_jsxs("div", { className: "p-3 bg-gray-50 rounded border border-gray-200", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: "Ranking" }), _jsxs("div", { className: "text-2xl font-bold text-gray-900", children: ["Top ", (100 - selectedBadge.achievementPercentile).toFixed(0), "%"] })] }))] })] })), selectedBadge.evidenceUrl && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Evidence" }), _jsxs("a", { href: selectedBadge.evidenceUrl, target: "_blank", rel: "noopener noreferrer", className: "text-indigo-600 hover:text-indigo-700 flex items-center gap-1", children: ["View Supporting Work", _jsx(ExternalLink, { className: "w-4 h-4" })] })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "Share Your Badge" }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("button", { onClick: () => shareToLinkedIn(selectedBadge.badgeHash), className: "flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition", children: [_jsx(Share2, { className: "w-6 h-6 text-indigo-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "LinkedIn" })] }), _jsxs("button", { onClick: () => copyVerificationLink(selectedBadge.verificationUrl), className: "flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition", children: [_jsx(Copy, { className: "w-6 h-6 text-indigo-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Copy Link" })] }), _jsxs("button", { onClick: () => downloadBadge(selectedBadge), className: "flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition", children: [_jsx(Download, { className: "w-6 h-6 text-indigo-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Download" })] })] })] }), _jsx("div", { className: "pt-4 border-t border-gray-200", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Category:" }), _jsx("span", { className: "ml-2 font-medium text-gray-900", children: selectedBadge.category })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Level:" }), _jsx("span", { className: "ml-2 font-medium text-gray-900", children: selectedBadge.level })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Issued:" }), _jsx("span", { className: "ml-2 font-medium text-gray-900", children: new Date(selectedBadge.issuedOn).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Badge ID:" }), _jsxs("span", { className: "ml-2 font-mono text-xs text-gray-600", children: [selectedBadge.badgeHash.slice(0, 16), "..."] })] })] }) })] })] }) }))] }));
};
