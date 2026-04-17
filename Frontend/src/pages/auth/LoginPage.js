import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const login = useLogin();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await authApi.login({ email, password, mfaCode: mfaCode || undefined });
            const body = res.data;
            if (body.mfaRequired) {
                setMfaRequired(true);
                return;
            }
            const { user, accessToken, refreshToken } = body.data;
            setAuth(user, accessToken, refreshToken);
            if (user.role === 'admin')
                navigate('/admin/dashboard');
            else if (user.role === 'instructor')
                navigate('/instructor/dashboard');
            else
                navigate('/dashboard');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.logo, children: "TechLearn" }), _jsx("h1", { className: styles.title, children: mfaRequired ? 'Two-Factor Authentication' : 'Sign in to your account' }), searchParams.get('registered') && (_jsx("p", { className: styles.success, children: "Account created! Please check your email to verify." })), error && _jsx("p", { className: styles.error, role: "alert", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, noValidate: true, children: [!mfaRequired ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "email", children: "Email address" }), _jsx("input", { id: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value) })] })] })) : (_jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "mfaCode", children: "Enter the 6-digit code from your authenticator app" }), _jsx("input", { id: "mfaCode", type: "text", inputMode: "numeric", maxLength: 6, autoComplete: "one-time-code", required: true, value: mfaCode, onChange: (e) => setMfaCode(e.target.value) })] })), _jsx("button", { type: "submit", className: styles.submitBtn, disabled: login.isPending, children: login.isPending ? 'Signing in...' : mfaRequired ? 'Verify' : 'Sign in' })] }), !mfaRequired && (_jsxs(_Fragment, { children: [_jsx("div", { style: { textAlign: 'center', margin: '1rem 0' }, children: _jsx(Link, { to: "/forgot-password", style: { fontSize: '0.875rem', color: '#1a56db' }, children: "Forgot your password?" }) }), _jsx("div", { style: { margin: '1.5rem 0', textAlign: 'center', color: '#666' }, children: _jsx("span", { children: "or continue with" }) }), _jsxs("div", { style: { display: 'grid', gap: '0.75rem' }, children: [_jsxs("a", { href: "/api/auth/oauth/google", style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        color: '#333',
                                        fontWeight: 500,
                                        backgroundColor: 'white'
                                    }, children: [_jsxs("svg", { style: { width: '20px', height: '20px', marginRight: '0.5rem' }, viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Continue with Google"] }), _jsxs("a", { href: "/api/auth/oauth/github", style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        color: '#333',
                                        fontWeight: 500,
                                        backgroundColor: 'white'
                                    }, children: [_jsx("svg", { style: { width: '20px', height: '20px', marginRight: '0.5rem' }, viewBox: "0 0 24 24", children: _jsx("path", { fill: "#181717", d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" }) }), "Continue with GitHub"] }), _jsxs("a", { href: "/api/auth/oauth/microsoft", style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        color: '#333',
                                        fontWeight: 500,
                                        backgroundColor: 'white'
                                    }, children: [_jsxs("svg", { style: { width: '20px', height: '20px', marginRight: '0.5rem' }, viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#f35325", d: "M0 0h11.377v11.372H0z" }), _jsx("path", { fill: "#81bc06", d: "M12.623 0H24v11.372H12.623z" }), _jsx("path", { fill: "#05a6f0", d: "M0 12.628h11.377V24H0z" }), _jsx("path", { fill: "#ffba08", d: "M12.623 12.628H24V24H12.623z" })] }), "Continue with Microsoft"] })] }), _jsxs("p", { className: styles.footer, children: ["Don't have an account? ", _jsx(Link, { to: "/register", children: "Create one" })] })] }))] }) }));
}
