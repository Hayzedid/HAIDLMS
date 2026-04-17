import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { User, Globe, Linkedin, Github, Twitter, MapPin, Link2, Save, Eye, Settings, X, Check } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const PortfolioEditor = () => {
    const [settings, setSettings] = useState({
        isPublic: true,
        customUrlSlug: '',
        displayName: '',
        headline: '',
        bio: '',
        location: '',
        linkedinUrl: '',
        githubUrl: '',
        twitterUrl: '',
        personalWebsite: '',
        emailPublic: '',
        themeColor: '#6366f1',
        showCourses: true,
        showBadges: true,
        showProjects: true,
        showSkills: true,
        showActivity: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [slugAvailable, setSlugAvailable] = useState(null);
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/portfolio/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSettings(response.data.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load settings');
        }
        finally {
            setLoading(false);
        }
    };
    const checkSlugAvailability = async (slug) => {
        if (!slug || slug.length < 3) {
            setSlugAvailable(null);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/portfolio/slug-available/${slug}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSlugAvailable(response.data.data.available);
        }
        catch (err) {
            setSlugAvailable(null);
        }
    };
    const handleSlugChange = (slug) => {
        // Sanitize slug: lowercase, alphanumeric, hyphens only
        const sanitized = slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^-|-$/g, '');
        setSettings({ ...settings, customUrlSlug: sanitized });
        checkSlugAvailability(sanitized);
    };
    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/portfolio/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccessMessage('Portfolio settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    const previewPortfolio = () => {
        if (settings.customUrlSlug) {
            window.open(`/portfolio/${settings.customUrlSlug}`, '_blank');
        }
        else {
            setError('Please set a custom URL slug first');
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6 space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-800 flex items-center gap-2", children: [_jsx(Settings, { className: "w-7 h-7" }), "Portfolio Settings"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "Customize your public portfolio to showcase your achievements" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: previewPortfolio, className: "flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50", children: [_jsx(Eye, { className: "w-5 h-5" }), "Preview"] }), _jsxs("button", { onClick: handleSave, disabled: saving || slugAvailable === false, className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: [_jsx(Save, { className: "w-5 h-5" }), saving ? 'Saving...' : 'Save Changes'] })] })] }) }), successMessage && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2", children: [_jsx(Check, { className: "w-5 h-5" }), successMessage] })), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between", children: [_jsx("span", { children: error }), _jsx("button", { onClick: () => setError(''), children: _jsx(X, { className: "w-5 h-5" }) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4", children: "Visibility" }), _jsx("div", { className: "space-y-4", children: _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: settings.isPublic, onChange: (e) => setSettings({ ...settings, isPublic: e.target.checked }), className: "w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: "Make portfolio public" }), _jsx("div", { className: "text-sm text-gray-600", children: "Allow anyone with the link to view your portfolio" })] })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2", children: [_jsx(User, { className: "w-6 h-6" }), "Basic Information"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Custom Portfolio URL *" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-500", children: "/portfolio/" }), _jsx("input", { type: "text", value: settings.customUrlSlug, onChange: (e) => handleSlugChange(e.target.value), placeholder: "your-name", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), slugAvailable !== null && (_jsx("span", { className: `text-sm font-medium ${slugAvailable ? 'text-green-600' : 'text-red-600'}`, children: slugAvailable ? '✓ Available' : '✗ Taken' }))] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Lowercase letters, numbers, and hyphens only" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Display Name" }), _jsx("input", { type: "text", value: settings.displayName, onChange: (e) => setSettings({ ...settings, displayName: e.target.value }), placeholder: "John Doe", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Professional Headline" }), _jsx("input", { type: "text", value: settings.headline, onChange: (e) => setSettings({ ...settings, headline: e.target.value }), placeholder: "Full-Stack Developer | React Specialist", maxLength: 500, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [settings.headline.length, "/500 characters"] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bio" }), _jsx("textarea", { value: settings.bio, onChange: (e) => setSettings({ ...settings, bio: e.target.value }), placeholder: "Tell visitors about yourself, your experience, and what you're passionate about...", rows: 5, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(MapPin, { className: "w-4 h-4 inline mr-1" }), "Location"] }), _jsx("input", { type: "text", value: settings.location, onChange: (e) => setSettings({ ...settings, location: e.target.value }), placeholder: "San Francisco, CA", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-800 mb-4 flex items-center gap-2", children: [_jsx(Link2, { className: "w-6 h-6" }), "Social Links"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Linkedin, { className: "w-4 h-4 inline mr-1" }), "LinkedIn URL"] }), _jsx("input", { type: "url", value: settings.linkedinUrl, onChange: (e) => setSettings({ ...settings, linkedinUrl: e.target.value }), placeholder: "https://linkedin.com/in/yourprofile", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Github, { className: "w-4 h-4 inline mr-1" }), "GitHub URL"] }), _jsx("input", { type: "url", value: settings.githubUrl, onChange: (e) => setSettings({ ...settings, githubUrl: e.target.value }), placeholder: "https://github.com/yourusername", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Twitter, { className: "w-4 h-4 inline mr-1" }), "Twitter URL"] }), _jsx("input", { type: "url", value: settings.twitterUrl, onChange: (e) => setSettings({ ...settings, twitterUrl: e.target.value }), placeholder: "https://twitter.com/yourusername", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Globe, { className: "w-4 h-4 inline mr-1" }), "Personal Website"] }), _jsx("input", { type: "url", value: settings.personalWebsite, onChange: (e) => setSettings({ ...settings, personalWebsite: e.target.value }), placeholder: "https://yourwebsite.com", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Public Contact Email" }), _jsx("input", { type: "email", value: settings.emailPublic, onChange: (e) => setSettings({ ...settings, emailPublic: e.target.value }), placeholder: "contact@example.com", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Optional: Display a different email for visitors to contact you" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4", children: "Appearance" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Theme Color" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "color", value: settings.themeColor, onChange: (e) => setSettings({ ...settings, themeColor: e.target.value }), className: "h-12 w-20 border border-gray-300 rounded cursor-pointer" }), _jsx("input", { type: "text", value: settings.themeColor, onChange: (e) => setSettings({ ...settings, themeColor: e.target.value }), placeholder: "#6366f1", className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4", children: "Content Visibility" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Choose what sections to display on your public portfolio" }), _jsx("div", { className: "space-y-3", children: [
                            { key: 'showCourses', label: 'Completed Courses' },
                            { key: 'showBadges', label: 'Earned Badges' },
                            { key: 'showProjects', label: 'Portfolio Projects' },
                            { key: 'showSkills', label: 'Skills & Competencies' },
                            { key: 'showActivity', label: 'Activity Timeline' },
                        ].map((item) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: settings[item.key], onChange: (e) => setSettings({ ...settings, [item.key]: e.target.checked }), className: "w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" }), _jsx("span", { className: "text-gray-700", children: item.label })] }, item.key))) })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsxs("button", { onClick: previewPortfolio, className: "flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50", children: [_jsx(Eye, { className: "w-5 h-5" }), "Preview Portfolio"] }), _jsxs("button", { onClick: handleSave, disabled: saving || slugAvailable === false, className: "flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: [_jsx(Save, { className: "w-5 h-5" }), saving ? 'Saving...' : 'Save Changes'] })] })] }));
};
