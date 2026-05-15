import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', building: '', campus: '', description: '' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/locations'); setLocations(data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/locations', form);
    setForm({ name: '', building: '', campus: '', description: '' });
    setAdding(false);
    load();
  };

  const toggle = async (id, isActive) => {
    await api.patch(`/locations/${id}/${isActive ? 'deactivate' : 'activate'}`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campus Locations</h1>
        <button className="btn btn-primary" onClick={() => setAdding(!adding)}>+ Add Location</button>
      </div>
      {adding && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['name', 'Location Name'], ['building', 'Building'], ['campus', 'Campus'], ['description', 'Description (optional)']].map(([k, l]) => (
              <div key={k} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{l}</label>
                <input className="form-input" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={k !== 'description'} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="card">
        {loading ? <div className="empty-state">Loading…</div> : locations.length === 0 ? (
          <div className="empty-state">No locations yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Building</th><th>Campus</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {locations.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.name}</strong></td>
                    <td>{l.building}</td>
                    <td>{l.campus}</td>
                    <td><span className={`badge ${l.isActive ? 'badge-green' : 'badge-gray'}`}>{l.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className={`btn btn-sm ${l.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggle(l.id, l.isActive)}>
                        {l.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
