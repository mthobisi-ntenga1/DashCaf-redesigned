import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.patch('/customers/me', form); await fetchMe(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    try {
      await api.post('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) { setPwError(err?.response?.data?.message || 'Password change failed.'); }
  };

  return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 520 }}>
      <h1 className="page-title">My Profile</h1>
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Account Details</h3>
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            {saved && <span style={{ color: 'var(--green)', fontSize: 14 }}>Saved!</span>}
          </div>
        </form>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Change Password</h3>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required />
          </div>
          {pwError && <p className="form-error">{pwError}</p>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary">Change Password</button>
            {pwSaved && <span style={{ color: 'var(--green)', fontSize: 14 }}>Updated!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
