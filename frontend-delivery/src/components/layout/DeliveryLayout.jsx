import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/available', label: '📋 Orders', short: 'Orders' },
  { to: '/active', label: '🚴 Active', short: 'Active' },
  { to: '/earnings', label: '💰 Earnings', short: 'Earnings' },
  { to: '/profile', label: '👤 Profile', short: 'Profile' },
];

export default function DeliveryLayout() {
  const { logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => { await logout(); nav('/login'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-50)' }}>
      <header className="site-header">
        <div className="header-inner">
          <div className="header-logo">
            <img src="/full_logo.png" alt="DashCaf" className="header-logo-img"
              onError={e => { e.target.style.display='none'; }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span className="header-logo-text" style={{ fontSize: 18 }}>
                Dash<span>Caf</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Delivery
              </span>
            </div>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {TABS.map(t => (
              <NavLink
                key={t.to}
                to={t.to}
                style={({ isActive }) => ({
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--orange)' : 'var(--gray-500)',
                  background: isActive ? 'var(--orange-pale)' : 'transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                })}
              >
                {t.label}
              </NavLink>
            ))}
            <button
              className="btn btn-sm btn-outline"
              style={{ marginLeft: 8 }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
