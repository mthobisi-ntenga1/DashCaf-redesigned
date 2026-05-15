import { useEffect, useState } from 'react';

/**
 * PinActionModal
 *
 * Appears when a worker presses an action button on a specific order.
 * Collects the PIN and calls onConfirm(pin) — the parent executes the
 * actual API call and calls onError(msg) if the PIN was wrong.
 *
 * Props:
 *   action  — { orderId, shortId, label } | null   (null = hidden)
 *   onConfirm(pin)  — called with the entered PIN
 *   onCancel()      — called when dismissed
 *   error           — error string from parent (wrong PIN etc.)
 *   loading         — parent is executing the request
 */
export default function PinActionModal({ action, onConfirm, onCancel, error, loading }) {
  const [pin, setPin] = useState('');

  // Clear pin whenever a new action opens
  useEffect(() => {
    setPin('');
  }, [action?.orderId, action?.label]);

  if (!action) return null;

  const handleDigit = (d) => {
    if (pin.length < 6) setPin(p => p + d);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleConfirm = () => {
    if (pin.length < 4) return;
    onConfirm(pin);
  };

  const dotCount = Math.max(4, pin.length);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, padding: '32px 28px',
        width: 300, boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {/* Header */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 52, height: 52, borderRadius: '50%',
          background: '#eff6ff', marginBottom: 12,
        }}>
          <span style={{ fontSize: 24 }}>🔐</span>
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Confirm Action</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
          <strong style={{ color: '#1d4ed8' }}>{action.label}</strong>
        </p>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>
          Order <strong>#{action.shortId}</strong> — enter your station PIN
        </p>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <div key={i} style={{
              width: 13, height: 13, borderRadius: '50%',
              background: i < pin.length ? '#1d4ed8' : 'var(--gray-200)',
              border: `2px solid ${i < pin.length ? '#1d4ed8' : 'var(--gray-300)'}`,
              transition: 'all 0.1s',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <NumKey key={d} label={d} onClick={() => handleDigit(d)} disabled={loading} />
          ))}
          <NumKey label="⌫" onClick={handleDelete} disabled={loading} muted />
          <NumKey label="0" onClick={() => handleDigit('0')} disabled={loading} />
          <NumKey
            label={loading ? '…' : '✓'}
            onClick={handleConfirm}
            disabled={pin.length < 4 || loading}
            primary
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
            {error}
          </p>
        )}

        <button
          style={{
            background: 'none', border: 'none', color: 'var(--gray-400)',
            fontSize: 13, cursor: 'pointer', padding: '4px 8px',
          }}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NumKey({ label, onClick, disabled, primary, muted }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '15px 0',
        fontSize: primary ? 18 : muted ? 18 : 20,
        fontWeight: primary ? 700 : 600,
        background: primary
          ? (disabled ? 'var(--gray-200)' : '#1d4ed8')
          : 'var(--gray-100)',
        color: primary
          ? (disabled ? 'var(--gray-400)' : '#fff')
          : muted ? 'var(--gray-500)' : '#111',
        border: 'none', borderRadius: 10,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}
