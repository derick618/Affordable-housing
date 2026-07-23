import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

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
    <form className="card" onSubmit={handleSubmit}>
      <h3>Offer a unit</h3>
      <div className="field">
        <label htmlFor="application">Approved application</label>
        <select
          id="application"
          required
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
      <div className="field">
        <label htmlFor="project">Housing project</label>
        <select id="project" required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Select…</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="unit">Available unit</label>
        <select id="unit" required value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">Select…</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              Unit {unit.unit_number} · {unit.bedrooms} bed
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="primary" disabled={submitting}>
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
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button type="button" className="primary" disabled={submitting} onClick={() => respond('accept')}>
        Accept
      </button>
      <button type="button" disabled={submitting} onClick={() => respond('decline')}>
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
      <form onSubmit={confirm} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
        <div className="field">
          <label htmlFor={`move-in-${allocation.id}`}>Move-in date (optional)</label>
          <input
            id={`move-in-${allocation.id}`}
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
          />
        </div>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Confirming…' : 'Confirm'}
        </button>
        <button type="button" disabled={submitting} onClick={() => setShowConfirmForm(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      {allocation.status === 'accepted' && (
        <button type="button" className="primary" disabled={submitting} onClick={() => setShowConfirmForm(true)}>
          Confirm move-in
        </button>
      )}
      {['offered', 'accepted'].includes(allocation.status) && (
        <button type="button" disabled={submitting} onClick={cancel}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function loadAllocations() {
    setLoading(true);
    client
      .get('/api/allocations')
      .then(({ data }) => setAllocations(data.data))
      .catch(() => setError('Could not load allocations.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadAllocations, []);

  return (
    <div>
      <div className="page-header">
        <h1>{isApplicant ? 'My Allocation' : 'Allocations'}</h1>
        {canManage && (
          <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Offer a Unit'}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <AllocationForm
          onCreated={() => {
            setShowForm(false);
            loadAllocations();
          }}
        />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : allocations.length === 0 ? (
        <p className="hint-text">No allocations yet.</p>
      ) : (
        allocations.map((allocation) => (
          <div className="card" key={allocation.id}>
            <div className="page-header">
              <div>
                <strong>Unit {allocation.unit?.unit_number}</strong>
                <p className="hint-text">
                  {allocation.unit?.bedrooms} bed · {allocation.unit?.housing_project_name}
                </p>
                {allocation.move_in_date && (
                  <p className="hint-text">
                    Move-in: {new Date(allocation.move_in_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className={`badge status-${allocation.status}`}>{allocation.status}</span>
            </div>

            {isApplicant && <ApplicantActions allocation={allocation} onUpdated={loadAllocations} />}
            {canManage && <StaffActions allocation={allocation} onUpdated={loadAllocations} />}
          </div>
        ))
      )}
    </div>
  );
}
