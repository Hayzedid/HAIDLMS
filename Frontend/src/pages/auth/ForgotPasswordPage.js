import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSubmitted(true);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        }
        finally {
            setLoading(false);
        }
    };
    if (submitted) {
        return (_jsxs("div", { style: { maxWidth: '400px', margin: '4rem auto', padding: '2rem' }, children: [_jsx("h1", { children: "Check Your Email" }), _jsx("p", { children: "If an account exists with that email, you will receive a password reset link shortly." }), _jsx(Link, { to: "/login", style: { color: '#1a56db' }, children: "\u2190 Back to login" })] }));
    }
    return (_jsxs("div", { style: { maxWidth: '400px', margin: '4rem auto', padding: '2rem' }, children: [_jsx("h1", { children: "Reset Password" }), _jsx("p", { style: { color: '#666' }, children: "Enter your email address and we'll send you a link to reset your password." }), _jsxs("form", { onSubmit: handleSubmit, style: { marginTop: '2rem' }, children: [error && (_jsx("div", { style: { padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }, children: error })), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { htmlFor: "email", style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Email Address" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                } })] }), _jsx("button", { type: "submit", disabled: loading, style: {
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? '#ccc' : '#1a56db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 500
                        }, children: loading ? 'Sending...' : 'Send Reset Link' }), _jsx("div", { style: { marginTop: '1rem', textAlign: 'center' }, children: _jsx(Link, { to: "/login", style: { color: '#1a56db' }, children: "\u2190 Back to login" }) })] })] }));
}
