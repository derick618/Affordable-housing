import { useEffect, useState } from 'react';
import client from '../api/client';
import Pagination from '../components/Pagination';

const ROLE_LABELS = {
  applicant: 'Applicant',
  housing_officer: 'Housing Officer',
  auditor: 'Auditor',
  super_admin: 'Super Admin',
};

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'housing_officer' };

function NewUserForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.post('/api/users', form);
      setForm(emptyForm);
      onCreated();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message ?? 'Could not create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <h3 className="text-base font-semibold text-stone-900 sm:col-span-2 dark:text-white">
        New staff account
      </h3>
      <div>
        <label htmlFor="name" className="field-label">Name</label>
        <input
          id="name"
          required
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
          className="field-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="phone" className="field-label">Phone (optional)</label>
        <input
          id="phone"
          className="field-input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="role" className="field-label">Role</label>
        <select
          id="role"
          className="field-input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="housing_officer">Housing Officer</option>
          <option value="auditor">Auditor</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="password" className="field-label">Temporary password</label>
        <input
          id="password"
          type="password"
          required
          className="field-input"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-rose-600 sm:col-span-2 dark:text-rose-400">{error}</p>}
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}

function RoleSelect({ user, onUpdated }) {
  const [updating, setUpdating] = useState(false);

  async function handleChange(event) {
    const role = event.target.value;
    setUpdating(true);
    try {
      await client.patch(`/api/users/${user.id}`, { role });
      onUpdated();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <select
      className="field-input w-auto py-1.5 text-sm"
      value={user.role}
      disabled={updating}
      onChange={handleChange}
    >
      {Object.entries(ROLE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  function loadUsers() {
    setLoading(true);
    client
      .get('/api/users', { params: { page, ...(roleFilter ? { role: roleFilter } : {}) } })
      .then(({ data }) => {
        setUsers(data.data);
        setMeta(data.meta);
      })
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, [roleFilter, page]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Users</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'New Staff Account'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {showForm && (
        <NewUserForm
          onCreated={() => {
            setShowForm(false);
            loadUsers();
          }}
        />
      )}

      <div className="mb-4">
        <select
          className="field-input w-auto"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">No users found.</p>
      ) : (
        <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <div className="font-medium text-stone-900 dark:text-white">{user.name}</div>
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  {user.email}
                  {user.phone && ` · ${user.phone}`}
                </div>
              </div>
              <RoleSelect user={user} onUpdated={loadUsers} />
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
