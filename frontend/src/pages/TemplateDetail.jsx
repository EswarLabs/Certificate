import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getTemplate, updateTemplate, deleteTemplate, publishTemplate } from "../services/templateServices";
import { uploadImage } from "../services/uploadServices";
import CanvasEditor from "../components/editor/CanvasEditor";

const ACCENT = "#3b82f6";
const BG = "#0f172a";
const SURFACE = "#1e293b";
const BORDER = "#334155";
const TEXT = "#f1f5f9";
const MUTED = "#94a3b8";

// Status badge
function Badge({ status }) {
  const colors = {
    true: { bg: "#14532d", text: "#86efac", label: "Published" },
    false: { bg: "#1c1917", text: "#a8a29e", label: "Draft" },
  };
  const c = colors[String(status)] || colors["false"];
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, letterSpacing: 0.5 }}>
      {c.label}
    </span>
  );
}

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [template, setTemplate] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedOrientation, setEditedOrientation] = useState("LANDSCAPE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [testValues, setTestValues] = useState({
    recipientName: "Jane Doe",
    issuedAt: new Date().toLocaleDateString(),
    verificationUrl: "https://example.com/verify/CERT-XXXX",
  });

  const fetchTemplate = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await getTemplate(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) {
        setTemplate(res);
        setEditedName(res.name);
        setEditedDescription(res.description || "");
        setEditedOrientation(res.orientation || "LANDSCAPE");
        setEditedData(res.editorData || null);

        // Seed testValues from schema
        const schema = res.schemaDefinition || [];
        setTestValues((prev) => {
          const next = { ...prev };
          schema.forEach((f) => {
            if (f.key && next[f.key] === undefined) next[f.key] = `[${f.label || f.key}]`;
          });
          return next;
        });
      } else {
        setError(res.message || "Template not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplate(); }, [selectedOrg?.id, selectedWorkspace?.id, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Process and upload any local files attached to elements
      let finalEditorData = editedData;
      if (editedData && editedData.elements) {
        const uploadPromises = editedData.elements.map(async (el) => {
          if (el._file) {
            const res = await uploadImage(el._file, selectedWorkspace.id);
            const url = res.secure_url || res.url;
            if (!url) throw new Error(`Upload failed for ${el.type} file.`);
            const { _file, ...rest } = el;
            return {
              ...rest,
              properties: { ...rest.properties, src: url },
            };
          }
          return el;
        });
        const updatedElements = await Promise.all(uploadPromises);
        finalEditorData = { ...editedData, elements: updatedElements };
      }

      // 2. Submit template update to backend
      const res = await updateTemplate(selectedOrg.id, selectedWorkspace.id, id, {
        name: editedName,
        description: editedDescription,
        orientation: editedOrientation,
        editorData: finalEditorData,
      });
      if (res.id) {
        try {
          await publishTemplate(selectedOrg.id, selectedWorkspace.id, res.id);
        } catch (publishErr) {
          console.error("Auto-publish failed", publishErr);
        }
        await fetchTemplate();
        setEditing(false);
      } else {
        setError(res.message || "Update failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      navigate("/templates");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, color: MUTED, textAlign: "center" }}>Loading…</div>;
  if (error) return <div style={{ padding: 40, color: "#f87171" }}>Error: {error}</div>;
  if (!template) return <div style={{ padding: 40, color: MUTED }}>Template not found</div>;

  const schema = template.schemaDefinition || [];

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: BG, color: TEXT }}>
        {/* Edit top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>←</button>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>EDITING TEMPLATE</div>
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: `1px solid ${BORDER}`, color: TEXT, fontSize: 18, fontWeight: 700, outline: "none", width: 320, padding: "2px 0" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", background: "#0f172a", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
              {["LANDSCAPE", "PORTRAIT"].map((o) => (
                <button
                  key={o}
                  onClick={() => setEditedOrientation(o)}
                  style={{
                    background: editedOrientation === o ? ACCENT : "transparent",
                    border: "none",
                    color: editedOrientation === o ? "#fff" : MUTED,
                    fontSize: 12,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >{o[0] + o.slice(1).toLowerCase()}</button>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: saving ? "#1e3a5f" : ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 20px", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {error && <div style={{ background: "#450a0a", color: "#fca5a5", padding: "10px 24px", fontSize: 13 }}>⚠ {error}</div>}

        {/* Sidebar + Canvas */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 260, background: SURFACE, borderRight: `1px solid ${BORDER}`, overflowY: "auto", flexShrink: 0, padding: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              style={textareaStyle}
            />

            <div style={{ marginTop: 16 }}>
              <span style={sectionLabel}>Preview Values</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {[
                  { key: "recipientName", label: "Recipient Name" },
                  { key: "issuedAt", label: "Issued At" },
                  { key: "verificationUrl", label: "Verification URL" },
                  ...schema.filter(f => f.key),
                ].map(({ key, label }) => (
                  <label key={key} style={{ fontSize: 11, color: MUTED }}>
                    <span style={{ color: ACCENT }}>{`{{${key}}}`}</span>
                    <input
                      value={testValues[key] || ""}
                      onChange={(e) => setTestValues(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ ...fieldInput, marginTop: 3 }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas editor */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            {editedData ? (
              <CanvasEditor
                key={editedOrientation}
                initialData={editedData}
                orientation={editedOrientation}
                variables={testValues}
                onChange={setEditedData}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED }}>
                No canvas data. Start adding elements from the toolbar.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Read-only view ────────────────────────────────────────────
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/templates")} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22 }}>←</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{template.name}</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
              <Badge status={template.isPublished} />
              <span style={{ fontSize: 12, color: MUTED }}>v{template.templateVersion}</span>
              <span style={{ fontSize: 12, color: MUTED }}>·</span>
              <span style={{ fontSize: 12, color: MUTED }}>{template.orientation}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setEditing(true)}
            style={{ background: ACCENT, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 20px", cursor: "pointer" }}
          >Edit Template</button>
          <button
            onClick={handleDelete}
            style={{ background: "#450a0a", border: "none", borderRadius: 8, color: "#f87171", fontSize: 13, fontWeight: 700, padding: "8px 16px", cursor: "pointer" }}
          >Delete</button>
        </div>
      </div>

      <div style={{ padding: "32px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 32, maxWidth: 1400, margin: "0 auto" }}>

        {/* Left info column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Metadata card */}
          <InfoCard title="Template Info">
            <InfoRow label="ID" value={<code style={{ fontSize: 11, color: MUTED }}>{template.id}</code>} />
            <InfoRow label="Description" value={template.description || "—"} />
            <InfoRow label="Version" value={`v${template.templateVersion}`} />
            <InfoRow label="Orientation" value={template.orientation} />
            <InfoRow label="Published" value={template.isPublished ? `Yes — ${new Date(template.publishedAt).toLocaleDateString()}` : "No"} />
            <InfoRow label="Created" value={new Date(template.createdAt).toLocaleString()} />
            <InfoRow label="Updated" value={new Date(template.updatedAt).toLocaleString()} />
          </InfoCard>

          {/* Schema definition card */}
          {schema.length > 0 && (
            <InfoCard title="Schema Fields">
              {schema.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < schema.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <code style={{ color: ACCENT, fontSize: 12 }}>{`{{${f.key}}}`}</code>
                  <span style={{ color: MUTED, fontSize: 12 }}>{f.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", background: "#1e293b", padding: "1px 6px", borderRadius: 4 }}>{f.type}</span>
                  {f.required && <span style={{ fontSize: 11, color: "#f59e0b" }}>req</span>}
                </div>
              ))}
            </InfoCard>
          )}

          {/* Preview values */}
          <InfoCard title="Preview Variable Values">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { key: "recipientName" },
                { key: "issuedAt" },
                { key: "verificationUrl" },
                ...schema.filter(f => f.key),
              ].map(({ key }) => (
                <label key={key} style={{ fontSize: 11, color: MUTED }}>
                  <span style={{ color: ACCENT }}>{`{{${key}}}`}</span>
                  <input
                    value={testValues[key] || ""}
                    onChange={(e) => setTestValues(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ ...fieldInput, marginTop: 3, display: "block" }}
                  />
                </label>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Right: Canvas preview */}
        <div>
          <h3 style={{ margin: "0 0 16px", color: MUTED, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Canvas Preview</h3>
          <div style={{ borderRadius: 12, overflow: "auto", border: `1px solid ${BORDER}`, maxHeight: 800, width: "100%", maxWidth: "100%" }}>
            {template.editorData ? (
              <CanvasEditor
                key={`${id}-${template.orientation}`}
                initialData={template.editorData}
                orientation={template.orientation}
                variables={testValues}
                onChange={() => {}} // read-only — suppress saves
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED, background: SURFACE }}>
                No canvas data for this template.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── micro-components ───────────────────────────────────────
function InfoCard({ title, children }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 12, color: MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: `1px solid #1e293b`, fontSize: 13 }}>
      <span style={{ color: MUTED, flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ color: TEXT, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: MUTED, display: "block", marginBottom: 6, fontWeight: 600 };
const sectionLabel = { fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 };
const textareaStyle = { width: "100%", background: "#0f172a", border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 13, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" };
const fieldInput = { width: "100%", background: "#1e293b", border: `1px solid ${BORDER}`, borderRadius: 5, color: TEXT, fontSize: 12, padding: "5px 8px", boxSizing: "border-box" };
