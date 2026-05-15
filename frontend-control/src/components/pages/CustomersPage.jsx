import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const suspend = async (id) => { await api.patch(`/customers/${id}/suspend`); load(); };
  const reactivate = async (id) => { await api.patch(`/customers/${id}/reactivate`); load(); };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Customers</h1></div>
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : customers.length === 0 ? (
          <div className="empty-state">No customers yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{c.status}</span></td>
                    <td>
                      {c.status === 'ACTIVE'
                        ? <button className="btn btn-sm btn-danger" onClick={() => suspend(c.id)}>Suspend</button>
                        : <button className="btn btn-sm btn-primary" onClick={() => reactivate(c.id)}>Reactivate</button>
                      }
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
