import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HouseIcon from '../components/illustrations/HouseIcon';

const ROLE_LABELS = {
  applicant: 'Applicant',
  housing_officer: 'Housing Officer',
  super_admin: 'Super Admin',
  auditor: 'Auditor',
};

function navLinkClass({ isActive }) {
  return [
    'block rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
  ].join(' ');
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const isStaff = user.role === 'housing_officer' || user.role === 'super_admin';
  const canSeeDashboard = user.role !== 'applicant';

  return (
    <div className="flex min-h-svh">
      <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-stone-200 p-4 dark:border-stone-800">
        <div className="mb-6 flex items-center gap-2 px-2">
          <HouseIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-bold text-stone-900 dark:text-white">
            Affordable Housing
          </span>
        </div>

        {canSeeDashboard && (
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
        )}
        <NavLink to="/housing-projects" className={navLinkClass}>
          Housing Projects
        </NavLink>
        <NavLink to="/applications" className={navLinkClass}>
          {user.role === 'applicant' ? 'My Applications' : 'Applications'}
        </NavLink>
        <NavLink to="/allocations" className={navLinkClass}>
          {user.role === 'applicant' ? 'My Allocation' : 'Allocations'}
        </NavLink>
        {user.role === 'super_admin' && (
          <NavLink to="/users" className={navLinkClass}>
            Users
          </NavLink>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white dark:bg-amber-500">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-stone-900 dark:text-white">
              {user.name}
            </div>
            <div className="truncate text-xs text-stone-500 dark:text-stone-400">
              {ROLE_LABELS[user.role] ?? user.role}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 01-2-2V7a2 2 0 012-2h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet context={{ user, isStaff }} />
        </div>
      </main>
    </div>
  );
}
