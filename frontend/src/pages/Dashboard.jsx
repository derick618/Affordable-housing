import { useEffect, useState } from 'react';
import client from '../api/client';

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    client
      .get('/api/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <h3>Applications</h3>
      <div className="stat-grid">
        <StatTile label="Total" value={stats.applications.total} />
        <StatTile label="Pending" value={stats.applications.pending} />
        <StatTile label="Under review" value={stats.applications.under_review} />
        <StatTile label="Approved" value={stats.applications.approved} />
        <StatTile label="Rejected" value={stats.applications.rejected} />
        <StatTile label="Waitlisted" value={stats.applications.waitlisted} />
      </div>

      <h3>Units</h3>
      <div className="stat-grid">
        <StatTile label="Total" value={stats.units.total} />
        <StatTile label="Available" value={stats.units.available} />
        <StatTile label="Reserved" value={stats.units.reserved} />
        <StatTile label="Occupied" value={stats.units.occupied} />
        <StatTile label="Occupancy rate" value={`${stats.occupancy_rate}%`} />
      </div>

      <h3>Housing Projects</h3>
      <div className="stat-grid">
        <StatTile label="Total" value={stats.housing_projects.total} />
        <StatTile label="Planned" value={stats.housing_projects.planned} />
        <StatTile label="Ongoing" value={stats.housing_projects.ongoing} />
        <StatTile label="Completed" value={stats.housing_projects.completed} />
      </div>

      <h3>Recent Applications</h3>
      {stats.recent_applications.length === 0 && <p className="hint-text">No applications yet.</p>}
      {stats.recent_applications.map((application) => (
        <div className="card" key={application.id}>
          <strong>{application.applicant_name}</strong>{' '}
          <span className={`badge status-${application.status}`}>{application.status}</span>
        </div>
      ))}
    </div>
  );
}
