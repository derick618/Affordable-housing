import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HousingProjects from './pages/HousingProjects';
import HousingProjectDetail from './pages/HousingProjectDetail';
import Applications from './pages/Applications';
import Allocations from './pages/Allocations';

function Home() {
  const { user } = useAuth();
  return user.role === 'applicant' ? <Navigate to="/applications" replace /> : <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/housing-projects" element={<HousingProjects />} />
          <Route path="/housing-projects/:id" element={<HousingProjectDetail />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/allocations" element={<Allocations />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
