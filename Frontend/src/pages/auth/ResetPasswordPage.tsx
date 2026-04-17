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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await authApi.resetPassword(token!, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
        <h1>Password Reset Successful</h1>
        <p>Your password has been reset. Redirecting to login...</p>
        <Link to="/login" style={{ color: '#1a56db' }}>Go to login now</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h1>Set New Password</h1>
      <p style={{ color: '#666' }}>
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <small style={{ color: '#666', fontSize: '0.875rem' }}>
            Min 12 characters, uppercase, lowercase, number, special character
          </small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#ccc' : '#1a56db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#1a56db' }}>← Back to login</Link>
        </div>
      </form>
    </div>
  );
}
