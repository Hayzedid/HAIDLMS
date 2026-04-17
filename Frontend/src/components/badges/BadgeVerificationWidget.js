import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Search, AlertTriangle } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_CERTIFICATION_SERVICE_URL || 'http://localhost:4005';
export const BadgeVerificationWidget = ({ initialBadgeHash }) => {
    const [badgeHash, setBadgeHash] = useState(initialBadgeHash || '');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const verifyBadge = async () => {
        if (!badgeHash.trim()) {
            setError('Please enter a badge hash or verification URL');
            return;
        }
        try {
            setLoading(true);
            setError('');
            setVerificationResult(null);
            // Extract hash from URL if full URL provided
            const hash = badgeHash.includes('/') ? badgeHash.split('/').pop() : badgeHash;
            const response = await axios.get(`${API_URL}/api/badges/verify/${hash}`);
            setVerificationResult(response.data.data);
        }
        catch (err) {
            if (err.response?.data) {
                setVerificationResult(err.response.data.data);
            }
            else {
                setError('Failed to verify badge. Please check the badge hash and try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            verifyBadge();
        }
    };
    return (_jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Shield, { className: "w-10 h-10 text-indigo-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Verify Badge" }), _jsx("p", { className: "text-gray-600", children: "Enter a badge hash or verification URL to verify its authenticity" })] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: badgeHash, onChange: (e) => setBadgeHash(e.target.value), onKeyPress: handleKeyPress, placeholder: "Badge hash or verification URL", className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("button", { onClick: verifyBadge, disabled: loading || !badgeHash.trim(), className: "px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" }), "Verifying..."] })) : (_jsxs(_Fragment, { children: [_jsx(Search, { className: "w-5 h-5" }), "Verify"] })) })] }) }), error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), verificationResult && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: `p-6 rounded-lg border-2 ${verificationResult.isValid
                                ? 'bg-green-50 border-green-500'
                                : 'bg-red-50 border-red-500'}`, children: _jsx("div", { className: "flex items-center gap-3", children: verificationResult.isValid ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-green-800", children: "Badge Verified \u2713" }), _jsx("p", { className: "text-green-700 text-sm mt-1", children: "This badge is authentic and has been cryptographically verified." })] })] })) : (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "w-8 h-8 text-red-600" }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-red-800", children: "Verification Failed" }), _jsx("p", { className: "text-red-700 text-sm mt-1", children: verificationResult.error || 'This badge could not be verified.' })] })] })) }) }), verificationResult.isValid && verificationResult.badge && (_jsxs("div", { className: "border-2 border-gray-200 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-20 h-20 bg-white rounded-full flex items-center justify-center", children: verificationResult.badge.badgeClass?.image_url ? (_jsx("img", { src: verificationResult.badge.badgeClass.image_url, alt: "Badge", className: "w-16 h-16" })) : (_jsx(Shield, { className: "w-12 h-12 text-indigo-600" })) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-2xl font-bold", children: verificationResult.badge.badgeClass?.name || 'Badge' }), _jsx("p", { className: "text-indigo-100 mt-1", children: verificationResult.badge.badgeClass?.description || 'Achievement badge' })] })] }) }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("h5", { className: "text-sm font-semibold text-gray-600 mb-1", children: "Awarded To" }), _jsx("p", { className: "text-lg font-medium text-gray-900", children: verificationResult.badge.recipient?.name || 'Badge Holder' })] }), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-semibold text-gray-600 mb-1", children: "Issued On" }), _jsx("p", { className: "text-lg font-medium text-gray-900", children: new Date(verificationResult.badge.issued_on).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    }) })] }), verificationResult.badge.achievement_score && (_jsxs("div", { children: [_jsx("h5", { className: "text-sm font-semibold text-gray-600 mb-1", children: "Achievement Score" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-green-500 h-3 rounded-full", style: { width: `${verificationResult.badge.achievement_score}%` } }) }), _jsxs("span", { className: "text-lg font-bold text-gray-900", children: [verificationResult.badge.achievement_score, "%"] })] })] })), _jsxs("div", { children: [_jsx("h5", { className: "text-sm font-semibold text-gray-600 mb-1", children: "Issued By" }), _jsx("p", { className: "text-lg font-medium text-gray-900", children: verificationResult.badge.badgeClass?.issuer_name || 'TechLearn LMS' })] }), _jsxs("div", { className: "pt-4 border-t border-gray-200", children: [_jsx("h5", { className: "text-sm font-semibold text-gray-600 mb-2", children: "Verification Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Algorithm:" }), _jsx("span", { className: "ml-2 font-medium text-gray-900", children: verificationResult.badge.signature_algorithm || 'RSA-SHA256' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Verified:" }), _jsx("span", { className: "ml-2 font-medium text-gray-900", children: new Date(verificationResult.verifiedAt).toLocaleString() })] })] })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("h5", { className: "font-semibold text-blue-900 mb-1", children: "Open Badges 2.0 Compliant" }), _jsx("p", { className: "text-sm text-blue-800", children: "This badge follows the Open Badges 2.0 standard and can be imported into any compatible badge wallet or backpack." })] })] }) })] })] }))] })), !verificationResult && !error && !loading && (_jsxs("div", { className: "text-center text-sm text-gray-500 mt-6", children: [_jsx("p", { children: "All badges are secured with RSA-SHA256 cryptographic signatures" }), _jsx("p", { className: "mt-1", children: "Open Badges 2.0 compliant" })] }))] }) }));
};
