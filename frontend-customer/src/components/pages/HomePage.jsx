import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const STORE_EMOJIS = ['🍔', '🍕', '🌮', '🍜', '🥗', '🍱', '🥪', '🍛', '🌯', '🍝'];

export default function HomePage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const loadStores = useCallback(async (q) => {
    setLoading(true);
    try {
      if (q.trim()) {
        const { data } = await api.get('/stores/search', { params: { q } });
        setStores(data);
      } else {
        const { data } = await api.get('/stores/active');
        setStores(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStores(debouncedSearch); }, [debouncedSearch, loadStores]);

  return (
    <div>
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">✦ Campus Delivery</div>
          <h1 className="hero-title">
            Campus Cravings,<br /><span>Delivered Fast</span>
          </h1>
          <p className="hero-sub">Order from your favourite campus spots in minutes</p>
          <div className="hero-search-wrap">
            <span className="hero-search-icon">🔍</span>
            <input
              className="hero-search"
              placeholder="Search restaurants, cuisines…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">
                {search ? `Results for "${search}"` : 'Open Now'}
              </div>
              {!search && (
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2, fontWeight: 500 }}>
                  {stores.length} store{stores.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', height: 180, border: '1px solid var(--gray-100)', opacity: 0.5 + i * 0.1 }} />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔍</span>
              No stores found. Try a different search.
            </div>
          ) : (
            <div className="store-grid">
              {stores.map((s, idx) => (
                <Link key={s.id} to={`/stores/${s.slug}`} className="store-card">
                  <div className="store-card-banner">
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {STORE_EMOJIS[idx % STORE_EMOJIS.length]}
                    </span>
                  </div>
                  <div className="store-card-body">
                    <div className="store-name">{s.name}</div>
                    {s.description && <div className="store-desc">{s.description}</div>}
                    {s.location && (
                      <div className="store-loc">
                        <span>📍</span> {s.location}
                      </div>
                    )}
                  </div>
                  <div className="store-card-footer">
                    <span className="badge badge-green">● Open</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
                      View Menu →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
