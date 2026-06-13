import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createTemplate, publishTemplate } from "../services/templateServices";
import { uploadImage } from "../services/uploadServices";
import CanvasEditor from "../components/editor/CanvasEditor";
import { createDefaultEditorData } from "../utils/editorDataRenderer";

const ACCENT = "#3b82f6";
const BG = "#0f172a";
const SURFACE = "#1e293b";
const BORDER = "#334155";
const TEXT = "#f1f5f9";
const MUTED = "#94a3b8";

export default function TemplateCreate() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orientation, setOrientation] = useState("LANDSCAPE");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [schemaFields, setSchemaFields] = useState([
    { key: "courseTitle", label: "Course Title", type: "text", required: true },
  ]);
  const [editorData, setEditorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preview test values
  const [testValues, setTestValues] = useState({
    recipientName: "Jane Doe",
    issuedAt: new Date().toLocaleDateString(),
    courseTitle: "Advanced Full-Stack Development",
    verificationUrl: "https://example.com/verify/CERT-XXXX",
  });

  // Initialise editorData when orientation changes
  useEffect(() => {
    setEditorData(createDefaultEditorData(orientation));
  }, [orientation]);

  // Handle image upload for template thumbnail
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const res = await uploadImage(file, selectedWorkspace?.id);
      // Assuming response contains image URL in `secure_url` or `url`
      const url = res.secure_url || res.url;
      setThumbnailUrl(url);
    } catch (err) {
      console.error('Thumbnail upload failed', err);
      setError(err.message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  // Keep testValues up to date with schemaFields
  useEffect(() => {
    setTestValues((prev) => {
      const next = { ...prev };
      schemaFields.forEach((f) => {
        if (f.key && next[f.key] === undefined) {
          next[f.key] = `[${f.label || f.key}]`;
        }
      });
      return next;
    });
  }, [schemaFields]);

  const addSchemaField = () =>
    setSchemaFields([...schemaFields, { key: "", label: "", type: "text", required: false }]);

  const updateSchemaField = (i, field, value) => {
    const updated = [...schemaFields];
    updated[i][field] = value;
    setSchemaFields(updated);
  };

  const removeSchemaField = (i) =>
    setSchemaFields(schemaFields.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Process and upload any local files attached to elements
      let finalEditorData = editorData;
      if (editorData && editorData.elements) {
        const uploadPromises = editorData.elements.map(async (el) => {
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
        finalEditorData = { ...editorData, elements: updatedElements };
      }

      // 2. Submit template data to backend
      const data = {
        name,
        description,
        orientation,
        editorData: finalEditorData,
        schemaDefinition: schemaFields.filter((f) => f.key),
        thumbnailUrl: thumbnailUrl || null,
      };
      const res = await createTemplate(selectedOrg.id, selectedWorkspace.id, data);
      if (res.id) {
        try {
          await publishTemplate(selectedOrg.id, selectedWorkspace.id, res.id);
        } catch (publishErr) {
          console.error("Auto-publish failed", publishErr);
        }
        navigate(`/templates/${res.id}`);
      } else {
        setError(res.message || JSON.stringify(res) || "Failed to create template");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div style={{ padding: 40, color: MUTED, textAlign: "center" }}>
        Please select an organization and workspace first.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/templates")}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, lineHeight: 1 }}
          >←</button>
          <div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>NEW TEMPLATE</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name…"
              required
              style={{ background: "transparent", border: "none", borderBottom: `1px solid ${BORDER}`, color: TEXT, fontSize: 18, fontWeight: 700, outline: "none", width: 320, padding: "2px 0" }}
            />
            {/* Thumbnail Upload */}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ color: MUTED, fontSize: 12 }}>Thumbnail:</label>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={thumbnailUploading} />
              {thumbnailUploading && <span style={{ color: MUTED, fontSize: 12 }}>Uploading...</span>}
              {thumbnailUrl && <span style={{ color: ACCENT, fontSize: 12 }}>Uploaded</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Orientation */}
          <div style={{ display: "flex", background: "#0f172a", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            {["LANDSCAPE", "PORTRAIT"].map((o) => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                style={{
                  background: orientation === o ? ACCENT : "transparent",
                  border: "none",
                  color: orientation === o ? "#fff" : MUTED,
                  fontSize: 12,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >{o[0] + o.slice(1).toLowerCase()}</button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name || !editorData}
            style={{
              background: loading ? "#1e3a5f" : ACCENT,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 20px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#450a0a", color: "#fca5a5", padding: "10px 24px", fontSize: 13, borderBottom: `1px solid #7f1d1d` }}>
          ⚠ {error}
        </div>
      )}

      {/* Main layout: left sidebar + canvas + right panel */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Left sidebar — Schema & settings */}
        <div style={{ width: 200, background: SURFACE, borderRight: `1px solid ${BORDER}`, overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          
          {/* Description */}
          <div style={{ padding: "16px 16px 0" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Template description…"
              style={textareaStyle}
            />
          </div>

          {/* Schema fields */}
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Schema Fields</span>
              <button onClick={addSchemaField} style={iconBtn}>+ Add</button>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 12px" }}>
              Define variables to inject into text elements like <code style={{ color: ACCENT }}>{"{{key}}"}</code>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {schemaFields.map((field, i) => (
                <div key={i} style={{ background: "#0f172a", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Field {i + 1}</span>
                    <button onClick={() => removeSchemaField(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                  <input
                    placeholder="Variable key (e.g. courseTitle)"
                    value={field.key}
                    onChange={(e) => updateSchemaField(i, "key", e.target.value)}
                    style={{ ...fieldInput, marginBottom: 5 }}
                    required
                  />
                  <input
                    placeholder="Label (e.g. Course Title)"
                    value={field.label}
                    onChange={(e) => updateSchemaField(i, "label", e.target.value)}
                    style={{ ...fieldInput, marginBottom: 5 }}
                  />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={field.type}
                      onChange={(e) => updateSchemaField(i, "type", e.target.value)}
                      style={{ ...fieldInput, flex: 1 }}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateSchemaField(i, "required", e.target.checked)}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview test values */}
          <div style={{ padding: "0 16px 16px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Preview Values</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {[
                { key: "recipientName", label: "Recipient Name" },
                { key: "issuedAt", label: "Issued At" },
                { key: "verificationUrl", label: "Verification URL" },
                ...schemaFields.filter(f => f.key),
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
          {editorData ? (
            <CanvasEditor
              initialData={editorData}
              orientation={orientation}
              variables={testValues}
              onChange={setEditorData}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: MUTED }}>
              Initializing canvas…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── shared micro-styles ────────────────────────────────────
const labelStyle = { fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6, fontWeight: 600 };
const textareaStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 13, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" };
const iconBtn = { background: "#3b82f6", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer" };
const fieldInput = { width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 5, color: "#f1f5f9", fontSize: 12, padding: "5px 8px", boxSizing: "border-box" };
