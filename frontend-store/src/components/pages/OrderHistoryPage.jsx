import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { PENDING: 'badge-yellow', CONFIRMED: 'badge-blue', COOKING: 'badge-blue', READY: 'badge-green', CLAIMED: 'badge-yellow', DELIVERED: 'badge-green', CANCELLED: 'badge-red' };

export default function OrderHistoryPage() {
  const { store } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store) {
      api.get(`/stores/${store.slug}/orders`).then(({ data }) => setOrders(data)).finally(() => setLoading(false));
    }
  }, [store]);

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header"><h1 className="page-title">Order History</h1></div>
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : orders.length === 0 ? (
          <div className="empty-state">No orders yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id.slice(0, 6).toUpperCase()}</strong></td>
                    <td style={{ fontSize: 13 }}>{o.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}</td>
                    <td>R{Number(o.total).toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                    <td style={{ fontSize: 13 }}>{new Date(o.createdAt).toLocaleString()}</td>
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
