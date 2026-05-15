import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const nav = useNavigate();

  const handleLogout = async () => { await logout(); nav('/login'); };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/full_logo.png" alt="DashCaf" className="header-logo-img"
            onError={e => { e.target.style.display='none'; }} />
          <span className="header-logo-text" style={{ display: 'none' }}>
            Dash<span>Caf</span>
          </span>
        </Link>
        <nav className="header-nav">
          {user ? (
            <>
              <Link to="/orders" className="header-link">My Orders</Link>
              <Link to="/profile" className="header-link">Profile</Link>
              <Link to="/support" className="header-link">Support</Link>
              <Link to="/cart" className="header-cart">
                🛒 Cart
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
              <button className="btn btn-sm btn-outline" style={{ marginLeft: 8 }} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline">Log In</Link>
              <Link to="/register" className="btn btn-sm btn-orange" style={{ marginLeft: 8 }}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
