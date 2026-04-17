import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
        <h1>Check Your Email</h1>
        <p>If an account exists with that email, you will receive a password reset link shortly.</p>
        <Link to="/login" style={{ color: '#1a56db' }}>← Back to login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <h1>Reset Password</h1>
      <p style={{ color: '#666' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#1a56db' }}>← Back to login</Link>
        </div>
      </form>
    </div>
  );
}
