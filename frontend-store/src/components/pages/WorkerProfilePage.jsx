import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function WorkerProfilePage() {
  const { user, store, logout } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // PIN management state
  const [pinMode, setPinMode] = useState(null); // null | 'set' | 'change'
  const [pinForm, setPinForm] = useState({ pin: '', confirm: '' });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (!store) return;
    api.get(`/stores/${store.slug}/staff/me`)
      .then(({ data }) => setProfile(data))
      .finally(() => setLoading(false));
  }, [store]);

  const handleSetPin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    if (pinForm.pin !== pinForm.confirm) { setPinError('PINs do not match.'); return; }
    if (!/^\d{4,6}$/.test(pinForm.pin)) { setPinError('PIN must be 4–6 digits.'); return; }
    setSavingPin(true);
    try {
      await api.patch(`/stores/${store.slug}/staff/me/set-pin`, { pin: pinForm.pin });
      setPinSuccess('PIN set successfully.');
      setPinForm({ pin: '', confirm: '' });
      setPinMode(null);
      setProfile(p => ({ ...p, pinSetAt: new Date().toISOString() }));
    } catch (err) {
      setPinError(err?.response?.data?.message || 'Could not set PIN.');
    } finally {
      setSavingPin(false);
    }
  };

  const handleLogout = async () => { await logout(); nav('/login'); };

  if (loading) return <div className="empty-state" style={{ marginTop: 80 }}>Loading profile…</div>;

  const roleColor = ROLE_COLOR[user?.role] || '#6b7280';
  const initials = (profile?.name || user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hasPin = !!profile?.pinSetAt;

  return (
    <div style={{ maxWidth: 540, margin: '48px auto', padding: '0 20px' }}>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: roleColor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{profile?.name}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: roleColor + '22', color: roleColor,
                fontSize: 12, fontWeight: 600, padding: '3px 10px',
                borderRadius: 20, border: `1px solid ${roleColor}44`,
              }}>
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
              <span style={{
                background: profile?.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                color: profile?.status === 'ACTIVE' ? '#166534' : '#991b1b',
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              }}>
                {profile?.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InfoRow label="Email" value={profile?.email} />
          <InfoRow label="Store" value={store?.name} />
          <InfoRow
            label="Member since"
            value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          />
          <InfoRow
            label="Station PIN"
            value={hasPin ? '●●●● set' : 'Not set'}
            valueStyle={{ color: hasPin ? '#16a34a' : '#dc2626', fontWeight: 600 }}
          />
        </div>
      </div>

      {/* PIN management */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Station PIN</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0 }}>
              {hasPin
                ? 'Your PIN is set. Use it to check in on the kitchen or front desk screen.'
                : 'Set a 4–6 digit PIN so you can check in on the shared station screen.'}
            </p>
          </div>
          {!pinMode && (
            <button className="btn btn-primary btn-sm" onClick={() => setPinMode('set')}>
              {hasPin ? 'Change PIN' : 'Set PIN'}
            </button>
          )}
        </div>

        {pinMode && (
          <form onSubmit={handleSetPin} style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">New PIN</label>
                <input
                  type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6}
                  className="form-input" placeholder="4–6 digits"
                  value={pinForm.pin} onChange={e => setPinForm({ ...pinForm, pin: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Confirm PIN</label>
                <input
                  type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6}
                  className="form-input" placeholder="Repeat PIN"
                  value={pinForm.confirm} onChange={e => setPinForm({ ...pinForm, confirm: e.target.value })}
                  required
                />
              </div>
            </div>
            {pinError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{pinError}</p>}
            {pinSuccess && <p style={{ color: '#16a34a', fontSize: 13, marginTop: 8 }}>{pinSuccess}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingPin}>
                {savingPin ? 'Saving…' : 'Save PIN'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setPinMode(null); setPinForm({ pin: '', confirm: '' }); setPinError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* How it works info box */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#0c4a6e', margin: 0, lineHeight: 1.6 }}>
          <strong>How station check-in works:</strong> The kitchen and front desk each have a shared screen that stays on all day.
          At the start of your shift, tap "Check In" on that screen and enter your PIN — the system will know you're on station.
          You don't need to log in or log out of anything on that screen.
        </p>
      </div>

      <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
        Sign out
      </button>
    </div>
  );
}

function InfoRow({ label, value, valueStyle = {} }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, ...valueStyle }}>{value || '—'}</p>
    </div>
  );
}
