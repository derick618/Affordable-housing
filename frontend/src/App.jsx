import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { USE_API } from './api/config';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Saved from './pages/Saved';
import MyBudget from './pages/MyBudget';
import Landlord from './pages/landlord/Landlord';
import ListingEditor from './pages/landlord/ListingEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HousingProjects from './pages/HousingProjects';
import HousingProjectDetail from './pages/HousingProjectDetail';
import Applications from './pages/Applications';
import Allocations from './pages/Allocations';
import Users from './pages/Users';

/** Renders its routes only when the marketplace is backed by the API (VITE_USE_API). */
function ApiOnly() {
  return USE_API ? <Outlet /> : <Navigate to="/" replace />;
}

/** Landing page inside the signed-in app: applicants go to their applications. */
function DashboardHome() {
  const { user } = useAuth();
  return user.role === 'applicant' ? <Navigate to="/applications" replace /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* Public marketplace */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/saved" element={<Saved />} />

        {/* Account tools on the marketplace. They need the API, so without it they go home. */}
        <Route element={<ApiOnly />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/my-budget" element={<MyBudget />} />
            <Route path="/landlord" element={<Landlord />} />
            <Route path="/landlord/listings/new" element={<ListingEditor />} />
            <Route path="/landlord/listings/:slug" element={<ListingEditor />} />
          </Route>
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Signed-in application & allocation management */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/housing-projects" element={<HousingProjects />} />
          <Route path="/housing-projects/:id" element={<HousingProjectDetail />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/allocations" element={<Allocations />} />

          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
