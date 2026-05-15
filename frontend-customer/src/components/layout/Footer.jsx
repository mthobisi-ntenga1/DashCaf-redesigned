import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Footer() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    api.get('/footer/config').then(({ data }) => setCfg(data)).catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-brand">{cfg?.footerAppName || 'DashCaf'}</span>
        {cfg?.footerTagline && <span className="footer-tagline">{cfg.footerTagline}</span>}
        <span className="footer-meta">
          {cfg?.footerSupportEmail && <a href={`mailto:${cfg.footerSupportEmail}`}>{cfg.footerSupportEmail}</a>}
          {cfg?.footerVersionLabel && <span> · {cfg.footerVersionLabel}</span>}
        </span>
      </div>
    </footer>
  );
}
