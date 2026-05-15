import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './components/pages/DashboardHome';
import StoresPage from './components/pages/StoresPage';
import CustomersPage from './components/pages/CustomersPage';
import DeliveryUsersPage from './components/pages/DeliveryUsersPage';
import LocationsPage from './components/pages/LocationsPage';
import AdminsPage from './components/pages/AdminsPage';
import SupportPage from './components/pages/SupportPage';
import FooterConfigPage from './components/pages/FooterConfigPage';
import AuditLogsPage from './components/pages/AuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="delivery" element={<DeliveryUsersPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="admins" element={
            <ProtectedRoute roles={['CHIEF_ADMIN']}>
              <AdminsPage />
            </ProtectedRoute>
          } />
          <Route path="support" element={
            <ProtectedRoute roles={['CHIEF_ADMIN']}>
              <SupportPage />
            </ProtectedRoute>
          } />
          <Route path="footer" element={
            <ProtectedRoute roles={['SENIOR_ADMIN', 'CHIEF_ADMIN']}>
              <FooterConfigPage />
            </ProtectedRoute>
          } />
          <Route path="audit" element={
            <ProtectedRoute roles={['CHIEF_ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
