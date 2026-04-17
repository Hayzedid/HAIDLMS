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
    role: 'student' as 'student' | 'instructor',
  });
  const [error, setError] = useState('');
  const register = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>TechLearn</div>
        <h1 className={styles.title}>Create your account</h1>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="role">I am joining as</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="student">Student / Learner</option>
              <option value="instructor">Instructor / Trainer</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
            />
            <small>Min 12 characters with uppercase, lowercase, number and special character</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={register.isPending}
          >
            {register.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
