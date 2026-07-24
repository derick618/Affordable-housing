import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { statusBadgeClass } from '../utils/statusBadge';
import HouseRow from '../components/illustrations/HouseRow';

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
    <form className="card mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
      <h3 className="text-base font-semibold text-stone-900 sm:col-span-2 dark:text-white">
        Apply for housing
      </h3>
      <div className="sm:col-span-2">
        <label htmlFor="housing_project_id" className="field-label">Preferred project (optional)</label>
        <select
          id="housing_project_id"
          className="field-input"
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
      <div>
        <label htmlFor="household_size" className="field-label">Household size</label>
        <input
          id="household_size"
          type="number"
          min="1"
          required
          className="field-input"
          value={form.household_size}
          onChange={(e) => setForm({ ...form, household_size: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="monthly_income" className="field-label">Monthly income (TZS)</label>
        <input
          id="monthly_income"
          type="number"
          min="0"
          required
          className="field-input"
          value={form.monthly_income}
          onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="employment_status" className="field-label">Employment status</label>
        <input
          id="employment_status"
          className="field-input"
          value={form.employment_status}
          onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="preferred_bedrooms" className="field-label">Preferred bedrooms</label>
        <input
          id="preferred_bedrooms"
          type="number"
          min="0"
          className="field-input"
          value={form.preferred_bedrooms}
          onChange={(e) => setForm({ ...form, preferred_bedrooms: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-rose-600 sm:col-span-2 dark:text-rose-400">{error}</p>}
      <button type="submit" className="btn btn-primary sm:col-span-2 sm:w-fit" disabled={submitting}>
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
      <form onSubmit={handleReject} className="mt-3">
        <label htmlFor={`reject-reason-${application.id}`} className="field-label">
          Reason for rejection
        </label>
        <textarea
          id={`reject-reason-${application.id}`}
          required
          className="field-input"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Rejecting…' : 'Confirm rejection'}
          </button>
          <button type="button" className="btn" disabled={submitting} onClick={() => setShowRejectForm(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="btn" disabled={submitting} onClick={() => review('under_review')}>
        Mark under review
      </button>
      <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => review('approved')}>
        Approve
      </button>
      <button type="button" className="btn" disabled={submitting} onClick={() => review('waitlisted')}>
        Waitlist
      </button>
      <button
        type="button"
        className="btn text-rose-600 dark:text-rose-400"
        disabled={submitting}
        onClick={() => setShowRejectForm(true)}
      >
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
          {isApplicant ? 'My Applications' : 'Applications'}
        </h1>
        {isApplicant && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {showForm && (
        <ApplicationForm
          onCreated={() => {
            setShowForm(false);
            loadApplications();
          }}
        />
      )}

      {loading ? (
        <p className="text-stone-500 dark:text-stone-400">Loading…</p>
      ) : applications.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-center">
          <HouseRow className="mb-4 h-28 w-full max-w-xs text-stone-300 dark:text-stone-700" />
          <p className="text-stone-500 dark:text-stone-400">No applications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <div className="card" key={application.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {!isApplicant && (
                    <div className="font-semibold text-stone-900 dark:text-white">
                      {application.applicant_name}
                    </div>
                  )}
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {application.household_size} people · TZS{' '}
                    {Number(application.monthly_income).toLocaleString()}/mo
                    {application.housing_project_name && ` · ${application.housing_project_name}`}
                  </p>
                </div>
                <span className={statusBadgeClass(application.status)}>{application.status}</span>
              </div>

              {application.status === 'rejected' && application.rejection_reason && (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  Reason: {application.rejection_reason}
                </p>
              )}

              {isApplicant && ['pending', 'under_review'].includes(application.status) && (
                <button type="button" className="btn mt-3" onClick={() => handleWithdraw(application.id)}>
                  Withdraw
                </button>
              )}

              {canReview && <ReviewControls application={application} onReviewed={loadApplications} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
