import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, user, store } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ slug: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && store) { nav(`/store/${store.slug}`); return null; }

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.slug, form.email, form.password);
      nav(`/store/${form.slug}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">DashCaf</div>
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: 24, fontSize: 14 }}>Store Portal</p>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Store Slug</label>
            <input className="form-input" placeholder="e.g. campus-bites" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase() })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Logging in…' : 'Log In'}</button>
        </form>
      </div>
    </div>
  );
}
