import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ stores: 0, customers: 0, delivery: 0, support: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [stores, customers, delivery, support] = await Promise.allSettled([
          api.get('/stores'),
          api.get('/customers'),
          api.get('/delivery-users'),
          api.get('/support'),
        ]);
        setStats({
          stores: stores.value?.data?.length ?? 0,
          customers: customers.value?.data?.length ?? 0,
          delivery: delivery.value?.data?.length ?? 0,
          support: support.value?.data?.filter(t => t.status === 'OPEN').length ?? 0,
        });
      } catch {}
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Stores', value: stats.stores, color: 'var(--navy)' },
          { label: 'Customers', value: stats.customers, color: 'var(--green)' },
          { label: 'Delivery Workers', value: stats.delivery, color: 'var(--orange)' },
          { label: 'Open Tickets', value: stats.support, color: 'var(--red)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
