import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_NAV = {
  KITCHEN:        ['profile'],
  FRONT:          ['profile'],
  ADMIN_OFFICER:  ['kitchen', 'front', 'orders', 'menu', 'staff'],
  SENIOR_ADMIN:   ['kitchen', 'front', 'orders', 'menu', 'staff'],
  OWNER:          ['kitchen', 'front', 'orders', 'menu', 'staff'],
};

const NAV_LABELS = {
  profile:  'My Profile',
  kitchen:  'Kitchen',
  front:    'Front Desk',
  orders:   'Order History',
  menu:     'Menu',
  staff:    'Team',
};

const ROLE_LABEL = {
  KITCHEN:       'Kitchen',
  FRONT:         'Front Desk',
  ADMIN_OFFICER: 'Admin Officer',
  SENIOR_ADMIN:  'Senior Admin',
  OWNER:         'Owner',
};

export default function StoreLayout() {
  const { slug } = useParams();
  const { user, store, logout } = useAuth();
  const nav = useNavigate();

  const tabs = ROLE_NAV[user?.role] ?? ['kitchen'];
  const handleLogout = async () => { await logout(); nav('/login'); };

  return (
    <div className="store-shell">
      <header className="store-header">
        <div className="store-header-inner">
          <div className="store-header-brand">
            <span className="store-header-logo">DashCaf</span>
            <span className="store-header-name">{store?.name}</span>
          </div>
          <nav className="store-tabs">
            {tabs.map(t => (
              <NavLink
                key={t}
                to={`/store/${slug}/${t}`}
                className={({ isActive }) => `store-tab ${isActive ? 'active' : ''}`}
              >
                {NAV_LABELS[t]}
              </NavLink>
            ))}
          </nav>
          <div className="store-header-user">
            <span className="store-user-badge">{ROLE_LABEL[user?.role] ?? user?.role}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="store-main">
        <Outlet />
      </main>
    </div>
  );
}
