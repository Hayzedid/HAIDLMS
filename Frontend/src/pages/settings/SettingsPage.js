import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { User, Lock, Bell, Shield, CreditCard, Eye, EyeOff, Save, Upload, } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { AppLayout } from "../../components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Tabs, Avatar, Alert, } from "../../components/ui";
export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState("profile");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    // Profile state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        bio: "",
        location: "",
        website: "",
        github: "",
        linkedin: "",
        twitter: "",
    });
    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailCourseUpdates: true,
        emailNewContent: true,
        emailPromotions: false,
        pushCourseReminders: true,
        pushAchievements: true,
        pushMessages: true,
    });
    // Privacy settings
    const [privacy, setPrivacy] = useState({
        profileVisibility: "public",
        showEmail: false,
        showProgress: true,
        showAchievements: true,
    });
    const handleSaveProfile = () => {
        // API call to save profile
        console.log("Saving profile:", profileData);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };
    const handleChangePassword = () => {
        // API call to change password
        console.log("Changing password");
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };
    const handleSaveNotifications = () => {
        // API call to save notification preferences
        console.log("Saving notifications:", notifications);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };
    const handleSavePrivacy = () => {
        // API call to save privacy settings
        console.log("Saving privacy:", privacy);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };
    const tabs = [
        { id: "profile", label: "Profile", icon: _jsx(User, { className: "w-4 h-4" }) },
        { id: "account", label: "Account", icon: _jsx(Lock, { className: "w-4 h-4" }) },
        {
            id: "notifications",
            label: "Notifications",
            icon: _jsx(Bell, { className: "w-4 h-4" }),
        },
        { id: "privacy", label: "Privacy", icon: _jsx(Shield, { className: "w-4 h-4" }) },
        {
            id: "billing",
            label: "Billing",
            icon: _jsx(CreditCard, { className: "w-4 h-4" }),
        },
    ];
    return (_jsxs(AppLayout, { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Settings" }), _jsx("p", { className: "text-gray-600", children: "Manage your account settings and preferences" })] }), saveSuccess && (_jsx(Alert, { variant: "success", className: "mb-6", onClose: () => setSaveSuccess(false), children: "Settings saved successfully!" })), _jsx("div", { className: "mb-6", children: _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "pills" }) }), activeTab === "profile" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Profile Information" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Profile Picture" }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsx(Avatar, { name: `${profileData.firstName} ${profileData.lastName}`, size: "2xl" }), _jsxs("div", { children: [_jsx(Button, { variant: "secondary", size: "sm", icon: _jsx(Upload, { className: "w-4 h-4" }), children: "Upload New Photo" }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "JPG, PNG or GIF. Max size 5MB." })] })] })] }), _jsx(Input, { label: "First Name", value: profileData.firstName, onChange: (e) => setProfileData({ ...profileData, firstName: e.target.value }), placeholder: "John", fullWidth: true }), _jsx(Input, { label: "Last Name", value: profileData.lastName, onChange: (e) => setProfileData({ ...profileData, lastName: e.target.value }), placeholder: "Doe", fullWidth: true }), _jsx(Input, { label: "Email", value: profileData.email, disabled: true, hint: "To change your email, go to Account settings", fullWidth: true }), _jsx(Textarea, { label: "Bio", value: profileData.bio, onChange: (e) => setProfileData({ ...profileData, bio: e.target.value }), placeholder: "Tell us about yourself...", rows: 4, maxLength: 500, showCharCount: true, fullWidth: true }), _jsx(Input, { label: "Location", value: profileData.location, onChange: (e) => setProfileData({ ...profileData, location: e.target.value }), placeholder: "San Francisco, CA", fullWidth: true }), _jsx(Input, { label: "Website", value: profileData.website, onChange: (e) => setProfileData({ ...profileData, website: e.target.value }), placeholder: "https://yourwebsite.com", fullWidth: true }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Input, { label: "GitHub Username", value: profileData.github, onChange: (e) => setProfileData({ ...profileData, github: e.target.value }), placeholder: "username", fullWidth: true }), _jsx(Input, { label: "LinkedIn Username", value: profileData.linkedin, onChange: (e) => setProfileData({ ...profileData, linkedin: e.target.value }), placeholder: "username", fullWidth: true }), _jsx(Input, { label: "Twitter Handle", value: profileData.twitter, onChange: (e) => setProfileData({ ...profileData, twitter: e.target.value }), placeholder: "@username", fullWidth: true })] }), _jsx("div", { className: "flex justify-end pt-4 border-t border-gray-200", children: _jsx(Button, { variant: "primary", onClick: handleSaveProfile, icon: _jsx(Save, { className: "w-4 h-4" }), children: "Save Changes" }) })] })] })), activeTab === "account" && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Email Address" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Input, { label: "Email", value: profileData.email, onChange: (e) => setProfileData({ ...profileData, email: e.target.value }), type: "email", fullWidth: true }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-gray-200", children: [_jsx("p", { className: "text-sm text-gray-600", children: "We'll send a verification email to your new address" }), _jsx(Button, { variant: "secondary", children: "Change Email" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Change Password" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Input, { label: "Current Password", type: showCurrentPassword ? "text" : "password", value: passwordData.currentPassword, onChange: (e) => setPasswordData({
                                            ...passwordData,
                                            currentPassword: e.target.value,
                                        }), rightIcon: _jsx("button", { onClick: () => setShowCurrentPassword(!showCurrentPassword), className: "focus:outline-none", children: showCurrentPassword ? (_jsx(EyeOff, { className: "w-4 h-4" })) : (_jsx(Eye, { className: "w-4 h-4" })) }), fullWidth: true }), _jsx(Input, { label: "New Password", type: showNewPassword ? "text" : "password", value: passwordData.newPassword, onChange: (e) => setPasswordData({
                                            ...passwordData,
                                            newPassword: e.target.value,
                                        }), hint: "Must be at least 8 characters", rightIcon: _jsx("button", { onClick: () => setShowNewPassword(!showNewPassword), className: "focus:outline-none", children: showNewPassword ? (_jsx(EyeOff, { className: "w-4 h-4" })) : (_jsx(Eye, { className: "w-4 h-4" })) }), fullWidth: true }), _jsx(Input, { label: "Confirm New Password", type: "password", value: passwordData.confirmPassword, onChange: (e) => setPasswordData({
                                            ...passwordData,
                                            confirmPassword: e.target.value,
                                        }), error: passwordData.confirmPassword &&
                                            passwordData.newPassword !== passwordData.confirmPassword
                                            ? "Passwords do not match"
                                            : undefined, fullWidth: true }), _jsx("div", { className: "flex justify-end pt-4 border-t border-gray-200", children: _jsx(Button, { variant: "primary", onClick: handleChangePassword, disabled: !passwordData.currentPassword ||
                                                !passwordData.newPassword ||
                                                passwordData.newPassword !== passwordData.confirmPassword, children: "Update Password" }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Delete Account" }) }), _jsxs(CardContent, { children: [_jsxs(Alert, { variant: "danger", children: [_jsx("strong", { children: "Warning:" }), " Deleting your account is permanent and cannot be undone. All your data, including courses, progress, and achievements will be permanently deleted."] }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx(Button, { variant: "danger", children: "Delete Account" }) })] })] })] })), activeTab === "notifications" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Notification Preferences" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Email Notifications" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Course Updates" }), _jsx("p", { className: "text-sm text-gray-600", children: "Get notified about new lessons and course updates" })] }), _jsx("input", { type: "checkbox", checked: notifications.emailCourseUpdates, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            emailCourseUpdates: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "New Content" }), _jsx("p", { className: "text-sm text-gray-600", children: "Be the first to know about new courses" })] }), _jsx("input", { type: "checkbox", checked: notifications.emailNewContent, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            emailNewContent: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Promotions" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive special offers and discounts" })] }), _jsx("input", { type: "checkbox", checked: notifications.emailPromotions, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            emailPromotions: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Push Notifications" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Course Reminders" }), _jsx("p", { className: "text-sm text-gray-600", children: "Daily reminders to keep your learning streak" })] }), _jsx("input", { type: "checkbox", checked: notifications.pushCourseReminders, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            pushCourseReminders: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Achievements" }), _jsx("p", { className: "text-sm text-gray-600", children: "Get notified when you earn new achievements" })] }), _jsx("input", { type: "checkbox", checked: notifications.pushAchievements, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            pushAchievements: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Messages" }), _jsx("p", { className: "text-sm text-gray-600", children: "Notifications for new messages and mentions" })] }), _jsx("input", { type: "checkbox", checked: notifications.pushMessages, onChange: (e) => setNotifications({
                                                            ...notifications,
                                                            pushMessages: e.target.checked,
                                                        }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] })] })] }), _jsx("div", { className: "flex justify-end pt-4 border-t border-gray-200", children: _jsx(Button, { variant: "primary", onClick: handleSaveNotifications, icon: _jsx(Save, { className: "w-4 h-4" }), children: "Save Preferences" }) })] })] })), activeTab === "privacy" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Privacy Settings" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Profile Visibility" }), _jsx(Select, { options: [
                                            {
                                                value: "public",
                                                label: "Public - Anyone can view your profile",
                                            },
                                            {
                                                value: "members",
                                                label: "Members Only - Only registered users",
                                            },
                                            {
                                                value: "private",
                                                label: "Private - Only you can see your profile",
                                            },
                                        ], value: privacy.profileVisibility, onChange: (e) => setPrivacy({ ...privacy, profileVisibility: e.target.value }), fullWidth: true })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Show Email Address" }), _jsx("p", { className: "text-sm text-gray-600", children: "Display your email on your public profile" })] }), _jsx("input", { type: "checkbox", checked: privacy.showEmail, onChange: (e) => setPrivacy({ ...privacy, showEmail: e.target.checked }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Show Learning Progress" }), _jsx("p", { className: "text-sm text-gray-600", children: "Display your course progress and completion status" })] }), _jsx("input", { type: "checkbox", checked: privacy.showProgress, onChange: (e) => setPrivacy({ ...privacy, showProgress: e.target.checked }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] }), _jsxs("label", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Show Achievements" }), _jsx("p", { className: "text-sm text-gray-600", children: "Display your earned achievements and badges" })] }), _jsx("input", { type: "checkbox", checked: privacy.showAchievements, onChange: (e) => setPrivacy({
                                                    ...privacy,
                                                    showAchievements: e.target.checked,
                                                }), className: "w-5 h-5 text-primary-600 focus:ring-primary-500" })] })] }), _jsx("div", { className: "flex justify-end pt-4 border-t border-gray-200", children: _jsx(Button, { variant: "primary", onClick: handleSavePrivacy, icon: _jsx(Save, { className: "w-4 h-4" }), children: "Save Settings" }) })] })] })), activeTab === "billing" && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Current Plan" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg mb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-1", children: "Pro Plan" }), _jsx("p", { className: "text-gray-600", children: "Full access to all features" })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-3xl font-bold text-primary-600", children: "$29" }), _jsx("p", { className: "text-sm text-gray-600", children: "per month" })] })] }) }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-success-500 rounded-full" }), _jsx("span", { children: "Next billing date: May 15, 2024" })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-700", children: [_jsx("div", { className: "w-1.5 h-1.5 bg-success-500 rounded-full" }), _jsx("span", { children: "Payment method: \u2022\u2022\u2022\u2022 4242" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { variant: "secondary", children: "Change Plan" }), _jsx(Button, { variant: "danger", children: "Cancel Subscription" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Method" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(CreditCard, { className: "w-8 h-8 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Visa ending in 4242" }), _jsx("p", { className: "text-sm text-gray-600", children: "Expires 12/2025" })] })] }), _jsx(Button, { variant: "ghost", size: "sm", children: "Edit" })] }), _jsx(Button, { variant: "secondary", icon: _jsx(CreditCard, { className: "w-4 h-4" }), children: "Add Payment Method" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Billing History" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: [
                                        { date: "2024-04-15", amount: "$29.00", status: "paid" },
                                        { date: "2024-03-15", amount: "$29.00", status: "paid" },
                                        { date: "2024-02-15", amount: "$29.00", status: "paid" },
                                    ].map((invoice, index) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: invoice.amount }), _jsx("p", { className: "text-sm text-gray-600", children: invoice.date })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-sm text-success-600 font-medium capitalize", children: invoice.status }), _jsx(Button, { variant: "ghost", size: "sm", children: "Download" })] })] }, index))) }) })] })] }))] }));
}
