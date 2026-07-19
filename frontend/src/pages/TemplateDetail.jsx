import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getTemplate, updateTemplate, deleteTemplate, publishTemplate } from "../services/templateServices";
import { uploadImage } from "../services/uploadServices";
import CanvasEditor from "../components/editor/CanvasEditor";
import { ArrowLeft, Edit2, Trash2, Check, Copy } from "lucide-react";

function Badge({ status }) {
  if (status) {
    return <span style={{ padding: "2px 8px", backgroundColor: "var(--success-light)", color: "var(--success)", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>Published</span>;
  }
  return <span style={{ padding: "2px 8px", backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>Draft</span>;
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
  const stageRef = useRef(null);
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

      let thumbUrl = template.thumbnailUrl || null;
      if (stageRef.current) {
        try {
          const transformers = stageRef.current.find("Transformer") || [];
          transformers.forEach((t) => t.hide());
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.5 });
          transformers.forEach((t) => t.show());

          const blob = await fetch(dataUrl).then((r) => r.blob());
          const file = new File([blob], "thumbnail.png", { type: "image/png" });
          const uploadRes = await uploadImage(file, selectedWorkspace.id);
          thumbUrl = uploadRes.secure_url || uploadRes.url || thumbUrl;
        } catch (thumbErr) {
          console.warn("Could not generate thumbnail:", thumbErr);
        }
      }

      // 2. Submit template update to backend
      const res = await updateTemplate(selectedOrg.id, selectedWorkspace.id, id, {
        name: editedName,
        description: editedDescription,
        orientation: editedOrientation,
        editorData: finalEditorData,
        thumbnailUrl: thumbUrl,
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
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      navigate("/templates");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOrientationChange = (o) => {
    if (o === editedOrientation) return;
    const oldW = editedOrientation === "LANDSCAPE" ? 1200 : 900;
    const oldH = editedOrientation === "LANDSCAPE" ? 900 : 1200;
    const newW = o === "LANDSCAPE" ? 1200 : 900;
    const newH = o === "LANDSCAPE" ? 900 : 1200;

    setEditedOrientation(o);
    setEditedData(prev => {
      if (!prev || !prev.elements) return prev;
      const xScale = newW / oldW;
      const yScale = newH / oldH;
      const updatedElements = prev.elements.map(el => {
        if (el.type === "shape" && el.x <= 60 && el.y <= 60 && el.width >= oldW - 120 && el.height >= oldH - 120) {
          return { ...el, x: 40, y: 40, width: newW - 80, height: newH - 80 };
        }
        return {
          ...el,
          x: Math.round(el.x * xScale),
          y: Math.round(el.y * yScale),
          width: Math.round(el.width * xScale),
          height: el.type === "line" ? el.height : Math.round(el.height * yScale),
        };
      });
      return { ...prev, width: newW, height: newH, elements: updatedElements };
    });
  };

  if (loading) return <div className="page-container" style={{ color: "var(--text-secondary)", textAlign: "center" }}>Loading…</div>;
  if (error) return <div className="page-container" style={{ color: "var(--danger)", textAlign: "center" }}>Error: {error}</div>;
  if (!template) return <div className="page-container" style={{ color: "var(--text-secondary)", textAlign: "center" }}>Template not found</div>;

  const schema = template.schemaDefinition || [];

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        {/* Edit top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", flexShrink: 0, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setEditing(false)} className="btn-icon">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px", fontWeight: 600, letterSpacing: "0.5px" }}>EDITING TEMPLATE</div>
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "16px", fontWeight: 600, outline: "none", width: "320px", padding: "4px 0" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px" }}>
              {["LANDSCAPE", "PORTRAIT"].map((o) => (
                <button
                  key={o}
                  onClick={() => handleOrientationChange(o)}
                  style={{
                    backgroundColor: editedOrientation === o ? "var(--bg-hover)" : "transparent",
                    border: "none",
                    color: editedOrientation === o ? "var(--text-primary)" : "var(--text-secondary)",
                    borderRadius: "4px",
                    fontSize: "12px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >{o[0] + o.slice(1).toLowerCase()}</button>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: "13px", fontWeight: 500 }}>⚠ {error}</div>}

        {/* Sidebar + Canvas */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: "280px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", overflowY: "auto", flexShrink: 0, padding: "20px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: 500 }}>Description</label>
            <textarea
              className="input"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />

            <div style={{ marginTop: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preview Values</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                {[
                  { key: "recipientName", label: "Recipient Name" },
                  { key: "issuedAt", label: "Issued At" },
                  { key: "verificationUrl", label: "Verification URL" },
                  ...schema.filter(f => f.key),
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)" }}>{`{{${key}}}`}</span>
                    <input
                      className="input"
                      value={testValues[key] || ""}
                      onChange={(e) => setTestValues(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas editor */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: "var(--bg-primary)" }}>
            {editedData ? (
              <CanvasEditor
                key={editedOrientation}
                stageRef={stageRef}
                initialData={editedData}
                orientation={editedOrientation}
                variables={testValues}
                onChange={setEditedData}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
                No canvas data. Start adding elements from the toolbar.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Read-only view
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/templates")} className="btn-icon">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{template.name}</h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
              <Badge status={template.isPublished} />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>v{template.templateVersion}</span>
              <span style={{ fontSize: "13px", color: "var(--border-color)" }}>|</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{template.orientation}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setEditing(true)} className="btn btn-secondary">
            <Edit2 size={16} /> Edit Template
          </button>
          <button onClick={handleDelete} className="btn btn-secondary" style={{ color: "var(--danger)", borderColor: "var(--danger-light)" }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>

        {/* Left info column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Metadata card */}
          <InfoCard title="Template Info">
            <InfoRow label="ID" value={<code style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{template.id}</code>} />
            <InfoRow label="Description" value={template.description || "—"} />
            <InfoRow label="Version" value={`v${template.templateVersion}`} />
            <InfoRow label="Orientation" value={template.orientation} />
            <InfoRow label="Published" value={template.isPublished ? `Yes (${new Date(template.publishedAt).toLocaleDateString()})` : "No"} />
            <InfoRow label="Created" value={new Date(template.createdAt).toLocaleDateString()} />
          </InfoCard>

          {/* Schema definition card */}
          {schema.length > 0 && (
            <InfoCard title="Schema Fields">
              {schema.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < schema.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <code style={{ color: "var(--brand-primary)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>{`{{${f.key}}}`}</code>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>{f.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text-secondary)", backgroundColor: "var(--bg-hover)", padding: "2px 8px", borderRadius: "12px" }}>{f.type}</span>
                  {f.required && <span style={{ fontSize: "11px", color: "var(--warning)" }}>Req</span>}
                </div>
              ))}
            </InfoCard>
          )}

          {/* Preview values */}
          <InfoCard title="Preview Variable Values">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "recipientName" },
                { key: "issuedAt" },
                { key: "verificationUrl" },
                ...schema.filter(f => f.key),
              ].map(({ key }) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)" }}>{`{{${key}}}`}</span>
                  <input
                    className="input"
                    value={testValues[key] || ""}
                    onChange={(e) => setTestValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Right: Canvas preview */}
        <div>
          <h3 style={{ margin: "0 0 16px", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>Canvas Preview</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ maxHeight: "800px", width: "100%", overflow: "auto", backgroundColor: "var(--bg-secondary)" }}>
              {template.editorData ? (
                <CanvasEditor
                  key={`${id}-${template.orientation}`}
                  initialData={template.editorData}
                  orientation={template.orientation}
                  variables={testValues}
                  onChange={() => {}} // read-only
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "var(--text-secondary)" }}>
                  No canvas data for this template.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border-color)", fontSize: "13px" }}>
      <span style={{ color: "var(--text-secondary)", flexShrink: 0, marginRight: "12px", fontWeight: 500 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
    </div>
  );
}
