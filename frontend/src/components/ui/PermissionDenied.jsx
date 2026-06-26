import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

export default function PermissionDenied({
  requiredRole = "ADMIN",
  title = "Access Restricted",
  description
}) {
  const desc = description || `Your current role does not have permission to view this page. Requires ${requiredRole} or higher.`;
  return (
    <div className="es-container" role="alert">
      <div className="es-icon-circle" style={{ backgroundColor: "var(--warning-light)", borderColor: "var(--warning)" }}>
        <ShieldAlert size={28} style={{ color: "var(--warning)" }} />
      </div>

      <h3 className="es-title">{title}</h3>
      <p className="es-desc">{desc}</p>

      <div className="es-actions">
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
