import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function EarningsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goalForm, setGoalForm] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  const load = () => {
    api.get('/earnings/me').then(({ data }) => {
      setStats(data);
      setGoalForm(data.goal?.toString() || '');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      await api.patch('/delivery-users/me', { deliveryGoal: parseFloat(goalForm) });
      load();
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 3000);
    } finally { setSavingGoal(false); }
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  const pct = Math.min(100, Math.round(stats?.progressPct || 0));

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Earnings</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Total Earned</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--navy)' }}>R{Number(stats?.totalEarned || 0).toFixed(2)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Deliveries</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>{stats?.deliveryCount || 0}</p>
          </div>
        </div>

        {stats?.goal > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Goal: R{Number(stats.goal).toFixed(2)}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            {stats?.deliveriesToGoal > 0 && (
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
                {stats.deliveriesToGoal} more deliveries to reach your goal
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Delivery Goal</h3>
        <form onSubmit={saveGoal}>
          <div className="form-group">
            <label className="form-label">Target Amount (R)</label>
            <input type="number" step="0.01" className="form-input" value={goalForm} onChange={e => setGoalForm(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={savingGoal}>{savingGoal ? 'Saving…' : 'Set Goal'}</button>
            {goalSaved && <span style={{ color: 'var(--green)', fontSize: 14 }}>Saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
