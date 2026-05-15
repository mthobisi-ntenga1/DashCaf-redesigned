import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinActionModal from '../shared/PinActionModal';

const STATUS_COLOR = {
  PENDING:   '#fef9c3',
  CONFIRMED: '#dbeafe',
  COOKING:   '#fed7aa',
  READY:     '#dcfce7',
};

const NEXT        = { PENDING: 'CONFIRMED', CONFIRMED: 'COOKING', COOKING: 'READY' };
const NEXT_LABEL  = { PENDING: 'Confirm Order', CONFIRMED: 'Start Cooking', COOKING: 'Mark Ready' };

export default function KitchenPage() {
  const { store } = useAuth();
  const [orders, setOrders] = useState([]);
  const socketRef = useRef(null);

  // PIN modal state
  const [pendingAction, setPendingAction] = useState(null); // { orderId, shortId, nextStatus, label }
  const [pinError, setPinError]           = useState('');
  const [pinLoading, setPinLoading]       = useState(false);

  // Brief "handled by" confirmation on a ticket
  const [handledBy, setHandledBy] = useState({}); // { [orderId]: workerName }

  const load = () => {
    api.get(`/stores/${store?.slug}/orders?status=PENDING,CONFIRMED,COOKING,READY`)
      .then(({ data }) => setOrders(data));
  };

  useEffect(() => {
    if (!store) return;
    load();
    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_store', { storeId: store.id });
    socket.on('new_order', () => load());
    socket.on('order_status_update', () => load());
    return () => socket.disconnect();
  }, [store]);

  // Open PIN modal for a specific order action
  const requestAction = (order, nextStatus) => {
    setPinError('');
    setPendingAction({
      orderId:    order.id,
      shortId:    order.id.slice(0, 6).toUpperCase(),
      nextStatus,
      label:      NEXT_LABEL[order.status],
    });
  };

  // Called when worker submits their PIN
  const handlePinConfirm = async (pin) => {
    setPinError('');
    setPinLoading(true);
    try {
      const { data } = await api.patch(`/orders/${pendingAction.orderId}/status`, {
        status:    pendingAction.nextStatus,
        workerPin: pin,
      });

      // Flash the worker's name on the ticket for 4 seconds
      if (data.workerName) {
        setHandledBy(prev => ({ ...prev, [pendingAction.orderId]: data.workerName }));
        setTimeout(() => {
          setHandledBy(prev => { const n = { ...prev }; delete n[pendingAction.orderId]; return n; });
        }, 4000);
      }

      setPendingAction(null);
      load();
    } catch (err) {
      // Wrong PIN or other error — keep modal open with error message
      setPinError(err?.response?.data?.message || 'Incorrect PIN. Try again.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="kitchen-title">Kitchen Display</h1>
          <span className="kitchen-live">LIVE</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
          Each action requires your station PIN
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">No active orders.</div>
      ) : (
        <div className="order-board">
          {orders.map(o => (
            <div
              key={o.id}
              className="order-ticket"
              style={{ background: STATUS_COLOR[o.status] || '#fff' }}
            >
              <div className="ticket-header">
                <span className="ticket-id">#{o.id.slice(0, 6).toUpperCase()}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: o.orderType === 'COLLECT' ? '#dcfce7' : '#dbeafe',
                    color:      o.orderType === 'COLLECT' ? '#166534' : '#1d4ed8',
                  }}>
                    {o.orderType === 'COLLECT' ? '🏃 Collect' : '🛵 Delivery'}
                  </span>
                  <span className={`badge ${
                    o.status === 'READY'   ? 'badge-green' :
                    o.status === 'COOKING' ? 'badge-yellow' : 'badge-blue'
                  }`}>
                    {o.status}
                  </span>
                </div>
              </div>

              <ul className="ticket-items">
                {o.items?.map(i => (
                  <li key={i.id}><strong>{i.quantity}×</strong> {i.name}</li>
                ))}
              </ul>

              {o.deliveryNote && (
                <p className="ticket-note">📝 {o.deliveryNote}</p>
              )}

              <div className="ticket-footer">
                <span className="ticket-time">{new Date(o.createdAt).toLocaleTimeString()}</span>

                {/* "Handled by" flash */}
                {handledBy[o.id] && (
                  <span style={{
                    fontSize: 11, color: '#166534', fontWeight: 600,
                    background: '#dcfce7', padding: '2px 8px', borderRadius: 20,
                  }}>
                    ✓ {handledBy[o.id]}
                  </span>
                )}

                {NEXT[o.status] && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => requestAction(o, NEXT[o.status])}
                  >
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
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
