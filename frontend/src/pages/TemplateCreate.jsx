import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createTemplate, publishTemplate } from "../services/templateServices";
import { uploadImage } from "../services/uploadServices";
import CanvasEditor from "../components/editor/CanvasEditor";
import { createDefaultEditorData } from "../utils/editorDataRenderer";
import { ArrowLeft, Plus, X } from "lucide-react";

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
      <div className="page-container" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        Please select an organization and workspace first.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", flexShrink: 0, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => navigate("/templates")}
            className="btn-icon"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px", fontWeight: 600, letterSpacing: "0.5px" }}>NEW TEMPLATE</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name…"
              required
              style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: "16px", fontWeight: 600, outline: "none", width: "320px", padding: "4px 0" }}
            />
            {/* Thumbnail Upload */}
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Thumbnail:</label>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={thumbnailUploading} style={{ fontSize: "12px" }} />
              {thumbnailUploading && <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Uploading...</span>}
              {thumbnailUrl && <span style={{ color: "var(--success)", fontSize: "12px" }}>Uploaded</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Orientation */}
          <div style={{ display: "flex", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px" }}>
            {["LANDSCAPE", "PORTRAIT"].map((o) => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                style={{
                  backgroundColor: orientation === o ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  color: orientation === o ? "var(--text-primary)" : "var(--text-secondary)",
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
            onClick={handleSubmit}
            disabled={loading || !name || !editorData}
            className="btn btn-primary"
          >
            {loading ? "Saving…" : "Save Template"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: "13px", fontWeight: 500 }}>
          ⚠ {error}
        </div>
      )}

      {/* Main layout: left sidebar + canvas + right panel */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Left sidebar — Schema & settings */}
        <div style={{ width: "320px", backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border-color)", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          
          {/* Description */}
          <div style={{ padding: "20px 20px 0" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "8px", fontWeight: 500 }}>Description</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Template description…"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* Schema fields */}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Schema Fields</span>
              <button onClick={addSchemaField} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}>
                <Plus size={12} /> Add
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "0 0 16px" }}>
              Define variables to inject into text elements like <code style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)" }}>{"{{key}}"}</code>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {schemaFields.map((field, i) => (
                <div key={i} className="card" style={{ padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Field {i + 1}</span>
                    <button onClick={() => removeSchemaField(i)} className="btn-icon" style={{ color: "var(--danger)", padding: 2 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="Variable key (e.g. courseTitle)"
                    value={field.key}
                    onChange={(e) => updateSchemaField(i, "key", e.target.value)}
                    style={{ marginBottom: "8px" }}
                    required
                  />
                  <input
                    className="input"
                    placeholder="Label (e.g. Course Title)"
                    value={field.label}
                    onChange={(e) => updateSchemaField(i, "label", e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select
                      className="input"
                      value={field.type}
                      onChange={(e) => updateSchemaField(i, "type", e.target.value)}
                      style={{ flex: 1, padding: "6px 8px" }}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateSchemaField(i, "required", e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview test values */}
          <div style={{ padding: "0 20px 20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Preview Values</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              {[
                { key: "recipientName", label: "Recipient Name" },
                { key: "issuedAt", label: "Issued At" },
                { key: "verificationUrl", label: "Verification URL" },
                ...schemaFields.filter(f => f.key),
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
          {editorData ? (
            <CanvasEditor
              initialData={editorData}
              orientation={orientation}
              variables={testValues}
              onChange={setEditorData}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
              Initializing canvas…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
