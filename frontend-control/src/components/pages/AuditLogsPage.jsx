import { useEffect, useState } from 'react';
import api from '../../services/api';

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const { data } = await api.get('/audit-logs', { params: { limit: PAGE_SIZE, offset: p * PAGE_SIZE } });
      setLogs(data.logs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{total} total entries</span>
      </div>
      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">No audit logs yet.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 13 }}>{log.actorEmail}</td>
                      <td>
                        <span style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--primary)' }}>{log.action}</code>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        {log.targetType}
                        {log.targetId && <span style={{ marginLeft: 4, color: 'var(--gray-400)' }}>#{log.targetId.slice(0, 8)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span style={{ fontSize: 13, padding: '4px 8px' }}>Page {page + 1} / {totalPages}</span>
                <button className="btn btn-sm btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
