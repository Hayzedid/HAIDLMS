import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const token = searchParams.get('token');
    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 12) {
            setError('Password must be at least 12 characters');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsxs("div", { style: { maxWidth: '400px', margin: '4rem auto', padding: '2rem' }, children: [_jsx("h1", { children: "Password Reset Successful" }), _jsx("p", { children: "Your password has been reset. Redirecting to login..." }), _jsx(Link, { to: "/login", style: { color: '#1a56db' }, children: "Go to login now" })] }));
    }
    return (_jsxs("div", { style: { maxWidth: '400px', margin: '4rem auto', padding: '2rem' }, children: [_jsx("h1", { children: "Set New Password" }), _jsx("p", { style: { color: '#666' }, children: "Enter your new password below." }), _jsxs("form", { onSubmit: handleSubmit, style: { marginTop: '2rem' }, children: [error && (_jsx("div", { style: { padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }, children: error })), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { htmlFor: "password", style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "New Password" }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                } }), _jsx("small", { style: { color: '#666', fontSize: '0.875rem' }, children: "Min 12 characters, uppercase, lowercase, number, special character" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { htmlFor: "confirmPassword", style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Confirm Password" }), _jsx("input", { id: "confirmPassword", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, style: {
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
                        }, children: loading ? 'Resetting...' : 'Reset Password' }), _jsx("div", { style: { marginTop: '1rem', textAlign: 'center' }, children: _jsx(Link, { to: "/login", style: { color: '#1a56db' }, children: "\u2190 Back to login" }) })] })] }));
}
