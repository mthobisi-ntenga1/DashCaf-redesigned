import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function StoreMenuPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { cart, dispatch } = useCart();
  const nav = useNavigate();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartConflict, setCartConflict] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/stores/slug/${slug}`),
      api.get(`/stores/${slug}/menu`),
    ]).then(([s, m]) => {
      setStore(s.data);
      setCategories(m.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  const addItem = (item) => {
    if (cart.storeSlug && cart.storeSlug !== slug && cart.items.length > 0) {
      setCartConflict(true);
      return;
    }
    dispatch({ type: 'ADD', item, storeSlug: slug });
  };

  const getQty = (id) => cart.items.find(i => i.id === id)?.qty || 0;
  const cartCount = cart.items.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.items.reduce((s, i) => s + i.displayPrice * i.qty, 0);

  if (loading) return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>⏳</span>
      Loading menu…
    </div>
  );
  if (!store) return (
    <div className="empty-state" style={{ marginTop: 80 }}>Store not found.</div>
  );

  return (
    <div style={{ paddingBottom: cartCount > 0 ? 100 : 0 }}>
      {/* Store header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%)',
        color: 'var(--white)',
        padding: '40px 0 32px',
      }}>
        <div className="container">
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Restaurant
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>{store.name}</h1>
          {store.description && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 540 }}>{store.description}</p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
              🟢 Open Now
            </span>
            {store.location && (
              <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 700 }}>
                📍 {store.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        {cartConflict && (
          <div className="alert alert-warn" style={{ marginBottom: 20 }}>
            <span style={{ flex: 1 }}>Your cart has items from another store. Clear it to order from here?</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'CLEAR' }); setCartConflict(false); }}>
                Clear Cart
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => setCartConflict(false)}>Keep</button>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🍽️</span>
            No menu items available right now.
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} style={{ marginBottom: 36 }}>
            <div className="menu-category-header">
              <h2 className="menu-category-title">{cat.name}</h2>
              <div className="menu-category-line" />
            </div>
            <div className="menu-grid">
              {cat.items?.map(item => {
                const qty = getQty(item.id);
                return (
                  <div key={item.id} className="menu-item-card">
                    <div className="menu-item-info">
                      <span className="menu-item-name">{item.name}</span>
                      {item.description && <span className="menu-item-desc">{item.description}</span>}
                      <span className="menu-item-price">R{Number(item.displayPrice).toFixed(2)}</span>
                    </div>
                    <div className="menu-item-action">
                      {qty === 0 ? (
                        <button
                          className="btn btn-orange btn-sm"
                          style={{ borderRadius: 99, padding: '8px 18px' }}
                          onClick={() => addItem(item)}
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => dispatch({ type: 'SET_QTY', id: item.id, qty: qty - 1 })}>−</button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => dispatch({ type: 'SET_QTY', id: item.id, qty: qty + 1 })}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && cart.storeSlug === slug && (
        <div className="sticky-cart-bar">
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 2 }}>YOUR ORDER</div>
            <div style={{ fontWeight: 700 }}>{cartCount} item{cartCount !== 1 ? 's' : ''} · R{cartTotal.toFixed(2)}</div>
          </div>
          <button
            className="btn btn-orange btn-sm"
            style={{ borderRadius: 99 }}
            onClick={() => user ? nav('/cart') : nav('/login')}
          >
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}
