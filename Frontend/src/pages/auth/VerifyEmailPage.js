import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        const verifyEmail = async () => {
            try {
                const response = await authApi.verifyEmail(token);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                setTimeout(() => navigate('/login'), 3000);
            }
            catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to verify email');
            }
        };
        verifyEmail();
    }, [token, navigate]);
    return (_jsx("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }, children: _jsxs("div", { style: { textAlign: 'center', maxWidth: '500px', padding: '2rem' }, children: [status === 'verifying' && (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Verifying your email..." }), _jsx("p", { children: "Please wait while we verify your email address." })] })), status === 'success' && (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\u2713" }), _jsx("h2", { style: { color: '#10b981' }, children: "Email Verified!" }), _jsx("p", { children: message }), _jsx("p", { children: "Redirecting to login..." }), _jsx(Link, { to: "/login", style: { color: '#1a56db' }, children: "Go to login now" })] })), status === 'error' && (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }, children: "\u2717" }), _jsx("h2", { style: { color: '#ef4444' }, children: "Verification Failed" }), _jsx("p", { children: message }), _jsxs("div", { style: { marginTop: '2rem' }, children: [_jsx(Link, { to: "/login", style: { color: '#1a56db', marginRight: '1rem' }, children: "Back to login" }), _jsx("span", { style: { color: '#ccc' }, children: "|" }), _jsx(Link, { to: "/register", style: { color: '#1a56db', marginLeft: '1rem' }, children: "Register again" })] })] }))] }) }));
}
