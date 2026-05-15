import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SupportPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/support', { ...form, submitterType: 'CUSTOMER' });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit ticket.');
    } finally { setLoading(false); }
  };

  return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 520 }}>
      <h1 className="page-title">Support</h1>
      {sent ? (
        <div className="card" style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: 'var(--navy)', fontWeight: 600 }}>Ticket submitted!</p>
          <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>We'll get back to you soon.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setSent(false); setForm({ subject: '', message: '' }); }}>Submit another</button>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-input" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
            </div>
            {!user && (
              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input type="email" className="form-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            )}
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting…' : 'Submit Ticket'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
