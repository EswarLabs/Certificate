import { AlertCircle, RefreshCw } from 'lucide-react';
import './EmptyState.css';

export default function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error loading this content.",
  onRetry
}) {
  return (
    <div className="es-container" role="alert">
      <div className="es-icon-circle" style={{ backgroundColor: "var(--danger-light)", borderColor: "var(--danger)" }}>
        <AlertCircle size={28} style={{ color: "var(--danger)" }} />
      </div>

      <h3 className="es-title">{title}</h3>
      <p className="es-desc">{description}</p>

      {onRetry && (
        <div className="es-actions">
          <button className="btn btn-secondary" onClick={onRetry}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}
