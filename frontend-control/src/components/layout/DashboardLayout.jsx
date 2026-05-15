import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

const NAV = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/stores', label: 'Stores', roles: ['SENIOR_ADMIN', 'CHIEF_ADMIN'] },
  { to: '/customers', label: 'Customers', roles: ['ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN'] },
  { to: '/delivery', label: 'Delivery Workers', roles: ['ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN'] },
  { to: '/locations', label: 'Locations', roles: ['ADMIN_OFFICER', 'SENIOR_ADMIN', 'CHIEF_ADMIN'] },
  { to: '/support', label: 'Support Inbox', roles: ['CHIEF_ADMIN'] },
  { to: '/footer', label: 'Footer Config', roles: ['SENIOR_ADMIN', 'CHIEF_ADMIN'] },
  { to: '/admins', label: 'Admin Accounts', roles: ['CHIEF_ADMIN'] },
  { to: '/audit', label: 'Audit Logs', roles: ['CHIEF_ADMIN'] },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleNav = NAV.filter(
    (n) => !n.roles || n.roles.includes(user?.role),
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">DashCaf</span>
          <span className="logo-sub">Control</span>
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
