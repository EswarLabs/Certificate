import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "No Items Yet",
  description = "Get started by creating your first record.",
  actionLabel,
  actionPath,
  onAction,
  children
}) {
  return (
    <div className="es-container">
      <div className="es-icon-circle">
        <Icon size={28} className="es-icon" />
      </div>

      <h3 className="es-title">{title}</h3>
      <p className="es-desc">{description}</p>

      {children}

      <div className="es-actions">
        {actionPath && actionLabel ? (
          <Link to={actionPath} className="btn btn-primary">
            <span>{actionLabel}</span>
          </Link>
        ) : onAction && actionLabel ? (
          <button className="btn btn-primary" onClick={onAction}>
            <span>{actionLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
