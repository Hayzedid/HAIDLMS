import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Mail, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";
export const NotificationPreferencesPage = () => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        fetchPreferences();
    }, []);
    const fetchPreferences = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get("/notifications/preferences");
            if (response.data.success) {
                setPreferences(response.data.data);
            }
        }
        catch (error) {
            console.error("Error fetching preferences:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const savePreferences = async () => {
        if (!preferences)
            return;
        setSaving(true);
        setSaved(false);
        try {
            const response = await apiClient.put("/notifications/preferences", preferences);
            if (response.data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        }
        catch (error) {
            console.error("Error saving preferences:", error);
            alert("Failed to save preferences. Please try again.");
        }
        finally {
            setSaving(false);
        }
    };
    const updatePreference = (key, value) => {
        if (preferences) {
            setPreferences({ ...preferences, [key]: value });
        }
    };
    const preferenceGroups = [
        {
            title: "Course Notifications",
            icon: "📚",
            preferences: [
                {
                    key: "course_announcements",
                    label: "Course announcements",
                    description: "Important updates from instructors",
                },
                {
                    key: "course_updates",
                    label: "Course updates",
                    description: "Changes to course content or schedule",
                },
                {
                    key: "new_lesson_available",
                    label: "New lessons",
                    description: "When new lessons are published",
                },
                {
                    key: "assignment_deadline",
                    label: "Assignment deadlines",
                    description: "Reminders for upcoming deadlines",
                },
                {
                    key: "grade_released",
                    label: "Grade released",
                    description: "When your assignments are graded",
                },
            ],
        },
        {
            title: "Forum Notifications",
            icon: "💬",
            preferences: [
                {
                    key: "forum_reply_to_thread",
                    label: "Replies to your threads",
                    description: "When someone replies to your discussion",
                },
                {
                    key: "forum_reply_to_comment",
                    label: "Replies to your comments",
                    description: "When someone replies to your comment",
                },
                {
                    key: "forum_mention",
                    label: "Mentions",
                    description: "When someone mentions you in a discussion",
                },
                {
                    key: "forum_thread_followed",
                    label: "Followed threads",
                    description: "Updates to threads you follow",
                },
                {
                    key: "forum_answer_accepted",
                    label: "Answer accepted",
                    description: "When your answer is marked as accepted",
                },
            ],
        },
        {
            title: "Social Notifications",
            icon: "👥",
            preferences: [
                {
                    key: "peer_review_received",
                    label: "Peer review received",
                    description: "When a peer reviews your work",
                },
                {
                    key: "peer_review_completed",
                    label: "Peer review completed",
                    description: "When you complete a peer review",
                },
                {
                    key: "badge_earned",
                    label: "Badge earned",
                    description: "When you earn a new badge",
                },
                {
                    key: "certificate_issued",
                    label: "Certificate issued",
                    description: "When you complete a course and earn a certificate",
                },
                {
                    key: "portfolio_endorsement",
                    label: "Portfolio endorsement",
                    description: "When someone endorses your skills",
                },
            ],
        },
        {
            title: "Engagement Notifications",
            icon: "🎯",
            preferences: [
                {
                    key: "inactivity_reminder",
                    label: "Inactivity reminders",
                    description: "Gentle reminders to continue learning",
                },
                {
                    key: "course_recommendation",
                    label: "Course recommendations",
                    description: "Personalized course suggestions",
                },
                {
                    key: "progress_milestone",
                    label: "Progress milestones",
                    description: "When you reach learning milestones",
                },
                {
                    key: "leaderboard_ranking",
                    label: "Leaderboard ranking",
                    description: "Changes in your leaderboard position",
                },
            ],
        },
        {
            title: "System Notifications",
            icon: "⚙️",
            preferences: [
                {
                    key: "system_announcements",
                    label: "System announcements",
                    description: "Important platform updates",
                },
                {
                    key: "maintenance_alerts",
                    label: "Maintenance alerts",
                    description: "Scheduled maintenance notifications",
                },
            ],
        },
    ];
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (!preferences) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-600", children: "Failed to load preferences" }), _jsx("button", { onClick: fetchPreferences, className: "mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: "Try Again" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs(Link, { to: "/notifications", className: "inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4", children: [_jsx(ArrowLeft, { size: 20 }), "Back to Notifications"] }), _jsxs("h1", { className: "text-3xl font-bold text-gray-900 flex items-center gap-3", children: [_jsx(Bell, { className: "text-indigo-600", size: 32 }), "Notification Preferences"] }), _jsx("p", { className: "mt-2 text-gray-600", children: "Customize how and when you receive notifications" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm p-6 mb-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "text-3xl", children: "\uD83D\uDCE7" }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Email Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Mail, { size: 20, className: "text-gray-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Enable email notifications" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive notifications via email" })] })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.email_enabled, onChange: (e) => updatePreference("email_enabled", e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" })] })] }), preferences.email_enabled && (_jsxs("div", { className: "ml-11", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email frequency" }), _jsxs("select", { value: preferences.email_frequency, onChange: (e) => updatePreference("email_frequency", e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "immediate", children: "Immediate - Send emails as notifications arrive" }), _jsx("option", { value: "daily_digest", children: "Daily Digest - One email per day with all notifications" }), _jsx("option", { value: "weekly_digest", children: "Weekly Digest - One email per week with all notifications" }), _jsx("option", { value: "never", children: "Never - No email notifications" })] })] }))] })] })] }) }), preferenceGroups.map((group) => (_jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6 mb-6", children: [_jsxs("div", { className: "flex items-start gap-4 mb-6", children: [_jsx("div", { className: "text-3xl", children: group.icon }), _jsx("h2", { className: "text-xl font-semibold text-gray-900", children: group.title })] }), _jsx("div", { className: "space-y-4", children: group.preferences.map((pref) => (_jsxs("div", { className: "flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: pref.label }), _jsx("p", { className: "text-sm text-gray-600", children: pref.description })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer ml-4", children: [_jsx("input", { type: "checkbox", checked: preferences[pref.key], onChange: (e) => updatePreference(pref.key, e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" })] })] }, pref.key))) })] }, group.title))), _jsx("div", { className: "sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-lg shadow-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { children: saved && (_jsxs("p", { className: "text-green-600 font-medium flex items-center gap-2", children: [_jsx("span", { className: "inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full", children: "\u2713" }), "Preferences saved successfully"] })) }), _jsx("button", { onClick: savePreferences, disabled: saving, className: "flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors", children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 20 }), "Save Preferences"] })) })] }) })] }) }));
};
