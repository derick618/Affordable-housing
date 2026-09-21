import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { statusBadgeClass } from '../utils/statusBadge';
import PropertyImage from '../components/PropertyImage';
import { projectImage } from '../utils/images';
import HouseRow from '../components/illustrations/HouseRow';
import Pagination from '../components/Pagination';

const emptyForm = { name: '', description: '', address: '', ward: '', district: '', status: 'planned' };

export default function HousingProjects() {
  const { user } = useAuth();
  const canManage = user.role === 'housing_officer' || user.role === 'super_admin';

  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function loadProjects() {
    setLoading(true);
    client
      .get('/api/housing-projects', { params: { page } })
      .then(({ data }) => {
        setProjects(data.data);
        setMeta(data.meta);
      })
      .catch(() => setError('Could not load housing projects.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadProjects, [page]);

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.post('/api/housing-projects', form);
      setForm(emptyForm);
      setShowForm(false);
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Housing Projects</h1>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {showForm && (
        <form className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="sm:col-span-2">
            <label htmlFor="name" className="field-label">Name</label>
            <input
              id="name"
              required
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="field-label">Description</label>
            <textarea
              id="description"
              className="field-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="field-label">Address</label>
            <input
              id="address"
              className="field-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="ward" className="field-label">Ward</label>
            <input
              id="ward"
              className="field-input"
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="district" className="field-label">District</label>
            <input
              id="district"
              className="field-input"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="status" className="field-label">Status</label>
            <select
              id="status"
              className="field-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create project'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center">
          <HouseRow className="mb-4 h-28 w-full max-w-xs text-stone-300 dark:text-stone-700" />
          <p className="text-stone-500 dark:text-stone-400">No housing projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              to={`/housing-projects/${project.id}`}
              key={project.id}
              className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none dark:border-stone-800 dark:bg-stone-900"
            >
              <PropertyImage
                src={projectImage(project.id)}
                alt={`${project.name} housing project`}
                size="sm"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[16/10]"
                imgClassName="transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-stone-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                    {project.name}
                  </h3>
                  <span className={statusBadgeClass(project.status)}>{project.status}</span>
                </div>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {[project.ward, project.district].filter(Boolean).join(', ') || 'No location set'}
                </p>
                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
                    {project.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
