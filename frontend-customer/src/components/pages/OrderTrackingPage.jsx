import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';

const DELIVERY_STEPS = ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'CLAIMED', 'DELIVERED'];
const COLLECT_STEPS  = ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'DELIVERED'];

const DELIVERY_LABEL = {
  PENDING:   'Order Placed',
  CONFIRMED: 'Confirmed',
  COOKING:   'Being Prepared',
  READY:     'Ready for Pickup',
  CLAIMED:   'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const COLLECT_LABEL = {
  PENDING:   'Order Placed',
  CONFIRMED: 'Confirmed',
  COOKING:   'Being Prepared',
  READY:     'Ready to Collect',
  DELIVERED: 'Collected',
  CANCELLED: 'Cancelled',
};

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 28, color: n <= value ? '#f59e0b' : '#d1d5db', padding: 0,
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Rating state
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Rider GPS
  const [riderLocation, setRiderLocation] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        setMessages(data.messages || []);
        if (data.rating) { setRating(data.rating); setRatingSubmitted(true); }
      })
      .finally(() => setLoading(false));

    const socket = io({ path: '/socket.io', withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_order_chat', { orderId: id });
    socket.on('order_status_update', ({ status }) => setOrder(o => o ? { ...o, status } : o));
    socket.on('chat_message', (m) => setMessages(prev => [...prev, m]));
    socket.on('rider_location', ({ lat, lng }) => setRiderLocation({ lat, lng }));

    return () => socket.disconnect();
  }, [id]);

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      setOrder(o => ({ ...o, status: 'CANCELLED' }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    await api.post(`/orders/${id}/messages`, { content: msg });
    setMsg('');
  };

  const submitRating = async () => {
    if (!rating) return;
    setRatingLoading(true);
    try {
      await api.post(`/orders/${id}/rate`, { rating, review: review || undefined });
      setRatingSubmitted(true);
      setOrder(o => ({ ...o, rating, review }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return <div className="empty-state" style={{ marginTop: 80 }}>Loading order…</div>;
  if (!order) return <div className="empty-state" style={{ marginTop: 80 }}>Order not found.</div>;

  const isCollect = order.orderType === 'COLLECT';
  const steps = isCollect ? COLLECT_STEPS : DELIVERY_STEPS;
  const labelMap = isCollect ? COLLECT_LABEL : DELIVERY_LABEL;
  const stepIdx = steps.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const isActive = !isCancelled && !isDelivered;
  const isOutForDelivery = order.status === 'CLAIMED' && !isCollect;

  return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/orders" style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>← My Orders</Link>
        <h1 className="page-title" style={{ margin: 0 }}>
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{order.storeName}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', top: 10, right: '50%', width: '100%', height: 3,
                    background: i <= stepIdx ? 'var(--primary)' : 'var(--gray-200)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', zIndex: 1,
                  background: i < stepIdx ? 'var(--primary)' : i === stepIdx ? 'var(--primary)' : 'var(--gray-200)',
                  border: i === stepIdx ? '3px solid var(--primary)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                }}>
                  {i < stepIdx ? '✓' : ''}
                </div>
                <span style={{ fontSize: 10, marginTop: 4, color: i <= stepIdx ? 'var(--primary)' : 'var(--gray-400)', textAlign: 'center', lineHeight: 1.2 }}>
                  {labelMap[step]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="card" style={{ marginBottom: 16, borderColor: '#fca5a5', background: '#fef2f2' }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>❌ This order was cancelled.</p>
        </div>
      )}

      {/* Rider location (shown when out for delivery) */}
      {isOutForDelivery && riderLocation && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>🛵 Rider Location</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
            Your rider is on their way — live location updating.
          </p>
          <a
            href={`https://www.google.com/maps?q=${riderLocation.lat},${riderLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            Open in Google Maps
          </a>
        </div>
      )}
      {isOutForDelivery && !riderLocation && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>🛵 Your rider is on their way…</p>
        </div>
      )}

      {/* Handoff code */}
      {order.handoffCode && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && !isCollect && (
        <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Your handoff code</p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8, color: 'var(--navy)' }}>
            {order.handoffCode}
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Show this to your rider when they arrive.</p>
        </div>
      )}

      {/* Cancel button */}
      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
        <button
          className="btn btn-danger btn-full"
          style={{ marginBottom: 16 }}
          onClick={cancelOrder}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling…' : 'Cancel Order'}
        </button>
      )}

      {/* Rating — shown after delivery */}
      {isDelivered && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Rate your order</h3>
          {ratingSubmitted ? (
            <div>
              <StarRating value={rating} onChange={() => {}} />
              {review && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>{review}</p>}
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>Thanks for your feedback!</p>
            </div>
          ) : (
            <div>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                className="form-input"
                style={{ marginTop: 12, minHeight: 72, resize: 'vertical' }}
                placeholder="Leave a review (optional)…"
                value={review}
                onChange={e => setReview(e.target.value)}
              />
              <button
                className="btn btn-primary"
                style={{ marginTop: 8 }}
                onClick={submitRating}
                disabled={!rating || ratingLoading}
              >
                {ratingLoading ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order chat */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Order Chat</h3>
        <div className="chat-log" style={{ minHeight: 60 }}>
          {messages.length === 0
            ? <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No messages yet.</p>
            : messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.senderType === 'CUSTOMER' ? 'chat-msg-self' : ''}`}>
                <span className="chat-sender">{m.senderType}</span>
                <p>{m.content}</p>
              </div>
            ))}
        </div>
        {isActive && (
          <form onSubmit={sendMsg} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              className="form-input"
              style={{ flex: 1, margin: 0 }}
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Message store or rider…"
            />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}
