import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');
        if (error) {
            navigate('/login?error=oauth');
            return;
        }
        if (accessToken && refreshToken) {
            // Fetch user data with the access token
            fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })
                .then(res => res.json())
                .then(data => {
                if (data.success && data.data) {
                    setAuth(data.data, accessToken, refreshToken);
                    navigate('/dashboard');
                }
                else {
                    navigate('/login?error=oauth');
                }
            })
                .catch(() => {
                navigate('/login?error=oauth');
            });
        }
        else {
            navigate('/login');
        }
    }, [searchParams, navigate, setAuth]);
    return (_jsx("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }, children: _jsxs("div", { children: [_jsx("h2", { children: "Completing authentication..." }), _jsx("p", { children: "Please wait while we sign you in." })] }) }));
}
