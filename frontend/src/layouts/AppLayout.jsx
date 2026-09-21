import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { ArrowLeftIcon, CloseIcon, LogoutIcon, MenuIcon } from '../components/icons';

const ROLE_LABELS = {
  applicant: 'Applicant',
  housing_officer: 'Housing Officer',
  super_admin: 'Super Admin',
  auditor: 'Auditor',
};

function navLinkClass({ isActive }) {
  return [
    'flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
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

function SidebarContent({ user, logout }) {
  const canSeeDashboard = user.role !== 'applicant';

  return (
    <>
      <div className="mb-6 px-1">
        <Logo />
      </div>

      <Link
        to="/properties"
        className="mb-3 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Browse homes
      </Link>

      <div className="flex flex-col gap-1">
        {canSeeDashboard && (
          <NavLink to="/dashboard" end className={navLinkClass}>
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
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white dark:bg-brand-600">
          {initials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900 dark:text-white">{user.name}</div>
          <div className="truncate text-xs text-stone-500 dark:text-stone-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          title="Log out"
          aria-label="Log out"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const isStaff = user.role === 'housing_officer' || user.role === 'super_admin';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer after navigating.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95">
        <Logo />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-stone-950/50" onClick={() => setDrawerOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white p-4 shadow-2xl dark:bg-stone-950">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent user={user} logout={logout} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-stone-200 bg-white p-4 md:flex dark:border-stone-800 dark:bg-stone-950">
        <SidebarContent user={user} logout={logout} />
      </nav>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet context={{ user, isStaff }} />
        </div>
      </main>
    </div>
  );
}
