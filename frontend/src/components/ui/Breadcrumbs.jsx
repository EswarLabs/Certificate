import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import './Breadcrumbs.css';

export default function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Mappings for human readable labels
  const labelMap = {
    dashboard: 'Dashboard',
    credentials: 'Credentials',
    templates: 'Templates',
    organizations: 'Organizations',
    workspaces: 'Workspaces',
    files: 'Assets & Storage',
    jobs: 'Batch Jobs',
    'email-logs': 'Deliveries',
    settings: 'Settings',
    create: 'Create New',
    batch: 'Batch Import'
  };

  if (pathnames.length === 0 || pathnames[0] === 'dashboard') {
    return (
      <div className="bc-wrapper">
        <span className="bc-home-label">Dashboard</span>
      </div>
    );
  }

  return (
    <nav className="bc-wrapper" aria-label="Breadcrumb">
      <button className="bc-back-btn" onClick={() => navigate(-1)} title="Go back" aria-label="Back">
        <ArrowLeft size={14} />
      </button>

      <Link to="/dashboard" className="bc-link">Dashboard</Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        
        // Format label
        let label = labelMap[value] || (value.length > 18 ? `${value.slice(0, 8)}...` : value);
        if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
          label = `#${value.slice(0, 6).toUpperCase()}`;
        }

        return (
          <div key={to} className="bc-item">
            <ChevronRight size={13} className="bc-sep" />
            {last ? (
              <span className="bc-current" aria-current="page">{label}</span>
            ) : (
              <Link to={to} className="bc-link">{label}</Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
