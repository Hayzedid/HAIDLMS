import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Shield, Smartphone, Key, Check, Copy, Download } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4001';
export const MFASetupWizard = ({ userId, onComplete }) => {
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('totp');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const startTOTPSetup = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/api/mfa/totp/enable`, { userId });
            setQrCode(response.data.qrCode);
            setSecret(response.data.secret);
            setStep(2);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to set up TOTP');
        }
        finally {
            setLoading(false);
        }
    };
    const verifyTOTP = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/api/mfa/totp/verify`, {
                userId,
                token: verificationCode,
            });
            if (response.data.verified) {
                await generateBackupCodes();
                setStep(3);
            }
            else {
                setError('Invalid verification code. Please try again.');
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
        finally {
            setLoading(false);
        }
    };
    const generateBackupCodes = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/mfa/backup-codes`, { userId });
            setBackupCodes(response.data.codes);
        }
        catch (err) {
            setError('Failed to generate backup codes');
        }
    };
    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
    };
    const downloadBackupCodes = () => {
        const element = document.createElement('a');
        const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'haidlms-backup-codes.txt';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    const completeMFASetup = async () => {
        try {
            await axios.post(`${API_URL}/api/mfa/enable`, { userId, primaryMethod: method });
            onComplete();
        }
        catch (err) {
            setError('Failed to complete MFA setup');
        }
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsx("div", { className: "flex items-center justify-center mb-8", children: [1, 2, 3].map((s) => (_jsxs(React.Fragment, { children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`, children: step > s ? _jsx(Check, { className: "w-6 h-6" }) : s }), s < 3 && (_jsx("div", { className: `w-20 h-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}` }))] }, s))) }), step === 1 && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx(Shield, { className: "w-16 h-16 text-indigo-600 mx-auto mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Set Up Multi-Factor Authentication" }), _jsx("p", { className: "text-gray-600", children: "Add an extra layer of security to your account" })] }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), _jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: () => {
                                    setMethod('totp');
                                    startTOTPSetup();
                                }, className: "w-full p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-600 transition text-left", children: _jsxs("div", { className: "flex items-start", children: [_jsx(Smartphone, { className: "w-8 h-8 text-indigo-600 mr-4 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-1", children: "Authenticator App (Recommended)" }), _jsx("p", { className: "text-sm text-gray-600", children: "Use an app like Google Authenticator or Authy to generate verification codes" })] })] }) }), _jsx("button", { onClick: () => setMethod('webauthn'), className: "w-full p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-600 transition text-left", disabled: true, children: _jsxs("div", { className: "flex items-start", children: [_jsx(Key, { className: "w-8 h-8 text-gray-400 mr-4 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-400 mb-1", children: "Security Key (Coming Soon)" }), _jsx("p", { className: "text-sm text-gray-500", children: "Use a hardware security key like YubiKey or your device's biometrics" })] })] }) })] })] })), step === 2 && method === 'totp' && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-4 text-center", children: "Scan QR Code" }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: "Open your authenticator app and scan this QR code" }), qrCode && (_jsx("div", { className: "flex justify-center mb-6", children: _jsx("img", { src: qrCode, alt: "QR Code", className: "w-64 h-64 border-2 border-gray-200 rounded-lg" }) })), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg mb-6", children: [_jsx("p", { className: "text-sm text-gray-600 mb-2 text-center", children: "Or enter this code manually:" }), _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("code", { className: "text-lg font-mono font-semibold text-gray-800", children: secret }), _jsx("button", { onClick: () => navigator.clipboard.writeText(secret), className: "p-2 text-indigo-600 hover:bg-indigo-50 rounded", children: _jsx(Copy, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Enter Verification Code" }), _jsx("input", { type: "text", value: verificationCode, onChange: (e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "000000", className: "w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg tracking-widest", maxLength: 6 })] }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: error })), _jsx("button", { onClick: verifyTOTP, disabled: verificationCode.length !== 6 || loading, className: "w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: loading ? 'Verifying...' : 'Verify and Continue' })] })), step === 3 && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-4 text-center", children: "Save Your Backup Codes" }), _jsx("p", { className: "text-gray-600 text-center mb-6", children: "Store these codes in a safe place. You can use them to access your account if you lose your device." }), _jsx("div", { className: "bg-gray-50 p-6 rounded-lg mb-6", children: _jsx("div", { className: "grid grid-cols-2 gap-3", children: backupCodes.map((code, idx) => (_jsx("div", { className: "font-mono text-center py-2 bg-white rounded border border-gray-200", children: code }, idx))) }) }), _jsxs("div", { className: "flex gap-3 mb-6", children: [_jsxs("button", { onClick: copyBackupCodes, className: "flex-1 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 flex items-center justify-center gap-2", children: [_jsx(Copy, { className: "w-5 h-5" }), "Copy Codes"] }), _jsxs("button", { onClick: downloadBackupCodes, className: "flex-1 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 flex items-center justify-center gap-2", children: [_jsx(Download, { className: "w-5 h-5" }), "Download"] })] }), _jsx("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6", children: _jsxs("p", { className: "text-sm text-amber-800", children: [_jsx("strong", { children: "Important:" }), " Each backup code can only be used once. Store them securely and don't share them with anyone."] }) }), _jsx("button", { onClick: completeMFASetup, className: "w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700", children: "Complete Setup" })] }))] }));
};
