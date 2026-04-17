import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
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
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to verify email');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
        {status === 'verifying' && (
          <>
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ color: '#10b981' }}>Email Verified!</h2>
            <p>{message}</p>
            <p>Redirecting to login...</p>
            <Link to="/login" style={{ color: '#1a56db' }}>Go to login now</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>✗</div>
            <h2 style={{ color: '#ef4444' }}>Verification Failed</h2>
            <p>{message}</p>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/login" style={{ color: '#1a56db', marginRight: '1rem' }}>
                Back to login
              </Link>
              <span style={{ color: '#ccc' }}>|</span>
              <Link to="/register" style={{ color: '#1a56db', marginLeft: '1rem' }}>
                Register again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
