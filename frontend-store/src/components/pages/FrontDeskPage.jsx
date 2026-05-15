import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinActionModal from '../shared/PinActionModal';

export default function FrontDeskPage() {
  const { store } = useAuth();
  const [orders, setOrders] = useState([]);
  const socketRef = useRef(null);

  // PIN modal state
  const [pendingAction, setPendingAction] = useState(null);
  const [pinError, setPinError]           = useState('');
  const [pinLoading, setPinLoading]       = useState(false);
  const [handledBy, setHandledBy]         = useState({});

  const load = () => {
    api.get(`/stores/${store?.slug}/orders?status=READY,CLAIMED`)
      .then(({ data }) => setOrders(data));
  };

  useEffect(() => {
    if (!store) return;
    load();
    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_store', { storeId: store.id });
    socket.on('order_status_update', () => load());
    socket.on('handoff_confirmed', () => load());
    return () => socket.disconnect();
  }, [store]);

  const requestHandoff = (order) => {
    setPinError('');
    setPendingAction({
      orderId:    order.id,
      shortId:    order.id.slice(0, 6).toUpperCase(),
      nextStatus: 'DISPATCHED',    // just for labelling — actual handoff uses handoff code flow
      label:      'Confirm Dispatch',
    });
  };

  const handlePinConfirm = async (pin) => {
    setPinError('');
    setPinLoading(true);
    try {
      // Verify PIN server-side — we use a status update to CLAIMED as the
      // acknowledgment that a front desk worker has confirmed the dispatch.
      const { data } = await api.patch(`/orders/${pendingAction.orderId}/status`, {
        status:    'CLAIMED',
        workerPin: pin,
      });

      if (data.workerName) {
        setHandledBy(prev => ({ ...prev, [pendingAction.orderId]: data.workerName }));
        setTimeout(() => {
          setHandledBy(prev => { const n = { ...prev }; delete n[pendingAction.orderId]; return n; });
        }, 4000);
      }

      setPendingAction(null);
      load();
    } catch (err) {
      setPinError(err?.response?.data?.message || 'Incorrect PIN. Try again.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Front Desk — Ready & Out for Delivery</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: 0 }}>
          PIN required to confirm each dispatch
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">No orders awaiting handoff.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id.slice(0, 6).toUpperCase()}</strong></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        background: o.orderType === 'COLLECT' ? '#dcfce7' : '#dbeafe',
                        color:      o.orderType === 'COLLECT' ? '#166534' : '#1d4ed8',
                      }}>
                        {o.orderType === 'COLLECT' ? '🏃 Collect' : '🛵 Delivery'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {o.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                    </td>
                    <td>
                      <span className={`badge ${o.status === 'READY' ? 'badge-green' : 'badge-yellow'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{o.deliveryLocationName || (o.orderType === 'COLLECT' ? 'In-store' : '—')}</td>
                    <td style={{ fontSize: 13 }}>{new Date(o.createdAt).toLocaleTimeString()}</td>
                    <td>
                      {handledBy[o.id] ? (
                        <span style={{
                          fontSize: 11, color: '#166534', fontWeight: 600,
                          background: '#dcfce7', padding: '3px 10px', borderRadius: 20,
                        }}>
                          ✓ {handledBy[o.id]}
                        </span>
                      ) : o.status === 'READY' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => requestHandoff(o)}
                        >
                          {o.orderType === 'COLLECT' ? 'Confirm Collection' : 'Confirm Dispatch'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {o.orderType === 'COLLECT' ? 'Awaiting customer' : 'Out for delivery'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PinActionModal
        action={pendingAction}
        onConfirm={handlePinConfirm}
        onCancel={() => { setPendingAction(null); setPinError(''); }}
        error={pinError}
        loading={pinLoading}
      />
    </div>
  );
}
