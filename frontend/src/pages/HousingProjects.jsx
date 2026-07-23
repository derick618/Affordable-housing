import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const emptyForm = { name: '', description: '', address: '', ward: '', district: '', status: 'planned' };

export default function HousingProjects() {
  const { user } = useAuth();
  const canManage = user.role === 'housing_officer' || user.role === 'super_admin';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function loadProjects() {
    setLoading(true);
    client
      .get('/api/housing-projects')
      .then(({ data }) => setProjects(data.data))
      .catch(() => setError('Could not load housing projects.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadProjects, []);

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
      <div className="page-header">
        <h1>Housing Projects</h1>
        {canManage && (
          <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ward">Ward</label>
            <input
              id="ward"
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="district">District</label>
            <input
              id="district"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create project'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : projects.length === 0 ? (
        <p className="hint-text">No housing projects yet.</p>
      ) : (
        projects.map((project) => (
          <div className="card" key={project.id}>
            <div className="page-header">
              <div>
                <h3>
                  <Link to={`/housing-projects/${project.id}`}>{project.name}</Link>
                </h3>
                <p className="hint-text">
                  {[project.ward, project.district].filter(Boolean).join(', ') || 'No location set'}
                </p>
              </div>
              <span className={`badge status-${project.status}`}>{project.status}</span>
            </div>
            {project.description && <p>{project.description}</p>}
          </div>
        ))
      )}
    </div>
  );
}
