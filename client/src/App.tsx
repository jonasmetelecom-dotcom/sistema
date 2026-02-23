import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import DashboardHome from './pages/DashboardHome';
import ProjectsList from './pages/ProjectsList';
import NewProject from './pages/NewProject';
import Map from './components/Map/Map';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import Tenants from './pages/Tenants';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MonitoringLayout from './layouts/MonitoringLayout';
import MonitoringMap from './components/Monitoring/MonitoringMap';
import EquipmentsPage from './pages/monitoring/EquipmentsPage';
import AlarmsPage from './pages/monitoring/AlarmsPage';
import OltDetailsPage from './pages/OltDetailsPage';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';

import AuditLogPage from './pages/monitoring/AuditLogPage';
import ReportsPage from './pages/monitoring/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PrivateRoute />}>
            <Route path="/monitoring" element={<MonitoringLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MonitoringMap />} />
              <Route path="equipments" element={<EquipmentsPage />} />
              <Route path="olts/:id" element={<OltDetailsPage />} />
              <Route path="alarms" element={<AlarmsPage />} />

              <Route path="reports" element={<ReportsPage />} />
            </Route>

            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/new" element={<NewProject />} />
              <Route path="map" element={<Map />} />
              <Route path="users" element={<Users />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="settings" element={<Settings />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
              <Route path="admin/tenants" element={<SuperAdminDashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
