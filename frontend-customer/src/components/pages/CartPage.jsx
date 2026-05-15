import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartPage() {
  const { user } = useAuth();
  const { cart, dispatch, subtotal } = useCart();
  const nav = useNavigate();

  if (!user) { nav('/login'); return null; }

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 8 }}>
          Your cart is empty
        </h2>
        <p style={{ color: 'var(--gray-400)', marginBottom: 24, fontSize: 15 }}>
          Browse stores to add items to your order.
        </p>
        <button className="btn btn-orange btn-lg" onClick={() => nav('/')}>
          Browse Stores
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        <span className="badge badge-orange">{cart.items.reduce((s, i) => s + i.qty, 0)} items</span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          {cart.storeSlug || 'Your Order'}
        </div>
        {cart.items.map(item => (
          <div key={item.id} className="cart-row">
            <div className="cart-row-info">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-price">R{(item.displayPrice * item.qty).toFixed(2)}</span>
            </div>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => dispatch({ type: 'SET_QTY', id: item.id, qty: item.qty - 1 })}>−</button>
              <span className="qty-val">{item.qty}</span>
              <button className="qty-btn" onClick={() => dispatch({ type: 'SET_QTY', id: item.id, qty: item.qty + 1 })}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: 'var(--gray-700)' }}>Order Summary</div>
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>R{subtotal.toFixed(2)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Service fee</span>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>R2.00</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery fee (if applicable)</span>
          <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>R5.00</span>
        </div>
        <div className="cart-total-row">
          <span>Estimated Total</span>
          <span style={{ color: 'var(--orange)' }}>R{(subtotal + 7).toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => nav(`/stores/${cart.storeSlug}`)}>
          ← Back to Menu
        </button>
        <button className="btn btn-orange btn-full btn-lg" onClick={() => nav('/checkout')}>
          Checkout →
        </button>
      </div>
    </div>
  );
}
