import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { statusBadgeClass } from '../utils/statusBadge';
import PropertyImage from '../components/PropertyImage';
import { projectImage } from '../utils/images';
import HouseRow from '../components/illustrations/HouseRow';
import Pagination from '../components/Pagination';

function AllocationForm({ onCreated }) {
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [applicationId, setApplicationId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .get('/api/applications', { params: { status: 'approved' } })
      .then(({ data }) => setApplications(data.data.filter((a) => !a.allocation?.id)));
    client.get('/api/housing-projects').then(({ data }) => setProjects(data.data));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      return;
    }
    client
      .get(`/api/housing-projects/${projectId}/units`)
      .then(({ data }) => setUnits(data.data.filter((u) => u.status === 'available')));
  }, [projectId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.post('/api/allocations', { application_id: applicationId, unit_id: unitId });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not create allocation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3" onSubmit={handleSubmit}>
      <h3 className="text-base font-semibold text-stone-900 sm:col-span-3 dark:text-white">
        Offer a unit
      </h3>
      <div>
        <label htmlFor="application" className="field-label">Approved application</label>
        <select
          id="application"
          required
          className="field-input"
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
        >
          <option value="">Select…</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.applicant_name} ({app.household_size} people)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="project" className="field-label">Housing project</label>
        <select
          id="project"
          required
          className="field-input"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select…</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="unit" className="field-label">Available unit</label>
        <select
          id="unit"
          required
          className="field-input"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          <option value="">Select…</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              Unit {unit.unit_number} · {unit.bedrooms} bed
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-rose-600 sm:col-span-3 dark:text-rose-400">{error}</p>}
      <button type="submit" className="btn btn-primary sm:col-span-3 sm:w-fit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Send offer'}
      </button>
    </form>
  );
}

function ApplicantActions({ allocation, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);

  async function respond(action) {
    setSubmitting(true);
    try {
      await client.patch(`/api/allocations/${allocation.id}/respond`, { action });
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  if (allocation.status !== 'offered') return null;

  return (
    <div className="mt-3 flex gap-2">
      <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => respond('accept')}>
        Accept
      </button>
      <button type="button" className="btn" disabled={submitting} onClick={() => respond('decline')}>
        Decline
      </button>
    </div>
  );
}

function StaffActions({ allocation, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [moveInDate, setMoveInDate] = useState('');

  async function confirm(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await client.patch(`/api/allocations/${allocation.id}/confirm`, {
        move_in_date: moveInDate || undefined,
      });
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel() {
    setSubmitting(true);
    try {
      await client.delete(`/api/allocations/${allocation.id}`);
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  if (showConfirmForm) {
    return (
      <form onSubmit={confirm} className="mt-3 flex items-end gap-2">
        <div>
          <label htmlFor={`move-in-${allocation.id}`} className="field-label">
            Move-in date (optional)
          </label>
          <input
            id={`move-in-${allocation.id}`}
            type="date"
            className="field-input"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Confirming…' : 'Confirm'}
        </button>
        <button type="button" className="btn" disabled={submitting} onClick={() => setShowConfirmForm(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      {allocation.status === 'accepted' && (
        <button
          type="button"
          className="btn btn-primary"
          disabled={submitting}
          onClick={() => setShowConfirmForm(true)}
        >
          Confirm move-in
        </button>
      )}
      {['offered', 'accepted'].includes(allocation.status) && (
        <button type="button" className="btn" disabled={submitting} onClick={cancel}>
          Cancel
        </button>
      )}
    </div>
  );
}

export default function Allocations() {
  const { user } = useAuth();
  const isApplicant = user.role === 'applicant';
  const canManage = user.role === 'housing_officer' || user.role === 'super_admin';

  const [allocations, setAllocations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function loadAllocations() {
    setLoading(true);
    client
      .get('/api/allocations', { params: { page } })
      .then(({ data }) => {
        setAllocations(data.data);
        setMeta(data.meta);
      })
      .catch(() => setError('Could not load allocations.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadAllocations, [page]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">
          {isApplicant ? 'My Allocation' : 'Allocations'}
        </h1>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Offer a Unit'}
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {showForm && (
        <AllocationForm
          onCreated={() => {
            setShowForm(false);
            loadAllocations();
          }}
        />
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      ) : allocations.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center">
          <HouseRow className="mb-4 h-28 w-full max-w-xs text-stone-300 dark:text-stone-700" />
          <p className="text-stone-500 dark:text-stone-400">No allocations yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allocations.map((allocation) => (
            <div className="card flex gap-4" key={allocation.id}>
              <PropertyImage
                src={projectImage(allocation.unit?.housing_project_id)}
                alt=""
                size="sm"
                sizes="96px"
                className="hidden h-20 w-24 shrink-0 rounded-xl sm:block"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-stone-900 dark:text-white">
                      Unit {allocation.unit?.unit_number}
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {allocation.unit?.bedrooms} bed · {allocation.unit?.housing_project_name}
                    </p>
                    {allocation.move_in_date && (
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        Move-in: {new Date(allocation.move_in_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={statusBadgeClass(allocation.status)}>{allocation.status}</span>
                </div>

                {isApplicant && <ApplicantActions allocation={allocation} onUpdated={loadAllocations} />}
                {canManage && <StaffActions allocation={allocation} onUpdated={loadAllocations} />}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
