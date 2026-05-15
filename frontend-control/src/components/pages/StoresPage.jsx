import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = {
  PENDING: 'badge-yellow',
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  REJECTED: 'badge-gray',
};

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stores');
      setStores(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await api.post(`/stores/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await api.post(`/stores/${id}/reject`, { reason });
    load();
  };

  const suspend = async (id) => {
    await api.patch(`/stores/${id}/suspend`);
    load();
  };

  const reactivate = async (id) => {
    await api.patch(`/stores/${id}/reactivate`);
    load();
  };

  const filtered = tab === 'all' ? stores : stores.filter(s => s.status === tab.toUpperCase());

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stores</h1>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'active', 'suspended', 'rejected'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : filtered.length === 0 ? (
          <div className="empty-state">No stores found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Slug</th><th>Owner</th><th>University</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td><code style={{ fontSize: 12, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{s.slug}</code></td>
                    <td>{s.ownerName}<br /><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.ownerEmail}</span></td>
                    <td>{s.university} — {s.campus}</td>
                    <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {s.status === 'PENDING' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => approve(s.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => reject(s.id)}>Reject</button>
                        </>
                      )}
                      {s.status === 'ACTIVE' && (
                        <button className="btn btn-sm btn-danger" onClick={() => suspend(s.id)}>Suspend</button>
                      )}
                      {s.status === 'SUSPENDED' && (
                        <button className="btn btn-sm btn-primary" onClick={() => reactivate(s.id)}>Reactivate</button>
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
