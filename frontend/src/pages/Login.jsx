import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HouseRow from '../components/illustrations/HouseRow';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
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
    <div className="flex min-h-svh w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-amber-600 p-12 text-amber-50 lg:flex dark:bg-amber-800">
        <div>
          <div className="text-lg font-bold">Affordable Housing</div>
          <p className="mt-1 text-sm text-amber-100/80">Dar es Salaam</p>
        </div>

        <div>
          <h2 className="text-3xl leading-tight font-semibold text-white">
            Fair access to housing,
            <br />
            from application to move-in.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-amber-100/80">
            Apply for housing, track your application, and manage allocations — all in one
            place.
          </p>
        </div>

        <HouseRow className="h-40 w-full text-amber-100/90" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="text-lg font-bold text-stone-900 dark:text-white">
              Affordable Housing
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">Dar es Salaam</p>
          </div>

          <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">Welcome back</h1>
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
        </div>
      </div>
    </div>
  );
}
