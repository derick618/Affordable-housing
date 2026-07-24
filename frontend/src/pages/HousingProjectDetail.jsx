import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { statusBadgeClass } from '../utils/statusBadge';
import HouseIcon from '../components/illustrations/HouseIcon';

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

  if (error && !project) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (!project) return <p className="text-stone-500 dark:text-stone-400">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-start gap-5 overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="flex h-full w-28 shrink-0 items-center justify-center self-stretch bg-gradient-to-br from-amber-400 to-amber-600 py-6">
          <HouseIcon className="h-14 w-14 text-white/90" />
        </div>
        <div className="flex-1 py-5 pr-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-white">{project.name}</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {[project.ward, project.district].filter(Boolean).join(', ') || 'No location set'}
              </p>
            </div>
            <span className={statusBadgeClass(project.status)}>{project.status}</span>
          </div>
          {project.description && (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{project.description}</p>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Units</h2>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowUnitForm((v) => !v)}>
            {showUnitForm ? 'Cancel' : 'Add Unit'}
          </button>
        )}
      </div>

      {showUnitForm && (
        <form className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleAddUnit}>
          <div>
            <label htmlFor="unit_number" className="field-label">Unit number</label>
            <input
              id="unit_number"
              required
              className="field-input"
              value={unitForm.unit_number}
              onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="block" className="field-label">Block</label>
            <input
              id="block"
              className="field-input"
              value={unitForm.block}
              onChange={(e) => setUnitForm({ ...unitForm, block: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="bedrooms" className="field-label">Bedrooms</label>
            <input
              id="bedrooms"
              type="number"
              min="0"
              required
              className="field-input"
              value={unitForm.bedrooms}
              onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="size_sqm" className="field-label">Size (sqm)</label>
            <input
              id="size_sqm"
              type="number"
              step="0.01"
              className="field-input"
              value={unitForm.size_sqm}
              onChange={(e) => setUnitForm({ ...unitForm, size_sqm: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="ownership_type" className="field-label">Ownership type</label>
            <select
              id="ownership_type"
              className="field-input"
              value={unitForm.ownership_type}
              onChange={(e) => setUnitForm({ ...unitForm, ownership_type: e.target.value })}
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </div>
          <div>
            <label htmlFor="price" className="field-label">Price (TZS)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              required
              className="field-input"
              value={unitForm.price}
              onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add unit'}
          </button>
        </form>
      )}

      {project.units.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">No units added yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {project.units.map((unit) => (
            <div className="card" key={unit.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-stone-900 dark:text-white">
                    Unit {unit.unit_number}
                    {unit.block && (
                      <span className="font-normal text-stone-500 dark:text-stone-400"> · Block {unit.block}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {unit.bedrooms} bed · {unit.ownership_type} · TZS {Number(unit.price).toLocaleString()}
                  </p>
                </div>
                <span className={statusBadgeClass(unit.status)}>{unit.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {user.role === 'super_admin' && (
        <button type="button" className="btn mt-8 text-rose-600 dark:text-rose-400" onClick={handleDeleteProject}>
          Delete project
        </button>
      )}
    </div>
  );
}
