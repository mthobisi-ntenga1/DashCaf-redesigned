import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLOR = {
  KITCHEN: '#f59e0b',
  FRONT: '#10b981',
  ADMIN_OFFICER: '#6366f1',
  SENIOR_ADMIN: '#3b82f6',
};

const ROLE_LABEL = {
  KITCHEN: 'Kitchen',
  FRONT: 'Front Desk',
  ADMIN_OFFICER: 'Admin Officer',
  SENIOR_ADMIN: 'Senior Admin',
};

export default function StaffPage() {
  const { store } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'KITCHEN', password: '' });
  const [addError, setAddError] = useState('');

  // PIN reset state
  const [resettingPin, setResettingPin] = useState(null); // staffId
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const load = () => {
    api.get(`/stores/${store?.slug}/staff`)
      .then(({ data }) => setStaff(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (store) load(); }, [store]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      await api.post(`/stores/${store.slug}/staff`, form);
      setForm({ email: '', name: '', role: 'KITCHEN', password: '' });
      setShowAdd(false);
      load();
    } catch (err) {
      setAddError(err?.response?.data?.message || 'Could not create staff member.');
    }
  };

  const suspend = async (id) => {
    await api.patch(`/stores/${store.slug}/staff/${id}/suspend`);
    load();
  };

  const reactivate = async (id) => {
    await api.patch(`/stores/${store.slug}/staff/${id}/reactivate`);
    load();
  };

  const handleResetPin = async (id) => {
    setPinError('');
    setPinSuccess('');
    if (!/^\d{4,6}$/.test(newPin)) { setPinError('PIN must be 4–6 digits.'); return; }
    try {
      await api.patch(`/stores/${store.slug}/staff/${id}/reset-pin`, { pin: newPin });
      setPinSuccess('PIN updated.');
      setResettingPin(null);
      setNewPin('');
      load();
    } catch (err) {
      setPinError(err?.response?.data?.message || 'Could not update PIN.');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          + Add Team Member
        </button>
      </div>

      {/* Add staff form */}
      {showAdd && (
        <form className="card" style={{ marginBottom: 24 }} onSubmit={handleAdd}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Team Member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['name', 'Full Name', 'text'], ['email', 'Email', 'email'], ['password', 'Temporary Password', 'password']].map(([k, l, t]) => (
              <div key={k} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{l}</label>
                <input
                  type={t} className="form-input"
                  value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                  required
                />
              </div>
            ))}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="KITCHEN">Kitchen</option>
                <option value="FRONT">Front Desk</option>
                <option value="ADMIN_OFFICER">Admin Officer</option>
              </select>
            </div>
          </div>
          {addError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{addError}</p>}
          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 10 }}>
            The team member will log in with these credentials and set their own station PIN from their profile.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" className="btn btn-primary btn-sm">Create Account</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Staff profile cards */}
      {loading ? (
        <div className="empty-state">Loading team…</div>
      ) : staff.length === 0 ? (
        <div className="empty-state">No team members yet. Add your first one above.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {staff.map(s => {
            const color = ROLE_COLOR[s.role] || '#6b7280';
            const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const isActive = s.status === 'ACTIVE';
            const hasPin = !!s.pinSetAt;

            return (
              <div key={s.id} className="card" style={{ opacity: isActive ? 1 : 0.65 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff',
                  }}>
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{s.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{s.email}</p>
                      </div>
                      <span style={{
                        background: isActive ? '#dcfce7' : '#fee2e2',
                        color: isActive ? '#166534' : '#991b1b',
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      }}>
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{
                        background: color + '22', color, fontSize: 11, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}44`,
                      }}>
                        {ROLE_LABEL[s.role] || s.role}
                      </span>
                      <span style={{
                        background: hasPin ? '#f0fdf4' : '#fff7ed',
                        color: hasPin ? '#16a34a' : '#c2410c',
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        border: `1px solid ${hasPin ? '#bbf7d0' : '#fed7aa'}`,
                      }}>
                        {hasPin ? '● PIN set' : '○ No PIN'}
                      </span>
                    </div>

                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 12 }}>
                      Joined {new Date(s.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {isActive
                        ? <button className="btn btn-sm btn-danger" onClick={() => suspend(s.id)}>Suspend</button>
                        : <button className="btn btn-sm btn-primary" onClick={() => reactivate(s.id)}>Reactivate</button>
                      }
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setResettingPin(resettingPin === s.id ? null : s.id);
                          setNewPin(''); setPinError(''); setPinSuccess('');
                        }}
                      >
                        {hasPin ? 'Reset PIN' : 'Set PIN'}
                      </button>
                    </div>

                    {/* Inline PIN reset form */}
                    {resettingPin === s.id && (
                      <div style={{ marginTop: 12, padding: '12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
                          Set a new 4–6 digit PIN for {s.name}. Share it with them directly.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="password" inputMode="numeric" maxLength={6}
                            className="form-input" style={{ flex: 1, margin: 0 }}
                            placeholder="New PIN"
                            value={newPin} onChange={e => setNewPin(e.target.value)}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleResetPin(s.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setResettingPin(null)}
                          >
                            ✕
                          </button>
                        </div>
                        {pinError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{pinError}</p>}
                        {pinSuccess && <p style={{ color: '#16a34a', fontSize: 12, marginTop: 6 }}>{pinSuccess}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
