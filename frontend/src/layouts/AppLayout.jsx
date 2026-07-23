import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  applicant: 'Applicant',
  housing_officer: 'Housing Officer',
  super_admin: 'Super Admin',
  auditor: 'Auditor',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const isStaff = user.role === 'housing_officer' || user.role === 'super_admin';
  const canSeeDashboard = user.role !== 'applicant';

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav__brand">Affordable Housing</div>

        {canSeeDashboard && <NavLink to="/">Dashboard</NavLink>}
        <NavLink to="/housing-projects">Housing Projects</NavLink>
        <NavLink to="/applications">
          {user.role === 'applicant' ? 'My Applications' : 'Applications'}
        </NavLink>
        <NavLink to="/allocations">
          {user.role === 'applicant' ? 'My Allocation' : 'Allocations'}
        </NavLink>

        <div className="app-nav__user">
          <div>{user.name}</div>
          <div className="hint-text">{ROLE_LABELS[user.role] ?? user.role}</div>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </nav>

      <main className="app-main">
        <Outlet context={{ user, isStaff }} />
      </main>
    </div>
  );
}
