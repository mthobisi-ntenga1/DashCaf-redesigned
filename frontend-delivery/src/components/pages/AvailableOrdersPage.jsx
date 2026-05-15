import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const socketRef = useRef(null);

  const load = () => {
    api.get('/orders/available').then(({ data }) => setOrders(data));
  };

  useEffect(() => {
    load();
    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_delivery', {});
    socket.on('order_ready', () => load());
    socket.on('order_claimed', () => load());
    return () => socket.disconnect();
  }, []);

  const claim = async (orderId) => {
    setClaiming(orderId);
    try {
      await api.post(`/orders/${orderId}/claim`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not claim order.');
    } finally { setClaiming(null); }
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Available Orders</h1>
        <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">No orders available right now.</div>
      ) : (
        <div className="delivery-order-grid">
          {orders.map(o => (
            <div key={o.id} className="delivery-order-card">
              <div className="delivery-order-header">
                <span className="delivery-order-id">#{o.id.slice(0, 6).toUpperCase()}</span>
                <span className="badge badge-green">READY</span>
              </div>
              <div className="delivery-order-body">
                <p className="delivery-store-name">{o.storeName}</p>
                <p className="delivery-location">{o.deliveryLocationName || 'No location set'}</p>
                {o.deliveryNote && <p className="delivery-note">📝 {o.deliveryNote}</p>}
                <div className="delivery-fee-pill">Earn R2.00</div>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => claim(o.id)}
                disabled={claiming === o.id}
              >
                {claiming === o.id ? 'Claiming…' : 'Claim Order'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
