import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4001';
export const MFAVerification = ({ userId, method, onVerified, onCancel }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const verifyCode = async () => {
        if (code.length < 6)
            return;
        try {
            setLoading(true);
            setError('');
            const endpoint = useBackupCode
                ? `${API_URL}/api/mfa/backup-code/verify`
                : `${API_URL}/api/mfa/${method}/verify`;
            const response = await axios.post(endpoint, {
                userId,
                [useBackupCode ? 'code' : 'token']: code,
            });
            if (response.data.verified) {
                onVerified();
            }
            else {
                setError('Invalid code. Please try again.');
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
        finally {
            setLoading(false);
        }
    };
    const getMethodLabel = () => {
        const labels = {
            totp: 'Authenticator App',
            sms: 'SMS',
            email: 'Email',
        };
        return labels[method];
    };
    return (_jsx("div", { className: "max-w-md mx-auto p-6", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-indigo-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-gray-600", children: useBackupCode
                                ? 'Enter your backup code'
                                : `Enter the code from your ${getMethodLabel()}` })] }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: error })), _jsx("div", { className: "mb-6", children: _jsx("input", { type: "text", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 8 : 6)), placeholder: useBackupCode ? '00000000' : '000000', className: "w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg tracking-widest", maxLength: useBackupCode ? 8 : 6, autoFocus: true, onKeyPress: (e) => {
                            if (e.key === 'Enter' && code.length >= 6) {
                                verifyCode();
                            }
                        } }) }), _jsx("button", { onClick: verifyCode, disabled: code.length < 6 || loading, className: "w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4", children: loading ? 'Verifying...' : 'Verify' }), !useBackupCode && (_jsx("button", { onClick: () => setUseBackupCode(true), className: "w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium", children: "Use backup code instead" })), useBackupCode && (_jsxs("button", { onClick: () => setUseBackupCode(false), className: "w-full flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), "Use authenticator code instead"] })), onCancel && (_jsx("button", { onClick: onCancel, className: "w-full mt-4 text-sm text-gray-600 hover:text-gray-700", children: "Cancel" }))] }) }));
};
