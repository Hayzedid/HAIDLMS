import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyComplianceApi } from '../../api';
import { Shield, Check, X, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
export const ConsentManager = ({ userId }) => {
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState('');
    // Fetch user consents
    const { data: consentsData, isLoading } = useQuery({
        queryKey: ['user-consents', userId, selectedStatus],
        queryFn: async () => {
            const response = await privacyComplianceApi.getUserConsents(userId, selectedStatus || undefined);
            return response.data;
        },
        enabled: !!userId,
    });
    // Grant consent mutation
    const grantConsentMutation = useMutation({
        mutationFn: async (data) => {
            const response = await privacyComplianceApi.grantConsent({
                user_id: userId,
                ...data,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-consents', userId] });
            toast.success('Consent granted successfully');
        },
        onError: (error) => {
            const message = error.response?.data?.error || 'Failed to grant consent';
            toast.error(message);
        },
    });
    // Withdraw consent mutation
    const withdrawConsentMutation = useMutation({
        mutationFn: async (consentType) => {
            const response = await privacyComplianceApi.withdrawConsent(userId, consentType);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['user-consents', userId] });
            toast.success(`${data.count} consent(s) withdrawn successfully`);
        },
        onError: (error) => {
            const message = error.response?.data?.error || 'Failed to withdraw consent';
            toast.error(message);
        },
    });
    const consents = consentsData?.consents || [];
    const consentPurposes = [
        {
            type: 'data_processing',
            purpose: 'service_provision',
            name: 'Essential Service',
            description: 'Required for core platform functionality and account management',
            required: true,
        },
        {
            type: 'analytics',
            purpose: 'analytics',
            name: 'Analytics & Performance',
            description: 'Help us improve the platform by collecting usage statistics',
            required: false,
        },
        {
            type: 'marketing',
            purpose: 'marketing',
            name: 'Marketing Communications',
            description: 'Receive updates about new courses, features, and promotions',
            required: false,
        },
        {
            type: 'personalization',
            purpose: 'personalization',
            name: 'Personalization',
            description: 'Customize your learning experience based on your preferences',
            required: false,
        },
    ];
    const getConsentStatus = (consentType) => {
        return consents.find((c) => c.consent_type === consentType && c.consent_status === 'granted');
    };
    const handleToggleConsent = async (consentType, purpose, required) => {
        if (required) {
            toast.error('This consent is required for the service to function');
            return;
        }
        const existingConsent = getConsentStatus(consentType);
        if (existingConsent) {
            // Withdraw consent
            await withdrawConsentMutation.mutateAsync(consentType);
        }
        else {
            // Grant consent
            await grantConsentMutation.mutateAsync({
                consent_type: consentType,
                consent_purpose: purpose,
                consent_version: 'v1.0',
            });
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-6", children: [_jsx(Shield, { className: "w-6 h-6 text-blue-600" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Privacy Preferences" })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Info, { className: "w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-900 font-medium mb-1", children: "Your Privacy Matters" }), _jsx("p", { className: "text-sm text-blue-800", children: "Control how your data is used. You can change these settings at any time. Some consents are required for the platform to function properly." })] })] }) }), _jsx("div", { className: "space-y-4 mb-6", children: consentPurposes.map((item) => {
                    const hasConsent = !!getConsentStatus(item.type);
                    const isPending = grantConsentMutation.isPending || withdrawConsentMutation.isPending;
                    return (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: item.name }), item.required && (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800", children: "Required" }))] }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: item.description }), hasConsent && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [_jsx(Check, { className: "w-3 h-3 text-green-600" }), _jsxs("span", { children: ["Granted on", ' ', new Date(getConsentStatus(item.type).granted_at).toLocaleDateString()] })] }))] }), _jsx("button", { onClick: () => handleToggleConsent(item.type, item.purpose, item.required), disabled: isPending || item.required, className: `flex items-center justify-center w-14 h-8 rounded-full transition-colors ${hasConsent
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-300 hover:bg-gray-400'} ${item.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isPending ? 'opacity-50' : ''}`, children: _jsx("div", { className: `w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${hasConsent ? 'translate-x-3' : '-translate-x-3'} flex items-center justify-center`, children: hasConsent ? (_jsx(Check, { className: "w-4 h-4 text-green-600" })) : (_jsx(X, { className: "w-4 h-4 text-gray-400" })) }) })] }) }, item.type));
                }) }), _jsxs("div", { className: "border-t border-gray-200 pt-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Consent History" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setSelectedStatus(''), className: `px-3 py-1 text-sm rounded ${selectedStatus === ''
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'}`, children: "All" }), _jsx("button", { onClick: () => setSelectedStatus('granted'), className: `px-3 py-1 text-sm rounded ${selectedStatus === 'granted'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'}`, children: "Active" }), _jsx("button", { onClick: () => setSelectedStatus('withdrawn'), className: `px-3 py-1 text-sm rounded ${selectedStatus === 'withdrawn'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'}`, children: "Withdrawn" })] })] }), consents.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500 text-center py-4", children: "No consent history found" })) : (_jsx("div", { className: "space-y-2", children: consents.map((consent) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: consent.consent_type }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Purpose: ", consent.consent_purpose] })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: `inline-block px-2 py-1 rounded-full text-xs ${consent.consent_status === 'granted'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'}`, children: consent.consent_status }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: new Date(consent.consent_status === 'granted'
                                                ? consent.granted_at
                                                : consent.withdrawn_at).toLocaleString() })] })] }, consent.id))) }))] }), _jsx("div", { className: "mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "text-yellow-900 font-medium mb-1", children: "Your Rights Under GDPR/CCPA" }), _jsx("p", { className: "text-yellow-800 mb-2", children: "You have the right to access, rectify, or delete your personal data. You can also request data portability or restrict processing." }), _jsx("button", { className: "text-yellow-900 underline hover:text-yellow-700 font-medium", children: "Submit a Privacy Request" })] })] }) })] }));
};
