import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { nav('/'); return null; }

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await register(form.name, form.email, form.password); nav('/'); }
    catch (err) { setError(err?.response?.data?.message || 'Registration failed.'); }
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
        <h2 className="auth-title">Create your account 🎓</h2>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@university.ac.za"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create a password"
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
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
