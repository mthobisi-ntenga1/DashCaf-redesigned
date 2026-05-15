import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DeliveryLayout from './components/layout/DeliveryLayout';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import AvailableOrdersPage from './components/pages/AvailableOrdersPage';
import ActiveDeliveryPage from './components/pages/ActiveDeliveryPage';
import EarningsPage from './components/pages/EarningsPage';
import ProfilePage from './components/pages/ProfilePage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="empty-state" style={{ marginTop: 120 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth><DeliveryLayout /></RequireAuth>}>
          <Route path="/available" element={<AvailableOrdersPage />} />
          <Route path="/active" element={<ActiveDeliveryPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/available" replace />} />
      </Routes>
    </AuthProvider>
  );
}
