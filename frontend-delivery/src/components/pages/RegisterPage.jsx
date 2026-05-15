import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/delivery-users/register', form);
      nav('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">DashCaf</div>
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: 24, fontSize: 14 }}>Delivery Registration</p>
        <form onSubmit={handle}>
          {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['password', 'Password', 'password']].map(([k, l, t]) => (
            <div key={k} className="form-group">
              <label className="form-label">{l}</label>
              <input type={t} className="form-input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>Your application will be reviewed by an admin before you can accept orders.</p>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Submitting…' : 'Apply to Deliver'}</button>
        </form>
        <p className="auth-alt">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
