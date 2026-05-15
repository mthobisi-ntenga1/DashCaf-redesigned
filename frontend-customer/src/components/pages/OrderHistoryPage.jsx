import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_BADGE = {
  PENDING: 'badge-yellow',
  CONFIRMED: 'badge-blue',
  COOKING: 'badge-blue',
  READY: 'badge-blue',
  CLAIMED: 'badge-yellow',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <h1 className="page-title">My Orders</h1>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Browse Stores</Link>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          {orders.map(o => (
            <Link key={o.id} to={`/orders/${o.id}`} className="order-row">
              <div>
                <span className="order-store">{o.storeName}</span>
                <span className="order-date">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="order-total">R{Number(o.total).toFixed(2)}</span>
                <span className={`badge ${STATUS_BADGE[o.status] || 'badge-gray'}`}>{o.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
