import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { nav('/'); return null; }

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(form.email, form.password); nav('/'); }
    catch (err) { setError(err?.response?.data?.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img
            src="/full_logo.png"
            alt="DashCaf"
            className="auth-logo-img"
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div className="auth-logo" style={{ display: 'none' }}>
            Dash<span>Caf</span>
          </div>
        </div>
        <h2 className="auth-title">Welcome back 👋</h2>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@university.ac.za"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && (
            <div style={{
              background: '#FFEBEB', color: 'var(--red)', borderRadius: 'var(--radius)',
              padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16
            }}>
              ⚠ {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-orange btn-full btn-lg"
            style={{ marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="auth-alt">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
