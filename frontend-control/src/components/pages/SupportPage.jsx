import { useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = { OPEN: 'badge-red', ASSIGNED: 'badge-yellow', RESOLVED: 'badge-green' };

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/support'); setTickets(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id) => { await api.patch(`/support/${id}/resolve`); load(); };
  const assign = async (id) => {
    const note = prompt('Assignment note for the admin:');
    if (note === null) return;
    const assignedTo = prompt('Admin ID to assign to:');
    if (!assignedTo) return;
    await api.patch(`/support/${id}/assign`, { assignedTo, note });
    load();
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Support Inbox</h1></div>
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : tickets.length === 0 ? (
          <div className="empty-state">No support tickets.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>From</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.subject}</strong><br /><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{t.message.slice(0, 80)}…</span></td>
                    <td><span className="badge badge-blue">{t.submitterType}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {t.status !== 'RESOLVED' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => resolve(t.id)}>Resolve</button>
                          {t.status === 'OPEN' && <button className="btn btn-sm btn-outline" onClick={() => assign(t.id)}>Assign</button>}
                        </>
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
