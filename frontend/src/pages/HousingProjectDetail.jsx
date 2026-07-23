import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const emptyUnitForm = {
  unit_number: '',
  block: '',
  floor: '',
  bedrooms: 1,
  size_sqm: '',
  ownership_type: 'sale',
  price: '',
  status: 'available',
};

export default function HousingProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user.role === 'housing_officer' || user.role === 'super_admin';

  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);
  const [submitting, setSubmitting] = useState(false);

  function loadProject() {
    client
      .get(`/api/housing-projects/${id}`)
      .then(({ data }) => setProject(data.data))
      .catch(() => setError('Could not load this housing project.'));
  }

  useEffect(loadProject, [id]);

  async function handleAddUnit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.post(`/api/housing-projects/${id}/units`, unitForm);
      setUnitForm(emptyUnitForm);
      setShowUnitForm(false);
      loadProject();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not add unit.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm('Delete this housing project? This cannot be undone.')) return;
    try {
      await client.delete(`/api/housing-projects/${id}`);
      navigate('/housing-projects');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete project.');
    }
  }

  if (error && !project) return <p className="error-text">{error}</p>;
  if (!project) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p className="hint-text">
            {[project.ward, project.district].filter(Boolean).join(', ') || 'No location set'}
          </p>
        </div>
        <span className={`badge status-${project.status}`}>{project.status}</span>
      </div>

      {project.description && <p>{project.description}</p>}

      {error && <p className="error-text">{error}</p>}

      <div className="page-header" style={{ marginTop: 24 }}>
        <h2>Units</h2>
        {canManage && (
          <button type="button" className="primary" onClick={() => setShowUnitForm((v) => !v)}>
            {showUnitForm ? 'Cancel' : 'Add Unit'}
          </button>
        )}
      </div>

      {showUnitForm && (
        <form className="card" onSubmit={handleAddUnit}>
          <div className="field">
            <label htmlFor="unit_number">Unit number</label>
            <input
              id="unit_number"
              required
              value={unitForm.unit_number}
              onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="block">Block</label>
            <input
              id="block"
              value={unitForm.block}
              onChange={(e) => setUnitForm({ ...unitForm, block: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              type="number"
              min="0"
              required
              value={unitForm.bedrooms}
              onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="size_sqm">Size (sqm)</label>
            <input
              id="size_sqm"
              type="number"
              step="0.01"
              value={unitForm.size_sqm}
              onChange={(e) => setUnitForm({ ...unitForm, size_sqm: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="ownership_type">Ownership type</label>
            <select
              id="ownership_type"
              value={unitForm.ownership_type}
              onChange={(e) => setUnitForm({ ...unitForm, ownership_type: e.target.value })}
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="price">Price (TZS)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              required
              value={unitForm.price}
              onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })}
            />
          </div>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add unit'}
          </button>
        </form>
      )}

      {project.units.length === 0 ? (
        <p className="hint-text">No units added yet.</p>
      ) : (
        project.units.map((unit) => (
          <div className="card" key={unit.id}>
            <div className="page-header">
              <div>
                <strong>Unit {unit.unit_number}</strong>
                {unit.block && <span className="hint-text"> · Block {unit.block}</span>}
                <p className="hint-text">
                  {unit.bedrooms} bed · {unit.ownership_type} · TZS {Number(unit.price).toLocaleString()}
                </p>
              </div>
              <span className={`badge status-${unit.status}`}>{unit.status}</span>
            </div>
          </div>
        ))
      )}

      {user.role === 'super_admin' && (
        <button type="button" onClick={handleDeleteProject} style={{ marginTop: 24 }}>
          Delete project
        </button>
      )}
    </div>
  );
}
