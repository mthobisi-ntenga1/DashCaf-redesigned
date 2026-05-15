import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function FooterConfigPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/footer/config').then(({ data }) => {
      setConfig(data);
      setForm(data);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/footer/config', form);
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (!config) return <div className="empty-state">Loading…</div>;

  const fields = [
    { key: 'footerAppName', label: 'App Name' },
    { key: 'footerSupportEmail', label: 'Support Email' },
    { key: 'footerTagline', label: 'Tagline' },
    { key: 'footerVersionLabel', label: 'Version Label' },
  ];

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Footer Configuration</h1></div>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSave}>
          {fields.map(({ key, label }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={form[key] ?? ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && <span style={{ color: 'var(--green)', fontSize: 14 }}>Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
