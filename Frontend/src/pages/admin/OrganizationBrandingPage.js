import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin.api";
import { Palette, Upload, Save } from "lucide-react";
export const OrganizationBrandingPage = () => {
    const [branding, setBranding] = useState({
        organizationName: "",
        logo: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#8b5cf6",
        accentColor: "#ec4899",
        emailSignature: "",
        supportEmail: "",
        websiteUrl: "",
        socialLinks: {
            twitter: "",
            linkedin: "",
            facebook: "",
            instagram: "",
        },
    });
    const { data: currentBranding, isLoading } = useQuery({
        queryKey: ["organizationBranding"],
        queryFn: () => adminApi.getOrganizationBranding?.() || Promise.resolve(null),
    });
    useEffect(() => {
        if (currentBranding) {
            setBranding(currentBranding);
        }
    }, [currentBranding]);
    const updateMutation = useMutation({
        mutationFn: (data) => adminApi.updateOrganizationBranding?.(data),
        onSuccess: () => alert("Branding updated successfully!"),
    });
    const handleSocialLinkChange = (platform, value) => {
        setBranding({
            ...branding,
            socialLinks: { ...branding.socialLinks, [platform]: value },
        });
    };
    if (isLoading)
        return _jsx("div", { className: "text-center py-12", children: "Loading..." });
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(Palette, { className: "w-8 h-8 text-purple-600" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Organization Branding" })] }), _jsx("p", { className: "text-gray-600", children: "Customize your organization's look and feel" })] }), _jsxs("form", { onSubmit: (e) => {
                        e.preventDefault();
                        updateMutation.mutate(branding);
                    }, className: "space-y-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Basic Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Organization Name" }), _jsx("input", { type: "text", value: branding.organizationName, onChange: (e) => setBranding({
                                                        ...branding,
                                                        organizationName: e.target.value,
                                                    }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Your organization name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Logo URL" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "url", value: branding.logo, onChange: (e) => setBranding({ ...branding, logo: e.target.value }), className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "https://example.com/logo.png" }), _jsxs("button", { type: "button", className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2", children: [_jsx(Upload, { className: "w-4 h-4" }), " Upload"] })] }), branding.logo && (_jsx("img", { src: branding.logo, alt: "Logo", className: "mt-2 h-12" }))] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Color Scheme" }), _jsxs("div", { className: "grid grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Primary Color" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: branding.primaryColor, onChange: (e) => setBranding({ ...branding, primaryColor: e.target.value }), className: "h-12 w-20 border border-gray-300 rounded cursor-pointer" }), _jsx("input", { type: "text", value: branding.primaryColor, onChange: (e) => setBranding({ ...branding, primaryColor: e.target.value }), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Secondary Color" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: branding.secondaryColor, onChange: (e) => setBranding({
                                                                ...branding,
                                                                secondaryColor: e.target.value,
                                                            }), className: "h-12 w-20 border border-gray-300 rounded cursor-pointer" }), _jsx("input", { type: "text", value: branding.secondaryColor, onChange: (e) => setBranding({
                                                                ...branding,
                                                                secondaryColor: e.target.value,
                                                            }), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Accent Color" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "color", value: branding.accentColor, onChange: (e) => setBranding({ ...branding, accentColor: e.target.value }), className: "h-12 w-20 border border-gray-300 rounded cursor-pointer" }), _jsx("input", { type: "text", value: branding.accentColor, onChange: (e) => setBranding({ ...branding, accentColor: e.target.value }), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] }), _jsxs("div", { className: "mt-6 flex gap-4", children: [_jsx("div", { className: "h-20 w-20 rounded-lg border-2 border-gray-300", style: { backgroundColor: branding.primaryColor }, title: "Primary" }), _jsx("div", { className: "h-20 w-20 rounded-lg border-2 border-gray-300", style: { backgroundColor: branding.secondaryColor }, title: "Secondary" }), _jsx("div", { className: "h-20 w-20 rounded-lg border-2 border-gray-300", style: { backgroundColor: branding.accentColor }, title: "Accent" })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Contact Information" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Support Email" }), _jsx("input", { type: "email", value: branding.supportEmail, onChange: (e) => setBranding({ ...branding, supportEmail: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "support@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Website URL" }), _jsx("input", { type: "url", value: branding.websiteUrl, onChange: (e) => setBranding({ ...branding, websiteUrl: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "https://example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Signature" }), _jsx("textarea", { value: branding.emailSignature, onChange: (e) => setBranding({ ...branding, emailSignature: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", rows: 4, placeholder: "Your email signature..." })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Social Media Links" }), _jsx("div", { className: "space-y-4", children: Object.entries(branding.socialLinks).map(([platform, url]) => (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2 capitalize", children: [platform, " URL"] }), _jsx("input", { type: "url", value: url, onChange: (e) => handleSocialLinkChange(platform, e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: `https://${platform}.com/yourpage` })] }, platform))) })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("button", { type: "submit", disabled: updateMutation.isPending, className: "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50", children: [_jsx(Save, { className: "w-4 h-4" }), updateMutation.isPending ? "Saving..." : "Save Branding"] }), _jsx("button", { type: "button", onClick: () => setBranding(currentBranding || branding), className: "px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold", children: "Reset" })] })] })] }) }));
};
export default OrganizationBrandingPage;
