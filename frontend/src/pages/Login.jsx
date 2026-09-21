import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthSplitLayout from '../layouts/AuthSplitLayout';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err.response?.data?.message ?? 'Unable to sign in. Check your credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Sign in to continue to your account
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <button type="submit" className="btn btn-primary mt-2 w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
        Applying for housing for the first time?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
