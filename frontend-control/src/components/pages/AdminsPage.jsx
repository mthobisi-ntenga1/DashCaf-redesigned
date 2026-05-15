import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', name: '', role: 'ADMIN_OFFICER', password: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/control-users'); setAdmins(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/control-users', form);
      setForm({ email: '', name: '', role: 'ADMIN_OFFICER', password: '' });
      setAdding(false);
      load();
    } catch (err) { setError(err?.response?.data?.message || 'Error creating admin.'); }
  };

  const suspend = async (id, reason) => {
    const r = reason || prompt('Suspension reason:');
    if (!r) return;
    await api.patch(`/control-users/${id}/suspend`, { reason: r });
    load();
  };

  const reactivate = async (id) => { await api.patch(`/control-users/${id}/reactivate`); load(); };

  const ROLE_BADGE = { CHIEF_ADMIN: 'badge-red', SENIOR_ADMIN: 'badge-blue', ADMIN_OFFICER: 'badge-gray' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Accounts</h1>
        <button className="btn btn-primary" onClick={() => setAdding(!adding)}>+ Add Admin</button>
      </div>
      {adding && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['email', 'Email', 'email'], ['name', 'Full Name', 'text'], ['password', 'Password', 'password']].map(([k, l, t]) => (
              <div key={k} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{l}</label>
                <input type={t} className="form-input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN_OFFICER">Admin Officer</option>
                <option value="SENIOR_ADMIN">Senior Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-sm">Create</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[a.role]}`}>{a.role.replace('_', ' ')}</span></td>
                    <td><span className={`badge ${a.isSuspended ? 'badge-red' : 'badge-green'}`}>{a.isSuspended ? 'Suspended' : 'Active'}</span></td>
                    <td>
                      {a.role !== 'CHIEF_ADMIN' && (
                        a.isSuspended
                          ? <button className="btn btn-sm btn-primary" onClick={() => reactivate(a.id)}>Reactivate</button>
                          : <button className="btn btn-sm btn-danger" onClick={() => suspend(a.id)}>Suspend</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
