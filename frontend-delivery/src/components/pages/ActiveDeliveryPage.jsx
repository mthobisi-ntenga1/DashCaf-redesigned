import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../services/api';

export default function ActiveDeliveryPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const socketRef = useRef(null);
  const locationIntervalRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my-active');
      setOrder(data);
      setMessages(data?.messages || []);
    } catch { setOrder(null); }
    finally { setLoading(false); }
  };

  // Broadcast GPS every 10 seconds while there is an active delivery
  const startLocationBroadcast = (orderId) => {
    if (!navigator.geolocation) return;
    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          api.post(`/orders/${orderId}/location`, {
            lat: coords.latitude,
            lng: coords.longitude,
          }).catch(() => {}); // silent fail — non-critical
        },
        () => {}, // user denied location — ignore
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }, 10000);
  };

  const stopLocationBroadcast = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  useEffect(() => {
    load();
    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.on('handoff_confirmed', () => { stopLocationBroadcast(); setOrder(null); load(); });
    socket.on('chat_message', m => setMessages(prev => [...prev, m]));
    return () => { socket.disconnect(); stopLocationBroadcast(); };
  }, []);

  useEffect(() => {
    if (order) {
      socketRef.current?.emit('join_order_chat', { orderId: order.id });
      startLocationBroadcast(order.id);
    } else {
      stopLocationBroadcast();
    }
    return () => stopLocationBroadcast();
  }, [order?.id]);

  const confirmHandoff = async () => {
    if (code.length !== 4) { setCodeError('Enter the 4-digit code.'); return; }
    setCodeError('');
    setConfirming(true);
    try {
      await api.post(`/orders/${order.id}/handoff`, { code });
      await load();
    } catch (err) {
      setCodeError(err?.response?.data?.message || 'Invalid or expired code.');
    } finally { setConfirming(false); }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    await api.post(`/orders/${order.id}/messages`, { content: msg });
    setMsg('');
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  if (!order) return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <p>No active delivery. Claim one from Available Orders.</p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Active Delivery</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>#{order.id.slice(0, 6).toUpperCase()}</span>
          <span className="badge badge-yellow">CLAIMED</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600 }}>{order.storeName}</p>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>Deliver to: {order.deliveryLocationName || 'No location set'}</p>
        {order.deliveryNote && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>📝 {order.deliveryNote}</p>}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Confirm Handoff</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>Ask the customer for their 4-digit handoff code.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', maxWidth: 140 }}
            maxLength={4}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="0000"
          />
          <button className="btn btn-primary" onClick={confirmHandoff} disabled={confirming}>
            {confirming ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
        {codeError && <p className="form-error" style={{ marginTop: 8 }}>{codeError}</p>}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Order Chat</h3>
        <div className="chat-log">
          {messages.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No messages yet.</p> : messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.senderType === 'DELIVERY' ? 'chat-msg-self' : ''}`}>
              <span className="chat-sender">{m.senderType}</span>
              <p>{m.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={sendMsg} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input className="form-input" style={{ flex: 1, margin: 0 }} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message customer…" />
          <button type="submit" className="btn btn-primary btn-sm">Send</button>
        </form>
      </div>
    </div>
  );
}
