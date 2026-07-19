import { useState, useEffect, useRef } from "react";
import { Search, FileText, Check, X, ChevronRight, Layers } from "lucide-react";

/**
 * TemplatePicker — a bottom-sheet / modal for selecting a template visually.
 *
 * Props:
 *   templates       – array of template objects
 *   selectedId      – currently selected template id (or "")
 *   onSelect        – (template) => void — called when user confirms selection
 *   onClose         – () => void
 */
export default function TemplatePicker({ templates = [], selectedId = "", onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState(null);
  const [pending, setPending] = useState(selectedId);
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = templates.filter(t =>
    !query || t.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleConfirm = () => {
    const tmpl = templates.find(t => t.id === pending);
    if (tmpl) onSelect(tmpl);
    onClose();
  };

  return (
    <div
      className="template-picker-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="template-picker-modal" role="dialog" aria-modal="true" aria-label="Select Template">
        {/* Header */}
        <div className="template-picker-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Choose a Template
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
              {filtered.length} template{filtered.length !== 1 ? "s" : ""} available
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="template-picker-search">
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
            <input
              ref={searchRef}
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search templates…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <div className="empty-state-icon"><FileText size={24} color="var(--text-tertiary)" /></div>
            <h3>No templates found</h3>
            <p>Try a different search term or create a template first.</p>
          </div>
        ) : (
          <div className="template-picker-grid">
            {filtered.map(t => {
              const isSelected = pending === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setPending(t.id)}
                  onDoubleClick={() => { setPending(t.id); const tmpl = templates.find(x => x.id === t.id); if (tmpl) { onSelect(tmpl); onClose(); } }}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`template-picker-card${isSelected ? " selected" : ""}`}
                  style={{ border: "none", textAlign: "left", width: "100%", padding: 0 }}
                  title={t.name}
                  aria-pressed={isSelected}
                >
                  {/* Thumbnail */}
                  <div className="template-picker-thumb">
                    {t.thumbnailUrl ? (
                      <img src={t.thumbnailUrl} alt={t.name} loading="lazy" />
                    ) : (
                      <Layers size={28} style={{ color: "var(--text-tertiary)" }} />
                    )}
                    {isSelected && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        background: "var(--brand-primary)", borderRadius: "50%",
                        width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <Check size={13} color="#fff" />
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div className="template-picker-card-body">
                    <div className="template-picker-card-name">{t.name}</div>
                    <div className="template-picker-card-meta">
                      <span>{t.schemaDefinition?.length || 0} fields</span>
                      {t.orientation && <span style={{ textTransform: "capitalize" }}>{t.orientation}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer action */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          background: "var(--bg-secondary)",
          gap: 12,
          flexWrap: "wrap",
        }}>
          {pending && templates.find(t => t.id === pending) ? (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", minWidth: 0 }}>
              Selected: <strong style={{ color: "var(--text-primary)" }}>{templates.find(t => t.id === pending)?.name}</strong>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Double-click or select + confirm</div>
          )}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              onClick={handleConfirm}
              className="btn btn-primary btn-sm"
              disabled={!pending}
            >
              Use Template <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
