import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { privacyComplianceApi } from "../../api/privacy-compliance.api";
import { Download, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
export const GDPRCompliancePage = () => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [exportStatus, setExportStatus] = useState("idle");
    const [deleteStatus, setDeleteStatus] = useState("idle");
    const exportDataMutation = useMutation({
        mutationFn: () => privacyComplianceApi.exportPersonalData(),
        onSuccess: (data) => {
            setExportStatus("success");
            // Trigger download
            const element = document.createElement("a");
            const file = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
            });
            element.href = URL.createObjectURL(file);
            element.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },
        onError: () => setExportStatus("error"),
    });
    const deleteAccountMutation = useMutation({
        mutationFn: () => privacyComplianceApi.deleteAccount(deletePassword),
        onSuccess: () => {
            setDeleteStatus("success");
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        },
        onError: () => setDeleteStatus("error"),
    });
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Privacy & Data Protection" }), _jsx("p", { className: "text-gray-600", children: "Manage your personal data in accordance with GDPR regulations" })] }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3", children: [_jsx("div", { className: "bg-blue-100 p-2 rounded-lg flex-shrink-0", children: _jsx(CheckCircle, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-blue-900", children: "GDPR Compliant" }), _jsx("p", { className: "text-sm text-blue-800 mt-1", children: "We respect your privacy and provide tools to control your personal data as required by GDPR." })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Download, { className: "w-6 h-6 text-blue-600" }), _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Export Your Data" })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Download a complete copy of your personal data in JSON format. This includes your profile, courses, progress, certificates, and all other information we hold about you." }), _jsxs("div", { className: "space-y-3 mb-6 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-blue-600 font-bold", children: "\u2713" }), _jsx("span", { children: "All personal information" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-blue-600 font-bold", children: "\u2713" }), _jsx("span", { children: "Course enrollments & progress" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-blue-600 font-bold", children: "\u2713" }), _jsx("span", { children: "Certificates & achievements" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-blue-600 font-bold", children: "\u2713" }), _jsx("span", { children: "Learning history & assessments" })] })] }), exportStatus === "success" && (_jsx("div", { className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm", children: "\u2713 Your data has been exported and downloaded successfully!" })), exportStatus === "error" && (_jsx("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm", children: "\u2717 Error exporting data. Please try again." })), _jsx("button", { onClick: () => {
                                        setExportStatus("processing");
                                        exportDataMutation.mutate();
                                    }, disabled: exportDataMutation.isPending || exportStatus === "success", className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: exportDataMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), "Preparing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { className: "w-4 h-4" }), "Download My Data"] })) }), _jsx("p", { className: "text-xs text-gray-500 mt-3", children: "You will receive your data as a JSON file, typically within a few minutes." })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 border-2 border-red-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Trash2, { className: "w-6 h-6 text-red-600" }), _jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Delete Account" })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Permanently delete your account and all associated data. This action cannot be undone." }), _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-red-900 text-sm", children: "Warning" }), _jsx("p", { className: "text-red-800 text-xs mt-1", children: "This will permanently delete your account, learning progress, certificates, and any data we hold about you. This cannot be recovered." })] })] }), !showDeleteConfirm ? (_jsxs("button", { onClick: () => setShowDeleteConfirm(true), className: "w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Delete My Account"] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Enter your password to confirm:" }), _jsx("input", { type: "password", value: deletePassword, onChange: (e) => setDeletePassword(e.target.value), placeholder: "Your password...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" })] }), deleteStatus === "success" && (_jsx("div", { className: "p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm", children: "\u2713 Account deletion initiated. Redirecting to login..." })), deleteStatus === "error" && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm", children: "\u2717 Incorrect password. Please try again." })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                                        setShowDeleteConfirm(false);
                                                        setDeletePassword("");
                                                        setDeleteStatus("idle");
                                                    }, className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition", children: "Cancel" }), _jsx("button", { onClick: () => {
                                                        setDeleteStatus("processing");
                                                        deleteAccountMutation.mutate();
                                                    }, disabled: deleteAccountMutation.isPending || !deletePassword, className: "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50", children: deleteAccountMutation.isPending
                                                        ? "Deleting..."
                                                        : "Confirm Delete" })] })] }))] })] }), _jsxs("div", { className: "mt-12 bg-gray-100 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-4", children: "Your Privacy Rights" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-700", children: [_jsxs("li", { children: [_jsx("strong", { children: "Right to Access:" }), " You can request and download all personal data we hold about you."] }), _jsxs("li", { children: [_jsx("strong", { children: "Right to Erasure:" }), " You can request deletion of your account and personal data."] }), _jsxs("li", { children: [_jsx("strong", { children: "Right to Portability:" }), " You can download your data in a portable format."] }), _jsxs("li", { children: [_jsx("strong", { children: "Right to Rectification:" }), " You can correct inaccurate personal data in your profile."] }), _jsxs("li", { children: [_jsx("strong", { children: "Right to Withdraw Consent:" }), " You can change your privacy preferences at any time."] })] }), _jsxs("p", { className: "text-xs text-gray-600 mt-4", children: ["For more information, see our", " ", _jsx("a", { href: "/privacy", className: "text-blue-600 hover:underline", children: "Privacy Policy" }), "."] })] })] }) }));
};
export default GDPRCompliancePage;
