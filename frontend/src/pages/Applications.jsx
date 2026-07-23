import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const emptyForm = {
  housing_project_id: '',
  household_size: 1,
  monthly_income: '',
  employment_status: '',
  preferred_bedrooms: '',
};

function ApplicationForm({ onCreated }) {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/api/housing-projects').then(({ data }) => setProjects(data.data));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await client.post('/api/applications', {
        ...form,
        housing_project_id: form.housing_project_id || null,
      });
      setForm(emptyForm);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>Apply for housing</h3>
      <div className="field">
        <label htmlFor="housing_project_id">Preferred project (optional)</label>
        <select
          id="housing_project_id"
          value={form.housing_project_id}
          onChange={(e) => setForm({ ...form, housing_project_id: e.target.value })}
        >
          <option value="">No preference</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="household_size">Household size</label>
        <input
          id="household_size"
          type="number"
          min="1"
          required
          value={form.household_size}
          onChange={(e) => setForm({ ...form, household_size: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="monthly_income">Monthly income (TZS)</label>
        <input
          id="monthly_income"
          type="number"
          min="0"
          required
          value={form.monthly_income}
          onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="employment_status">Employment status</label>
        <input
          id="employment_status"
          value={form.employment_status}
          onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="preferred_bedrooms">Preferred bedrooms</label>
        <input
          id="preferred_bedrooms"
          type="number"
          min="0"
          value={form.preferred_bedrooms}
          onChange={(e) => setForm({ ...form, preferred_bedrooms: e.target.value })}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}

function ReviewControls({ application, onReviewed }) {
  const [submitting, setSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  async function review(status, rejection_reason) {
    setSubmitting(true);
    try {
      await client.patch(`/api/applications/${application.id}/review`, { status, rejection_reason });
      onReviewed();
    } finally {
      setSubmitting(false);
    }
  }

  function handleReject(event) {
    event.preventDefault();
    review('rejected', rejectionReason);
  }

  if (!['pending', 'under_review'].includes(application.status)) return null;

  if (showRejectForm) {
    return (
      <form onSubmit={handleReject} style={{ marginTop: 8 }}>
        <div className="field">
          <label htmlFor={`reject-reason-${application.id}`}>Reason for rejection</label>
          <textarea
            id={`reject-reason-${application.id}`}
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Rejecting…' : 'Confirm rejection'}
          </button>
          <button type="button" disabled={submitting} onClick={() => setShowRejectForm(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button type="button" disabled={submitting} onClick={() => review('under_review')}>
        Mark under review
      </button>
      <button type="button" disabled={submitting} onClick={() => review('approved')}>
        Approve
      </button>
      <button type="button" disabled={submitting} onClick={() => review('waitlisted')}>
        Waitlist
      </button>
      <button type="button" disabled={submitting} onClick={() => setShowRejectForm(true)}>
        Reject
      </button>
    </div>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const isApplicant = user.role === 'applicant';
  const canReview = user.role === 'housing_officer' || user.role === 'super_admin';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function loadApplications() {
    setLoading(true);
    client
      .get('/api/applications')
      .then(({ data }) => setApplications(data.data))
      .catch(() => setError('Could not load applications.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadApplications, []);

  async function handleWithdraw(id) {
    await client.delete(`/api/applications/${id}`);
    loadApplications();
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isApplicant ? 'My Applications' : 'Applications'}</h1>
        {isApplicant && (
          <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <ApplicationForm
          onCreated={() => {
            setShowForm(false);
            loadApplications();
          }}
        />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : applications.length === 0 ? (
        <p className="hint-text">No applications yet.</p>
      ) : (
        applications.map((application) => (
          <div className="card" key={application.id}>
            <div className="page-header">
              <div>
                {!isApplicant && <strong>{application.applicant_name}</strong>}
                <p className="hint-text">
                  {application.household_size} people · TZS{' '}
                  {Number(application.monthly_income).toLocaleString()}/mo
                  {application.housing_project_name && ` · ${application.housing_project_name}`}
                </p>
              </div>
              <span className={`badge status-${application.status}`}>{application.status}</span>
            </div>

            {application.status === 'rejected' && application.rejection_reason && (
              <p className="hint-text">Reason: {application.rejection_reason}</p>
            )}

            {isApplicant && ['pending', 'under_review'].includes(application.status) && (
              <button type="button" onClick={() => handleWithdraw(application.id)}>
                Withdraw
              </button>
            )}

            {canReview && <ReviewControls application={application} onReviewed={loadApplications} />}
          </div>
        ))
      )}
    </div>
  );
}
