import { useState, useRef, useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

/**
 * ConfirmDeleteModal
 * 
 * Props:
 *   isOpen       - boolean
 *   onClose      - () => void
 *   onConfirm    - async () => void
 *   title        - string (e.g. "Delete Organization")
 *   resourceName - string (user must type this to confirm)
 *   description  - string (impact description)
 *   impacts      - string[] (list of impact bullets)
 *   loading      - boolean
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Resource",
  resourceName = "",
  description = "This action cannot be undone.",
  impacts = [],
  loading = false,
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isConfirmed = typed.trim() === resourceName;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfirmed) return;
    await onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="modal-header" style={{ borderColor: "rgba(239,68,68,0.2)", background: "linear-gradient(135deg, var(--danger-light), transparent)" }}>
          <div className="modal-title" style={{ color: "var(--danger)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={16} color="var(--danger)" />
            </div>
            {title}
          </div>
          <button className="btn-icon" onClick={onClose} style={{ border: "none", background: "none" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form className="modal-body" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {description}
          </p>

          {impacts.length > 0 && (
            <div style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                This will permanently delete:
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {impacts.map((impact, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--danger-text, var(--danger))", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ marginTop: 2, flexShrink: 0 }}>•</span>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resourceName && (
            <div className="form-group">
              <label className="label">
                Type <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", background: "var(--bg-secondary)", padding: "1px 6px", borderRadius: 4 }}>{resourceName}</strong> to confirm:
              </label>
              <input
                ref={inputRef}
                className="input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={resourceName}
                autoComplete="off"
                style={{ borderColor: typed && !isConfirmed ? "var(--danger)" : undefined }}
              />
              {typed && !isConfirmed && (
                <span style={{ fontSize: 12, color: "var(--danger)" }}>
                  Name doesn't match
                </span>
              )}
            </div>
          )}

          {/* Footer inside form */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger-solid"
              disabled={loading || (resourceName && !isConfirmed)}
            >
              {loading ? (
                <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Deleting…</>
              ) : (
                title
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
