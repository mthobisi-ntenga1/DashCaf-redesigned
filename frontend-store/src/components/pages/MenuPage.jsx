import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function MenuPage() {
  const { store } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catForm, setCatForm] = useState({ name: '' });
  const [addingCat, setAddingCat] = useState(false);
  const [itemForm, setItemForm] = useState({ categoryId: '', name: '', description: '', basePrice: '' });
  const [addingItem, setAddingItem] = useState(false);

  const load = () => {
    api.get(`/stores/${store?.slug}/menu`).then(({ data }) => setCategories(data)).finally(() => setLoading(false));
  };

  useEffect(() => { if (store) load(); }, [store]);

  const addCategory = async (e) => {
    e.preventDefault();
    await api.post(`/stores/${store.slug}/menu/categories`, catForm);
    setCatForm({ name: '' }); setAddingCat(false); load();
  };

  const addItem = async (e) => {
    e.preventDefault();
    await api.post(`/stores/${store.slug}/menu/items`, { ...itemForm, basePrice: parseFloat(itemForm.basePrice) });
    setItemForm({ categoryId: '', name: '', description: '', basePrice: '' }); setAddingItem(false); load();
  };

  const toggleItem = async (itemId, isAvailable) => {
    await api.patch(`/stores/${store.slug}/menu/items/${itemId}`, { isAvailable: !isAvailable });
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Menu Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setAddingCat(!addingCat); setAddingItem(false); }}>+ Category</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setAddingItem(!addingItem); setAddingCat(false); }}>+ Item</button>
        </div>
      </div>

      {addingCat && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={addCategory}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="form-input" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm">Add Category</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingCat(false)}>Cancel</button>
          </div>
        </form>
      )}

      {addingItem && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={addItem}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select className="form-input" value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })} required>
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Item Name</label>
              <input className="form-input" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Base Price (R)</label>
              <input type="number" step="0.01" className="form-input" value={itemForm.basePrice} onChange={e => setItemForm({ ...itemForm, basePrice: e.target.value })} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description</label>
              <input className="form-input" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-sm">Add Item</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingItem(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="empty-state">Loading…</div> : categories.map(cat => (
        <div key={cat.id} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>{cat.name}</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Description</th><th>Base Price</th><th>Display Price</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {cat.items?.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No items</td></tr>
                  ) : cat.items?.map(i => (
                    <tr key={i.id}>
                      <td><strong>{i.name}</strong></td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{i.description}</td>
                      <td>R{Number(i.basePrice).toFixed(2)}</td>
                      <td>R{Number(i.displayPrice).toFixed(2)}</td>
                      <td><span className={`badge ${i.isAvailable ? 'badge-green' : 'badge-red'}`}>{i.isAvailable ? 'Available' : 'Unavailable'}</span></td>
                      <td><button className={`btn btn-sm ${i.isAvailable ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleItem(i.id, i.isAvailable)}>{i.isAvailable ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
