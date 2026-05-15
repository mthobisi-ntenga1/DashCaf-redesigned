import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StoreLayout from './components/layout/StoreLayout';
import LoginPage from './components/pages/LoginPage';
import KitchenPage from './components/pages/KitchenPage';
import FrontDeskPage from './components/pages/FrontDeskPage';
import MenuPage from './components/pages/MenuPage';
import StaffPage from './components/pages/StaffPage';
import OrderHistoryPage from './components/pages/OrderHistoryPage';
import WorkerProfilePage from './components/pages/WorkerProfilePage';

const WORKER_ROLES = ['KITCHEN', 'FRONT'];
const ADMIN_ROLES = ['ADMIN_OFFICER', 'SENIOR_ADMIN', 'OWNER'];

function RequireAuth({ children, adminOnly }) {
  const { user, store } = useAuth();
  if (user === undefined) return <div className="empty-state" style={{ marginTop: 80 }}>Loading…</div>;
  if (!user || !store) return <Navigate to="/login" replace />;
  if (adminOnly && WORKER_ROLES.includes(user.role)) {
    return <Navigate to={`/store/${store.slug}/profile`} replace />;
  }
  return children;
}

function DefaultRedirect() {
  const { user, store } = useAuth();
  if (user === undefined) return null; // still loading
  if (!user || !store) return <Navigate to="/login" replace />;
  if (WORKER_ROLES.includes(user.role)) return <Navigate to={`/store/${store.slug}/profile`} replace />;
  return <Navigate to={`/store/${store.slug}/kitchen`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/store/:slug" element={<RequireAuth><StoreLayout /></RequireAuth>}>
          <Route index element={<DefaultRedirect />} />
          {/* Worker personal profile — accessible to all roles */}
          <Route path="profile" element={<WorkerProfilePage />} />
          {/* Shared station screens — admin/owner stays logged in here */}
          <Route path="kitchen" element={<KitchenPage />} />
          <Route path="front" element={<FrontDeskPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          {/* Admin-only sections */}
          <Route path="menu" element={<RequireAuth adminOnly><MenuPage /></RequireAuth>} />
          <Route path="staff" element={<RequireAuth adminOnly><StaffPage /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
