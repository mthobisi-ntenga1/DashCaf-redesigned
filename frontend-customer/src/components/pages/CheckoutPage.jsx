import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const PLATFORM_FEE = 2;
const DELIVERY_FEE = 5;

/**
 * Submits a hidden form to PayFast — the browser redirects to their
 * payment page and PayFast POSTs back to our ITN endpoint on success.
 */
function redirectToPayfast(payfastUrl, payload) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payfastUrl;
  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, dispatch, subtotal } = useCart();
  const nav = useNavigate();

  const [orderType, setOrderType] = useState('DELIVERY');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/locations').then(({ data }) => setLocations(data.filter(l => l.isActive)));
  }, []);

  if (!user) { nav('/login'); return null; }
  if (cart.items.length === 0) { nav('/'); return null; }

  const isDelivery = orderType === 'DELIVERY';
  const extraFee = isDelivery ? PLATFORM_FEE + DELIVERY_FEE : PLATFORM_FEE;
  const total = subtotal + extraFee;

  const placeOrder = async () => {
    if (isDelivery && !locationId) {
      setError('Please select a delivery location.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // 1 — Create the order (status: PENDING)
      const { data: order } = await api.post('/orders', {
        storeSlug: cart.storeSlug,
        orderType,
        items: cart.items.map(i => ({ menuItemId: i.id, quantity: i.qty })),
        deliveryLocationId: isDelivery ? locationId : undefined,
        deliveryNote: isDelivery ? deliveryNote : undefined,
      });

      dispatch({ type: 'CLEAR' });

      // 2 — Get a PayFast payload for this order
      const origin = window.location.origin;
      const { data: { payload, payfastUrl } } = await api.post('/payments/initiate', {
        orderId: order.id,
        returnUrl: `${origin}/orders/${order.id}?payment=success`,
        cancelUrl: `${origin}/orders/${order.id}?payment=cancelled`,
      });

      // 3 — Redirect browser to PayFast
      redirectToPayfast(payfastUrl, payload);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place order.');
      setLoading(false);
    }
    // Note: setLoading(false) intentionally omitted on success —
    // the page navigates away via the PayFast redirect.
  };

  return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 600 }}>
      <h1 className="page-title">Checkout</h1>

      {/* Order type toggle */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>How do you want it?</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { setOrderType('DELIVERY'); setLocationId(''); }}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid',
              borderColor: isDelivery ? 'var(--primary)' : 'var(--gray-200)',
              background: isDelivery ? 'var(--primary-light, #eff6ff)' : '#fff',
              color: isDelivery ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            🛵 Delivery <span style={{ display: 'block', fontWeight: 400, fontSize: 12, marginTop: 2 }}>+R{PLATFORM_FEE + DELIVERY_FEE}.00</span>
          </button>
          <button
            onClick={() => { setOrderType('COLLECT'); setLocationId(''); }}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 8, border: '2px solid',
              borderColor: !isDelivery ? 'var(--primary)' : 'var(--gray-200)',
              background: !isDelivery ? 'var(--primary-light, #eff6ff)' : '#fff',
              color: !isDelivery ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            🏃 Collect <span style={{ display: 'block', fontWeight: 400, fontSize: 12, marginTop: 2 }}>+R{PLATFORM_FEE}.00</span>
          </button>
        </div>
        {!isDelivery && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)', background: 'var(--gray-50)', borderRadius: 6, padding: '8px 12px' }}>
            You'll collect your order directly from the store. The store will let you know when it's ready.
          </p>
        )}
      </div>

      {/* Order summary */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Order Summary</h3>
        {cart.items.map(i => (
          <div key={i.id} className="cart-row">
            <span>{i.name} × {i.qty}</span>
            <span>R{(i.displayPrice * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 12, paddingTop: 12 }}>
          <div className="cart-summary-row"><span>Subtotal</span><span>R{subtotal.toFixed(2)}</span></div>
          <div className="cart-summary-row">
            <span>Service fee</span><span>R{PLATFORM_FEE.toFixed(2)}</span>
          </div>
          {isDelivery && (
            <div className="cart-summary-row">
              <span>Delivery fee</span><span>R{DELIVERY_FEE.toFixed(2)}</span>
            </div>
          )}
          <div className="cart-summary-row" style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>
            <span>Total</span><span>R{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Delivery details */}
      {isDelivery && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Delivery Details</h3>
          <div className="form-group">
            <label className="form-label">Delivery Location</label>
            <select
              className="form-input"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              required
            >
              <option value="">Select a location…</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} — {l.building}, {l.campus}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Note (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. Room 204, second floor"
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 16 }}
        onClick={placeOrder}
        disabled={loading}
      >
        {loading ? 'Redirecting to payment…' : `Pay R${total.toFixed(2)} with PayFast`}
      </button>

      <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 8 }}>
        You'll be redirected to PayFast to complete payment securely.
      </p>
    </div>
  );
}
