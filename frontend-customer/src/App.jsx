import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import HomePage from './components/pages/HomePage';
import StoreMenuPage from './components/pages/StoreMenuPage';
import CartPage from './components/pages/CartPage';
import CheckoutPage from './components/pages/CheckoutPage';
import OrderTrackingPage from './components/pages/OrderTrackingPage';
import OrderHistoryPage from './components/pages/OrderHistoryPage';
import ProfilePage from './components/pages/ProfilePage';
import SupportPage from './components/pages/SupportPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="empty-state" style={{ marginTop: 120 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/stores/:slug" element={<StoreMenuPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
            <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderTrackingPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
