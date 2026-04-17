import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, MapPin, Globe, Linkedin, Github, Mail, Award, Code, BookOpen, Calendar, TrendingUp, Star, ExternalLink, Eye } from 'lucide-react';
import axios from 'axios';
import { BadgeShowcase } from '../../components/badges';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const PublicPortfolio = () => {
    const { username } = useParams();
    const [portfolio, setPortfolio] = useState(null);
    const [activeTab, setActiveTab] = useState('projects');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        loadPortfolio();
        trackView();
    }, [username]);
    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/portfolio/${username}`);
            setPortfolio(response.data.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Portfolio not found');
        }
        finally {
            setLoading(false);
        }
    };
    const trackView = async () => {
        try {
            await axios.post(`${API_URL}/api/portfolio/${username}/view`, {
                referrer: document.referrer,
            });
        }
        catch (err) {
            // Silent fail
        }
    };
    const getProficiencyColor = (level) => {
        const colors = {
            beginner: 'bg-blue-500',
            intermediate: 'bg-green-500',
            advanced: 'bg-purple-500',
            expert: 'bg-red-500',
        };
        return colors[level] || colors.beginner;
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600" }) }));
    }
    if (error || !portfolio) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-8 max-w-md text-center", children: [_jsx(User, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Portfolio Not Found" }), _jsx("p", { className: "text-gray-600", children: error || 'This portfolio does not exist or is not public.' })] }) }));
    }
    const { user, settings, projects, skills, activity, stats } = portfolio;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16", style: { backgroundColor: settings.themeColor }, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center gap-8", children: [_jsxs("div", { className: "relative", children: [settings.avatarUrl ? (_jsx("img", { src: settings.avatarUrl, alt: settings.displayName, className: "w-32 h-32 rounded-full border-4 border-white shadow-xl" })) : (_jsx("div", { className: "w-32 h-32 rounded-full border-4 border-white bg-white/20 flex items-center justify-center", children: _jsx(User, { className: "w-16 h-16" }) })), _jsx("div", { className: "absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white" })] }), _jsxs("div", { className: "flex-1 text-center md:text-left", children: [_jsx("h1", { className: "text-4xl font-bold mb-2", children: settings.displayName }), settings.headline && (_jsx("p", { className: "text-xl text-white/90 mb-4", children: settings.headline })), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-white/80 justify-center md:justify-start", children: [settings.location && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "w-4 h-4" }), _jsx("span", { children: settings.location })] })), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "w-4 h-4" }), _jsxs("span", { children: [settings.viewCount.toLocaleString(), " views"] })] })] }), _jsxs("div", { className: "flex gap-3 mt-4 justify-center md:justify-start", children: [settings.linkedinUrl && (_jsx("a", { href: settings.linkedinUrl, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition", children: _jsx(Linkedin, { className: "w-5 h-5" }) })), settings.githubUrl && (_jsx("a", { href: settings.githubUrl, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition", children: _jsx(Github, { className: "w-5 h-5" }) })), settings.personalWebsite && (_jsx("a", { href: settings.personalWebsite, target: "_blank", rel: "noopener noreferrer", className: "w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition", children: _jsx(Globe, { className: "w-5 h-5" }) })), settings.emailPublic && (_jsx("a", { href: `mailto:${settings.emailPublic}`, className: "w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition", children: _jsx(Mail, { className: "w-5 h-5" }) }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.totalCourses }), _jsx("div", { className: "text-sm text-white/80", children: "Courses" })] }), _jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.totalProjects }), _jsx("div", { className: "text-sm text-white/80", children: "Projects" })] }), _jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.totalBadges }), _jsx("div", { className: "text-sm text-white/80", children: "Badges" })] }), _jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-3xl font-bold", children: stats.totalSkills }), _jsx("div", { className: "text-sm text-white/80", children: "Skills" })] })] })] }) }) }), settings.bio && (_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5" }), "About"] }), _jsx("p", { className: "text-gray-700 leading-relaxed whitespace-pre-wrap", children: settings.bio })] }) })), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "bg-white rounded-lg shadow-md mb-6", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex", children: [
                                    { key: 'projects', label: 'Projects', icon: Code, count: projects.length },
                                    { key: 'skills', label: 'Skills', icon: TrendingUp, count: skills.length },
                                    { key: 'badges', label: 'Badges', icon: Award, count: stats.totalBadges },
                                    { key: 'activity', label: 'Activity', icon: Calendar, count: activity.length },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${activeTab === tab.key
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { children: tab.label }), _jsx("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full", children: tab.count })] }, tab.key));
                                }) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'projects' && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: projects.length === 0 ? (_jsxs("div", { className: "col-span-full text-center py-12", children: [_jsx(Code, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No projects yet" })] })) : (projects.map((project) => (_jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition", children: [project.thumbnailUrl && (_jsx("img", { src: project.thumbnailUrl, alt: project.title, className: "w-full h-48 object-cover" })), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: project.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: project.description }), _jsx("div", { className: "flex flex-wrap gap-1 mb-3", children: project.technologies.slice(0, 4).map((tech, idx) => (_jsx("span", { className: "px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded", children: tech }, idx))) }), _jsxs("div", { className: "flex gap-2", children: [project.liveUrl && (_jsxs("a", { href: project.liveUrl, target: "_blank", rel: "noopener noreferrer", className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), "Live Demo"] })), project.repositoryUrl && (_jsxs("a", { href: project.repositoryUrl, target: "_blank", rel: "noopener noreferrer", className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50", children: [_jsx(Github, { className: "w-4 h-4" }), "Code"] }))] }), project.peerReviewRating && (_jsxs("div", { className: "mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Star, { className: "w-4 h-4 text-yellow-500 fill-current" }), _jsxs("span", { children: [project.peerReviewRating.toFixed(1), " peer rating"] })] }))] })] }, project.id)))) })), activeTab === 'skills' && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: skills.length === 0 ? (_jsxs("div", { className: "col-span-full text-center py-12", children: [_jsx(TrendingUp, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No skills recorded" })] })) : (skills.map((skill, idx) => (_jsxs("div", { className: "p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h4", { className: "font-semibold text-gray-800", children: skill.skillName }), _jsx("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase", children: skill.proficiencyLevel })] }), _jsx("div", { className: "mb-2", children: _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full ${getProficiencyColor(skill.proficiencyLevel)}`, style: { width: `${skill.proficiencyScore}%` } }) }) }), skill.endorsedByPeers > 0 && (_jsxs("div", { className: "text-sm text-gray-600 flex items-center gap-1", children: [_jsx(Star, { className: "w-4 h-4 text-yellow-500" }), _jsxs("span", { children: [skill.endorsedByPeers, " endorsement", skill.endorsedByPeers !== 1 ? 's' : ''] })] }))] }, idx)))) })), activeTab === 'badges' && (_jsx(BadgeShowcase, { userId: user.id })), activeTab === 'activity' && (_jsx("div", { className: "space-y-4", children: activity.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Calendar, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No activity yet" })] })) : (activity.map((item) => (_jsxs("div", { className: "flex items-start gap-4 p-4 border border-gray-200 rounded-lg", children: [_jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", style: { backgroundColor: item.iconColor + '20' }, children: _jsx(BookOpen, { className: "w-5 h-5", style: { color: item.iconColor } }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-800", children: item.activityTitle }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: new Date(item.activityDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        }) })] })] }, item.id)))) }))] })] }) })] }));
};
