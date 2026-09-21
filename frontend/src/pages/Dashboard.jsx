import { useEffect, useState } from 'react';
import client from '../api/client';
import { statusBadgeClass } from '../utils/statusBadge';

function StatTile({ label, value, accent }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold ${accent ? 'text-brand-700 dark:text-brand-300' : 'text-stone-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-stone-500 dark:text-stone-400">{label}</div>
    </div>
  );
}

function StatSection({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </section>
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

  if (error) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (!stats) return <p className="text-stone-500 dark:text-stone-400">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Dashboard</h1>

      <StatSection title="Applications">
        <StatTile label="Total" value={stats.applications.total} />
        <StatTile label="Pending" value={stats.applications.pending} />
        <StatTile label="Under review" value={stats.applications.under_review} />
        <StatTile label="Approved" value={stats.applications.approved} accent />
        <StatTile label="Rejected" value={stats.applications.rejected} />
      </StatSection>

      <StatSection title="Units">
        <StatTile label="Total" value={stats.units.total} />
        <StatTile label="Available" value={stats.units.available} />
        <StatTile label="Reserved" value={stats.units.reserved} />
        <StatTile label="Occupied" value={stats.units.occupied} accent />
        <StatTile label="Occupancy rate" value={`${stats.occupancy_rate}%`} accent />
      </StatSection>

      <StatSection title="Housing Projects">
        <StatTile label="Total" value={stats.housing_projects.total} />
        <StatTile label="Planned" value={stats.housing_projects.planned} />
        <StatTile label="Ongoing" value={stats.housing_projects.ongoing} />
        <StatTile label="Completed" value={stats.housing_projects.completed} accent />
      </StatSection>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
          Recent Applications
        </h2>
        {stats.recent_applications.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No applications yet.</p>
        ) : (
          <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {stats.recent_applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-stone-900 dark:text-white">
                  {application.applicant_name}
                </span>
                <span className={statusBadgeClass(application.status)}>{application.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
