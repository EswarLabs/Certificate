import { useNavigate } from "react-router-dom";
import { Mail, X, Settings, AlertTriangle } from "lucide-react";
import "./SmtpModal.css";

/**
 * SmtpModal — shown when email sending fails because SMTP is not configured.
 * Props:
 *   onClose  — callback to close the modal
 *   message  — optional custom error message
 */
export default function SmtpModal({ onClose, message }) {
  const navigate = useNavigate();

  const handleSetup = () => {
    onClose();
    navigate("/settings?tab=workspace");
  };

  return (
    <div className="smtp-overlay" onClick={onClose}>
      <div
        className="smtp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smtp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button className="smtp-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="smtp-modal-icon">
          <AlertTriangle size={28} />
        </div>

        {/* Content */}
        <h2 id="smtp-modal-title" className="smtp-modal-title">
          Email Configuration Required
        </h2>
        <p className="smtp-modal-body">
          {message ||
            "Your workspace email (Resend API) settings are not configured. You must set up a Resend API key and a From Email address before sending certificate emails."}
        </p>

        {/* Actions */}
        <div className="smtp-modal-actions">
          <button className="btn btn-primary smtp-setup-btn" onClick={handleSetup}>
            <Settings size={15} />
            Setup Workspace SMTP Settings
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
