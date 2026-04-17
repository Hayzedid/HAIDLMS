import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useAuth';
import styles from './Auth.module.css';
export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
    });
    const [error, setError] = useState('');
    const register = useRegister();
    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            await register.mutateAsync({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                role: form.role,
            });
        }
        catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.card, children: [_jsx("div", { className: styles.logo, children: "TechLearn" }), _jsx("h1", { className: styles.title, children: "Create your account" }), error && _jsx("p", { className: styles.error, role: "alert", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, noValidate: true, children: [_jsxs("div", { className: styles.row, children: [_jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "firstName", children: "First name" }), _jsx("input", { id: "firstName", name: "firstName", type: "text", autoComplete: "given-name", required: true, value: form.firstName, onChange: handleChange })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "lastName", children: "Last name" }), _jsx("input", { id: "lastName", name: "lastName", type: "text", autoComplete: "family-name", required: true, value: form.lastName, onChange: handleChange })] })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "email", children: "Email address" }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: form.email, onChange: handleChange })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "role", children: "I am joining as" }), _jsxs("select", { id: "role", name: "role", value: form.role, onChange: handleChange, children: [_jsx("option", { value: "student", children: "Student / Learner" }), _jsx("option", { value: "instructor", children: "Instructor / Trainer" })] })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", name: "password", type: "password", autoComplete: "new-password", required: true, value: form.password, onChange: handleChange }), _jsx("small", { children: "Min 12 characters with uppercase, lowercase, number and special character" })] }), _jsxs("div", { className: styles.field, children: [_jsx("label", { htmlFor: "confirmPassword", children: "Confirm password" }), _jsx("input", { id: "confirmPassword", name: "confirmPassword", type: "password", autoComplete: "new-password", required: true, value: form.confirmPassword, onChange: handleChange })] }), _jsx("button", { type: "submit", className: styles.submitBtn, disabled: register.isPending, children: register.isPending ? 'Creating account...' : 'Create account' })] }), _jsxs("p", { className: styles.footer, children: ["Already have an account? ", _jsx(Link, { to: "/login", children: "Sign in" })] })] }) }));
}
