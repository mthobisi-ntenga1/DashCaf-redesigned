import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = { PENDING: 'badge-yellow', ACTIVE: 'badge-green', SUSPENDED: 'badge-red' };

export default function DeliveryUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/delivery-users');
      setUsers(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => { await api.post(`/delivery-users/${id}/approve`); load(); };
  const reject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await api.post(`/delivery-users/${id}/reject`, { reason });
    load();
  };
  const suspend = async (id) => { await api.patch(`/delivery-users/${id}/suspend`); load(); };
  const reactivate = async (id) => { await api.patch(`/delivery-users/${id}/reactivate`); load(); };

  const filtered = tab === 'all' ? users : users.filter(u => u.status === tab.toUpperCase());

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Delivery Workers</h1></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'active', 'suspended'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : filtered.length === 0 ? (
          <div className="empty-state">No delivery workers found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Earnings</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>R{Number(u.totalEarned).toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {u.status === 'PENDING' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => approve(u.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => reject(u.id)}>Reject</button>
                        </>
                      )}
                      {u.status === 'ACTIVE' && <button className="btn btn-sm btn-danger" onClick={() => suspend(u.id)}>Suspend</button>}
                      {u.status === 'SUSPENDED' && <button className="btn btn-sm btn-primary" onClick={() => reactivate(u.id)}>Reactivate</button>}
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
