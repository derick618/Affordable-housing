import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthSplitLayout from '../layouts/AuthSplitLayout';

const emptyForm = { name: '', email: '', phone: '', password: '', password_confirmation: '' };

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState(emptyForm);
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
      await register(form);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message ?? 'Unable to create your account.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Create an account</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Save homes, contact owners and apply for affordable housing
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="field-label">Full name</label>
          <input
            id="name"
            required
            autoComplete="name"
            className="field-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            className="field-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">Phone (optional)</label>
          <input
            id="phone"
            autoComplete="tel"
            className="field-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            className="field-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="password_confirmation" className="field-label">Confirm password</label>
          <input
            id="password_confirmation"
            type="password"
            required
            autoComplete="new-password"
            className="field-input"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <button type="submit" className="btn btn-primary mt-2 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
